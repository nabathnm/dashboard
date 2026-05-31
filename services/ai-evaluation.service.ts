import { createClient } from "@/lib/supabase/client";
import type { AIFinancialEvaluation, AIInsight } from "@/types/database";

const supabase = createClient();

// Pattern-based AI insights generator (no external API needed)
function generateInsights(
  income: number,
  expense: number,
  categorySpending: { category: string; amount: number; percentage: number }[],
  previousMonthExpense: number
): AIInsight[] {
  const insights: AIInsight[] = [];
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const expenseChange =
    previousMonthExpense > 0
      ? ((expense - previousMonthExpense) / previousMonthExpense) * 100
      : 0;

  // Overall spending trend
  if (expenseChange > 15) {
    insights.push({
      category: "Overall Spending",
      message: `Your spending increased by ${expenseChange.toFixed(1)}% compared to last month. Consider reviewing your expenses.`,
      severity: "warning",
      percentage_change: expenseChange,
    });
  } else if (expenseChange < -10) {
    insights.push({
      category: "Overall Spending",
      message: `Great job! Your spending decreased by ${Math.abs(expenseChange).toFixed(1)}% compared to last month.`,
      severity: "info",
      percentage_change: expenseChange,
    });
  }

  // Savings rate
  if (savingsRate < 10) {
    insights.push({
      category: "Savings",
      message: `Your savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your income.`,
      severity: "critical",
    });
  } else if (savingsRate >= 20) {
    insights.push({
      category: "Savings",
      message: `Excellent savings rate of ${savingsRate.toFixed(1)}%! You're building a strong financial foundation.`,
      severity: "info",
    });
  }

  // Top category analysis
  if (categorySpending.length > 0) {
    const topCategory = categorySpending[0];
    if (topCategory.percentage > 40) {
      insights.push({
        category: topCategory.category,
        message: `${topCategory.category} makes up ${topCategory.percentage.toFixed(1)}% of your total spending. This seems high — consider setting a budget limit.`,
        severity: "warning",
        percentage_change: topCategory.percentage,
      });
    }

    // Check for entertainment/lifestyle spending
    const lifestyleCategories = ["Entertainment", "Coffee", "Shopping", "Dining"];
    const lifestyleSpending = categorySpending.filter((c) =>
      lifestyleCategories.some((lc) =>
        c.category.toLowerCase().includes(lc.toLowerCase())
      )
    );
    const totalLifestyle = lifestyleSpending.reduce((sum, c) => sum + c.amount, 0);
    if (totalLifestyle > income * 0.15) {
      insights.push({
        category: "Lifestyle",
        message: `Your lifestyle spending (entertainment, dining, coffee) exceeds 15% of your income. Small cuts here can add up significantly.`,
        severity: "warning",
      });
    }
  }

  // If no issues found, add a positive insight
  if (insights.length === 0) {
    insights.push({
      category: "Overall",
      message: "Your finances look healthy this month! Keep up the good work.",
      severity: "info",
    });
  }

  return insights;
}

function calculateFinancialScore(
  income: number,
  expense: number,
  savingsRate: number,
  insightsSeverity: AIInsight[]
): number {
  let score = 70; // Base score

  // Savings rate bonus
  if (savingsRate >= 30) score += 15;
  else if (savingsRate >= 20) score += 10;
  else if (savingsRate >= 10) score += 5;
  else score -= 10;

  // Income > expense bonus
  if (income > expense) score += 10;
  else score -= 15;

  // Penalty for critical insights
  const criticals = insightsSeverity.filter((i) => i.severity === "critical").length;
  const warnings = insightsSeverity.filter((i) => i.severity === "warning").length;
  score -= criticals * 10;
  score -= warnings * 5;

  return Math.max(0, Math.min(100, score));
}

export const aiEvaluationService = {
  async getLatest(
    year: number,
    month: number
  ): Promise<AIFinancialEvaluation | null> {
    const { data, error } = await supabase
      .from("ai_financial_evaluations")
      .select("*")
      .eq("year", year)
      .eq("month", month)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async getAll(): Promise<AIFinancialEvaluation[]> {
    const { data, error } = await supabase
      .from("ai_financial_evaluations")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async generate(
    year: number,
    month: number
  ): Promise<AIFinancialEvaluation> {
    const { data: transactions, error: tError } = await supabase
      .from("transactions")
      .select("type, amount")
      .gte("transaction_date", `${year}-${String(month).padStart(2, '0')}-01`)
      .lt("transaction_date", month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`);
      
    if (tError) throw tError;

    let income = 0;
    let expense = 0;
    transactions?.forEach(t => {
      if (t.type === "income") income += t.amount;
      if (t.type === "expense") expense += t.amount;
    });

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    
    const { data: prevTransactions } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("type", "expense")
      .gte("transaction_date", `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`)
      .lt("transaction_date", `${year}-${String(month).padStart(2, '0')}-01`);
      
    const previousMonthExpense = prevTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

    const { data: catData } = await supabase
      .from("transactions")
      .select("amount, category:transaction_categories!category_id(name)")
      .eq("type", "expense")
      .gte("transaction_date", `${year}-${String(month).padStart(2, '0')}-01`)
      .lt("transaction_date", month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`);

    const categoryMap = new Map<string, number>();
    catData?.forEach((t: any) => {
      const name = t.category?.name || "Uncategorized";
      categoryMap.set(name, (categoryMap.get(name) || 0) + t.amount);
    });

    const categorySpending = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: expense > 0 ? (amount / expense) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);

    const insights = generateInsights(
      income,
      expense,
      categorySpending,
      previousMonthExpense
    );

    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const financialScore = calculateFinancialScore(
      income,
      expense,
      savingsRate,
      insights
    );

    const recommendations = [
      savingsRate < 20
        ? "Try to increase your savings rate to at least 20%."
        : "Maintain your excellent savings rate!",
      "Review recurring subscriptions monthly.",
      "Set up automatic transfers to your savings account.",
      "Track your daily expenses to identify unnecessary spending.",
    ];

    const summary =
      savingsRate >= 20
        ? `Strong month! You saved ${savingsRate.toFixed(1)}% of your income with a financial score of ${financialScore}/100.`
        : `This month you spent Rp${expense.toLocaleString("id-ID")} against Rp${income.toLocaleString("id-ID")} income. Focus on reducing non-essential spending.`;

    const { data: userData } = await supabase.auth.getUser();

    // Upsert evaluation
    const { data, error } = await supabase
      .from("ai_financial_evaluations")
      .upsert(
        {
          user_id: userData.user?.id,
          year,
          month,
          financial_score: financialScore,
          summary,
          insights,
          recommendations,
        },
        { onConflict: "user_id,year,month" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
