import type { RequestPasswordResetInput, SignInInput, SignUpInput } from "@workspace/validators";
import { authClient, type AuthSession } from "@/lib/auth-client";
import { toBetterAuthError } from "@/lib/error";

type ResetPasswordWithTokenInput = {
  password: string;
  token: string;
};

export async function getAuthSession(): Promise<AuthSession | null> {
  const { data, error } = await authClient.getSession();
  if (error && error.status !== 401) {
    throw toBetterAuthError(error, "Failed to fetch session");
  }

  return data ?? null;
}

export async function signInWithEmail(input: SignInInput) {
  const { data, error } = await authClient.signIn.email({
    email: input.email,
    password: input.password,
    rememberMe: true,
  });
  if (error) throw toBetterAuthError(error, "Failed to sign in");

  return data;
}

export async function signUpWithEmail(input: SignUpInput) {
  const { data, error } = await authClient.signUp.email({
    name: input.name,
    email: input.email,
    password: input.password,
  });
  if (error) throw toBetterAuthError(error, "Failed to create account");

  return data;
}

export async function signOutCurrentSession() {
  const { data, error } = await authClient.signOut();
  if (error) throw toBetterAuthError(error, "Failed to sign out");

  return data;
}

export async function requestPasswordResetLink(input: RequestPasswordResetInput) {
  const { data, error } = await authClient.requestPasswordReset({
    email: input.email,
  });
  if (error) throw toBetterAuthError(error, "Failed to send reset link");

  return data;
}

export async function resetPasswordWithToken(input: ResetPasswordWithTokenInput) {
  const { data, error } = await authClient.resetPassword({
    newPassword: input.password,
    token: input.token,
  });
  if (error) throw toBetterAuthError(error, "Failed to reset password");

  return data;
}

export async function verifyEmailToken(token: string) {
  const { data, error } = await authClient.verifyEmail({ query: { token } });
  if (error) throw toBetterAuthError(error, "Failed to verify email");

  return data;
}
