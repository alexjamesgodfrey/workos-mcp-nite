import { gateway, generateObject, generateText, tool, ToolSet } from "ai";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const tools = {
  searchFlights: tool({
    description: "Search for flights",
    inputSchema: z.object({
      destination: z.string().describe("The destination to search for"),
      date: z.string().describe("The date to search for"),
    }),
    execute: async ({ destination, date }) => {
      return `Found flights to ${destination} on ${date}!`;
    },
  }),
  bookFlight: tool({
    description: "Book a flight",
    inputSchema: z.object({
      flight: z.string().describe("The flight to book"),
    }),
    execute: async ({ flight }) => {
      return `Booked flight ${flight}!`;
    },
  }),
} satisfies ToolSet;

class AIAgent {
  private goal: string;
  private tasks: string[] = [];

  constructor(goal: string) {
    this.goal = goal;
  }

  async run() {
    this.tasks = await this.planTasks();

    while (this.tasks.length > 0) {
      const task = this.tasks.shift()!;
      console.log(`🔄 Executing: ${task}`);

      const result = await generateText({
        model: gateway("stealth/sonoma-dusk-alpha"),
        messages: [{ role: "user", content: `Execute this task: ${task}` }],
        tools,
        toolChoice: "auto",
      });

      await this.reflect(task, result);
    }
  }

  private async planTasks(): Promise<string[]> {
    const response = await generateObject({
      model: gateway("stealth/sonoma-dusk-alpha"),
      prompt: `Break down this goal into specific actionable tasks: ${this.goal}`,
      schema: z.object({
        tasks: z.array(z.string().describe("Specific actionable task")),
      }),
    });
    return response.object.tasks;
  }

  private async reflect(task: string, result: any) {
    const analysis = await generateObject({
      model: gateway("stealth/sonoma-dusk-alpha"),
      prompt: `
        Task completed: ${task}
        Result: ${result.content}
        
        Analyze what happened and determine next steps.
      `,
      schema: z.object({
        success: z.boolean(),
        newTasks: z.array(z.string()),
        shouldContinue: z.boolean(),
      }),
    });
    return analysis.object.newTasks;
  }
}

new AIAgent("Book a flight to Paris for next week").run();
