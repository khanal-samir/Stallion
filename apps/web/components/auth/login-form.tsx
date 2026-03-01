"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FieldSeparator } from "@/components/ui/field-separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInInput } from "@workspace/validators";
import { signIn } from "@/lib/auth-client";
import { useGoogleAuth } from "@/hooks/use-auth";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { sileo } from "sileo";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const { initiateGoogleLogin } = useGoogleAuth();
  const [isNavigating, startTransition] = useTransition();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInInput) => {
    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
      rememberMe: true,
    });

    if (error) {
      sileo.error({
        title: "Error",
        description: `${error.message}`,
      });
      return;
    }

    sileo.success({ title: "Signed in", description: "You have successfully signed in." });
    startTransition(() => {
      router.push("/dashboard");
    });
  };

  const isSubmitting = form.formState.isSubmitting;
  const isPending = isSubmitting || isNavigating;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="hover:shadow-sm transition-shadow duration-200">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Login with your Google account or email</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <GoogleAuthButton
                text="Login with Google"
                onClick={initiateGoogleLogin}
                disabled={isPending}
              />

              <FieldSeparator>Or continue with</FieldSeparator>

              {form.formState.errors.root && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  {form.formState.errors.root.message}
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:underline font-medium cursor-pointer"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isSubmitting ? "Signing in..." : isNavigating ? "Redirecting..." : "Sign In"}
              </Button>

              <FormDescription className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-foreground underline-offset-4 hover:underline cursor-pointer"
                >
                  Sign up
                </Link>
              </FormDescription>
            </form>
          </Form>
        </CardContent>
      </Card>

      <p className="px-2 text-center text-xs text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-foreground cursor-pointer"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-foreground cursor-pointer"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
