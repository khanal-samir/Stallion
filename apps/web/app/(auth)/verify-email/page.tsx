import { Suspense } from "react";
import { VerifyEmailCard } from "@/components/auth/verify-email-card";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Loading...
        </div>
      }
    >
      <VerifyEmailCard />
    </Suspense>
  );
}
