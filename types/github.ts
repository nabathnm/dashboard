export interface GithubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
}

export interface GithubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

export interface GithubLanguageStats {
  [language: string]: number;
}

export interface GithubAggregatedStats {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  totalOpenIssues: number;
  languages: { name: string; value: number; percentage: number }[];
  recentCommitsCount: number; // in the last X days
  streak: {
    current: number;
    longest: number;
  };
  activeDays: number;
}
