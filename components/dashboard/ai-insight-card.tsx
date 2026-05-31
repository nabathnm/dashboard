"use client";

import { Brain, Lightbulb, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { aiEvaluationService } from "@/services/ai-evaluation.service";

interface AIInsightCardProps {
  year: number;
  month: number;
}

const severityConfig = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
  critical: { icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10" },
};

export default function AIInsightCard({ year, month }: AIInsightCardProps) {
  const { data: evaluation, isLoading } = useQuery({
    queryKey: ["ai-evaluation", year, month],
    queryFn: () => aiEvaluationService.getLatest(year, month),
  });

  return (
    <Card className="border-border/30 bg-card/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full" />
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 relative">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </>
        ) : !evaluation ? (
          <div className="py-4 text-center">
            <Lightbulb className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No AI analysis for this month yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Visit the AI Evaluation page to generate insights.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                <TrendingUp className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Financial Score</p>
                <p className="text-xl font-bold">{evaluation.financial_score}/100</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {evaluation.summary}
            </p>

            {evaluation.insights?.slice(0, 2).map((insight, i) => {
              const config = severityConfig[insight.severity];
              const Icon = config.icon;
              return (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${config.bg}`}>
                  <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${config.color}`} />
                  <p className="text-xs leading-relaxed">{insight.message}</p>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}
