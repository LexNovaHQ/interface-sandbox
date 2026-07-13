import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const THIS_FILE = normalize(path.relative(ROOT, fileURLToPath(import.meta.url)));

export const CO_CLEAN_02_ABSENT_FILES = Object.freeze([
  "scripts/audit-migration-receipts.mjs",
  "scripts/check-legacy-pollution.mjs",
  "scripts/check-dynamic-family-read-firewall.mjs",
  "scripts/check-m11-forensics-nonblocking.mjs",
  "scripts/check-m7-legal-signal-overlay.mjs",
  "receipts/CO_P12_CLOSEOUT_APPLIED.json"
]);

export const CO_CLEAN_02_FORBIDDEN_PACKAGE_SCRIPTS = Object.freeze([
  "audit:migration-receipts",
  "check:p12:co1",
  "check:p12:co2",
  "check:p12:co3",
  "check:p12:co4",
  "check:p12:co5",
  "check:runtime-cleanup"
]);

const PHASE3A_AUTHORITY = "references/registry/M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml";
const REVIEWER_SMOKE = "scripts/smoke-reviewer-run.mjs";
const PHASE3A_FORBIDDEN_ALLOWED_MODEL_SOURCES = Object.freeze([
  "source_discovery_handoff",
  "cartography_index",
  "domain_selection_profile",
  "active_run_package_manifest",
  "legal_cartography_index",
  "legal_doc_inventory",
  "legal_doc_extraction_index",
  "legal_doc_{DOC_TYPE}",
  "m7_deterministic_legal_signal_overlay"
]);

export function assertNoUnreferencedCleaningArtifacts() {
  const pkg = JSON.parse(read("package.json"));
  const scripts = pkg.scripts || {};
  const failures = [];

  for (const file of CO_CLEAN_02_ABSENT_FILES) {
    if (exists(file)) failures.push(`STALE_CLEANING_ARTIFACT_PRESENT:${file}`);
  }

  for (const scriptName of CO_CLEAN_02_FORBIDDEN_PACKAGE_SCRIPTS) {
    if (Object.prototype.hasOwnProperty.call(scripts, scriptName)) failures.push(`RETIRED_PACKAGE_SCRIPT_PRESENT:${scriptName}`);
  }

  if (scripts["check:phase12-post-clean"] !== "node scripts/check-phase12-post-clean-production.mjs") {
    failures.push("PHASE12_POST_CLEAN_ENTRYPOINT_DRIFT");
  }

  const postClean = read("scripts/check-phase12-post-clean-production.mjs");
  if (!postClean.includes("assertNoUnreferencedCleaningArtifacts")) failures.push("CO_CLEAN_02_GUARD_NOT_WIRED_TO_POST_CLEAN");
  if (!postClean.includes("CO_CLEAN_02_ABSENT_FILES")) failures.push("CO_CLEAN_02_ABSENT_LIST_NOT_REPORTED_BY_POST_CLEAN");

  const manifest = read("scripts/production-gate.manifest.mjs");
  if (!manifest.includes('gate("phase12-post-clean", "Phase 12 post-clean production hygiene", "check:phase12-post-clean"')) {
    failures.push("PHASE12_POST_CLEAN_NOT_IN_PRODUCTION_GATE");
  }

  const remainingScriptNames = listFiles("scripts", ".mjs").map((file) => normalize(file));
  if (!remainingScriptNames.includes(THIS_FILE)) failures.push("CO_CLEAN_02_GUARD_FILE_NOT_DISCOVERABLE");

  validatePhase3AAuthority({ failures });
  validateReviewerSmoke({ failures });

  assert.deepEqual(failures, [], `CO_CLEAN_02_UNREFERENCED_CLEANING_ARTIFACTS:${failures.join("|")}`);
  return {
    check: "CO-CLEAN-02 unreferenced cleaning artifacts",
    status: "PASS",
    absent_files_asserted: CO_CLEAN_02_ABSENT_FILES.length,
    forbidden_package_scripts_asserted: CO_CLEAN_02_FORBIDDEN_PACKAGE_SCRIPTS.length,
    post_clean_guard_wired: true,
    co_prod_audit_01_phase3a_authority_boundary: "PHASE2G_ROUTED_ONLY",
    co_prod_audit_01_reviewer_smoke_renderer_shape: "REPORT_ARTIFACT_REFS"
  };
}

if (normalize(process.argv[1] || "") === normalize(fileURLToPath(import.meta.url))) {
  console.log(JSON.stringify(assertNoUnreferencedCleaningArtifacts(), null, 2));
}

function validatePhase3AAuthority({ failures }) {
  const authority = read(PHASE3A_AUTHORITY);
  const allowed = yamlListBlock(authority, "allowed_model_sources");
  const navigation = yamlListBlock(authority, "navigation_only_sources");
  for (const required of [
    "phase_route_runtime_packet",
    "target_profile_source_index",
    "legal_signal_derivation_profile",
    "lossless_root__homepage_landing",
    "lossless_root__company_identity",
    "lossless_root__pricing_commercial_availability",
    "lossless_root__contact_notice",
    "lossless_root__regulatory_licensing_status",
    "lossless_root__grievance_complaints"
  ]) {
    if (!allowed.includes(required)) failures.push(`PHASE3A_ALLOWED_MODEL_SOURCE_MISSING:${required}`);
  }
  for (const forbidden of PHASE3A_FORBIDDEN_ALLOWED_MODEL_SOURCES) {
    if (allowed.includes(forbidden)) failures.push(`PHASE3A_STALE_ALLOWED_MODEL_SOURCE:${forbidden}`);
    if (navigation.includes(forbidden)) failures.push(`PHASE3A_STALE_NAVIGATION_SOURCE:${forbidden}`);
  }
  if (!authority.includes("Target Profile Review must enter through Phase 2G routed 2A source bucket only.")) {
    failures.push("PHASE3A_PHASE2G_ROUTED_HARD_RULE_MISSING");
  }
}

function validateReviewerSmoke({ failures }) {
  const smoke = read(REVIEWER_SMOKE);
  if (smoke.includes("renderer_payload?.sections") || smoke.includes("renderer_payload.sections")) {
    failures.push("SMOKE_REVIEWER_STALE_RENDERER_SECTIONS_SHAPE");
  }
  if (!smoke.includes("report_artifact_refs")) failures.push("SMOKE_REVIEWER_REPORT_ARTIFACT_REFS_CHECK_MISSING");
  if (!smoke.includes("custody_artifact_rendering_forbidden")) failures.push("SMOKE_REVIEWER_CUSTODY_BOUNDARY_CHECK_MISSING");
}

function yamlListBlock(source, key) {
  const lines = String(source || "").split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `${key}:`);
  if (start < 0) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    const match = line.match(/^\s*-\s+(.+?)\s*$/);
    if (match) out.push(match[1]);
  }
  return out;
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function listFiles(directory, extension) {
  const root = path.join(ROOT, directory);
  if (!fs.existsSync(root)) return [];
  const files = [];
  walk(root, files, extension);
  return files.map((file) => path.relative(ROOT, file)).sort();
}

function walk(target, files, extension) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (target.endsWith(extension)) files.push(target);
    return;
  }
  for (const entry of fs.readdirSync(target)) walk(path.join(target, entry), files, extension);
}

function normalize(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "");
}
