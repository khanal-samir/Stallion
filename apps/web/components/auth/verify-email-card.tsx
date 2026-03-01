"use client";

import { cn } from "@/lib/utils";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyEmail } from "@/lib/auth-client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sileo } from "sileo";

export function VerifyEmailCard({ className, ...props }: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const message = searchParams.get("message");
  const [isVerifying, setIsVerifying] = useState(!!token);

  useEffect(() => {
    if (!token) return;
    async function verify() {
      const { error } = await verifyEmail({ query: { token: token! } });
      setIsVerifying(false);
      if (error) {
        sileo.error({
          title: "Verification failed",
          description: `${error.message}`,
        });
        router.push("/signup");
        return;
      }
      sileo.success({
        title: "Email verified",
        description: "Your email has been verified successfully.",
      });
      router.push("/login");
    }

    verify();
  }, [token, router]);

  const title =
    message === "check-email"
      ? "Check your email"
      : isVerifying
        ? "Verifying email..."
        : "Email verified";

  const description =
    message === "check-email"
      ? "We've sent a verification link to your email address."
      : isVerifying
        ? "Please wait while we verify your email."
        : "Your email has been verified. You can now sign in.";

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="hover:shadow-sm transition-shadow duration-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-foreground hover:underline text-sm cursor-pointer">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
