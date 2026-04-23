"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles, Wand2, Check } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function FeatureDemoAI() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll(".ai-item");

    const ctx = gsap.context(() => {
      gsap.from(items, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-lg mx-auto">
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-xl space-y-4">
        {/* Header */}
        <div className="ai-item flex items-center gap-2 pb-3 border-b border-border/30">
          <Wand2 className="size-4 text-primary" />
          <span className="text-sm font-semibold">AI Email Draft</span>
        </div>

        {/* Context */}
        <div className="ai-item space-y-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Contact Context</div>
          <div className="flex flex-wrap gap-2">
            {["Sarah Chen", "Head of Sales", "TechFlow", "Previously opened 3 emails"].map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] text-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Generated Email */}
        <div className="ai-item rounded-xl bg-muted/50 border border-border/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary animate-pulse" />
            <span className="text-[10px] font-medium text-primary">Generated just now</span>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-3/4 rounded bg-foreground/10" />
            <div className="h-3 w-full rounded bg-foreground/5" />
            <div className="h-3 w-5/6 rounded bg-foreground/5" />
            <div className="h-3 w-4/5 rounded bg-foreground/5" />
            <div className="h-3 w-2/3 rounded bg-foreground/10" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Check className="size-3 text-green-500" />
            <span>Personalized with 4 contact data points</span>
          </div>
        </div>

        {/* Tone Selector */}
        <div className="ai-item flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Tone:</span>
          {["Professional", "Friendly", "Bold"].map((tone, i) => (
            <span
              key={tone}
              className={`px-2 py-0.5 rounded-full text-[10px] cursor-pointer transition-colors ${
                i === 0
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground border border-border/30 hover:bg-muted/80"
              }`}
            >
              {tone}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
