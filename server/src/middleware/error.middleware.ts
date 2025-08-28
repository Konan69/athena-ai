import { Context } from "hono";
import { Next } from "hono/types";
import { createMiddleware } from "hono/factory";
import { ZodError } from "zod";
import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

// Create a standalone logger for error handling
import pino from "pino";
const errorLogger = pino({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
  },
});

// Hono's recommended ErrorHandler approach
export const errorHandler: ErrorHandler = (err, c) => {
  const env = c.env?.NODE_ENV || process.env?.NODE_ENV;
  const isDevelopment = env === "development";

  // Get status code - handle different error types
  let status = 500;
  let errorMessage = "Internal Server Error";

  if (err instanceof HTTPException) {
    status = err.status;
    errorMessage = err.message;
  } else if (err instanceof ZodError) {
    status = 400;
    errorMessage = "Validation failed";
  } else if (err instanceof Error) {
    errorMessage = err.message;
  }

  // Log the error with full details
  errorLogger.error(
    {
      err,
      status,
      path: c.req.path,
      method: c.req.method,
      url: c.req.url,
      userAgent: c.req.header("user-agent"),
      ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
    },
    `HTTP ${status} Error: ${errorMessage}`
  );

  // Return appropriate response
  return c.json(
    {
      error: errorMessage,
      ...(isDevelopment && err instanceof Error && {
        message: err.message,
        stack: err.stack
      }),
      ...(err instanceof ZodError && {
        details: err.errors
      }),
    },
    status as any
  );
};
