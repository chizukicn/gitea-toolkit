# @gitea-toolkit/mcp

Gitea 的 MCP（Model Context Protocol）Server。

此包提供 `gitea-mcp` 可执行文件。

English README：`README.md`

## 安装

```sh
pnpm add -g @gitea-toolkit/mcp
# 或在项目中：
pnpm add @gitea-toolkit/mcp
```

## 启动（推荐：npx）

```sh
npx -y @gitea-toolkit/mcp
```

也可以运行已安装的二进制：

```sh
gitea-mcp
```

## MCP 客户端配置

示例配置（适用于大多数支持 JSON 配置的 MCP 客户端）：

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

## 登录 / 配置

通过 `@gitea-toolkit/core` 读取 tea 配置：

- `$XDG_CONFIG_HOME/tea/config.yml`（如 `~/.config/tea/config.yml`）
- 或旧路径 `~/.tea/tea.yml`

环境变量兜底（当配置文件没有任何 logins 时）：`GITEA_URL`、`GITEA_TOKEN`、`GITEA_LOGIN_NAME`（可选）。

## 链接

- 仓库：`https://github.com/chizukicn/gitea-toolkit`
- 工作区说明：见仓库根目录 `README.md`

