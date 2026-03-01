import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { signIn, signOut } from "@/lib/auth-client";

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
