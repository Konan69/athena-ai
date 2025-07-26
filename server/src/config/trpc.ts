// src/config/trpc.ts
import { initTRPC } from "@trpc/server";
import superjson from "superjson";

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure.query(() => {
    return { greeting: "Hello, world!" };
  }),
});

export type AppRouter = typeof appRouter;
