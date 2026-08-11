# ADR-0001: Claude 侧插件骨架的 manifest 与目录布局

- 日期：2026-08-12
- 状态：已定（issue #2）

## Manifest 字段

plugin.json 只写 name / version / description / author / repository / keywords，组件路径全靠 Claude Code 默认自动发现、不写自定义路径；license 字段等 #9 加 LICENSE 文件时一起补，避免声明与仓库实况不符。

## 目录布局

单仓自营市场：marketplace.json 与 plugin.json 同放 `.claude-plugin/`，插件条目 `source: "./"` 使插件根 = 仓库根；skills/ 平铺在仓库根、每技能一目录（`skills/<name>/SKILL.md`，agentskills.io 标准），不套分类子目录，#4 的 Codex 侧将直接共用这同一个 skills/ 目录。
