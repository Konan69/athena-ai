import { MCPClient } from "@mastra/mcp";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { Mastra } from "@mastra/core/mastra";
import { PgVector, PostgresStore } from "@mastra/pg";
import { researchAgent } from "./agents/research-agent";
import { athenaAI } from "./agents/athena";
import { researchWorkflow } from "./workflows/research-workflow";
import { env } from "../config/env";
import { memory } from "../config/memory";

export const mcp = new MCPClient({
  servers: {
    filesystem: {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/username/Downloads",
      ],
    },
  },
});

export const mastra = new Mastra({
  workflows: {
    researchWorkflow,
  },
  agents: {
    athenaAI,
    researchAgent,
  },
  // storage: new PostgresStore({
  //   connectionString: env.DATABASE_URL,
  // }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),

  // Configure server settings for production
  server: {
    port: parseInt(env.MASTRA_PORT) || 4000,
    host: "localhost",
  },
});
