import { Users, BarChart3, Mail, Sparkles, Activity, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Users,
    title: "Contact Management",
    description:
      "Organize your entire pipeline of contacts with custom fields, status tracking, and CSV import. Never lose track of a lead again.",
  },
  {
    icon: BarChart3,
    title: "Deal Pipeline",
    description:
      "Visual Kanban board to track every deal from first touch to closed-won. Drag, drop, and close with clarity.",
  },
  {
    icon: Mail,
    title: "Email Sequences",
    description:
      "Build multi-step automated email sequences with smart scheduling. Set send windows, daily limits, and let the system run.",
  },
  {
    icon: Sparkles,
    title: "AI Email Drafts",
    description:
      "Generate personalized email drafts and subject lines with AI. Use contact context for messages that feel human.",
  },
  {
    icon: Activity,
    title: "Activity Tracking",
    description:
      "Full timeline of every email, call, note, and meeting per contact. See the complete picture before every conversation.",
  },
  {
    icon: UserPlus,
    title: "Team Collaboration",
    description:
      "Invite your team, assign deals, and share sequences. Role-based access keeps everything organized.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Everything you need to close more deals
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful tools designed for modern outbound sales teams, all in one place.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border/50 hover:border-border bg-card p-6 transition-colors duration-200"
            >
              <div className="p-3 rounded-xl bg-primary/10 w-fit">
                <feature.icon className="size-5 text-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
