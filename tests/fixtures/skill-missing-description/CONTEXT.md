# Test: SKILL.md missing description (skills norms)

Plant breakage: replace plugin/skills/install-check/SKILL.md with one whose frontmatter has no description. This red-proves that check 2 walks the plugin's skills directory (not just the manifest JSON) and that --strict promotes the skills-norm warning to a failure.

Expected: validate.sh exits 1, error output includes "No description in frontmatter"
