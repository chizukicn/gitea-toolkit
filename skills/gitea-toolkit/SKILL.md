---
name: gitea-toolkit
description: Use when the user asks to interact with Gitea repositories (issues, pull requests, repos), mentions "tea" CLI, "gitea" commands, or needs to query Gitea-hosted projects. Also use when gitea-mcp MCP tools are available.
---

# Gitea CLI & MCP

Use `tea` CLI or `gitea-mcp` MCP server to interact with Gitea repositories.

## Tool Selection

```
Is gitea-mcp MCP server configured?
  ├─ Yes → prefer MCP tools (structured I/O, no shell overhead)
  └─ No  → use `tea` CLI via Bash
```

If `tea` is not installed, suggest: `pnpm link --global` from this repo, or `npx @gitea-toolkit/cli`.

## tea CLI Quick Reference

All commands auto-detect repo context from git remotes when run inside a git repo.

### Login & Identity

```bash
tea login add                      # interactive setup
tea login add --name X --url URL --token TOKEN
tea login list                     # list saved logins
tea login default <name>           # switch default
tea login delete <name>
tea logout [--name <name>]
tea whoami                         # current user info
tea whoami --open                  # open profile in browser
```

### Issues

```bash
tea issues                         # list open issues (current repo)
tea issues --state closed          # filter by state
tea issues --page 2 --limit 50     # pagination
tea issues 42                      # show issue #42
tea issues -r owner/repo           # specific repo
tea issues -o json                 # JSON output
```

### Pull Requests

```bash
tea pulls                          # list open PRs (aliases: pull, pr)
tea pulls --state all
tea pulls 5                        # show PR #5
tea pulls 5 --files                # changed files
tea pulls 5 --diff                 # unified diff
tea pulls 5 --files --diff         # both
```

### Open in Browser

```bash
tea open                           # repo page
tea open 10                        # issue/PR #10
tea open issues                    # issues list page
tea open pulls                     # PRs list page
tea open profile                   # current user profile
```

### Global Options

```
-r, --repo <slug>     owner/repo or local path
-l, --login <name>    use specific login profile
--remote <name>       git remote name (default: origin)
-o, --output <fmt>    simple | json
```

### Config

Config file: `~/.config/tea/config.yml` or `$XDG_CONFIG_HOME/tea/config.yml`.

```yaml
logins:
  - name: my-gitea
    url: https://gitea.example.com
    token: <application-token>
    default: true
```

Env fallback: `GITEA_URL`, `GITEA_TOKEN`, `GITEA_LOGIN_NAME`.

## gitea-mcp MCP Tools

When the MCP server is configured in the current session, these tools are available:

| Tool | Description |
|------|-------------|
| `whoami` | Get current user |
| `issues.list` | List issues (owner, repo, state, page, limit) |
| `issues.get` | Get a single issue by index |
| `pulls.list` | List pull requests |
| `pulls.get` | Get a single PR by index |
| `pulls.files` | List changed files in a PR |
| `pulls.diff` | Get unified diff for a PR |
| `open.url` | Generate web URL without opening browser |

### MCP Setup

To configure the MCP server in Claude Code, add to MCP config:

```json
{
  "mcpServers": {
    "gitea": {
      "command": "npx",
      "args": ["-y", "@gitea-toolkit/mcp"]
    }
  }
}
```

### MCP Usage Pattern

When using MCP tools, you need `owner` and `repo` parameters. Derive them from:
- Git remote URL of the current repo (`git remote get-url origin`)
- Parse `gitea.com/owner/repo.git` → owner=`owner`, repo=`repo`
- The `--repo` flag equivalent in CLI

## Common Workflows

### Check CI status on a PR

```bash
# With CLI:
tea pulls <number> --output json | jq '.status'

# With MCP: use pulls.get, then parse the response
```

### Review open issues before planning

```bash
tea issues --state open --limit 20
```

### Find a PR's changed files for code review

```bash
tea pulls <number> --files
```

### Open a specific issue in browser

```bash
tea open <number>
```

## Repo Context Resolution

The CLI auto-resolves owner/repo from git remotes:
1. Check `--repo` flag (highest priority)
2. Parse `git remote get-url origin` (or `--remote` flag)
3. Fallback: `git remote get-url upstream`
4. Match Gitea server URL from saved logins

If running outside a git repo, always pass `--repo owner/repo`.
