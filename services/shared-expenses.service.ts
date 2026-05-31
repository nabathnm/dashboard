import { createClient } from "@/lib/supabase/client";
import type {
  SharedExpense,
  SharedExpenseParticipant,
  CreateSharedExpenseDTO,
} from "@/types/database";

const supabase = createClient();

export const sharedExpensesService = {
  async getAll(): Promise<SharedExpense[]> {
    const { data, error } = await supabase
      .from("shared_expenses")
      .select("*, participants:shared_expense_participants(*)")
      .order("date", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<SharedExpense> {
    const { data, error } = await supabase
      .from("shared_expenses")
      .select("*, participants:shared_expense_participants(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(dto: CreateSharedExpenseDTO): Promise<SharedExpense> {
    const { data: userData } = await supabase.auth.getUser();
    const { participants, ...expenseData } = dto;

    // Create the shared expense
    const { data: expense, error: expenseError } = await supabase
      .from("shared_expenses")
      .insert({
        ...expenseData,
        user_id: userData.user?.id,
        status: "pending",
      })
      .select()
      .single();

    if (expenseError) throw expenseError;

    // Create participants
    const participantsData = participants.map((p) => ({
      shared_expense_id: expense.id,
      name: p.name,
      amount_owed: p.amount_owed,
      amount_paid: 0,
      payment_status: "unpaid" as const,
    }));

    const { error: partError } = await supabase
      .from("shared_expense_participants")
      .insert(participantsData);

    if (partError) throw partError;

    return this.getById(expense.id);
  },

  async markParticipantPaid(
    participantId: string,
    amountPaid: number
  ): Promise<SharedExpenseParticipant> {
    const { data, error } = await supabase
      .from("shared_expense_participants")
      .update({
        amount_paid: amountPaid,
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", participantId)
      .select()
      .single();

    if (error) throw error;

    // Check if all participants are paid and update expense status
    const { data: participant } = await supabase
      .from("shared_expense_participants")
      .select("shared_expense_id")
      .eq("id", participantId)
      .single();

    if (participant) {
      await this.updateExpenseStatus(participant.shared_expense_id);
    }

    return data;
  },

  async updateExpenseStatus(expenseId: string): Promise<void> {
    const { data: participants } = await supabase
      .from("shared_expense_participants")
      .select("payment_status")
      .eq("shared_expense_id", expenseId);

    if (!participants) return;

    const allPaid = participants.every((p) => p.payment_status === "paid");
    const somePaid = participants.some((p) => p.payment_status === "paid");

    const status = allPaid ? "settled" : somePaid ? "partial" : "pending";

    await supabase
      .from("shared_expenses")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", expenseId);
  },

  async delete(id: string): Promise<void> {
    // Delete participants first (cascade may handle this, but being explicit)
    await supabase
      .from("shared_expense_participants")
      .delete()
      .eq("shared_expense_id", id);

    const { error } = await supabase
      .from("shared_expenses")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getOutstandingTotal(): Promise<number> {
    const { data, error } = await supabase
      .from("shared_expense_participants")
      .select("amount_owed, amount_paid")
      .eq("payment_status", "unpaid");

    if (error) throw error;
    return (data ?? []).reduce(
      (sum, p) => sum + (p.amount_owed - p.amount_paid),
      0
    );
  },
};
