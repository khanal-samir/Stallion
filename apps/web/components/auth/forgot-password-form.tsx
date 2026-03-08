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
import { requestPasswordResetSchema, type RequestPasswordResetInput } from "@workspace/validators";
import { useRequestPasswordReset } from "@/hooks/queries/use-auth";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const { mutate: requestPasswordResetMutation, isPending: isRequestPasswordResetPending } =
    useRequestPasswordReset();
  const [isPending, startTransition] = useTransition();
  const form = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: RequestPasswordResetInput) => {
    requestPasswordResetMutation(data, {
      onSuccess: () => {
        startTransition(() => router.push("/login"));
      },
    });
  };

  const isFormPending = isRequestPasswordResetPending || isPending;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="hover:shadow-sm transition-shadow duration-200">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">Forgot password</CardTitle>
          <CardDescription>Enter your email and we&apos;ll send you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        disabled={isFormPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isFormPending}>
                {isRequestPasswordResetPending
                  ? "Sending..."
                  : isPending
                    ? "Redirecting..."
                    : "Send reset link"}
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
