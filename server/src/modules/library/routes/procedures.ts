import { createTRPCRouter, protectedProcedure } from "../../../trpc/base";
import { createLibraryItemSchema } from "../libraryValidator";
import { libraryService } from "../libraryService";

export const libraryProcedures = createTRPCRouter({
  createLibraryItem: protectedProcedure
    .input(createLibraryItemSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const item = await libraryService.createLibraryItem(userId, input);
      return item;
    }),
  getLibraryItems: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const items = await libraryService.getLibraryItems(userId);
    return items;
  }),
});
