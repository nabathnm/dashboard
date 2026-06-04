"use client";

import { useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMonthlyTrend, useCategorySpending, useMonthlyFinancialSummary } from "@/hooks/use-analytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ExpenseDonutChart from "@/components/dashboard/expense-donut-chart";
import MonthlySpendingChart from "@/components/dashboard/monthly-spending-chart";
import { formatCurrency } from "@/hooks/use-currency";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default function AnalyticsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const { data: monthlyTrend, isLoading: isLoadingMonthly } = useMonthlyTrend(year);
  const { data: summaryData } = useMonthlyFinancialSummary(year, month);
  const { data: categoryData, isLoading: isLoadingCategory } = useCategorySpending(year, month);

  const monthsList = Array.from({ length: 12 }).map((_, i) => {
    const d = subMonths(new Date(), i);
    return {
      value: d.toISOString(),
      label: format(d, "MMMM yyyy"),
      date: d,
    };
  });

  const currentMonthData = monthlyTrend?.find((m: any) => m.month === format(selectedDate, "MMM")) || { income: 0, expense: 0, net: 0 };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Analytics" 
        description="Deep dive into your financial habits and trends"
      >
          <Select 
            value={selectedDate.toISOString()} 
            onValueChange={(v) => { if (typeof v === "string") setSelectedDate(new Date(v)) }}
          >
            <SelectTrigger className="w-full sm:w-[200px] bg-card/50">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthsList.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/30 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMonthly ? <Skeleton className="h-8 w-32" /> : formatCurrency(currentMonthData.income)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/30 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMonthly ? <Skeleton className="h-8 w-32" /> : formatCurrency(currentMonthData.expense)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/30 bg-card/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/10 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <Wallet className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold">
              {isLoadingMonthly ? <Skeleton className="h-8 w-32" /> : formatCurrency(currentMonthData.income - currentMonthData.expense)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-8">
        <div className="col-span-full lg:col-span-5">
          <Card className="border-border/30 bg-card/50 h-full">
            <CardHeader>
              <CardTitle>Cash Flow Trend</CardTitle>
              <CardDescription>Income vs Expenses for the year</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMonthly ? (
                <Skeleton className="w-full h-[350px]" />
              ) : (
                <MonthlySpendingChart year={year} />
              )}
            </CardContent>
          </Card>
        </div>
        <div className="col-span-full md:col-span-7 lg:col-span-3">
          <Card className="border-border/30 bg-card/50 h-full flex flex-col">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>{format(selectedDate, "MMMM yyyy")} distribution</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {isLoadingCategory ? (
                <div className="flex justify-center"><Skeleton className="w-64 h-64 rounded-full" /></div>
              ) : (
                <ExpenseDonutChart year={year} month={month} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
