import type { ConfigStore } from "@gitea-toolkit/core";
import type { CAC } from "cac";
import process from "node:process";
import { requireContext, resolveContext } from "@gitea-toolkit/core";

export function registerOpenCommand(cli: CAC, store: ConfigStore) {
  cli
    .command("open [target]", "Open repository, issue/PR, or user profile in browser")
    .alias("o")
    .option("-r, --repo <slug>", "Repository owner/repo or path")
    .option("-l, --login <name>", "Gitea login")
    .option("--remote <name>", "Git remote name")
    .action(async (target: string | undefined, options: Record<string, string>) => {
      const baseOpts = { repo: options.repo, login: options.login, remote: options.remote };

      if (target === "profile" || target === "me" || target === "user") {
        const ctx = resolveContext(store, baseOpts);
        if (!ctx?.client) {
          throw new Error("No Gitea login found. Run 'tea login add' first.");
        }
        const user = await ctx.client.getCurrentUser();
        const url = `${ctx.client.baseUrl}/${user.login ?? user.username ?? ""}`;
        const { execSync } = await import("node:child_process");
        const openCmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
        execSync(`${openCmd} "${url}"`, { stdio: "inherit" });
        return;
      }

      const ctx = requireContext(store, baseOpts);
      const base = ctx.client.baseUrl;
      const urlPath = `${ctx.owner}/${ctx.repo}`;
      let path = urlPath;
      if (target !== undefined && target !== "") {
        const n = Number.parseInt(target, 10);
        if (!Number.isNaN(n) && n > 0) {
          path = `${urlPath}/issues/${n}`;
        } else if (target === "issues" || target === "pulls" || target === "milestones") {
          path = `${urlPath}/${target}`;
        } else {
          path = `${urlPath}/issues/${target}`;
        }
      }
      const url = `${base}/${path}`;
      const { execSync } = await import("node:child_process");
      const openCmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
      execSync(`${openCmd} "${url}"`, { stdio: "inherit" });
    });
}
