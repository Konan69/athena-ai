import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./user";
import { nanoid } from "nanoid";
import { pgEnum } from "drizzle-orm/pg-core";
import { InferSelectModel, relations, sql } from "drizzle-orm";

export const libraryItemStatus = pgEnum("status", [
  "processing",
  "ready",
  "failed",
  "pending",
]);

export const library = pgTable(
  "library",
  {
    id: text().primaryKey().notNull().$defaultFn(() => nanoid()),
    userId: text().notNull().references(() => user.id),
    createdAt: timestamp({ mode: "string" }).defaultNow(),
    updatedAt: timestamp({ mode: "string" }),
  },
  (table) => [
    unique().on(table.userId),
  ]
);

export const libraryItem = pgTable("library_item", {
  id: text().primaryKey().notNull().$defaultFn(() => nanoid()),
  title: text().notNull(),
  description: text().notNull(),
  uploadLink: text().notNull(),
  fileSize: integer().notNull(),
  status: libraryItemStatus("processing").notNull(),
  createdAt: timestamp({ mode: "string" }).defaultNow(),
  updatedAt: timestamp({ mode: "string" }),
  tags: text().array().notNull()
    .default(sql`'{}'::text[]`),
  libraryId: text()
    .notNull()
    .references(() => library.id, { onDelete: "cascade" }),
});

export const libraryRelations = relations(library, ({ one, many }) => ({
  user: one(user, {
    fields: [library.userId],
    references: [user.id],
  }),
  items: many(libraryItem),
}));

export const libraryItemRelations = relations(libraryItem, ({ one }) => ({
  library: one(library, {
    fields: [libraryItem.libraryId],
    references: [library.id],
  }),
}));


export type LibraryItem = InferSelectModel<typeof libraryItem>;
