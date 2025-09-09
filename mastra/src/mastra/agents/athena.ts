import { Agent } from "@mastra/core/agent";
import { webSearchTool } from "../tools/web-search-tool";
import { memory } from "../../config/memory";
import { athenaPrompt } from "../lib/factory";

import { createTracedModel } from "../lib/factory";
export const athenaAI = new Agent({
  name: "Athena AI",
  instructions: athenaPrompt,
  model: ({ runtimeContext }: { runtimeContext: any }) =>
    createTracedModel({ runtimeContext }),
  tools: { webSearchTool },
  memory,
});
