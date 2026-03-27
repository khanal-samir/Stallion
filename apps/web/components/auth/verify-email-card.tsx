"use client";

import { cn } from "@/lib/utils";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useVerifyEmail } from "@/hooks/queries/use-auth";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export function VerifyEmailCard({ className, ...props }: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mutate: verifyEmail } = useVerifyEmail();
  const token = searchParams.get("token");
  const message = searchParams.get("message");

  useEffect(() => {
    if (!token) return;

    verifyEmail(token, {
      onSuccess: () => {
        router.push("/login");
      },
      onError: () => {
        router.push("/signup");
      },
    });
  }, [token, router, verifyEmail]);

  const title = message === "check-email" ? "Check your email" : "Email verified"; // from signup from

  const description =
    message === "check-email"
      ? "We've sent a verification link to your email address."
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
