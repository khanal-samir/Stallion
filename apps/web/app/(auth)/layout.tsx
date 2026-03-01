import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: "Authentication — Verio",
  description: "Sign in to your Verio account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left branded panel - hidden on mobile */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-muted flex-col justify-between p-10 relative overflow-hidden">
        {/* Subtle dot pattern background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10">
          <Link
            href="/"
            className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
          >
            <Logo size="lg" className="text-foreground" />
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
            The CRM that closes deals, not tabs.
          </h1>
          <p className="text-muted-foreground text-base lg:text-lg">
            Manage contacts, automate sequences, and close more deals with AI-powered outbound.
          </p>
        </div>

        <div className="relative z-10">
          <div className="border-t border-border pt-6">
            <blockquote className="space-y-3">
              <p className="text-sm leading-relaxed italic text-muted-foreground">
                &ldquo;Verio replaced three tools we were juggling. Sequences alone saved us 10
                hours a week.&rdquo;
              </p>
              <footer className="text-sm">
                <span className="font-medium text-foreground">Sarah Chen</span>
                <span className="text-muted-foreground"> — Head of Sales, TechFlow</span>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 md:px-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
