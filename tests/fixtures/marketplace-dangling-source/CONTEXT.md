# Test: Dangling marketplace source

Plant breakage: point plugins[0].source in .claude-plugin/marketplace.json at "./does-not-exist" while plugin/ stays put. `claude plugin validate . --strict` accepts a dangling source, so this is only caught because validate.sh derives check 2's target path from the marketplace source field.

Expected: validate.sh exits 1, error output names the dangling path (does-not-exist)
