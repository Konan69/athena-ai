import { betterAuth } from "better-auth";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "../../config/env";
import db from "../../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
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
