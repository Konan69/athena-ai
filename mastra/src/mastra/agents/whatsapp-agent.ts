import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { vectorQueryTool } from "../tools/rag-tools"
import { memory } from "../../config/memory";
import { createWhatsAppAgentPrompt } from "../prompts/whatsapp-agent";
import type { Agent as AgentConfig } from "@athena-ai/server/types/agents";

export const whatsappAgent = new Agent({
  name: "WhatsApp Agent",
  instructions: ({ runtimeContext }) => {
    const agent = runtimeContext.get("agent") as AgentConfig;
    if (!agent) {
      return "You are a helpful WhatsApp assistant.";
    }
    return createWhatsAppAgentPrompt(agent);
  },
  model: openai("gpt-4o"),
  tools: { vectorQueryTool },
  memory
});