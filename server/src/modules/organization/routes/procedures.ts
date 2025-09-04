import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "../../../trpc/base";
import * as organizationValidator from "../validators/organizationValidator";
import organizationService from "../organization.service";
import { z } from "zod";

// Reusable input schemas for procedures
const inviteMemberProcInput = organizationValidator.inviteMemberSchema.extend({
	organizationId: z.string().min(1, "Organization ID is required"),
});

export const createOrganizationProcedures = (service = organizationService) => {
	return createTRPCRouter({
		getUserOrganizations: protectedProcedure.query(async ({ ctx }) => {
			const organizations = await service.getUserOrganizations({ userId: ctx.user.id });
			return organizations;
		}),

		createOrganization: protectedProcedure
			.input(organizationValidator.createOrganizationSchema)
			.mutation(async ({ ctx, input }) => {
				const organization = await service.createOrganization({
					...input,
					userId: ctx.user.id,
				});
				return organization;
			}),

		getOrganizationMembers: protectedProcedure
			.input(
				z.object({
					organizationId: z.string().min(1, "Organization ID is required"),
				})
			)
			.query(async ({ ctx, input }) => {
				const members = await service.getOrganizationMembers({
					organizationId: input.organizationId,
					userId: ctx.user.id,
				});
				return members;
			}),

		inviteMember: protectedProcedure
			.input(inviteMemberProcInput)
			.mutation(async ({ ctx, input }) => {
				const result = await service.inviteMember({
					...input,
					userId: ctx.user.id,
				});
				return result;
			}),

		acceptInvitation: publicProcedure
			.input(organizationValidator.acceptInvitationSchema)
			.mutation(async ({ input }) => {
				const result = await service.acceptInvitation({
					invitationId: input.invitationId,
					userId: undefined,
				});
				return result;
			}),
	});
};

export const organizationProcedures = createOrganizationProcedures();
