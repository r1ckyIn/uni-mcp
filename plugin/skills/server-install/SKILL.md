---
name: server-install
description: This skill should be used when the user asks to install, set up, or connect the canvas-ed-mcp course server — "install the course server", "set up canvas-ed-mcp", "connect my Canvas / Ed" — or pastes a setup prompt that points at this skill, or needs to store, refresh, or replace a Canvas or Ed API token ("my Canvas token expired"), or has the uni-mcp plugin installed but the canvas-ed-mcp tools are missing from the session. Covers cloning the server, installing dependencies, walking the user to their tokens, storing tokens in the macOS keychain (on Windows, environment variables), registering the server with Claude Code or Codex / ChatGPT desktop, and verifying read-only connectivity.
---

# Server Install

Install and connect [canvas-ed-mcp](https://github.com/r1ckyIn/canvas-ed-mcp), the MCP server behind uni-mcp's Canvas / Ed / Gradescope tools. The user may know nothing about terminals: run every command for them, narrate each step in plain words, and ask for exactly one thing at a time. The flow is idempotent — on a machine where parts already exist, each step detects that and moves on, so rerunning after a failure or for a token refresh is always safe.

The steps below are the macOS path. On Windows, follow the same sequence with the substitutions in [Windows fallback](#windows-fallback). The server currently targets the University of Sydney Canvas instance; configurability for other universities is tracked at <https://github.com/r1ckyIn/uni-mcp/issues/8>.

## Credential rules

These rules govern every step that touches a token or any other stored credential (the Gradescope email and password included):

- A credential's only persistent copy lives in the macOS keychain (Windows: user environment variables). Keep it out of every file — no `.env`, no config value, no note, no log.
- **No-repeat rule:** the `security add-generic-password` call that stores a pasted value is that value's last appearance. From then on say "your Canvas token" / "your Ed token", and let commands that need the value read it from the keychain via `$(security find-generic-password ...)` substitution — the value itself never appears in a later command, output, or message.
- When asking for a token, warn the user first: **anyone holding this token can read your courses and act as you — never send it to anyone else.** Add the recovery facts: a Sydney Canvas token expires within 90 days (it will need the [refresh flow](#token-refresh) then), and both tokens can be revoked and regenerated at any time — a mistyped or leaked token is fixed by generating a new one.

## Step 1 — Preflight

Check the tools the install needs (`;` not `&&`, so both report even when the first is missing):

```bash
git --version; python3 --version
```

Require Python 3.10+. On macOS, a missing `git` is fixed by `xcode-select --install` (an Apple dialog opens; tell the user to click Install and say when it finishes). For `python3` missing or older than 3.10 — the Apple Command Line Tools still ship 3.9 — have the user run the macOS universal installer from <https://www.python.org/downloads/> (a normal click-through .pkg), then rerun the check. Done when both commands print versions and the Python version is 3.10 or newer.

## Step 2 — Clone the server

The agreed location is `~/.uni-mcp/canvas-ed-mcp`:

```bash
[ -d "$HOME/.uni-mcp/canvas-ed-mcp/.git" ] || git clone https://github.com/r1ckyIn/canvas-ed-mcp "$HOME/.uni-mcp/canvas-ed-mcp"
```

An existing clone is left alone — update it (`git -C "$HOME/.uni-mcp/canvas-ed-mcp" pull --ff-only`) only when the user explicitly wants the latest server version, so diagnostic reruns and token refreshes stay offline-safe.

## Step 3 — Install dependencies

Skip this step when the environment already checks out:

```bash
"$HOME/.uni-mcp/canvas-ed-mcp/.venv/bin/python" -c "import mcp, httpx, pydantic, bs4, gradescopeapi"
```

Exit 0 → move on. Otherwise create a virtual environment inside the clone — never the system Python (Homebrew/system installs reject `pip install` outside a venv):

```bash
python3 -m venv "$HOME/.uni-mcp/canvas-ed-mcp/.venv" && "$HOME/.uni-mcp/canvas-ed-mcp/.venv/bin/pip" install -r "$HOME/.uni-mcp/canvas-ed-mcp/requirements.txt"
```

Done when the import check above exits cleanly. If it still fails — typically a venv built by an older Python before an upgrade — delete `"$HOME/.uni-mcp/canvas-ed-mcp/.venv"` and redo this step.

## Step 4 — Collect the tokens

Handle one service at a time: check, walk, store, verify — then the next service.

First find out which tokens are already stored and still alive. Use the same smoke tests as after storing, so an entry that exists but has expired fails here rather than at the very end:

```bash
curl -sf -o /dev/null -H "Authorization: Bearer $(security find-generic-password -s uni-mcp-canvas -w 2>/dev/null)" "https://canvas.sydney.edu.au/api/v1/users/self" && echo canvas-ok
curl -sf -o /dev/null -H "Authorization: Bearer $(security find-generic-password -s uni-mcp-ed -w 2>/dev/null)" "https://edstem.org/api/user" && echo ed-ok
```

A service that prints `-ok` is done — skip it unless the user is here to replace that token. For each other service, give the warning from [Credential rules](#credential-rules), then the walkthrough:

**Canvas token** — tell the user: open Canvas in the browser → click **Account** (left sidebar) → **Settings** → scroll to the bottom to **Approved Integrations** → click **+ New Access Token** → purpose can be anything (e.g. "uni-mcp"), leave the expiry as offered → **Generate Token** → copy the long string now, it is shown only this once → paste it here in the chat.

**Ed token** — tell the user: search the web for "ed api" to reach the edstem.org API tokens settings page (for the University of Sydney that is <https://edstem.org/au/settings/api-tokens>) → it asks for a region first: pick the one the university belongs to, then log in → on **API Tokens**, create a new token → copy it now, it is shown only this once → paste it here in the chat.

## Step 5 — Store and verify each token

When a token is pasted, trim surrounding whitespace and store it (`-U` updates an existing entry in place):

```bash
security add-generic-password -U -s uni-mcp-canvas -w '<pasted Canvas token>'
```

(Keychain entries deliberately carry no `-a` account: the login keychain is per-user already, and account-free entries keep working under GUI-launched hosts whose environment has no `USER` variable.)

From this point apply the no-repeat rule. Prove the stored token works by rerunning that service's smoke test from [Step 4](#step-4--collect-the-tokens), dropping `-o /dev/null` so the JSON confirms the account out loud — e.g. "Canvas says you're \<name\>". For Ed, the same pair of commands with `-s uni-mcp-ed` and `https://edstem.org/api/user`. An authentication failure means the token was mistyped or already expired: have the user generate a fresh one (walkthrough again) and store it over the old entry. Done when every collected service passes its smoke test.

**Optional — Gradescope.** The Gradescope tools need the user's Gradescope email and password (university SSO accounts first set a native password via the "forgot password" flow on gradescope.com). Offer it; if the user declines, move on — it can be added any time later with no re-registration. The [credential rules](#credential-rules) apply to these two values unchanged, no-repeat rule included:

```bash
security add-generic-password -U -s uni-mcp-gradescope-email -w '<email>'
security add-generic-password -U -s uni-mcp-gradescope-password -w '<password>'
```

There is no pre-restart smoke test for Gradescope — confirm it in [Step 7](#step-7--verify-end-to-end) by also calling `gradescope_list_courses`.

## Step 6 — Register the MCP server

The launch command reads every credential from the keychain at start-up, so the config on disk contains no secret. One wrapper serves both hosts — plain POSIX shell, launched with `/bin/sh` so no user shell start-up file (`.zshenv` and friends) can print into the server's stdio channel. It aborts loudly when a required keychain read comes back empty (the host then shows a connection error instead of 49 silently broken tools), and it starts the server from `$HOME` so the download tools save to a predictable, writable place:

```text
CANVAS_API_TOKEN="$(security find-generic-password -s uni-mcp-canvas -w)"; ED_API_TOKEN="$(security find-generic-password -s uni-mcp-ed -w)"; [ -n "$CANVAS_API_TOKEN" ] && [ -n "$ED_API_TOKEN" ] || { echo "uni-mcp: keychain read failed" >&2; exit 1; }; GRADESCOPE_EMAIL="$(security find-generic-password -s uni-mcp-gradescope-email -w 2>/dev/null || true)"; GRADESCOPE_PASSWORD="$(security find-generic-password -s uni-mcp-gradescope-password -w 2>/dev/null || true)"; export CANVAS_API_TOKEN ED_API_TOKEN GRADESCOPE_EMAIL GRADESCOPE_PASSWORD; cd "$HOME" && exec "$HOME/.uni-mcp/canvas-ed-mcp/.venv/bin/python" "$HOME/.uni-mcp/canvas-ed-mcp/canvas_ed_mcp.py"
```

Register for the current host, substituting the wrapper above for `<wrapper>`. Each command removes any previous entry first (harmless when none exists), so reruns always end with exactly one registration:

- **Claude Code:**

  ```bash
  claude mcp remove canvas-ed-mcp 2>/dev/null; claude mcp add --scope user canvas-ed-mcp -- /bin/sh -c '<wrapper>'
  ```

- **Codex / ChatGPT desktop** (one registration covers both — the desktop Codex view shares `~/.codex/config.toml`):

  ```bash
  codex mcp remove canvas-ed-mcp 2>/dev/null; codex mcp add canvas-ed-mcp -- /bin/sh -c '<wrapper>'
  ```

  If that subcommand is unavailable, edit `~/.codex/config.toml` directly: delete any existing `[mcp_servers.canvas-ed-mcp]` table (a duplicated table name makes the whole file invalid TOML), append the block below, then confirm the file still parses — `codex mcp list` reads it, or `python3 -c "import tomllib; tomllib.load(open('$HOME/.codex/config.toml','rb'))"`. Keep the wrapper in a single-quoted TOML literal string — the wrapper's own double quotes would terminate a double-quoted TOML string:

  ```toml
  [mcp_servers.canvas-ed-mcp]
  command = "/bin/sh"
  args = ["-c", '<wrapper>']
  ```

Registration only changes config: the tools appear after the next session starts.

## Step 7 — Verify end to end

Tell the user to start a fresh session (Claude Code: exit and reopen; Codex / ChatGPT desktop: quit the app fully and reopen) and ask something like "list my courses". The fresh session's assistant proves connectivity with two read-only calls — `canvas_list_courses` and `ed_get_user_info` (plus `gradescope_list_courses` when Gradescope was configured); real user data coming back is the pass bar. Then offer the next step: the [setup skill](../setup/SKILL.md) turns a folder into their course workspace — course maps, an assessment table, the ground rules both hosts follow — and until it has run, the assistant answers course questions from the tools alone, with nothing remembered between sessions. A user who would rather just ask something now can start from the course-playbook skill's example questions ("when is my next assignment due?"). If the tools are absent from the session, see [Tools missing from the session](#tools-missing-from-the-session).

## Token refresh

When a token expires or was regenerated: run only [Step 4](#step-4--collect-the-tokens) and [Step 5](#step-5--store-and-verify-each-token) for that one service — `-U` overwrites the entry in place — then have the user restart the session. The wrapper re-reads the keychain at start-up; registration stays untouched.

## Tools missing from the session

When the plugin is installed but the canvas-ed-mcp tools are absent, the cause is almost always registration or a missed restart, never the server files. Check `claude mcp list` / `codex mcp list`: entry missing → redo [Step 6](#step-6--register-the-mcp-server) only; entry present → have the user fully quit and reopen the host. Fall back to the full flow from [Step 1](#step-1--preflight) only when `~/.uni-mcp/canvas-ed-mcp` itself is gone or broken.

## Windows fallback

Same sequence, with these substitutions (protection level is lower than the keychain: values sit in the per-user registry, readable by any process running as the user — say so honestly if asked):

- Clone to `%USERPROFILE%\.uni-mcp\canvas-ed-mcp`; venv commands are `py -m venv .venv` and `.venv\Scripts\pip install -r requirements.txt`.
- Verify each pasted token before storing it: run the Step 4 `curl` with the pasted value in the `Authorization` header (`curl.exe` ships with Windows 10+). Storing below stays the value's last appearance under the no-repeat rule.
- Store tokens as user environment variables instead of keychain entries: `setx CANVAS_API_TOKEN "<pasted token>"`, `setx ED_API_TOKEN "<pasted token>"` (optional: `GRADESCOPE_EMAIL`, `GRADESCOPE_PASSWORD`). `setx` reaches only processes started after it: a desktop host must be fully quit and reopened, and a CLI host needs every terminal window closed and a new one opened — terminal tabs share one long-lived process, so a new tab (or `exit` + relaunch in the same window) still carries the old environment.
- Register without a wrapper — the server inherits the variables. Substitute the user's real home directory for `<home>` (print it first: `echo %USERPROFILE%` in cmd, `$env:USERPROFILE` in PowerShell) so the stored config carries an absolute path, never the literal `%USERPROFILE%` string:

  ```text
  claude mcp add --scope user canvas-ed-mcp -- "<home>\.uni-mcp\canvas-ed-mcp\.venv\Scripts\python.exe" "<home>\.uni-mcp\canvas-ed-mcp\canvas_ed_mcp.py"
  ```

  (Codex: `codex mcp add canvas-ed-mcp -- <same two paths>`. Same as on macOS, run the matching `mcp remove` first so reruns never stack duplicates.)
- Token refresh = the verify-then-`setx` pair above with the new value, then fully restart the host app.
