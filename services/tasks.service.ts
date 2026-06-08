import { createClient } from "@/lib/supabase/client";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  ReorderTaskInput,
} from "@/types/task";

const supabase = createClient();

export const tasksService = {
  async getAll(filters: TaskFilters = {}): Promise<Task[]> {
    const { status, category, search, sort_by } = filters;

    let query = supabase.from("tasks").select("*");

    if (status) query = query.eq("status", status);
    if (category) query = query.eq("category", category);
    if (search) query = query.ilike("title", `%${search}%`);

    // Apply sorting
    switch (sort_by) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "due_date":
        query = query.order("due_date", { ascending: true, nullsFirst: false });
        break;
      case "category":
        query = query.order("category", { ascending: true });
        break;
      case "progress":
        query = query.order("progress", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(dto: CreateTaskInput): Promise<Task> {
    const { data: userData } = await supabase.auth.getUser();

    // Calculate position: place at end
    const { data: lastTask } = await supabase
      .from("tasks")
      .select("position")
      .eq("user_id", userData.user?.id)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const position = lastTask ? lastTask.position + 1024 : 1024;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        ...dto,
        user_id: userData.user?.id,
        position,
        description: dto.description ?? "",
        progress: dto.progress ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, dto: UpdateTaskInput): Promise<Task> {
    const payload = { ...dto, updated_at: new Date().toISOString() } as any;

    // Handle completed_at automatically based on status/progress
    if (dto.status === "done" || dto.progress === 100) {
      payload.completed_at = new Date().toISOString();
      payload.status = "done";
      payload.progress = 100;
    } else if (dto.status !== undefined) {
      payload.completed_at = null;
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
  },

  async updateStatus(id: string, status: Task["status"]): Promise<Task> {
    const { data: userData } = await supabase.auth.getUser();

    // Place at end
    const { data: lastTask } = await supabase
      .from("tasks")
      .select("position")
      .eq("user_id", userData.user?.id)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const position = lastTask ? lastTask.position + 1024 : 1024;

    const completed_at = status === "done" ? new Date().toISOString() : null;
    const progress = status === "done" ? 100 : undefined;

    const payload: any = {
      status,
      position,
      completed_at,
      updated_at: new Date().toISOString(),
    };
    if (progress !== undefined) payload.progress = progress;

    const { data, error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async reorder(updates: ReorderTaskInput[]): Promise<void> {
    const promises = updates.map(({ id, status, position }) =>
      supabase
        .from("tasks")
        .update({
          status,
          position,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
    );

    const results = await Promise.all(promises);
    const firstError = results.find((r) => r.error);
    if (firstError?.error) throw firstError.error;
  },
};
