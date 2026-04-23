import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { LogoStrip } from "@/components/landing/logo-strip";
import { FeatureSection } from "@/components/landing/features-section";
import { FeatureDemoContacts } from "@/components/landing/feature-demo-contacts";
import { FeatureDemoPipeline } from "@/components/landing/feature-demo-pipeline";
import { FeatureDemoSequences } from "@/components/landing/feature-demo-sequences";
import { FeatureDemoAI } from "@/components/landing/feature-demo-ai";
import { FeatureDemoActivity } from "@/components/landing/feature-demo-activity";
import { FeatureDemoTeam } from "@/components/landing/feature-demo-team";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <LogoStrip />

        <FeatureSection
          id="features"
          eyebrow="People & Organizations"
          title="Know every contact inside out"
          description="Organize your entire network with rich profiles, custom fields, and activity timelines. Link contacts to organizations and never lose context again."
          bullets={[
            "Rich contact profiles with custom fields",
            "Organization hierarchy and linked contacts",
            "Full activity timeline per contact",
            "CSV import and bulk operations",
          ]}
          align="left"
        >
          <FeatureDemoContacts />
        </FeatureSection>

        <div className="border-t border-border/30" />

        <FeatureSection
          eyebrow="Deal Pipeline"
          title="Move deals from first touch to closed-won"
          description="Visual Kanban board that gives your entire team clarity on every opportunity. Drag, drop, and track deal progress in real time."
          bullets={[
            "Visual Kanban with customizable stages",
            "Deal value, close date, and owner tracking",
            "Drag-and-drop stage changes",
            "Pipeline analytics and forecasting",
          ]}
          align="right"
        >
          <FeatureDemoPipeline />
        </FeatureSection>

        <div className="border-t border-border/30" />

        <FeatureSection
          eyebrow="Email Sequences"
          title="Automate outreach that feels human"
          description="Build multi-step email sequences with smart scheduling, daily limits, and LinkedIn task reminders. Set it up once, let it run forever."
          bullets={[
            "Multi-step sequences with email, wait, and task steps",
            "Smart send scheduling with timezone support",
            "Daily sending limits and send windows",
            "LinkedIn connection and message task reminders",
          ]}
          align="left"
        >
          <FeatureDemoSequences />
        </FeatureSection>

        <div className="border-t border-border/30" />

        <FeatureSection
          eyebrow="AI Email Drafts"
          title="Draft personalized emails in seconds"
          description="Generate email drafts and subject lines using contact context. Choose your tone, edit before sending, and watch reply rates soar."
          bullets={[
            "One-click AI draft generation per contact",
            "Context-aware using contact data and history",
            "Tone selector: Professional, Friendly, Bold",
            "Unlimited AI drafts on Pro plans",
          ]}
          align="right"
        >
          <FeatureDemoAI />
        </FeatureSection>

        <div className="border-t border-border/30" />

        <FeatureSection
          eyebrow="Activity Tracking"
          title="Never miss a beat"
          description="Every email, call, note, and meeting logged automatically. See the complete picture before every conversation and pick up right where you left off."
          bullets={[
            "Auto-logged email and call activity",
            "Rich notes with meeting summaries",
            "Status change history",
            "Timeline view for every contact",
          ]}
          align="left"
        >
          <FeatureDemoActivity />
        </FeatureSection>

        <div className="border-t border-border/30" />

        <FeatureSection
          eyebrow="Team Collaboration"
          title="Built for teams that sell together"
          description="Invite your team, assign deals, and share sequences. Role-based access keeps everything organized while everyone stays in the loop."
          bullets={[
            "Role-based access: Admin & Member",
            "Shared sequences and templates",
            "Team-wide pipeline visibility",
            "Invite and manage team members",
          ]}
          align="right"
        >
          <FeatureDemoTeam />
        </FeatureSection>

        <div className="border-t border-border/30" />

        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
