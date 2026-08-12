# Test: Missing required field in plugin.json

Plant breakage: remove "description" field from plugin/.claude-plugin/plugin.json

Expected: validate.sh exits 1, error output includes "description"
