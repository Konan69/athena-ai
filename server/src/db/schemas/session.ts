import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm/relations";

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: "string" }).notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text().notNull(),
  },
  (table) => [
    uniqueIndex("session_token_key").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export default session;
