import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "../../../config/env";
import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: ["http://localhost:3000"],
  secret: env.BETTER_AUTH_SECRET,
  // secondaryStorage: {
  //   // Your implementation here
  // },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectURI: "http://localhost:3000",
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
