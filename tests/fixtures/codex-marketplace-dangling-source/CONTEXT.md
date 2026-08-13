# Test: Dangling codex marketplace source

Plant breakage: point plugins[0].source.path in .agents/plugins/marketplace.json at "./does-not-exist" while plugin/ stays put. Codex CLI accepts a dangling source silently (it validates nothing at add/install time), so only check 5's own path resolution catches this.

Expected: validate.sh exits 1, error output names the dangling path (does-not-exist)
