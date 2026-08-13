# Test: Missing required field in codex plugin.json

Plant breakage: remove "version" from plugin/.codex-plugin/plugin.json. Codex CLI installs such a manifest anyway (into a "local" version dir), so only check 5's schema mirror catches it.

Expected: validate.sh exits 1, error output says field `version` must be a non-empty string
