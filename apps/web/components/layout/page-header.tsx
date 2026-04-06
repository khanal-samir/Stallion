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
    <div className={cn("flex items-start justify-between gap-4 mb-8", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          {count !== undefined && (
            <Badge variant="secondary" className="text-xs font-medium">
              {count}
            </Badge>
          )}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
