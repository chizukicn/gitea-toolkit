/**
 * Resolve Gitea client and repo (owner/repo) from:
 * - --login / --repo / --remote flags
 * - Current directory git remote (origin or upstream)
 */

import type { ConfigStore, Login } from "./config";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { GiteaClient } from "./client";

export interface TeaContext {
  client: GiteaClient;
  owner: string;
  repo: string;
  repoSlug: string;
}

function parseGitRemoteUrl(url: string): { host: string; owner: string; repo: string } | null {
  // https://gitea.com/owner/repo.git or git@gitea.com:owner/repo.git
  let u = url.trim();
  if (u.endsWith(".git")) {
    u = u.slice(0, -4);
  }
  let host: string;
  let pathPart: string;
  if (u.startsWith("http://") || u.startsWith("https://")) {
    try {
      const parsed = new URL(u);
      host = parsed.host;
      pathPart = parsed.pathname.replace(/^\//, "");
    } catch {
      return null;
    }
  } else if (u.startsWith("git@")) {
    const match = u.match(/^git@([^:]+):(.+)$/);
    if (!match) {
      return null;
    }
    host = match[1];
    pathPart = match[2];
  } else {
    return null;
  }
  const parts = pathPart.split("/").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  const owner = parts[0];
  const repo = parts[1];
  return { host, owner, repo };
}

function gitRemoteUrl(cwd: string, remote: string): string | null {
  try {
    const out = execSync(`git remote get-url ${remote}`, {
      encoding: "utf8",
      cwd,
    });
    return out.trim() || null;
  } catch {
    return null;
  }
}

function findRepoRoot(dir: string): string | null {
  let current = dir;
  for (;;) {
    const gitDir = join(current, ".git");
    if (existsSync(gitDir)) {
      return current;
    }
    const parent = join(current, "..");
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function matchLoginByUrl(remoteUrl: string, logins: Login[]): Login | null {
  const parsed = parseGitRemoteUrl(remoteUrl);
  if (!parsed) {
    return null;
  }
  const { host } = parsed;
  for (const login of logins) {
    try {
      const u = new URL(login.url);
      if (u.host === host) {
        return login;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export interface ResolveOptions {
  repo?: string; // path or owner/repo
  login?: string;
  remote?: string;
  cwd?: string;
}

export function resolveContext(store: ConfigStore, opts: ResolveOptions = {}): TeaContext | null {
  const cwd = opts.cwd ?? process.cwd();
  const logins = store.getLogins();
  if (logins.length === 0) {
    return null;
  }

  let login: Login | null = null;
  let owner = "";
  let repo = "";
  let repoSlug = "";

  if (opts.login) {
    login = store.getLoginByName(opts.login) ?? logins.find((l) => l.name === opts.login) ?? null;
  }
  if (!login) {
    login = store.getDefaultLogin();
  }
  if (!login) {
    return null;
  }

  if (opts.repo) {
    const asPath = !opts.repo.includes("/") || existsSync(opts.repo);
    if (asPath && existsSync(opts.repo)) {
      const root = findRepoRoot(opts.repo);
      if (root) {
        const remote = opts.remote ?? "origin";
        const url = gitRemoteUrl(root, remote) ?? gitRemoteUrl(root, "upstream");
        if (url) {
          const parsed = parseGitRemoteUrl(url);
          const matched = matchLoginByUrl(url, logins);
          if (parsed && (matched || login)) {
            owner = parsed.owner;
            repo = parsed.repo;
            repoSlug = `${owner}/${repo}`;
            if (matched) {
              login = matched;
            }
          }
        }
      }
    } else if (opts.repo.includes("/") && !existsSync(opts.repo)) {
      const [o, r] = opts.repo.split("/");
      if (o && r) {
        owner = o;
        repo = r;
        repoSlug = opts.repo;
      }
    }
  }

  if (!owner || !repo) {
    const root = findRepoRoot(cwd);
    if (root) {
      const defaultRemote = store.getPreferences?.()?.flag_defaults?.remote ?? "origin";
      const remote = opts.remote ?? defaultRemote;
      let url = gitRemoteUrl(root, remote);
      if (!url && remote !== "upstream") {
        url = gitRemoteUrl(root, "upstream");
      }
      if (url) {
        const parsed = parseGitRemoteUrl(url);
        const matched = matchLoginByUrl(url, logins);
        if (parsed) {
          owner = parsed.owner;
          repo = parsed.repo;
          repoSlug = `${owner}/${repo}`;
          if (matched) {
            login = matched;
          }
        }
      }
    }
  }

  if (!login) {
    return null;
  }
  const client = new GiteaClient(store, opts.login ?? login.name);
  return { client, owner, repo, repoSlug };
}

export function requireContext(store: ConfigStore, opts: ResolveOptions = {}): TeaContext {
  const ctx = resolveContext(store, opts);
  if (!ctx) {
    throw new Error("No Gitea login found. Run 'tea login add' or use --repo owner/repo --login <name>'");
  }
  if (!ctx.owner || !ctx.repo) {
    throw new Error("Repository context required. Use --repo owner/repo or run from a git repo with a Gitea remote.");
  }
  return ctx;
}
