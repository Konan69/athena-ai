import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm";

export const verification = pgTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
  createdAt: timestamp({ precision: 3, mode: "string" }),
  updatedAt: timestamp({ precision: 3, mode: "string" }),
});


export const verificationRelations = relations(verification, ({ one }) => ({
  user: one(user, {
    fields: [verification.identifier],
    references: [user.email],
  }),
}));

