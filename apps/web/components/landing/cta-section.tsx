import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="rounded-2xl border border-border/50 bg-muted/30 p-12 md:p-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Ready to close more deals?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Start your free account today. No credit card required.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="cursor-pointer h-11 px-6 text-base">
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
