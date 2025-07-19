import { MCPClient } from "@mastra/mcp";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { Mastra } from "@mastra/core/mastra";
import { PgVector, PostgresStore } from "@mastra/pg";
import { researchAgent } from "./agents/research-agent";
import { summarizerAgent } from "./agents/summarizer-agent";
import { researchWorkflow } from "./workflows/research-workflow";
import { env } from "../../config/env";

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
    researchAgent,
    summarizerAgent,
  },
  storage: new PostgresStore({
    connectionString: env.DATABASE_URL,
  }),

  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
