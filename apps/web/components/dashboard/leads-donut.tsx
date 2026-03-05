"use client";

import { Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { MOCK_LEADS_BY_SOURCE } from "@/types/crm";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

const chartConfig = {
  linkedin: { label: "LinkedIn", color: "var(--color-chart-1)" },
  website: { label: "Website", color: "var(--color-chart-2)" },
  referral: { label: "Referral", color: "var(--color-chart-3)" },
  coldEmail: { label: "Cold Email", color: "var(--color-chart-4)" },
} satisfies ChartConfig;

const total = MOCK_LEADS_BY_SOURCE.reduce((acc, d) => acc + d.value, 0);

export function LeadsDonut() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Leads by Source</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <ChartContainer config={chartConfig} className="h-45 w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={MOCK_LEADS_BY_SOURCE}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
            >
              {MOCK_LEADS_BY_SOURCE.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-foreground text-lg font-bold"
            >
              {total}
            </text>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-col gap-1 w-full mt-2">
          {MOCK_LEADS_BY_SOURCE.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i] }}
              />
              <span className="text-sm">{item.name}</span>
              <span className="text-sm font-medium ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
