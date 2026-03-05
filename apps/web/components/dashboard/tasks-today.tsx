"use client";

import { CheckCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_TASKS } from "@/types/crm";
import { cn } from "@/lib/utils";

const priorityColor: Record<string, string> = {
  high: "bg-destructive",
  medium: "bg-amber-400",
  low: "bg-muted-foreground",
};

export function TasksToday() {
  const tasks = MOCK_TASKS;

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks Due Today</CardTitle>
        <Badge variant="secondary">{tasks.length}</Badge>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <CheckCircle className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tasks today</p>
          </div>
        ) : (
          <div className="space-y-0">
            {tasks.map((task, i) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-2 py-2",
                  i < tasks.length - 1 && "border-b border-border",
                )}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    priorityColor[task.priority],
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.personName}</p>
                </div>
                <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                  {task.dueTime}
                </span>
              </div>
            ))}
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full mt-3">
          <Plus className="w-3 h-3 mr-1" />
          Add Task
        </Button>
      </CardContent>
    </Card>
  );
}
