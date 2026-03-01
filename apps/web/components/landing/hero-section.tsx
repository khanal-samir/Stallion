import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function DashboardMockup() {
  const columns = [
    { label: "New Lead", count: 12, color: "bg-muted-foreground/20" },
    { label: "Contacted", count: 8, color: "bg-muted-foreground/30" },
    { label: "Meeting Set", count: 5, color: "bg-muted-foreground/20" },
    { label: "Proposal", count: 3, color: "bg-muted-foreground/15" },
    { label: "Closed Won", count: 7, color: "bg-muted-foreground/25" },
  ];

  return (
    <div className="max-w-5xl mx-auto mt-16 relative">
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Browser-style header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-muted-foreground/20" />
            <div className="size-3 rounded-full bg-muted-foreground/20" />
            <div className="size-3 rounded-full bg-muted-foreground/20" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="h-6 w-48 rounded-md bg-muted" />
          </div>
        </div>

        {/* Mock toolbar */}
        <div className="px-6 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-5 w-20 rounded bg-muted" />
            <div className="h-5 w-16 rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-24 rounded-lg bg-primary/10" />
            <div className="h-7 w-7 rounded-lg bg-muted" />
          </div>
        </div>

        {/* Pipeline columns */}
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {columns.map((col) => (
              <div key={col.label} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{col.label}</span>
                  <span className="text-xs text-muted-foreground/60">{col.count}</span>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: Math.min(col.count, 4) }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-16 rounded-lg ${col.color} border border-border/30`}
                    />
                  ))}
                  {col.count > 4 && (
                    <div className="text-xs text-center text-muted-foreground/50">
                      +{col.count - 4} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subtle gradient fade at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center pt-28 pb-16 px-4 overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.3] dark:opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Now in Beta — Start for Free
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
            The CRM that closes
            <br />
            deals, not tabs.
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
            Manage contacts, automate email sequences, and draft personalized emails with AI — built
            for outbound sales teams who move fast.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Button asChild size="lg" className="cursor-pointer h-11 px-6 text-base">
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="cursor-pointer h-11 px-6 text-base"
            >
              <Link href="#features">
                Learn More
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <DashboardMockup />
      </div>
    </section>
  );
}
