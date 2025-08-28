import db from "@/src/db";
import { desc, eq, and } from "drizzle-orm";
import { member, session } from "@/src/db/schemas";

export async function getActiveOrganization({ userId }: { userId: string }) {
	// Get the most recent session that had an active org
	const lastSession = await db.select().from(session).where(eq(session.userId, userId)).orderBy(desc(session.updatedAt)).limit(1);


	if (lastSession[0]?.activeOrganizationId) {
		// Verify they still have access
		const isMember = await db.select().from(member).where(and(eq(member.userId, userId), eq(member.organizationId, lastSession[0].activeOrganizationId)));

		if (isMember) {
			return { id: lastSession[0].activeOrganizationId };
		}
	}

	// Fallback to first available org
	const firstOrg = await db.select().from(member).where(eq(member.userId, userId)).limit(1);

	return firstOrg[0] ? { id: firstOrg[0].organizationId } : null;
}