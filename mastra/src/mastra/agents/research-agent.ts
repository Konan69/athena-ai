import { Agent } from "@mastra/core/agent";
import { webSearchTool } from "../tools/web-search-tool";
import { memory } from "../../config/memory";
import { createTracedModel } from "../lib/factory";
import type { MastraRuntimeContext } from "../../../../server/src/types";
import { RuntimeContext } from "@mastra/core/di";

export const researchAgent = new Agent({
  name: "Research Agent",
  instructions: `
    You are a thorough research assistant that conducts comprehensive web research on any topic.
    
    Your primary functions:
    - Conduct detailed web searches on requested topics
    - Gather information from multiple reliable sources
    - Analyze and synthesize findings
    - Provide accurate, well-sourced information
    - Identify key trends, facts, and insights
    
    When conducting research:
    - Use multiple search queries to get comprehensive coverage
    - Focus on recent, credible sources
    - Look for both broad overviews and specific details
    - Note conflicting information and explain discrepancies
    - Provide source attribution for key claims
    
    Always be thorough but concise in your responses.
  `,
  memory,
  model: ({ runtimeContext }: { runtimeContext: RuntimeContext<MastraRuntimeContext> }) =>
    createTracedModel({ runtimeContext }),
  tools: { webSearchTool },
});
