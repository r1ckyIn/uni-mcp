# Test: Strict mode validation failure

Plant breakage: add unknown field to plugin/.claude-plugin/plugin.json

Expected: validate.sh exits 1 with --strict mode, error includes "Unknown field"
