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

// import type { ErrorHandler } from "hono";
// import type { ContentfulStatusCode } from "hono/utils/http-status";

// import { INTERNAL_SERVER_ERROR, OK } from "../http-status-codes.js";

// const onError: ErrorHandler = (err, c) => {
//   const currentStatus =
//     "status" in err ? err.status : c.newResponse(null).status;
//   const statusCode =
//     currentStatus !== OK
//       ? (currentStatus as ContentfulStatusCode)
//       : INTERNAL_SERVER_ERROR;
//   // eslint-disable-next-line node/prefer-global/process
//   const env = c.env?.NODE_ENV || process.env?.NODE_ENV;
//   return c.json(
//     {
//       message: err.message,

//       stack: env === "production" ? undefined : err.stack,
//     },
//     statusCode
//   );
// };

// export default onError;
