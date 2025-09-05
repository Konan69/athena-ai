import type { auth } from "../modules/auth";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { Agent } from "./agents";
import db from "../db";
import type { testDb } from "../db/test";

// Database type for dependency injection - supports both production and test databases
export type Database = typeof db | typeof testDb;

export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session.session;
export type ActiveOrganizationId = typeof auth.$Infer.Session.session.activeOrganizationId;

export interface APP {
  Variables: {
    user: AuthUser;
    session: AuthSession;
    activeOrganizationId: ActiveOrganizationId;
  };
}


export type TRPCErrorCode = TRPC_ERROR_CODE_KEY;

// RAG event types and schemas re-exported for consumers (frontend)
export type {
  TrainingEvent,
  JobStartedEvent,
  JobProgressEvent,
  JobCompletedEvent,
  JobFailedEvent,
} from "../modules/RAG/events";

export {
  RAGStage,
  baseEvent,
  jobStartedEvent,
  jobProgressEvent,
  jobCompletedEvent,
  jobFailedEvent,
} from "../modules/RAG/events";

export type MastraRuntimeContext = {
  agent: Agent
  resourceId: string;
  sessionId?: string;
  filter: string;
  userId: string;
  threadId: string;
  organizationId: string;
};

export type { LibraryItem } from "./library";
