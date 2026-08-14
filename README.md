# uni-mcp

**English** | [简体中文](README.zh-CN.md)

Out-of-the-box course assistant plugin for university students on Canvas / Ed / Gradescope, built around the [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp) server. Install it into Claude Code or ChatGPT desktop (Codex view), run setup once, and the AI handles course chores with the right tools, knowledge, and workspace.

> **Status: work in progress.** What exists today is the installable skeleton for both hosts, the `course-playbook` knowledge layer (tool routing, pitfall heuristics, USYD browser routes), and the `server-install` guided flow (canvas-ed-mcp install, keychain-stored credentials). The setup flow is in development: progress is tracked in [Issues](https://github.com/r1ckyIn/uni-mcp/issues), the design record lives in [docs/design-decisions.md](docs/design-decisions.md) (Chinese). This README is a placeholder; the full bilingual facade ships with [#9](https://github.com/r1ckyIn/uni-mcp/issues/9).

## Try the skeleton (Claude Code)

```bash
/plugin marketplace add r1ckyIn/uni-mcp
/plugin install uni-mcp@uni-mcp
```

Then ask Claude to "check uni-mcp" — the `install-check` skill confirms the plugin installed and its skills load.

## Try the skeleton (Codex CLI / ChatGPT desktop)

```bash
codex plugin marketplace add r1ckyIn/uni-mcp
codex plugin add uni-mcp@uni-mcp
```

Open a new session and ask "check uni-mcp". ChatGPT desktop's Codex view shares the same plugin config, so a CLI install shows up there too — no separate steps. (An in-app install path that skips the CLI entirely is not verified yet.)

## Connect the course server

With the plugin installed, ask the AI to "install the course server". The `server-install` skill clones [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp), walks you to your Canvas and Ed tokens, stores them in the macOS keychain (Windows: environment variables — never in a plaintext file), registers the server for your host, and verifies connectivity read-only. Tokens are pasted once in chat and never echoed back; the Canvas token expires within 90 days, and saying "my Canvas token expired" reruns just the refresh part.
