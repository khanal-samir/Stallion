import { Badge } from "@workspace/ui/components/ui/badge";
import { cn } from "@workspace/ui/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, count, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4 pb-6 border-b border-border/40",
        className,
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {count !== undefined && (
            <Badge variant="secondary" className="text-xs font-medium tabular-nums px-2 py-0">
              {count}
            </Badge>
          )}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 pb-0.5">{actions}</div>}
    </div>
  );
}
