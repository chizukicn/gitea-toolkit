/**
 * Gitea API v1 types.
 */

export interface User {
  id: number;
  login: string;
  username?: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  description?: string;
  website?: string;
  location?: string;
  language?: string;
  is_admin?: boolean;
  is_activated?: boolean;
  restricted?: boolean;
  prohibit_login?: boolean;
  visibility?: string;
  created_at?: string;
  last_login?: string;
  follower_count?: number;
  following_count?: number;
  starred_repos_count?: number;
}

export interface Issue {
  id: number;
  index?: number;
  number?: number;
  title: string;
  state: "open" | "closed";
  body?: string;
  html_url?: string;
  created_at?: string;
  updated_at?: string;
  user?: User;
  labels?: Array<{ name: string; color?: string }>;
  assignees?: User[];
  milestone?: { title: string };
  comments?: number;
}

export interface PullRequest {
  id: number;
  index?: number;
  number?: number;
  title: string;
  state: "open" | "closed";
  body?: string;
  html_url?: string;
  created_at?: string;
  updated_at?: string;
  user?: User;
  labels?: Array<{ name: string; color?: string }>;
  assignees?: User[];
  base?: { ref: string };
  head?: { ref: string; sha: string };
  mergeable?: boolean;
  merged?: boolean;
  merged_at?: string;
  merged_by?: User;
  comments?: number;
}

export interface PullFile {
  filename: string;
  status?: string;
  additions?: number;
  deletions?: number;
  changes?: number;
  sha?: string;
  previous_filename?: string;
}
