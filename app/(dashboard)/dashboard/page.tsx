"use client";

import { useMemo } from "react";
import StatCards from "@/components/dashboard/stat-cards";
import ExpenseDonutChart from "@/components/dashboard/expense-donut-chart";
import MonthlySpendingChart from "@/components/dashboard/monthly-spending-chart";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import AccountsOverview from "@/components/dashboard/accounts-overview";
import AIInsightCard from "@/components/dashboard/ai-insight-card";
import QuickActions from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your financial overview for {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stat Cards */}
      <StatCards year={year} month={month} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseDonutChart year={year} month={month} />
        <MonthlySpendingChart year={year} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentTransactions />
        <AccountsOverview />
        <AIInsightCard year={year} month={month} />
      </div>
    </div>
  );
}
