import { z } from "zod";

// Agent metadata schemas
const supportConfigSchema = z.object({
  availableHours: z.string().optional(),
  escalationRules: z.array(z.string()).optional(),
  ticketingSystemId: z.string().optional(),
});

const whatsappConfigSchema = z.object({
  phoneNumber: z.string().optional(),
  businessHours: z.string().optional(),
  autoResponseEnabled: z.boolean().optional(),
  mediaHandling: z.boolean().optional(),
});

const agentMetadataSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("support"),
    config: supportConfigSchema,
  }),
  z.object({
    type: z.literal("whatsapp"),
    config: whatsappConfigSchema,
  }),
]);

// Create agent schema
export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  agentType: z.enum(["support", "whatsapp"]),
  companyName: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  personalityTraits: z.array(z.string()).max(10).optional(),
  customInstructions: z.string().max(2000).optional(),
  metadata: agentMetadataSchema.optional(),
  knowledgeItems: z.array(z.string()).optional(),
});

// Update agent schema
export const updateAgentSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  personalityTraits: z.array(z.string()).max(10).optional(),
  customInstructions: z.string().max(2000).optional(),
  metadata: agentMetadataSchema.optional(),
  isActive: z.boolean().optional(),
});

// Agent knowledge management schemas
export const addKnowledgeSchema = z.object({
  agentId: z.string(),
  libraryItemIds: z.array(z.string()).min(1),
});

export const removeKnowledgeSchema = z.object({
  agentId: z.string(),
  libraryItemId: z.string(),
});

// Test agent schema
export const testAgentSchema = z.object({
  agentId: z.string(),
  testMessage: z.string().min(1),
});

// Get agent schema
export const getAgentSchema = z.object({
  id: z.string(),
});