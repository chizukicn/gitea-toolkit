# @gitea-toolkit/core

Gitea 的核心 SDK。

此包提供：

- `GiteaClient`：有状态 Client，会从 `ConfigStore` + profile 解析“当前登录”
- `ConfigStore` 及实现：内存 store + 兼容 tea 的本地文件 store
- 兼容 tea 的配置解析（读取 `~/.config/tea/config.yml` 或 `~/.tea/tea.yml`，并支持 env 兜底）

English README：`README.md`

## 安装

```sh
pnpm add @gitea-toolkit/core
```

## 用法（SDK）

```ts
import { GiteaClient, LocalFileConfigStore } from "@gitea-toolkit/core";

const store = new LocalFileConfigStore();
const client = new GiteaClient(store); // 使用默认登录

const me = await client.getCurrentUser();
console.log(me.login ?? me.username);
```

## 配置解析规则

- 配置文件：
  - `$XDG_CONFIG_HOME/tea/config.yml`（如 `~/.config/tea/config.yml`）
  - 或旧路径 `~/.tea/tea.yml`
- 环境变量兜底（当配置文件没有任何 logins 时）：
  - `GITEA_URL`
  - `GITEA_TOKEN`
  - `GITEA_LOGIN_NAME`（可选）

## 链接

- 仓库：`https://github.com/chizukicn/gitea-toolkit`
- 工作区说明：见仓库根目录 `README.md`

