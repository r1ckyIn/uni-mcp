# ADR-0002: 插件根与仓库根解耦

- 日期：2026-08-12
- 状态：已定（issue #10）；取代 ADR-0001 的目录布局条款，其 manifest 字段条款仍有效

## 布局

插件内容整体移入 `plugin/`：manifest 在 `plugin/.claude-plugin/plugin.json`，技能在 `plugin/skills/<name>/SKILL.md`（agentskills.io 标准，平铺不套分类，沿用 ADR-0001）。marketplace.json 留在仓库根 `.claude-plugin/`（`/plugin marketplace add owner/repo` 从仓库根发现它），插件条目 `source` 从 `./` 改为 `./plugin`。仓库根只剩开发资产（docs/、tests/、scripts/、CI、package.json、CLAUDE.md、README），全部不进用户安装。LICENSE 是唯一双份的文件：仓库根一份为准源，`plugin/LICENSE` 一份随安装分发——MIT 条款要求每份分发副本附带许可文本，安装只拷贝 `plugin/`，不带这份就是裸的 SPDX 字段。安装载荷因此实质变化，版本随本票从 0.1.0 升到 0.2.0（安装缓存按版本分目录，不升版旧安装可能一直吃着解耦前的整仓拷贝）。

Codex 侧（issue #4）的 manifest 届时同样放进 `plugin/`（如 `plugin/.codex-plugin/`），与 Claude 侧共用同一个 `plugin/skills/` 目录，两端共用的定案不受影响。

## 安装拷贝语义（实测）

2026-08-12 以 Claude Code CLI 2.1.228 实测：`CLAUDE_CONFIG_DIR` 指向沙盒目录，目录型 marketplace add 本仓 + `plugin install uni-mcp@uni-mcp`。结论：

- 装进用户环境的插件目录是 `plugins/cache/<marketplace>/<plugin>/<version>/`，内容为 marketplace 条目 `source` 目录的完整拷贝（真实文件、与 `plugin/` 逐字节一致），dev 文件一概不进。
- `installed_plugins.json` 的 `installPath` 指向该 cache 目录，即运行时 `${CLAUDE_PLUGIN_ROOT}`——skill 内 `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` 的引用不受迁移影响。运行时会在插件目录追加自己的标记文件（如 `.in_use`）。
- git 型 marketplace 的差别只在 catalog 侧：`plugins/marketplaces/<name>/` 存整仓 clone（含 .git 与 dev 文件），那是 marketplace 自身的副本；安装出的插件同样物化进 cache、只含 source 子目录内容。旁证：本机 claude-plugins-official 整仓 clone 里的 plugin-dev 子目录插件，cache 副本只有该插件自身文件。
- 安装记录带 source 仓的 git HEAD sha（`gitCommitSha`），脏工作树也照记 HEAD。
- 评审修订后以 0.2.0 载荷（增 `plugin/LICENSE`）复测，结论不变：cache 里只有 LICENSE + manifest + skills，且随版本号落到新目录（`…/0.2.0/`）——升版即换目录，这就是本票坚持升版的原因。

## 校验联动

`scripts/validate.sh` check 2 的目标路径从 marketplace.json 的 `source` 字段派生、不再硬编码——`claude plugin validate . --strict` 实测放行悬空 source，硬编码路径会让 source 指错时全套校验照常全绿，派生后 source 悬空即以 File not found 变红。插件根不再有 CLAUDE.md，strict 校验零警告，原先的 CLAUDE.md 警告白名单整块删除。fixtures 植入路径同步迁移，另新增两个：marketplace-dangling-source（source 悬空必须红）、skill-missing-description（证明 check 2 真的在扫 skills 规范，而非只看 manifest）。
