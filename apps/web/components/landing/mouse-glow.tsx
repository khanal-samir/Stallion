"use client";

import { useEffect, useRef } from "react";
import { cn } from "@workspace/ui/lib/utils";

interface MouseGlowProps {
  className?: string;
  color?: string;
  size?: number;
  opacity?: number;
}

export function MouseGlow({
  className,
  color = "hsl(var(--primary))",
  size = 600,
  opacity = 0.12,
}: MouseGlowProps) {
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const mousePos = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const updateGlow = () => {
      if (glowRef.current) {
        glowRef.current.style.setProperty("--mouse-x", `${mousePos.current.x}px`);
        glowRef.current.style.setProperty("--mouse-y", `${mousePos.current.y}px`);
      }
      rafRef.current = requestAnimationFrame(updateGlow);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(updateGlow);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className={cn(
        "pointer-events-none fixed inset-0 z-0 transition-opacity duration-500",
        className
      )}
      style={{
        background: `radial-gradient(${size}px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), ${color}, transparent ${opacity * 100}%)`,
      }}
      aria-hidden="true"
    />
  );
}
