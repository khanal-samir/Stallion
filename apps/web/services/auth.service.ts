import type { RequestPasswordResetInput, SignInInput, SignUpInput } from "@workspace/validators";
import {
  requestPasswordReset,
  resetPassword,
  signIn,
  signUp,
  verifyEmail,
} from "@/lib/auth-client";
import { toBetterAuthError } from "@/lib/error";

type ResetPasswordWithTokenInput = {
  password: string;
  token: string;
};

export async function signInWithEmail(input: SignInInput) {
  const { data, error } = await signIn.email({
    email: input.email,
    password: input.password,
    rememberMe: true,
  });

  if (error) throw toBetterAuthError(error, "Failed to sign in");

  return data;
}

export async function signUpWithEmail(input: SignUpInput) {
  const { data, error } = await signUp.email({
    name: input.name,
    email: input.email,
    password: input.password,
  });

  if (error) throw toBetterAuthError(error, "Failed to create account");

  return data;
}

export async function requestPasswordResetLink(input: RequestPasswordResetInput) {
  const { data, error } = await requestPasswordReset({
    email: input.email,
  });

  if (error) throw toBetterAuthError(error, "Failed to send reset link");

  return data;
}

export async function resetPasswordWithToken(input: ResetPasswordWithTokenInput) {
  const { data, error } = await resetPassword({
    newPassword: input.password,
    token: input.token,
  });

  if (error) throw toBetterAuthError(error, "Failed to reset password");

  return data;
}

export async function verifyEmailToken(token: string) {
  const { data, error } = await verifyEmail({ query: { token } });

  if (error) throw toBetterAuthError(error, "Failed to verify email");

  return data;
}
