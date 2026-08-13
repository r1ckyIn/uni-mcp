# Test: Marketplace name drift between the two hosts

Plant breakage: rename .agents/plugins/marketplace.json's top-level `name` to "uni-mcp-dev" while .claude-plugin/marketplace.json keeps "uni-mcp". The install id is `<plugin>@<marketplace>` on both hosts and ADR-0003 fixes them as identical (`uni-mcp@uni-mcp`), so a one-sided rename silently breaks the documented `codex plugin add uni-mcp@uni-mcp` command.

Expected: validate.sh exits 1, error output contains "marketplace name drift".
