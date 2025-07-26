import path from "path";
import { Context } from "hono";
import { Next } from "hono/types";

/**
 * Middleware to prevent path traversal attacks in file operations.
 */
export async function pathTraversalProtection(
  c: Context,
  next: Next
): Promise<void | Response> {
  // Check common path traversal patterns in request parameters and body
  const checkPathTraversal = (value: string): boolean => {
    if (typeof value !== "string") return false;

    const dangerousPatterns = [
      /\.\./, // Parent directory
      /\/\.\./, // Unix path traversal
      /\\\.\./, // Windows path traversal
      /\.\.\/|\.\.\\/, // Mixed path traversal
      /\0/, // Null byte injection
    ];

    return dangerousPatterns.some((pattern) => pattern.test(value));
  };

  // Check all string values in request
  const checkObject = (obj: unknown): boolean => {
    if (typeof obj === "string") {
      return checkPathTraversal(obj);
    }

    if (Array.isArray(obj)) {
      return obj.some(checkObject);
    }

    if (obj && typeof obj === "object") {
      return Object.values(obj).some(checkObject);
    }

    return false;
  };

  // Check params, query, and body
  if (
    checkObject(c.req.param()) ||
    checkObject(c.req.query()) ||
    checkObject(c.req.raw.body)
  ) {
    return c.json({
      error: "Invalid path detected",
      message: "Path traversal attempts are not allowed",
    });
  }

  return next();
}

/**
 * Sanitizes file paths to prevent traversal attacks.
 */
export function sanitizeFilePath(
  filePath: string,
  allowedDirectory: string
): string {
  // Normalize the path to resolve any relative components
  const normalizedPath = path.normalize(filePath);

  // Resolve the full path
  const fullPath = path.resolve(allowedDirectory, normalizedPath);

  // Ensure the resolved path is within the allowed directory
  const allowedFullPath = path.resolve(allowedDirectory);

  if (!fullPath.startsWith(allowedFullPath)) {
    throw new Error(
      "Path traversal detected: Access outside allowed directory"
    );
  }

  return fullPath;
}

/**
 * Middleware to sanitize and validate file upload paths.
 */
export function fileUploadSecurity(allowedDirectory: string) {
  return (c: Context, next: Next): void => {
    if (
      c.req.raw.body &&
      typeof c.req.raw.body === "object" &&
      "fileName" in c.req.raw.body
    ) {
      try {
        c.req.raw.body.fileName = sanitizeFilePath(
          c.req.raw.body.fileName as string,
          allowedDirectory
        );
      } catch (error) {
        c.json({
          error: "Invalid file path",
          message:
            error instanceof Error
              ? error.message
              : "File path validation failed",
        });
        return;
      }
    }

    next();
  };
}
