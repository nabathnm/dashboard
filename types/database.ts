// ============================================================
// GrowthMe Financial Tracker — Database Types
// Mirrors Supabase PostgreSQL table schemas
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export type AccountType = "bank" | "ewallet" | "cash" | "savings";

export type TransactionType = "expense" | "income" | "transfer";

export type SharedExpenseStatus = "pending" | "partial" | "settled";

export type ParticipantPaymentStatus = "unpaid" | "paid";

// ─── Database Row Types ──────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TransactionCategory {
  id: string;
  user_id: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  type: TransactionType;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  destination_account_id: string | null;
  type: TransactionType;
  amount: number;
  merchant: string | null;
  note: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  // Joined fields (optional)
  account?: Account;
  category?: TransactionCategory;
  destination_account?: Account;
}

export interface SharedExpense {
  id: string;
  user_id: string;
  title: string;
  total_amount: number;
  description: string | null;
  date: string;
  status: SharedExpenseStatus;
  created_at: string;
  updated_at: string;
  // Joined
  participants?: SharedExpenseParticipant[];
}

export interface SharedExpenseParticipant {
  id: string;
  shared_expense_id: string;
  name: string;
  amount_owed: number;
  amount_paid: number;
  payment_status: ParticipantPaymentStatus;
  paid_at: string | null;
  created_at: string;
}

export interface MonthlyFinancialSummary {
  id: string;
  user_id: string;
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  net_savings: number;
  top_category: string | null;
  created_at: string;
}

export interface AIFinancialEvaluation {
  id: string;
  user_id: string;
  month: number;
  year: number;
  financial_score: number;
  summary: string;
  insights: AIInsight[];
  recommendations: string[];
  created_at: string;
}

export interface AIInsight {
  category: string;
  message: string;
  severity: "info" | "warning" | "critical";
  percentage_change?: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  is_read: boolean;
  created_at: string;
}

// ─── DTO Types (Create / Update) ─────────────────────────────

export interface CreateAccountDTO {
  name: string;
  type: AccountType;
  balance: number;
  color?: string;
  icon?: string;
  is_active?: boolean;
}

export interface UpdateAccountDTO {
  name?: string;
  type?: AccountType;
  balance?: number;
  color?: string;
  icon?: string;
  is_active?: boolean;
}

export interface CreateTransactionDTO {
  account_id: string;
  category_id?: string;
  destination_account_id?: string;
  type: TransactionType;
  amount: number;
  description?: string;
  date: string;
}

export interface UpdateTransactionDTO {
  account_id?: string;
  category_id?: string;
  destination_account_id?: string;
  type?: TransactionType;
  amount?: number;
  description?: string;
  date?: string;
}

export interface CreateSharedExpenseDTO {
  title: string;
  total_amount: number;
  description?: string;
  date: string;
  participants: {
    name: string;
    amount_owed: number;
  }[];
}

// ─── Filter / Query Types ────────────────────────────────────

export interface TransactionFilters {
  search?: string;
  type?: TransactionType;
  category_id?: string;
  account_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ─── Chart Data Types ────────────────────────────────────────

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface MonthlyChartData {
  month: string;
  income: number;
  expense: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  icon?: string;
}
