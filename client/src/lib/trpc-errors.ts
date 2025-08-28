import type { TRPCErrorCode } from "@athena-ai/server/types"
import { TRPCClientError } from "@trpc/client";

// ============================================================================
// 1. BASIC ERROR TYPE CHECKING UTILITIES
// ============================================================================

/**
 * Get the TRPC error code from an error object
 */
export function getTRPCErrorCode(error: unknown): TRPCErrorCode | null {
	if (error instanceof TRPCClientError) {
		return error.data?.code || null;
	}
	return null;
}

/**
 * Check if an error is a TRPC error, optionally with a specific code
 */
export function isTRPCError(error: unknown, code?: TRPCErrorCode): boolean {
	if (!(error instanceof TRPCClientError)) return false;
	if (!code) return true;
	return error.data?.code === code;
}

/**
 * Type-safe check for specific TRPC error codes
 */
export function isSpecificTRPCError<T extends TRPCErrorCode>(
	error: unknown,
	code: T
): error is TRPCClientError<any> & { data: { code: T } } {
	return error instanceof TRPCClientError && error.data?.code === code;
}

// ============================================================================
// 2. ERROR DATA EXTRACTION UTILITIES
// ============================================================================

/**
 * Get validation errors from a BAD_REQUEST error
 */
export function getValidationErrors(error: unknown): Record<string, string[]> | null {
	if (isTRPCError(error, "BAD_REQUEST") && error instanceof TRPCClientError) {
		return error.data?.zodError?.fieldErrors || null;
	}
	return null;
}

/**
 * Get error details from a TRPC error
 */
export function getTRPCErrorDetails(error: unknown): {
	code: TRPCErrorCode | null;
	message: string;
	httpStatus: number | null;
	validationErrors: Record<string, string[]> | null;
} | null {
	if (!isTRPCError(error) || !(error instanceof TRPCClientError)) return null;

	return {
		code: error.data?.code || null,
		message: error.message,
		httpStatus: error.data?.httpStatus || null,
		validationErrors: getValidationErrors(error),
	};
}

// ============================================================================
// 3. ERROR PARSING UTILITY
// ============================================================================

/**
 * Parse error data without any logic or side effects
 * Components can use this to extract error information and decide how to handle it
 */
export function parseTRPCError(error: unknown): {
	isTRPCError: boolean;
	code: TRPCErrorCode | null;
	message: string;
	validationErrors: Record<string, string[]> | null;
} {
	const isTRPC = isTRPCError(error);
	const code = getTRPCErrorCode(error);
	const message = error instanceof Error ? error.message : "Unknown error";
	const validationErrors = getValidationErrors(error);

	return {
		isTRPCError: isTRPC,
		code,
		message,
		validationErrors,
	};
}
