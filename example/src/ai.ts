import { generateObject, generateText, streamText } from "ai";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const MODELS = z.enum([
  "anthropic/claude-opus-4.1",
  "anthropic/claude-opus-4",
  "anthropic/claude-sonnet-4",
  "anthropic/claude-3.7-sonnet",
  "openai/gpt-5",
  "google/gemini-2.5-pro",
  "google/gemini-2.0-flash",
  "google/gemini-2.5-flash",
  "openai/gpt-4.1-nano",
]);

type Model = z.infer<typeof MODELS>;

export async function getTextCompletion(prompt: string, model: Model) {
  const response = await generateText({
    prompt,
    model,
  });
  return response.text;
}

export async function getTextStream(prompt: string, model: Model) {
  return streamText({
    prompt,
    model,
  }).textStream;
}

export async function getStructuredCompletion<T extends z.ZodType>(
  prompt: string,
  schema: T,
  model: Model
): Promise<z.infer<T>> {
  const response = await generateObject({
    prompt,
    model,
    schema,
  });
  return response.object as z.infer<T>;
}
