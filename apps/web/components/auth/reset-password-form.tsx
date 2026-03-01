"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordFormSchema, type ResetPasswordFormInput } from "@workspace/validators";
import { resetPassword } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { sileo } from "sileo";

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isPending, startTransition] = useTransition();

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormInput) => {
    if (!token) {
      sileo.error({
        title: "Invalid Token",
        description: "The password reset token is missing or invalid.",
      });
      return;
    }

    const { error } = await resetPassword({
      newPassword: data.password,
      token,
    });

    if (error) {
      sileo.error({
        title: "Error",
        description: (
          <h1 className="text-center font-bold">
            {error.statusText}: {error.message}
          </h1>
        ),
      });
      return;
    }

    sileo.success({
      title: "Password reset",
      description: "Your password has been successfully reset.",
    });
    startTransition(() => router.push("/login"));
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter new password"
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-muted-foreground hover:text-foreground text-sm">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
