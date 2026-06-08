// ============================================================
// GrowthMe Task Management — Type Definitions
// Mirrors Supabase tasks table schema
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export type TaskStatus = "todo" | "in_progress" | "done";

export type TaskCategory = "kuliah" | "organisasi" | "praktikum" | "lainnya";

// ─── Database Row Type ───────────────────────────────────────

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  progress: number;
  due_date: string | null;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// ─── DTO Types (Create / Update) ─────────────────────────────

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  category: TaskCategory;
  progress?: number;
  due_date?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  progress?: number;
  due_date?: string | null;
  position?: number;
}

// ─── Filter / Query Types ────────────────────────────────────

export type TaskSortBy = "newest" | "oldest" | "due_date" | "category" | "progress";

export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  search?: string;
  sort_by?: TaskSortBy;
}

// ─── Statistics ──────────────────────────────────────────────

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

// ─── Reorder Payload ─────────────────────────────────────────

export interface ReorderTaskInput {
  id: string;
  status: TaskStatus;
  position: number;
}
