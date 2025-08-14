import { betterAuth } from "better-auth";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "../../config/env";
import db from "../../db";

import { createAuthMiddleware } from "better-auth/api";
import { library } from "@/src/db/schemas";
import { RedisService } from "@/src/config/redis";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  // TODO: add organization tenancy [important create org embedding this.vectorStore.createIndex(`org_${orgId}`, 512, 'cosine');]
  appName: "Athena AI",
  trustedOrigins: ["http://localhost:3000", env.CLIENT_URL],
  secret: env.BETTER_AUTH_SECRET,
  // TODO: REVIEW THIS
  // secondaryStorage: {
  //   get: async (key: string) => {
  //     const value = await RedisService.instance.publisher.get(key);
  //     return value ? JSON.parse(value) : null;
  //   },
  //   set: async (key: string, value: any) => {
  //     await RedisService.instance.publisher.set(key, JSON.stringify(value));
  //   },
  //   delete: async (key: string) => {
  //     await RedisService.instance.publisher.del(key);
  //   },
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
            // TODO: do this during onboarding 
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
