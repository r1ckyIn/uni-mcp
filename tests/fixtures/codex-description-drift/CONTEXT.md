# Test: Description drift between the two plugin manifests

Plant breakage: plugin/.codex-plugin/plugin.json description reverted to the 0.3.0 skeleton wording while plugin/.claude-plugin/plugin.json keeps the release description. interface.longDescription is kept equal to the planted description so only the cross-manifest check fires, isolating the drift under test.

The release description is hand-maintained in four slots (Claude manifest, Codex manifest, Codex interface.longDescription, Claude marketplace entry). Name/version sync alone would let the slots drift apart silently — the ChatGPT listing would keep advertising a stale feature set while validate.sh stays green.

Expected: validate.sh exits 1, error output contains "manifest drift: .codex-plugin description". The expect string omits the concrete texts so routine description rewording doesn't have to touch this fixture (the planted skeleton wording mismatches any future real description).
