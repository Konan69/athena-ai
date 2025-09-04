import { appRouter } from "../trpc";
import { createTRPCRouter, publicProcedure } from "../trpc/base";
import type { TRPCContext } from "../trpc/base";
import { logger } from "../config/logger";
import type { AuthUser, AuthSession } from "../types";
import {
  createTestAgentProcedures,
  createTestLibraryProcedures,
  createTestChatProcedures,
  createTestOrganizationProcedures
} from "./setup";

// Create test router with test database services
export const createTestRouter = () => {
  return createTRPCRouter({
    agents: createTestAgentProcedures(),
    library: createTestLibraryProcedures(),
    chat: createTestChatProcedures(),
    organization: createTestOrganizationProcedures(),
    
    // Add hello procedure for testing
    hello: publicProcedure.query(() => {
      return { greeting: "Hello, world!" };
    }),
  });
};

// Create test context utility
export const createTestTRPCContext = (
  user?: AuthUser | null,
  session?: AuthSession | null,
  activeOrganizationId?: string | null
): TRPCContext => {
  // If user is explicitly null, return context with null user (unauthenticated)
  if (user === null) {
    return {
      user: null as any,
      session: null as any,
      activeOrganizationId: null as any,
      req: new Request("http://localhost:3000/test"),
      logger,
    };
  }

  return {
    user: user || {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: session || {
      id: "test-session-id",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      token: "test-token",
      userId: user?.id || "test-user-id",
      ipAddress: "127.0.0.1",
      userAgent: "test-user-agent",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    activeOrganizationId: activeOrganizationId || "test-org-id",
    req: new Request("http://localhost:3000/test"),
    logger,
  };
};

// Utility to create a tRPC caller with test context and test database
export const createTestCaller = (
  user?: AuthUser | null,
  session?: AuthSession | null,
  activeOrganizationId?: string | null
) => {
  const context = createTestTRPCContext(user, session, activeOrganizationId);
  const testRouter = createTestRouter();
  return testRouter.createCaller(context);
};

// Legacy utility using production router (for backward compatibility)

// Utility to create a caller for a specific user context
export const createCallerWithUser = (
  user: AuthUser,
  activeOrganizationId?: string
) => {
  const session: AuthSession = {
    id: `session-${user.id}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    token: `token-${user.id}`,
    userId: user.id,
    ipAddress: "127.0.0.1",
    userAgent: "test-user-agent",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return createTestCaller(user, session, activeOrganizationId);
};

// Mock authenticated context for protected procedures
export const mockAuthContext = (overrides: Partial<TRPCContext> = {}): TRPCContext => {
  const defaultContext = createTestTRPCContext();
  return {
    ...defaultContext,
    ...overrides,
  };
};