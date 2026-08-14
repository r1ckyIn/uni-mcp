# uni-mcp

[English](README.md) | **简体中文**

> 本文是英文版 README 的中文对照，两者不一致时以[英文版](README.md)为准。

面向 Canvas / Ed / Gradescope 大学生的开箱即用课程 AI 助手插件，围绕 [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp) server 构建。装进 Claude Code 或 ChatGPT 桌面（Codex 视图），跑一次 setup，AI 就带着合适的工具、知识和工作区接管课程事务。

> **状态：开发中。** 四个技能均已发布：`install-check`、`server-install`（安装 canvas-ed-mcp、凭证存钥匙串）、`setup`（摸底课程、铺设工作区）、`course-playbook`（工具路由、踩坑启发、USYD 浏览器路线）。Canvas 侧目前只对接悉尼大学，其他学校见 [#8](https://github.com/r1ckyIn/uni-mcp/issues/8)。进度见 [Issues](https://github.com/r1ckyIn/uni-mcp/issues)，设计定案在 [docs/design-decisions.md](docs/design-decisions.md)。本文件是占位版，完整双语门面随 [#9](https://github.com/r1ckyIn/uni-mcp/issues/9) 发布。

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

插件装好后，对 AI 说「install the course server」（中文说「帮我装课程服务器」也行）。`server-install` 技能会克隆 [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp)、一步步带你取 Canvas 和 Ed 的 token、把 token 存进 macOS 钥匙串（Windows 用环境变量）、为当前宿主注册 server，并做只读连通验证。Canvas token 最长 90 天过期——到期对 AI 说「我的 Canvas token 过期了」只重跑刷新那一段。服务器目前只对接悉尼大学的 Canvas，其他学校的支持见 [#8](https://github.com/r1ckyIn/uni-mcp/issues/8)。

## 铺设工作区

新建（或挑）一个空文件夹，在里面打开 Claude Code 或 ChatGPT 桌面，说「帮我配置课程助手」。`setup` 技能会列出你当前在读的课让你勾选要管哪几门，逐门摸底写课程地图（deadline、讲义、答疑各自真正落在哪个平台），存下每门课的 unit outline，然后铺好工作区：`AGENTS.md` 写清两个宿主都要守的规矩，`status/` 作为状态真相源（考核总表、todos、周计划、明确不做的事），每门课一个目录。最后用你真实的课名给出可以直接抄的提问例句。

之后你就在这个文件夹里开 AI。加课或者换学期就再说一次配置——它按增量刷新，不推倒重来，也不会删掉任何课程目录。文件夹在后台被安静地做了版本管理，改坏了跟 AI 说一声就能还原。
