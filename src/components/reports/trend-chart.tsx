"use client";

import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface TrendData {
  month: string;
  income: number;
  expenses: number;
}

interface TrendChartProps {
  data: TrendData[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = memo(({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover p-3 shadow-md">
        <p className="mb-2 font-medium">{formatMonthLabel(label || "")}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.dataKey === "income" ? "Income" : "Expenses"}:{" "}
            {formatCurrency(entry.value)}
          </p>
        ))}
        {payload.length === 2 && (
          <p className="mt-1 border-t pt-1 text-sm text-muted-foreground">
            Net: {formatCurrency(payload[0].value - payload[1].value)}
          </p>
        )}
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = "CustomTooltip";

// Format "2024-01" to "Jan 2024"
function formatMonthLabel(monthKey: string): string {
  if (!monthKey || !monthKey.includes("-")) return monthKey;
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// Format for X-axis ticks - shorter format
function formatXAxisTick(monthKey: string): string {
  if (!monthKey || !monthKey.includes("-")) return monthKey;
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

// Format Y-axis values
function formatYAxisTick(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
}

export const TrendChart = memo(function TrendChart({ data, isLoading = false }: TrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[350px] items-center justify-center">
            <div className="h-full w-full animate-pulse rounded bg-muted" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatXAxisTick}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  axisLine={{ className: "stroke-muted" }}
                  tickLine={{ className: "stroke-muted" }}
                />
                <YAxis
                  tickFormatter={formatYAxisTick}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  axisLine={{ className: "stroke-muted" }}
                  tickLine={{ className: "stroke-muted" }}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) =>
                    value === "income" ? "Income" : "Expenses"
                  }
                  wrapperStyle={{ paddingTop: "20px" }}
                />
                <Bar
                  dataKey="income"
                  name="income"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="expenses"
                  name="expenses"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
