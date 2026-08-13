// Codex-side manifest checks (issue #4): .agents/plugins/marketplace.json at
// the repo root, plus .codex-plugin/plugin.json under every marketplace entry's
// source dir. Codex CLI validates NOTHING at `plugin marketplace add` /
// `plugin add` time (0.144.1, tested 2026-08-13: a manifest with no `version`
// installs silently into a "local" version dir) — so unlike the Claude side
// there is no host CLI to lean on, and this script mirrors the ingestion
// schema instead. Schema source: the plugin-creator system skill shipped
// inside codex-cli (references/plugin-json-spec.md + scripts/validate_plugin.py);
// re-check that skill when bumping the codex CLI.
// Run from the repo root: node scripts/check-codex-manifests.mjs

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MARKETPLACE = ".agents/plugins/marketplace.json";
const errors = [];

// Mirrors validate_plugin.py's SEMVER_RE intent: strict x.y.z with optional
// pre-release / build suffix.
const SEMVER_RE = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;

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
const INSTALLATION_VALUES = new Set(["NOT_AVAILABLE", "AVAILABLE", "INSTALLED_BY_DEFAULT"]);
const AUTHENTICATION_VALUES = new Set(["ON_INSTALL", "ON_USE"]);

function readJson(path, label) {
  if (!existsSync(path)) {
    errors.push(`${label}: missing ${path}`);
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      errors.push(`${label}: ${path} must contain a JSON object`);
      return null;
    }
    return parsed;
  } catch {
    errors.push(`${label}: ${path} must be valid JSON`);
    return null;
  }
}

function requireString(obj, field, label) {
  const value = obj[field];
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label}: field \`${field}\` must be a non-empty string`);
    return null;
  }
  return value;
}

function checkPluginManifest(sourceDir) {
  const manifestPath = join(sourceDir, ".codex-plugin/plugin.json");
  const manifest = readJson(manifestPath, "codex plugin manifest");
  if (manifest === null) return null;
  const label = `codex plugin manifest (${manifestPath})`;

  for (const key of Object.keys(manifest).sort()) {
    if (!MANIFEST_KEYS.has(key)) {
      errors.push(`${label}: field \`${key}\` is not accepted by plugin validation`);
    }
  }

  const name = requireString(manifest, "name", label);
  const version = requireString(manifest, "version", label);
  if (version !== null && !SEMVER_RE.test(version)) {
    errors.push(`${label}: field \`version\` must be strict semver`);
  }
  requireString(manifest, "description", label);

  if (typeof manifest.author !== "object" || manifest.author === null) {
    errors.push(`${label}: field \`author\` must be an object`);
  } else {
    requireString(manifest.author, "name", `${label}: author`);
  }

  // `skills`, when present, must point at the plugin's skills dir (the only
  // value the ingestion path accepts) and that dir must exist.
  if (manifest.skills !== undefined) {
    const skillsDir = join(sourceDir, "skills");
    const normalized = String(manifest.skills).replace(/^\.\//, "").replace(/\/+$/, "");
    if (normalized !== "skills") {
      errors.push(`${label}: field \`skills\` must resolve to \`./skills/\``);
    } else if (!existsSync(skillsDir) || !statSync(skillsDir).isDirectory()) {
      errors.push(`${label}: skills directory ${skillsDir} does not exist`);
    }
  }

  if (typeof manifest.interface !== "object" || manifest.interface === null) {
    errors.push(`${label}: field \`interface\` must be an object`);
  } else {
    const iface = manifest.interface;
    for (const key of Object.keys(iface).sort()) {
      if (!INTERFACE_KEYS.has(key)) {
        errors.push(`${label}: field \`interface.${key}\` is not accepted by plugin validation`);
      }
    }
    for (const field of ["displayName", "shortDescription", "longDescription", "developerName", "category"]) {
      requireString(iface, field, `${label}: interface`);
    }
    if (!("defaultPrompt" in iface) && !("default_prompt" in iface)) {
      errors.push(`${label}: field \`interface.defaultPrompt\` is required`);
    }
  }

  return { name, version };
}

// Cross-host drift guard: both hosts install the same source dir, so the two
// manifests describing it must agree on identity and version — a mismatch
// means one host's users get a payload labelled as a different release.
function checkClaudeSync(sourceDir, codex) {
  const claudePath = join(sourceDir, ".claude-plugin/plugin.json");
  if (!existsSync(claudePath) || codex === null) return;
  const claude = readJson(claudePath, "claude plugin manifest");
  if (claude === null) return;
  if (codex.name !== null && claude.name !== codex.name) {
    errors.push(`manifest drift: .codex-plugin name "${codex.name}" != .claude-plugin name "${claude.name}"`);
  }
  if (codex.version !== null && claude.version !== codex.version) {
    errors.push(`manifest drift: .codex-plugin version "${codex.version}" != .claude-plugin version "${claude.version}"`);
  }
}

const marketplace = readJson(MARKETPLACE, "codex marketplace");
if (marketplace !== null) {
  requireString(marketplace, "name", "codex marketplace");
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    errors.push("codex marketplace: field `plugins` must be a non-empty array");
  } else {
    marketplace.plugins.forEach((entry, i) => {
      const label = `codex marketplace: plugins[${i}]`;
      if (typeof entry !== "object" || entry === null) {
        errors.push(`${label} must be an object`);
        return;
      }
      const entryName = requireString(entry, "name", label);

      if (typeof entry.source !== "object" || entry.source === null) {
        errors.push(`${label}: field \`source\` must be an object`);
        return;
      }
      if (entry.source.source !== "local") {
        errors.push(`${label}: field \`source.source\` must be "local"`);
      }
      const sourcePath = requireString(entry.source, "path", `${label}: source`);

      if (typeof entry.policy !== "object" || entry.policy === null) {
        errors.push(`${label}: field \`policy\` must be an object`);
      } else {
        if (!INSTALLATION_VALUES.has(entry.policy.installation)) {
          errors.push(`${label}: field \`policy.installation\` must be one of ${[...INSTALLATION_VALUES].join(", ")}`);
        }
        if (!AUTHENTICATION_VALUES.has(entry.policy.authentication)) {
          errors.push(`${label}: field \`policy.authentication\` must be one of ${[...AUTHENTICATION_VALUES].join(", ")}`);
        }
      }
      requireString(entry, "category", label);

      if (sourcePath !== null) {
        // Same anti-drift rule as validate.sh check 2: the path users install
        // from must actually hold a plugin, or the whole entry is dead.
        if (!existsSync(sourcePath) || !statSync(sourcePath).isDirectory()) {
          errors.push(`${label}: source.path "${sourcePath}" does not resolve to a directory`);
        } else {
          const codex = checkPluginManifest(sourcePath);
          if (codex !== null && entryName !== null && codex.name !== null && codex.name !== entryName) {
            errors.push(`${label}: name "${entryName}" != plugin manifest name "${codex.name}"`);
          }
          checkClaudeSync(sourcePath, codex);
        }
      }
    });
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exit(1);
}
console.error("codex manifests OK");
