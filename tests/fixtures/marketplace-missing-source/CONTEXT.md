# Test: Missing "source" in marketplace plugin entry

Plant breakage: remove the required "source" field from the plugins[0] entry in .claude-plugin/marketplace.json

Expected: validate.sh exits non-zero, error output includes "source"
