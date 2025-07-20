import { createEnv } from "@t3-oss/env-core";
// import { env as bunEnv } from "bun";
import { z } from "zod";
import { config } from "dotenv";

config();

export const env = createEnv({
  server: {
    PORT: z.string().default("3000"),
    CLIENT_URL: z.string().url(),
    OPENAI_API_KEY: z.string().min(1),
    NODE_ENV: z.enum(["development", "production"]),
    EXA_API_KEY: z.string().min(1).optional(),
    BRAVE_API_KEY: z.string().min(1).optional(),
    BETTER_AUTH_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    DATABASE_URL: z.string().url(),
    WEB_SEARCH_PROVIDER: z
      .enum(["exa", "brave"])
      .describe("The web search provider to use"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
