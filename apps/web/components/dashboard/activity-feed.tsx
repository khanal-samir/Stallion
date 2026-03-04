"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MOCK_ACTIVITIES } from "@/types/crm";
import type { ActivityType } from "@/types/crm";
import { cn } from "@/lib/utils";

const dotColor: Record<ActivityType, string> = {
  email: "bg-primary",
  call: "bg-chart-2",
  note: "bg-muted-foreground",
  deal: "bg-emerald-500",
  task: "bg-amber-400",
};

export function ActivityFeed() {
  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Button variant="link" size="sm">
          View all
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1.25 top-2 bottom-2 border-l-2 border-border" />

          <div className="space-y-4">
            {MOCK_ACTIVITIES.map((activity) => (
              <div key={activity.id} className="flex gap-3 relative">
                <span
                  className={cn(
                    "w-3 h-3 rounded-full border-2 border-background z-10 mt-1.5 shrink-0",
                    dotColor[activity.type],
                  )}
                />
                <Avatar className="w-6 h-6 bg-accent shrink-0">
                  <AvatarFallback className="text-[10px]">{activity.personInitials}</AvatarFallback>
                </Avatar>
                <p className="text-sm flex-1">{activity.description}</p>
                <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                  {activity.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
