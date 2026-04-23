"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Mail, Phone, FileText, Calendar, User } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const activities = [
  {
    icon: Mail,
    title: "Email sent",
    description: "Sequence email #2 to Sarah Chen",
    time: "2 hours ago",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Phone,
    title: "Call logged",
    description: "Discovery call with TechFlow",
    time: "Yesterday",
    color: "bg-green-500/10 text-green-600",
  },
  {
    icon: FileText,
    title: "Note added",
    description: "Interested in Enterprise plan",
    time: "2 days ago",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Calendar,
    title: "Meeting scheduled",
    description: "Demo call next Tuesday",
    time: "3 days ago",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: User,
    title: "Status updated",
    description: "Moved to 'Qualified'",
    time: "1 week ago",
    color: "bg-purple-500/10 text-purple-600",
  },
];

export function FeatureDemoActivity() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll(".activity-item");

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
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-sm font-semibold">Activity Timeline</div>
            <div className="text-[11px] text-muted-foreground">Sarah Chen — TechFlow</div>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
            12 activities
          </div>
        </div>

        {/* Timeline */}
        <div className="relative space-y-4">
          {/* Vertical line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border/50" />

          {activities.map((activity, i) => (
            <div key={i} className="activity-item flex items-start gap-3 relative">
              <div
                className={`relative z-10 size-8 rounded-lg ${activity.color} flex items-center justify-center shrink-0`}
              >
                <activity.icon className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{activity.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {activity.time}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {activity.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
