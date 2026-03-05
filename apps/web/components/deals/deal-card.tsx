"use client";

import { Calendar, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Deal } from "@/types/crm";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  const isOverdue = new Date(deal.closeDate) < new Date();

  return (
    <Card className="bg-card border border-border rounded-lg p-3 cursor-grab hover:border-primary/50 hover:shadow-sm transition-all">
      {/* Title */}
      <p className="text-sm font-medium truncate">{deal.title}</p>

      {/* Org + Person */}
      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
        {deal.orgName && (
          <>
            <Building2 className="w-3 h-3" />
            <span className="truncate">{deal.orgName}</span>
          </>
        )}
        {deal.orgName && deal.personName && <span>&middot;</span>}
        {deal.personName && <span className="truncate">{deal.personName}</span>}
      </div>

      {/* Value */}
      <p className="text-sm font-semibold text-primary mt-2">${deal.value.toLocaleString()}</p>

      {/* Bottom row */}
      <div className="flex justify-between items-center mt-2">
        <div
          className={cn(
            "flex items-center gap-1 text-xs",
            isOverdue ? "text-amber-500" : "text-muted-foreground",
          )}
        >
          <Calendar className="w-3 h-3" />
          <span>{deal.closeDate}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-[9px]">{deal.ownerInitials}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{deal.ownerName}</p>
            </TooltipContent>
          </Tooltip>

          <Badge variant="outline" className="text-xs">
            {deal.daysInStage}d
          </Badge>
        </div>
      </div>
    </Card>
  );
}
