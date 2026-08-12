#!/bin/bash
set -o pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="${REPO_ROOT}/tests/fixtures"
FAILED=0

# Fail loud up front, matching validate.sh's own convention — a dangling
# node_modules symlink inside the copies would otherwise fail every fixture
# with a confusing "output mismatch".
if [ ! -d "$REPO_ROOT/node_modules" ]; then
  echo "node_modules missing — run 'npm ci' first; see docs/validation.md." >&2
  exit 1
fi

# Run each fixture test
for fixture_path in "$TEST_DIR"/*; do
  fixture_name=$(basename "$fixture_path")

  # Skip non-directories
  [ -d "$fixture_path" ] || continue

  echo "Testing fixture: $fixture_name"

  # Every fixture must state what the failing output should contain; an empty
  # pattern would match anything and pass vacuously.
  expect="$(cat "$fixture_path/expect.txt" 2>/dev/null || true)"
  if [ -z "$expect" ]; then
    echo "✗ FAILED (missing or empty expect.txt): $fixture_name"
    FAILED=$((FAILED + 1))
    continue
  fi

  # Create tmp copy of repo — kept faithful to the real repo, dev files and
  # all: strict validation must stay green with them present, because they
  # live outside the plugin root (plugin/, ADR-0002). node_modules is
  # symlinked instead of copied: the lint tools only read it, and copying it
  # per fixture is slow.
  # Each step is guarded: if the copy fails, the overlay below must never run
  # with cwd still pointing at the real repo.
  work_dir=$(mktemp -d) || { echo "mktemp failed" >&2; exit 1; }
  mkdir -p "$work_dir/repo" || exit 1
  tar -C "$REPO_ROOT" --exclude node_modules -cf - . | tar -xf - -C "$work_dir/repo" \
    || { echo "repo copy failed" >&2; exit 1; }
  cd "$work_dir/repo" || exit 1
  ln -s "$REPO_ROOT/node_modules" node_modules || exit 1

  # Apply fixture overlay (copy fixture files on top of repo).
  # CONTEXT.md and expect.txt are fixture metadata, not planted breakage.
  # A failed copy must abort loudly — otherwise validate.sh runs against an
  # unbroken repo copy and the fixture fails with a misleading exit-0 report.
  # (set -o pipefail above makes the subshell's exit reach the || handler.)
  find "$fixture_path" -type f ! -name "CONTEXT.md" ! -name "expect.txt" | while read -r file; do
    rel_path="${file#$fixture_path/}"
    mkdir -p "$(dirname "$rel_path")" || exit 1
    cp "$file" "$rel_path" || exit 1
  done || { echo "fixture overlay copy failed: $fixture_name" >&2; exit 1; }

  # Run validate.sh, capture output and exit code (reset each iteration).
  exit_code=0
  output=$("$REPO_ROOT/scripts/validate.sh" 2>&1) || exit_code=$?

  # Expect a red run whose output contains the fixture's expected string
  # (matched literally, -F), proving the error points at the planted problem.
  if [ $exit_code -ne 1 ]; then
    echo "✗ FAILED (expected exit code 1, got $exit_code): $fixture_name"
    echo "  Output: $output"
    FAILED=$((FAILED + 1))
  elif grep -qFe "$expect" <<< "$output"; then
    echo "✓ PASSED: $fixture_name"
  else
    echo "✗ FAILED (output mismatch): $fixture_name"
    echo "  Expected substring: $expect"
    echo "  Actual output:"
    echo "$output"
    FAILED=$((FAILED + 1))
  fi

  cd "$REPO_ROOT" || exit 1
  rm -rf "$work_dir"
done

exit $FAILED
