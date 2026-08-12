#!/bin/bash
# uni-mcp single static-validation entry point (issue #3).
# Validates the repo at the current working directory; run from the repo root.
# The check list lives in docs/validation.md — future tickets extend this file
# rather than adding a second entry point.
#
# Requirements: `claude` on PATH, plus `npm ci` run once (lint/link tools are
# pinned in package.json and resolved from node_modules — never silently skipped).
set -e

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
# Pointing at plugin.json validates the manifest plus the plugin directory,
# including skills/*/SKILL.md frontmatter. --strict turns warnings (missing
# descriptions, unrecognized fields) into failures — that is what enforces the
# skills norms, so strict must run on the real repo, not only on dist builds.
#
# One warning is accepted: the repo root doubles as the plugin root (ADR-0001),
# so the contributor-facing CLAUDE.md sits at the plugin root and validate
# flags it; the runtime tolerates it. Any other warning or error still fails,
# including in fixture copies — CLAUDE.md is NOT deleted from test copies, so
# this whitelist is exercised by every fixture run.
echo "Checking plugin manifest + skills norms (strict mode)..." >&2
plugin_status=0
plugin_out="$(claude plugin validate ./.claude-plugin/plugin.json --strict 2>&1)" || plugin_status=$?
printf '%s\n' "$plugin_out"
if [ "$plugin_status" -ne 0 ]; then
  complaints="$(printf '%s\n' "$plugin_out" | grep '❯' || true)"
  unexpected="$(printf '%s\n' "$complaints" | grep -v 'CLAUDE.md at the plugin root' | grep -v '^$' || true)"
  if [ -z "$complaints" ] || [ -n "$unexpected" ]; then
    EXIT_CODE=1
  fi
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

exit $EXIT_CODE
