import type { auth } from "../modules/auth";

export interface APP {
  Variables: {
    user: typeof auth.$Infer.Session.user
    session: typeof auth.$Infer.Session.session
  };
}

export interface BaseRequest {
  id?: string;
  timestamp?: Date;
}

export interface BaseResponse {
  success: boolean;
  timestamp: Date;
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: string;
  details?: unknown;
}

export interface SuccessResponse<T> extends BaseResponse {
  success: true;
  data: T;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

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
  resourceId: string;
  sessionId?: string;
  indexName: string;
  filter: string;
};

export type { LibraryItem } from "./library";
