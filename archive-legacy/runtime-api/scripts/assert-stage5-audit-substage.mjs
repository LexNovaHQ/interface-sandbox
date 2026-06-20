#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const outputRoot = path.resolve(process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), ".runtime-e2e-cache", "full-runtime-audit"));
const substageArg = String(process.argv[2] || "").toLowerCase();

const SUBSTAGES = {
  "5a": {
    label: "Stage 5A - Product Function Discovery",
    artifact: "stage5a-product-function-discovery.json",
    version_key: "stage5a_output_version",
    expected_version: "stage5a_product_function_discovery_v3",
    primary_rows: "admitted_functions",
    window_rows: "feature_evidence_windows",
    required_ref_key: "source_window_refs",
    summary_stage_id: "stage5a"
  },
  "5b": {
    label: "Stage 5B - Archetype / Surface Tagging",
    artifact: "stage5b-archetype-surface-tagging.json",
    version_key: "stage5b_output_version",
    expected_version: "stage5b_archetype_surface_tagging_v3",
    primary_rows: "feature_tags",
    window_rows: "supplemental_evidence_windows",
    required_ref_key: "source_window_refs",
    summary_stage_id: "stage5b"
  },
  "5c": {
    label: "Stage 5C - Complete Feature Record Builder",
    artifact: "stage5c-complete-feature-records.json",
    version_key: "stage5c_output_version",
    expected_version: "stage5c_complete_feature_records_v3",
    primary_rows: "complete_feature_records",
    window_rows: "supplemental_evidence_windows",
    required_ref_key: "evidence_window_refs",
    summary_stage_id: "stage5c"
  },
  "5d": {
    label: "Stage 5D - Final target_feature_profile Integrator",
    artifact: "stage5d-target-feature-profile-integrator.json",
    version_key: "stage5d_output_version",
    expected_version: "stage5d_target_feature_profile_integrator_v2",
    primary_rows: "target_feature_profile.feature_inventory",
    window_rows: null,
    required_ref_key: "evidence_refs",
    summary_stage_id: "stage5d"
  }
};

function asArray(value) { return Array.isArray(value) ? value : []; }
function readJson(fileName) { return JSON.parse(fs.readFileSync(path.join(outputRoot, fileName), "utf8")); }
function nested(obj, dotted) { return dotted.split(".").reduce((acc, key) => acc?.[key], obj); }
function hasInternalLeak(value) {
  const forbidden = new Set(["complete_feature_records", "data_touchpoints", "data_provenance_seeds", "regulated_surface_seeds", "vault_question_seeds", "substage_outputs", "custody_manifest", "forensic_log"]);
  let found = false;
  function walk(node) {
    if (found || !node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    for (const [key, child] of Object.entries(node)) {
      if (forbidden.has(key)) { found = true; return; }
      walk(child);
    }
  }
  walk(value);
  return found;
}

function summarizeValidation(validation = {}) {
  return {
    ok: validation.ok ?? null,
    reinvestigation_required: validation.reinvestigation_required === true,
    reinvestigation_request_count: asArray(validation.reinvestigation_requests).length,
    next_action: validation.next_action || null
  };
}

function appendSummary(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, "utf8");
}

function requireSummary(stageId, direction) {
  const name = `${stageId}-${direction}-summary.json`;
  const filePath = path.join(outputRoot, name);
  if (!fs.existsSync(filePath)) throw new Error(`${name} missing for ${stageId}`);
  const artifact = readJson(name);
  if (artifact.stage_id !== stageId || artifact.direction !== direction) throw new Error(`${name} has invalid stage/direction identity.`);
  if (artifact.ok === false) throw new Error(`${name} reports ok=false.`);
  return { name, artifact };
}

function requireForensic(stageId) {
  const name = `${stageId}-forensic-summary.json`;
  const filePath = path.join(outputRoot, name);
  if (!fs.existsSync(filePath)) throw new Error(`${name} missing for ${stageId}`);
  const artifact = readJson(name);
  if (artifact.stage_id !== stageId || artifact.artifact_type !== "full_live_runtime_audit_stage_forensic_summary") throw new Error(`${name} has invalid forensic identity.`);
  if (artifact.ok === false) throw new Error(`${name} reports ok=false.`);
  if (!artifact.duration || typeof artifact.duration.duration_ms !== "number") throw new Error(`${name} missing duration.duration_ms.`);
  if (!artifact.token_usage || typeof artifact.token_usage !== "object") throw new Error(`${name} missing token_usage object.`);
  if (!Array.isArray(artifact.artifact_integrity) || !artifact.artifact_integrity.length) throw new Error(`${name} missing artifact_integrity.`);
  return { name, artifact };
}

if (!SUBSTAGES[substageArg]) {
  console.error(`Usage: node scripts/assert-stage5-audit-substage.mjs <5a|5b|5c|5d>`);
  process.exit(2);
}

const spec = SUBSTAGES[substageArg];
const artifactPath = path.join(outputRoot, spec.artifact);
if (!fs.existsSync(artifactPath)) {
  console.log(`::error title=${spec.label} missing artifact::${spec.artifact} not found in ${outputRoot}`);
  process.exit(1);
}

let inputSummary;
let outputSummary;
let forensicSummary;
try {
  inputSummary = requireSummary(spec.summary_stage_id, "input");
  outputSummary = requireSummary(spec.summary_stage_id, "output");
  forensicSummary = requireForensic(spec.summary_stage_id);
} catch (error) {
  console.log(`::error title=${spec.label} missing audit summary::${error?.message || String(error)}`);
  process.exit(1);
}

const artifact = readJson(spec.artifact);
const validation = summarizeValidation(artifact.validation || {});
const rows = asArray(nested(artifact, spec.primary_rows));
const windows = spec.window_rows ? asArray(nested(artifact, spec.window_rows)) : [];
const failures = [];
const warnings = [];

if (artifact[spec.version_key] !== spec.expected_version) failures.push(`version mismatch: expected ${spec.expected_version}, got ${artifact[spec.version_key]}`);
if (artifact.metadata_used_as_primary_source === true || artifact.index_used_as_primary_source === true) failures.push("metadata/index used as primary evidence");
if (substageArg === "5d" && hasInternalLeak(artifact.target_feature_profile)) failures.push("internal Stage 5 field leaked into target_feature_profile");
if (!rows.length && !validation.reinvestigation_required) failures.push(`${spec.primary_rows} is empty without reinvestigation_required=true`);
if (spec.window_rows && !windows.length && !validation.reinvestigation_required) failures.push(`${spec.window_rows} is empty without reinvestigation_required=true`);
if (rows.length && substageArg !== "5d") {
  const missingRefs = rows.filter((row) => !asArray(row?.[spec.required_ref_key]).length).length;
  if (missingRefs) failures.push(`${missingRefs} row(s) missing ${spec.required_ref_key}`);
}
if (rows.length && substageArg === "5d") {
  const missingRefs = rows.filter((row) => !asArray(row?.evidence_refs).length && !asArray(row?.source_window_refs).length).length;
  if (missingRefs) failures.push(`${missingRefs} feature_inventory row(s) missing evidence refs`);
}
if (Number(outputSummary.artifact.primary_rows ?? outputSummary.artifact.feature_count ?? rows.length) !== rows.length && !validation.reinvestigation_required) {
  failures.push(`${outputSummary.name} primary row count does not match ${spec.artifact}`);
}
if (spec.window_rows && Number(outputSummary.artifact.source_window_count ?? windows.length) !== windows.length && !validation.reinvestigation_required) {
  failures.push(`${outputSummary.name} source window count does not match ${spec.artifact}`);
}
if (validation.reinvestigation_required) warnings.push(`reinvestigation requested: ${validation.reinvestigation_request_count}`);

const status = failures.length ? "FAIL" : warnings.length ? "REINVESTIGATION" : "PASS";
const markdown = `## ${spec.label}\n\n` +
  `| Field | Value |\n|---|---:|\n` +
  `| Status | ${status} |\n` +
  `| Input summary | ${inputSummary.name} |\n` +
  `| Output summary | ${outputSummary.name} |\n` +
  `| Forensic summary | ${forensicSummary.name} |\n` +
  `| Artifact | ${spec.artifact} |\n` +
  `| Primary rows | ${rows.length} |\n` +
  `| Source windows | ${windows.length} |\n` +
  `| Duration ms | ${forensicSummary.artifact.duration.duration_ms} |\n` +
  `| Duration source | ${forensicSummary.artifact.duration.duration_source} |\n` +
  `| Token fields | ${forensicSummary.artifact.token_usage.fields_found} |\n` +
  `| Total tokens | ${forensicSummary.artifact.token_usage.total_tokens ?? ""} |\n` +
  `| Reinvestigation required | ${validation.reinvestigation_required} |\n` +
  `| Reinvestigation requests | ${validation.reinvestigation_request_count} |\n` +
  `| Failures | ${failures.length ? failures.join("; ") : "none"} |\n` +
  `| Warnings | ${warnings.length ? warnings.join("; ") : "none"} |\n`;
appendSummary(markdown);

if (failures.length) {
  console.log(`::error title=${spec.label}::${failures.join("; ")}`);
  process.exit(1);
}
if (warnings.length) console.log(`::warning title=${spec.label}::${warnings.join("; ")}`);
console.log(JSON.stringify({ ok: true, substage: substageArg.toUpperCase(), status, input_summary: inputSummary.name, output_summary: outputSummary.name, forensic_summary: forensicSummary.name, artifact: spec.artifact, primary_rows: rows.length, source_windows: windows.length, validation, duration: forensicSummary.artifact.duration, token_usage: forensicSummary.artifact.token_usage, warnings }, null, 2));
