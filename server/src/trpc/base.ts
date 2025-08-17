//src/trpc/base.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "../modules/auth";
import { logger } from "../config/logger";
import { Context } from "hono";
import { APP } from "../types";
import { authMiddleware } from "../middleware/auth.middleware";

export type TRPCContext = {
  user: typeof auth.$Infer.Session.user;
  session: typeof auth.$Infer.Session.session;
  req: Request;
  logger: typeof logger;
};

export const createTRPCContext = (opts: any, c: Context<APP>) => {
  return {
    user: c.var.user!,
    session: c.var.session!,
    req: c.req.raw,
    logger,
  } satisfies TRPCContext;
};
export const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  sse: {
    ping: {
      enabled: true,
      // 20 seconds
      intervalMs: 15_000,
    },
    client: {
      reconnectAfterInactivityMs: 40_000,
    },
  },
});
export const publicProcedure = t.procedure;

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
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
    },
  });
});

export const createTRPCRouter = t.router;
