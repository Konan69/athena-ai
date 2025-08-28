// src/modules/chat/routes/procedures.ts
import {
  createTRPCRouter,
  protectedProcedure,
} from "../../../trpc/base";
import { chatService } from "../chat.service";
import { z } from "zod";

export const chatProcedures = createTRPCRouter({
  getChats: protectedProcedure.query(async ({ ctx }) => {
    const chats = await chatService.getChats({
      userId: ctx.user.id,
      organizationId: ctx.activeOrganizationId,
    });
    return chats;
  }),
  getChatMessages: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const messages = await chatService.getChatMessages({
        userId: ctx.user.id,
        organizationId: ctx.activeOrganizationId,
        threadId: input.threadId,
      });
      return messages;
    }),
  renameChat: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        title: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await chatService.renameChat({
        userId: ctx.user.id,
        organizationId: ctx.activeOrganizationId,
        threadId: input.threadId,
        title: input.title,
      });
      return updated;
    }),
  deleteChat: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await chatService.deleteChat({
        userId: ctx.user.id,
        organizationId: ctx.activeOrganizationId,
        threadId: input.threadId,
      });
      return result;
    }),
});
