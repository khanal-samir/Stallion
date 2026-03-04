"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { MOCK_EMAIL_CHART } from "@/types/crm";

const chartConfig = {
  sent: {
    label: "Sent",
    color: "var(--color-chart-1)",
  },
  opened: {
    label: "Opened",
    color: "var(--color-chart-2)",
  },
  replied: {
    label: "Replied",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

export function EmailChart() {
  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Email Performance</CardTitle>
        <Tabs defaultValue="7d">
          <TabsList className="h-8">
            <TabsTrigger value="7d" className="text-xs px-2.5">
              7d
            </TabsTrigger>
            <TabsTrigger value="30d" className="text-xs px-2.5">
              30d
            </TabsTrigger>
            <TabsTrigger value="90d" className="text-xs px-2.5">
              90d
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-55 w-full">
          <AreaChart data={MOCK_EMAIL_CHART} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="sent"
              type="monotone"
              fill="var(--color-chart-1)"
              fillOpacity={0.15}
              stroke="var(--color-chart-1)"
              strokeWidth={2}
            />
            <Area
              dataKey="opened"
              type="monotone"
              fill="var(--color-chart-2)"
              fillOpacity={0.15}
              stroke="var(--color-chart-2)"
              strokeWidth={2}
            />
            <Area
              dataKey="replied"
              type="monotone"
              fill="var(--color-chart-3)"
              fillOpacity={0.15}
              stroke="var(--color-chart-3)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
