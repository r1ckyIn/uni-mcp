# uni-mcp

[English](README.md) | **简体中文**

> 本文是英文版 README 的中文对照，两者不一致时以[英文版](README.md)为准。

面向 Canvas / Ed / Gradescope 大学生的开箱即用课程 AI 助手插件，围绕 [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp) server 构建。装进 Claude Code 或 ChatGPT 桌面（Codex 视图），跑一次 setup，AI 就带着合适的工具、知识和工作区接管课程事务。

> **状态：开发中。** 目前已有的是两端可安装骨架、`course-playbook` 知识层（工具路由、踩坑启发、USYD 浏览器路线）和 `server-install` 引导流程（安装 canvas-ed-mcp、凭证存钥匙串）。setup 流程在开发：进度见 [Issues](https://github.com/r1ckyIn/uni-mcp/issues)，设计定案在 [docs/design-decisions.md](docs/design-decisions.md)。本文件是占位版，完整双语门面随 [#9](https://github.com/r1ckyIn/uni-mcp/issues/9) 发布。

## 试装骨架（Claude Code）

```bash
/plugin marketplace add r1ckyIn/uni-mcp
/plugin install uni-mcp@uni-mcp
```

装完后让 Claude「check uni-mcp」，`install-check` 技能会确认插件已装好、技能可以加载。

## 试装骨架（Codex CLI / ChatGPT 桌面）

```bash
codex plugin marketplace add r1ckyIn/uni-mcp
codex plugin add uni-mcp@uni-mcp
```

新开一个 session 问「check uni-mcp」即可。ChatGPT 桌面的 Codex 视图与 CLI 共用插件配置，CLI 装完桌面端直接可见，无需额外步骤。（完全不装 CLI、纯 app 内安装的路径尚未验证。）

## 连接课程服务器

插件装好后，对 AI 说「install the course server」（或「帮我装课程服务器」）。`server-install` 技能会克隆 [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp)、一步步带你取 Canvas 和 Ed 的 token、把 token 存进 macOS 钥匙串（Windows 用环境变量，绝不写明文文件）、为当前宿主注册 server，并做只读连通验证。token 在聊天里只贴一次，之后不会被回显；Canvas token 最长 90 天过期，到期对 AI 说「我的 Canvas token 过期了」只重跑刷新那一段。
