//src/trpc/base.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { logger } from "../config/logger";
import { Context } from "hono";
import { APP, AuthUser, AuthSession, ActiveOrganizationId } from "../types";
import { ServiceError, serviceErrorLogger } from "../lib/trpc-errors";
import { ZodError } from "zod";

export type TRPCContext = {
  user: AuthUser;
  session: AuthSession;
  activeOrganizationId: ActiveOrganizationId;
  req: Request;
  logger: typeof logger;
};

export const createTRPCContext = (opts: any, c: Context<APP>) => {
  return {
    user: c.var.user!,
    session: c.var.session!,
    activeOrganizationId: c.var.activeOrganizationId!,
    req: c.req.raw,
    logger,
  } satisfies TRPCContext;
};
export const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Handle Zod validation errors properly
        zodError: error.cause instanceof ZodError
          ? {
            fieldErrors: error.cause.flatten().fieldErrors
          }
          : undefined,
      },
    };
  },

  sse: {
    ping: {
      enabled: true,
      // 20 seconds
      intervalMs: 30_000,
    },
    client: {
      reconnectAfterInactivityMs: 60_000,
    },
  },
});
export const publicProcedure = t.procedure;

// export const errorHandlingMiddleware = t.middleware(async ({ next }) => {
//   try {
//     return await next();
//   } catch (error) {
//     // Let ServiceErrors pass through unchanged - they'll be converted to TRPCError by createTRPCError
//     if (error instanceof ServiceError) {
//       throw error;
//     }

//     // Let tRPC errors pass through unchanged
//     if (error instanceof TRPCError) {
//       throw error;
//     }


//     serviceErrorLogger.error({
//       msg: 'Unexpected error in tRPC procedure',
//       error: error instanceof Error ? error.message : String(error),
//       stack: error instanceof Error ? error.stack : undefined,
//       cause: error instanceof Error ? error.cause : undefined,
//     });
//     throw new TRPCError({
//       code: 'INTERNAL_SERVER_ERROR',
//       message: 'An unexpected error occurred',
//       cause: error,
//     });
//   }
// });


export const protectedProcedure = publicProcedure
  .use(({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        session: ctx.session,// TODO:acc valida
        activeOrganizationId: ctx.activeOrganizationId!,
      },
    });
  })
// .use(errorHandlingMiddleware);

export const createTRPCRouter = t.router;
