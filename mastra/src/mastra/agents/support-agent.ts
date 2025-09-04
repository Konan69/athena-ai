import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { webSearchTool } from "../tools/web-search-tool";
import { vectorQueryTool } from "../tools/rag-tools"
import { memory } from "../../config/memory";
import { createSupportAgentPrompt } from "../prompts/support-agent";
import type { Agent as AgentConfig } from "@athena-ai/server/types/agents";

export const supportAgent = new Agent({
  name: "Support Agent",
  instructions: ({ runtimeContext }) => {
    const agent = runtimeContext.get("agent") as AgentConfig;
    if (!agent) {
      return "You are a helpful customer support assistant.";
    }
    return createSupportAgentPrompt(agent);
  },
  model: openai("gpt-4o"),
  tools: { vectorQueryTool },
  memory,
});