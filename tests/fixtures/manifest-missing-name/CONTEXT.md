# Test: Missing required "name" in plugin.json

Plant breakage: remove the required "name" field from plugin/.claude-plugin/plugin.json

Expected: validate.sh exits non-zero, error output includes "name: Invalid input"
