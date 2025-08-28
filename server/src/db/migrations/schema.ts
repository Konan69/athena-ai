import { pgTable, text, timestamp, uniqueIndex, boolean, foreignKey, index, unique, integer, serial, vector, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const status = pgEnum("status", ['processing', 'ready', 'failed', 'pending'])


export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }),
	updatedAt: timestamp({ precision: 3, mode: 'string' }),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("user_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
	activeOrganizationId: text("active_organization_id"),
}, (table) => [
	uniqueIndex("session_token_key").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.activeOrganizationId],
			foreignColumns: [organization.id],
			name: "session_active_organization_id_organization_id_fk"
		}).onDelete("cascade"),
]);

export const mastraThreads = pgTable("mastra_threads", {
	id: text().primaryKey().notNull(),
	resourceId: text().notNull(),
	title: text().notNull(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
	createdAtZ: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAtZ: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	organizationId: text(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "mastra_threads_organizationId_organization_id_fk"
		}).onDelete("cascade"),
]);

export const library = pgTable("library", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }),
	organizationId: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "library_organizationId_organization_id_fk"
		}).onDelete("cascade"),
	unique("library_organizationId_unique").on(table.organizationId),
]);

export const libraryItem = pgTable("library_item", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	uploadLink: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }),
	libraryId: text().notNull(),
	fileSize: integer().notNull(),
	processing: status().notNull(),
	tags: text().array().default([""]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.libraryId],
			foreignColumns: [library.id],
			name: "library_item_libraryId_library_id_fk"
		}).onDelete("cascade"),
]);

export const organization = pgTable("organization", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text(),
	logo: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	metadata: text(),
}, (table) => [
	unique("organization_slug_unique").on(table.slug),
]);

export const invitation = pgTable("invitation", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	email: text().notNull(),
	role: text(),
	status: text().default('pending').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	inviterId: text("inviter_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "invitation_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.inviterId],
			foreignColumns: [user.id],
			name: "invitation_inviter_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const member = pgTable("member", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	userId: text("user_id").notNull(),
	role: text().default('member').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("member_organizationId_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
	index("member_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "member_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "member_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const embeddings = pgTable("embeddings", {
	id: serial().primaryKey().notNull(),
	vectorId: text("vector_id").notNull(),
	embedding: vector({ dimensions: 1536 }),
	metadata: jsonb().default({}),
}, (table) => [
	index("embeddings_vector_idx").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({lists: "100"}),
	unique("embeddings_vector_id_key").on(table.vectorId),
]);
