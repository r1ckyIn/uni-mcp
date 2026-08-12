# uni-mcp

Out-of-the-box course assistant plugin for university students on Canvas / Ed / Gradescope, built around the [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp) server. Install it into Claude Code or ChatGPT desktop (Codex view), run setup once, and the AI handles course chores with the right tools, knowledge, and workspace.

> **Status: work in progress.** What exists today is the Claude-side installable skeleton — a single `install-check` skill. The setup flow, knowledge layer, and Codex/ChatGPT support are in development: progress is tracked in [Issues](https://github.com/r1ckyIn/uni-mcp/issues), the design record lives in [docs/design-decisions.md](docs/design-decisions.md) (Chinese). This README is a placeholder; the full bilingual one ships with [#9](https://github.com/r1ckyIn/uni-mcp/issues/9).
>
> 中文：面向 Canvas / Ed / Gradescope 学生的开箱即用课程 AI 助手插件，开发中。中文版 README 随完整门面（[#9](https://github.com/r1ckyIn/uni-mcp/issues/9)）发布，设计文档见 [docs/design-decisions.md](docs/design-decisions.md)。

## Try the skeleton (Claude Code)

```
/plugin marketplace add r1ckyIn/uni-mcp
/plugin install uni-mcp@uni-mcp
```

Then ask Claude to "check uni-mcp" — the `install-check` skill confirms the plugin installed and its skills load.
