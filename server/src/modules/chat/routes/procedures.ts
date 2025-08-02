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
  getChats: protectedProcedure.query(async ({ ctx }) => {
    const chats = await chatService.getChats(ctx.user.id);
    return chats;
  }),
  createChat: protectedProcedure.mutation(async ({ ctx }) => {
    const chatId = await chatService.createChat(ctx.user.id);
    return chatId;
  }),
  getChatsDrizzle: protectedProcedure.query(async ({ ctx }) => {
    const chats = await chatService.getChatsDrizzle(ctx.user.id);
    return chats;
  }),

  sayHello: publicProcedure.query(async ({ ctx }) => {
    return "Hello, world!";
  }),
});
