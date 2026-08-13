# ADR-0003: Codex 侧双 manifest 与校验

- 日期：2026-08-13
- 状态：已定（issue #4）；沿用 ADR-0002 的 `plugin/` 布局

## 布局

仓库根新增 `.agents/plugins/marketplace.json`（Codex 的 well-known 发现路径，`codex plugin marketplace add <仓库>` 从 marketplace 根按此路径读取）；插件 manifest 放 `plugin/.codex-plugin/plugin.json`，与 Claude 侧 manifest 同级并存，共用同一个 `plugin/skills/`——SKILL.md 一套两端，零复制分叉。marketplace 名与插件名都叫 `uni-mcp`，两端安装 id 一致（`uni-mcp@uni-mcp`）。marketplace 条目 `source.path` 用 `./plugin`：官方脚手架的 `./plugins/<name>` 只是惯例，实测任意相对路径可装，插件目录名与插件名不必相同。

## 字段定案

- `policy.installation: AVAILABLE`、`category: Education`。
- `policy.authentication: ON_USE`：本插件无鉴权面（不带 MCP server），该字段惰性；取官方 skills-only 插件（documents/pdf 等）的一致先例。plugin-creator 脚手架默认 ON_INSTALL，属可换项。
- `interface` 块整个必填：`displayName`/`shortDescription`/`longDescription`/`developerName`/`category`/`defaultPrompt` 是 Codex ingestion 的硬性要求（缺任一即非法 manifest），与 Claude manifest 的最小字段集不同，照单全给。
- 双 manifest 纪律：`.codex-plugin` 与 `.claude-plugin` 的 `name`、`version` 必须一致，check 5 强制（两宿主装的是同一个 `plugin/` 目录，版本漂移等于给同一载荷贴两个发行号）。本票安装载荷再次变化（`plugin/` 增 `.codex-plugin/`），版本 0.2.0 → 0.3.0 双双升，沿用 ADR-0002 的升版理由（安装缓存按版本分目录）。

## 校验定案

codex CLI 全程零校验（0.144.1 实测 2026-08-13）：`plugin marketplace add` 与 `plugin add` 对缺 `version` 的 manifest 照常安装、版本目录落成 `local`。因此 Codex 侧没有对应 `claude plugin validate` 的宿主工具可用，check 5 用自写静态镜像 `scripts/check-codex-manifests.mjs`。schema 权威是 codex-cli 内置的 plugin-creator 系统 skill（`references/plugin-json-spec.md` + `scripts/validate_plugin.py`），升级 codex CLI 时按它对照更新脚本。CI 不装 codex CLI——装了也校验不了任何东西，纯耗时。

## 安装拷贝语义（实测 0.144.1）

`codex plugin add` 把 marketplace 条目 `source` 目录完整拷进 `$CODEX_HOME/plugins/cache/<marketplace>/<plugin>/<version>/`，与 Claude Code 的 cache 布局同构；`codex plugin list` 的 PATH 列显示 source 原路径而非 cache。marketplace 本身按引用记路径（本地目录型不复制）。

## SKILL.md 两端共用的代价

install-check 原文依赖 `${CLAUDE_PLUGIN_ROOT}`（Claude 专属变量，Codex 不设等价物），已改为宿主无关寻径（从 SKILL.md 位置上溯两级到插件根）+ 按宿主选 manifest 文件。这是「一套两端」的既定代价：skill 正文不得依赖单一宿主的变量或路径约定。

## ChatGPT 桌面路径（实测 2026-08-13）

ChatGPT.app 注册了 `codex://` URL scheme，与 codex CLI 共用同一份插件配置。实测走通的安装路径：CLI 执行 `codex plugin marketplace add` + `codex plugin add` 后，ChatGPT 桌面端即可见该插件——deeplink `codex://plugins/uni-mcp?marketplacePath=<marketplace.json 绝对路径>` 直达插件详情页，页面渲染出 displayName、描述、defaultPrompt 快捷提示、技能计数与 Try now 按钮。未验证的剩余项：桌面端不经 CLI 的纯 app 内第三方 marketplace 浏览/安装入口（是否存在未核实），该项继续挂账（design-decisions.md 挂账清单有对应更新注记）。
