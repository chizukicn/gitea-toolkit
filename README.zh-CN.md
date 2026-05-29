# gitea-toolkit

Gitea 的 TypeScript 工具箱：包含 tea 兼容的 CLI（`tea`）、核心 SDK（`@gitea-toolkit/core`）以及 MCP Server（`gitea-mcp`）。

- **AI 编写声明**：本项目所有代码与文档均为 100% AI 编写。
- **English README**: see `README.md`

## 包结构

- **`@gitea-toolkit/core`**：SDK（GiteaClient、配置存储、兼容 tea 的配置解析）
- **`@gitea-toolkit/cli`**：命令行工具（`tea`）
- **`@gitea-toolkit/mcp`**：MCP Server（`gitea-mcp`）

## 安装（从源码）

```sh
pnpm install
pnpm run build
pnpm link --global   # 或使用 pnpm exec tea
```

## CLI 用法

```sh
tea --help
tea --version

# 登录（首次使用）
tea login add

# 查看当前用户
tea whoami

# 在 git 仓库内或指定 --repo owner/repo
tea issues              # 列出 issue
tea issues 123          # 查看 #123
tea pulls               # 列出 PR
tea pulls 5             # 查看 #5
tea open                # 在浏览器打开仓库
tea open 10             # 打开 #10 issue/PR
tea open issues         # 打开 issues 页
```

## 全局选项

- `-r, --repo <slug>`：仓库 `owner/repo` 或本地路径
- `-l, --login <name>`：指定登录配置
- `--remote <name>`：指定 git remote（默认 origin）
- `-o, --output <format>`：输出格式 `simple` | `json`
- `--state <state>`：issue/PR 状态 `open` | `closed` | `all`

## 配置（兼容 tea）

CLI 会读取 tea 配置文件：

- `$XDG_CONFIG_HOME/tea/config.yml`（如 `~/.config/tea/config.yml`）
- 或旧路径 `~/.tea/tea.yml`

格式示例：

```yaml
logins:
  - name: gitea.com
    url: https://gitea.com
    token: your-application-token
    user: your-username
    default: true
```

也支持环境变量兜底（当本地配置文件没有任何 logins 时）：

- `GITEA_URL`
- `GITEA_TOKEN`
- `GITEA_LOGIN_NAME`（可选）

在 Gitea 网页端：**设置 → 应用 → 生成新令牌**，按需勾选权限后使用生成的 Token。

## MCP Server

推荐使用 `npx` 方式启动（无需全局安装）：

```sh
npx -y @gitea-toolkit/mcp
```

也可以运行已安装的二进制：

```sh
gitea-mcp
```

### MCP 客户端配置

示例 JSON 配置：

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

## Skill

项目内置了 skill，可通过 `skills` 工具安装：

```sh
npx skills add chizukicn/gitea-toolkit
```

## 开发

```sh
pnpm install
pnpm run build
pnpm run test
pnpm run lint
```

## License

MIT

