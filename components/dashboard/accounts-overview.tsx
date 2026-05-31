"use client";

import Link from "next/link";
import { ArrowRight, Landmark, Smartphone, Banknote, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAccounts } from "@/hooks/use-accounts";
import { formatCurrency } from "@/hooks/use-currency";

const typeIcons: Record<string, React.ElementType> = {
  bank: Landmark,
  ewallet: Smartphone,
  cash: Banknote,
  savings: PiggyBank,
};

const typeColors: Record<string, string> = {
  bank: "bg-blue-500/10 text-blue-400",
  ewallet: "bg-violet-500/10 text-violet-400",
  cash: "bg-emerald-500/10 text-emerald-400",
  savings: "bg-amber-500/10 text-amber-400",
};

export default function AccountsOverview() {
  const { data: accounts, isLoading } = useAccounts();

  const activeAccounts = (accounts ?? []).filter((a) => a.is_active).slice(0, 4);

  return (
    <Card className="border-border/30 bg-card/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Accounts</CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground">
          <Link href="/accounts">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-20 mb-1" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))
        ) : !activeAccounts.length ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No accounts yet
          </div>
        ) : (
          activeAccounts.map((account) => {
            const Icon = typeIcons[account.type] || Landmark;
            const colorClass = typeColors[account.type] || "bg-muted text-muted-foreground";

            return (
              <div
                key={account.id}
                className="flex items-center gap-3 py-2 rounded-lg px-2 -mx-2 hover:bg-muted/30 transition-colors"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{account.name}</p>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {account.type}
                  </Badge>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(account.balance)}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
