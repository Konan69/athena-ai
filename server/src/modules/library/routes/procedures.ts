import { createTRPCRouter, protectedProcedure } from "../../../trpc/base";
import { createLibraryItemSchema, presignedUrlSchema } from "../libraryValidator";
import { libraryService } from "../libraryService";

export const libraryProcedures = createTRPCRouter({
  createLibraryItem: protectedProcedure
    .input(createLibraryItemSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.activeOrganizationId;
      const item = await libraryService.createLibraryItem(orgId, input);
      return item;
    }),
  getLibraryItems: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.activeOrganizationId;
    const items = await libraryService.getLibraryItems(orgId);
    return items;
  }),

  getPresignedUrl: protectedProcedure.input(presignedUrlSchema)
    .query(async ({ ctx, input }) => {
      const orgId = ctx.activeOrganizationId;
      const url = await libraryService.getPresignedUrl(orgId, input);
      return url;
    }),
});
