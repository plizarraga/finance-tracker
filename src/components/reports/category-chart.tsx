"use client";

import { memo, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { CategoryBreakdown } from "@/types";

// Color palettes for income and expense charts
const INCOME_COLORS = [
  "#22c55e", // green-500
  "#16a34a", // green-600
  "#15803d", // green-700
  "#4ade80", // green-400
  "#86efac", // green-300
  "#059669", // emerald-600
  "#10b981", // emerald-500
  "#34d399", // emerald-400
];

const EXPENSE_COLORS = [
  "#ef4444", // red-500
  "#dc2626", // red-600
  "#b91c1c", // red-700
  "#f87171", // red-400
  "#fca5a5", // red-300
  "#f97316", // orange-500
  "#fb923c", // orange-400
  "#fdba74", // orange-300
];

interface CategoryChartProps {
  data: CategoryBreakdown[];
  title: string;
  type: "income" | "expense";
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      categoryName: string;
      total: number;
      percentage: number;
    };
  }>;
}

const CustomTooltip = memo(({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-popover p-3 shadow-md">
        <p className="font-medium">{data.categoryName}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(data.total)}
        </p>
        <p className="text-sm text-muted-foreground">
          {data.percentage.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = "CustomTooltip";

interface LegendPayload {
  value: string;
  payload?: {
    categoryName: string;
    percentage: number;
  };
}

const CustomLegend = memo(({ payload }: { payload?: LegendPayload[] }) => {
  if (!payload) return null;

  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
      {payload.map((entry, index) => (
        <li key={`legend-${index}`} className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{
              backgroundColor:
                entry.payload?.categoryName === entry.value
                  ? INCOME_COLORS[index % INCOME_COLORS.length]
                  : EXPENSE_COLORS[index % EXPENSE_COLORS.length],
            }}
          />
          <span className="text-muted-foreground">
            {entry.value} ({entry.payload?.percentage?.toFixed(1) || 0}%)
          </span>
        </li>
      ))}
    </ul>
  );
});

CustomLegend.displayName = "CustomLegend";

export const CategoryChart = memo(function CategoryChart({
  data,
  title,
  type,
  isLoading = false,
}: CategoryChartProps) {
  const colors = type === "income" ? INCOME_COLORS : EXPENSE_COLORS;

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        name: item.categoryName,
        value: item.total,
        categoryName: item.categoryName,
        total: item.total,
        percentage: item.percentage,
      })),
    [data]
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="h-48 w-48 animate-pulse rounded-full bg-muted" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data available for this period
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                      className="stroke-background"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  content={<CustomLegend />}
                  verticalAlign="bottom"
                  height={60}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
