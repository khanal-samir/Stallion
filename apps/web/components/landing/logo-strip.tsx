const logos = ["Acme Corp", "TechFlow", "Salesify", "Growthbase", "Revenio", "Pipestack"];

export function LogoStrip() {
  return (
    <section aria-label="Companies that trust Stallion" className="py-16 border-t border-border/50">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-sm text-muted-foreground text-center mb-8">
          Trusted by 500+ sales teams worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((logo) => (
            <span key={logo} className="text-lg font-semibold text-muted-foreground/50 select-none">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
