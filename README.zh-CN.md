<!-- markdownlint-configure-file { "MD041": false } -->
<div align="center">

# uni-mcp

[English](README.md) | **简体中文**

面向 Canvas / Ed / Gradescope 大学生的开箱即用课程 AI 助手插件。<br>
装进 Claude Code 或 ChatGPT 桌面，跑一次 setup，<br>
AI 就带着合适的工具、合适的知识和一个替你维护的工作区接管课程事务。

[![validate](https://github.com/r1ckyIn/uni-mcp/actions/workflows/validate.yml/badge.svg)](https://github.com/r1ckyIn/uni-mcp/actions/workflows/validate.yml)
[![plugin version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fr1ckyIn%2Funi-mcp%2Fmain%2Fplugin%2F.claude-plugin%2Fplugin.json&query=%24.version&prefix=v&label=plugin)](plugin/.claude-plugin/plugin.json)
[![license](https://img.shields.io/github/license/r1ckyIn/uni-mcp)](LICENSE)
[![hosts](https://img.shields.io/badge/hosts-Claude_Code_%C2%B7_Codex_%2F_ChatGPT_desktop-8A2BE2)](#1-装插件)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/r1ckyIn/uni-mcp/issues)

![真实安装录屏：同一个插件装进 Claude Code 和 Codex / ChatGPT 桌面](docs/assets/demo.gif)

</div>

> 本文是英文版 README 的中文对照，两者不一致时以[英文版](README.md)为准。

## 为什么要有它

把 AI 直接对上一个课程 MCP server，它拿到的是 49 个裸工具和零经验：不知道哪门课的 deadline 落在哪个平台、该先调哪个列表工具，也不知道考核表里写的「Online quiz」可能实际是要装 LockDown Browser 的线下测验。每个学生都得从零教一遍自己的 AI——而完全不碰终端的学生，连 server 都装不起来。

uni-mcp 把这些经验打包成插件：自带知识层（工具路由、数据坑、来源优先级规则），全程在聊天里带不懂技术的用户装好 [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp) server，再铺好一个之后由 AI 持续维护的课程工作区。

## 功能

- 🧭 **工具路由 playbook** —— 「什么时候 due」「找课件」「搜 Ed」各自对应一两次调用就出答案的工具链，不用翻原始列表。
- ⚠️ **踩坑启发** —— closing time ≠ due time、考核表 Type 列和描述对不上、按问题类型分的来源优先级（unit outline / Canvas / Ed staff FAQ 各管什么），外加一条交叉核对规矩：你要拿去行动的事实两源交叉并注明来源，只有单源就明说。
- 🗺️ **每课一份课程地图** —— setup 逐门摸底，记下这门课的 deadline、资料、答疑各自真正落在哪。没有 API 的站点（课表、录播、选课）的浏览器路线对悉尼大学开箱内置；setup 只在你的课需要内置没覆盖的站点时才补记新条目。
- 🔑 **纯聊天装 server** —— 贴一段提示词，AI 就克隆 canvas-ed-mcp、一步步带你取 Canvas / Ed token、存进 macOS 钥匙串，不存在装着 token 的明文文件。（Windows 退回用户环境变量，保护弱一档，指引里会照实说。）
- 🖥️ **双宿主一套技能** —— 同一个插件装进 Claude Code 和 Codex CLI / ChatGPT 桌面，每份安装都带两套 manifest；课程事实存在两个宿主共享的工作区文件里。
- 🔒 **默认只读** —— 任何写操作（交作业、发帖、删东西）都要你当次明确点头，这条规矩同时写在知识层和工作区守则里。

## 快速上手

> Canvas 侧目前只对接**悉尼大学**，其他学校在 [#8](https://github.com/r1ckyIn/uni-mcp/issues/8) 跟踪。Ed 和 Gradescope 设计上不挑学校，但目前每次完整验证用的都是悉尼大学账号。

### 1. 装插件

**Claude Code：**

```bash
claude plugin marketplace add r1ckyIn/uni-mcp
claude plugin install uni-mcp@uni-mcp
```

（在 Claude Code 会话里用斜杠命令效果相同：`/plugin marketplace add r1ckyIn/uni-mcp`，然后 `/plugin install uni-mcp@uni-mcp`。）

**Codex CLI / ChatGPT 桌面：**

```bash
codex plugin marketplace add r1ckyIn/uni-mcp
codex plugin add uni-mcp@uni-mcp
```

ChatGPT 桌面的 Codex 视图和 CLI 共用插件配置，CLI 装完桌面端就有——记得新开一个 session。（完全不碰 CLI、纯 app 内安装的路径尚未验证。）装完在任一宿主问 **「check uni-mcp」** 即可确认。

### 2. 连接课程服务器

对 AI 说 **「帮我装课程服务器」**（说英文 "install the course server" 也行）。它会克隆 canvas-ed-mcp，逐步带你取 Canvas 和 Ed 的 token（Gradescope 登录可选配），存进钥匙串，为当前宿主注册 server，并做只读连通验证。这一步需要 `git` 和 Python 3.10 以上——缺 Python 的话，指引会带你完成那一次下载。Canvas token 最长 90 天过期——之后说一句 **「我的 Canvas token 过期了」**，只重跑刷新那一段。

新装的课程工具只在新会话里出现，所以装完先新开一个会话再继续。

### 3. 铺设工作区

新建（或挑）一个空文件夹，在里面新开一个 AI 会话，说 **「帮我配置课程助手」**。setup 会列出你在读的课让你勾选要管哪几门，逐门摸底，存下每门课的 unit outline，然后铺好工作区，最后用你真实的课名给出可以直接抄的提问例句。

之后你就在这个文件夹里开 AI。换学期或加课就再跑一次 setup——按增量刷新，绝不删课程目录；文件夹在后台被安静地做了版本管理，改坏了跟 AI 说一声就能还原。

### 4. 开始提问

> 「这周有什么要交的？」 · 「找第 5 周的课件」 · 「Ed 上有人问过 Q3 吗？」 · 「期末考占多少分——线上还是线下？」

## setup 铺出来的工作区长什么样

一次真实运行（悉尼大学，5 门课）的产物：

```text
my-courses/
├── AGENTS.md          # 两个宿主共同遵守的守则（含只读规矩）
├── CLAUDE.md          # 一行导入，让 Claude Code 也读 AGENTS.md
├── status/            # 状态真相源：考核总表、todos、周计划、
│   │                  # 以及明确决定不做的事
│   ├── assessments.md
│   ├── todos.md
│   ├── weekly.md
│   └── not-doing.md
├── COMP2022/          # 每课一个目录，按课程代码命名
│   ├── course-map.md  # 这门课的 deadline / 资料 / 答疑各在哪
│   └── outline.md     # 存档的 unit outline
├── DATA2002/
└── …
```

## 四个技能

| 技能 | 做什么 | 触发 |
| ---- | ------ | ---- |
| `install-check` | 确认插件在当前宿主装好、技能可加载 | 「check uni-mcp」 |
| `server-install` | 引导式装 canvas-ed-mcp：克隆、取 token、进钥匙串、注册宿主、只读验证 | 「帮我装课程服务器」「Canvas token 过期了」 |
| `setup` | 全插件唯一显式命令：摸底课程、铺设工作区，可幂等重跑 | 「帮我配置课程助手」 |
| `course-playbook` | 静态知识：工具路由、踩坑、来源优先级、USYD 浏览器路线 | 问到课程问题时自动生效 |

## 其他 MCP 客户端

[canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp) server 可以独立使用：任何 MCP 客户端都能直接注册它，拿到原始的 Canvas / Ed / Gradescope 工具，不需要装本插件。

## 常见问题

**支持哪些学校？** Canvas 目前只对接悉尼大学；Canvas 网址可配置化在 [#8](https://github.com/r1ckyIn/uni-mcp/issues/8) 跟踪。Ed 和 Gradescope 设计上不挑学校（注意 Ed 登录分学校区域，要选对自己学校的区），但完整验证过的只有悉尼大学账号。

**token 安全吗？** token 只在聊天里贴一次，写进 macOS 钥匙串，之后不回显，不存在装着它的明文文件。Windows 退回用户环境变量，保护弱一档，安装指引里会照实说。可选配的 Gradescope 用的是真实账号密码，要格外当心。拿到这些凭证的人就能查你的课程数据——别发给任何人。

**Windows / Linux 呢？** 安装流程主路径是 macOS；Windows 按同一顺序走文档里的替代方案。Linux 目前没有可用路径——凭证存储只覆盖 macOS 钥匙串和 Windows 环境变量。

**AI 会不会自作主张改东西？** 不会。读随便读；任何写操作——交作业、发 Ed、删任何东西——都要你当次明确确认。

## 状态

开发中，今天就能用。Claude Code 路径已用真实账号完整验证；Codex / ChatGPT 桌面侧 CLI 安装已验证，app 内端到端走通还没做完，验收记录在 [docs/acceptance.md](docs/acceptance.md)。进度见 [Issues](https://github.com/r1ckyIn/uni-mcp/issues)，设计定案在 [docs/design-decisions.md](docs/design-decisions.md)。README 演示图由 [VHS](https://github.com/charmbracelet/vhs) 从 [docs/assets/demo.tape](docs/assets/demo.tape) 生成——真实安装命令的脚本化重放。

## 许可证

[MIT](LICENSE)
