import { createClient } from "@/lib/supabase/client";
import type {
  Transaction,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionFilters,
  PaginatedResponse,
  TransactionCategory,
} from "@/types/database";

const supabase = createClient();

export const transactionsService = {
  async getAll(
    filters: TransactionFilters = {}
  ): Promise<PaginatedResponse<Transaction>> {
    const {
      search,
      type,
      category_id,
      account_id,
      date_from,
      date_to,
      page = 1,
      per_page = 10,
    } = filters;

    let query = supabase
      .from("transactions")
      .select(
        "*, account:accounts!account_id(*), category:transaction_categories!category_id(*), destination_account:accounts!destination_account_id(*)",
        { count: "exact" }
      );

    if (type) query = query.eq("type", type);
    if (category_id) query = query.eq("category_id", category_id);
    if (account_id) query = query.eq("account_id", account_id);
    if (date_from) query = query.gte("transaction_date", date_from);
    if (date_to) query = query.lte("transaction_date", date_to);
    if (search) query = query.ilike("merchant", `%${search}%`);

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error, count } = await query
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: data ?? [],
      count: count ?? 0,
      page,
      per_page,
      total_pages: Math.ceil((count ?? 0) / per_page),
    };
  },

  async getRecent(limit: number = 5): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "*, account:accounts!account_id(*), category:transaction_categories!category_id(*)"
      )
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },

  async create(dto: CreateTransactionDTO): Promise<Transaction> {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("transactions")
      .insert({ ...dto, user_id: userData.user?.id })
      .select()
      .single();

    if (error) throw error;

    // Update account balance
    await this.updateAccountBalance(dto);

    return data;
  },

  async update(
    id: string,
    dto: UpdateTransactionDTO,
    oldTransaction: Transaction
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from("transactions")
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
  },

  async getCategories(): Promise<TransactionCategory[]> {
    const { data, error } = await supabase
      .from("transaction_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async getMonthlyTotals(
    year: number,
    month: number
  ): Promise<{ income: number; expense: number }> {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const { data, error } = await supabase
      .from("transactions")
      .select("type, amount")
      .gte("transaction_date", startDate)
      .lt("transaction_date", endDate);

    if (error) throw error;

    const totals = (data ?? []).reduce(
      (acc, t) => {
        if (t.type === "income") acc.income += t.amount;
        else if (t.type === "expense") acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );

    return totals;
  },

  // Private helper
  async updateAccountBalance(dto: CreateTransactionDTO): Promise<void> {
    const { data: account } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", dto.account_id)
      .single();

    if (!account) return;

    let newBalance = Number(account.balance || 0);
    const amount = Number(dto.amount || 0);
    
    if (dto.type === "income") {
      newBalance += amount;
    } else if (dto.type === "expense") {
      newBalance -= amount;
    } else if (dto.type === "transfer") {
      newBalance -= amount;
    }

    await supabase
      .from("accounts")
      .update({ balance: newBalance })
      .eq("id", dto.account_id);

    // Handle transfer destination
    if (dto.type === "transfer" && dto.destination_account_id) {
      const { data: destAccount } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", dto.destination_account_id)
        .single();

      if (destAccount) {
        const destBalance = Number(destAccount.balance || 0);
        await supabase
          .from("accounts")
          .update({ balance: destBalance + amount })
          .eq("id", dto.destination_account_id);
      }
    }
  },
};
