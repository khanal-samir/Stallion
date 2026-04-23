import Image from "next/image";

const integrations = [
  { name: "PostHog", src: "/posthog.svg" },
  { name: "Notion", src: "/notion.svg" },
  { name: "Gmail", src: "/gmail.svg" },
  { name: "Google Sheets", src: "/google-sheets.svg" },
  { name: "Slack", src: "/slack.svg" },
];

function IntegrationItem({ name, src }: { name: string; src: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 px-4 py-3 backdrop-blur-sm">
      <div className="relative size-6 shrink-0">
        <Image src={src} alt={name} fill className="object-contain" />
      </div>
      <span className="text-sm font-medium text-foreground/80 whitespace-nowrap">{name}</span>
    </div>
  );
}

export function LogoStrip() {
  return (
    <section className="py-12 border-y border-border/30">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-xl font-medium text-muted-foreground text-center mb-8">
          Works with the tools you already use
        </p>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
          {integrations.map((integration) => (
            <IntegrationItem key={integration.name} name={integration.name} src={integration.src} />
          ))}
        </div>
      </div>
    </section>
  );
}
