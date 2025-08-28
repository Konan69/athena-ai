import { z } from "zod";

// ============================================================================
// BASE SCHEMAS (Single source of truth)
// ============================================================================

export const createOrganizationSchema = z.object({
	name: z.string()
		.min(2, "Organization name must be at least 2 characters")
		.max(100, "Organization name must be less than 100 characters")
		.trim(),
	slug: z.string()
		.min(2, "Slug must be at least 2 characters")
		.max(50, "Slug must be less than 50 characters")
		.regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
		.refine(slug => !RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number]), "This slug is reserved"),
	logo: z.string()
		.optional()
		.transform((val) => val === "" ? undefined : val)
		.refine((val) => !val || z.string().url().safeParse(val).success, "Must be a valid URL or empty"),
	keepCurrentActiveOrganization: z.boolean().optional(),
});

export const inviteMemberSchema = z.object({
	email: z.string().email("Must be a valid email address"),
	role: z.enum(["member", "admin"], {
		errorMap: () => ({ message: "Role must be either 'member' or 'admin'" }),
	}),
});

export const acceptInvitationSchema = z.object({
	invitationId: z.string().min(1, "Invitation ID is required"),
});

// ============================================================================
// CONSTANTS
// ============================================================================

export const ORGANIZATION_ROLES = {
	OWNER: 'owner',
	ADMIN: 'admin',
	MEMBER: 'member'
} as const;

export const RESERVED_SLUGS = [
	'admin', 'api', 'www', 'app', 'dashboard', 'settings',
	'profile', 'login', 'signup', 'auth', 'system'
] as const;

export const VALIDATION_RULES = {
	ORG_NAME_MIN: 2,
	ORG_NAME_MAX: 100,
	SLUG_MIN: 2,
	SLUG_MAX: 50,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// ============================================================================
// SERVICE SCHEMAS (Extended with auth data)
// ============================================================================

export const createOrgSchema = createOrganizationSchema.extend({
	userId: z.string().min(1, "User ID is required"),
});

export const inviteMemberServiceSchema = inviteMemberSchema.extend({
	organizationId: z.string().min(1, "Organization ID is required"),
	userId: z.string().min(1, "User ID is required"),
});

export const getMembersSchema = z.object({
	organizationId: z.string().min(1, "Organization ID is required"),
	userId: z.string().min(1, "User ID is required"),
});

// ============================================================================
// PROCEDURE SCHEMAS (For tRPC endpoints)
// ============================================================================

export const inviteMemberProcSchema = inviteMemberSchema.extend({
	organizationId: z.string().min(1, "Organization ID is required"),
});

export const getMembersProcSchema = z.object({
	organizationId: z.string().min(1, "Organization ID is required"),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type InviteMemberServiceInput = z.infer<typeof inviteMemberServiceSchema>;
export type GetMembersInput = z.infer<typeof getMembersSchema>;

export type InviteMemberProcInput = z.infer<typeof inviteMemberProcSchema>;
export type GetMembersProcInput = z.infer<typeof getMembersProcSchema>;


