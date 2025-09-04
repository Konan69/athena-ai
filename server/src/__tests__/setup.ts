import { beforeEach, afterAll } from "bun:test";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// Import all schemas for cleanup
import * as schema from "../db/schemas";
// Import dedicated test database setup
import { testDb, testSql } from "../db/test";
// Import services for dependency injection
import { createAgentProcedures } from "../modules/agents/routes/procedures";
import { AgentService } from "../modules/agents/agent.service";
import { createLibraryProcedures } from "../modules/library/routes/procedures";
import { LibraryService } from "../modules/library/libraryService";
import { createChatProcedures } from "../modules/chat/routes/procedures";
import { ChatService } from "../modules/chat/chat.service";
import { createOrganizationProcedures } from "../modules/organization/routes/procedures";
import { OrganizationService } from "../modules/organization/organization.service";

// Re-export test database for use in tests
export { testDb };

// Create test service instances
export const createTestAgentService = () => {
  return new AgentService(testDb);
};

export const createTestLibraryService = () => {
  return new LibraryService(testDb);
};

export const createTestChatService = () => {
  return new ChatService(testDb);
};

export const createTestOrganizationService = () => {
  return new OrganizationService(testDb);
};

// Create test procedure instances
export const createTestAgentProcedures = () => {
  return createAgentProcedures(createTestAgentService());
};

export const createTestLibraryProcedures = () => {
  return createLibraryProcedures(createTestLibraryService());
};

export const createTestChatProcedures = () => {
  return createChatProcedures(createTestChatService());
};

export const createTestOrganizationProcedures = () => {
  return createOrganizationProcedures(createTestOrganizationService());
};

// Clean up database before each test
beforeEach(async () => {
  try {
    // Simple truncate without disabling triggers (Neon doesn't allow it)
    // Individual table truncation to avoid foreign key issues
    await testDb.execute(sql`DELETE FROM agent_knowledge`);
    await testDb.execute(sql`DELETE FROM agent`);
    await testDb.execute(sql`DELETE FROM library_item`);
    await testDb.execute(sql`DELETE FROM library`);
    await testDb.execute(sql`DELETE FROM mastra_messages`);
    await testDb.execute(sql`DELETE FROM mastra_threads`);
    await testDb.execute(sql`DELETE FROM embeddings`);
    await testDb.execute(sql`DELETE FROM member`);
    await testDb.execute(sql`DELETE FROM invitation`);
    await testDb.execute(sql`DELETE FROM organization`);
    await testDb.execute(sql`DELETE FROM verification`);
    await testDb.execute(sql`DELETE FROM session`);
    await testDb.execute(sql`DELETE FROM account`);
    await testDb.execute(sql`DELETE FROM "user"`);
  } catch (error) {
    console.warn("Warning: Could not clean database tables:", error);
    // Continue with tests even if cleanup fails
  }
});

// Close database connection after all tests
afterAll(async () => {
  await testSql.end();
});

// Test utilities for creating consistent test data
export const createTestUser = async (overrides: Partial<typeof schema.user.$inferInsert> = {}) => {
  const defaultUser = {
    id: nanoid(),
    email: `test-${Date.now()}@example.com`,
    name: "Test User",
    emailVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };

  const [user] = await testDb.insert(schema.user).values(defaultUser).returning();
  if (!user) throw new Error("Failed to create test user");

  // Convert string dates back to Date objects to match AuthUser type expectations
  return {
    ...user,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
};

export const createTestOrganization = async (overrides: Partial<typeof schema.organization.$inferInsert> = {}) => {
  const defaultOrg = {
    id: nanoid(),
    name: `Test Organization ${Date.now()}`,
    createdAt: new Date(),
    ...overrides,
  };

  const [org] = await testDb.insert(schema.organization).values(defaultOrg).returning();
  if (!org) throw new Error("Failed to create test organization");
  return org;
};

export const createTestMember = async (userId: string, organizationId: string, role: string = "member") => {
  const member = {
    id: nanoid(),
    userId,
    organizationId,
    role,
    createdAt: new Date(),
  };

  const [createdMember] = await testDb.insert(schema.member).values(member).returning();
  if (!createdMember) throw new Error("Failed to create test member");
  return createdMember;
};

export const createTestLibrary = async (organizationId: string, overrides: Partial<typeof schema.library.$inferInsert> = {}) => {
  const defaultLibrary = {
    id: nanoid(),
    organizationId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };

  const [library] = await testDb.insert(schema.library).values(defaultLibrary).returning();
  if (!library) throw new Error("Failed to create test library");
  return library;
};

export const createTestAgent = async (organizationId: string, userId: string, overrides: Partial<typeof schema.agent.$inferInsert> = {}) => {
  const defaultAgent = {
    id: nanoid(),
    name: `Test Agent ${Date.now()}`,
    agentType: "support" as const,
    organizationId,
    userId,
    description: "Test agent description",
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };

  const [agent] = await testDb.insert(schema.agent).values(defaultAgent).returning();
  if (!agent) throw new Error("Failed to create test agent");
  return agent;
};

export const createTestLibraryItem = async (libraryId: string, overrides: Partial<typeof schema.libraryItem.$inferInsert> = {}) => {
  const defaultItem = {
    id: nanoid(),
    title: `Test Document ${Date.now()}`,
    description: "Test document description",
    uploadLink: "https://example.com/test.pdf",
    fileSize: 1024,
    status: "ready" as const,
    libraryId,
    tags: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };

  const [item] = await testDb.insert(schema.libraryItem).values(defaultItem).returning();
  if (!item) throw new Error("Failed to create test library item");
  return item;
};