import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { memory } from "../../config/memory";
import { vectorQueryTool } from "../tools/rag-tools";
import { ragPrompt } from "../lib/factory";

export const ragAgent = new Agent({
  name: "RAG Agent",
  instructions: ragPrompt,
  memory,
  model: openai("gpt-4o"),
  tools: ({ runtimeContext }) => {
    console.log("runtimeContext", runtimeContext);
    return { vectorQueryTool };
  },
});
