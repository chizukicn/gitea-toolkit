import type { ConfigStore, PullFile, PullRequest } from "@gitea-toolkit/core";
import type { CAC } from "cac";
import { execSync } from "node:child_process";
import process from "node:process";
import { prIndex, requireContext } from "@gitea-toolkit/core";

function gitBranch(): string {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

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

function splitComma(value: string): string[] {
  if (!value) {
    return [];
  }
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export function registerPullsCommands(cli: CAC, store: ConfigStore) {
  cli
    .command("pulls [action]", "List and manage pull requests")
    .alias("pull")
    .alias("pr")
    .option("-r, --repo <slug>", "Repository owner/repo or path")
    .option("-l, --login <name>", "Gitea login")
    .option("--remote <name>", "Git remote name")
    .option("-o, --output <format>", "Output: simple | table | json", { default: "simple" })
    // list options
    .option("--state <state>", "State: open | closed | all", { default: "open" })
    .option("--page <n>", "Page number", { default: "1" })
    .option("--limit <n>", "Items per page", { default: "30" })
    .option("--base-branch <branch>", "Filter by target base branch")
    .option("--sort <sort>", "Sort: oldest | recentupdate | recentclose | leastupdate | mostcomment | leastcomment | priority")
    .option("--milestone <id>", "Milestone ID (filter for list, set for create)")
    .option("--labels <ids>", "Label IDs (comma-separated; filter for list, set for create)")
    .option("--poster <user>", "Filter by pull request author")
    // detail options
    .option("--files", "Show changed files for a pull request (requires index)")
    .option("--diff", "Show unified diff for the pull request")
    // create options
    .option("-H, --head <branch>", "Source branch (default: current branch)")
    .option("-b, --base <branch>", "Target branch (default: main)")
    .option("-t, --title <title>", "Pull request title (required for create)")
    .option("-d, --description <text>", "Pull request body")
    .option("--body <text>", "Alias for --description")
    .option("--assignee <user>", "Primary assignee username")
    .option("--assignees <users>", "Comma-separated assignee usernames")
    .option("--reviewers <users>", "Comma-separated reviewer usernames")
    .option("--team-reviewers <teams>", "Comma-separated team reviewer names")
    .option("--labels <ids>", "Comma-separated label IDs")
    .option("--milestone <id>", "Milestone ID")
    .option("--due-date <date>", "Deadline (ISO 8601 date-time)")
    .option("--allow-maintainer-edit", "Allow maintainers to edit the pull request")
    .action(async (action: string | undefined, options: Record<string, string>) => {
      const ctx = requireContext(store, {
        repo: options.repo,
        login: options.login,
        remote: options.remote,
      });
      const output = options.output ?? "simple";

      // --- create ---
      if (action === "create") {
        const head = options.head || gitBranch();
        if (!head) {
          console.error("Error: Could not determine current branch. Use --head to specify.");
          process.exit(1);
        }
        const base = options.base ?? "main";
        const title = options.title;
        if (!title) {
          console.error("Error: --title is required");
          process.exit(1);
        }
        const description = options.description ?? options.body;

        const pr = await ctx.client.createPull(ctx.owner, ctx.repo, {
          title,
          head,
          base,
          body: description,
          assignee: options.assignee,
          assignees: options.assignees ? splitComma(options.assignees) : undefined,
          reviewers: options.reviewers ? splitComma(options.reviewers) : undefined,
          team_reviewers: options["team-reviewers"] ? splitComma(options["team-reviewers"]) : undefined,
          labels: options.labels ? splitComma(options.labels).map(Number) : undefined,
          milestone: options.milestone ? Number(options.milestone) : undefined,
          due_date: options["due-date"],
          allow_maintainer_edit: options["allow-maintainer-edit"] ? true : undefined,
        });

        if (output === "json") {
          console.log(JSON.stringify(pr, null, 2));
          return;
        }
        console.log(`Created pull request #${prIndex(pr)}: ${pr.title}`);
        console.log(`  ${pr.head?.ref ?? head} → ${pr.base?.ref ?? base}`);
        if (pr.html_url) {
          console.log(`  ${pr.html_url}`);
        }
        return;
      }

      // --- detail ---
      if (action !== undefined && action !== "") {
        const idx = Number.parseInt(action, 10);
        if (Number.isNaN(idx) || idx < 1) {
          console.error(`Error: Unknown action "${action}". Use "create" or a pull request index.`);
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

      // --- list ---
      const state = (options.state ?? "open") as "open" | "closed" | "all";
      const page = Number.parseInt(options.page ?? "1", 10);
      const limit = Number.parseInt(options.limit ?? "30", 10);

      const pulls = await ctx.client.listPulls(ctx.owner, ctx.repo, {
        state,
        page,
        limit,
        base_branch: options["base-branch"],
        sort: options.sort,
        milestone: options.milestone ? Number(options.milestone) : undefined,
        labels: options.labels ? splitComma(options.labels).map(Number) : undefined,
        poster: options.poster,
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
