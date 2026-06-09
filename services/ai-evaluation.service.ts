import { createClient } from "@/lib/supabase/client";
import type { AIFinancialEvaluation, AIInsight } from "@/types/database";

const supabase = createClient();



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

    // Call our new API route that uses Gemini API
    const res = await fetch("/api/ai-evaluation/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month,
        year,
        income,
        expense,
        previousMonthExpense,
        categorySpending,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to generate insights from AI");
    }

    const { financial_score, summary, insights, recommendations } = await res.json();

    const { data: userData } = await supabase.auth.getUser();

    // Upsert evaluation
    const { data, error } = await supabase
      .from("ai_financial_evaluations")
      .upsert(
        {
          user_id: userData.user?.id,
          year,
          month,
          financial_score,
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
