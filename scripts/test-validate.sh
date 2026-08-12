#!/bin/bash

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="${REPO_ROOT}/tests/fixtures"
FAILED=0

# Run each fixture test
for fixture_path in "$TEST_DIR"/*; do
  fixture_name=$(basename "$fixture_path")

  # Skip non-directories
  [ -d "$fixture_path" ] || continue

  echo "Testing fixture: $fixture_name"

  # Create tmp copy of repo — kept faithful to the real repo (CLAUDE.md stays;
  # validate.sh's whitelist for its known plugin-root warning is part of what
  # these tests exercise). node_modules is symlinked instead of copied: the
  # lint tools only read it, and copying it per fixture is slow.
  work_dir=$(mktemp -d)

  mkdir -p "$work_dir/repo"
  tar -C "$REPO_ROOT" --exclude node_modules -cf - . | tar -xf - -C "$work_dir/repo"
  cd "$work_dir/repo"
  ln -s "$REPO_ROOT/node_modules" node_modules

  # Apply fixture overlay (copy fixture files on top of repo).
  # CONTEXT.md and expect.txt are fixture metadata, not planted breakage.
  if [ -d "$fixture_path" ]; then
    find "$fixture_path" -type f ! -name "CONTEXT.md" ! -name "expect.txt" | while read -r file; do
      rel_path="${file#$fixture_path/}"
      mkdir -p "$(dirname "$rel_path")"
      cp "$file" "$rel_path"
    done
  fi

  # Run validate.sh, capture output and exit code (reset each iteration).
  exit_code=0
  output=$("$REPO_ROOT/scripts/validate.sh" 2>&1) || exit_code=$?

  if [ $exit_code -ne 1 ]; then
    echo "✗ FAILED (expected exit code 1, got $exit_code): $fixture_name"
    echo "  Output: $output"
    FAILED=$((FAILED + 1))
  elif grep -q "$(cat "$fixture_path/expect.txt")" <<< "$output"; then
    echo "✓ PASSED: $fixture_name"
  else
    echo "✗ FAILED (output mismatch): $fixture_name"
    echo "  Expected pattern: $(cat "$fixture_path/expect.txt")"
    echo "  Actual output:"
    echo "$output"
    FAILED=$((FAILED + 1))
  fi

  cd "$REPO_ROOT"
  rm -rf "$work_dir"
done

exit $FAILED
