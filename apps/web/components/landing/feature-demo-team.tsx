"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Users, Shield, Mail, FolderOpen } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const teamMembers = [
  { initials: "SC", name: "Sarah Chen", role: "Admin", color: "bg-primary/10 text-primary" },
  { initials: "MR", name: "Marcus R.", role: "Member", color: "bg-green-500/10 text-green-600" },
  { initials: "PS", name: "Priya S.", role: "Member", color: "bg-blue-500/10 text-blue-600" },
  { initials: "+2", name: "2 more", role: "", color: "bg-muted text-muted-foreground" },
];

const permissions = [
  { icon: Shield, label: "Admin", desc: "Full access to everything" },
  { icon: Users, label: "Member", desc: "Can manage contacts & deals" },
  { icon: Mail, label: "Sequences", desc: "Shared templates & campaigns" },
  { icon: FolderOpen, label: "Shared Pipelines", desc: "Team-wide visibility" },
];

export function FeatureDemoTeam() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll(".team-item");

    const ctx = gsap.context(() => {
      gsap.from(items, {
        x: 20,
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
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-xl space-y-5">
        {/* Team Header */}
        <div className="team-item flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Team Workspace</div>
            <div className="text-[11px] text-muted-foreground">4 members · Growthbase</div>
          </div>
          <div className="flex -space-x-2">
            {teamMembers.slice(0, 3).map((member) => (
              <div
                key={member.name}
                className={`size-8 rounded-full ${member.color} flex items-center justify-center text-[10px] font-semibold border-2 border-card`}
              >
                {member.initials}
              </div>
            ))}
            <div className="size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-medium border-2 border-card">
              +2
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="team-item space-y-2">
          {teamMembers.slice(0, 3).map((member) => (
            <div
              key={member.name}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border border-border/30"
            >
              <div
                className={`size-8 rounded-full ${member.color} flex items-center justify-center text-[10px] font-semibold shrink-0`}
              >
                {member.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{member.name}</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary/5 text-[10px] text-muted-foreground">
                {member.role}
              </span>
            </div>
          ))}
        </div>

        {/* Permissions Grid */}
        <div className="team-item grid grid-cols-2 gap-2">
          {permissions.map((perm) => (
            <div
              key={perm.label}
              className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/20"
            >
              <perm.icon className="size-3.5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-medium">{perm.label}</div>
                <div className="text-[9px] text-muted-foreground leading-tight">
                  {perm.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
