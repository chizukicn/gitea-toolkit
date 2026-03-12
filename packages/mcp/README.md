# @gitea-toolkit/mcp

MCP (Model Context Protocol) server for Gitea.

This package provides the `gitea-mcp` binary.

Chinese README: `README.zh-CN.md`

## Install

```sh
pnpm add -g @gitea-toolkit/mcp
# or in a project:
pnpm add @gitea-toolkit/mcp
```

## Run (recommended: npx)

```sh
npx -y @gitea-toolkit/mcp
```

You can also run the installed binary:

```sh
gitea-mcp
```

## MCP client config

Example configuration (works for most MCP clients that accept a JSON config):

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

## Auth / config

Uses tea-compatible config via `@gitea-toolkit/core`:

- `$XDG_CONFIG_HOME/tea/config.yml` (e.g. `~/.config/tea/config.yml`)
- or legacy `~/.tea/tea.yml`

Env fallback (when file contains no logins): `GITEA_URL`, `GITEA_TOKEN`, `GITEA_LOGIN_NAME` (optional).

## Links

- Repository: `https://github.com/chizukicn/gitea-toolkit`
- Workspace docs: see repo root `README.md`

