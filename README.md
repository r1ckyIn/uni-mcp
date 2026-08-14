# uni-mcp

**English** | [简体中文](README.zh-CN.md)

Out-of-the-box course assistant plugin for university students on Canvas / Ed / Gradescope, built around the [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp) server. Install it into Claude Code or ChatGPT desktop (Codex view), run setup once, and the AI handles course chores with the right tools, knowledge, and workspace.

> **Status: work in progress.** All four skills ship now: `install-check`, `server-install` (canvas-ed-mcp install, keychain-stored credentials), `setup` (course mapping and workspace layout), and `course-playbook` (tool routing, pitfall heuristics, USYD browser routes). Canvas support targets the University of Sydney — other universities are tracked in [#8](https://github.com/r1ckyIn/uni-mcp/issues/8). Progress is tracked in [Issues](https://github.com/r1ckyIn/uni-mcp/issues), the design record lives in [docs/design-decisions.md](docs/design-decisions.md) (Chinese). This README is a placeholder; the full bilingual facade ships with [#9](https://github.com/r1ckyIn/uni-mcp/issues/9).

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

With the plugin installed, ask the AI to "install the course server" (any language works). The `server-install` skill clones [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp), walks you to your Canvas and Ed tokens, stores them in the macOS keychain (Windows: environment variables), registers the server for your host, and verifies connectivity read-only. The Canvas token expires within 90 days — saying "my Canvas token expired" reruns just the refresh part. The server currently targets the University of Sydney's Canvas; other universities are tracked in [#8](https://github.com/r1ckyIn/uni-mcp/issues/8).

## Set up your workspace

Make (or pick) an empty folder, open Claude Code or ChatGPT desktop in it, and ask to "set up my courses". The `setup` skill lists your current courses so you choose which ones to manage, maps each one — which platform actually holds its deadlines, materials and Q&A — saves each unit outline, and lays out the workspace: `AGENTS.md` with the ground rules both hosts follow, a `status/` truth source (assessments, todos, weekly plan, decisions not to do something), and one folder per course. It finishes with example questions using your real course names.

That folder is where you open your AI from then on. Run setup again whenever you add a course or a new semester starts — it refreshes what is there instead of rebuilding it, and never deletes a course folder. The workspace is version-controlled quietly in the background, so a change that breaks something can be rolled back by just asking.
