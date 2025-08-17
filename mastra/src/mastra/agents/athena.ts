import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { webSearchTool } from "../tools/web-search-tool";
import { memory } from "../../config/memory";
import { athenaPrompt } from "../lib/factory";


export const athenaAI = new Agent({
  name: "Athena AI",
  instructions: ({ runtimeContext }) => {
    console.log("runtimeContext", runtimeContext);
    return athenaPrompt;
  },
  model: openai("gpt-4o"),

  tools: { webSearchTool },
  memory,
});
