import {
  pgTable,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { session } from "./session";
import { account } from "./account";
import { verification } from "./verification";
import { relations } from "drizzle-orm";

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean().notNull(),
    image: text(),
    createdAt: timestamp({ precision: 3, mode: "string" }).notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
  },
  (table) => [
    uniqueIndex("user_email_key").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops")
    ),
  ]
);

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  verifications: many(verification),
}));

