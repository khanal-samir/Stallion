"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const columns = [
  { label: "New Lead", count: 4, color: "bg-primary/10" },
  { label: "Contacted", count: 3, color: "bg-primary/15" },
  { label: "Meeting Set", count: 2, color: "bg-primary/10" },
  { label: "Proposal", count: 3, color: "bg-primary/20" },
];

export function FeatureDemoPipeline() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll(".pipeline-card");

    const ctx = gsap.context(() => {
      gsap.from(cards, {
        y: 30,
        opacity: 0,
        duration: 0.6,
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
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-20 rounded-md bg-muted" />
          <div className="flex gap-2">
            <div className="h-7 w-24 rounded-lg bg-primary/10" />
            <div className="h-7 w-7 rounded-lg bg-muted" />
          </div>
        </div>

        {/* Pipeline */}
        <div className="grid grid-cols-4 gap-3">
          {columns.map((col) => (
            <div key={col.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">{col.label}</span>
                <span className="text-[10px] text-muted-foreground/60">{col.count}</span>
              </div>
              <div className="space-y-2">
                {Array.from({ length: col.count }).map((_, i) => (
                  <div
                    key={i}
                    className={`pipeline-card h-14 rounded-lg ${col.color} border border-border/30 p-2`}
                  >
                    <div className="h-2 w-3/4 rounded bg-foreground/10 mb-1" />
                    <div className="h-2 w-1/2 rounded bg-foreground/5" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
