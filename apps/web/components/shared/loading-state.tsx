import { Loader2 } from "lucide-react";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import { cn } from "@workspace/ui/lib/utils";

interface LoadingStateProps {
  variant?: "page" | "section" | "inline" | "kanban";
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

  if (variant === "kanban") {
    return (
      <div className={cn("grid grid-cols-3 gap-3", className)}>
        {Array.from({ length: 6 }).map((_, colIndex) => (
          <div key={colIndex} className="flex flex-col animate-pulse">
            <div className="rounded-t-lg border border-b-0 px-3 py-2.5 border-t-2 bg-muted/40">
              <div className="h-4 bg-muted rounded w-20" />
            </div>
            <div className="rounded-b-lg border border-t-0 p-2 min-h-70 bg-muted/10 flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, cardIndex) => (
                <div key={cardIndex} className="bg-card border rounded-lg p-3 space-y-2">
                  <div className="h-3.5 bg-muted rounded w-4/5" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
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
