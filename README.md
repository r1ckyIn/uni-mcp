<!-- markdownlint-configure-file { "MD041": false } -->
<div align="center">

# uni-mcp

**English** | [简体中文](README.zh-CN.md)

Out-of-the-box course assistant plugin for university students on Canvas / Ed / Gradescope.<br>
Install it into Claude Code or ChatGPT desktop, run setup once, and your AI handles course chores<br>
with the right tools, the right knowledge, and a workspace it keeps for you.

[![validate](https://github.com/r1ckyIn/uni-mcp/actions/workflows/validate.yml/badge.svg)](https://github.com/r1ckyIn/uni-mcp/actions/workflows/validate.yml)
[![plugin version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fr1ckyIn%2Funi-mcp%2Fmain%2Fplugin%2F.claude-plugin%2Fplugin.json&query=%24.version&prefix=v&label=plugin)](plugin/.claude-plugin/plugin.json)
[![license](https://img.shields.io/github/license/r1ckyIn/uni-mcp)](LICENSE)
[![hosts](https://img.shields.io/badge/hosts-Claude_Code_%C2%B7_Codex_%2F_ChatGPT_desktop-8A2BE2)](#1-install-the-plugin)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/r1ckyIn/uni-mcp/issues)

![Real install run: the same plugin installs into Claude Code and Codex / ChatGPT desktop](docs/assets/demo.gif)

</div>

## Why

Point an AI at a raw course MCP server and it gets 49 bare tools with zero experience: it doesn't know which platform holds which course's deadlines, which listing call to try first, or that the assessments table's "Online quiz" may actually mean an in-person quiz with LockDown Browser. Every student has to teach their AI from scratch — and students who never touch a terminal can't even get the server installed.

uni-mcp packages that experience as a plugin. It ships the knowledge layer (tool routing, data pitfalls, source-priority rules), walks non-technical users through installing the [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp) server entirely in chat, and lays out a course workspace the AI maintains from then on.

## Features

- 🧭 **Tool-routing playbook** — "when is X due", "find the slides", "search Ed" each map to the right one-or-two-call tool chain instead of paging through raw listings.
- ⚠️ **Pitfall heuristics** — closing time ≠ due time, assessment Type columns that contradict their descriptions, per-question-type source priority (unit outline vs Canvas vs Ed staff FAQ), and a cross-check rule: facts you'll act on are verified against two sources with the sources named, and single-source answers say so.
- 🗺️ **Per-course maps** — setup probes each of your courses and records where its deadlines, materials and Q&A actually live. Browser routes for sites with no API (timetable, lecture recordings, enrolment) ship built-in for USYD; setup records extra route entries only when your courses need ones the built-ins don't cover.
- 🔑 **Chat-only server install** — paste one prompt, and the AI clones canvas-ed-mcp, walks you to your Canvas / Ed tokens, and stores them in the macOS keychain, so no plaintext file ever holds them. (Windows falls back to user environment variables — weaker, and the guide says so honestly.)
- 🖥️ **Two hosts, one skill set** — the same plugin installs into Claude Code and Codex CLI / ChatGPT desktop; both manifests ship in every copy, and course facts live in workspace files both hosts share.
- 🔒 **Read-only by default** — any write (submitting, posting, deleting) needs your explicit yes at that moment, a rule enforced in both the knowledge layer and the workspace ground rules.

## Quick start

> Canvas support currently targets the **University of Sydney** — other universities are tracked in [#8](https://github.com/r1ckyIn/uni-mcp/issues/8). Ed and Gradescope aren't tied to USYD by design, but every verified run so far used a USYD account.

### 1. Install the plugin

**Claude Code:**

```bash
claude plugin marketplace add r1ckyIn/uni-mcp
claude plugin install uni-mcp@uni-mcp
```

(Inside a Claude Code session, the slash form does the same: `/plugin marketplace add r1ckyIn/uni-mcp`, then `/plugin install uni-mcp@uni-mcp`.)

**Codex CLI / ChatGPT desktop:**

```bash
codex plugin marketplace add r1ckyIn/uni-mcp
codex plugin add uni-mcp@uni-mcp
```

ChatGPT desktop's Codex view shares the CLI's plugin config, so a CLI install shows up there too — open a new session afterwards. (A pure in-app install path that skips the CLI is not verified yet.) To confirm either host, ask the AI to **"check uni-mcp"**.

### 2. Connect the course server

Ask the AI to **"install the course server"** (any language works). It clones canvas-ed-mcp, walks you to your Canvas and Ed tokens with step-by-step screenshots-in-words (plus an optional Gradescope login), stores them in the keychain, registers the server for your host, and verifies connectivity read-only. It needs `git` and Python 3.10+ — if Python is missing, the guide walks you through the one download. Canvas tokens expire within 90 days — later, saying **"my Canvas token expired"** reruns just the refresh.

The new course tools only show up in fresh sessions, so when the install finishes, start a new session before you continue.

### 3. Set up your workspace

Make (or pick) an empty folder, open a fresh session of your AI in it, and ask to **"set up my courses"**. Setup lists your current courses so you choose which to manage, maps each one, saves each unit outline, and lays out the workspace. It ends with example questions using your real course names.

That folder is where you open your AI from then on. New semester or new course? Run setup again — it refreshes incrementally, never deletes a course folder, and the folder is quietly version-controlled so a bad change can be rolled back by just asking.

### 4. Ask away

> "What's due this week?" · "Find the week 5 lecture slides" · "Has anyone asked about Q3 on Ed?" · "How much is the final exam worth — and is it online or in person?"

## What setup builds

A real run (5 courses, University of Sydney) produces:

```text
my-courses/
├── AGENTS.md          # ground rules both hosts follow (read-only rule included)
├── CLAUDE.md          # one-line import so Claude Code reads AGENTS.md
├── status/            # the truth source: assessments, todos, weekly plan,
│   │                  # and things you decided NOT to do
│   ├── assessments.md
│   ├── todos.md
│   ├── weekly.md
│   └── not-doing.md
├── COMP2022/          # one folder per course, named by course code
│   ├── course-map.md  # where this course's deadlines / materials / Q&A live
│   └── outline.md     # captured unit outline
├── DATA2002/
└── …
```

## The four skills

| Skill | What it does | Trigger |
| ----- | ------------ | ------- |
| `install-check` | Confirms the plugin installed and its skills load on the current host | "check uni-mcp" |
| `server-install` | Guided canvas-ed-mcp install: clone, tokens, keychain, host registration, read-only verify | "install the course server", "my Canvas token expired" |
| `setup` | The plugin's only explicit command: map courses, lay out the workspace, idempotent rerun | "set up my courses" |
| `course-playbook` | Static knowledge: tool routing, pitfalls, source priority, USYD browser routes | fires on course questions |

## Other MCP clients

The [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp) server works standalone: any MCP client can register it directly and get the raw Canvas / Ed / Gradescope tools without this plugin.

## FAQ

**Which universities work?** Canvas support currently targets the University of Sydney; making the Canvas base URL configurable is tracked in [#8](https://github.com/r1ckyIn/uni-mcp/issues/8). Ed and Gradescope aren't tied to a university by design (note Ed's login is region-scoped — pick your school's region), but only USYD accounts have been verified end to end.

**Is my token safe?** Tokens are pasted once in chat, written to the macOS keychain and never echoed back — no plaintext file holds them. On Windows they sit in user environment variables instead, which is weaker, and the install guide says so. The optional Gradescope login is a real account password, so it deserves extra care. Anyone holding these credentials can read your course data — don't send them to anyone.

**Windows / Linux?** The install flow's primary path is macOS; Windows follows the same sequence with documented substitutions. Linux has no supported path yet — credential storage covers only the macOS keychain and Windows environment variables.

**Does the AI change anything without asking?** No. Reads are free; every write — submitting an assignment, posting to Ed, deleting anything — requires your explicit confirmation at that moment.

## Status

Work in progress, usable today. The Claude Code path is verified end to end with a real account; on Codex / ChatGPT desktop the CLI install is verified, and the in-app end-to-end walkthrough is still open — the acceptance record is [docs/acceptance.md](docs/acceptance.md) (Chinese). Progress lives in [Issues](https://github.com/r1ckyIn/uni-mcp/issues); the design record is [docs/design-decisions.md](docs/design-decisions.md) (Chinese). The README demo is generated with [VHS](https://github.com/charmbracelet/vhs) from [docs/assets/demo.tape](docs/assets/demo.tape) — a scripted replay of the real install commands.

## License

[MIT](LICENSE)
