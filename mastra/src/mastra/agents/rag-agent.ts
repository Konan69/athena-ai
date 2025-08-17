import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { vectorQueryTool } from "../tools/rag-tools";
import { ragPrompt } from "../prompts/rag";

export const ragAgent = new Agent({
  name: "RAG Agent",
  instructions: ragPrompt,
  model: openai("gpt-4o"),
  tools: { vectorQueryTool },
});
