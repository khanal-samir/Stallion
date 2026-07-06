"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/ui/chart";

interface PeopleStatusChartProps {
  data: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  lead: "#64748b",
  prospect: "#3b82f6",
  qualified: "#10b981",
  customer: "#8b5cf6",
  churned: "#f43f5e",
};

const STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  prospect: "Prospect",
  qualified: "Qualified",
  customer: "Customer",
  churned: "Churned",
};

const chartConfig = {
  count: {
    label: "People",
    color: "hsl(var(--chart-2))",
  },
};

export function PeopleStatusChart({ data }: PeopleStatusChartProps) {
  const displayData = data.map((d) => ({
    ...d,
    statusLabel: STATUS_LABELS[d.status] ?? d.status,
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-4/3 w-full">
      <BarChart data={displayData} margin={{ top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="statusLabel"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
        />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--muted)/0.25)" }}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {displayData.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "hsl(var(--chart-2))"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
