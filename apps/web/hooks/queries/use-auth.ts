import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { toBetterAuthError } from "@/lib/error";
import { QUERY_KEYS } from "@/lib/query-keys";
import type { RequestPasswordResetInput, SignInInput, SignUpInput } from "@workspace/validators";
import {
  getAuthSession,
  requestPasswordResetLink,
  resetPasswordWithToken,
  signInWithEmail,
  signOutCurrentSession,
  signUpWithEmail,
  verifyEmailToken,
} from "@/services/auth.service";

type ResetPasswordWithTokenInput = {
  password: string;
  token: string;
};

const authSessionQueryKey = [QUERY_KEYS.AUTH, QUERY_KEYS.SESSION] as const;
const authQueryKey = [QUERY_KEYS.AUTH] as const;
const workspacesQueryKey = [QUERY_KEYS.WORKSPACES] as const;

export function useAuthSession() {
  return useQuery({
    queryKey: authSessionQueryKey,
    queryFn: getAuthSession,
    retry: false,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

export function useEmailSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignInInput) => signInWithEmail(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKey });
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
      toast.success("Signed in", { description: "You have successfully signed in." });
    },
  });
}

export function useEmailSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignUpInput) => signUpWithEmail(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKey });
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
      toast.success("Account created", {
        description: "Please check your email to verify your account.",
      });
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (input: RequestPasswordResetInput) => requestPasswordResetLink(input),
    onSuccess: () => {
      toast.success("Reset link sent", {
        description: "Please check your email for the reset link.",
      });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordWithTokenInput) => resetPasswordWithToken(input),
    onSuccess: () => {
      toast.success("Password reset", {
        description: "Your password has been successfully reset.",
      });
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => verifyEmailToken(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKey });
      toast.success("Email verified", {
        description: "Your email has been verified successfully.",
      });
    },
  });
}

export function useGoogleAuth(redirectTo = "/dashboard") {
  const googleAuth = useMutation({
    mutationFn: () =>
      authClient.signIn
        .social({
          provider: "google",
          callbackURL: `${window.location.origin}${redirectTo}`,
        })
        .then(({ error }) => {
          if (error) {
            throw toBetterAuthError(error, "Failed to start Google sign in");
          }
        }),
  });

  return { initiateGoogleLogin: googleAuth.mutateAsync, isPending: googleAuth.isPending };
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOutCurrentSession,
    onSuccess: () => {
      queryClient.cancelQueries({ queryKey: authQueryKey });
      queryClient.cancelQueries({ queryKey: workspacesQueryKey });
      queryClient.setQueryData(authSessionQueryKey, null);
      queryClient.removeQueries({ queryKey: workspacesQueryKey });
      toast.success("Signed out", { description: "You have been logged out." });
    },
  });
}
