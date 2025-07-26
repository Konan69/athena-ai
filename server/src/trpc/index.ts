// src/config/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "../modules/auth";
import { logger } from "../config/logger";
import { APP } from "../types";
import { Context } from "hono";

export type TRPCContext = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
  req: Request;
  logger: typeof logger;
};

export const createTRPCContext = (opts: any, c: Context<APP>) => {
  return {
    user: c.var.user,
    session: c.var.session,
    req: c.req,
    logger,
  };
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});
const publicProcedure = t.procedure;

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

export const appRouter = t.router({
  hello: publicProcedure.query(({ ctx }) => {
    // TODO: MAKE GENERIC LOGGER, current impl is hono native
    // ctx.logger.info("Hello, world!");
    return { greeting: "Hello, world!" };
  }),
});

export type AppRouter = typeof appRouter;
