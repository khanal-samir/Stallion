import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { toBetterAuthError } from "@/lib/error";
import { QUERY_KEYS } from "@/lib/query-keys";
import type {
  RequestPasswordResetInput,
  SignInInput,
  SignUpInput,
} from "@workspace/validators/schemas/auth";
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

export function useAuthSession() {
  return useQuery({
    queryKey: [QUERY_KEYS.AUTH, QUERY_KEYS.SESSION],
    queryFn: getAuthSession,
    retry: false,
    staleTime: 60 * 1000, // 1 minute -- dont matter since session is catched for 5 min in api
    refetchOnWindowFocus: true,
  });
}

export function useEmailSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignInInput) => signInWithEmail(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AUTH] }); // all auth related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      toast.success("Signed in", { description: "You have successfully signed in." });
    },
  });
}

export function useEmailSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignUpInput) => signUpWithEmail(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AUTH] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AUTH] });
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
      queryClient.cancelQueries({ queryKey: [QUERY_KEYS.AUTH] });
      queryClient.cancelQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      queryClient.setQueryData([QUERY_KEYS.AUTH, QUERY_KEYS.SESSION], null);
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      toast.success("Signed out", { description: "You have been logged out." });
    },
  });
}
