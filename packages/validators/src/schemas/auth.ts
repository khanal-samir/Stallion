import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const tokenQuerySchema = z.object({
  token: z.string().optional(),
  message: z.string().optional(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

const dateLikeSchema = z.union([z.string(), z.date()]);

export const authUserSchema = z
  .object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string().nullable().optional(),
    emailVerified: z.boolean().optional(),
    image: z.string().nullable().optional(),
    createdAt: dateLikeSchema.optional(),
    updatedAt: dateLikeSchema.optional(),
  })
  .passthrough();

export const authSessionSchema = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    expiresAt: dateLikeSchema.optional(),
    createdAt: dateLikeSchema.optional(),
    updatedAt: dateLikeSchema.optional(),
    token: z.string().optional(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
  })
  .passthrough();

export const sessionResponseSchema = z.union([
  z.object({
    user: authUserSchema,
    session: authSessionSchema,
  }),
  z.object({
    user: z.null(),
    session: z.null(),
  }),
  z.null(),
]);

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type TokenQueryInput = z.infer<typeof tokenQuerySchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
