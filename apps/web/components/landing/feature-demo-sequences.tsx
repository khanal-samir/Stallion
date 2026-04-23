"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Mail, Clock, Linkedin, ChevronRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: Mail,
    label: "Email",
    title: "Intro + value prop",
    status: "Sent",
    statusColor: "bg-green-500/10 text-green-600",
  },
  {
    icon: Clock,
    label: "Wait",
    title: "3 days",
    status: "Active",
    statusColor: "bg-primary/10 text-primary",
  },
  {
    icon: Mail,
    label: "Email",
    title: "Follow-up with case study",
    status: "Scheduled",
    statusColor: "bg-muted text-muted-foreground",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    title: "Connection request",
    status: "Pending",
    statusColor: "bg-muted text-muted-foreground",
  },
];

export function FeatureDemoSequences() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll(".sequence-step");

    const ctx = gsap.context(() => {
      gsap.from(items, {
        x: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.12,
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold">Outbound Sequence A</div>
            <div className="text-[11px] text-muted-foreground">4 steps · 50 enrolled</div>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
            Active
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="sequence-step flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/30">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <step.icon className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{step.title}</div>
                <div className="text-[10px] text-muted-foreground">{step.label}</div>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${step.statusColor}`}>
                {step.status}
              </div>
              <ChevronRight className="size-4 text-muted-foreground/40 shrink-0" />
            </div>
          ))}
        </div>

        {/* Schedule Bar */}
        <div className="mt-4 pt-3 border-t border-border/30 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>Mon–Fri</span>
          <span>9:00 AM – 5:00 PM</span>
          <span>50/day limit</span>
        </div>
      </div>
    </div>
  );
}
