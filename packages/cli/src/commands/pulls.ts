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

type PullField =
  | "index" | "state" | "author" | "author-id" | "url" | "title" | "body"
  | "mergeable" | "base" | "base-commit" | "head" | "diff" | "patch"
  | "created" | "updated" | "deadline" | "assignees" | "milestone" | "labels"
  | "comments" | "ci";

const ALL_FIELDS: PullField[] = [
  "index", "state", "author", "author-id", "url", "title", "body",
  "mergeable", "base", "base-commit", "head", "diff", "patch",
  "created", "updated", "deadline", "assignees", "milestone", "labels",
  "comments", "ci",
];

const DEFAULT_FIELDS: PullField[] = [
  "index", "title", "state", "author", "milestone", "updated", "labels",
];

function parseFields(raw: string): PullField[] {
  const names = splitComma(raw);
  const fields: PullField[] = [];
  for (const n of names) {
    if (ALL_FIELDS.includes(n as PullField)) {
      fields.push(n as PullField);
    }
  }
  return fields.length > 0 ? fields : DEFAULT_FIELDS;
}

function fieldLabel(f: PullField): string {
  return f.replace(/-/g, "");
}

function extractField(pr: PullRequest, f: PullField): string {
  switch (f) {
    case "index": return `#${prIndex(pr)}`;
    case "state": return pr.state;
    case "author": return pr.user?.login ?? pr.user?.username ?? "?";
    case "author-id": return pr.user?.id !== undefined ? String(pr.user.id) : "";
    case "url": return pr.html_url ?? "";
    case "title": return pr.title;
    case "body": return pr.body ? pr.body.replace(/\n/g, " ") : "";
    case "mergeable": return pr.mergeable === true ? "yes" : pr.mergeable === false ? "no" : "";
    case "base": return pr.base?.ref ?? "";
    case "base-commit": return ""; // not available in list API
    case "head": return pr.head?.ref ?? "";
    case "diff": return "";
    case "patch": return "";
    case "created": return pr.created_at ?? "";
    case "updated": return pr.updated_at ?? "";
    case "deadline": return ""; // due_date not in list response
    case "assignees": return pr.assignees?.map((a) => a.login ?? a.username).join(", ") ?? "";
    case "milestone": return pr.milestone?.title ?? "";
    case "labels": return pr.labels?.map((l) => l.name).join(", ") ?? "";
    case "comments": return pr.comments !== undefined ? String(pr.comments) : "";
    case "ci": return ""; // requires separate API call
  }
}

function formatPullsTable(pulls: PullRequest[], fields: PullField[]) {
  // Calculate column widths
  const colWidths: number[] = fields.map((f) => {
    const headerLen = fieldLabel(f).length;
    const maxData = pulls.reduce((max, pr) => Math.max(max, extractField(pr, f).length), 0);
    return Math.max(headerLen, Math.min(maxData, 40)); // cap at 40
  });

  // Print header
  const header = fields.map((f, i) => f === "title" ? fieldLabel(f) : fieldLabel(f).padEnd(colWidths[i])).join("  ");
  console.log(header);

  // Print separator
  const sep = fields.map((_, i) => "-".repeat(colWidths[i])).join("  ");
  console.log(sep);

  // Print rows
  for (const pr of pulls) {
    const row = fields.map((f, i) => {
      const val = extractField(pr, f);
      return f === "title" ? val : val.padEnd(colWidths[i]);
    }).join("  ");
    console.log(row);
  }
}

interface PullsOptions {
  repo?: string;
  login?: string;
  remote?: string;
  output?: string;
  fields?: string;
  state?: string;
  page?: string;
  limit?: string;
  lm?: string;
  sort?: "oldest" | "recentupdate" | "recentclose" | "leastupdate" | "mostcomment" | "leastcomment" | "priority";
  poster?: string;
  files?: boolean;
  diff?: boolean;
  head?: string;
  base?: string;
  title?: string;
  description?: string;
  body?: string;
  assignee?: string;
  assignees?: string;
  reviewers?: string;
  teamReviewers?: string;
  labels?: string;
  milestone?: string;
  deadline?: string;
  dueDate?: string;
  allowMaintainerEdits?: boolean;
  edits?: boolean;
}

export function registerPullsCommands(cli: CAC, store: ConfigStore) {
  cli
    .command("pulls [action]", "List and manage pull requests")
    .alias("pull")
    .alias("pr")
    .option("-r, --repo <slug>", "Override local repository path or gitea repository slug to interact with. Optional")
    .option("-l, --login <name>", "Use a different Gitea Login. Optional")
    .option("-R, --remote <name>", "Discover Gitea login from remote. Optional")
    .option("-o, --output <format>", "Output format. (simple, table, csv, tsv, yaml, json)")
    // list options
    .option("-f, --fields <fields>", "Comma-separated list of fields to print. Available: index,state,author,author-id,url,title,body,mergeable,base,base-commit,head,diff,patch,created,updated,deadline,assignees,milestone,labels,comments,ci (default: index,title,state,author,milestone,updated,labels)")
    .option("--state <state>", "Filter by state (all|open|closed)", { default: "open" })
    .option("-p, --page <n>", "specify page", { default: "1" })
    .option("--lm, --limit <n>", "specify limit of items per page", { default: "30" })
    .option("--sort <sort>", "Sort: oldest | recentupdate | recentclose | leastupdate | mostcomment | leastcomment | priority")
    .option("--poster <user>", "Filter by pull request author")
    // detail options
    .option("--files", "Show changed files for a pull request (requires index)")
    .option("--diff", "Show unified diff for the pull request")
    // create options
    .option("--head <branch>", "Source branch (default: current branch)")
    .option("-b, --base <branch>", "Target branch (default: main)")
    .option("-t, --title <title>", "Pull request title (required for create)")
    .option("-d, --description <text>", "Pull request body")
    .option("--body <text>", "Alias for --description")
    .option("--assignee <user>", "Primary assignee username")
    .option("-a, --assignees <users>", "Comma-separated list of usernames to assign")
    .option("--reviewers <users>", "Comma-separated reviewer usernames")
    .option("--team-reviewers <teams>", "Comma-separated team reviewer names")
    .option("-L, --labels <ids>", "Comma-separated list of labels to assign")
    .option("-m, --milestone <id>", "Milestone to assign")
    .option("-D, --deadline, --due-date <date>", "Deadline timestamp to assign")
    .option("--edits, --allow-maintainer-edit, --allow-maintainer-edits", "Enable maintainers to push to the base branch of created pull")
    .action(async (action: string | undefined, options: PullsOptions) => {
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
          title: title!,
          head,
          base,
          body: description,
          assignee: options.assignee,
          assignees: options.assignees ? splitComma(options.assignees) : undefined,
          reviewers: options.reviewers ? splitComma(options.reviewers) : undefined,
          team_reviewers: options.teamReviewers ? splitComma(options.teamReviewers) : undefined,
          labels: options.labels ? splitComma(options.labels).map(Number) : undefined,
          milestone: options.milestone ? Number(options.milestone) : undefined,
          due_date: options.deadline || options.dueDate,
          allow_maintainer_edit: options.allowMaintainerEdits || options.edits ? true : undefined,
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
        base: options.base,
        sort: options.sort,
        milestone: options.milestone ? Number(options.milestone) : undefined,
        labels: options.labels ? splitComma(options.labels).map(Number) : undefined,
        poster: options.poster,
      });
      if (output === "json") {
        console.log(JSON.stringify(pulls, null, 2));
        return;
      }
      if (pulls.length === 0) {
        console.log("No pull requests found.");
        return;
      }
      const fields = parseFields(options.fields ?? "");
      formatPullsTable(pulls, fields);
    });
}
