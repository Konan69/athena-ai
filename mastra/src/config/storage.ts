import { PostgresStore } from "@mastra/pg";
import { PgVector } from "@mastra/pg";
import { env } from "./env";

export const sharedPgStore = new PostgresStore({
	connectionString: env.DATABASE_URL,
});

export const vectorStore = new PgVector({
	connectionString: env.DATABASE_URL,
});
