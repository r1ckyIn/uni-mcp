---
name: install-check
description: This skill should be used when the user asks to verify the uni-mcp plugin installation — "check uni-mcp", "is uni-mcp installed", "is the uni-mcp plugin working" — or has just installed uni-mcp and wants to confirm its skills load.
---

# Install Check

Confirm to the user that the uni-mcp plugin is installed and its skills load. This file being read at all proves the whole chain works: marketplace → plugin manifest → skill discovery. The same plugin installs into Claude Code and Codex / ChatGPT desktop; both manifests ship in every install.

To run the check:

1. Read the manifest for the current host and report the installed plugin name and version:
   - Claude Code: run `cat "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json"` in the shell — the variable only expands there, so do not pass that path to a file-reading tool.
   - Codex / ChatGPT: read `<plugin root>/.codex-plugin/plugin.json`, where the plugin root is two levels up from this skill's directory — from `.../skills/install-check/SKILL.md`, that is the directory containing `skills/`.
2. Tell the user the install is working: the plugin's skills are visible and loadable in this session.
3. State what this version provides by relaying the `description` field from the manifest just read — it names the shipped skills and what is still in development, and stays current without this file changing. Progress is tracked at <https://github.com/r1ckyIn/uni-mcp/issues>.
