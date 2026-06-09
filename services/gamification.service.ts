import { createClient } from "@/lib/supabase/client";
import type {
  UserGamification,
  BadgeWithStatus,
  AddXPResult,
  WeeklySynergyData,
} from "@/types/database";

const XP_PER_LEVEL = 500;

function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export const gamificationService = {
  /**
   * Get user's gamification profile. Auto-creates if not found.
   */
  async getProfile(): Promise<UserGamification> {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("user_gamification")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    if (error && error.code === "PGRST116") {
      // Not found — create a fresh profile
      const { data: newProfile, error: insertError } = await supabase
        .from("user_gamification")
        .insert({ id: userData.user.id, xp: 0, level: 1, streak_count: 0 })
        .select()
        .single();

      if (insertError) throw insertError;
      return newProfile;
    }

    if (error) throw error;
    return data;
  },

  /**
   * Add XP and handle level-up + streak tracking.
   */
  async addXP(amount: number): Promise<AddXPResult> {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("User not authenticated");

    // Get current profile
    const profile = await this.getProfile();

    const previousLevel = profile.level;
    const newXP = profile.xp + amount;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > previousLevel;

    // Calculate streak
    const today = new Date().toISOString().split("T")[0];
    let newStreak = profile.streak_count;

    if (profile.last_active_date !== today) {
      const lastDate = profile.last_active_date
        ? new Date(profile.last_active_date)
        : null;
      const todayDate = new Date(today);

      if (lastDate) {
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak = profile.streak_count + 1;
        } else if (diffDays > 1) {
          newStreak = 1; // Reset streak
        }
      } else {
        newStreak = 1; // First activity
      }
    }

    // Update profile
    const { error } = await supabase
      .from("user_gamification")
      .update({
        xp: newXP,
        level: newLevel,
        streak_count: newStreak,
        last_active_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userData.user.id);

    if (error) throw error;

    // Check for badge unlocks after XP update
    await this.checkAndUnlockBadges(newXP, newLevel, newStreak);

    return {
      newXP,
      newLevel,
      previousLevel,
      leveledUp,
      xpAdded: amount,
    };
  },

  /**
   * Get all badges with user's unlock status.
   */
  async getAllBadges(): Promise<BadgeWithStatus[]> {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("User not authenticated");

    // Fetch all badges
    const { data: badges, error: badgesError } = await supabase
      .from("badges")
      .select("*")
      .order("xp_reward", { ascending: true });

    if (badgesError) throw badgesError;

    // Fetch user's unlocked badges
    const { data: userBadges, error: ubError } = await supabase
      .from("user_badges")
      .select("badge_id, unlocked_at")
      .eq("user_id", userData.user.id);

    if (ubError) throw ubError;

    const unlockedMap = new Map(
      (userBadges ?? []).map((ub) => [ub.badge_id, ub.unlocked_at])
    );

    return (badges ?? []).map((badge) => ({
      ...badge,
      is_unlocked: unlockedMap.has(badge.id),
      unlocked_at: unlockedMap.get(badge.id) ?? null,
    }));
  },

  /**
   * Check eligibility and unlock badges automatically.
   */
  async checkAndUnlockBadges(
    xp: number,
    level: number,
    streak: number
  ): Promise<string[]> {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("User not authenticated");

    // Get all badges and user's current unlocked badges
    const [allBadges, userBadges] = await Promise.all([
      supabase.from("badges").select("*"),
      supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userData.user.id),
    ]);

    if (allBadges.error) throw allBadges.error;

    const unlockedSet = new Set(
      (userBadges.data ?? []).map((ub) => ub.badge_id)
    );

    // Get task completion count
    const { count: taskCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userData.user.id)
      .eq("status", "done");

    const newlyUnlocked: string[] = [];

    for (const badge of allBadges.data ?? []) {
      if (unlockedSet.has(badge.id)) continue;

      const reqs = badge.requirements as Record<string, any>;
      let eligible = true;

      // Check each requirement
      if (reqs.tasks_completed && (taskCount ?? 0) < reqs.tasks_completed) {
        eligible = false;
      }
      if (reqs.level && level < reqs.level) {
        eligible = false;
      }
      if (reqs.active_streak && streak < reqs.active_streak) {
        eligible = false;
      }
      // Complex badges like routine_streak, github_streak, budget_streak
      // are harder to verify in real-time — skip auto-check for now
      if (reqs.routine_streak || reqs.github_streak || reqs.budget_streak) {
        eligible = false;
      }

      if (eligible) {
        const { error } = await supabase.from("user_badges").insert({
          user_id: userData.user.id,
          badge_id: badge.id,
        });

        if (!error) {
          newlyUnlocked.push(badge.id);

          // Award badge XP bonus
          const currentProfile = await this.getProfile();
          const bonusXP = currentProfile.xp + badge.xp_reward;
          const bonusLevel = calculateLevel(bonusXP);

          await supabase
            .from("user_gamification")
            .update({
              xp: bonusXP,
              level: bonusLevel,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userData.user.id);
        }
      }
    }

    return newlyUnlocked;
  },

  /**
   * Calculate weekly synergy data across all 4 pillars.
   * Returns normalized scores (0-100) for radar chart.
   */
  async getWeeklySynergyData(): Promise<WeeklySynergyData[]> {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("User not authenticated");

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todayStr = today.toISOString().split("T")[0];
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    // 1. Tasks: % completed this week
    const { data: weekTasks } = await supabase
      .from("tasks")
      .select("status")
      .eq("user_id", userData.user.id)
      .gte("created_at", weekAgoStr);

    const totalTasks = (weekTasks ?? []).length;
    const doneTasks = (weekTasks ?? []).filter(
      (t) => t.status === "done"
    ).length;
    const taskScore =
      totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // 2. Routines: average completion rate this week
    const { data: weekRoutines } = await supabase
      .from("daily_routines")
      .select("is_completed")
      .eq("user_id", userData.user.id)
      .gte("routine_date", weekAgoStr)
      .lte("routine_date", todayStr);

    const totalRoutines = (weekRoutines ?? []).length;
    const doneRoutines = (weekRoutines ?? []).filter(
      (r) => r.is_completed
    ).length;
    const routineScore =
      totalRoutines > 0
        ? Math.round((doneRoutines / totalRoutines) * 100)
        : 0;

    // 3. Finances: calculate savings ratio (income - expense) / income
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;

    const { data: monthTransactions } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", userData.user.id)
      .gte("transaction_date", startOfMonth);

    let totalIncome = 0;
    let totalExpense = 0;
    (monthTransactions ?? []).forEach((t) => {
      if (t.type === "income") totalIncome += t.amount;
      if (t.type === "expense") totalExpense += t.amount;
    });

    const financeScore =
      totalIncome > 0
        ? Math.min(100, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
        : 50; // Default to 50 if no data

    // 4. GitHub: use streak from gamification profile as a proxy
    const profile = await this.getProfile();
    const githubScore = Math.min(100, profile.streak_count * 15); // 7-day streak = 105 → capped at 100

    return [
      { pillar: "Productivity", value: taskScore, fullMark: 100 },
      { pillar: "Routine", value: routineScore, fullMark: 100 },
      { pillar: "Frugality", value: Math.max(0, financeScore), fullMark: 100 },
      { pillar: "Coding", value: githubScore, fullMark: 100 },
    ];
  },
};
