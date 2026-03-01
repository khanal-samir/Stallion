"use client";

import { cn } from "@/lib/utils";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyEmail } from "@/lib/auth-client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { sileo } from "sileo";

export function VerifyEmailCard({ className, ...props }: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const message = searchParams.get("message");

  useEffect(() => {
    if (!token) return;
    async function verify() {
      const { error } = await verifyEmail({ query: { token: token! } });
      if (error) {
        sileo.error({
          title: "Verification failed",
          description: (
            <h1 className="text-center font-bold">
              {error.statusText}: {error.message}
            </h1>
          ),
        });
        router.push("/signup");
        return;
      }
    }

    verify();
  }, [token, router]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Email verified</CardTitle>
          <CardDescription>
            {message === "check-email"
              ? "Please check your email to verify your account."
              : "Your email has been verified. You can now sign in."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-foreground hover:underline text-sm">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
