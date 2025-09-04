import { createTRPCRouter, protectedProcedure } from "../../../trpc/base";
import { createLibraryItemSchema, presignedUrlSchema } from "../libraryValidator";
import { libraryService, LibraryService } from "../libraryService";

export const createLibraryProcedures = (service: LibraryService = libraryService) => {
  return createTRPCRouter({
    createLibraryItem: protectedProcedure
      .input(createLibraryItemSchema)
      .mutation(async ({ ctx, input }) => {
        const orgId = ctx.activeOrganizationId;
        const item = await service.createLibraryItem(orgId, input);
        return item;
      }),
    getLibraryItems: protectedProcedure.query(async ({ ctx }) => {
      const orgId = ctx.activeOrganizationId;
      const items = await service.getLibraryItems(orgId);
      return items;
    }),

    getPresignedUrl: protectedProcedure.input(presignedUrlSchema)
      .query(async ({ ctx, input }) => {
        const orgId = ctx.activeOrganizationId;
        const url = await service.getPresignedUrl(orgId, input);
        return url;
      }),
  });
};

export const libraryProcedures = createLibraryProcedures();
