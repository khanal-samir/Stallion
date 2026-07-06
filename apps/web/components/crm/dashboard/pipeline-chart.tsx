"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/ui/chart";

interface PipelineChartProps {
  data: { stage: string; count: number }[];
}

const STAGE_COLORS: Record<string, string> = {
  new: "#64748b",
  contacted: "#3b82f6",
  demo: "#8b5cf6",
  proposal: "#f59e0b",
  won: "#10b981",
  lost: "#f43f5e",
};

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  demo: "Demo",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

const chartConfig = {
  count: {
    label: "Deals",
    color: "hsl(var(--chart-1))",
  },
};

export function PipelineChart({ data }: PipelineChartProps) {
  const displayData = data.map((d) => ({
    ...d,
    stageLabel: STAGE_LABELS[d.stage] ?? d.stage,
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-4/3 w-full">
      <BarChart data={displayData} margin={{ top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="stageLabel"
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
            <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] ?? "hsl(var(--chart-1))"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
