---
name: install-check
description: This skill should be used when the user asks to verify the uni-mcp plugin installation — "check uni-mcp", "is uni-mcp installed", "is the uni-mcp plugin working" — or has just installed uni-mcp and wants to confirm its skills load.
---

# Install Check

Confirm to the user that the uni-mcp plugin is installed and its skills load. This file being read at all proves the whole chain works: marketplace → plugin manifest → skill discovery. The same plugin installs into Claude Code and Codex / ChatGPT desktop; both manifests ship in every install.

To run the check:

1. Locate the plugin root — the directory two levels up from this SKILL.md (the one containing `skills/`). In Claude Code, `${CLAUDE_PLUGIN_ROOT}` points there (the variable only expands in shell commands); in Codex / ChatGPT, use the path this skill was loaded from.
2. Read the manifest for the current host from the plugin root — `.claude-plugin/plugin.json` in Claude Code, `.codex-plugin/plugin.json` in Codex / ChatGPT — and report the installed plugin name and version.
3. Tell the user the install is working: the plugin's skills are visible and loadable in this session.
4. State what this version provides: this install-check skill only. The course-assistant features (setup command, tool-routing knowledge, pitfall heuristics) ship in later releases — progress is tracked at <https://github.com/r1ckyIn/uni-mcp/issues>.
