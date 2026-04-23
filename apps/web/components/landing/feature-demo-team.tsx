"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Mail, Trash2, Users } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const teamMembers = [
  {
    initials: "SC",
    name: "Sarah Chen",
    email: "sarah@growthbase.com",
    role: "Owner",
    joined: "Jan 12, 2026",
    accent: "bg-primary/10 text-primary",
  },
  {
    initials: "MR",
    name: "Marcus Reed",
    email: "marcus@growthbase.com",
    role: "Admin",
    joined: "Feb 02, 2026",
    accent: "bg-blue-500/10 text-blue-600",
  },
  {
    initials: "PS",
    name: "Priya Shah",
    email: "priya@growthbase.com",
    role: "Member",
    joined: "Feb 19, 2026",
    accent: "bg-emerald-500/10 text-emerald-600",
  },
];

const settingsTabs = ["General", "Members", "Invites", "Billing"];

function getRolePill(role: string) {
  if (role === "Owner") return "bg-primary text-primary-foreground";
  if (role === "Admin") return "bg-secondary text-secondary-foreground";
  return "bg-background text-muted-foreground border border-border";
}

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
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 shadow-xl space-y-4">
        <div className="team-item flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-3 py-2">
          <div>
            <p className="text-xs font-semibold">Growthbase Workspace</p>
            <p className="text-[10px] text-muted-foreground">Settings / Members</p>
          </div>
          <div className="flex -space-x-2">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className={`size-7 rounded-full ${member.accent} flex items-center justify-center text-[9px] font-semibold border-2 border-card`}
              >
                {member.initials}
              </div>
            ))}
          </div>
        </div>

        <div className="team-item flex items-center gap-1 rounded-lg border border-border/40 bg-background p-1">
          {settingsTabs.map((tab) => (
            <div
              key={tab}
              className={`rounded-md px-2 py-1 text-[10px] ${
                tab === "Members"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {tab}
            </div>
          ))}
          <span className="ml-auto rounded-md bg-secondary px-1.5 py-0.5 text-[9px] text-secondary-foreground">
            4
          </span>
        </div>

        <div className="team-item overflow-hidden rounded-xl border border-border/50 bg-background">
          <div className="grid grid-cols-[1.6fr_0.9fr_0.8fr_32px] border-b border-border/50 px-3 py-2 text-[10px] font-medium text-muted-foreground">
            <span>User</span>
            <span>Role</span>
            <span>Joined</span>
            <span />
          </div>

          <div className="divide-y divide-border/40">
            {teamMembers.map((member) => (
              <div
                key={member.email}
                className="grid grid-cols-[1.6fr_0.9fr_0.8fr_32px] items-center px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`size-7 rounded-full ${member.accent} flex items-center justify-center text-[9px] font-semibold shrink-0`}
                  >
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium">{member.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-medium ${getRolePill(member.role)}`}
                  >
                    {member.role}
                  </span>
                </div>

                <p className="text-[9px] text-muted-foreground">{member.joined}</p>

                <button
                  type="button"
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-muted"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="team-item grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 p-2">
            <Users className="size-3.5 text-primary" />
            <div>
              <p className="text-[10px] font-medium">Members</p>
              <p className="text-[9px] text-muted-foreground">Role-based access</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 p-2">
            <Mail className="size-3.5 text-primary" />
            <div>
              <p className="text-[10px] font-medium">Invites</p>
              <p className="text-[9px] text-muted-foreground">Pending: 2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
