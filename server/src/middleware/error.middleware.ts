import { Context } from "hono";
import { Next } from "hono/types";
import { createMiddleware } from "hono/factory";
import { ZodError } from "zod";

export const errorHandler = createMiddleware(async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    // Zod validation errors
    const logger = c.var;
    if (err instanceof ZodError) {
      logger.error(err, "Validation failed");
      c.json(
        {
          error: "Validation failed",
          message: err.message,
        },
        400
      );
      return;
    }

    logger.error(err, "Internal server error");
    // Generic error fallback
    c.json({
      error: "Internal server error",
    });
  }
});
