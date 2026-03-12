import type { ConfigStore, User } from "@gitea-toolkit/core";
import type { CAC } from "cac";
import process from "node:process";
import { resolveContext } from "@gitea-toolkit/core";

function formatWhoami(user: User, baseUrl: string) {
  const lines: string[] = [];
  const login = user.login ?? user.username ?? "";
  lines.push(`# ${login} @ ${baseUrl}`);
  if (user.is_admin) {
    lines.push("  (admin)");
  }
  if (user.full_name) {
    lines.push(`  Full name: ${user.full_name}`);
  }
  if (user.email) {
    lines.push(`  Email: ${user.email}`);
  }
  if (user.description) {
    lines.push(`  Bio: ${user.description}`);
  }
  if (user.website) {
    lines.push(`  Website: ${user.website}`);
  }
  if (user.location) {
    lines.push(`  Location: ${user.location}`);
  }
  if (user.language) {
    lines.push(`  Language: ${user.language}`);
  }
  if (user.avatar_url) {
    lines.push(`  Avatar: ${user.avatar_url}`);
  }
  const stats: string[] = [];
  if (user.follower_count !== undefined) {
    stats.push(`Followers: ${user.follower_count}`);
  }
  if (user.following_count !== undefined) {
    stats.push(`Following: ${user.following_count}`);
  }
  if (user.starred_repos_count !== undefined) {
    stats.push(`Starred: ${user.starred_repos_count}`);
  }
  if (stats.length > 0) {
    lines.push(`  ${stats.join(", ")}`);
  }
  if (user.created_at) {
    lines.push(`  Created: ${user.created_at}`);
  }
  if (user.last_login) {
    lines.push(`  Last login: ${user.last_login}`);
  }
  return lines.join("\n");
}

export function registerWhoamiCommand(cli: CAC, store: ConfigStore) {
  cli
    .command("whoami", "Show current logged in user")
    .option("-l, --login <name>", "Use a different Gitea login")
    .option("-o, --output <format>", "Output: simple | json", { default: "simple" })
    .option("--open", "Open user profile in browser")
    .action(async (options: { login?: string; output?: string; open?: boolean }) => {
      const ctx = resolveContext(store, { login: options.login });
      if (!ctx) {
        console.error("Error: No Gitea login found. Run 'tea login add' first.");
        process.exit(1);
      }
      try {
        const user = await ctx.client.getCurrentUser();
        if (options.open) {
          const url = `${ctx.client.baseUrl}/${user.login ?? user.username ?? ""}`;
          const { execSync } = await import("node:child_process");
          const openCmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
          execSync(`${openCmd} "${url}"`, { stdio: "inherit" });
          return;
        }
        if (options.output === "json") {
          console.log(JSON.stringify(user, null, 2));
          return;
        }
        console.log(formatWhoami(user, ctx.client.baseUrl));
      } catch (e) {
        console.error("Error:", (e as Error).message);
        process.exit(1);
      }
    });
}
