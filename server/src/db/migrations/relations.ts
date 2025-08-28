import { relations } from "drizzle-orm/relations";
import { user, account, session, organization, mastraThreads, library, libraryItem, invitation, member } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	invitations: many(invitation),
	members: many(member),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
	organization: one(organization, {
		fields: [session.activeOrganizationId],
		references: [organization.id]
	}),
}));

export const organizationRelations = relations(organization, ({many}) => ({
	sessions: many(session),
	mastraThreads: many(mastraThreads),
	libraries: many(library),
	invitations: many(invitation),
	members: many(member),
}));

export const mastraThreadsRelations = relations(mastraThreads, ({one}) => ({
	organization: one(organization, {
		fields: [mastraThreads.organizationId],
		references: [organization.id]
	}),
}));

export const libraryRelations = relations(library, ({one, many}) => ({
	organization: one(organization, {
		fields: [library.organizationId],
		references: [organization.id]
	}),
	libraryItems: many(libraryItem),
}));

export const libraryItemRelations = relations(libraryItem, ({one}) => ({
	library: one(library, {
		fields: [libraryItem.libraryId],
		references: [library.id]
	}),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	}),
}));

export const memberRelations = relations(member, ({one}) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	}),
}));