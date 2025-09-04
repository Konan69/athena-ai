import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env";

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schemas/app.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,

  schemaFilter: ["public"],
  tablesFilter: [
    "!mastra_scorers",
    "!mastra_workflow_snapshot",
    "!mastra_traces",
    "!mastra_messages",
    "!mastra_resources",
    "!mastra_evals",
  ],
  entities: {
    roles: {
      exclude: ["embeddings*"]
    }
  },
  strict: true,
});
