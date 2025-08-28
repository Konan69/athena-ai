import { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { TRPCError } from "@trpc/server";
import { errorLogger } from "../config/logger";

export class ServiceError extends TRPCError {
	constructor(
		code: TRPC_ERROR_CODE_KEY,
		message: string,
	) {
		super({
			code,
			message,
		});
	}
}

// Create a child logger for service errors
export const serviceErrorLogger = errorLogger.child({ component: 'service-errors' });


// Common service error creators
export const ServiceErrors = {
	notFound: (resource: string) =>
		new ServiceError("NOT_FOUND", `${resource} not found`),

	forbidden: (action?: string) =>
		new ServiceError("FORBIDDEN", action ? `Access denied: ${action}` : "Access denied"),

	unauthorized: (message = "Authentication required") =>
		new ServiceError("UNAUTHORIZED", message),

	badRequest: (message: string) =>
		new ServiceError("BAD_REQUEST", message),

	conflict: (message: string) =>
		new ServiceError("CONFLICT", message),

	tooManyRequests: (message = "Too many requests, please try again later") =>
		new ServiceError("TOO_MANY_REQUESTS", message),

	internal: (message = "Internal server error") =>
		new ServiceError("INTERNAL_SERVER_ERROR", message),

	validation: (field: string, issue: string) =>
		new ServiceError("BAD_REQUEST", `Validation error for ${field}: ${issue}`),
};


