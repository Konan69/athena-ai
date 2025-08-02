import { relations } from "drizzle-orm/relations";
import { user } from "./user";
import { session } from "./session";
import { account } from "./account";
import { library } from "./library";
import { libraryItem } from "./library";

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  library: one(library),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

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

export default {
  userRelations,
  accountRelations,
  sessionRelations,
  libraryRelations,
  libraryItemRelations,
};
