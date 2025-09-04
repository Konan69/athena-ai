import { test, expect, describe } from "bun:test";
import { createTestCaller } from "./trpc-utils";
import { testDb, createTestUser, createTestOrganization, createTestMember, createTestLibrary, createTestAgent, createTestLibraryItem } from "./setup";
import { agent as agentSchema, agentKnowledge } from "../db/schemas";
import type { AgentMetadata } from "../types/agents";
import { eq, and } from "drizzle-orm";

describe("Agent Integration Tests", () => {
  describe("createAgent", () => {
    test("should create a basic support agent", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      const caller = createTestCaller(user, null, org.id);

      const agentData = {
        name: "Customer Support Bot",
        agentType: "support" as const,
        description: "Handles customer inquiries",
        companyName: "Test Company",
      };

      const result = await caller.agents.createAgent(agentData);

      expect(result).toBeDefined();
      expect(result.name).toBe(agentData.name);
      expect(result.agentType).toBe(agentData.agentType);
      expect(result.description).toBe(agentData.description);
      expect(result.companyName).toBe(agentData.companyName);
      expect(result.organizationId).toBe(org.id);
      expect(result.userId).toBe(user.id);
      expect(result.isActive).toBe(true);

      // Verify in database
      const dbAgent = await testDb.query.agent.findFirst({
        where: eq(agentSchema.id, result.id),
      });
      expect(dbAgent).toBeDefined();
      expect(dbAgent?.name).toBe(agentData.name);
    });

    test("should create a whatsapp agent with metadata", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      const caller = createTestCaller(user, null, org.id);

      const agentData = {
        name: "WhatsApp Assistant",
        agentType: "whatsapp" as const,
        description: "WhatsApp business assistant",
        personalityTraits: ["friendly", "responsive"],
        customInstructions: "Always use emojis when appropriate",
        metadata: {
          type: "whatsapp",
          config: {
            phoneNumber: "+1234567890",
            businessHours: "9 AM - 5 PM",
            autoResponseEnabled: true,
            mediaHandling: true,
          },
        } as AgentMetadata,
      };

      const result = await caller.agents.createAgent(agentData);

      expect(result).toBeDefined();
      expect(result.name).toBe(agentData.name);
      expect(result.agentType).toBe(agentData.agentType);
      expect(result.personalityTraits).toEqual(agentData.personalityTraits);
      expect(result.customInstructions).toBe(agentData.customInstructions);
      expect(result.metadata).toEqual(agentData.metadata);
    });

    test("should create agent with knowledge items", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      // Create library and items
      const library = await createTestLibrary(org.id);
      const item1 = await createTestLibraryItem(library.id, { title: "FAQ Document" });
      const item2 = await createTestLibraryItem(library.id, { title: "Policy Manual" });

      const caller = createTestCaller(user, null, org.id);

      const agentData = {
        name: "Knowledgeable Agent",
        agentType: "support" as const,
        knowledgeItems: [item1.id, item2.id],
      };

      const result = await caller.agents.createAgent(agentData);

      expect(result).toBeDefined();

      // Verify knowledge associations were created
      const knowledge = await testDb.query.agentKnowledge.findMany({
        where: eq(agentKnowledge.agentId, result.id),
      });

      expect(knowledge).toHaveLength(2);
      expect(knowledge.map(k => k.libraryItemId).sort()).toEqual([item1.id, item2.id].sort());
    });

    test("should reject invalid agent type", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      const caller = createTestCaller(user, null, org.id);

      // Type-safe way to test invalid input - this will be caught by Zod validation
      const agentData = {
        name: "Invalid Agent",
        agentType: "invalid" as "support" | "whatsapp", // Still type-safe but will fail validation
      };

      await expect(caller.agents.createAgent(agentData)).rejects.toThrow();
    });

    test("should enforce organization membership", async () => {
      const user = await createTestUser();
      const org1 = await createTestOrganization();
      const org2 = await createTestOrganization();

      // User is only member of org1
      await createTestMember(user.id, org1.id);

      // Try to create agent in org2 (user is not a member)
      const callerWrongOrg = createTestCaller(user, null, org2.id);

      const agentData = {
        name: "Unauthorized Agent",
        agentType: "support" as const,
      };

      await expect(callerWrongOrg.agents.createAgent(agentData)).rejects.toThrow();
    });
  });

  describe("getAgents", () => {
    test("should return empty array when organization has no agents", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      const caller = createTestCaller(user, null, org.id);
      const agents = await caller.agents.getAgents();

      expect(agents).toEqual([]);
    });

    test("should return organization's agents", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      // Create test agents
      const agent1 = await createTestAgent(org.id, user.id, { name: "Agent 1", agentType: "support" });
      const agent2 = await createTestAgent(org.id, user.id, { name: "Agent 2", agentType: "whatsapp" });

      const caller = createTestCaller(user, null, org.id);
      const agents = await caller.agents.getAgents();

      expect(agents).toHaveLength(2);
      expect(agents.map(a => a.name).sort()).toEqual(["Agent 1", "Agent 2"]);
    });

    test("should only return agents from user's organization", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });
      const org1 = await createTestOrganization({ name: "Org 1" });
      const org2 = await createTestOrganization({ name: "Org 2" });

      await createTestMember(user1.id, org1.id);
      await createTestMember(user2.id, org2.id);

      // Create agents in both organizations
      await createTestAgent(org1.id, user1.id, { name: "Org1 Agent" });
      await createTestAgent(org2.id, user2.id, { name: "Org2 Agent" });

      const caller1 = createTestCaller(user1, null, org1.id);
      const agents1 = await caller1.agents.getAgents();

      expect(agents1).toHaveLength(1);
      expect(agents1[0]).toBeDefined();
      expect(agents1[0]!.name).toBe("Org1 Agent");

      const caller2 = createTestCaller(user2, null, org2.id);
      const agents2 = await caller2.agents.getAgents();

      expect(agents2).toHaveLength(1);
      expect(agents2[0]).toBeDefined();
      expect(agents2[0]!.name).toBe("Org2 Agent");
    });
  });

  describe("getAgent", () => {
    test("should return agent with knowledge", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      // Create library and items
      const library = await createTestLibrary(org.id);
      const item1 = await createTestLibraryItem(library.id, { title: "Knowledge Item 1" });
      const item2 = await createTestLibraryItem(library.id, { title: "Knowledge Item 2" });

      // Create agent
      const agent = await createTestAgent(org.id, user.id, { name: "Test Agent" });

      // Add knowledge to agent
      await testDb.insert(agentKnowledge).values([
        { agentId: agent.id, libraryItemId: item1.id },
        { agentId: agent.id, libraryItemId: item2.id },
      ]);

      const caller = createTestCaller(user, null, org.id);
      const result = await caller.agents.getAgent({ id: agent.id });

      expect(result).toBeDefined();
      expect(result?.name).toBe("Test Agent");
      expect(result?.knowledge).toHaveLength(2);
      expect(result?.knowledge.map(k => k.libraryItem.title).sort()).toEqual([
        "Knowledge Item 1",
        "Knowledge Item 2",
      ]);
    });

    test("should return null for non-existent agent", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      const caller = createTestCaller(user, null, org.id);
      const result = await caller.agents.getAgent({ id: "non-existent-id" });

      expect(result).toBeUndefined();
    });

    test("should not return agent from different organization", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });
      const org1 = await createTestOrganization({ name: "Org 1" });
      const org2 = await createTestOrganization({ name: "Org 2" });

      await createTestMember(user1.id, org1.id);
      await createTestMember(user2.id, org2.id);

      // Create agent in org2
      const agent = await createTestAgent(org2.id, user2.id, { name: "Org2 Agent" });

      // Try to access from org1
      const caller1 = createTestCaller(user1, null, org1.id);
      const result = await caller1.agents.getAgent({ id: agent.id });

      expect(result).toBeUndefined();
    });
  });

  describe("updateAgent", () => {
    test("should update agent basic information", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      const agent = await createTestAgent(org.id, user.id, { name: "Original Name" });

      const caller = createTestCaller(user, null, org.id);
      const updateData = {
        id: agent.id,
        name: "Updated Name",
        description: "Updated description",
        personalityTraits: ["helpful", "professional"],
      };

      const result = await caller.agents.updateAgent(updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.personalityTraits).toEqual(updateData.personalityTraits);

      // Verify in database
      const dbAgent = await testDb.query.agent.findFirst({
        where: eq(agentSchema.id, result.id),
      });
      expect(dbAgent?.name).toBe(updateData.name);
    });

    test("should update agent metadata", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      const agent = await createTestAgent(org.id, user.id, { agentType: "whatsapp" });

      const caller = createTestCaller(user, null, org.id);
      const updateData = {
        id: agent.id,
        metadata: {
          type: "whatsapp",
          config: {
            phoneNumber: "+1234567890",
            businessHours: "24/7",
            autoResponseEnabled: true,
          },
        } as AgentMetadata,
      };

      const result = await caller.agents.updateAgent(updateData);

      expect(result.metadata).toEqual(updateData.metadata);
    });

    test("should not update agent from different organization", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });
      const org1 = await createTestOrganization({ name: "Org 1" });
      const org2 = await createTestOrganization({ name: "Org 2" });

      await createTestMember(user1.id, org1.id);
      await createTestMember(user2.id, org2.id);

      // Create agent in org2
      const agent = await createTestAgent(org2.id, user2.id);

      // Try to update from org1
      const caller1 = createTestCaller(user1, null, org1.id);
      const updateData = {
        id: agent.id,
        name: "Hacked Name",
      };

      await expect(caller1.agents.updateAgent(updateData)).rejects.toThrow();
    });
  });

  describe("deleteAgent", () => {
    test("should delete agent and its knowledge associations", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      // Create library and items
      const library = await createTestLibrary(org.id);
      const item = await createTestLibraryItem(library.id);

      // Create agent with knowledge
      const testAgent = await createTestAgent(org.id, user.id);
      await testDb.insert(agentKnowledge).values({
        agentId: testAgent.id,
        libraryItemId: item.id,
      });

      const caller = createTestCaller(user, null, org.id);
      const result = await caller.agents.deleteAgent({ id: testAgent.id });

      expect(result.success).toBe(true);

      // Verify agent is deleted
      const dbAgent = await testDb.query.agent.findFirst({
        where: eq(agentSchema.id, testAgent.id),
      });
      expect(dbAgent).toBeUndefined();

      // Verify knowledge associations are deleted (cascade)
      const knowledge = await testDb.query.agentKnowledge.findMany({
        where: eq(agentKnowledge.agentId, testAgent.id),
      });
      expect(knowledge).toHaveLength(0);
    });

    test("should not delete agent from different organization", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });
      const org1 = await createTestOrganization({ name: "Org 1" });
      const org2 = await createTestOrganization({ name: "Org 2" });

      await createTestMember(user1.id, org1.id);
      await createTestMember(user2.id, org2.id);

      // Create agent in org2
      const testAgent = await createTestAgent(org2.id, user2.id);

      // Try to delete from org1
      const caller1 = createTestCaller(user1, null, org1.id);

      await expect(caller1.agents.deleteAgent({ id: testAgent.id })).rejects.toThrow();

      // Verify agent still exists
      const dbAgent = await testDb.query.agent.findFirst({
        where: eq(agentSchema.id, testAgent.id),
      });
      expect(dbAgent).toBeDefined();
    });
  });

  describe("addKnowledge", () => {
    test("should add knowledge items to agent", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      // Create library and items
      const library = await createTestLibrary(org.id);
      const item1 = await createTestLibraryItem(library.id, { title: "Document 1" });
      const item2 = await createTestLibraryItem(library.id, { title: "Document 2" });

      // Create agent
      const agent = await createTestAgent(org.id, user.id);

      const caller = createTestCaller(user, null, org.id);
      const result = await caller.agents.addKnowledge({
        agentId: agent.id,
        libraryItemIds: [item1.id, item2.id],
      });

      expect(result.success).toBe(true);

      // Verify knowledge associations were created
      const knowledge = await testDb.query.agentKnowledge.findMany({
        where: eq(agentKnowledge.agentId, agent.id),
      });

      expect(knowledge).toHaveLength(2);
      expect(knowledge.map(k => k.libraryItemId).sort()).toEqual([item1.id, item2.id].sort());
    });

    test("should reject library items from different organization", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });
      const org1 = await createTestOrganization({ name: "Org 1" });
      const org2 = await createTestOrganization({ name: "Org 2" });

      await createTestMember(user1.id, org1.id);
      await createTestMember(user2.id, org2.id);

      // Create libraries and items in different orgs
      const library1 = await createTestLibrary(org1.id);
      const library2 = await createTestLibrary(org2.id);
      const item1 = await createTestLibraryItem(library1.id);
      const item2 = await createTestLibraryItem(library2.id);

      // Create agent in org1
      const agent = await createTestAgent(org1.id, user1.id);

      const caller1 = createTestCaller(user1, null, org1.id);

      // Try to add knowledge from org2 (should fail)
      await expect(
        caller1.agents.addKnowledge({
          agentId: agent.id,
          libraryItemIds: [item1.id, item2.id], // item2 is from org2
        })
      ).rejects.toThrow();
    });

    test("should prevent duplicate knowledge associations", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      // Create library and item
      const library = await createTestLibrary(org.id);
      const item = await createTestLibraryItem(library.id);

      // Create agent
      const agent = await createTestAgent(org.id, user.id);

      const caller = createTestCaller(user, null, org.id);

      // Add knowledge first time
      await caller.agents.addKnowledge({
        agentId: agent.id,
        libraryItemIds: [item.id],
      });

      // Try to add same knowledge again (should fail)
      await expect(
        caller.agents.addKnowledge({
          agentId: agent.id,
          libraryItemIds: [item.id],
        })
      ).rejects.toThrow();
    });
  });

  describe("removeKnowledge", () => {
    test("should remove knowledge item from agent", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      // Create library and items
      const library = await createTestLibrary(org.id);
      const item1 = await createTestLibraryItem(library.id);
      const item2 = await createTestLibraryItem(library.id);

      // Create agent with knowledge
      const agent = await createTestAgent(org.id, user.id);
      await testDb.insert(agentKnowledge).values([
        { agentId: agent.id, libraryItemId: item1.id },
        { agentId: agent.id, libraryItemId: item2.id },
      ]);

      const caller = createTestCaller(user, null, org.id);
      const result = await caller.agents.removeKnowledge({
        agentId: agent.id,
        libraryItemId: item1.id,
      });

      expect(result.success).toBe(true);

      // Verify only one knowledge association remains
      const knowledge = await testDb.query.agentKnowledge.findMany({
        where: eq(agentKnowledge.agentId, agent.id),
      });

      expect(knowledge).toHaveLength(1);
      expect(knowledge[0]?.libraryItemId).toBe(item2.id);
    });

    test("should handle non-existent knowledge association", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(user.id, org.id);

      // Create library and item
      const library = await createTestLibrary(org.id);
      const item = await createTestLibraryItem(library.id);

      // Create agent without knowledge
      const agent = await createTestAgent(org.id, user.id);

      const caller = createTestCaller(user, null, org.id);

      await expect(
        caller.agents.removeKnowledge({
          agentId: agent.id,
          libraryItemId: item.id,
        })
      ).rejects.toThrow();
    });
  });

  describe("Authorization and Security", () => {
    test("should require authentication for all procedures", async () => {
      const caller = createTestCaller(null); // No user

      await expect(caller.agents.getAgents()).rejects.toThrow();
      await expect(
        caller.agents.createAgent({
          name: "Test Agent",
          agentType: "support",
        })
      ).rejects.toThrow();
    });

    test("should enforce organization membership for all operations", async () => {
      const user = await createTestUser();
      const org1 = await createTestOrganization();
      const org2 = await createTestOrganization();

      // User is only member of org1
      await createTestMember(user.id, org1.id);

      // Create agent in org1
      const agent = await createTestAgent(org1.id, user.id);

      // Try to access with org2 context (should fail)
      const callerWrongOrg = createTestCaller(user, null, org2.id);

      await expect(callerWrongOrg.agents.getAgent({ id: agent.id })).rejects.toThrow();
      await expect(
        callerWrongOrg.agents.updateAgent({
          id: agent.id,
          name: "Hacked Name",
        })
      ).rejects.toThrow();
      await expect(callerWrongOrg.agents.deleteAgent({ id: agent.id })).rejects.toThrow();
    });
  });
});