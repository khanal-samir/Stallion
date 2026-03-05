import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  count?: number;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, count, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {count !== undefined && <Badge variant="secondary">{count}</Badge>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
