import prompts from "../prompts";
import { withTracing } from "@posthog/ai";
import { createOpenAI } from "@ai-sdk/openai";
import { posthog } from "../../config/tracing";
import { env } from "../../config/env";
import type { MastraRuntimeContext } from "../../../../server/src/types";
import type { RuntimeContext } from "@mastra/core/di";


function promptFactory(promptName: "rag" | "athena" | "base"): string {
	const base = prompts.basePrompt;
	let result: string;

	switch (promptName) {
		case "base":
			result = base;
			break;
		case "rag":
			result = prompts.ragPrompt
				.replace("{{base}}", base)
				.replace("{{current_date}}", new Date().toLocaleDateString());
			break;
		case "athena":
			result = prompts.athenaPrompt
				.replace("{{base}}", base)
				.replace("{{current_date}}", new Date().toLocaleDateString());
			break;
	}

	return result;
}

export function getPrompt(agent: "rag" | "athena" | "base"): string {
	return promptFactory(agent);
}

export const ragPrompt = getPrompt("rag");
export const athenaPrompt = getPrompt("athena");
export const basePrompt = getPrompt("base");


const openaiClient = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export function createTracedModel({ runtimeContext }: { runtimeContext: RuntimeContext<MastraRuntimeContext> }) {
  return withTracing(openaiClient("gpt-4o"), posthog, {
    posthogDistinctId: runtimeContext.get("userId"),
    posthogTraceId: "trace_123", // TODO: Add trace id
    posthogProperties: { conversationId: runtimeContext.get("threadId") }, // TODO: Add conversation id
    posthogPrivacyMode: false,
    posthogGroups: { company: runtimeContext.get("organizationId") },
  });
}