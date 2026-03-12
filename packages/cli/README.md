# @gitea-toolkit/cli

tea-compatible Gitea CLI.

This package provides the `tea` binary.

Chinese README: `README.zh-CN.md`

## Install

```sh
pnpm add -g @gitea-toolkit/cli
# or in a project:
pnpm add @gitea-toolkit/cli
```

## Usage

```sh
tea --help
tea login add
tea whoami
tea issues
tea pulls
tea open
```

## Config

Uses tea-compatible config:

- `$XDG_CONFIG_HOME/tea/config.yml` (e.g. `~/.config/tea/config.yml`)
- or legacy `~/.tea/tea.yml`

Env fallback (when file contains no logins): `GITEA_URL`, `GITEA_TOKEN`, `GITEA_LOGIN_NAME` (optional).

## Links

- Repository: `https://github.com/chizukicn/gitea-toolkit`
- Full docs: see repo root `README.md`

