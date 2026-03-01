import { cn } from "@/lib/utils";

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
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="M3 4L16 28L16 22L9 4H3Z" fill="currentColor" />
        <path d="M29 4L16 28L16 22L23 4H29Z" fill="currentColor" fillOpacity={0.65} />
      </svg>
      {showText && <span className={cn("font-bold tracking-tight", text)}>Verio</span>}
    </span>
  );
}
