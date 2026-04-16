import type { ReactNode } from "react";

export function CrmViewField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function CrmViewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {title}
      </p>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}
