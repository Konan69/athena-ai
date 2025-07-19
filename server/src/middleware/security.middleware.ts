import { Request, Response, NextFunction } from "express";
import path from "path";

/**
 * Middleware to prevent path traversal attacks in file operations.
 */
export function pathTraversalProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check common path traversal patterns in request parameters and body
  const checkPathTraversal = (value: any): boolean => {
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
  const checkObject = (obj: any): boolean => {
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
    checkObject(req.params) ||
    checkObject(req.query) ||
    checkObject(req.body)
  ) {
    res.status(400).json({
      error: "Invalid path detected",
      message: "Path traversal attempts are not allowed",
    });
    return;
  }

  next();
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
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.body && req.body.fileName) {
      try {
        req.body.fileName = sanitizeFilePath(
          req.body.fileName,
          allowedDirectory
        );
      } catch (error) {
        res.status(400).json({
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
