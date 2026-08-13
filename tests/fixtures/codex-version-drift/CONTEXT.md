# Test: Version drift between the two plugin manifests

Plant breakage: set plugin/.codex-plugin/plugin.json version to "0.2.9" while plugin/.claude-plugin/plugin.json keeps the real version. Both hosts install the same plugin/ dir, so the manifests must agree — drift means one host's users get a payload labelled as a different release.

Expected: validate.sh exits 1, error output contains "manifest drift: .codex-plugin version". The expect string deliberately omits the concrete version numbers so routine version bumps don't have to touch this fixture (the planted 0.2.9 mismatches any future real version except 0.2.9 itself).
