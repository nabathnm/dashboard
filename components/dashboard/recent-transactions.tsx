"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentTransactions } from "@/hooks/use-transactions";
import { formatCurrency } from "@/hooks/use-currency";
import { format } from "date-fns";

const typeConfig = {
  expense: { icon: ArrowUpRight, color: "text-rose-400", bgColor: "bg-rose-500/10", sign: "-" },
  income: { icon: ArrowDownLeft, color: "text-emerald-400", bgColor: "bg-emerald-500/10", sign: "+" },
  transfer: { icon: ArrowLeftRight, color: "text-blue-400", bgColor: "bg-blue-500/10", sign: "" },
};

export default function RecentTransactions() {
  const { data: transactions, isLoading } = useRecentTransactions(5);

  return (
    <Card className="border-border/30 bg-card/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground">
          <Link href="/transactions">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))
        ) : !transactions?.length ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No transactions yet
          </div>
        ) : (
          transactions.map((tx) => {
            const config = typeConfig[tx.type];
            const Icon = config.icon;
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 py-2.5 rounded-lg px-2 -mx-2 hover:bg-muted/30 transition-colors"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {tx.merchant || tx.category?.name || tx.type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.account?.name} · {format(new Date(tx.transaction_date), "dd MMM")}
                  </p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${
                  tx.type === "expense" ? "text-rose-400" : tx.type === "income" ? "text-emerald-400" : "text-foreground"
                }`}>
                  {config.sign}{formatCurrency(tx.amount)}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
