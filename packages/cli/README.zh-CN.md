# @gitea-toolkit/cli

兼容 tea 的 Gitea 命令行工具。

此包提供 `tea` 可执行文件。

English README：`README.md`

## 安装

```sh
pnpm add -g @gitea-toolkit/cli
# 或在项目中：
pnpm add @gitea-toolkit/cli
```

## 用法

```sh
tea --help
tea login add
tea whoami
tea issues
tea pulls
tea open
```

## 配置

读取 tea 配置：

- `$XDG_CONFIG_HOME/tea/config.yml`（如 `~/.config/tea/config.yml`）
- 或旧路径 `~/.tea/tea.yml`

环境变量兜底（当配置文件没有任何 logins 时）：`GITEA_URL`、`GITEA_TOKEN`、`GITEA_LOGIN_NAME`（可选）。

## 链接

- 仓库：`https://github.com/chizukicn/gitea-toolkit`
- 详细说明：见仓库根目录 `README.md`

