import { eq, and, desc, count, sql } from "drizzle-orm";
import db from "../../db";
import { organization, member, invitation, session } from "../../db/schemas";
import { user } from "../../db/schemas/user";
import { auth } from "../auth";
import { ServiceErrors } from "../../lib/trpc-errors";
import type { Database } from "../../types";
import {
	createOrgSchema,
	inviteMemberServiceSchema,
	getMembersSchema,
	type CreateOrgInput,
	type InviteMemberServiceInput,
	type GetMembersInput,
	ORGANIZATION_ROLES,
} from "./validators/organizationValidator";

class OrganizationService {
	private db: Database;

	constructor(database: Database = db) {
		this.db = database;
	}

	async getUserOrganizations({ userId }: { userId: string }) {
		// todo
		const memberCountSubquery = this.db
			.select({
				organizationId: member.organizationId,
				memberCount: count(member.id).as("memberCount"),
			})
			.from(member)
			.groupBy(member.organizationId)
			.as("memberCounts");

		const userOrganizations = await this.db
			.select({
				id: organization.id,
				name: organization.name,
				slug: organization.slug,
				logo: organization.logo,
				role: member.role,
				createdAt: organization.createdAt,
				memberCount: memberCountSubquery.memberCount,
			})
			.from(member)
			.innerJoin(organization, eq(member.organizationId, organization.id))
			.leftJoin(memberCountSubquery, eq(organization.id, memberCountSubquery.organizationId))
			.where(eq(member.userId, userId))
			.orderBy(desc(organization.createdAt));

		return userOrganizations;
	}

	async createOrganization(data: CreateOrgInput) {
		const freeSlug = await auth.api.checkOrganizationSlug({
			body: {
				slug: data.slug,
			},
		});

		if (!freeSlug.status) {
			throw ServiceErrors.conflict("Organization slug already taken");
		}

		// Create organization using Better Auth API
		const result = await auth.api.createOrganization({
			body: {
				name: data.name,
				slug: data.slug,
				logo: data.logo,
				userId: data.userId,
				keepCurrentActiveOrganization: data.keepCurrentActiveOrganization,
			},
		});
		if (!result) {
			throw ServiceErrors.conflict("Failed to create organization");
		}

		return result;
	}

	async getOrganizationMembers(data: GetMembersInput) {
		// Get all members with user details in a single query
		const members = await this.db
			.select({
				id: member.id,
				role: member.role,
				createdAt: member.createdAt,
				userId: member.userId,
				userName: user.name,
				userEmail: user.email,
				userImage: user.image,
				// Include a flag to check if the requesting user is a member
				isRequestingUserMember: sql<boolean>`CASE WHEN ${member.userId} = ${data.userId} THEN true ELSE false END`,
			})
			.from(member)
			.innerJoin(user, eq(member.userId, user.id))
			.where(eq(member.organizationId, data.organizationId))
			.orderBy(desc(member.createdAt));

		// Check if user is a member by looking for their userId in the results
		const userIsMember = members.some(member => member.userId === data.userId);

		if (!userIsMember) {
			throw ServiceErrors.forbidden("You must be a member of this organization to view its members");
		}

		// Transform the data to match frontend expectations 
		const transformedMembers = members.map((member) => ({
			id: member.id,
			role: member.role,
			createdAt: member.createdAt,
			user: {
				name: member.userName,
				email: member.userEmail,
				image: member.userImage || undefined,
			},
		}));

		return {
			total: members.length,
			members: transformedMembers,
		};
	}

	async inviteMember(data: InviteMemberServiceInput) {
		// Check if user is a member with invite permissions
		const userMember = await this.db
			.select()
			.from(member)
			.where(and(eq(member.organizationId, data.organizationId), eq(member.userId, data.userId)))
			.limit(1);

		if (userMember.length === 0) {
			throw ServiceErrors.forbidden("You must be a member of this organization to invite others");
		}

		// TODO: Check if user has permission to invite (admin/owner role)
		// For now, allow any member to invite
		if (!userMember[0]) {
			throw ServiceErrors.forbidden("Invalid member record");
		}

		// Create invitation using Better Auth API
		const result = await auth.api.createInvitation({
			body: {
				organizationId: data.organizationId,
				email: data.email,
				role: data.role,
			},
		});

		return result;
	}

	async acceptInvitation(data: { invitationId: string; userId?: string }) {
		// Accept invitation using Better Auth API
		const result = await auth.api.acceptInvitation({
			body: {
				invitationId: data.invitationId,
			},
		});

		return result;
	}

	// TODO: test
	async getActiveOrganization(userId: string) {
		const lastSession = await this.db.select().from(session).where(eq(session.userId, userId)).orderBy(desc(session.updatedAt)).limit(1);

		if (lastSession[0]?.activeOrganizationId) {
			// Verify they still have access
			const isMember = await this.db.select().from(member).where(and(eq(member.userId, userId), eq(member.organizationId, lastSession[0].activeOrganizationId)));

			if (isMember.length > 0) {
				return { id: lastSession[0].activeOrganizationId };
			}
		}

		// Fallback to first available org
		const firstOrg = await this.db.select().from(member).where(eq(member.userId, userId)).limit(1);

		return firstOrg[0] ? { id: firstOrg[0].organizationId } : null;
	}
}

const organizationService = new OrganizationService();

export { OrganizationService };
export default organizationService;