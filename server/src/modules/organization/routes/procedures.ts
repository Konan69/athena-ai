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

export const organizationProcedures = createTRPCRouter({
	getUserOrganizations: protectedProcedure.query(async ({ ctx }) => {
		const organizations = await organizationService.getUserOrganizations({ userId: ctx.user.id });
		return organizations;
	}),

	createOrganization: protectedProcedure
		.input(organizationValidator.createOrganizationSchema)
		.mutation(async ({ ctx, input }) => {
			const organization = await organizationService.createOrganization({
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
			const members = await organizationService.getOrganizationMembers({
				organizationId: input.organizationId,
				userId: ctx.user.id,
			});
			return members;
		}),

	inviteMember: protectedProcedure
		.input(inviteMemberProcInput)
		.mutation(async ({ ctx, input }) => {
			const result = await organizationService.inviteMember({
				...input,
				userId: ctx.user.id,
			});
			return result;
		}),

	acceptInvitation: publicProcedure
		.input(organizationValidator.acceptInvitationSchema)
		.mutation(async ({ input }) => {
			const result = await organizationService.acceptInvitation({
				invitationId: input.invitationId,
				userId: undefined,
			});
			return result;
		}),
});
