#!/usr/bin/env node
import process from "node:process";
import { GiteaClient, LocalFileConfigStore } from "@gitea-toolkit/core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

function getClient(login?: string) {
  const store = new LocalFileConfigStore();
  return new GiteaClient(store, login);
}

const server = new McpServer({
  name: "gitea-mcp",
  version: "0.1.0",
});

server.registerTool(
  "whoami",
  {
    description: "Get current user of the current login",
    inputSchema: { login: z.string().optional() },
  },
  async ({ login }) => {
    const client = getClient(login);
    const user = await client.getCurrentUser();
    return { content: [{ type: "text", text: JSON.stringify(user, null, 2) }] };
  }
);

server.registerTool(
  "issues.list",
  {
    description: "List issues for a repository",
    inputSchema: {
      owner: z.string(),
      repo: z.string(),
      state: z.enum(["open", "closed", "all"]).optional(),
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().optional(),
      login: z.string().optional(),
    },
  },
  async ({ owner, repo, state, page, limit, login }) => {
    const client = getClient(login);
    const issues = await client.listIssues(owner, repo, { state, page, limit });
    return { content: [{ type: "text", text: JSON.stringify(issues, null, 2) }] };
  }
);

server.registerTool(
  "issues.get",
  {
    description: "Get a single issue by index",
    inputSchema: {
      owner: z.string(),
      repo: z.string(),
      index: z.number().int().positive(),
      login: z.string().optional(),
    },
  },
  async ({ owner, repo, index, login }) => {
    const client = getClient(login);
    const issue = await client.getIssue(owner, repo, index);
    return { content: [{ type: "text", text: JSON.stringify(issue, null, 2) }] };
  }
);

server.registerTool(
  "pulls.list",
  {
    description: "List pull requests for a repository",
    inputSchema: {
      owner: z.string(),
      repo: z.string(),
      state: z.enum(["open", "closed", "all"]).optional(),
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().optional(),
      base_branch: z.string().optional(),
      sort: z.enum(["oldest", "recentupdate", "recentclose", "leastupdate", "mostcomment", "leastcomment", "priority"]).optional(),
      milestone: z.number().int().positive().optional(),
      labels: z.array(z.number().int().positive()).optional(),
      poster: z.string().optional(),
      login: z.string().optional(),
    },
  },
  async ({ owner, repo, state, page, limit, base_branch, sort, milestone, labels, poster, login }) => {
    const client = getClient(login);
    const pulls = await client.listPulls(owner, repo, { state, page, limit, base_branch, sort, milestone, labels, poster });
    return { content: [{ type: "text", text: JSON.stringify(pulls, null, 2) }] };
  }
);

server.registerTool(
  "pulls.get",
  {
    description: "Get a single pull request by index",
    inputSchema: {
      owner: z.string(),
      repo: z.string(),
      index: z.number().int().positive(),
      login: z.string().optional(),
    },
  },
  async ({ owner, repo, index, login }) => {
    const client = getClient(login);
    const pr = await client.getPullRequest(owner, repo, index);
    return { content: [{ type: "text", text: JSON.stringify(pr, null, 2) }] };
  }
);

server.registerTool(
  "pulls.files",
  {
    description: "List changed files for a pull request by index",
    inputSchema: {
      owner: z.string(),
      repo: z.string(),
      index: z.number().int().positive(),
      login: z.string().optional(),
    },
  },
  async ({ owner, repo, index, login }) => {
    const client = getClient(login);
    const files = await client.listPullFiles(owner, repo, index);
    return { content: [{ type: "text", text: JSON.stringify(files, null, 2) }] };
  }
);

server.registerTool(
  "pulls.diff",
  {
    description: "Get unified diff for a pull request by index",
    inputSchema: {
      owner: z.string(),
      repo: z.string(),
      index: z.number().int().positive(),
      login: z.string().optional(),
      format: z.enum(["diff", "patch"]).optional(),
    },
  },
  async ({ owner, repo, index, login, format }) => {
    const client = getClient(login);
    const fmt = (format ?? "diff") as "diff" | "patch";
    const diff = await client.getPullDiff(owner, repo, index, fmt);
    return { content: [{ type: "text", text: diff }] };
  }
);

server.registerTool(
  "pulls.create",
  {
    description: "Create a pull request",
    inputSchema: {
      owner: z.string(),
      repo: z.string(),
      title: z.string(),
      head: z.string(),
      base: z.string().default("main"),
      body: z.string().optional(),
      assignee: z.string().optional(),
      assignees: z.array(z.string()).optional(),
      reviewers: z.array(z.string()).optional(),
      team_reviewers: z.array(z.string()).optional(),
      labels: z.array(z.number()).optional(),
      milestone: z.number().optional(),
      due_date: z.string().optional(),
      allow_maintainer_edit: z.boolean().optional(),
      login: z.string().optional(),
    },
  },
  async ({ owner, repo, title, head, base, body, assignee, assignees, reviewers, team_reviewers, labels, milestone, due_date, allow_maintainer_edit, login }) => {
    const client = getClient(login);
    const pr = await client.createPull(owner, repo, {
      title,
      head,
      base,
      body,
      assignee,
      assignees,
      reviewers,
      team_reviewers,
      labels,
      milestone,
      due_date,
      allow_maintainer_edit,
    });
    return { content: [{ type: "text", text: JSON.stringify(pr, null, 2) }] };
  }
);

server.registerTool(
  "open.url",
  {
    description: "Generate a web URL (repo/issue/pull/profile) without opening a browser",
    inputSchema: {
      target: z.enum(["repo", "issue", "pull", "profile"]),
      owner: z.string().optional(),
      repo: z.string().optional(),
      index: z.number().int().positive().optional(),
      login: z.string().optional(),
    },
  },
  async ({ target, owner, repo, index, login }) => {
    const client = getClient(login);
    if (target === "profile") {
      const user = await client.getCurrentUser();
      const url = `${client.baseUrl}/${user.login ?? user.username ?? ""}`;
      return { content: [{ type: "text", text: url }] };
    }
    if (!owner || !repo) {
      throw new Error("owner and repo are required for target repo/issue/pull");
    }
    const base = `${client.baseUrl}/${owner}/${repo}`;
    if (target === "repo") {
      return { content: [{ type: "text", text: base }] };
    }
    if (!index) {
      throw new Error("index is required for target issue/pull");
    }
    const url = target === "pull" ? `${base}/pulls/${index}` : `${base}/issues/${index}`;
    return { content: [{ type: "text", text: url }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
