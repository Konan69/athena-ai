import { createTRPCRouter, protectedProcedure, publicProcedure } from "./base";
import { chatProcedures } from "../modules/chat/routes/procedures";
import { libraryProcedures } from "../modules/library/routes/procedures";
import { EventService } from "../modules/events/event.service";
import { type TrainingEvent } from "../modules/RAG/events";

// NOTE: DO NOT = USE IMPORT ALIAS IN TRPC ROUTER FILES
// E.G. import { anything } from "@src/server/trpc/index";
// THIS WILL CAUSE TYPE ERRORS IN THE CLIENT.
// USE RELATIVE IMPORT INSTEAD
// E.G. import { something } from "../modules/chat/routes/procedures";

export const appRouter = createTRPCRouter({
  chat: chatProcedures,
  library: libraryProcedures,
  // SSE subscription for all RAG events for current user (global toast style)
  trainingEvents: protectedProcedure.subscription(async function* ({ ctx }) {
    const userId = ctx.user.id;
    const queue: TrainingEvent[] = [];
    const unsub = await EventService.instance.subscribeUser(userId, (evt: TrainingEvent) => {
      queue.push(evt);
    });
    try {
      while (true) {
        const next = queue.shift();
        if (next) {
          yield next;
        } else {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    } finally {
      await unsub();
    }
  }),

  hello: publicProcedure.query(({ ctx }) => {
    // TODO: MAKE GENERIC LOGGER, current impl is hono native
    // ctx.logger.info("Hello, world!");
    return { greeting: "Hello, world!" };
  }),
});

export type AppRouter = typeof appRouter;
