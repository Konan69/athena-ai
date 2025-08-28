import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { pgEnum } from "drizzle-orm/pg-core";
import { InferSelectModel, relations, sql } from "drizzle-orm";
import { organization } from "./organization";

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
    organizationId: text().notNull().references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp({ mode: "string" }).defaultNow(),
    updatedAt: timestamp({ mode: "string" }),
  },
  (table) => [
    unique().on(table.organizationId)
  ]
);

export const libraryRelations = relations(library, ({ one, many }) => ({
  organization: one(organization, {
    fields: [library.organizationId],
    references: [organization.id],
  }),
  items: many(libraryItem),
}));

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

export const libraryItemRelations = relations(libraryItem, ({ one }) => ({
  library: one(library, {
    fields: [libraryItem.libraryId],
    references: [library.id],
  }),
}));


export type LibraryItem = InferSelectModel<typeof libraryItem>;
