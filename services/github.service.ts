import { createClient } from "@/lib/supabase/client";
import type { 
  GithubUser, 
  GithubRepo, 
  GithubLanguageStats,
  GithubAggregatedStats
} from "@/types/github";

const GITHUB_API_URL = "https://api.github.com";

// Utility to create common headers
const createHeaders = (token?: string | null) => {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const githubService = {
  /**
   * Connect and save GitHub credentials to the user's profile
   */
  async connectGithub(username: string, token?: string) {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("profiles")
      .update({
        github_username: username,
        github_access_token: token || null,
        github_connected_at: new Date().toISOString(),
      })
      .eq("id", userData.user.id);

    if (error) throw error;
  },

  /**
   * Fetch saved GitHub credentials
   */
  async getCredentials() {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("github_username, github_access_token, github_connected_at")
      .eq("id", userData.user.id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Disconnect GitHub account
   */
  async disconnectGithub() {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("profiles")
      .update({
        github_username: null,
        github_access_token: null,
        github_connected_at: null,
      })
      .eq("id", userData.user.id);

    if (error) throw error;
  },

  /**
   * Fetch basic user profile from GitHub
   */
  async fetchUserProfile(username: string, token?: string | null): Promise<GithubUser> {
    const res = await fetch(`${GITHUB_API_URL}/users/${username}`, {
      headers: createHeaders(token),
    });

    if (!res.ok) throw new Error("Failed to fetch GitHub profile");
    return res.json();
  },

  /**
   * Fetch repositories for a user
   */
  async fetchRepositories(username: string, token?: string | null): Promise<GithubRepo[]> {
    // Fetch up to 100 recently pushed repos
    const res = await fetch(
      `${GITHUB_API_URL}/users/${username}/repos?sort=pushed&per_page=100`,
      { headers: createHeaders(token) }
    );

    if (!res.ok) throw new Error("Failed to fetch repositories");
    return res.json();
  },

  /**
   * Fetch recent commit events to calculate active days and recent commits
   * Uses the events API which returns up to 300 recent events (paginated)
   */
  async fetchRecentActivity(username: string, token?: string | null) {
    const res = await fetch(
      `${GITHUB_API_URL}/users/${username}/events/public?per_page=100`,
      { headers: createHeaders(token) }
    );

    if (!res.ok) return { recentCommitsCount: 0, activeDays: 0, currentStreak: 0, longestStreak: 0 };
    
    const events = await res.json();
    
    // Filter PushEvents
    const pushEvents = events.filter((e: any) => e.type === "PushEvent");
    
    let recentCommitsCount = 0;
    const activeDates = new Set<string>();

    pushEvents.forEach((event: any) => {
      recentCommitsCount += event.payload.commits?.length || 0;
      activeDates.add(new Date(event.created_at).toISOString().split('T')[0]);
    });

    const activeDaysArray = Array.from(activeDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    // Simple streak calculation based on the recent 100 events
    let currentStreak = 0;
    let longestStreak = 0;
    let currentCount = 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If active today or yesterday, they have an ongoing streak
    let hasOngoingStreak = activeDates.has(todayStr) || activeDates.has(yesterdayStr);
    
    // Calculate streak from the array of sorted dates
    if (activeDaysArray.length > 0) {
      currentCount = 1;
      for (let i = 0; i < activeDaysArray.length - 1; i++) {
        const d1 = new Date(activeDaysArray[i]);
        const d2 = new Date(activeDaysArray[i + 1]);
        const diffTime = Math.abs(d1.getTime() - d2.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
          currentCount++;
        } else {
          longestStreak = Math.max(longestStreak, currentCount);
          if (i === 0 && !hasOngoingStreak) {
             currentStreak = 0; // The streak is broken
          } else if (currentStreak === 0 && hasOngoingStreak) {
             currentStreak = currentCount; 
          }
          currentCount = 1;
        }
      }
      longestStreak = Math.max(longestStreak, currentCount);
      if (hasOngoingStreak && currentStreak === 0) currentStreak = currentCount;
    }

    return {
      recentCommitsCount,
      activeDays: activeDates.size,
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak)
    };
  },

  /**
   * Aggregate stats combining user info, repos, and events
   */
  async getAggregatedStats(username: string, token?: string | null): Promise<GithubAggregatedStats> {
    const [repos, activity] = await Promise.all([
      this.fetchRepositories(username, token),
      this.fetchRecentActivity(username, token),
    ]);

    let totalStars = 0;
    let totalForks = 0;
    let totalOpenIssues = 0;
    const langMap = new Map<string, number>();

    repos.forEach((repo) => {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      totalOpenIssues += repo.open_issues_count || 0;
      
      if (repo.language) {
        langMap.set(repo.language, (langMap.get(repo.language) || 0) + 1);
      }
    });

    const totalLangCount = Array.from(langMap.values()).reduce((a, b) => a + b, 0);
    const languages = Array.from(langMap.entries())
      .map(([name, count]) => ({
        name,
        value: count,
        percentage: totalLangCount > 0 ? (count / totalLangCount) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    return {
      totalRepos: repos.length,
      totalStars,
      totalForks,
      totalOpenIssues,
      languages,
      recentCommitsCount: activity.recentCommitsCount,
      activeDays: activity.activeDays,
      streak: {
        current: activity.currentStreak,
        longest: activity.longestStreak
      }
    };
  }
};
