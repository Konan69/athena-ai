import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env" });

/**
 * Environment variable schema and loader
 *
 * This exports a validated `env` object containing all required environment variables
 * for the server, with types and validation.
 *
 * Empty strings are treated as undefined.
 */
export const env = createEnv({
	server: {
		MASTRA_PORT: z.string().default("4000"),
		DATABASE_URL: z.string().url(),
		OPENAI_API_KEY: z.string().min(1),
		NODE_ENV: z.enum(["development", "production"]),
		EXA_API_KEY: z.string().min(1).optional(),
		BRAVE_API_KEY: z.string().min(1).optional(),
		WEB_SEARCH_PROVIDER: z
			.enum(["exa", "brave"])
			.describe("The web search provider to use"),
		PROMPTS_PATH: z.string().optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
