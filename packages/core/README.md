# @gitea-toolkit/core

Core SDK for Gitea.

This package provides:

- `GiteaClient`: a stateful client that resolves the current login from a `ConfigStore`
- `ConfigStore` implementations: in-memory store + tea-compatible local file store
- tea-compatible config parsing (reads `~/.config/tea/config.yml` or `~/.tea/tea.yml`, with env fallback)

Chinese README: `README.zh-CN.md`

## Install

```sh
pnpm add @gitea-toolkit/core
```

## Usage (SDK)

```ts
import { GiteaClient, LocalFileConfigStore } from "@gitea-toolkit/core";

const store = new LocalFileConfigStore();
const client = new GiteaClient(store); // uses default login

const me = await client.getCurrentUser();
console.log(me.login ?? me.username);
```

## Config resolution

- File:
  - `$XDG_CONFIG_HOME/tea/config.yml` (e.g. `~/.config/tea/config.yml`)
  - or legacy `~/.tea/tea.yml`
- Env fallback (when file contains no logins):
  - `GITEA_URL`
  - `GITEA_TOKEN`
  - `GITEA_LOGIN_NAME` (optional)

## Links

- Repository: `https://github.com/chizukicn/gitea-toolkit`
- Workspace docs: see repo root `README.md`

