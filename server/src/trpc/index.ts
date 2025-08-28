import { createTRPCRouter, protectedProcedure, publicProcedure } from "./base";
import { chatProcedures } from "../modules/chat/routes/procedures";
import { libraryProcedures } from "../modules/library/routes/procedures";
import { trainingEvents } from "../../src/modules/RAG";
import { organizationProcedures } from "../modules/organization/routes/procedures";

// NOTE: DO NOT = USE IMPORT ALIAS IN TRPC ROUTER FILES
// E.G. import { anything } from "@src/server/trpc/index";
// THIS WILL CAUSE TYPE ERRORS IN THE CLIENT.
// USE RELATIVE IMPORT INSTEAD
// E.G. import { something } from "../modules/chat/routes/procedures";

export const appRouter = createTRPCRouter({
  chat: chatProcedures,
  library: libraryProcedures,
  // SSE subscription for all RAG events for current user (global toast style)
  trainingEvents: trainingEvents,
  organization: organizationProcedures,

  hello: publicProcedure.query(({ ctx }) => {
    // TODO: MAKE GENERIC LOGGER, current impl is hono native
    // ctx.logger.info("Hello, world!");
    return { greeting: "Hello, world!" };
  }),
});

export type AppRouter = typeof appRouter;
