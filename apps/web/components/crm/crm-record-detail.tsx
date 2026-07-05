import type { ReactNode } from "react";
import { cn } from "@workspace/ui/lib/utils";

export function CrmRecordShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative -m-8 min-h-[calc(100vh-3.5rem)] p-4 sm:p-8">
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6">{children}</div>
    </div>
  );
}

export function CrmRecordPanel({
  title,
  eyebrow,
  action,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/90 shadow-xl backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
        <div>
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function CrmRecordField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-background/68 p-4", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 min-h-5 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

export function CrmRecordStat({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border p-4 shadow-sm",
        tone === "accent"
          ? "border-primary/25 bg-primary text-primary-foreground"
          : "border-border/60 bg-card/90",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.2em]",
          tone === "accent" ? "text-primary-foreground/72" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      {detail ? (
        <div
          className={cn(
            "mt-1 text-xs",
            tone === "accent" ? "text-primary-foreground/72" : "text-muted-foreground",
          )}
        >
          {detail}
        </div>
      ) : null}
    </div>
  );
}

export function EmptyRecordValue({ children = "Not set" }: { children?: ReactNode }) {
  return <span className="font-normal text-muted-foreground/58">{children}</span>;
}
