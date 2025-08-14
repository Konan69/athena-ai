import { createEnv } from "@t3-oss/env-core";
import { env as bunEnv } from "bun";
import { z } from "zod";

/**
 * Get environment variables based on runtime
 * Uses Bun.env if available, falls back to process.env
 */
function getRuntimeEnv() {
  // Check if we're in Bun runtime
  if (typeof Bun !== "undefined") {
    // Dynamic import to avoid bundler issues
    return (globalThis as any).Bun?.env || process.env;
  }
  return process.env;
}

/**
 * Environment variable schema and loader
 *
 * This exports a validated `env` object containing all required environment variables
 * for the server, with types and validation.
 *
 * The environment is loaded from Bun's runtime environment (`bun.env`)
 * // can be replaced with process.env if running in node.
 * Empty strings are treated as undefined.
 */
export const env = createEnv({
  server: {
    PORT: z.string().default("8080"),
    MASTRA_PORT: z.string().default("4000"),
    DATABASE_URL: z.string().url(),
    CLIENT_URL: z.string().url(),
    OPENAI_API_KEY: z.string().min(1),
    NODE_ENV: z.enum(["development", "production"]),
    EXA_API_KEY: z.string().min(1).optional(),
    BRAVE_API_KEY: z.string().min(1).optional(),
    BETTER_AUTH_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    CLOUDFLARE_ACCT_ID: z.string().min(1),
    CLOUDFLARE_API_KEY: z.string().min(1),
    CLOUDFLARE_SECRET_KEY: z.string().min(1),
    S3_API_URL: z.string().url(),
    S3_BUCKET_NAME: z.string().min(1),
    WEB_SEARCH_PROVIDER: z
      .enum(["exa", "brave"])
      .describe("The web search provider to use"),
    REDIS_URL: z.string().min(1),
  },
  runtimeEnv: getRuntimeEnv(),
  emptyStringAsUndefined: true,
});
