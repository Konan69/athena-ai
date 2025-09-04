# Agents Module Implementation Design

## Overview

This document outlines the design for a comprehensive agents module that enables users to create, configure, and manage specialized AI agents within the Athena AI platform. The module introduces custom agent types with dynamic prompt templates, organization-scoped configurations, and bidirectional integration with the existing library system for knowledge management.

The agents module extends the current Mastra-based agent architecture to support user-created, customizable agents that can be tailored to specific business needs while maintaining seamless integration with the platform's existing infrastructure.

## Architecture

### Agent System Architecture

The agents module follows a layered architecture that integrates with the existing Athena AI infrastructure:

``mermaid
graph TB
UI[Agent Management UI] --> API[tRPC Agent API]
API --> Service[Agent Service Layer]
Service --> DB[(PostgreSQL Database)]
Service --> Mastra[Mastra Agent Factory]
Service --> Library[Library Service]

    subgraph "Database Layer"
        DB --> AgentSchema[agents]
        DB --> AgentKnowledgeSchema[agent_knowledge]
        DB --> LibrarySchema[library_items]
    end

    subgraph "Agent Runtime"
        Mastra --> PromptEngine[Dynamic Prompt Engine]
        Mastra --> KnowledgeEngine[Knowledge Injection Engine]
        PromptEngine --> BasePrompt[Base System Prompt]
        PromptEngine --> AgentPrompt[Agent-Specific Overrides]
    end

    subgraph "Knowledge Management"
        Library --> RAG[RAG Service]
        AgentKnowledgeSchema --> RAG
        RAG --> Embeddings[Vector Embeddings]
    end

````

### Component Hierarchy

```mermaid
graph LR
    Organization --> Agent
    AgentConfig --> AgentKnowledge
    AgentConfig --> AgentType
    LibraryItem --> AgentKnowledge
    User --> Agent

    subgraph "Agent Types"
        Support[Support Agent]
        WhatsApp[WhatsApp Agent]
    end
````

## Data Models & ORM Mapping

### Agent Configuration Schema

```typescript
// server/src/db/schemas/agents.ts
export const agentTypes = pgEnum("agent_type", ["support", "whatsapp"]);

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

  // Agent-specific configurations
  metadata: jsonb().$type<AgentMetadata>(),

  createdAt: timestamp({ mode: "string" }).defaultNow(),
  updatedAt: timestamp({ mode: "string" }),
});

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

export type AgentConfig = InferSelectModel<typeof agent>;
export type AgentKnowledge = InferSelectModel<typeof agentKnowledge>;
```

### Type Definitions

```typescript
// server/src/types/agents.ts
// Use discriminated unions for better type safety
export type AgentMetadata =
  | { type: "support"; config: SupportConfig }
  | { type: "whatsapp"; config: WhatsAppConfig };

export interface SupportConfig {
  availableHours?: string;
  escalationRules?: string[];
  ticketingSystemId?: string;
}

export interface WhatsAppConfig {
  phoneNumber?: string;
  businessHours?: string;
  autoResponseEnabled?: boolean;
  mediaHandling?: boolean;
}

export interface CreateAgentPayload {
  name: string;
  agentType: "support" | "whatsapp";
  companyName?: string;
  description?: string;
  personalityTraits?: string[];
  customInstructions?: string;
  metadata?: AgentMetadata;
  knowledgeItems?: string[]; // libraryItem IDs
}

export interface AgentConfigWithKnowledge extends AgentConfig {
  knowledge: Array<{
    libraryItem: LibraryItem;
  }>;
}
```

## Agent Types & Prompt System

### Agent Registration in Mastra

```typescript
// mastra/src/mastra/agents/support-agent.ts
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { webSearchTool } from "../tools/web-search-tool";
import { ragSearchTool } from "../tools/rag-search-tool";
import { memory } from "../../config/memory";
import { createSupportAgentPrompt } from "../prompts/support-agent";

export const supportAgent = new Agent({
  name: "Support Agent",
  instructions: ({ runtimeContext }) => {
    const agent = runtimeContext.get("agent");
    if (!agent) {
      return "You are a helpful customer support assistant.";
    }
    return createSupportAgentPrompt(agent);
  },
  model: openai("gpt-4o"),
  tools: { webSearchTool, ragSearchTool },
  memory,
});

// mastra/src/mastra/agents/whatsapp-agent.ts
export const whatsappAgent = new Agent({
  name: "WhatsApp Agent",
  instructions: ({ runtimeContext }) => {
    const agent = runtimeContext.get("agent");
    if (!agent) {
      return "You are a helpful WhatsApp assistant.";
    }
    return createWhatsAppAgentPrompt(agent);
  },
  model: openai("gpt-4o"),
  tools: { webSearchTool, ragSearchTool },
  memory,
});

// mastra/src/mastra/index.ts
export const mastra = new Mastra({
  workflows: {
    researchWorkflow,
  },
  agents: {
    athenaAI,
    ragAgent,
    researchAgent,
    supportAgent, // Register support agent globally
    whatsappAgent, // Register WhatsApp agent globally
  },
  storage: sharedPgStore,
  logger: new PinoLogger({
    name: "Mastra",
  }),
  vectors: {
    ["vectors"]: vectorStore,
  },
  server: {
    port: parseInt(env.MASTRA_PORT),
    host: "localhost",
  },
});
```

### Dynamic Prompt Generation

``typescript
// mastra/src/mastra/prompts/support-agent.ts
export const createSupportAgentPrompt = (agent: AgentConfig) => {
  const basePersonality = agent.personalityTraits?.length
    ? `Personality traits: ${agent.personalityTraits.join(", ")}`
: "Professional, helpful, and empathetic";

const supportConfig =
agent.metadata?.type === "support"
? agent.metadata.config
: undefined;

return `
<core_identity>
You are ${agent.name}, a specialized customer support assistant.

${
agent.description ||
"You provide excellent customer support and resolve inquiries efficiently."
}

## Personality & Communication Style

${basePersonality}

${agent.customInstructions || ""}

The current date is {{current_date}}.
</core_identity>

<support_instructions>
You are a customer support specialist focused on:

- Resolving customer inquiries efficiently and empathetically
- Escalating complex issues according to company protocols
- Maintaining detailed records of customer interactions
- Following company-specific support procedures

${
  supportConfig?.availableHours
    ? `Available during: ${supportConfig.availableHours}`
    : ""
}
${
supportConfig?.escalationRules
? `Escalation rules: ${supportConfig.escalationRules.join(", ")}`
: ""
}

When you cannot resolve an issue:

1. Acknowledge the customer's concern
2. Explain what you've attempted
3. Provide clear next steps for escalation
4. Set appropriate expectations for response time
   </support_instructions>

${basePrompt} // Inherit from existing base prompt
`;
};

// mastra/src/mastra/prompts/whatsapp-agent.ts
export const createWhatsAppAgentPrompt = (agent: AgentConfig) => {
const basePersonality = agent.personalityTraits?.length
? `Personality traits: ${agent.personalityTraits.join(", ")}`
: "Friendly, responsive, and professional";

const whatsappConfig =
agent.metadata?.type === "whatsapp"
? agent.metadata.config
: undefined;

return `
<core_identity>
You are ${agent.name}, a WhatsApp business assistant.

${
agent.description ||
"You provide quick, helpful responses via WhatsApp messaging."
}

## Personality & Communication Style

${basePersonality}

${agent.customInstructions || ""}

The current date is {{current_date}}.
</core_identity>

<whatsapp_instructions>
You are a WhatsApp business assistant optimized for:

- Quick, conversational responses suitable for mobile messaging
- Understanding context from brief messages
- Handling multimedia content when appropriate
- Maintaining professional yet friendly tone

Communication guidelines:

- Keep responses concise and scannable
- Use emojis sparingly and professionally
- Break long responses into multiple messages
- Confirm understanding before proceeding with complex requests

${
  whatsappConfig?.businessHours
    ? `Business hours: ${whatsappConfig.businessHours}`
    : ""
}
${
whatsappConfig?.autoResponseEnabled
? "Auto-responses are enabled for after-hours messages."
: ""
}
</whatsapp_instructions>

${basePrompt} // Inherit from existing base prompt
`;
};

```

## API Endpoints Reference

### Agent Chat Route Integration

``typescript
// server/src/modules/agents/routes/chat.ts
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { agentService } from "../agentService";
import { createApp, createRuntimeContext } from "../../../lib/factory";

const agentChatSchema = z.object({
  agentId: z.string(),
  message: z.string(),
});

const validateAgentChatRequest = zValidator("json", agentChatSchema);

const agentChatRouter = createApp();

agentChatRouter.post("/", validateAgentChatRequest, async (c) => {
  try {
    const body = c.req.valid("json");
    const userId = c.var.user?.id;
    const orgId = c.var.activeOrganizationId;

    if (!userId || !orgId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const result = await agentService.executeAgentChat(
      body.agentId,
      body.message,
      orgId,
      userId
    );

    return c.json(result);
  } catch (error) {
    console.error("Agent chat error:", error);
    return c.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default agentChatRouter;
```

### Agent Management Endpoints

``typescript
// server/src/modules/agents/routes/procedures.ts
export const agentProcedures = createTRPCRouter({
// Create new agent
createAgent: protectedProcedure
.input(createAgentSchema)
.mutation(async ({ ctx, input }) => {
const agent = await agentService.createAgent(ctx.activeOrganizationId, ctx.user.id, input);
return agent;
}),

// List organization agents
getAgents: protectedProcedure
.query(async ({ ctx }) => {
const agents = await agentService.getOrganizationAgents(ctx.activeOrganizationId);
return agents;
}),

// Get specific agent with knowledge
getAgent: protectedProcedure
.input(z.object({ id: z.string() }))
.query(async ({ ctx, input }) => {
const agent = await agentService.getAgentWithKnowledge(input.id, ctx.activeOrganizationId);
return agent;
}),

// Update agent configuration
updateAgent: protectedProcedure
.input(updateAgentSchema)
.mutation(async ({ ctx, input }) => {
const agent = await agentService.updateAgent(input.id, input, ctx.activeOrganizationId);
return agent;
}),

// Manage agent knowledge
addKnowledge: protectedProcedure
.input(z.object({
agentId: z.string(),
libraryItemIds: z.array(z.string()),
}))
.mutation(async ({ ctx, input }) => {
await agentService.addKnowledgeToAgent(input.agentId, input.libraryItemIds, ctx.activeOrganizationId);
}),

removeKnowledge: protectedProcedure
.input(z.object({
agentId: z.string(),
libraryItemId: z.string(),
}))
.mutation(async ({ ctx, input }) => {
await agentService.removeKnowledgeFromAgent(input.agentId, input.libraryItemId, ctx.activeOrganizationId);
}),

// Test agent configuration
testAgent: protectedProcedure
.input(z.object({
agentId: z.string(),
testMessage: z.string(),
}))
.mutation(async ({ ctx, input }) => {
const response = await agentService.executeAgentChat(
input.agentId,
input.testMessage,
ctx.activeOrganizationId,
ctx.user.id
);
return response;
}),
});
.mutation(async ({ ctx, input }) => {
const response = await agentService.testAgent(input.agentId, input.testMessage, ctx.activeOrganizationId);
return response;
}),
});

```

### Request/Response Schema

``typescript
// server/src/modules/agents/validators/agentValidator.ts
export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  agentType: z.enum(["support", "whatsapp"]),
  companyName: z.string().optional(),
  description: z.string().max(500).optional(),
  personalityTraits: z.array(z.string()).max(10).optional(),
  customInstructions: z.string().max(2000).optional(),
  metadata: z
    .object({
      support: z
        .object({
          availableHours: z.string().optional(),
          escalationRules: z.array(z.string()).optional(),
          ticketingSystemId: z.string().optional(),
        })
        .optional(),
      whatsapp: z
        .object({
          phoneNumber: z.string().optional(),
          businessHours: z.string().optional(),
          autoResponseEnabled: z.boolean().optional(),
          mediaHandling: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  knowledgeItems: z.array(z.string()).optional(),
});

export const updateAgentSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  personalityTraits: z.array(z.string()).max(10).optional(),
  customInstructions: z.string().max(2000).optional(),
  metadata: z
    .object({
      type: z.enum(["support", "whatsapp"]),
      config: z.union([
        z.object({
          availableHours: z.string().optional(),
          escalationRules: z.array(z.string()).optional(),
          ticketingSystemId: z.string().optional(),
        }),
        z.object({
          phoneNumber: z.string().optional(),
          businessHours: z.string().optional(),
          autoResponseEnabled: z.boolean().optional(),
          mediaHandling: z.boolean().optional(),
        }),
      ]),
    })
    .optional(),
  isActive: z.boolean().optional(),
});
```

## Business Logic Layer

### Agent Service Architecture

```typescript
// server/src/modules/agents/agentService.ts
export class AgentService {
  async createAgent(
    organizationId: string,
    userId: string,
    payload: CreateAgentPayload
  ): Promise<AgentConfig> {
    // Validate organization access
    await this.validateOrganizationAccess(organizationId, userId);

    // Create agent configuration
    const [agent] = await db
      .insert(agent)
      .values({
        ...payload,
        organizationId,
        userId,
      })
      .returning();

    // Attach knowledge items if provided
    if (payload.knowledgeItems?.length) {
      await this.addKnowledgeToAgent(
        agent.id,
        payload.knowledgeItems,
        organizationId
      );
    }

    return agent;
  }

  async getAgentWithKnowledge(
    agentId: string,
    organizationId: string
  ): Promise<AgentConfigWithKnowledge> {
    const agent = await db.query.agent.findFirst({
      where: and(
        eq(agent.id, agentId),
        eq(agent.organizationId, organizationId)
      ),
      with: {
        knowledge: {
          with: {
            libraryItem: true,
          },
          orderBy: [desc(agentKnowledge.createdAt)],
        },
      },
    });

    if (!agent) {
      throw ServiceErrors.notFound("Agent");
    }

    return agent;
  }

  async addKnowledgeToAgent(
    agentId: string,
    libraryItemIds: string[],
    organizationId: string
  ): Promise<void> {
    // Validate agent ownership
    const agent = await this.validateAgentAccess(agentId, organizationId);

    // Validate library items belong to organization
    const validItems = await db.query.libraryItem.findMany({
      where: and(
        inArray(libraryItem.id, libraryItemIds),
        eq(library.organizationId, organizationId)
      ),
      with: {
        library: true,
      },
    });

    if (validItems.length !== libraryItemIds.length) {
      throw ServiceErrors.badRequest(
        "Some library items not found or not accessible"
      );
    }

    // Insert knowledge associations
    const knowledgeEntries = validItems.map((item) => ({
      agentId,
      libraryItemId: item.id,
    }));

    await db.insert(agentKnowledge).values(knowledgeEntries);
  }

  async executeAgentChat(
    agentId: string,
    message: string,
    organizationId: string,
    userId: string
  ): Promise<any> {
    // Get agent configuration
    const agent = await this.getAgentWithKnowledge(agentId, organizationId);

    if (!agent.isActive) {
      throw ServiceErrors.badRequest("Agent is not active");
    }

    // Create runtime context with agent-specific data
    const runtimeContext = createRuntimeContext();
    runtimeContext.set("resourceId", userId);
    runtimeContext.set("agent", agent);
    runtimeContext.set(
      "agentLibraryItems",
      agent.knowledge.map((k) => k.libraryItem.id)
    );
    runtimeContext.set(
      "filter",
      JSON.stringify({
        orgId: organizationId,
        libraryItemIds: agent.knowledge.map((k) => k.libraryItem.id),
      })
    );

    // Use the registered agent from Mastra based on agent type
    const agentName = this.getRegisteredAgentName(agent.agentType);

    const result = await mastra.agents[agentName].run(message, {
      runtimeContext,
    });

    return result;
  }

  private getRegisteredAgentName(agentType: string): string {
    switch (agentType) {
      case "support":
        return "supportAgent";
      case "whatsapp":
        return "whatsappAgent";
      default:
        throw new Error(`Unsupported agent type: ${agentType}`);
    }
  }
}
```

## Bidirectional Library Integration

### Enhanced Library Service

```typescript
// server/src/modules/library/libraryService.ts
export class LibraryService {
  async getLibraryItems(organizationId: string) {
    return await db.query.libraryItem.findMany({
      where: eq(library.organizationId, organizationId),
      with: {
        library: true,
        agentKnowledge: {
          with: {
            agent: {
              columns: {
                id: true,
                name: true,
                agentType: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: [desc(libraryItem.createdAt)],
    });
  }

  // ... existing methods
}
```

### Library UI Components with Agent Information

``typescript
// client/src/components/library/library-item-card.tsx
interface LibraryItemCardProps {
item: LibraryItem & {
agentKnowledge: Array<{
agent: {
id: string;
name: string;
agentType: string;
isActive: boolean;
};
}>;
};
onEdit?: (item: LibraryItem) => void;
onDelete?: (item: LibraryItem) => void;
}

export function LibraryItemCard({
item,
onEdit,
onDelete,
}: LibraryItemCardProps) {
const attachedAgents = item.agentKnowledge || [];

return (
<Card className="h-full">
<CardContent className="p-4">
{/_ ... existing content ... _/}

        {attachedAgents.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-sm text-muted-foreground mb-2">
              Used by {attachedAgents.length} agent
              {attachedAgents.length !== 1 ? "s" : ""}:
            </div>
            <div className="flex flex-wrap gap-1">
              {attachedAgents.map(({ agent }) => (
                <Badge
                  key={agent.id}
                  variant={agent.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  <span className="capitalize mr-1">{agent.agentType}</span>
                  {agent.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>

);
}

````

## Component Architecture

### Agent Management UI Components

```mermaid
graph TB
    AgentDashboard --> AgentList
    AgentDashboard --> CreateAgentButton

    CreateAgentButton --> AgentModal
    AgentModal --> AgentForm
    AgentModal --> KnowledgeSelector

    AgentList --> AgentCard
    AgentCard --> AgentActions
    AgentCard --> AgentStatus

    AgentForm --> TypeSelector
    AgentForm --> PromptCustomizer
    AgentForm --> MetadataEditor

    KnowledgeSelector --> LibraryItemGrid
    LibraryItemGrid --> LibraryItemCard

    AgentActions --> EditAgent
    AgentActions --> TestAgent
    AgentActions --> ToggleStatus
````

### Agent Creation Modal Component

```typescript
// client/src/components/agents/agent-modal.tsx
interface AgentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingAgent?: AgentConfigWithKnowledge;
  onComplete?: (agent: AgentConfig) => void;
}

export function AgentModal({
  isOpen,
  onOpenChange,
  editingAgent,
  onComplete,
}: AgentModalProps) {
  const [activeTab, setActiveTab] = useState("configuration");
  const [selectedKnowledge, setSelectedKnowledge] = useState<string[]>([]);

  const { data: libraryItems } = trpc.library.getLibraryItems.useQuery();
  const createAgentMutation = trpc.agents.createAgent.useMutation();
  const updateAgentMutation = trpc.agents.updateAgent.useMutation();

  // Form state management
  const [formData, setFormData] = useState<CreateAgentPayload>({
    name: "",
    agentType: "support",
    description: "",
    personalityTraits: [],
    customInstructions: "",
    metadata: {},
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAgent ? `Edit ${editingAgent.name}` : "Create New Agent"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>

          <TabsContent value="configuration">
            <AgentConfigurationForm data={formData} onChange={setFormData} />
          </TabsContent>

          <TabsContent value="knowledge">
            <AgentKnowledgeManager
              selectedItems={selectedKnowledge}
              onSelectionChange={setSelectedKnowledge}
              availableItems={libraryItems || []}
              agentId={editingAgent?.id}
            />
          </TabsContent>

          <TabsContent value="test">
            <AgentTestInterface
              agent={formData}
              knowledgeItems={selectedKnowledge}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### Knowledge Management Integration

```typescript
// client/src/components/agents/agent-knowledge-manager.tsx
interface AgentKnowledgeManagerProps {
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  availableItems: LibraryItem[];
  agentId?: string;
}

export function AgentKnowledgeManager({
  selectedItems,
  onSelectionChange,
  availableItems,
  agentId,
}: AgentKnowledgeManagerProps) {
  const [isCreatingItem, setIsCreatingItem] = useState(false);

  const handleCreateLibraryItem = async (item: CreateLibraryItemPayload) => {
    // Create library item and auto-attach to agent
    const newItem = await createLibraryItemMutation.mutateAsync(item);
    onSelectionChange([...selectedItems, newItem.id]);
    setIsCreatingItem(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Agent Knowledge Base</h3>
        <Button
          onClick={() => setIsCreatingItem(true)}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Knowledge
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableItems.map((item) => (
          <LibraryItemCard
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onToggle={(selected) => {
              if (selected) {
                onSelectionChange([...selectedItems, item.id]);
              } else {
                onSelectionChange(selectedItems.filter((id) => id !== item.id));
              }
            }}
          />
        ))}
      </div>

      {/* Reuse existing InputModal for creating library items */}
      <InputModal
        isOpen={isCreatingItem}
        onOpenChange={setIsCreatingItem}
        onComplete={handleCreateLibraryItem}
      />
    </div>
  );
}
```

## Routing & Navigation

### Agent Routes

```typescript
// client/src/routes/_authenticated/agents/index.tsx
export const Route = createFileRoute("/_authenticated/agents/")({
  loader: async ({ context }) => {
    const trpc = context.trpc;
    const qc = context.queryClient;
    const agents = await qc.ensureQueryData(
      trpc.agents.getAgents.queryOptions()
    );
    return { agents };
  },
  component: AgentDashboard,
});

// client/src/routes/_authenticated/agents/$agentId.tsx
export const Route = createFileRoute("/_authenticated/agents/$agentId")({
  loader: async ({ context, params }) => {
    const trpc = context.trpc;
    const qc = context.queryClient;
    const agent = await qc.ensureQueryData(
      trpc.agents.getAgent.queryOptions({ id: params.agentId })
    );
    return { agent };
  },
  component: AgentDetailPage,
});
```

## State Management

### Agent Store

```typescript
// client/src/store/agents.store.ts
interface AgentStore {
  agents: AgentConfig[];
  selectedAgent: AgentConfigWithKnowledge | null;
  isCreatingAgent: boolean;

  // Actions
  setAgents: (agents: AgentConfig[]) => void;
  setSelectedAgent: (agent: AgentConfigWithKnowledge | null) => void;
  addAgent: (agent: AgentConfig) => void;
  updateAgent: (id: string, updates: Partial<AgentConfig>) => void;
  removeAgent: (id: string) => void;

  // UI State
  setCreatingAgent: (creating: boolean) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  selectedAgent: null,
  isCreatingAgent: false,

  setAgents: (agents) => set({ agents }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  addAgent: (agent) =>
    set((state) => ({
      agents: [...state.agents, agent],
    })),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id ? { ...agent, ...updates } : agent
      ),
      selectedAgent:
        state.selectedAgent?.id === id
          ? { ...state.selectedAgent, ...updates }
          : state.selectedAgent,
    })),
  removeAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((agent) => agent.id !== id),
      selectedAgent:
        state.selectedAgent?.id === id ? null : state.selectedAgent,
    })),

  setCreatingAgent: (creating) => set({ isCreatingAgent: creating }),
}));
```

## Testing Strategy

### Integration Tests

```typescript
// server/src/__tests__/agents.test.ts
import { describe, test, expect, beforeEach } from "bun:test";
import {
  testDb,
  createTestUser,
  createTestOrganization,
  createTestMember,
  createTestLibrary,
  createTestLibraryItem,
} from "./setup";
import { agent, agentKnowledge } from "../db/schemas/agents";
import { createCallerWithUser } from "./trpc-utils";
import { sql } from "drizzle-orm";

describe("Agent Module", () => {
  beforeEach(async () => {
    // Clean database state with DELETE operations (Bun/Neon compatible)
    await testDb.execute(sql`DELETE FROM agent_knowledge`);
    await testDb.execute(sql`DELETE FROM agent`);
    await testDb.execute(sql`DELETE FROM library_item`);
    await testDb.execute(sql`DELETE FROM library`);
    await testDb.execute(sql`DELETE FROM member`);
    await testDb.execute(sql`DELETE FROM organization`);
    await testDb.execute(sql`DELETE FROM "user"`);
  });

  describe("createAgent", () => {
    test("should create support agent with knowledge using real tRPC procedures", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);
      const library = await createTestLibrary(org.id);
      const libraryItem = await createTestLibraryItem(library.id);

      const caller = createCallerWithUser(user, org.id);

      const agentData = {
        name: "Customer Support Bot",
        agentType: "support" as const,
        description: "Handles customer inquiries",
        personalityTraits: ["helpful", "professional"],
        knowledgeItems: [libraryItem.id],
        metadata: {
          type: "support" as const,
          config: {
            availableHours: "9AM-5PM EST",
            escalationRules: ["urgent", "billing"],
          },
        },
      };

      const agent = await caller.agents.createAgent(agentData);

      expect(agent.name).toBe(agentData.name);
      expect(agent.agentType).toBe("support");
      expect(agent.organizationId).toBe(org.id);
      expect(agent.userId).toBe(user.id);
      expect(agent.isActive).toBe(true);
    });

    test("should validate organization access with real database operations", async () => {
      const user = await createTestUser();
      const org1 = await createTestOrganization();
      const org2 = await createTestOrganization();
      await createTestMember(user.id, org1.id); // User only in org1

      const caller = createCallerWithUser(user, org2.id); // Try to create in org2

      await expect(
        caller.agents.createAgent({
          name: "Test Agent",
          agentType: "support",
        })
      ).rejects.toThrow();
    });

    test("should validate input with Zod schema", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      const caller = createCallerWithUser(user, org.id);

      // Test empty name validation
      await expect(
        caller.agents.createAgent({
          name: "",
          agentType: "support",
        })
      ).rejects.toThrow();

      // Test invalid agent type
      await expect(
        caller.agents.createAgent({
          name: "Valid Name",
          // @ts-expect-error - Testing invalid type
          agentType: "invalid",
        })
      ).rejects.toThrow();
    });
  });

  describe("knowledge management", () => {
    test("should add and remove knowledge from agent with real database operations", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);
      const library = await createTestLibrary(org.id);
      const libraryItem = await createTestLibraryItem(library.id);

      const caller = createCallerWithUser(user, org.id);

      // Create agent first
      const agent = await caller.agents.createAgent({
        name: "Test Agent",
        agentType: "support",
      });

      // Add knowledge
      await caller.agents.addKnowledge({
        agentId: agent.id,
        libraryItemIds: [libraryItem.id],
      });

      let agentWithKnowledge = await caller.agents.getAgent({ id: agent.id });
      expect(agentWithKnowledge.knowledge).toHaveLength(1);
      expect(agentWithKnowledge.knowledge[0].libraryItem.id).toBe(
        libraryItem.id
      );

      // Remove knowledge
      await caller.agents.removeKnowledge({
        agentId: agent.id,
        libraryItemId: libraryItem.id,
      });

      agentWithKnowledge = await caller.agents.getAgent({ id: agent.id });
      expect(agentWithKnowledge.knowledge).toHaveLength(0);
    });

    test("should prevent adding library items from other organizations", async () => {
      const user = await createTestUser();
      const org1 = await createTestOrganization();
      const org2 = await createTestOrganization();
      await createTestMember(user.id, org1.id);

      const library2 = await createTestLibrary(org2.id);
      const libraryItem2 = await createTestLibraryItem(library2.id);

      const caller = createCallerWithUser(user, org1.id);

      const agent = await caller.agents.createAgent({
        name: "Test Agent",
        agentType: "support",
      });

      await expect(
        caller.agents.addKnowledge({
          agentId: agent.id,
          libraryItemIds: [libraryItem2.id], // From different org
        })
      ).rejects.toThrow();
    });
  });

  describe("agent execution", () => {
    test("should execute agent with runtime context", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      const caller = createCallerWithUser(user, org.id);

      const agent = await caller.agents.createAgent({
        name: "Test Support Agent",
        agentType: "support",
        description: "Test agent for support",
      });

      // Test agent execution
      const result = await caller.agents.testAgent({
        agentId: agent.id,
        testMessage: "Hello",
      });

      expect(result).toBeDefined();
    });
  });
});
```

### Unit Tests for Prompt Generation

```typescript
// server/src/modules/agents/__tests__/agentPrompts.test.ts
import { describe, test, expect } from "bun:test";
import {
  createSupportAgentPrompt,
  createWhatsAppAgentPrompt,
} from "../prompts";
import type { AgentConfig } from "../types";

describe("Agent Prompt Generation", () => {
  test("should generate support agent prompt with custom configuration", () => {
    const agent = {
      id: "test",
      name: "Support Bot",
      agentType: "support" as const,
      organizationId: "org-1",
      userId: "user-1",
      personalityTraits: ["empathetic", "solution-focused"],
      customInstructions: "Always ask for feedback",
      description: "Specialized customer support",
      metadata: {
        type: "support" as const,
        config: {
          availableHours: "24/7",
          escalationRules: ["billing", "technical"],
        },
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as AgentConfig;

    const prompt = createSupportAgentPrompt(agent);

    expect(prompt).toContain("Support Bot");
    expect(prompt).toContain("empathetic, solution-focused");
    expect(prompt).toContain("Always ask for feedback");
    expect(prompt).toContain("24/7");
    expect(prompt).toContain("billing, technical");
    expect(prompt).toContain("customer support specialist");
  });

  test("should generate WhatsApp agent prompt with default values", () => {
    const agent = {
      id: "test",
      name: "WhatsApp Bot",
      agentType: "whatsapp" as const,
      organizationId: "org-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as AgentConfig;

    const prompt = createWhatsAppAgentPrompt(agent);

    expect(prompt).toContain("WhatsApp Bot");
    expect(prompt).toContain("Friendly, responsive, and professional");
    expect(prompt).toContain("mobile messaging");
    expect(prompt).toContain("Keep responses concise");
  });

  test("should handle missing metadata gracefully", () => {
    const agent = {
      id: "test",
      name: "Basic Agent",
      agentType: "support" as const,
      organizationId: "org-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as AgentConfig;

    const prompt = createSupportAgentPrompt(agent);

    expect(prompt).toContain("Basic Agent");
    expect(prompt).toContain("Professional, helpful, and empathetic");
    expect(prompt).not.toContain("Available during:");
    expect(prompt).not.toContain("Escalation rules:");
  });
});
```

### Test Utilities

```typescript
// server/src/__tests__/agents-utils.ts
import { testDb } from "./setup";
import { agent, agentKnowledge } from "../db/schemas/agents";
import type { AgentConfig, CreateAgentPayload } from "../types/agents";

export async function createTestAgent(
  organizationId: string,
  userId: string,
  overrides: Partial<CreateAgentPayload> = {}
): Promise<AgentConfig> {
  const [agent] = await testDb
    .insert(agent)
    .values({
      name: "Test Agent",
      agentType: "support",
      organizationId,
      userId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    })
    .returning();

  return agent;
}

export async function createTestAgentKnowledge(
  agentId: string,
  libraryItemId: string
) {
  const [knowledge] = await testDb
    .insert(agentKnowledge)
    .values({
      agentId,
      libraryItemId,
      createdAt: new Date().toISOString(),
    })
    .returning();

  return knowledge;
}
```
