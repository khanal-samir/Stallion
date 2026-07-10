import { z } from "zod";

export const apiEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    WEB_URL: z.string().url("WEB_URL must be a valid URL"),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
    RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
    RESEND_FROM_EMAIL: z.string(),
    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
    SEQUENCE_LIVE_SEND_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .default("false")
      .transform((value) => value === "true"),
    GROQ_API_KEY: z.string().optional(),
  })
  .strict();

export const webEnvSchema = z
  .object({
    NEXT_PUBLIC_API_URL: z.string().url("NEXT_PUBLIC_API_URL must be a valid URL"),
  })
  .strict();

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
