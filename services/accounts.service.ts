import { createClient } from "@/lib/supabase/client";
import type { Account, CreateAccountDTO, UpdateAccountDTO } from "@/types/database";

const supabase = createClient();

export const accountsService = {
  async getAll(): Promise<Account[]> {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<Account> {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async getActive(): Promise<Account[]> {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async create(dto: CreateAccountDTO): Promise<Account> {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("accounts")
      .insert({ ...dto, user_id: userData.user?.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, dto: UpdateAccountDTO): Promise<Account> {
    const { data, error } = await supabase
      .from("accounts")
      .update({ ...dto })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;
  },

  async toggleActive(id: string, is_active: boolean): Promise<Account> {
    return this.update(id, { is_active });
  },

  async getTotalBalance(): Promise<number> {
    const { data, error } = await supabase
      .from("accounts")
      .select("balance")
      .eq("is_active", true);

    if (error) throw error;
    return (data ?? []).reduce((sum, acc) => sum + (acc.balance || 0), 0);
  },
};
