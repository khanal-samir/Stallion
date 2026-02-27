import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { db } from "@workspace/db/client";
import * as schema from "@workspace/db/schema";
import { env } from "../config/env.js";
import { sendEmail } from "./email.js";

export const auth = betterAuth({
  rateLimit: {
    enabled: true,
    window: 60, // reset every 60 seconds
    max: 5, // max requests in the window
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 6,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `<p>Click the link below to reset your password:</p><a href="${url}">${url}</a>`,
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
      void sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `<p>Click the link below to verify your email address:</p><a href="${url}">${url}</a>`,
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
  trustedOrigins: [env.WEB_URL],
  plugins: [openAPI()],
});
