// ============================================================
// GrowthMe AI Daily Routine Planner — Type Definitions
// Mirrors Supabase daily_routines & routine_user_profiles tables
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export type RoutineCategory =
  | "health"
  | "nutrition"
  | "productivity"
  | "personal_growth"
  | "custom";

export type EnergyPreference = "morning" | "afternoon" | "evening";

export interface CollegeClass {
  id: string;
  subject: string;
  start_time: string; // e.g., "08:00"
  end_time: string;   // e.g., "10:30"
  room?: string;
  category?: "college" | "organization"; // Replaces color
}

// ─── Database Row Types ──────────────────────────────────────

export interface DailyRoutine {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: RoutineCategory;
  scheduled_time: string; // HH:MM:SS format from Supabase time column
  estimated_duration: number; // in minutes
  is_completed: boolean;
  completed_at: string | null;
  ai_generated: boolean;
  priority: number;
  routine_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface RoutineUserProfile {
  id: string;
  user_id: string;
  goals: string[];
  college_schedule: Record<string, CollegeClass[]> | null; // e.g. { "monday": [{...}] }
  sleep_start: string | null; // HH:MM
  sleep_end: string | null; // HH:MM
  organization_schedule: Record<string, string> | null; // e.g. { "tuesday": "18:00-20:00" }
  energy_preference: EnergyPreference | null;
  created_at: string;
  updated_at: string;
}

// ─── DTO Types (Create / Update) ─────────────────────────────

export interface CreateRoutineDTO {
  title: string;
  description?: string;
  category: RoutineCategory;
  scheduled_time: string;
  estimated_duration: number;
  routine_date: string;
  ai_generated?: boolean;
  priority?: number;
}

export interface UpsertRoutineProfileDTO {
  goals: string[];
  college_schedule?: Record<string, CollegeClass[]> | null;
  sleep_start?: string;
  sleep_end?: string;
  organization_schedule?: Record<string, string> | null;
  energy_preference?: EnergyPreference;
}

// ─── AI Generation Types ─────────────────────────────────────

export interface AIRoutineItem {
  title: string;
  description: string;
  category: RoutineCategory;
  scheduled_time: string; // HH:MM
  estimated_duration: number;
  priority: number;
}

export interface GenerateRoutinePayload {
  date: string; // YYYY-MM-DD
  profile: RoutineUserProfile;
  existingTasks: { title: string; due_date: string | null }[];
  previousCompletionRate: number; // 0-100
}

// ─── Filter / Query Types ────────────────────────────────────

export interface RoutineFilters {
  date?: string;
  category?: RoutineCategory;
  completed?: boolean;
}

// ─── Statistics ──────────────────────────────────────────────

export interface RoutineStats {
  total: number;
  completed: number;
  completionRate: number;
}

export interface RoutineWeeklyStats {
  date: string;
  total: number;
  completed: number;
  completionRate: number;
}
