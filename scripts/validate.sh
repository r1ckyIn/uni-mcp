#!/bin/bash
# uni-mcp single static-validation entry point (issue #3).
# Validates the repo at the current working directory; run from the repo root.
# The check list lives in docs/validation.md — future tickets extend this file
# rather than adding a second entry point.
#
# Requirements: `claude` on PATH, plus `npm ci` run once (lint/link tools are
# pinned in package.json and resolved from node_modules — never silently skipped).
#
# Deliberately no `set -e`: every check is guarded and failures accumulate in
# EXIT_CODE so one red check never hides the others. New checks must follow
# the same `if ! ...; then EXIT_CODE=1; fi` shape.

EXIT_CODE=0

if [ ! -d node_modules ]; then
  echo "node_modules missing — run 'npm ci' first; the markdown and link checks need it." >&2
  exit 1
fi

# Check 1: Marketplace manifest structure (claude plugin validate)
# Pointing at the repo root validates .claude-plugin/marketplace.json.
echo "Checking marketplace manifest..." >&2
if ! claude plugin validate . --strict 2>&1; then
  EXIT_CODE=1
fi

# Check 2: Plugin manifest structure + skills norms (claude plugin validate --strict)
# The plugin root is wherever the marketplace entry's `source` points (ADR-0002:
# plugin/). Read it from marketplace.json instead of hard-coding it, so this
# check can never drift from what users actually install — `claude plugin
# validate . --strict` accepts a dangling source, so the drift would otherwise
# be invisible; here it fails with "File not found". Pointing at plugin.json
# validates the manifest plus the plugin root, including skills/*/SKILL.md
# frontmatter. --strict turns warnings (missing descriptions, unrecognized
# fields) into failures — that is what enforces the skills norms, so strict
# must run on the real repo, not only on dist builds. No whitelist: the plugin
# root carries no dev files (the point of ADR-0002), so any warning here is a
# real regression.
echo "Checking plugin manifest + skills norms (strict mode)..." >&2
plugin_source="$(node -p 'JSON.parse(require("fs").readFileSync(".claude-plugin/marketplace.json","utf8")).plugins[0].source' 2>/dev/null)"
if [ -z "$plugin_source" ] || [ "$plugin_source" = "undefined" ]; then
  echo "Cannot read plugins[0].source from .claude-plugin/marketplace.json" >&2
  EXIT_CODE=1
elif ! claude plugin validate "$plugin_source/.claude-plugin/plugin.json" --strict 2>&1; then
  EXIT_CODE=1
fi

# Check 3: Markdown lint (markdownlint-cli2, pinned in package.json).
# Globs, ignores (tests/fixtures are intentionally broken) and rule tweaks live
# in .markdownlint-cli2.jsonc.
echo "Checking markdown formatting..." >&2
if ! npx --no-install markdownlint-cli2 2>&1; then
  EXIT_CODE=1
fi

# Check 4: Dead links — repo-internal relative links and heading anchors
# (remark-validate-links, pinned in package.json, fully offline). External URLs
# are deliberately out of scope to keep CI deterministic; see docs/validation.md
# for the extension path. Ignores live in .remarkignore.
echo "Checking relative links..." >&2
if ! npx --no-install remark . --use remark-validate-links --frail --quiet 2>&1; then
  EXIT_CODE=1
fi

# Check 5: Codex-side manifests (issue #4) — .agents/plugins/marketplace.json
# plus .codex-plugin/plugin.json under each entry's source dir, including
# name/version sync with the Claude manifest. Static mirror of the codex
# ingestion schema (codex CLI validates nothing at install time — see the
# script header for the 2026-08-13 test evidence and the schema source).
echo "Checking codex manifests..." >&2
if ! node scripts/check-codex-manifests.mjs 2>&1; then
  EXIT_CODE=1
fi

exit $EXIT_CODE
