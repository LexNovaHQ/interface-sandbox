#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const outputRoot = path.resolve(process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), ".runtime-e2e-cache", "full-runtime-audit"));
const generatedAt = new Date().toISOString();

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function filePath(name) { return path.join(outputRoot, name); }
function exists(name) { return fs.existsSync(filePath(name)); }
function readText(name) { return fs.readFileSync(filePath(name), "utf8"); }
function sha256File(name) { return crypto.createHash("sha256").update(fs.readFileSync(filePath(name))).digest("hex"); }

function readJsonOptional(name) {
  if (!exists(name)) return null;
  try { return JSON.parse(readText(name)); }
  catch (error) { return { __parse_error: error?.message || String(error), __artifact_name: name }; }
}
function writeJson(name, value) { ensureDir(outputRoot); fs.writeFileSync(filePath(name), JSON.stringify(value, null, 2), "utf8"); return name; }
function writeText(name, value) { ensureDir(outputRoot); fs.writeFileSync(filePath(name), value, "utf8"); return name; }
function appendSummary(markdown) { if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, "utf8"); }

function artifactMeta(name) {
  if (!exists(name)) return { name, present: false };
  const stat = fs.statSync(filePath(name));
  return { name, present: true, bytes: stat.size, mtime_ms: Math.round(stat.mtimeMs), mtime_iso: stat.mtime.toISOString(), sha256: sha256File(name) };
}
function pushLimited(arr, value, limit = 50) { if (arr.length < limit) arr.push(value); }
function collectSignals(root) {
  const tokenFields = [];
  const durationFields = [];
  const modelFields = [];
  const attemptFields = [];
  const validationFields = [];
  const guardrailFields = [];
  const errorFields = [];
  const seen = new WeakSet();
  function visit(node, trail = "$") {
    if (!node || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) return node.slice(0, 200).forEach((child, index) => visit(child, `${trail}[${index}]`));
    for (const [key, value] of Object.entries(node)) {
      const lower = key.toLowerCase();
      const nextTrail = `${trail}.${key}`;
      const record = { path: nextTrail, key, value };
      if (/token|usage/.test(lower)) pushLimited(tokenFields, record, 80);
      if (/duration|elapsed|latency|runtime_ms|time_ms|timeout_ms/.test(lower)) pushLimited(durationFields, record, 80);
      if (/(^|_)(model|model_name|model_used|model_id|pool|model_pool)(_|$)/.test(lower) || lower === "model" || lower === "pool") pushLimited(modelFields, record, 80);
      if (/attempt|retry/.test(lower)) pushLimited(attemptFields, record, 80);
      if (/validation|validator|schema/.test(lower)) pushLimited(validationFields, record, 80);
      if (/guardrail/.test(lower)) pushLimited(guardrailFields, record, 80);
      if (/error|failure|exception/.test(lower)) pushLimited(errorFields, record, 80);
      if (value && typeof value === "object") visit(value, nextTrail);
    }
  }
  visit(root);
  return { tokenFields, durationFields, modelFields, attemptFields, validationFields, guardrailFields, errorFields };
}
function numericValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}
function summarizeTokens(tokenFields) {
  const summary = { input_tokens: null, output_tokens: null, total_tokens: null, prompt_tokens: null, completion_tokens: null, candidate_tokens: null, reasoning_tokens: null, raw_numeric_token_field_sum: 0, raw_numeric_token_field_count: 0, fields_found: tokenFields.length };
  for (const item of tokenFields) {
    const lowerPath = item.path.toLowerCase();
    const num = numericValue(item.value);
    if (num === null) continue;
    summary.raw_numeric_token_field_sum += num;
    summary.raw_numeric_token_field_count += 1;
    if (/input.*token|prompt.*token/.test(lowerPath)) summary.input_tokens = (summary.input_tokens || 0) + num;
    if (/output.*token|completion.*token|candidate.*token/.test(lowerPath)) summary.output_tokens = (summary.output_tokens || 0) + num;
    if (/total.*token/.test(lowerPath)) summary.total_tokens = (summary.total_tokens || 0) + num;
    if (/prompt.*token/.test(lowerPath)) summary.prompt_tokens = (summary.prompt_tokens || 0) + num;
    if (/completion.*token/.test(lowerPath)) summary.completion_tokens = (summary.completion_tokens || 0) + num;
    if (/candidate.*token/.test(lowerPath)) summary.candidate_tokens = (summary.candidate_tokens || 0) + num;
    if (/reasoning.*token|thought.*token/.test(lowerPath)) summary.reasoning_tokens = (summary.reasoning_tokens || 0) + num;
  }
  if (summary.total_tokens === null && (summary.input_tokens !== null || summary.output_tokens !== null)) summary.total_tokens = (summary.input_tokens || 0) + (summary.output_tokens || 0);
  return summary;
}
function summarizeDurations(durationFields, artifactMetas) {
  let explicitDurationMs = null;
  for (const item of durationFields) {
    const lowerPath = item.path.toLowerCase();
    const num = numericValue(item.value);
    if (num === null) continue;
    const normalized = /_s$|seconds|duration_s/.test(lowerPath) && !/_ms|millis/.test(lowerPath) ? num * 1000 : num;
    explicitDurationMs = (explicitDurationMs || 0) + normalized;
  }
  const presentTimes = artifactMetas.filter((meta) => meta.present && Number.isFinite(meta.mtime_ms)).map((meta) => meta.mtime_ms);
  const artifactSpanMs = presentTimes.length > 1 ? Math.max(...presentTimes) - Math.min(...presentTimes) : 0;
  return { duration_ms: explicitDurationMs !== null ? Math.round(explicitDurationMs) : artifactSpanMs, duration_source: explicitDurationMs !== null ? "explicit_runtime_fields" : "artifact_mtime_span_ms", artifact_span_ms: artifactSpanMs, explicit_duration_field_count: durationFields.length };
}
function summarizeValidationFromArtifacts(artifacts) {
  const validations = [];
  const guardrails = [];
  const reinvestigationRequests = [];
  const errors = [];
  function scan(node, trail = "$") {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach((child, index) => scan(child, `${trail}[${index}]`));
    for (const [key, value] of Object.entries(node)) {
      const lower = key.toLowerCase();
      if (lower === "validation" || lower.endsWith("validation")) validations.push({ path: `${trail}.${key}`, ok: value?.ok ?? null, status: value?.status || null, reinvestigation_required: value?.reinvestigation_required === true || value?.status === "REINVESTIGATE_REQUIRED" });
      if (lower === "guardrail" || lower.includes("guardrail")) guardrails.push({ path: `${trail}.${key}`, ok: value?.ok ?? null });
      if (lower === "reinvestigation_requests" && Array.isArray(value)) reinvestigationRequests.push(...value);
      if ((lower === "error" || lower === "failure") && value) errors.push({ path: `${trail}.${key}`, value: typeof value === "string" ? value : JSON.stringify(value).slice(0, 500) });
      if (value && typeof value === "object") scan(value, `${trail}.${key}`);
    }
  }
  for (const artifact of artifacts) scan(artifact);
  return { validation_count: validations.length, validation_ok_count: validations.filter((item) => item.ok === true || item.status === "PASS").length, validation_reinvestigation_count: validations.filter((item) => item.reinvestigation_required === true).length, guardrail_count: guardrails.length, guardrail_ok_count: guardrails.filter((item) => item.ok === true).length, reinvestigation_request_count: reinvestigationRequests.length, error_count: errors.length, errors: errors.slice(0, 20) };
}

const stageIoIndex = readJsonOptional("full-audit-stage-io-index.json") || { stages: [] };
const stageRows = asArray(stageIoIndex.stages);
const stageSpecs = {
  stage1: { label: "Stage 1 - Source Discovery", artifacts: ["00-audit-request.json", "01-source-discovery.json"] },
  stage2: { label: "Stage 2 - Source Capture", artifacts: ["01-source-discovery.json", "02-source-capture.json"] },
  stage3: { label: "Stage 3 - Evidence Refiner / Source Bundle", artifacts: ["02-source-capture.json", "03-evidence-refiner-source-bundle.json", "04-evidence-junction.json"] },
  stage4: { label: "Stage 4 - Company / Target Profile", artifacts: ["03-evidence-refiner-source-bundle.json", "04-evidence-junction.json", "05-target-profile.json", "05-target-profile-stage-result.json"] },
  stage5: { label: "Stage 5 - Canonical Lossless Window Runtime", artifacts: ["06-stage5-input-custody-package.json", "07-stage5-canonical-runtime.json", "stage5-canonical-runtime-summary.json", "stage5-validation-summary.json", "stage5-source-window-ledger.json"] },
  stage5a: { label: "Stage 5A - Product Function Discovery", artifacts: ["stage5a-product-function-discovery.json", "stage5-source-window-ledger.json"] },
  stage5b: { label: "Stage 5B - Archetype / Surface Tagging", artifacts: ["stage5b-archetype-surface-tagging.json", "stage5-source-window-ledger.json"] },
  stage5c: { label: "Stage 5C - Complete Feature Record Builder", artifacts: ["stage5c-complete-feature-records.json", "stage5-source-window-ledger.json"] },
  stage5d: { label: "Stage 5D - target_feature_profile Integrator", artifacts: ["stage5d-target-feature-profile-integrator.json", "stage5-final-target-feature-profile.json"] },
  stage6: { label: "Stage 6 - Canonical Legal/Governance Runtime", artifacts: ["08-stage6-canonical-runtime.json", "11-stage6-input-custody-package.json"] },
  stage6a: { label: "Stage 6A - Legal Cartography", artifacts: ["11-stage6-input-custody-package.json", "12-stage6a-legal-cartography.json"] },
  stage6b: { label: "Stage 6B - Legal Governance Data Provenance", artifacts: ["12-stage6a-legal-cartography.json", "13-stage6b-legal-governance-data-provenance-profile.json", "13-stage6b-data-provenance-profile.json"] },
  stage6c: { label: "Stage 6C - Data Provenance Integration", artifacts: ["13-stage6b-legal-governance-data-provenance-profile.json", "14-stage6c-data-provenance-integration.json"] },
  stage6handoff: { label: "Stage 6C → Stage 7 Handoff", artifacts: ["08-stage6-canonical-runtime.json", "14-stage6c-data-provenance-integration.json", "15-stage6-stage7-handoff.json"] }
};

const forensicRows = [];
for (const [stageId, spec] of Object.entries(stageSpecs)) {
  const ioRow = stageRows.find((row) => row.stage_id === stageId) || {};
  const summaryArtifacts = [`${stageId}-input-summary.json`, `${stageId}-output-summary.json`];
  const artifactNames = [...new Set([...summaryArtifacts, ...spec.artifacts])];
  const metas = artifactNames.map(artifactMeta);
  const artifacts = artifactNames.map(readJsonOptional).filter(Boolean);
  const signals = collectSignals(artifacts);
  const tokenUsage = summarizeTokens(signals.tokenFields);
  const duration = summarizeDurations(signals.durationFields, metas);
  const validation = summarizeValidationFromArtifacts(artifacts);
  const forensic = { ok: metas.some((meta) => meta.present), artifact_type: "full_live_runtime_audit_stage_forensic_summary", generated_at: generatedAt, stage_id: stageId, label: ioRow.label || spec.label, status: ioRow.status || "UNKNOWN", input_summary_artifact: `${stageId}-input-summary.json`, output_summary_artifact: `${stageId}-output-summary.json`, forensic_summary_artifact: `${stageId}-forensic-summary.json`, source_artifacts: artifactNames, artifact_integrity: metas, duration, token_usage: tokenUsage, token_fields_found: signals.tokenFields.map((item) => ({ path: item.path, value: item.value })).slice(0, 40), model_fields_found: signals.modelFields.map((item) => ({ path: item.path, value: item.value })).slice(0, 30), attempt_fields_found: signals.attemptFields.map((item) => ({ path: item.path, value: item.value })).slice(0, 30), validation_and_guardrails: validation, notes: { duration_note: duration.duration_source === "artifact_mtime_span_ms" ? "No explicit runtime duration field was found in stage artifacts; duration_ms uses artifact mtime span as a forensic fallback." : "duration_ms was computed from explicit runtime duration fields found in artifacts.", token_note: tokenUsage.fields_found ? "Token usage was extracted from token/usage fields found in stage artifacts." : "No token/usage fields were found in the stage artifacts. The stage may be deterministic, or upstream runner did not persist token metadata." } };
  writeJson(`${stageId}-forensic-summary.json`, forensic);
  forensicRows.push({ stage_id: stageId, label: forensic.label, status: forensic.status, forensic_artifact: `${stageId}-forensic-summary.json`, duration_ms: forensic.duration.duration_ms, duration_source: forensic.duration.duration_source, total_tokens: forensic.token_usage.total_tokens, token_fields: forensic.token_usage.fields_found, reinvestigation_requests: forensic.validation_and_guardrails.reinvestigation_request_count, guardrails: forensic.validation_and_guardrails.guardrail_count, validations: forensic.validation_and_guardrails.validation_count });
}

const index = { ok: forensicRows.every((row) => row.status !== "FAIL"), artifact_type: "full_live_runtime_audit_stage_forensics_index", generated_at: generatedAt, stages: forensicRows };
writeJson("full-audit-stage-forensics-index.json", index);

const markdown = `# Runtime API Full Live Audit — Stage Forensics\n\n` +
  `| Stage | Status | Forensic artifact | Duration ms | Duration source | Total tokens | Token fields | Validations | Guardrails | Reinvestigation requests |\n` +
  `|---|---:|---|---:|---|---:|---:|---:|---:|---:|\n` +
  forensicRows.map((row) => `| ${row.label} | ${row.status} | ${row.forensic_artifact} | ${row.duration_ms ?? ""} | ${row.duration_source || ""} | ${row.total_tokens ?? ""} | ${row.token_fields ?? 0} | ${row.validations ?? 0} | ${row.guardrails ?? 0} | ${row.reinvestigation_requests ?? 0} |`).join("\n") +
  "\n";
writeText("22-forensics-summary.md", markdown);
appendSummary(markdown);
console.log(JSON.stringify(index, null, 2));