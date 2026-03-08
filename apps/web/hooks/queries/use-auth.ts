import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { signIn, signOut } from "@/lib/auth-client";
import type { RequestPasswordResetInput, SignInInput, SignUpInput } from "@workspace/validators";
import { sileo } from "sileo";
import {
  requestPasswordResetLink,
  resetPasswordWithToken,
  signInWithEmail,
  signUpWithEmail,
  verifyEmailToken,
} from "@/services/auth.service";

type ResetPasswordWithTokenInput = {
  password: string;
  token: string;
};

export function useEmailSignIn() {
  return useMutation({
    mutationFn: (input: SignInInput) => signInWithEmail(input),
    onSuccess: () => {
      sileo.success({ title: "Signed in", description: "You have successfully signed in." });
    },
  });
}

export function useEmailSignUp() {
  return useMutation({
    mutationFn: (input: SignUpInput) => signUpWithEmail(input),
    onSuccess: () => {
      sileo.success({
        title: "Account created",
        description: "Please check your email to verify your account.",
      });
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (input: RequestPasswordResetInput) => requestPasswordResetLink(input),
    onSuccess: () => {
      sileo.success({
        title: "Reset link sent",
        description: "Please check your email for the reset link.",
      });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordWithTokenInput) => resetPasswordWithToken(input),
    onSuccess: () => {
      sileo.success({
        title: "Password reset",
        description: "Your password has been successfully reset.",
      });
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => verifyEmailToken(token),
    onSuccess: () => {
      sileo.success({
        title: "Email verified",
        description: "Your email has been verified successfully.",
      });
    },
  });
}

export function useGoogleAuth(redirectTo = "/dashboard") {
  const initiateGoogleLogin = useCallback(async () => {
    await signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}${redirectTo}`, //callback URL after successful login
    });
  }, [redirectTo]);

  return { initiateGoogleLogin };
}

export function useSignOut(redirectTo = "/login") {
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push(redirectTo);
  }, [router, redirectTo]);

  return { signOut: handleSignOut };
}
