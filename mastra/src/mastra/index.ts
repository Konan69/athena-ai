import { MCPClient } from "@mastra/mcp";
import { PinoLogger } from "@mastra/loggers";
import { Mastra } from "@mastra/core/mastra";
import { researchAgent } from "./agents/research-agent";
import { athenaAI } from "./agents/athena";
import { researchWorkflow } from "./workflows/research-workflow";
import { env } from "../config/env";
import { sharedPgStore } from "../config/storage";

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
  storage: sharedPgStore,
  logger: new PinoLogger({
    name: "Mastra",
    // level: env.NODE_ENV === "development" ? "info" : "info",
  }),
  // Configure server settings for production
  server: {
    port: parseInt(env.MASTRA_PORT),
    host: "localhost",
  },
});
