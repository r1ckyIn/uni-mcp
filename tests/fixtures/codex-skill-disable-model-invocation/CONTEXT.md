# Test: Codex-illegal skill frontmatter in the shared skills dir

Plant breakage: add `disable-model-invocation: true` to plugin/skills/install-check/SKILL.md frontmatter. The skills dir is shared by both hosts (ADR-0003), and this key is legal-looking to the Claude-side toolchain while the codex ingestion contract requires it to be absent or false — exactly the class of drift one shared SKILL.md set can pick up.

Expected: validate.sh exits 1, error output contains the codex rule wording (frontmatter field `disable-model-invocation` must be false).
