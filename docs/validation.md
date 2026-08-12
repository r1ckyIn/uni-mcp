# Repo validation

`scripts/validate.sh` is the single static-validation entry point for this repo (issue #3). Run it from the repo root; it exits non-zero if any check fails. GitHub Actions runs it on every push and pull request (`.github/workflows/validate.yml`), followed by `scripts/test-validate.sh`, which proves each check can actually turn red.

```sh
scripts/validate.sh        # all checks against this repo — must be green
scripts/test-validate.sh   # fixture tests — every fixture must make validate.sh fail
```

Requirements: `claude` (Claude Code CLI) and `node`/`npm` on PATH, plus a one-time `npm ci` (the lint/link tools are pinned in `package.json` — dev-only, nothing ships with the plugin). `validate.sh` fails loudly if `node_modules` is missing; no check is ever silently skipped.

## Checks

| # | What | Tool | Config |
| - | ---- | ---- | ------ |
| 1 | Marketplace manifest structure (`.claude-plugin/marketplace.json`) | `claude plugin validate . --strict` | — |
| 2 | Plugin manifest structure + skills norms (`.claude-plugin/plugin.json`, `skills/*/SKILL.md` frontmatter) | `claude plugin validate ./.claude-plugin/plugin.json --strict` | one accepted warning, see below |
| 3 | Markdown lint | `markdownlint-cli2` (pinned via npx) | `.markdownlint-cli2.jsonc` |
| 4 | Dead links: repo-internal relative links and heading anchors | `remark-validate-links` (pinned via npx) | `.remarkignore` |

### Accepted warning in check 2

`--strict` flags `CLAUDE.md at the plugin root is not loaded as project context`. The repo root doubles as the plugin root (ADR-0001), so the contributor-facing CLAUDE.md unavoidably sits at the plugin root; the runtime tolerates it. `validate.sh` whitelists exactly that warning line and fails on any other warning or error. If the CLI ever rewords the warning, the check goes red and the whitelist pattern needs updating — that is the safe failure direction.

### Deliberate scope limits

- **External URLs are not link-checked.** Check 4 is fully offline so CI stays deterministic; live-HTTP checking of `https://` links is flaky (rate limits, bot walls). If external checking is ever wanted, add a separate tool such as lychee as a new check — do not weaken check 4.
- Markdown line length (MD013) is off: the docs are Chinese prose.

## Fixtures — proving the checks work

Each check type has at least one breakage fixture under `tests/fixtures/<case>/`:

- The fixture directory mirrors the repo layout; `scripts/test-validate.sh` copies the repo to a temp dir, overlays the fixture's files on top, runs `scripts/validate.sh` there, and requires a non-zero exit **and** output containing the fixture's `expect.txt` string (matched literally, never as a regex), so the error provably points at the planted problem. A missing or empty `expect.txt` fails the fixture.
- `CONTEXT.md` and `expect.txt` inside a fixture are metadata, not payload — they are not overlaid.

## Extending (later tickets)

New structure (for example the Codex-side manifest) joins this command instead of getting a second entry point:

1. Add the check as a new block in `scripts/validate.sh` (always-run — no `command -v` guards that silently skip; pin tool versions).
2. Add at least one breakage fixture: `tests/fixtures/<case>/` with the planted files, an `expect.txt` holding the literal substring the failing output must contain, and a `CONTEXT.md` describing the breakage.
3. Run `scripts/test-validate.sh` (fixture must red) and `scripts/validate.sh` (repo must stay green), then document the check in the table above.
