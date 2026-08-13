// Codex-side manifest checks (issue #4): .agents/plugins/marketplace.json at
// the repo root, plus .codex-plugin/plugin.json under every marketplace entry's
// source dir. Codex CLI validates NOTHING at `plugin marketplace add` /
// `plugin add` time (0.144.1, tested 2026-08-13: a manifest with no `version`
// installs silently into a "local" version dir) — so unlike the Claude side
// there is no host CLI to lean on, and this script mirrors the ingestion
// schema instead. Schema source: the plugin-creator system skill shipped
// inside codex-cli — scripts/validate_plugin.py is the executable authority
// for the plugin manifest + skills half; the marketplace half has NO
// executable counterpart, only the prose spec (references/plugin-json-spec.md).
// Re-check both against this script when bumping the codex CLI.
// Run from the repo root: node scripts/check-codex-manifests.mjs

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, normalize } from "node:path";

const MARKETPLACE = ".agents/plugins/marketplace.json";
const CLAUDE_MARKETPLACE = ".claude-plugin/marketplace.json";
const errors = [];

// Verbatim port of validate_plugin.py's SEMVER_RE (no leading zeros,
// dot-separated pre-release identifiers validated individually).
const SEMVER_RE = new RegExp(
  "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)" +
  "(?:-(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*))*)?" +
  "(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"
);
const HEX_COLOR_RE = /^#[0-9A-F]{6}$/i;

const MANIFEST_KEYS = new Set([
  "id", "name", "version", "description", "skills", "apps", "mcpServers",
  "interface", "author", "homepage", "repository", "license", "keywords",
]);
const INTERFACE_KEYS = new Set([
  "displayName", "shortDescription", "longDescription", "developerName",
  "category", "capabilities", "websiteURL", "privacyPolicyURL",
  "termsOfServiceURL", "brandColor", "composerIcon", "logo", "logoDark",
  "screenshots", "defaultPrompt", "default_prompt",
]);
const AUTHOR_KEYS = new Set(["name", "email", "url"]);
const INSTALLATION_VALUES = ["NOT_AVAILABLE", "AVAILABLE", "INSTALLED_BY_DEFAULT"];
const AUTHENTICATION_VALUES = ["ON_INSTALL", "ON_USE"];

const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const isDir = (p) => statSync(p, { throwIfNoEntry: false })?.isDirectory() === true;
const isFile = (p) => statSync(p, { throwIfNoEntry: false })?.isFile() === true;

function readJson(path, label) {
  if (!existsSync(path)) {
    errors.push(`${label}: missing ${path}`);
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    errors.push(`${label}: ${path} must be valid JSON`);
    return null;
  }
  if (!isObject(parsed)) {
    errors.push(`${label}: ${path} must contain a JSON object`);
    return null;
  }
  return parsed;
}

function requireString(obj, field, label) {
  const value = obj[field];
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label}: field \`${field}\` must be a non-empty string`);
    return null;
  }
  return value;
}

// null is treated as absent throughout, matching the authority's
// `manifest.get(key) is None` gates.
function optionalString(obj, field, label) {
  if (obj[field] == null) return;
  requireString(obj, field, label);
}

function optionalHttpsUrl(obj, field, label) {
  if (obj[field] == null) return;
  const value = obj[field];
  let ok = false;
  try {
    ok = new URL(value).protocol === "https:";
  } catch { /* not a URL */ }
  if (!ok) errors.push(`${label}: field \`${field}\` must be an absolute \`https://\` URL`);
}

function optionalAssetPath(sourceDir, obj, field, label) {
  if (obj[field] == null) return;
  const value = obj[field];
  if (typeof value !== "string" || !isFile(join(sourceDir, value))) {
    errors.push(`${label}: field \`${field}\` must point to a real file inside the plugin`);
  }
}

// Mirrors reject_todo_markers: no leftover scaffold placeholders anywhere in
// the manifest (plugin-creator emits exactly these).
function todoSweep(value, path, label) {
  if (typeof value === "string") {
    if (value.includes("[TODO:")) {
      errors.push(`${label}: ${path} still contains a \`[TODO: ...]\` placeholder`);
    }
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => todoSweep(v, `${path}[${i}]`, label));
  } else if (isObject(value)) {
    for (const [k, v] of Object.entries(value)) todoSweep(v, `${path}.${k}`, label);
  }
}

// The authority accepts `./skills/`, `skills`, `.//skills` etc. via Path
// normalization; contract paths must resolve to the given companion name.
const normalizeContract = (value) => normalize(value).replace(/\/+$/, "");

function checkCompanionJson(sourceDir, manifest, field, companion, label) {
  if (manifest[field] == null) return;
  const value = manifest[field];
  if (typeof value !== "string" || normalizeContract(value) !== companion) {
    errors.push(`${label}: field \`${field}\` must resolve to \`./${companion}\``);
    return;
  }
  const path = join(sourceDir, companion);
  if (!isFile(path)) {
    errors.push(`${label}: \`${companion}\` is required when its plugin.json field is present`);
    return;
  }
  readJson(path, label);
}

function checkPluginManifest(sourceDir) {
  const manifestPath = join(sourceDir, ".codex-plugin/plugin.json");
  const manifest = readJson(manifestPath, "codex plugin manifest");
  if (manifest === null) return null;
  const label = `codex plugin manifest (${manifestPath})`;

  for (const key of Object.keys(manifest)) {
    if (!MANIFEST_KEYS.has(key)) {
      errors.push(`${label}: field \`${key}\` is not accepted by plugin validation`);
    }
  }
  todoSweep(manifest, "$", label);

  optionalString(manifest, "id", label);
  const name = requireString(manifest, "name", label);
  const version = requireString(manifest, "version", label);
  if (version !== null && !SEMVER_RE.test(version)) {
    errors.push(`${label}: field \`version\` must be strict semver`);
  }
  requireString(manifest, "description", label);

  if (!isObject(manifest.author)) {
    errors.push(`${label}: field \`author\` must be an object`);
  } else {
    for (const key of Object.keys(manifest.author)) {
      if (!AUTHOR_KEYS.has(key)) {
        errors.push(`${label}: field \`author.${key}\` is not accepted by plugin validation`);
      }
    }
    requireString(manifest.author, "name", `${label}: author`);
    optionalString(manifest.author, "email", `${label}: author`);
    optionalHttpsUrl(manifest.author, "url", `${label}: author`);
  }

  // `skills`, when present, must be a string resolving to the plugin's skills
  // dir (the only value the ingestion path accepts) and that dir must exist.
  if (manifest.skills != null) {
    if (typeof manifest.skills !== "string" || normalizeContract(manifest.skills) !== "skills") {
      errors.push(`${label}: field \`skills\` must resolve to \`./skills/\``);
    } else if (!isDir(join(sourceDir, "skills"))) {
      errors.push(`${label}: skills directory ${join(sourceDir, "skills")} does not exist`);
    }
  }

  // apps / string-valued mcpServers name companion files that must exist and
  // parse; deep companion-field validation stays with the authority script.
  checkCompanionJson(sourceDir, manifest, "apps", ".app.json", label);
  if (typeof manifest.mcpServers === "string" || manifest.mcpServers == null) {
    checkCompanionJson(sourceDir, manifest, "mcpServers", ".mcp.json", label);
  } else if (isObject(manifest.mcpServers)) {
    for (const [key, value] of Object.entries(manifest.mcpServers)) {
      if (key.trim() === "") errors.push(`${label}: mcpServers server names must be non-empty strings`);
      if (!isObject(value)) errors.push(`${label}: mcpServers server \`${key}\` must be an object`);
    }
  } else {
    errors.push(`${label}: field \`mcpServers\` must be a string path or object`);
  }

  if (!isObject(manifest.interface)) {
    errors.push(`${label}: field \`interface\` must be an object`);
  } else {
    const iface = manifest.interface;
    for (const key of Object.keys(iface)) {
      if (!INTERFACE_KEYS.has(key)) {
        errors.push(`${label}: field \`interface.${key}\` is not accepted by plugin validation`);
      }
    }
    for (const field of ["displayName", "shortDescription", "longDescription", "developerName", "category"]) {
      requireString(iface, field, `${label}: interface`);
    }
    // Unlike the URL/asset fields, capabilities has no None guard in the
    // authority — it is effectively required (array of strings, may be empty).
    const capabilities = iface.capabilities;
    if (!Array.isArray(capabilities) || capabilities.some((c) => typeof c !== "string")) {
      errors.push(`${label}: field \`interface.capabilities\` must be an array of strings`);
    }
    const prompt = iface.defaultPrompt ?? iface.default_prompt;
    if (prompt === undefined) {
      errors.push(`${label}: field \`interface.defaultPrompt\` is required`);
    } else if (!Array.isArray(prompt) || prompt.some((p) => typeof p !== "string")) {
      // Stricter than the authority (presence-only): these strings render as
      // composer chips, so a wrong type would surface in the ChatGPT UI.
      errors.push(`${label}: field \`interface.defaultPrompt\` must be an array of strings`);
    }
    for (const field of ["websiteURL", "privacyPolicyURL", "termsOfServiceURL"]) {
      optionalHttpsUrl(iface, field, `${label}: interface`);
    }
    if (iface.brandColor != null && !HEX_COLOR_RE.test(iface.brandColor)) {
      errors.push(`${label}: field \`interface.brandColor\` must use \`#RRGGBB\``);
    }
    for (const field of ["composerIcon", "logo", "logoDark"]) {
      optionalAssetPath(sourceDir, iface, field, `${label}: interface`);
    }
    if (iface.screenshots != null) {
      if (!Array.isArray(iface.screenshots)) {
        errors.push(`${label}: field \`interface.screenshots\` must be an array`);
      } else {
        iface.screenshots.forEach((shot, i) => {
          if (typeof shot !== "string" || !shot.toLowerCase().endsWith(".png")
            || !normalize(shot).startsWith("assets/") || !isFile(join(sourceDir, shot))) {
            errors.push(`${label}: field \`interface.screenshots[${i}]\` must be a PNG under \`./assets/\``);
          }
        });
      }
    }
  }

  return { name, version, description: manifest.description, interface: manifest.interface };
}

// Codex-only skill rules the Claude-side strict validation (check 2) cannot
// know: every skills/ subdir needs a SKILL.md, and disable-model-invocation
// must be false. Frontmatter keys are matched line-wise instead of via a YAML
// parser (no deps); stricter than the authority on exotic YAML spellings of
// false ("no", "off"), which only ever errs toward red.
function checkSkills(sourceDir) {
  const skillsRoot = join(sourceDir, "skills");
  if (!isDir(skillsRoot)) return;
  for (const entry of readdirSync(skillsRoot).sort()) {
    if (entry.startsWith(".") || !isDir(join(skillsRoot, entry))) continue;
    const skillMd = join(skillsRoot, entry, "SKILL.md");
    if (!isFile(skillMd)) {
      errors.push(`codex skills: skill \`${entry}\` is missing \`SKILL.md\``);
      continue;
    }
    const contents = readFileSync(skillMd, "utf8");
    if (!contents.startsWith("---\n")) {
      errors.push(`codex skills: skill \`${entry}\` must start with YAML frontmatter`);
      continue;
    }
    const end = contents.indexOf("\n---", 4);
    if (end === -1) {
      errors.push(`codex skills: skill \`${entry}\` frontmatter is not closed`);
      continue;
    }
    const match = contents.slice(4, end).match(/^disable[-_]model[-_]invocation\s*:\s*(.+?)\s*$/m);
    if (match && !/^(false|False|FALSE)$/.test(match[1])) {
      errors.push(`codex skills: skill \`${entry}\` frontmatter field \`disable-model-invocation\` must be false`);
    }
  }
}

// Cross-host drift guard: both hosts install the same source dir, so the
// Claude manifest must exist there (fail closed — a missing file would
// otherwise silently disable this whole guard) and the two manifests must
// agree on identity and version. Fields missing on the Claude side are the
// Claude validator's job (check 2), so comparison skips them rather than
// reporting a drift against the literal string "undefined".
function checkClaudeSync(sourceDir, codex, claudeEntry) {
  const claudePath = join(sourceDir, ".claude-plugin/plugin.json");
  const claude = readJson(claudePath, "claude plugin manifest");
  if (claude === null || codex === null) return;
  if (typeof claude.name === "string" && codex.name !== null && claude.name !== codex.name) {
    errors.push(`manifest drift: .codex-plugin name "${codex.name}" != .claude-plugin name "${claude.name}"`);
  }
  if (typeof claude.version === "string" && codex.version !== null && claude.version !== codex.version) {
    errors.push(`manifest drift: .codex-plugin version "${codex.version}" != .claude-plugin version "${claude.version}"`);
  }
  // The release description is hand-written in four slots (this manifest pair,
  // codex interface.longDescription, and the Claude marketplace entry); syncing
  // only name/version would let a stale description keep shipping to one host's
  // listing while validate stays green.
  if (typeof claude.description === "string" && typeof codex.description === "string"
    && claude.description !== codex.description) {
    errors.push("manifest drift: .codex-plugin description != .claude-plugin description");
  }
  if (typeof codex.description === "string" && isObject(codex.interface)
    && typeof codex.interface.longDescription === "string"
    && codex.interface.longDescription !== codex.description) {
    errors.push("manifest drift: .codex-plugin interface.longDescription != its own description");
  }
  if (typeof claude.description === "string" && isObject(claudeEntry)
    && typeof claudeEntry.description === "string"
    && claudeEntry.description !== claude.description) {
    errors.push(`marketplace description drift: ${CLAUDE_MARKETPLACE} entry != .claude-plugin description`);
  }
}

const marketplace = readJson(MARKETPLACE, "codex marketplace");
if (marketplace !== null) {
  const marketplaceName = requireString(marketplace, "name", "codex marketplace");
  todoSweep(marketplace, "$", "codex marketplace");

  // Cross-host marketplace sync: the install id is <plugin>@<marketplace> on
  // both hosts (ADR-0003 fixes them as identical), and each host derives its
  // plugin payload from its own marketplace's source field — so the names and
  // the source paths must match or the two hosts drift apart silently.
  const claudeMarketplace = readJson(CLAUDE_MARKETPLACE, "claude marketplace");
  if (claudeMarketplace !== null && marketplaceName !== null
    && typeof claudeMarketplace.name === "string" && claudeMarketplace.name !== marketplaceName) {
    errors.push(`marketplace name drift: ${MARKETPLACE} "${marketplaceName}" != ${CLAUDE_MARKETPLACE} "${claudeMarketplace.name}"`);
  }

  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    errors.push("codex marketplace: field `plugins` must be a non-empty array");
  } else {
    marketplace.plugins.forEach((entry, i) => {
      const label = `codex marketplace: plugins[${i}]`;
      if (!isObject(entry)) {
        errors.push(`${label} must be an object`);
        return;
      }
      const entryName = requireString(entry, "name", label);

      if (!isObject(entry.policy)) {
        errors.push(`${label}: field \`policy\` must be an object`);
      } else {
        if (!INSTALLATION_VALUES.includes(entry.policy.installation)) {
          errors.push(`${label}: field \`policy.installation\` must be one of ${INSTALLATION_VALUES.join(", ")}`);
        }
        if (!AUTHENTICATION_VALUES.includes(entry.policy.authentication)) {
          errors.push(`${label}: field \`policy.authentication\` must be one of ${AUTHENTICATION_VALUES.join(", ")}`);
        }
      }
      requireString(entry, "category", label);

      if (!isObject(entry.source)) {
        errors.push(`${label}: field \`source\` must be an object`);
        return;
      }
      // codex itself also accepts git sources; this repo's marketplace ships
      // local sources by design (ADR-0003), so anything else is a regression
      // here. Non-local sources have no local path to stat — skip that part.
      if (entry.source.source !== "local") {
        errors.push(`${label}: field \`source.source\` must be "local"`);
        return;
      }
      const sourcePath = requireString(entry.source, "path", `${label}: source`);
      if (sourcePath === null) return;

      // Same anti-drift rule as validate.sh check 2: the path users install
      // from must actually hold a plugin, or the whole entry is dead.
      if (!isDir(sourcePath)) {
        errors.push(`${label}: source.path "${sourcePath}" does not resolve to a directory`);
        return;
      }
      const codex = checkPluginManifest(sourcePath);
      if (codex !== null && entryName !== null && codex.name !== null && codex.name !== entryName) {
        errors.push(`${label}: name "${entryName}" != plugin manifest name "${codex.name}"`);
      }
      // Same-named Claude marketplace entry (its `source` is a plain string).
      // A missing/odd Claude entry is check 1's problem; only a present,
      // disagreeing value is drift.
      const claudeEntry = (claudeMarketplace?.plugins ?? []).find?.((p) => p?.name === entryName);

      checkSkills(sourcePath);
      checkClaudeSync(sourcePath, codex, claudeEntry);

      if (claudeEntry && typeof claudeEntry.source === "string"
        && normalizeContract(claudeEntry.source) !== normalizeContract(sourcePath)) {
        errors.push(`marketplace source drift: plugins[${i}] "${sourcePath}" != ${CLAUDE_MARKETPLACE} "${claudeEntry.source}"`);
      }
    });
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exit(1);
}
console.error("codex manifests OK");
