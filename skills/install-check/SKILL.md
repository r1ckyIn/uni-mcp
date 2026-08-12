---
name: install-check
description: This skill should be used when the user asks to verify the uni-mcp plugin installation — "check uni-mcp", "is uni-mcp installed", "is the uni-mcp plugin working" — or has just installed uni-mcp and wants to confirm its skills load.
---

# Install Check

Confirm to the user that the uni-mcp plugin is installed and its skills load. This file being read at all proves the whole chain works: marketplace → plugin manifest → skill discovery.

To run the check:

1. Run `cat "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json"` in the shell (the variable only expands there) and report the installed plugin name and version.
2. Tell the user the install is working: the plugin's skills are visible and loadable in this session.
3. State what this version provides: this install-check skill only. The course-assistant features (setup command, tool-routing knowledge, pitfall heuristics) ship in later releases — progress is tracked at <https://github.com/r1ckyIn/uni-mcp/issues>.
