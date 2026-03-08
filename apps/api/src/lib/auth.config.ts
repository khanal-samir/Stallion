import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client.js";
import * as schema from "@/db/schema/index.js";
import { env } from "@/config/env.config.js";
import { sendEmail } from "./email.js";
import { logger } from "@/config/logger.config.js";
import { getTokenFromAuthUrl } from "@/helpers/get-token-from-url.js";
import { plugins } from "./auth-plugins.js";

const authSchema = {
  user: schema.user,
  session: schema.session,
  account: schema.account,
  verification: schema.verification,
  workspaces: schema.workspaces,
  workspaceMembers: schema.workspaceMembers,
  workspaceInvites: schema.workspaceInvites,
};

export const auth = betterAuth({
  rateLimit: {
    enabled: true,
    window: 60, // reset every 60 seconds
    max: 100, // max requests in the window
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 6,
    autoSignIn: false,
    // always return success response to prevent email enumeration attacks
    sendResetPassword: async ({ user, url }) => {
      const token = getTokenFromAuthUrl(url);
      const resetUrl = token
        ? `${env.WEB_URL}/reset-password?token=${encodeURIComponent(token)}`
        : `${env.WEB_URL}/reset-password`;

      const isVerified = await db.query.user.findFirst({
        where: (userTable, { eq }) => eq(userTable.id, user.id),
        columns: { emailVerified: true },
      });

      if (!isVerified?.emailVerified) {
        logger.warn(`Attempt to send reset password email to unverified user: ${user.email}`);
        return;
      }

      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `<p>Click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const token = getTokenFromAuthUrl(url);
      const verifyUrl = token
        ? `${env.WEB_URL}/verify-email?token=${encodeURIComponent(token)}`
        : `${env.WEB_URL}/verify-email`;

      void sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `<p>Click the link below to verify your email address:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, //session expires in 30 days
    updateAge: 60 * 60 * 24, // session is updated every 24 hours if the user is active
    cookieCache: {
      // enables cookie caching for 5 minutes to reduce database lookups
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
    disableCSRFCheck: env.NODE_ENV === "development", // for postman
  },
  trustedOrigins: [env.WEB_URL],
  plugins,
});
