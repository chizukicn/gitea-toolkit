/**
 * Gitea SDK: API (fetch) + stateful client.
 * Raw API functions take Login; GiteaClient is stateful and uses a store.
 */

import type { ConfigStore, Login } from "./config";
import type { Issue, PullFile, PullRequest, User } from "./types";
import { MemoryConfigStore } from "./config";

export type { Issue, PullFile, PullRequest, User } from "./types";
export { issueIndex, prIndex } from "./utils";

// --- Raw API (fetch, take Login) ---

function buildApiUrl(login: Login, path: string): string {
  const base = login.url.replace(/\/$/, "");
  const apiPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}/api/v1${apiPath}`;
}

function authHeader(login: Login): Record<string, string> {
  if (!login.token) {
    return {};
  }
  return { Authorization: `token ${login.token}` };
}

async function request<T>(
  login: Login,
  method: string,
  path: string,
  opts?: { body?: unknown; searchParams?: Record<string, string | number> }
): Promise<T> {
  const url = new URL(buildApiUrl(login, path));
  if (opts?.searchParams) {
    for (const [k, v] of Object.entries(opts.searchParams)) {
      url.searchParams.set(k, String(v));
    }
  }
  const headers: Record<string, string> = {
    ...authHeader(login),
    Accept: "application/json",
  };
  if (opts?.body && method !== "GET") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url.toString(), {
    method,
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    const requestedUrl = url.toString();
    let hint = "";
    if (res.status === 404) {
      hint
        = "\nTip: If Gitea runs at a subpath (e.g. https://gitea.com/gitea), set that full URL in config (tea login). Otherwise check repo owner/name.";
    }
    throw new Error(`Gitea API ${res.status}: ${text || res.statusText}\n  Requested: ${requestedUrl}${hint}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

/** Get current user (validates token). Use GiteaClient.getCurrentUser() when you have a client. */
export async function getCurrentUser(login: Login): Promise<User> {
  return request<User>(login, "GET", "/user");
}

export async function listRepoIssues(
  login: Login,
  owner: string,
  repo: string,
  opts?: { state?: "open" | "closed" | "all"; page?: number; limit?: number }
): Promise<Issue[]> {
  const state = opts?.state ?? "open";
  return request<Issue[]>(login, "GET", `/repos/${owner}/${repo}/issues`, {
    searchParams: {
      state,
      page: opts?.page ?? 1,
      limit: opts?.limit ?? 30,
    },
  });
}

export async function getIssue(
  login: Login,
  owner: string,
  repo: string,
  index: number
): Promise<Issue> {
  return request<Issue>(login, "GET", `/repos/${owner}/${repo}/issues/${index}`);
}

export interface ListPullsOptions {
  state?: "open" | "closed" | "all";
  page?: number;
  limit?: number;
  base?: string;
  sort?: "oldest" | "recentupdate" | "recentclose" | "leastupdate" | "mostcomment" | "leastcomment" | "priority";
  milestone?: number;
  labels?: number[];
  poster?: string;
}

export async function listRepoPulls(
  login: Login,
  owner: string,
  repo: string,
  opts?: ListPullsOptions
): Promise<PullRequest[]> {
  const state = opts?.state ?? "open";
  const searchParams: Record<string, string | number> = {
    state,
    page: opts?.page ?? 1,
    limit: opts?.limit ?? 30,
  };
  if (opts?.base) searchParams["base_branch"] = opts.base;
  if (opts?.sort) searchParams["sort"] = opts.sort;
  if (opts?.milestone !== undefined) searchParams["milestone"] = opts.milestone;
  if (opts?.labels?.length) searchParams["labels"] = opts.labels.join(",");
  if (opts?.poster) searchParams["poster"] = opts.poster;
  return request<PullRequest[]>(login, "GET", `/repos/${owner}/${repo}/pulls`, {
    searchParams,
  });
}

export async function getPullRequest(
  login: Login,
  owner: string,
  repo: string,
  index: number
): Promise<PullRequest> {
  return request<PullRequest>(login, "GET", `/repos/${owner}/${repo}/pulls/${index}`);
}

export async function listRepoPullFiles(
  login: Login,
  owner: string,
  repo: string,
  index: number
): Promise<PullFile[]> {
  return request<PullFile[]>(login, "GET", `/repos/${owner}/${repo}/pulls/${index}/files`);
}

export interface CreatePullOptions {
  title: string;
  head: string;
  base: string;
  body?: string;
  assignee?: string;
  assignees?: string[];
  labels?: number[];
  milestone?: number;
  due_date?: string;
  allow_maintainer_edit?: boolean;
  reviewers?: string[];
  team_reviewers?: string[];
}

export async function createPullRequest(
  login: Login,
  owner: string,
  repo: string,
  opts: CreatePullOptions
): Promise<PullRequest> {
  return request<PullRequest>(login, "POST", `/repos/${owner}/${repo}/pulls`, {
    body: {
      title: opts.title,
      head: opts.head,
      base: opts.base,
      body: opts.body,
      assignee: opts.assignee,
      assignees: opts.assignees,
      labels: opts.labels,
      milestone: opts.milestone,
      due_date: opts.due_date,
      allow_maintainer_edit: opts.allow_maintainer_edit,
      reviewers: opts.reviewers,
      team_reviewers: opts.team_reviewers,
    },
  });
}

export async function getPullDiff(
  login: Login,
  owner: string,
  repo: string,
  index: number,
  format: "diff" | "patch" = "diff"
): Promise<string> {
  const path = `/repos/${owner}/${repo}/pulls/${index}.${format}`;
  const url = new URL(buildApiUrl(login, path));
  const headers: Record<string, string> = {
    ...authHeader(login),
    Accept: "text/plain",
  };
  const res = await fetch(url.toString(), {
    method: "GET",
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    const requestedUrl = url.toString();
    let hint = "";
    if (res.status === 404) {
      hint
        = "\nTip: If Gitea runs at a subpath (e.g. https://gitea.com/gitea), set that full URL in config (tea login). Otherwise check repo owner/name.";
    }
    throw new Error(`Gitea API ${res.status}: ${text || res.statusText}\n  Requested: ${requestedUrl}${hint}`);
  }
  return res.text();
}

// --- GiteaClient (stateful) ---

export interface LoginOptions {
  url: string;
  token: string;
  name?: string;
  default?: boolean;
  store?: ConfigStore;
}

export class GiteaClient {
  readonly store: ConfigStore;
  readonly profileName: string | undefined;

  constructor(store: ConfigStore, profileName?: string) {
    this.store = store;
    this.profileName = profileName;
  }

  getCurrentLogin(): Login | null {
    return this.profileName !== undefined
      ? this.store.getLoginByName(this.profileName)
      : this.store.getDefaultLogin();
  }

  private requireLogin(): Login {
    const login = this.getCurrentLogin();
    if (!login) {
      throw new Error("No login in store. Run login add or use fromConfig(store) with a store that has logins.");
    }
    return login;
  }

  async getCurrentUser(): Promise<User> {
    return getCurrentUser(this.requireLogin());
  }

  async listIssues(
    owner: string,
    repo: string,
    opts?: { state?: "open" | "closed" | "all"; page?: number; limit?: number }
  ): Promise<Issue[]> {
    return listRepoIssues(this.requireLogin(), owner, repo, opts);
  }

  async getIssue(owner: string, repo: string, index: number): Promise<Issue> {
    return getIssue(this.requireLogin(), owner, repo, index);
  }

  async listPulls(
    owner: string,
    repo: string,
    opts?: ListPullsOptions
  ): Promise<PullRequest[]> {
    return listRepoPulls(this.requireLogin(), owner, repo, opts);
  }

  async getPullRequest(owner: string, repo: string, index: number): Promise<PullRequest> {
    return getPullRequest(this.requireLogin(), owner, repo, index);
  }

  async listPullFiles(owner: string, repo: string, index: number): Promise<PullFile[]> {
    return listRepoPullFiles(this.requireLogin(), owner, repo, index);
  }

  async createPull(
    owner: string,
    repo: string,
    opts: CreatePullOptions
  ): Promise<PullRequest> {
    return createPullRequest(this.requireLogin(), owner, repo, opts);
  }

  async getPullDiff(
    owner: string,
    repo: string,
    index: number,
    format: "diff" | "patch" = "diff"
  ): Promise<string> {
    return getPullDiff(this.requireLogin(), owner, repo, index, format);
  }

  get baseUrl(): string {
    return this.requireLogin().url.replace(/\/$/, "");
  }

  static fromConfig(store: ConfigStore, name?: string): GiteaClient | null {
    const login = name !== undefined ? store.getLoginByName(name) : store.getDefaultLogin();
    if (!login) {
      return null;
    }
    return new GiteaClient(store, name ?? login.name);
  }

  static async login(options: LoginOptions): Promise<GiteaClient> {
    const { url, token, name, default: asDefault = true, store: providedStore } = options;
    const baseUrl = url.replace(/\/$/, "");
    const login: Login = {
      name: name ?? new URL(baseUrl).host,
      url: baseUrl,
      token,
      default: asDefault,
      created: Math.floor(Date.now() / 1000),
    };
    const user = await getCurrentUser(login);
    login.user = user.login ?? user.username;

    const store = providedStore ?? new MemoryConfigStore();
    if (store.getLogins().some((l) => l.name === login.name)) {
      throw new Error(`Login name '${login.name}' already exists. Use a different name or fromConfig(store, '${login.name}').`);
    }
    store.addLogin(login);
    return new GiteaClient(store, login.name);
  }

  static fromToken(url: string, token: string, name?: string): GiteaClient {
    const baseUrl = url.replace(/\/$/, "");
    const login: Login = {
      name: name ?? new URL(baseUrl).host,
      url: baseUrl,
      token,
      default: true,
      created: Math.floor(Date.now() / 1000),
    };
    const store = new MemoryConfigStore();
    store.addLogin(login);
    return new GiteaClient(store, login.name);
  }

  listLogins(): Login[] {
    return this.store.getLogins();
  }
}
