import { apiEnvSchema } from "@workspace/validators/schemas/env";

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  WEB_URL: process.env.WEB_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  SEQUENCE_LIVE_SEND_ENABLED: process.env.SEQUENCE_LIVE_SEND_ENABLED,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  INTEGRATION_LIVE_FETCH_ENABLED: process.env.INTEGRATION_LIVE_FETCH_ENABLED,
  INTEGRATION_TOKEN_SECRET: process.env.INTEGRATION_TOKEN_SECRET,
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
  MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID,
  POSTHOG_API_HOST: process.env.POSTHOG_API_HOST,
  CALENDLY_API_HOST: process.env.CALENDLY_API_HOST,
};

const parsedEnv = apiEnvSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => {
      const key = issue.path.length > 0 ? issue.path.join(".") : "env";
      return `${key}: ${issue.message}`;
    })
    .join("\n");

  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsedEnv.data;
export type Env = typeof env;
