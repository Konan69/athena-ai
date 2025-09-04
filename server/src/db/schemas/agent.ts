import { relations, sql } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { type InferSelectModel } from "drizzle-orm";
import { nanoid } from "nanoid";
import { organization } from "./organization";
import { user } from "./user";
import { libraryItem } from "./library";
import type {
  AgentMetadata,
} from "../../types/agents";

// Agent types enum
export const agentTypes = pgEnum("agent_type", ["support", "whatsapp"]);

// Main agent configuration table
export const agent = pgTable("agent", {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid()),
  name: text().notNull(),
  agentType: agentTypes().notNull(),
  organizationId: text()
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Base configuration
  companyName: text(),
  description: text(),
  isActive: boolean().default(true).notNull(),

  // Customization options
  personalityTraits: text()
    .array()
    .default(sql`'{}'::text[]`),
  customInstructions: text(),

  // Agent-specific configurations stored as JSONB
  metadata: jsonb().$type<AgentMetadata>(),

  createdAt: timestamp({ mode: "string" }).defaultNow(),
  updatedAt: timestamp({ mode: "string" }),
});

// Junction table for agent-library relationships
export const agentKnowledge = pgTable(
  "agent_knowledge",
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => nanoid()),
    agentId: text()
      .notNull()
      .references(() => agent.id, { onDelete: "cascade" }),
    libraryItemId: text()
      .notNull()
      .references(() => libraryItem.id, { onDelete: "cascade" }),
    createdAt: timestamp({ mode: "string" }).defaultNow(),
  },
  (table) => [unique().on(table.agentId, table.libraryItemId)]
);

// Relations
export const agentRelations = relations(agent, ({ one, many }) => ({
  organization: one(organization, {
    fields: [agent.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [agent.userId],
    references: [user.id],
  }),
  knowledge: many(agentKnowledge),
}));

export const agentKnowledgeRelations = relations(agentKnowledge, ({ one }) => ({
  agent: one(agent, {
    fields: [agentKnowledge.agentId],
    references: [agent.id],
  }),
  libraryItem: one(libraryItem, {
    fields: [agentKnowledge.libraryItemId],
    references: [libraryItem.id],
  }),
}));

// Inferred types from schema
export type Agent = InferSelectModel<typeof agent>;
export type AgentKnowledge = InferSelectModel<typeof agentKnowledge>;

// Extended types for queries with relations
export interface AgentWithKnowledge extends Agent {
  knowledge: Array<{
    libraryItem: typeof libraryItem.$inferSelect;
  }>;
}

