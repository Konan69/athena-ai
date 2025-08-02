import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./user";
import { nanoid } from "nanoid";

export const library = pgTable(
  "library",
  {
    id: text().primaryKey().notNull().default(nanoid()),
    createdAt: timestamp({ mode: "string" }).defaultNow(),
    updatedAt: timestamp({ mode: "string" }),
    userId: text()
      .notNull()
      .references(() => user.id),
  },
  (table) => [unique().on(table.userId)]
);

export const libraryItem = pgTable("library_item", {
  id: text().primaryKey().notNull().default(nanoid()),
  title: text().notNull(),
  description: text().notNull(),
  uploadLink: text().notNull(),
  createdAt: timestamp({ mode: "string" }).defaultNow(),
  updatedAt: timestamp({ mode: "string" }),
  libraryId: text()
    .notNull()
    .references(() => library.id, { onDelete: "cascade" }),
});

export default library;
