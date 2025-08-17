import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env";

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schemas/app.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  schemaFilter: ["public"],
  tablesFilter: ["!mastra_*"],
  strict: true,
});
