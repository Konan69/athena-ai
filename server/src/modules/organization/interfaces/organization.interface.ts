export interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string;
	createdAt: string;
	metadata?: string;
}

export interface Member {
	id: string;
	userId: string;
	organizationId: string;
	role: "owner" | "admin" | "member";
	createdAt: string;
}

export interface Invitation {
	id: string;
	organizationId: string;
	email: string;
	role: string;
	status: "pending" | "accepted" | "rejected";
	expiresAt: string;
	inviterId: string;
}

export interface CreateOrganizationRequest {
	name: string;
	slug: string;
	logo?: string;
}

export interface InviteMemberRequest {
	email: string;
	role: "member" | "admin";
}

export interface AcceptInvitationRequest {
	invitationId: string;
	userId?: string;
}




