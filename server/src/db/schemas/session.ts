import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm/relations";
import { organization } from "./organization";

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: "string" }).notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
    activeOrganizationId: text("active_organization_id")
      .references(() => organization.id, { onDelete: "cascade" }),
    ipAddress: text(),
    userAgent: text(),
    userId: text().notNull(),
  },
  (table) => [
    index("session_userId_idx").on(table.userId),
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

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [session.activeOrganizationId],
    references: [organization.id],
  }),
}));
