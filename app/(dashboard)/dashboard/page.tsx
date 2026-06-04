"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import TotalBalanceCard from "@/components/dashboard/total-balance-card";
import ExpenseStatisticChart from "@/components/dashboard/expense-statistic-chart";
import FinancialHealthCard from "@/components/dashboard/financial-health-card";
import UpcomingPaymentsTable from "@/components/dashboard/upcoming-payments-table";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import QuickTransferCard from "@/components/dashboard/quick-transfer-card";

export default function DashboardPage() {
  const now = useMemo(() => new Date(), []);

  return (
    <div className="space-y-8 max-w-[1300px] mx-auto pb-10">
      {/* Page Header */}
      <PageHeader
        title="FundFlow"
        description="Start managing your finances"
        titleClassName="text-3xl font-black"
        descriptionClassName="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider"
      >
        {/* Credit Card Chip Widget */}
        <div className="bg-white/45 border border-white/60 px-4 py-2 rounded-2xl flex items-center gap-6 text-[10px] font-bold font-mono shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="text-[6px] tracking-widest font-black">••••</span>
            <span>4168</span>
          </div>
          <span className="text-slate-700">01/29</span>
        </div>
      </PageHeader>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Row 1: Total Balance Card */}
          <TotalBalanceCard />

          {/* Row 2: Expense Statistic & Financial Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ExpenseStatisticChart />
            <FinancialHealthCard />
          </div>

          {/* Row 3: Upcoming Payments (Tasks) */}
          <UpcomingPaymentsTable />
        </div>

        {/* Right Column (Spans 1 column on desktop) */}
        <div className="space-y-8">
          {/* Component 1: Recent Transactions */}
          <RecentTransactions />

          {/* Component 2: Promo Banner Card */}
          <div className="glass-card rounded-3xl p-6 flex flex-col justify-between min-h-[140px] relative overflow-hidden transition-all duration-300 hover:shadow-lg group">
            {/* Background design accents */}
            <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            
            <div className="space-y-2 relative z-10">
              <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">
                How to reduce expenses by 25%?
              </h4>
              <p className="text-[10px] font-semibold text-muted-foreground/80 leading-relaxed max-w-[220px]">
                View these useful tips to save your money and accelerate your growth.
              </p>
            </div>
            <a
              href="#"
              className="text-[9px] font-black text-indigo-600 hover:text-indigo-700 underline underline-offset-4 uppercase tracking-wider relative z-10 mt-3 block"
            >
              Learn more
            </a>
          </div>

          {/* Component 3: Quick Transfer */}
          <QuickTransferCard />
        </div>
      </div>
    </div>
  );
}
