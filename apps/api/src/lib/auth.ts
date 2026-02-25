import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@workspace/db/client";
import * as schema from "@workspace/db/schema";
import { sendEmail } from "./email.js";
import { openAPI } from "better-auth/plugins";

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
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength:6,
    autoSignIn:false,
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
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification:true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `<p>Click the link below to verify your email address:</p><a href="${url}">${url}</a>`,
      });
    },
  },
  session: {
  expiresIn: 60 * 60 * 24 * 30, // session lasts 30 days
  updateAge: 60 * 60 * 24, // extend session expiry once per day if user is active
  cookieCache: {
    enabled: true,
    maxAge: 60 * 5, // trust cookie for 5 min before re-checking DB — reduces DB load
  },
},
  trustedOrigins: [process.env.WEB_URL!],
  plugins: [openAPI()],
});
