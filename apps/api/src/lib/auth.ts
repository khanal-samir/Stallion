import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { db } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { env } from "../config/env.js";
import { sendEmail } from "./email.js";

function getTokenFromAuthUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const queryToken = parsedUrl.searchParams.get("token");
    if (queryToken) {
      return queryToken;
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    return pathParts.at(-1) ?? null;
  } catch {
    return null;
  }
}

const authSchema = {
  user: schema.user,
  session: schema.session,
  account: schema.account,
  verification: schema.verification,
};

export const auth = betterAuth({
  rateLimit: {
    enabled: true,
    window: 60, // reset every 60 seconds
    max: 5, // max requests in the window
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
    sendResetPassword: async ({ user, url }) => {
      const token = getTokenFromAuthUrl(url);
      const resetUrl = token
        ? `${env.WEB_URL}/reset-password?token=${encodeURIComponent(token)}`
        : `${env.WEB_URL}/reset-password`;

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
    disableCSRFCheck: env.NODE_ENV === "development",
  },
  trustedOrigins: [env.WEB_URL],
  plugins: [openAPI()],
});

//  Better Auth automatically:
// 1. Reads session token from cookie
// 2. Decrypts/verifies token using BETTER_AUTH_SECRET
// 3. If cookieCache valid (< 5 min) → use cached data
// 4. Else → query database for session
// 5. Check if session expired (> 30 days old)
// 6. If active recently (< 24hrs) → extend expiry
