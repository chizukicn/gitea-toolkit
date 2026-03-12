import type { ConfigStore, Issue } from "@gitea-toolkit/core";
import type { CAC } from "cac";
import process from "node:process";
import { issueIndex, requireContext } from "@gitea-toolkit/core";

function formatIssue(i: Issue, output: string) {
  if (output === "json") {
    console.log(JSON.stringify(i, null, 2));
    return;
  }
  const state = i.state === "open" ? "open" : "closed";
  const author = i.user?.login ?? i.user?.username ?? "?";
  const labels = (i.labels ?? []).map((l) => l.name).join(", ") || "-";
  console.log(`#${issueIndex(i)} [${state}] ${i.title}`);
  console.log(`  Author: ${author}  Labels: ${labels}`);
  if (i.html_url) {
    console.log(`  ${i.html_url}`);
  }
  if (i.body) {
    console.log(`\n${i.body}`);
  }
}

export function registerIssuesCommands(cli: CAC, store: ConfigStore) {
  cli
    .command("issues [index]", "List and manage issues")
    .alias("issue")
    .alias("i")
    .option("-r, --repo <slug>", "Repository owner/repo or path")
    .option("-l, --login <name>", "Gitea login")
    .option("--remote <name>", "Git remote name")
    .option("-o, --output <format>", "Output: simple | table | json", { default: "simple" })
    .option("--state <state>", "State: open | closed | all", { default: "open" })
    .option("--page <n>", "Page number", { default: "1" })
    .option("--limit <n>", "Items per page", { default: "30" })
    .action(async (index: string | undefined, options: Record<string, string>) => {
      const ctx = requireContext(store, {
        repo: options.repo,
        login: options.login,
        remote: options.remote,
      });
      const output = options.output ?? "simple";
      const state = (options.state ?? "open") as "open" | "closed" | "all";
      const page = Number.parseInt(options.page ?? "1", 10);
      const limit = Number.parseInt(options.limit ?? "30", 10);

      if (index !== undefined && index !== "") {
        const idx = Number.parseInt(index, 10);
        if (Number.isNaN(idx) || idx < 1) {
          console.error("Error: Invalid issue index");
          process.exit(1);
        }
        const issue = await ctx.client.getIssue(ctx.owner, ctx.repo, idx);
        formatIssue(issue, output);
        return;
      }

      const issues = await ctx.client.listIssues(ctx.owner, ctx.repo, {
        state,
        page,
        limit,
      });
      if (output === "json") {
        console.log(JSON.stringify(issues, null, 2));
        return;
      }
      for (const i of issues) {
        const author = i.user?.login ?? i.user?.username ?? "?";
        const labels = (i.labels ?? []).map((l) => l.name).join(",") || "-";
        console.log(`#${issueIndex(i)} [${i.state}] ${i.title} (${author}) ${labels}`);
      }
    });
}
