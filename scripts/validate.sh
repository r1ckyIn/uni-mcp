#!/bin/bash
set -e

EXIT_CODE=0

# Check 1: Manifest structure (claude plugin validate)
echo "Checking manifest structure..." >&2
if ! claude plugin validate ./.claude-plugin/plugin.json 2>&1; then
  EXIT_CODE=1
fi

# Check 2: Skills norms (claude plugin validate --strict)
echo "Checking skills norms (strict mode)..." >&2
if ! claude plugin validate ./.claude-plugin/plugin.json --strict 2>&1; then
  EXIT_CODE=1
fi

# Check 3: Markdown lint (markdownlint-cli2)
if command -v markdownlint-cli2 &> /dev/null; then
  echo "Checking markdown formatting..." >&2
  if ! markdownlint-cli2 "**/*.md" 2>&1; then
    EXIT_CODE=1
  fi
fi

# Check 4: Dead relative links (markdown-link-check)
if command -v markdown-link-check &> /dev/null; then
  echo "Checking relative links..." >&2
  for md_file in $(find . -name "*.md" -type f); do
    # Skip files in .git and node_modules
    [[ "$md_file" =~ (\.git|node_modules) ]] && continue
    if output=$(markdown-link-check "$md_file" 2>&1); then
      if echo "$output" | grep -q "✖"; then
        echo "✖ Found broken links in $md_file" >&2
        echo "$output" >&2
        EXIT_CODE=1
      fi
    else
      EXIT_CODE=1
    fi
  done
fi

exit $EXIT_CODE
