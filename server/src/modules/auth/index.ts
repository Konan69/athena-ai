import { betterAuth } from "better-auth";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "../../config/env";
import db from "../../db";
import { createAuthMiddleware } from "better-auth/api";
import { library } from "@/src/db/schemas";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  appName: "Athena AI",
  trustedOrigins: ["http://localhost:3000", env.CLIENT_URL],
  secret: env.BETTER_AUTH_SECRET,
  // secondaryStorage: {
  //   // TODO: add redis adapter
  // },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      accessType: "offline",
      prompt: "select_account consent" as any,
      scope: ["email", "profile"],
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-up") || ctx.path.startsWith("/sign-in")) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          try {
            // Automatically create library for new user
            await db.insert(library).values({
              userId: newSession.user.id,
            });
            console.log(`Library created for user: ${newSession.user.id}`);
          } catch (error) {
            console.error("Failed to create library:", error);
          }
        }
      }
    }),
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
