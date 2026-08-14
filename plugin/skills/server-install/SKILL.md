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
- When asking for a token, warn the user first: **anyone holding this token can read your courses and act as you — never send it to anyone else.** Add the recovery facts: a Sydney Canvas token expires after at most 90 days, both tokens can be revoked and regenerated at any time, and each is shown only once at creation — so a mistyped or leaked token is fixed by generating a new one, and in roughly 90 days the Canvas token will need this refresh flow again.

## Step 1 — Preflight

Check the tools the install needs:

```bash
git --version && python3 --version
```

Require Python 3.10+. On macOS, a missing `git` is fixed by `xcode-select --install` (an Apple dialog opens; tell the user to click Install and say when it finishes). For `python3` missing or older than 3.10 — the Apple Command Line Tools still ship 3.9 — have the user run the macOS universal installer from <https://www.python.org/downloads/> (a normal click-through .pkg), then rerun the check. Done when both commands print versions and the Python version is 3.10 or newer.

## Step 2 — Clone the server

The agreed location is `~/.uni-mcp/canvas-ed-mcp`:

```bash
if [ -d "$HOME/.uni-mcp/canvas-ed-mcp/.git" ]; then
  git -C "$HOME/.uni-mcp/canvas-ed-mcp" pull --ff-only
else
  git clone https://github.com/r1ckyIn/canvas-ed-mcp "$HOME/.uni-mcp/canvas-ed-mcp"
fi
```

## Step 3 — Install dependencies

Use a virtual environment inside the clone — never the system Python (Homebrew/system installs reject `pip install` outside a venv):

```bash
python3 -m venv "$HOME/.uni-mcp/canvas-ed-mcp/.venv" && "$HOME/.uni-mcp/canvas-ed-mcp/.venv/bin/pip" install -r "$HOME/.uni-mcp/canvas-ed-mcp/requirements.txt"
```

Done when this import check exits cleanly:

```bash
"$HOME/.uni-mcp/canvas-ed-mcp/.venv/bin/python" -c "import mcp, httpx, pydantic, bs4, gradescopeapi"
```

## Step 4 — Collect the tokens

Handle one service at a time: check, walk, store, verify — then the next service.

First check what is already stored:

```bash
security find-generic-password -a "$USER" -s uni-mcp-canvas >/dev/null 2>&1 && echo canvas-stored
security find-generic-password -a "$USER" -s uni-mcp-ed >/dev/null 2>&1 && echo ed-stored
```

A stored token is kept unless the user is here to replace it (expired, regenerated). For each missing one, give the warning from [Credential rules](#credential-rules), then the walkthrough:

**Canvas token** — tell the user: open Canvas in the browser → click **Account** (left sidebar) → **Settings** → scroll to the bottom to **Approved Integrations** → click **+ New Access Token** → purpose can be anything (e.g. "uni-mcp"), leave the expiry as offered (Sydney caps it at 90 days) → **Generate Token** → copy the long string now, it is shown only this once → paste it here in the chat.

**Ed token** — tell the user: search the web for "ed api" to reach the edstem.org API tokens settings page → it asks for a region first: pick the one the university belongs to, then log in → on **API Tokens**, create a new token → copy it now, it is shown only this once → paste it here in the chat.

## Step 5 — Store and verify each token

When a token is pasted, trim surrounding whitespace and store it (`-U` updates an existing entry, which is exactly the 90-day refresh path):

```bash
security add-generic-password -U -a "$USER" -s uni-mcp-canvas -w '<pasted Canvas token>'
security add-generic-password -U -a "$USER" -s uni-mcp-ed -w '<pasted Ed token>'
```

From this point apply the no-repeat rule. Smoke-test each token straight from the keychain:

```bash
curl -sf -H "Authorization: Bearer $(security find-generic-password -a "$USER" -s uni-mcp-canvas -w)" "https://canvas.sydney.edu.au/api/v1/users/self"
curl -sf -H "Authorization: Bearer $(security find-generic-password -a "$USER" -s uni-mcp-ed -w)" "https://edstem.org/api/user"
```

Each should return JSON naming the user — confirm out loud, e.g. "Canvas says you're \<name\>". An authentication failure means the token was mistyped or already expired: have the user generate a fresh one (the walkthrough again) and store it over the old entry. Done when both smoke tests pass.

**Optional — Gradescope.** The Gradescope tools need the user's Gradescope email and password (university SSO accounts first set a native password via the "forgot password" flow on gradescope.com). Offer it; if the user declines, move on — it can be added any time later with no re-registration. The [credential rules](#credential-rules) apply to these two values unchanged, no-repeat rule included:

```bash
security add-generic-password -U -a "$USER" -s uni-mcp-gradescope-email -w '<email>'
security add-generic-password -U -a "$USER" -s uni-mcp-gradescope-password -w '<password>'
```

## Step 6 — Register the MCP server

The launch command reads every credential from the keychain at start-up, so the config on disk contains no secret. One wrapper serves both hosts:

```text
CANVAS_API_TOKEN="$(security find-generic-password -a "$USER" -s uni-mcp-canvas -w)" ED_API_TOKEN="$(security find-generic-password -a "$USER" -s uni-mcp-ed -w)" GRADESCOPE_EMAIL="$(security find-generic-password -a "$USER" -s uni-mcp-gradescope-email -w 2>/dev/null || true)" GRADESCOPE_PASSWORD="$(security find-generic-password -a "$USER" -s uni-mcp-gradescope-password -w 2>/dev/null || true)" exec "$HOME/.uni-mcp/canvas-ed-mcp/.venv/bin/python" "$HOME/.uni-mcp/canvas-ed-mcp/canvas_ed_mcp.py"
```

First make the registration a clean add — check for an existing one with `claude mcp list` / `codex mcp list` (for a hand-edited `~/.codex/config.toml`, also grep it for `mcp_servers.canvas-ed-mcp`), and remove any found entry (`claude mcp remove canvas-ed-mcp` / `codex mcp remove canvas-ed-mcp`, or delete the TOML table) before adding. This keeps the flow rerunnable: appending a second `[mcp_servers.canvas-ed-mcp]` table would make the whole TOML file invalid.

Register it for the current host, substituting the wrapper above for `<wrapper>`:

- **Claude Code:**

  ```bash
  claude mcp add --scope user canvas-ed-mcp -- /bin/zsh -c '<wrapper>'
  ```

- **Codex / ChatGPT desktop** (one registration covers both — the desktop Codex view shares `~/.codex/config.toml`):

  ```bash
  codex mcp add canvas-ed-mcp -- /bin/zsh -c '<wrapper>'
  ```

  If that subcommand is unavailable, append to `~/.codex/config.toml` directly (args array, wrapper as one string):

  ```toml
  [mcp_servers.canvas-ed-mcp]
  command = "/bin/zsh"
  args = ["-c", "<wrapper>"]
  ```

Registration only changes config: the tools appear after the next session starts.

## Step 7 — Verify end to end

Tell the user to start a fresh session (Claude Code: exit and reopen; Codex / ChatGPT desktop: quit the app fully and reopen) and ask something like "list my courses". The fresh session's assistant proves connectivity with two read-only calls — `canvas_list_courses` and `ed_get_user_info`; both returning the user's real data is the pass bar. Then point at the course-playbook skill's example questions ("when is my next assignment due?"). If the tools are absent from the session, the host was not restarted or registration failed — recheck with `claude mcp list` / `codex mcp list`.

## Token refresh

When a token expires (Canvas: at most 90 days) or was regenerated: run only [Step 4](#step-4--collect-the-tokens) and [Step 5](#step-5--store-and-verify-each-token) for that one service — `-U` overwrites the entry in place — then have the user restart the session. The wrapper re-reads the keychain at start-up; registration stays untouched.

## Windows fallback

Same sequence, with these substitutions (protection level is lower than the keychain: values sit in the per-user registry, readable by any process running as the user — say so honestly if asked):

- Clone to `%USERPROFILE%\.uni-mcp\canvas-ed-mcp`; venv commands are `py -m venv .venv` and `.venv\Scripts\pip install -r requirements.txt`.
- Store tokens as user environment variables instead of keychain entries: `setx CANVAS_API_TOKEN "<pasted token>"`, `setx ED_API_TOKEN "<pasted token>"` (optional: `GRADESCOPE_EMAIL`, `GRADESCOPE_PASSWORD`). The no-repeat rule applies unchanged. `setx` affects only new processes: the host app must be fully quit and reopened before Step 7.
- Register without a wrapper — the server inherits the variables. Substitute the user's real home directory for `<home>` (print it first: `echo %USERPROFILE%` in cmd, `$env:USERPROFILE` in PowerShell) so the stored config carries an absolute path, never the literal `%USERPROFILE%` string:

  ```text
  claude mcp add --scope user canvas-ed-mcp -- "<home>\.uni-mcp\canvas-ed-mcp\.venv\Scripts\python.exe" "<home>\.uni-mcp\canvas-ed-mcp\canvas_ed_mcp.py"
  ```

  (Codex: `codex mcp add canvas-ed-mcp -- <same two paths>`.)
- Token refresh = rerun `setx` with the new value, then fully restart the host app.
