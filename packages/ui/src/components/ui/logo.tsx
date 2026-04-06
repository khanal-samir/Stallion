import { cn } from "../../lib/utils";

interface LogoProps {
  showText?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeConfig = {
  xs: { icon: 16, text: "text-sm", gap: "gap-1.5" },
  sm: { icon: 20, text: "text-base", gap: "gap-1.5" },
  md: { icon: 24, text: "text-lg", gap: "gap-2" },
  lg: { icon: 28, text: "text-xl", gap: "gap-2" },
  xl: { icon: 36, text: "text-2xl", gap: "gap-2.5" },
};

export function Logo({ showText = true, size = "md", className }: LogoProps) {
  const { icon, text, gap } = sizeConfig[size];

  return (
    <span className={cn("inline-flex items-center", gap, className)}>
      <img
        src="/stallion.svg"
        alt="Stallion"
        width={icon}
        height={icon}
        className="shrink-0 object-contain dark:invert"
        aria-hidden="true"
      />
      {showText && <span className={cn("font-bold tracking-tight", text)}>Stallion</span>}
    </span>
  );
}
