import { Card, CardContent } from "@/components/ui/card";

interface Testimonial {
  quote: string;
  name: string;
  title: string;
  initials: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "Verio replaced three tools we were juggling. Sequences alone saved us 10 hours a week.",
    name: "Sarah Chen",
    title: "Head of Sales at TechFlow",
    initials: "SC",
  },
  {
    quote:
      "The AI email drafts are surprisingly good. Our reply rates went up 40% in the first month.",
    name: "Marcus Rodriguez",
    title: "Founder at Growthbase",
    initials: "MR",
  },
  {
    quote:
      "Finally a CRM that doesn't feel like it was built in 2005. Clean, fast, and actually enjoyable to use.",
    name: "Priya Sharma",
    title: "Sales Lead at Revenio",
    initials: "PS",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Loved by sales teams
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See why hundreds of teams have made the switch to Verio.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="border-border/50 hover:border-border transition-colors duration-200"
            >
              <CardContent className="pt-2">
                <blockquote className="text-foreground italic leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 mt-6">
                  <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-foreground text-sm font-semibold shrink-0">
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.title}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
