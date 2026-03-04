"use client";

import { Workflow, Clock, Pause, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Sequence, SequenceStatus } from "@/types/crm";

const statusConfig: Record<SequenceStatus, { variant: "default" | "secondary" | "outline" }> = {
  active: { variant: "default" },
  draft: { variant: "secondary" },
  archived: { variant: "outline" },
};

interface SequenceCardProps {
  sequence: Sequence;
}

export function SequenceCard({ sequence }: SequenceCardProps) {
  const config = statusConfig[sequence.status];

  return (
    <Card className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
      {/* Row 1: Name + Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold truncate">{sequence.name}</h3>
        <Badge variant={config.variant}>{sequence.status}</Badge>
      </div>

      {/* Row 2: Mini stats */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y border-border my-3">
        <div>
          <p className="text-xs text-muted-foreground">Enrolled</p>
          <p className="text-sm font-semibold">{sequence.enrolled}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Open Rate</p>
          <p className="text-sm font-semibold">{sequence.openRate}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Reply Rate</p>
          <p className="text-sm font-semibold">{sequence.replyRate}%</p>
        </div>
      </div>

      {/* Row 3: Steps + channels */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Workflow className="w-3 h-3" />
        <span>
          {sequence.steps} steps &middot; {sequence.channels}
        </span>
      </div>

      {/* Row 4: Schedule */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
        <Clock className="w-3 h-3" />
        <span>{sequence.schedule}</span>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3">
        <div className="flex items-center gap-2">
          <Avatar className="w-5 h-5">
            <AvatarFallback className="text-[9px]">{sequence.ownerInitials}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {new Date(sequence.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm">
            Edit
          </Button>
          <Button variant="ghost" size="sm">
            Analytics
          </Button>
          <Button variant="outline" size="sm">
            {sequence.status === "active" ? (
              <>
                <Pause className="w-3 h-3 mr-1" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1" /> Resume
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
