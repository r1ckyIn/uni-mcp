# uni-mcp

## 开发纪律:能复用不自造(Ricky 2026-08-12 定)

任何环节先找现成的:已有实现 > 已装 skill/plugin 辅助 > 最后才自写。开发本插件时按场景用这些已装辅助:

- 建/改插件结构与 manifest:plugin-dev 插件(`plugin-dev:plugin-structure`、`plugin-dev:create-plugin`),完成后用 `plugin-dev:plugin-validator` agent 校验
- 写/改 SKILL.md:`plugin-dev:skill-development` + `mattpocock-skills:writing-for-agents`,写完用 `plugin-dev:skill-reviewer` agent 过一遍
- 新建独立 skill 或调 description:`skill-creator`

工具建议与本仓定案冲突时,以 `docs/design-decisions.md` 为准。

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (github.com/r1ckyIn/uni-mcp), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary — label strings equal the role names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus `docs/adr/` at the repo root. See `docs/agents/domain.md`.
