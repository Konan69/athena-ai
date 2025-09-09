import { Agent } from "@mastra/core/agent";
import { vectorQueryTool } from "../tools/rag-tools"
import { memory } from "../../config/memory";
import { createSupportAgentPrompt } from "../prompts/support-agent";
import { createTracedModel } from "../lib/factory";
import type { Agent as AgentConfig } from "@athena-ai/server/types/agents";

export const supportAgent = new Agent({
  name: "Support Agent",
  instructions: ({ runtimeContext }) => {
    const agent = (runtimeContext as any).agent as AgentConfig;
    if (!agent) {
      return "You are a helpful customer support assistant.";
    }
    return createSupportAgentPrompt(agent);
  },
  model: ({ runtimeContext }: { runtimeContext: any }) =>
    createTracedModel({ runtimeContext }),
  tools: { vectorQueryTool },
  memory,
});