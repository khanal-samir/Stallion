"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const message = searchParams.get("message");

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "pending"
  >(token ? "loading" : "pending");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    const apiUrl =
      process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

    fetch(`${apiUrl}/api/auth/verify-email?token=${token}`, {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage("Verification link is invalid or has expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  if (status === "pending" || message === "check-email") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to your email address. Please
            check your inbox and click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (status === "loading") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verifying email...</CardTitle>
          <CardDescription>
            Please wait while we verify your email address.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verification failed</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="text-foreground hover:underline text-sm"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Email verified</CardTitle>
        <CardDescription>
          Your email has been successfully verified. You can now sign in.
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-center">
        <Link href="/login" className="text-foreground hover:underline text-sm">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
