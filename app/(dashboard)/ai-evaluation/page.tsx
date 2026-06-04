"use client";

import { useState } from "react";
import { format, subMonths } from "date-fns";
import { Brain, Sparkles, TrendingUp, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiEvaluationService } from "@/services/ai-evaluation.service";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";

const severityConfig = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  critical: { icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  positive: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

export default function AIEvaluationPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const monthsList = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), i);
    return {
      value: d.toISOString(),
      label: format(d, "MMMM yyyy"),
      date: d,
    };
  });

  const { data: evaluation, isLoading } = useQuery({
    queryKey: ["ai-evaluation", year, month],
    queryFn: () => aiEvaluationService.getLatest(year, month),
  });

  const generateMutation = useMutation({
    mutationFn: () => aiEvaluationService.generate(year, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-evaluation", year, month] });
      toast.success("AI Insights generated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate AI insights");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="AI Financial Evaluation" 
        description="Get personalized insights and scoring based on your spending patterns"
      >
          <Select 
            value={selectedDate.toISOString()} 
            onValueChange={(v) => { if (typeof v === "string") setSelectedDate(new Date(v)) }}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-card/50">
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
          <Button 
            onClick={() => generateMutation.mutate()} 
            disabled={generateMutation.isPending}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 shadow-lg shadow-violet-500/20"
          >
            <Sparkles className={`mr-2 h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} /> 
            {generateMutation.isPending ? "Analyzing..." : "Generate Insights"}
          </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-6">
          <Card className="border-border/30 bg-card/50">
            <CardContent className="p-8 flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      ) : !evaluation ? (
        <Card className="border-dashed border-2 border-border/50 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-full bg-violet-500/10 flex items-center justify-center mb-6">
              <Brain className="h-10 w-10 text-violet-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Insights Available</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              We don't have any AI evaluation generated for {format(selectedDate, "MMMM yyyy")} yet. 
              Click the generate button above to analyze your financial data.
            </p>
            <Button 
              onClick={() => generateMutation.mutate()} 
              disabled={generateMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              <Sparkles className="mr-2 h-4 w-4" /> 
              Generate {format(selectedDate, "MMMM")} Insights
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Score & Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border/30 bg-card/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-bl-full" />
              <CardHeader>
                <CardTitle>Financial Score</CardTitle>
                <CardDescription>{format(new Date(evaluation.created_at), "MMM dd, yyyy 'at' HH:mm")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pb-8 relative z-10">
                <div className="relative flex items-center justify-center h-40 w-40 mb-4">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                    <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="10" 
                      strokeDasharray="439.8" 
                      strokeDashoffset={439.8 - (439.8 * evaluation.financial_score) / 100}
                      className={
                        evaluation.financial_score >= 80 ? "text-emerald-500" : 
                        evaluation.financial_score >= 60 ? "text-amber-500" : "text-rose-500"
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-bold">{evaluation.financial_score}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">/ 100</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  {evaluation.financial_score >= 80 ? "Excellent Standing" : 
                   evaluation.financial_score >= 60 ? "Needs Improvement" : "Critical Action Needed"}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-400" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {evaluation.summary}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Insights */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold mb-2">Key Findings & Recommendations</h3>
            
            <div className="grid gap-3">
              {evaluation.insights?.map((insight: any, index: number) => {
                // If it's old string array format
                if (typeof insight === 'string') {
                  return (
                    <div key={index} className="flex gap-3 p-4 rounded-xl border border-border/30 bg-card/50 hover:bg-muted/30 transition-colors">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                        <Sparkles className="h-5 w-5 text-violet-400" />
                      </div>
                      <p className="text-sm leading-relaxed">{insight}</p>
                    </div>
                  );
                }

                // If it's new object format with severity
                const config = severityConfig[(insight.severity || "info") as keyof typeof severityConfig] || severityConfig.info;
                const Icon = config.icon;

                return (
                  <div key={index} className={`flex gap-3 p-4 rounded-xl border ${config.border} bg-card/50 hover:bg-muted/20 transition-colors`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">{insight.category || "General Insight"}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{insight.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
