import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  variant?: "page" | "section" | "inline";
  text?: string;
  className?: string;
}

export function LoadingState({ variant = "section", text, className }: LoadingStateProps) {
  if (variant === "page") {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-3 min-h-[60vh]",
          className,
        )}
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", className)}
      >
        <Loader2 className="size-3.5 animate-spin" />
        {text && <span>{text}</span>}
      </span>
    );
  }

  // section — skeleton card placeholder
  return (
    <div className={cn("space-y-3 p-4", className)}>
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
