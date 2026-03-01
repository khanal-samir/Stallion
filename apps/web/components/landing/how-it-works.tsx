interface Step {
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Import your contacts",
    description:
      "Upload a CSV or add contacts manually. Link them to organizations and set their status.",
  },
  {
    number: "02",
    title: "Build your sequences",
    description:
      "Create multi-step email sequences with AI-powered drafts, wait steps, and LinkedIn tasks.",
  },
  {
    number: "03",
    title: "Close more deals",
    description:
      "Track opens, clicks, and replies. Move deals through your pipeline and hit your targets.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-muted/50">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Get started in minutes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three simple steps to transform your outbound sales workflow.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 relative">
          {/* Connector line (desktop) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px border-t border-dashed border-border"
          />

          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center px-6">
              {/* Number */}
              <div className="relative z-10 inline-flex items-center justify-center size-24 rounded-full bg-background border border-border/50 mb-6">
                <span className="text-4xl font-bold text-primary/20">{step.number}</span>
              </div>

              {/* Mobile connector */}
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className="md:hidden w-px h-8 border-l border-dashed border-border mx-auto -mt-6 mb-2"
                />
              )}

              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
