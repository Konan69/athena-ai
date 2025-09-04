// src/modules/chat/routes/procedures.ts
import {
  createTRPCRouter,
  protectedProcedure,
} from "../../../trpc/base";
import { chatService, ChatService } from "../chat.service";
import { z } from "zod";

export const createChatProcedures = (service: ChatService = chatService) => {
  return createTRPCRouter({
    getChats: protectedProcedure.query(async ({ ctx }) => {
      const chats = await service.getChats({
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
        const messages = await service.getChatMessages({
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
        const updated = await service.renameChat({
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
        const result = await service.deleteChat({
          userId: ctx.user.id,
          organizationId: ctx.activeOrganizationId,
          threadId: input.threadId,
        });
        return result;
      }),
  });
};

export const chatProcedures = createChatProcedures();
