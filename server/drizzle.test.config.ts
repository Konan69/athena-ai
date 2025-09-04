import { defineConfig } from "drizzle-kit";


export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schemas/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.TEST_LOCAL_DB_URL!,
  },
  verbose: true,
  schemaFilter: ["public"],
  tablesFilter: [
  ],

});