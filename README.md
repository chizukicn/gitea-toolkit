# gitea-toolkit

TypeScript toolkit for Gitea: a tea-compatible CLI (`tea`), a core SDK (`@gitea-toolkit/core`), and an MCP server (`gitea-mcp`).

- **AI-generated notice**: This project’s code and documentation are 100% written by AI.
- **中文文档**: see `README.zh-CN.md`

## Packages

- **`@gitea-toolkit/core`**: SDK (Gitea client, config store, tea-compatible config parser)
- **`@gitea-toolkit/cli`**: CLI (`tea`)
- **`@gitea-toolkit/mcp`**: MCP server (`gitea-mcp`)

## Install (from source)

```sh
pnpm install
pnpm run build
pnpm link --global   # or use: pnpm exec tea
```

## CLI usage

```sh
tea --help
tea --version

# Login (first time)
tea login add

# Current user
tea whoami

# In a git repo, or specify --repo owner/repo
tea issues              # list issues
tea issues 123          # show #123
tea pulls               # list PRs
tea pulls 5             # show #5
tea open                # open repo in browser
tea open 10             # open #10 issue/PR
tea open issues         # open issues page
```

## Global options

- `-r, --repo <slug>`: repository `owner/repo` or local path
- `-l, --login <name>`: use a specific login profile
- `--remote <name>`: git remote name (default: origin)
- `-o, --output <format>`: `simple` | `json`
- `--state <state>`: `open` | `closed` | `all`

## Config (tea-compatible)

The CLI reads tea config from:

- `$XDG_CONFIG_HOME/tea/config.yml` (e.g. `~/.config/tea/config.yml`)
- or legacy path `~/.tea/tea.yml`

Example:

```yaml
logins:
  - name: gitea.com
    url: https://gitea.com
    token: your-application-token
    user: your-username
    default: true
```

You can also use environment variables as a fallback:

- `GITEA_URL`
- `GITEA_TOKEN`
- `GITEA_LOGIN_NAME` (optional)

## MCP server

Recommended: run via `npx` (no global install required):

```sh
npx -y @gitea-toolkit/mcp
```

You can also run the installed binary:

```sh
gitea-mcp
```

### MCP client config

Example JSON config:

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

## Development

```sh
pnpm install
pnpm run build
pnpm run test
pnpm run lint
```

## License

MIT
