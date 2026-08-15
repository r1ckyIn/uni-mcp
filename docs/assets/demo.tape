# VHS tape for docs/assets/demo.gif — the README hero demo.
# Regenerate with: vhs docs/assets/demo.tape   (run from the repo root; needs vhs + network)
# It runs the REAL install commands against throwaway config dirs; long network
# waits are hidden from the recording, output is genuine.

Output docs/assets/demo.gif

Require claude
Require codex

Set Shell "bash"
Set FontSize 20
Set Width 1100
Set Height 650
Set Padding 24
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms

Hide
Type "rm -rf /tmp/vhs-uni-claude /tmp/vhs-uni-codex && mkdir -p /tmp/vhs-uni-claude /tmp/vhs-uni-codex && export CLAUDE_CONFIG_DIR=/tmp/vhs-uni-claude CODEX_HOME=/tmp/vhs-uni-codex && clear"
Enter
Show

Type "# Install the uni-mcp plugin — Claude Code"
Enter
Sleep 500ms
Type "claude plugin marketplace add r1ckyIn/uni-mcp"
Enter
Hide
Wait+Screen@180s /Successfully added marketplace/
Show
Sleep 1.5s
Type "claude plugin install uni-mcp@uni-mcp"
Enter
Hide
Wait+Screen@180s /Successfully installed plugin/
Show
Sleep 2s

Type "# Same plugin, same skills — Codex CLI / ChatGPT desktop"
Enter
Sleep 500ms
Type "codex plugin marketplace add r1ckyIn/uni-mcp"
Enter
Hide
Wait+Screen@180s /Added marketplace/
Show
Sleep 1.5s
Type "codex plugin add uni-mcp@uni-mcp"
Enter
Hide
Wait+Screen@180s /Added plugin/
Show
Sleep 4s
