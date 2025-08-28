import { pgTable, text, serial, vector, jsonb, index, unique } from "drizzle-orm/pg-core";

export const embeddings = pgTable("embeddings", {
	id: serial().primaryKey().notNull(),
	vectorId: text("vector_id").notNull(),
	embedding: vector({ dimensions: 1536 }),
	metadata: jsonb().default({}),
}, (table) => [
	index("embeddings_vector_idx").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({ lists: "100" }),
	unique("embeddings_vector_id_key").on(table.vectorId),
]);