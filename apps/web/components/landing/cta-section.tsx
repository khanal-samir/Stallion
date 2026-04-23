"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative py-32 px-4 overflow-hidden">
      {/* Subtle radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, hsl(var(--primary) / 0.08), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
          Ready to 10x
          <br />
          your outbound?
        </h2>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
          Join hundreds of sales teams already closing more deals with Stallion.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="cursor-pointer h-12 px-8 text-base">
            <Link href="/signup">
              Start for Free
              <ArrowRight className="size-4 ml-2" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="cursor-pointer h-12 px-8 text-base"
          >
            <Link href="/login">Already have an account?</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
