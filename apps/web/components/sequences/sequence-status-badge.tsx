"use client";

import { Badge } from "@workspace/ui/components/ui/badge";
import { cn } from "@workspace/ui/lib/utils";
import type { SequenceStatus } from "@workspace/validators/schemas/sequence";

const STATUS_STYLES: Record<SequenceStatus, string> = {
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  paused: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  archived: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

export function SequenceStatusBadge({ status }: { status: SequenceStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[status])}>
      {status}
    </Badge>
  );
}
