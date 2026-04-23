"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Mail, Building2, Sparkles, Calendar } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function FeatureDemoContacts() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll(".contact-item");

    const ctx = gsap.context(() => {
      gsap.from(items, {
        x: -20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
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
        {/* Profile Header */}
        <div className="contact-item flex items-center gap-3 pb-4 border-b border-border/30">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
            JD
          </div>
          <div>
            <div className="text-sm font-semibold">John Doe</div>
            <div className="text-xs text-muted-foreground">VP of Sales at Acme Corp</div>
          </div>
          <div className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
            Qualified
          </div>
        </div>

        {/* Info Grid */}
        <div className="contact-item grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="size-3.5" />
            <span>john@acme.com</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="size-3.5" />
            <span>Acme Corp</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            <span>AI Summary</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>Last contacted 2d ago</span>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="contact-item space-y-3 pt-2">
          <div className="text-xs font-medium text-muted-foreground">Recent Activity</div>
          {[
            { type: "Email", desc: "Sent sequence email #2", time: "2d ago" },
            { type: "Note", desc: "Called — left voicemail", time: "5d ago" },
            { type: "Meeting", desc: "Discovery call scheduled", time: "1w ago" },
          ].map((activity, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{activity.type}</div>
                <div className="text-[11px] text-muted-foreground truncate">{activity.desc}</div>
              </div>
              <div className="text-[10px] text-muted-foreground/60 shrink-0">{activity.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
