import { Memory } from "@mastra/memory";
import { PgVector } from "@mastra/pg";
import { env } from "./env";
import { openai } from "@ai-sdk/openai";
import { sharedPgStore } from "./storage";

/**
 * Shared Memory instance for AI agents.
 *
 * This memory object is used by AI agents to persist and retrieve conversational context.
 * It uses a Postgres-backed store for storage and is configured to keep the last 12 messages in context.
 * The `threads.generateTitle` option uses the OpenAI "gpt-4o-mini" model to generate concise titles
 * based on the initial user message.
 */
export const memory = new Memory({
	storage: sharedPgStore,
	options: {
		lastMessages: 12,
		threads: {
			generateTitle: {
				model: openai("gpt-4o-mini"),
				instructions:
					"Generate a concise title based on the initial user message.",
			},
		},
	},
});

export const vectorStore = new PgVector({
	connectionString: env.DATABASE_URL,
});

export default {
	memory,
	vectorStore,
};
