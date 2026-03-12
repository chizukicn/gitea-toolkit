import type { ConfigStore, PullFile, PullRequest } from "@gitea-toolkit/core";
import type { CAC } from "cac";
import process from "node:process";
import { prIndex, requireContext } from "@gitea-toolkit/core";

function formatPull(pr: PullRequest, output: string) {
  if (output === "json") {
    console.log(JSON.stringify(pr, null, 2));
    return;
  }
  const state = pr.state === "open" ? "open" : "closed";
  const author = pr.user?.login ?? pr.user?.username ?? "?";
  const base = pr.base?.ref ?? "?";
  const head = pr.head?.ref ?? "?";
  console.log(`#${prIndex(pr)} [${state}] ${pr.title}`);
  console.log(`  Author: ${author}  ${head} → ${base}`);
  if (pr.html_url) {
    console.log(`  ${pr.html_url}`);
  }
  if (pr.body) {
    console.log(`\n${pr.body}`);
  }
}

function formatPullFiles(files: PullFile[], output: string) {
  if (output === "json") {
    console.log(JSON.stringify(files, null, 2));
    return;
  }
  for (const f of files) {
    const status = f.status ?? "";
    const changes = f.changes ?? 0;
    console.log(`${f.filename}  ${status}  (+${f.additions ?? 0} -${f.deletions ?? 0}, ${changes} changes)`);
  }
}

export function registerPullsCommands(cli: CAC, store: ConfigStore) {
  cli
    .command("pulls [index]", "List and manage pull requests")
    .alias("pull")
    .alias("pr")
    .option("-r, --repo <slug>", "Repository owner/repo or path")
    .option("-l, --login <name>", "Gitea login")
    .option("--remote <name>", "Git remote name")
    .option("-o, --output <format>", "Output: simple | table | json", { default: "simple" })
    .option("--files", "Show changed files for a pull request (requires index)")
    .option("--diff", "Show unified diff for the pull request")
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
          console.error("Error: Invalid pull request index");
          process.exit(1);
        }
        const showFiles = Boolean(options.files);
        const showDiff = Boolean(options.diff);
        if (showFiles) {
          const files = await ctx.client.listPullFiles(ctx.owner, ctx.repo, idx);
          formatPullFiles(files, output);
        }
        if (showDiff) {
          const diff = await ctx.client.getPullDiff(ctx.owner, ctx.repo, idx, "diff");
          if (showFiles) {
            console.log("");
          }
          process.stdout.write(diff);
        }
        if (!showFiles && !showDiff) {
          const pr = await ctx.client.getPullRequest(ctx.owner, ctx.repo, idx);
          formatPull(pr, output);
        }
        return;
      }

      const pulls = await ctx.client.listPulls(ctx.owner, ctx.repo, {
        state,
        page,
        limit,
      });
      if (output === "json") {
        console.log(JSON.stringify(pulls, null, 2));
        return;
      }
      for (const p of pulls) {
        const author = p.user?.login ?? p.user?.username ?? "?";
        const branch = p.head?.ref ? ` (${p.head.ref} → ${p.base?.ref ?? "?"})` : "";
        console.log(`#${prIndex(p)} [${p.state}] ${p.title} (${author})${branch}`);
      }
    });
}
