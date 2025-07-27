import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const verification = pgTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
  createdAt: timestamp({ precision: 3, mode: "string" }),
  updatedAt: timestamp({ precision: 3, mode: "string" }),
});

export default verification;
