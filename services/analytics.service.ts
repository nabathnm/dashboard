import { createClient } from "@/lib/supabase/client";
import type {
  MonthlyFinancialSummary,
  CategorySpending,
  MonthlyChartData,
} from "@/types/database";

const supabase = createClient();

const CHART_COLORS = [
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#f43f5e", // rose
  "#6366f1", // indigo
  "#84cc16", // lime
  "#ec4899", // pink
  "#14b8a6", // teal
  "#a855f7", // purple
];

export const analyticsService = {
  async getMonthlyFinancialSummary(
    year: number,
    month: number
  ): Promise<MonthlyFinancialSummary | null> {
    const { data, error } = await supabase
      .from("monthly_financial_summaries")
      .select("*")
      .eq("year", year)
      .eq("month", month)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async getSpendingByCategory(
    year: number,
    month: number
  ): Promise<CategorySpending[]> {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const { data, error } = await supabase
      .from("transactions")
      .select("amount, category:transaction_categories!category_id(name, color, icon)")
      .eq("type", "expense")
      .gte("transaction_date", startDate)
      .lt("transaction_date", endDate);

    if (error) throw error;

    // Aggregate by category
    const categoryMap = new Map<string, { amount: number; color: string; icon?: string }>();

    (data ?? []).forEach((t: any) => {
      const catName = t.category?.name ?? "Uncategorized";
      const existing = categoryMap.get(catName) || {
        amount: 0,
        color: t.category?.color || CHART_COLORS[categoryMap.size % CHART_COLORS.length],
        icon: t.category?.icon,
      };
      existing.amount += t.amount;
      categoryMap.set(catName, existing);
    });

    const total = Array.from(categoryMap.values()).reduce(
      (sum, c) => sum + c.amount,
      0
    );

    return Array.from(categoryMap.entries())
      .map(([category, { amount, color, icon }], index) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: color || CHART_COLORS[index % CHART_COLORS.length],
        icon,
      }))
      .sort((a, b) => b.amount - a.amount);
  },

  async getMonthlyTrend(year: number): Promise<MonthlyChartData[]> {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const { data, error } = await supabase
      .from("transactions")
      .select("type, amount, transaction_date")
      .gte("transaction_date", `${year}-01-01`)
      .lt("transaction_date", `${year + 1}-01-01`);

    if (error) throw error;

    const monthlyData: MonthlyChartData[] = months.map((month) => ({
      month,
      income: 0,
      expense: 0,
    }));

    (data ?? []).forEach((t) => {
      const monthIndex = new Date(t.transaction_date).getMonth();
      if (t.type === "income") {
        monthlyData[monthIndex].income += t.amount;
      } else if (t.type === "expense") {
        monthlyData[monthIndex].expense += t.amount;
      }
    });

    return monthlyData;
  },

  async getIncomeVsExpense(
    year: number
  ): Promise<{ month: string; income: number; expense: number }[]> {
    return this.getMonthlyTrend(year);
  },
};
