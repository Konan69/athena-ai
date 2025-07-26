import type { appRouter } from "../trpc";
import type { auth } from "../modules/auth";

export interface APP {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
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
export type { appRouter };
