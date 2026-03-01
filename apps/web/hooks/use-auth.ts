import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { signIn, signOut } from "@/lib/auth-client";

export function useGoogleAuth(callbackURL = "/dashboard") {
  const initiateGoogleLogin = useCallback(async () => {
    await signIn.social({
      provider: "google",
      callbackURL,
    });
  }, [callbackURL]);

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
