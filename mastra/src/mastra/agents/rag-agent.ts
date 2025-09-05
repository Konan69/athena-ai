import { Agent } from "@mastra/core/agent";
import { memory } from "../../config/memory";
import { vectorQueryTool } from "../tools/rag-tools";
import { ragPrompt, createTracedModel } from "../lib/factory";

export const ragAgent = new Agent({
  name: "RAG Agent",
  instructions: ragPrompt,
  memory,
  model: ({ runtimeContext }) =>
    createTracedModel({ runtimeContext }),
  tools: ({ runtimeContext }) => {
    console.log("runtimeContext", runtimeContext);
    return { vectorQueryTool };
  },
});
