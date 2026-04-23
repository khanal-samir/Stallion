"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { Particles } from "@workspace/ui/components/ui/particles";
import { MouseGlow } from "./mouse-glow";
import { FloatingCard } from "./floating-card";
import { BarChart3, Mail, Building2, Calendar, Sparkles } from "lucide-react";

function PipelineMiniCard() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
        <BarChart3 className="size-3" />
        Pipeline
      </div>
      <div className="flex gap-1.5">
        {["bg-primary/20", "bg-primary/15", "bg-primary/10", "bg-primary/25"].map((color, i) => (
          <div key={i} className="flex-1 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-muted" />
            {[...Array(3)].map((_, j) => (
              <div key={j} className={`h-8 rounded-md ${color} border border-border/20`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactMiniCard() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold">
          JD
        </div>
        <div>
          <div className="text-xs font-medium">John Doe</div>
          <div className="text-[10px] text-muted-foreground">VP Sales, Acme</div>
        </div>
        <div className="ml-auto px-1.5 py-0.5 rounded-full bg-primary/10 text-[9px] font-medium text-primary">
          Qualified
        </div>
      </div>
      <div className="space-y-1.5">
        {[
          { icon: Mail, text: "john@acme.com" },
          { icon: Building2, text: "Acme Corp" },
          { icon: Calendar, text: "Last contacted 2d ago" },
        ].map((item) => (
          <div
            key={item.text}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
          >
            <item.icon className="size-3" />
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailMiniCard() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
        <Mail className="size-3" />
        Sequence Step 2
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-3/4 rounded bg-foreground/10" />
        <div className="h-2 w-full rounded bg-foreground/5" />
        <div className="h-2 w-5/6 rounded bg-foreground/5" />
        <div className="h-2 w-2/3 rounded bg-foreground/10" />
      </div>
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3 text-primary" />
        <span className="text-[9px] text-primary font-medium">AI Draft</span>
      </div>
    </div>
  );
}

export function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 });

      if (headlineRef.current) {
        tl.from(headlineRef.current, {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        });
      }

      if (subheadRef.current) {
        tl.from(
          subheadRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.5",
        );
      }

      if (ctaRef.current) {
        tl.from(
          ctaRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          "-=0.4",
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-4 overflow-hidden">
      {/* Particles Background */}
      <Particles
        className="absolute inset-0"
        quantity={60}
        staticity={40}
        ease={60}
        size={0.5}
        color="hsl(var(--primary))"
      />

      {/* Mouse Glow */}
      <MouseGlow className="hidden md:block" color="hsl(var(--primary))" size={700} opacity={0.1} />

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Headline */}
          <h1
            ref={headlineRef}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95]"
          >
            Turn your contacts
            <br />
            <span className="text-primary">into revenue</span>
          </h1>

          {/* Subheadline */}
          <p
            ref={subheadRef}
            className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            The CRM that manages your pipeline, automates your outreach, and drafts personalized
            emails with AI — so you can focus on closing.
          </p>

          {/* CTAs */}
          <div
            ref={ctaRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Button asChild size="lg" className="cursor-pointer h-12 px-8 text-base">
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="cursor-pointer h-12 px-8 text-base"
            >
              <Link href="#features">See Features</Link>
            </Button>
          </div>
        </div>

        {/* Floating Cards — Desktop */}
        <div className="hidden lg:block relative h-64 mt-16 max-w-5xl mx-auto">
          <div className="absolute top-0 right-[5%] w-56">
            <FloatingCard floatDuration={3.5} floatDelay={0} floatDistance={12}>
              <PipelineMiniCard />
            </FloatingCard>
          </div>

          <div className="absolute bottom-0 left-[8%] w-56">
            <FloatingCard floatDuration={4} floatDelay={0.5} floatDistance={10}>
              <ContactMiniCard />
            </FloatingCard>
          </div>

          <div className="absolute top-[20%] left-[35%] w-52">
            <FloatingCard floatDuration={3} floatDelay={1} floatDistance={14}>
              <EmailMiniCard />
            </FloatingCard>
          </div>
        </div>

        {/* Floating Cards — Mobile (stacked below text) */}
        <div className="lg:hidden mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto">
          <FloatingCard floatDuration={3.5} floatDelay={0} floatDistance={8}>
            <PipelineMiniCard />
          </FloatingCard>
          <FloatingCard floatDuration={4} floatDelay={0.3} floatDistance={8}>
            <ContactMiniCard />
          </FloatingCard>
          <FloatingCard floatDuration={3} floatDelay={0.6} floatDistance={8}>
            <EmailMiniCard />
          </FloatingCard>
        </div>
      </div>
    </section>
  );
}
