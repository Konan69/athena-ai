import { Agent } from "@mastra/core/agent";
import { RuntimeContext } from "@mastra/core/di";
import { webSearchTool } from "../tools/web-search-tool";
import { memory } from "../../config/memory";
import { athenaPrompt } from "../lib/factory";
import type { MastraRuntimeContext } from "../../../../server/src/types";

import { createTracedModel } from "../lib/factory";





export const athenaAI = new Agent({
  name: "Athena AI",
  instructions: ({ runtimeContext }: { runtimeContext: RuntimeContext<MastraRuntimeContext> }) => {
    console.log("runtimeContext", runtimeContext);
    return athenaPrompt;
  },
  model : ({ runtimeContext }) => 
      createTracedModel({ runtimeContext }),

  tools: { webSearchTool },
  memory,
});
