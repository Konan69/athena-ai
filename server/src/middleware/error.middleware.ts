import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../../config/logger";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error("Request error:", err);

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      message: err.message,
    });
    return;
  }

  // Generic error fallback
  res.status(500).json({
    error: "Internal server error",
  });
}
