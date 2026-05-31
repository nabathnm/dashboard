"use client";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTotalBalance } from "@/hooks/use-accounts";
import { useMonthlyTotals } from "@/hooks/use-transactions";
import { useOutstandingTotal } from "@/hooks/use-shared-expenses";
import { formatCurrency } from "@/hooks/use-currency";

interface StatCardsProps {
  year: number;
  month: number;
}

export default function StatCards({ year, month }: StatCardsProps) {
  const { data: totalBalance, isLoading: balanceLoading } = useTotalBalance();
  const { data: monthlyTotals, isLoading: totalsLoading } = useMonthlyTotals(year, month);
  const { data: outstanding, isLoading: outstandingLoading } = useOutstandingTotal();

  const isLoading = balanceLoading || totalsLoading || outstandingLoading;

  const savingsRate =
    monthlyTotals && monthlyTotals.income > 0
      ? ((monthlyTotals.income - monthlyTotals.expense) / monthlyTotals.income) * 100
      : 0;

  const financialScore = Math.min(100, Math.max(0, 70 + (savingsRate >= 20 ? 15 : savingsRate >= 10 ? 5 : -10)));

  const stats = [
    {
      label: "Total Balance",
      value: formatCurrency(totalBalance ?? 0),
      icon: Wallet,
      gradient: "from-violet-500/20 to-indigo-500/20",
      iconColor: "text-violet-400",
      borderColor: "border-violet-500/20",
    },
    {
      label: "Monthly Income",
      value: formatCurrency(monthlyTotals?.income ?? 0),
      icon: TrendingUp,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Monthly Expense",
      value: formatCurrency(monthlyTotals?.expense ?? 0),
      icon: TrendingDown,
      gradient: "from-rose-500/20 to-pink-500/20",
      iconColor: "text-rose-400",
      borderColor: "border-rose-500/20",
    },
    {
      label: "Reimbursements",
      value: formatCurrency(outstanding ?? 0),
      icon: Users,
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Financial Score",
      value: `${financialScore.toFixed(0)}/100`,
      icon: Star,
      gradient: "from-cyan-500/20 to-blue-500/20",
      iconColor: "text-cyan-400",
      borderColor: "border-cyan-500/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="border-border/30 bg-card/50">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-7 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={`border-border/30 bg-card/50 overflow-hidden relative group hover:border-border/60 transition-all duration-300`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">
                {stat.label}
              </span>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
            <p className="text-lg font-bold tracking-tight">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
