// src/modules/chat/routes/procedures.ts
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  t,
} from "../../../trpc/base";
import * as chatValidator from "../validators/chatValidator";
import { chatService } from "../chat.service";

import { z } from "zod";

export const chatProcedures = createTRPCRouter({
  createChat: protectedProcedure.mutation(async ({ ctx }) => {
    const chat = await chatService.createChat(ctx.user.id);
    return chat;
  }),
  getChats: protectedProcedure.query(async ({ ctx }) => {
    const chats = await chatService.getChatsDrizzle(ctx.user.id);
    return chats;
  }),
  getChatMessages: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const messages = await chatService.getChatMessages(
        ctx.user.id,
        input.threadId
      );
      return messages;
    }),
  sayHello: publicProcedure.query(async ({ ctx }) => {
    return "Hello, world!";
  }),
});
