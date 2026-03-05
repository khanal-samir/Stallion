"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_PIPELINE } from "@/types/crm";

export function PipelineOverview() {
  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Deals Overview</CardTitle>
        <Button variant="link" size="sm" asChild>
          <Link href="/deals">View Deals &rarr;</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {MOCK_PIPELINE.map((stage) => (
          <Link
            key={stage.name}
            href={`/deals?stage=${stage.name}`}
            className="flex items-center gap-3 group hover:bg-accent/50 rounded-md p-1.5 -mx-1.5 transition-colors duration-150"
          >
            <span className="w-24 text-sm font-medium">{stage.name}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${stage.percentage}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-28 text-right">
              {stage.count} deals &middot; ${stage.value.toLocaleString()}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
