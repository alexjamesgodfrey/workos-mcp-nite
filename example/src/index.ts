import { DatabaseService } from "@agentdb/sdk";
import { gateway, generateObject, generateText } from "ai";
import dotenv from "dotenv";
import { z } from "zod";
import { tools } from "./tools";

dotenv.config();

const modelName = "anthropic/claude-3.7-sonnet";

const sessionToken = "bfe80f86-5604-4ede-96f8-1b766e6e0f6c";
// const sessionToken = uuidv4();
console.log("uuid", sessionToken);
const db = new DatabaseService(
  "https://api.agentdb.dev",
  process.env.AGENTDB_KEY!
);
const connection = db.connect(process.env.UUID_TOKEN!, sessionToken, "sqlite");

const TaskSchema = z.object({
  id: z.number(),
  task: z.string(),
  status: z.enum(["pending", "completed"]).default("pending"),
  result: z.string().optional(),
});
type Task = z.infer<typeof TaskSchema>;

// Initialize DB
async function initDB() {
  await connection.execute([
    {
      sql: `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      task TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
      params: [],
    },
  ]);
}

async function planTasks(goal: string) {
  console.log(goal);
  const response = await generateObject({
    model: gateway(modelName),
    prompt: `Break down this goal into specific actionable tasks: ${goal}.`,
    schema: z.object({
      tasks: z.array(TaskSchema),
    }),
  });

  await connection.execute(
    response.object.tasks.map((t) => ({
      sql: "INSERT INTO tasks (task) VALUES (?)",
      params: [t.task],
    }))
  );

  return response.object.tasks;
}

const getPendingTasks = async () => {
  const result = await connection.execute([
    {
      sql: "SELECT * FROM tasks WHERE status = 'pending' ORDER BY id",
      params: [],
    },
  ]);

  return result.results[0]?.rows ?? [];
};

const executeTask = async (task: Task) => {
  const execution = await generateText({
    model: gateway(modelName),
    messages: [{ role: "user", content: `Execute: ${task.task}` }],
    tools,
    toolChoice: "auto",
  });
  await updateTask(task);
  return execution.content;
};

const updateTask = async (task: Task) => {
  await connection.execute([
    {
      sql: "UPDATE tasks SET status = 'completed', result = ? WHERE id = ?",
      params: [task.result, task.id],
    },
  ]);
};

const reevaluateTasks = async () => {
  const response = await generateObject({
    model: gateway(modelName),
    prompt: `Reevaluate the tasks`,
    schema: z.object({
      tasks: z.array(TaskSchema),
    }),
  });
  const tasks = await getPendingTasks();
  return tasks;
};

async function runAgent(goal: string) {
  //   await initDB(); // create ephemeral task db

  //   console.log("Planning tasks...");

  //   await planTasks(goal); // plan tasks + populate db

  let tasks = await getPendingTasks();

  console.log("Total tasks: ", tasks.length);

  while (tasks.length) {
    const currentTask = tasks.shift();
    console.log("Executing task...", currentTask);

    const result = await executeTask(currentTask);

    console.log("Task completed", result);

    tasks = await reevaluateTasks();
  }
}

runAgent("Book a room @ WorkOS HQ for MCP Night ~200 ppl 09/22 5:30-7:30");
