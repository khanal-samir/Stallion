import { Marquee } from "@workspace/ui/components/ui/marquee";

const logos = [
  "Acme Corp",
  "TechFlow",
  "Salesify",
  "Growthbase",
  "Revenio",
  "Pipestack",
  "Outreachly",
  "Dealhub",
];

function LogoItem({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center px-8">
      <span className="text-lg font-semibold text-muted-foreground/40 select-none whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

export function LogoStrip() {
  return (
    <section className="py-12 border-y border-border/30">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-sm text-muted-foreground text-center mb-8">
          Trusted by outbound teams worldwide
        </p>
        <Marquee pauseOnHover className="[--duration:30s]">
          {logos.map((logo) => (
            <LogoItem key={logo} name={logo} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
