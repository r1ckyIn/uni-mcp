# Test: SKILL.md missing name (codex skills norms)

Plant breakage: replace plugin/skills/install-check/SKILL.md with one whose frontmatter has no name. Claude's `plugin validate --strict` passes this file (tested during #7), so only the codex-side mirror of validate_plugin.py can catch it before the skill reaches ChatGPT desktop, where ingestion rejects it. The description half of the same authority rule is covered by strict mode (fixture skill-missing-description); this red-proves the name half.

Expected: validate.sh exits 1, error output contains the codex rule wording (frontmatter field `name` must be non-empty).
