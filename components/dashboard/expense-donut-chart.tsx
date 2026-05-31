"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategorySpending } from "@/hooks/use-analytics";
import { formatCurrency } from "@/hooks/use-currency";

interface ExpenseDonutChartProps {
  year: number;
  month: number;
}

export default function ExpenseDonutChart({ year, month }: ExpenseDonutChartProps) {
  const { data: categories, isLoading } = useCategorySpending(year, month);

  if (isLoading) {
    return (
      <Card className="border-border/30 bg-card/50">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (categories ?? []).slice(0, 6);
  const hasData = chartData.length > 0;

  return (
    <Card className="border-border/30 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Expense Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">
            No expense data this month
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <div className="flex-1 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-border/50 bg-popover p-3 shadow-xl">
                            <p className="text-xs font-medium">{data.category}</p>
                            <p className="text-sm font-bold">{formatCurrency(data.amount)}</p>
                            <p className="text-xs text-muted-foreground">{data.percentage.toFixed(1)}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 min-w-[140px]">
              {chartData.map((cat) => (
                <div key={cat.category} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-muted-foreground truncate flex-1">
                    {cat.category}
                  </span>
                  <span className="font-medium tabular-nums">
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
