"use client";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/ui/form";
import { Input } from "@workspace/ui/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormInput,
} from "@workspace/validators/schemas/auth";
import { useResetPassword } from "@/hooks/queries/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { mutate: resetPasswordMutation, isPending: isResetPasswordPending } = useResetPassword();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: ResetPasswordFormInput) => {
    if (!token) {
      toast.error("Invalid Token", {
        description: "The password reset token is missing or invalid.",
      });
      return;
    }

    resetPasswordMutation(
      {
        password: data.password,
        token,
      },
      {
        onSuccess: () => {
          startTransition(() => router.push("/login"));
        },
      },
    );
  };

  const isFormPending = isResetPasswordPending || isPending;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="hover:shadow-sm transition-shadow duration-200">
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
                        disabled={isFormPending}
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
                        disabled={isFormPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isFormPending}>
                {isResetPasswordPending
                  ? "Resetting..."
                  : isPending
                    ? "Redirecting..."
                    : "Reset password"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
