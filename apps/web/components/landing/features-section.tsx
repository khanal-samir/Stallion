"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@workspace/ui/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface FeatureSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  children: ReactNode;
  align?: "left" | "right";
  id?: string;
}

export function FeatureSection({
  eyebrow,
  title,
  description,
  bullets = [],
  children,
  align = "left",
  id,
}: FeatureSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !textRef.current || !demoRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(textRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          once: true,
        },
      });

      gsap.from(demoRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        delay: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  const isLeft = align === "left";

  return (
    <section ref={sectionRef} id={id} className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center",
            isLeft ? "" : "lg:flex-row-reverse"
          )}
        >
          <div
            ref={textRef}
            className={cn("space-y-6", !isLeft && "lg:order-2")}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[11px] font-medium text-primary uppercase tracking-wider">
              {eyebrow}
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
            {bullets.length > 0 && (
              <ul className="space-y-3">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div ref={demoRef} className={cn(!isLeft && "lg:order-1")}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
