"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { cn } from "@workspace/ui/lib/utils";

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  floatDuration?: number;
  floatDelay?: number;
  floatDistance?: number;
}

export function FloatingCard({
  children,
  className,
  floatDuration = 3,
  floatDelay = 0,
  floatDistance = 15,
}: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(cardRef.current, {
        y: -floatDistance,
        duration: floatDuration,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: floatDelay,
      });
    });

    return () => ctx.revert();
  }, [floatDuration, floatDelay, floatDistance]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 hover:scale-[1.02]",
        className
      )}
    >
      {children}
    </div>
  );
}
