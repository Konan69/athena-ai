import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "../../config/env";
import db from "../../db";
import { library } from "@/src/db/schemas";
import { getActiveOrganization } from "./authService";
import { sql } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  logger: {
    level: "info",
  },
  plugins: [
    organization({
      // TODO: Implement email sending for invitations
      // sendInvitationEmail: async (data) => {
      //   const inviteLink = `${env.CLIENT_URL}/invitations/${data.id}/accept`;
      //   await sendOrganizationInvitation({
      //     email: data.email,
      //     invitedByUsername: data.inviter.user.name,
      //     invitedByEmail: data.inviter.user.email,
      //     teamName: data.organization.name,
      //     inviteLink
      //   });
      // },
      organizationCreation: {
        afterCreate: async ({ organization, member, user }, request) => {
          try {
            // TODO: do this during onboarding
            console.log("creating org Lib")
            await db.insert(library).values({
              organizationId: organization.id,
            });
          } catch (error) {
            console.error("Failed to create organization index:", error, organization.id);
          }
          // Run custom logic after organization is created
          // e.g., create default resources, send notifications
        }
      },
      // TODO: Implement organization deletion hooks
      organizationDeletion: {
        beforeDelete: async (data, request) => {

        },
        afterDelete: async (data, request) => {
          console.log("Deleting organization:", data.organization.id);
          try {
            // Optional: Get count first
            const countResult = await db.execute(
              sql`SELECT COUNT(*) as count FROM mastra_vectors_company_vectors 
        WHERE metadata->>'organizationId' = ${data.organization.id}`
            );

            const vectorCount = countResult.rows[0]?.count || 0;
            console.log(`Found ${vectorCount} vectors to delete for org ${data.organization.id}`);

            // Delete all vectors for this org
            const deleteResult = await db.execute(
              sql`DELETE FROM mastra_vectors_company_vectors 
        WHERE metadata->>'organizationId' = ${data.organization.id}`
            );

            console.log(`Successfully deleted ${deleteResult.rowCount} vectors`);

          } catch (error) {
            console.error("Failed to delete organization vectors:", error, data.organization.id);
          }
        }
      },
    }),
  ],
  appName: "Athena AI",
  trustedOrigins: ["http://localhost:3000", env.CLIENT_URL],
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      accessType: "offline",
      prompt: "select_account consent" as any,
      scope: ["email", "profile"],
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const activeOrganization = await getActiveOrganization({ userId: session.userId })
          return {
            data: {
              ...session,
              activeOrganizationId: activeOrganization?.id
            }
          }
        }
      }
    }
  },
  onAPIError: {
    throw: true,
    onError: (error, ctx) => {
      // Custom error handling
      console.error("Auth error:", error);
      console.log(ctx);
    },
    errorURL: "/api/auth/error",
  },
});
