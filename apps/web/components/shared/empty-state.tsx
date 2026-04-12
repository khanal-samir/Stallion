import type { LucideIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { cn } from "@workspace/ui/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void } | React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="flex size-14 items-center justify-center rounded-full bg-muted/60 border border-border/50">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground leading-relaxed">{description}</p>
      {action && (
        <div className="mt-6">
          {isActionConfig(action) ? (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  );
}

function isActionConfig(
  action: { label: string; onClick: () => void } | React.ReactNode,
): action is { label: string; onClick: () => void } {
  return typeof action === "object" && action !== null && "label" in action && "onClick" in action;
}
