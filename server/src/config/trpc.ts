import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { createLogger } from "./logger";

const t = initTRPC
  .context<{
    logger: ReturnType<typeof createLogger>;
  }>()
  .create({
    transformer: superjson,
  });

export const appRouter = t.router({
  hello: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input, ctx }) => {
      ctx.logger.info({ input }, "Hello procedure called");
      return { greeting: `Hello, ${input.name}!` };
    }),
});

export type AppRouter = typeof appRouter;
