#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { buildStage5TargetFeaturePackage } from "../src/diligence/stage5TargetFeaturePackageBuilder.js";
import { runStage5ABatch2Pipeline } from "../src/diligence/stage5/stage5aPipelineConnector.js";
import { runStage5BBatch3Pipeline } from "../src/diligence/stage5/stage5bPipelineConnector.js";
import { runStage5CBatch4Pipeline } from "../src/diligence/stage5/stage5cPipelineConnector.js";
import { runStage5DBatch5Pipeline } from "../src/diligence/stage5/stage5dPipelineConnector.js";
import { runStage5EBatch6Pipeline } from "../src/diligence/stage5/stage5ePipelineConnector.js";
import { buildStage6IntegratedHandoffArtifact } from "../src/diligence/stage6IntegratedHandoffBuilder.js";
import { validateStage6ReviewGuardrail } from "../src/diligence/guardrails/stage6ReviewGuardrail.js";
import { runStage6BDataProvenance } from "../src/diligence/stage6bDataProvenanceRunner.js";
import { validateDiligenceStageOutput } from "../src/diligence/stageSchemaValidator.js";
import { runGeminiPool } from "../src/gemini/geminiPool.js";
import { buildLiveEvidence, normalizeInput } from "../src/live/liveEvidenceAndProfilePipeline.js";
import { runStage } from "../src/live/liveStage6To8Pipeline.js";
import { logStage as liveLogStage } from "../src/live/liveRunShared.js";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const STATUS_ENDPOINT = "/v1/runtime-status";
const FORBIDDEN_STAGE_ENDPOINT = "/v1/diligence/stage";
const runtimeUrl = (process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL).replace(/\/+$/, "");
const token = process.env.RUNTIME_ACCESS_TOKEN;
const targetUrl = process.env.AUDIT_TARGET_URL || process.env.TARGET_URL || "https://sarvam.ai";
const companyName = process.env.AUDIT_COMPANY_NAME || process.env.COMPANY_NAME || "Sarvam AI";
const outputRoot = path.resolve(process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), ".runtime-e2e-cache", "full-runtime-audit"));
const githubRunId = process.env.GITHUB_RUN_ID || "local";
const runTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
const runId = `full_live_runtime_audit_${githubRunId}_${runTimestamp}`;
const auditStopStage = String(process.env.AUDIT_STOP_STAGE || "6b").toLowerCase();
const cacheClearedAt = new Date().toISOString();

const FORBIDDEN_TRUE_FLAGS = [
  "MOCK_MODE",
  "OFFLINE_MODE",
  "SIMULATED",
  "DRY_RUN",
  "USE_FIXTURE",
  "USE_CACHED_AUDIT",
  "SKIP_SOURCE_DISCOVERY",
  "SKIP_SOURCE_CAPTURE",
  "SKIP_STAGE5",
  "SKIP_STAGE6"
];

const REQUIRED_TRUE_FLAGS = [
  "STAGE5A_BATCH2_ENABLED",
  "STAGE5B_BATCH3_ENABLED",
  "STAGE5C_BATCH4_ENABLED",
  "STAGE5D_BATCH5_ENABLED",
  "STAGE5E_BATCH6_ENABLED",
  "STAGE5A_BATCH2_BLOCKING",
  "STAGE5B_BATCH3_BLOCKING",
  "STAGE5C_BATCH4_BLOCKING",
  "STAGE5D_BATCH5_BLOCKING",
  "STAGE5E_BATCH6_BLOCKING"
];

const STAGE_ORDER = new Map([
  ["source_discovery", 1],
  ["source_capture", 2],
  ["evidence_refiner", 3],
  ["source_packaging", 4],
  ["evidence_junction", 4],
  ["target_profile", 5],
  ["stage5_input_adapter", 6],
  ["stage5a_product_function_mapping", 7],
  ["stage5b_archetype_surface_tagging", 8],
  ["stage5c_feature_inventory", 9],
  ["stage5d_data_touchpoints", 10],
  ["stage5e_target_feature_profile", 11],
  ["stage6a_legal_cartography", 12],
  ["stage6b_data_provenance", 13],
  ["stage6_integrated_handoff_validation", 14],
  ["6b", 14],
  ["stage6b", 14],
  ["7", 20],
  ["8", 21],
  ["9", 22],
  ["10", 23]
]);

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function safeJson(value) { return JSON.stringify(value ?? null, null, 2); }
function writeText(name, text) { ensureDir(outputRoot); const filePath = path.join(outputRoot, name); fs.writeFileSync(filePath, text, "utf8"); return filePath; }
function writeJson(name, value) { return writeText(name, safeJson(value)); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function safeObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function asText(value) { return typeof value === "string" ? value.trim() : ""; }
function nowIso() { return new Date().toISOString(); }
function bytes(filePath) { return fs.statSync(filePath).size; }
function sha256(filePath) { return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex"); }

function clearAuditCaches() {
  const cwd = process.cwd();
  const targets = [
    path.join(cwd, ".runtime-e2e-cache", "full-runtime-audit"),
    path.join(cwd, ".runtime-e2e-cache", "staged-live-runtime-audit"),
    path.join(cwd, "source-scout-output"),
    path.join(cwd, "step2-output"),
    path.join(cwd, "step5-quality-audit")
  ];
  const cacheRoot = path.join(cwd, ".runtime-e2e-cache");
  if (fs.existsSync(cacheRoot)) {
    for (const name of fs.readdirSync(cacheRoot)) {
      if (/^stage[56]/i.test(name)) targets.push(path.join(cacheRoot, name));
    }
  }
  for (const target of targets) fs.rmSync(target, { recursive: true, force: true });
  ensureDir(outputRoot);
}

function applyAuditRuntimeDefaults() {
  const defaults = {
    LIVE_SOURCE_DISCOVERY_MODE: "sync_with_free_search",
    LIVE_RUN_FREE_SEARCH: "true",
    LIVE_ANCHOR_FETCH_MAX: "60",
    LIVE_ANCHOR_LINK_LIMIT: String(Number.MAX_SAFE_INTEGER),
    LIVE_ANCHOR_CLASSIFY_TOKENS: "8192",
    LIVE_PROBE_TIMEOUT_MS: "8000",
    LIVE_CAPTURE_LIMIT: String(Number.MAX_SAFE_INTEGER),
    LIVE_PRODUCT_CAPTURE_LIMIT: String(Number.MAX_SAFE_INTEGER),
    LIVE_COMPANY_CAPTURE_LIMIT: String(Number.MAX_SAFE_INTEGER),
    LIVE_LEGAL_CAPTURE_LIMIT: String(Number.MAX_SAFE_INTEGER),
    LIVE_GOVERNANCE_CAPTURE_LIMIT: String(Number.MAX_SAFE_INTEGER),
    LIVE_CAPTURE_TIMEOUT_MS: "24000",
    SOURCE_CAPTURE_MAX_BYTES: String(30 * 1024 * 1024),
    LIVE_COMPANY_MAX_OUTPUT_TOKENS: "24000",
    STAGE4_COMPANY_MAX_OUTPUT_TOKENS: "24000",
    STAGE5_MAX_INPUT_CHARS: "240000",
    STAGE5_MAX_ESTIMATED_TOKENS: "120000",
    STAGE5_MAX_SINGLE_SOURCE_CHARS: String(Number.MAX_SAFE_INTEGER),
    STAGE5_PROMPT_OVERHEAD_TOKENS: "30000",
    STAGE5A_BATCH2_ENABLED: "true",
    STAGE5B_BATCH3_ENABLED: "true",
    STAGE5C_BATCH4_ENABLED: "true",
    STAGE5D_BATCH5_ENABLED: "true",
    STAGE5E_BATCH6_ENABLED: "true",
    STAGE5A_BATCH2_BLOCKING: "true",
    STAGE5B_BATCH3_BLOCKING: "true",
    STAGE5C_BATCH4_BLOCKING: "true",
    STAGE5D_BATCH5_BLOCKING: "true",
    STAGE5E_BATCH6_BLOCKING: "true",
    STAGE5_LEGACY_FALLBACK: "false",
    AUDIT_STOP_STAGE: "6b"
  };
  for (const [key, value] of Object.entries(defaults)) if (!process.env[key]) process.env[key] = value;
}

function assertRuntimePolicy() {
  const forbidden = FORBIDDEN_TRUE_FLAGS.filter((key) => String(process.env[key] || "").toLowerCase() === "true");
  if (forbidden.length) throw new Error(`Forbidden audit flag(s) enabled: ${forbidden.join(", ")}`);
  const missingRequired = REQUIRED_TRUE_FLAGS.filter((key) => String(process.env[key] || "").toLowerCase() !== "true");
  if (missingRequired.length) throw new Error(`Required Stage 5 flag(s) are not true: ${missingRequired.join(", ")}`);
  if (String(process.env.STAGE5_LEGACY_FALLBACK || "").toLowerCase() !== "false") throw new Error("STAGE5_LEGACY_FALLBACK must be false for this audit.");
  if (!STAGE_ORDER.has(auditStopStage)) throw new Error(`Unsupported AUDIT_STOP_STAGE: ${auditStopStage}`);
  if (STAGE_ORDER.get(auditStopStage) > 14) throw new Error("Stage 7/8/9/10 are intentionally unavailable in the default full live audit lane.");
  if (!runtimeUrl) throw new Error("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required.");
  if (!token) throw new Error("RUNTIME_ACCESS_TOKEN is required for deployed runtime smoke check.");
}

async function readJsonResponse(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { non_json_body: text.slice(0, 10000) }; }
}

async function getJson(url, headers = {}) {
  const response = await fetch(url, { method: "GET", headers });
  return { status: response.status, ok: response.ok, body: await readJsonResponse(response) };
}

function collectUsageMetadata(value) {
  const records = [];
  const seen = new Set();
  function walk(node, trail = []) {
    if (!node || typeof node !== "object") return;
    if (node.usage_metadata && typeof node.usage_metadata === "object") {
      const key = `${trail.join(".")}:${JSON.stringify(node.usage_metadata)}`;
      if (!seen.has(key)) { seen.add(key); records.push({ path: trail.join("."), usage_metadata: node.usage_metadata }); }
    }
    if (Array.isArray(node)) node.forEach((item, index) => walk(item, trail.concat(String(index))));
    else for (const [key, child] of Object.entries(node)) walk(child, trail.concat(key));
  }
  walk(value);
  const totals = {};
  for (const record of records) for (const [key, value] of Object.entries(record.usage_metadata || {})) if (typeof value === "number" && Number.isFinite(value)) totals[key] = (totals[key] || 0) + value;
  return { usage_metadata_count: records.length, totals, records };
}

function objectSummary(value) {
  if (Array.isArray(value)) return { type: "array", count: value.length };
  if (!value || typeof value !== "object") return { type: value == null ? "null" : typeof value };
  const keys = Object.keys(value);
  const array_counts = {};
  const object_keys = {};
  for (const [key, child] of Object.entries(value)) {
    if (Array.isArray(child)) array_counts[key] = child.length;
    else if (child && typeof child === "object") object_keys[key] = Object.keys(child).slice(0, 24);
  }
  return { type: "object", key_count: keys.length, keys: keys.slice(0, 80), array_counts, object_keys };
}

function collectRefs(value, maxRefs = 120) {
  const refs = [];
  function walk(node, trail = []) {
    if (refs.length >= maxRefs || !node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.slice(0, 40).forEach((item, index) => walk(item, trail.concat(String(index))));
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      const nextTrail = trail.concat(key);
      if (/(^|_)(id|ids|ref|refs|url|urls|path|sha256|source|sources)$/i.test(key)) refs.push({ path: nextTrail.join("."), value: typeof child === "string" ? child.slice(0, 280) : child });
      walk(child, nextTrail);
    }
  }
  walk(value);
  return refs.slice(0, maxRefs);
}

function warningErrorSummary(...values) {
  const warnings = [];
  const errors = [];
  function addIssue(list, issue, source) {
    if (issue == null) return;
    if (typeof issue === "string") list.push({ source, message: issue });
    else list.push({ source, ...safeObject(issue), message: issue.message || issue.error || issue.code || issue.keyword || JSON.stringify(issue).slice(0, 300) });
  }
  function walk(node, source = "stage") {
    if (!node || typeof node !== "object") return;
    for (const key of ["warnings", "guardrail_warnings", "operator_challenge_warnings", "batch_warnings"]) for (const issue of asArray(node[key])) addIssue(warnings, issue, key);
    for (const key of ["errors", "critical", "validation_errors", "correction_errors"]) for (const issue of asArray(node[key])) addIssue(errors, issue, key);
    if (node.error) addIssue(errors, { error: node.error, error_type: node.error_type || null }, "error");
    if (node.error_summary) addIssue(errors, { error_summary: node.error_summary }, "error_summary");
  }
  values.forEach((value) => walk(value));
  return { warning_count: warnings.length, error_count: errors.length, warnings: warnings.slice(0, 80), errors: errors.slice(0, 80) };
}

function validationSummary(...values) {
  const validations = values.filter((value) => value && typeof value === "object");
  if (!validations.length) return null;
  return validations.map((value) => ({
    ok: value.ok ?? null,
    severity: value.severity || null,
    validation_mode: value.validation_mode || value.schemaValidation?.validation_mode || value.guardrail?.validation_mode || null,
    guardrail_validation_mode: value.guardrail_validation_mode || value.guardrail?.validation_mode || null,
    error_count: asArray(value.errors || value.validation_errors || value.critical).length,
    warning_count: asArray(value.warnings || value.guardrail_warnings).length,
    repair_count: asArray(value.repairs || value.guardrail_repairs).length
  }));
}

function forensicStatus({ validation, issues, output }) {
  const validations = asArray(validation);
  if (validations.some((item) => item?.ok === false || String(item?.severity || "").toUpperCase() === "BLOCKING")) return "FAIL";
  if (issues.error_count > 0 || output?.ok === false) return "FAIL";
  if (issues.warning_count > 0 || validations.some((item) => item?.warning_count > 0 || String(item?.severity || "").toUpperCase() === "WARNING")) return "WARNING";
  return "PASS";
}

function makeForensicEntry({ stage, stage_label, input, output, canonical_output_pointer, validation = null, issue_sources = [], handoff_integrity = {}, source_coverage = {}, usage_source = null, duration_ms = 0 }) {
  const issues = warningErrorSummary(output, ...issue_sources);
  const validation_result = validation;
  const status = forensicStatus({ validation: validation_result, issues, output });
  return {
    stage,
    stage_label,
    status,
    duration_ms,
    input_summary: objectSummary(input),
    input_refs: collectRefs(input),
    output_summary: objectSummary(output),
    output_refs: collectRefs(output),
    summary_findings: { status, warnings: issues.warnings.slice(0, 12), errors: issues.errors.slice(0, 12) },
    summary_forensics: { input: objectSummary(input), output: objectSummary(output), output_ref_count: collectRefs(output).length },
    validation_result,
    warnings_errors: issues,
    token_model_usage: collectUsageMetadata(usage_source || output),
    guardrail_validation_findings: validation_result,
    handoff_integrity,
    source_coverage,
    canonical_output_pointer
  };
}

function appendStepSummary(entry, artifactPath) {
  const line = [
    `| ${entry.stage_label} | ${entry.status} | ${entry.duration_ms}ms | ${entry.input_summary.key_count ?? entry.input_summary.count ?? 0}/${entry.output_summary.key_count ?? entry.output_summary.count ?? 0} | ${JSON.stringify(entry.token_model_usage.totals)} | ${path.basename(artifactPath)} | ${entry.validation_result ? "recorded" : "n/a"} | ${entry.handoff_integrity?.status || entry.status} |`
  ].join("");
  if (process.env.GITHUB_STEP_SUMMARY) {
    if (!fs.existsSync(process.env.GITHUB_STEP_SUMMARY)) fs.writeFileSync(process.env.GITHUB_STEP_SUMMARY, "| Stage | Status | Duration | Input/Output count | Token usage | Artifact | Validation | Handoff |\n|---|---:|---:|---:|---|---|---|---|\n", "utf8");
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`, "utf8");
  }
}

function makeStageRecorder() {
  const entries = [];
  return {
    entries,
    record(entry, forensicFile) {
      entries.push(entry);
      writeJson(forensicFile, entry);
      appendStepSummary(entry, path.join(outputRoot, forensicFile));
    },
    writeIndex(extra = {}) {
      writeJson("30-stage-forensic-index.json", {
        artifact_type: "stage_forensic_index",
        generated_at: nowIso(),
        run_id: runId,
        audit_stop_stage: auditStopStage,
        stage_count: entries.length,
        completed: extra.completed === true,
        stages: entries.map((entry) => ({
          stage: entry.stage,
          stage_label: entry.stage_label,
          status: entry.status,
          duration_ms: entry.duration_ms,
          canonical_output_pointer: entry.canonical_output_pointer
        })),
        ...extra
      });
    }
  };
}

function writeStageMatrices(entries) {
  writeJson("43-token-usage-by-stage.json", {
    artifact_type: "token_usage_by_stage",
    generated_at: nowIso(),
    stages: entries.map((entry) => ({ stage: entry.stage, stage_label: entry.stage_label, status: entry.status, duration_ms: entry.duration_ms, token_model_usage: entry.token_model_usage }))
  });
  writeJson("44-stage-validation-matrix.json", {
    artifact_type: "stage_validation_matrix",
    generated_at: nowIso(),
    stages: entries.map((entry) => ({ stage: entry.stage, status: entry.status, validation_result: entry.validation_result, warnings_errors: entry.warnings_errors }))
  });
  writeJson("45-stage-handoff-integrity-matrix.json", {
    artifact_type: "stage_handoff_integrity_matrix",
    generated_at: nowIso(),
    stages: entries.map((entry) => ({ stage: entry.stage, status: entry.status, handoff_integrity: entry.handoff_integrity, canonical_output_pointer: entry.canonical_output_pointer }))
  });
}

function stage4SourceRecords(sourceBundle, familyFilter = null) {
  return asArray(sourceBundle.raw_footprint?.source_records)
    .filter((record) => !familyFilter || record.source_family === familyFilter)
    .map((record) => ({
      evidence_source_id: record.evidence_source_id,
      source_family: record.source_family,
      url: record.url,
      final_url: record.final_url,
      title: record.structure?.title || record.title || "",
      word_count: record.text?.word_count || 0,
      clean_text_lossless: record.text?.clean_text_lossless || ""
    }));
}

function buildStage6Input(ctx) {
  return {
    stage6_input_version: "stage6_live_input_v1",
    run_id: `${runId}_stage6_input`,
    source_bundle: ctx.sourceBundle,
    evidence_junction: ctx.evidenceJunction,
    company_profile: ctx.companyProfile,
    target_profile: ctx.companyProfile,
    target_feature_profile: ctx.targetFeatureProfile
  };
}

function writeManifest(extra = {}) {
  const files = fs.existsSync(outputRoot) ? fs.readdirSync(outputRoot).filter((name) => name !== "21-artifact-manifest.json").sort() : [];
  const manifest = {
    ok: extra.ok !== false,
    audit_phase: "full_live_runtime_audit",
    generated_at: nowIso(),
    github_run_id: githubRunId,
    runtime_url: runtimeUrl,
    status_endpoint: STATUS_ENDPOINT,
    forbidden_endpoint: FORBIDDEN_STAGE_ENDPOINT,
    target_url: targetUrl,
    company_name: companyName,
    run_id: runId,
    audit_stop_stage: auditStopStage,
    ...extra,
    files: files.map((name) => {
      const filePath = path.join(outputRoot, name);
      return { name, bytes: bytes(filePath), sha256: sha256(filePath) };
    })
  };
  writeJson("21-artifact-manifest.json", manifest);
  return manifest;
}

function writeLiveProof({ ctx, manifestPath }) {
  writeJson("00-live-run-proof.json", {
    github_run_id: githubRunId,
    runtime_url: runtimeUrl,
    target_url: targetUrl,
    run_id: runId,
    audit_stop_stage: auditStopStage,
    cache_cleared_at: cacheClearedAt,
    legacy_fallback_used: false,
    stage5a_enabled: true,
    stage5b_enabled: true,
    stage5c_enabled: true,
    stage5d_enabled: true,
    stage5e_enabled: true,
    stage7_ran: false,
    stage8_ran: false,
    stage9_ran: false,
    stage10_ran: false,
    source_discovery_live: true,
    source_capture_live: true,
    model_backed_stages: ctx.modelBackedStages,
    artifact_manifest_path: manifestPath
  });
}

function writeAuditFailure({ failed_stage, error, last_successful_stage = null, detail = null, recorder = null }) {
  const payload = {
    ok: false,
    artifact_type: "full_live_runtime_audit_failure",
    generated_at: nowIso(),
    github_run_id: githubRunId,
    run_id: runId,
    audit_stop_stage: auditStopStage,
    failed_stage,
    error: error?.message || String(error || "audit failed"),
    detail: detail || error?.result || null,
    last_successful_stage,
    available_artifacts: fs.existsSync(outputRoot) ? fs.readdirSync(outputRoot).sort() : []
  };
  writeJson("audit-failure.json", payload);
  writeJson("99-failure.json", payload);
  if (recorder) {
    writeStageMatrices(recorder.entries);
    recorder.writeIndex({ completed: false, failure: payload.error, failed_stage });
  }
  writeManifest({ ok: false, failure: payload.error, failed_stage });
  console.log(`::error title=${failed_stage}::${payload.error}`);
  console.error(JSON.stringify(payload, null, 2));
}

function createSummaryMarkdown({ ctx, failedChecks }) {
  const stageLines = ctx.recorder.entries.map((entry) => `| ${entry.stage_label} | ${entry.status} | ${entry.duration_ms}ms | ${entry.canonical_output_pointer} |`).join("\n");
  return `# Runtime API Full Live Audit Through Stage 6B\n\n` +
    `- Runtime URL: ${runtimeUrl}\n` +
    `- Target: ${companyName} (${targetUrl})\n` +
    `- Run ID: ${runId}\n` +
    `- Audit stop stage: ${auditStopStage}\n` +
    `- Legacy Stage 5 fallback used: NO\n` +
    `- Stage 7 ran: NO\n` +
    `- Stage 8 ran: NO\n` +
    `- Stage 9 ran: NO\n` +
    `- Stage 10 ran: NO\n` +
    `- Failed checks: ${failedChecks.length ? failedChecks.join(", ") : "none"}\n\n` +
    `| Stage | Status | Duration | Artifact |\n|---|---:|---:|---|\n${stageLines}\n`;
}

function validatePassConditions(ctx) {
  const failed = [];
  const sourceRecords = asArray(ctx.sourceBundle?.raw_footprint?.source_records);
  if (!sourceRecords.length) failed.push("source_discovery_or_capture_returned_no_sources");
  if (!ctx.evidenceJunction || !Object.keys(ctx.evidenceJunction).length) failed.push("missing_evidence_junction");
  if (!ctx.companyProfile || !Object.keys(ctx.companyProfile).length) failed.push("missing_target_profile");
  if (!ctx.adapterResult?.ok) failed.push("missing_stage5_input_adapter");
  if (!ctx.stage5a?.stage5a_feature_package) failed.push("missing_stage5a_package");
  if (!ctx.stage5b?.stage5b_tag_package) failed.push("missing_stage5b_tag_package");
  if (!ctx.stage5c?.stage5c_feature_inventory_package) failed.push("missing_stage5c_feature_inventory_package");
  if (!ctx.stage5d?.stage5d_data_touchpoint_package) failed.push("missing_stage5d_data_touchpoint_package");
  if (!ctx.targetFeatureProfile || !Object.keys(ctx.targetFeatureProfile).length) failed.push("missing_stage5e_target_feature_profile");
  if (ctx.stage5e?.stage5e_validation?.ok === false) failed.push("stage5e_target_feature_profile_schema_invalid");
  if (!ctx.legalCartography || !Object.keys(ctx.legalCartography).length) failed.push("missing_stage6a_legal_cartography");
  if (!ctx.dataProvenanceProfile || !Object.keys(ctx.dataProvenanceProfile).length) failed.push("missing_stage6b_data_provenance_profile");
  if (ctx.stage6IntegratedValidation?.schemaValidation?.ok !== true || ctx.stage6IntegratedValidation?.guardrail?.ok !== true) failed.push("stage6_integrated_handoff_validation_failed");
  if (ctx.legacyFallbackUsed !== false) failed.push("legacy_stage5_fallback_used_or_unknown");
  for (const forbidden of ["stage7", "stage8", "stage9", "stage10"]) if (ctx[`${forbidden}Ran`]) failed.push(`${forbidden}_ran_unexpectedly`);
  return failed;
}

const AUDIT_STAGE_REGISTRY = [
  {
    id: "source_discovery",
    label: "Stage 1 - Source Discovery",
    stage_order: 1,
    artifact: "01-source-discovery.json",
    forensic_artifact: "31-source-discovery-forensic.json",
    required_input_keys: ["targetInput"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      const result = await buildLiveEvidence({ targetInput: ctx.targetInput, targetUrl: ctx.normalizedTargetUrl, documentText: ctx.documentText, documentLabel: ctx.documentLabel, hasDoc: Boolean(ctx.documentText), options: {}, logs: ctx.logs, runId });
      ctx.sourceBundle = result.sourceBundle;
      ctx.evidenceJunction = result.evidenceJunction;
      ctx.reviewerSource = result.reviewerSource;
      const sourceReview = result.sourceBundle?.source_review || result.sourceBundle?.raw_footprint?.source_review || {};
      const output = { ok: true, source_review: sourceReview, diagnostics: result.sourceBundle?.diagnostics || null, source_count: asArray(result.sourceBundle?.raw_footprint?.source_records).length };
      writeJson(this.artifact, output);
      return { input: ctx.targetInput, output, handoff_integrity: { status: output.source_count > 0 ? "PASS" : "FAIL", source_count: output.source_count }, source_coverage: { source_count: output.source_count } };
    }
  },
  {
    id: "source_capture",
    label: "Stage 2 - Source Capture",
    stage_order: 2,
    artifact: "02-source-capture.json",
    forensic_artifact: "32-source-capture-forensic.json",
    required_input_keys: ["sourceBundle"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      const output = { ok: true, raw_footprint: ctx.sourceBundle.raw_footprint, reviewer_source: ctx.reviewerSource || null };
      writeJson(this.artifact, output);
      const count = asArray(ctx.sourceBundle?.raw_footprint?.source_records).length;
      return { input: ctx.sourceBundle?.source_review || {}, output, handoff_integrity: { status: count > 0 ? "PASS" : "FAIL", captured_source_count: count }, source_coverage: { captured_source_count: count } };
    }
  },
  {
    id: "evidence_refiner",
    label: "Stage 3 - Evidence Refiner Source Bundle",
    stage_order: 3,
    artifact: "03-evidence-refiner-source-bundle.json",
    forensic_artifact: "33-evidence-refiner-source-bundle-forensic.json",
    required_input_keys: ["sourceBundle"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      writeJson(this.artifact, ctx.sourceBundle);
      return { input: ctx.sourceBundle?.raw_footprint || {}, output: ctx.sourceBundle, handoff_integrity: { status: ctx.sourceBundle?.source_bundle_version ? "PASS" : "WARNING", source_bundle_version: ctx.sourceBundle?.source_bundle_version || null }, source_coverage: { source_records: asArray(ctx.sourceBundle?.raw_footprint?.source_records).length } };
    }
  },
  {
    id: "source_packaging",
    label: "Stage 4 - Evidence Junction",
    stage_order: 4,
    artifact: "04-evidence-junction.json",
    forensic_artifact: "34-evidence-junction-forensic.json",
    required_input_keys: ["evidenceJunction"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      writeJson(this.artifact, ctx.evidenceJunction);
      return { input: ctx.sourceBundle, output: ctx.evidenceJunction, handoff_integrity: { status: ctx.evidenceJunction?.evidence_junction_version ? "PASS" : "FAIL", source_bundle_sha256_present: Boolean(ctx.evidenceJunction?.source_bundle_sha256) } };
    }
  },
  {
    id: "target_profile",
    label: "Stage 5 - Target Profile",
    stage_order: 5,
    artifact: "05-target-profile.json",
    forensic_artifact: "35-target-profile-forensic.json",
    required_input_keys: ["sourceBundle", "evidenceJunction"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      liveLogStage(ctx.logs, "company_profile", "running");
      const targetProfileSources = stage4SourceRecords(ctx.sourceBundle);
      const companyProfileSources = stage4SourceRecords(ctx.sourceBundle, "company_profile");
      if (!targetProfileSources.length) throw new Error("No Stage 4 target profile source records available.");
      const stageResult = await runStage("company_profile", {
        target_input: ctx.targetInput,
        source_bundle_version: ctx.sourceBundle.source_bundle_version,
        source_bundle_sha256: ctx.evidenceJunction.source_bundle_sha256 || null,
        evidence_junction_version: ctx.evidenceJunction.evidence_junction_version,
        target_profile_sources: targetProfileSources,
        company_profile_sources: companyProfileSources,
        input_policy: { target_profile_source_packet: true, company_family_only: false, product_feature_mapping_forbidden: true, legal_review_forbidden: true, registry_evaluation_forbidden: true, outside_browsing_forbidden: true }
      }, {
        pool: process.env.LIVE_COMPANY_POOL || process.env.STAGE4_COMPANY_POOL || "reasoning",
        maxOutputTokens: Number(process.env.LIVE_COMPANY_MAX_OUTPUT_TOKENS || 24000),
        timeoutMs: Number(process.env.LIVE_COMPANY_TIMEOUT_MS || 60000)
      });
      ctx.companyStage = stageResult;
      ctx.companyProfile = stageResult.company_profile;
      ctx.modelBackedStages.push("target_profile");
      liveLogStage(ctx.logs, "company_profile", "complete", { company_name: ctx.companyProfile?.identity?.brand_name || null, target_profile_sources: targetProfileSources.length, company_sources: companyProfileSources.length });
      writeJson(this.artifact, ctx.companyProfile);
      return { input: { target_profile_sources: targetProfileSources, company_profile_sources: companyProfileSources }, output: stageResult, usage_source: stageResult, validation: validationSummary(stageResult.validation), handoff_integrity: { status: ctx.companyProfile ? "PASS" : "FAIL", canonical_handoff_key: "target_profile" } };
    }
  },
  {
    id: "stage5_input_adapter",
    label: "Stage 5 Adapter - Input Package",
    stage_order: 6,
    artifact: "06-stage5-input-adapter.json",
    forensic_artifact: "36-stage5-input-adapter-forensic.json",
    required_input_keys: ["sourceBundle", "evidenceJunction", "companyProfile"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      ctx.adapterResult = buildStage5TargetFeaturePackage({
        sourceBundle: ctx.sourceBundle,
        evidenceJunction: ctx.evidenceJunction,
        companyProfile: ctx.companyProfile,
        runId: `${runId}_stage5_input`,
        budget: {
          max_input_chars: Number(process.env.STAGE5_MAX_INPUT_CHARS || 240000),
          max_estimated_tokens: Number(process.env.STAGE5_MAX_ESTIMATED_TOKENS || 120000),
          max_single_source_chars: Number(process.env.STAGE5_MAX_SINGLE_SOURCE_CHARS || Number.MAX_SAFE_INTEGER),
          prompt_overhead_tokens: Number(process.env.STAGE5_PROMPT_OVERHEAD_TOKENS || 30000),
          max_product_family_packets: Number(process.env.STAGE5_MAX_PRODUCT_FAMILY_PACKETS || 8)
        }
      });
      if (!ctx.adapterResult.ok) throw Object.assign(new Error(ctx.adapterResult.error || "Target Feature Profile input adapter failed"), { result: ctx.adapterResult });
      writeJson(this.artifact, ctx.adapterResult);
      writeJson("05a-stage5-input-adapter.json", ctx.adapterResult);
      return { input: { source_bundle: ctx.sourceBundle, evidence_junction: ctx.evidenceJunction, target_profile: ctx.companyProfile }, output: ctx.adapterResult, handoff_integrity: { status: "PASS", target_feature_profile_input_present: Boolean(ctx.adapterResult.target_feature_profile_input) }, source_coverage: { source_refs_count: collectRefs(ctx.adapterResult).length } };
    }
  },
  {
    id: "stage5a_product_function_mapping",
    label: "Stage 5A - Product Function Mapping",
    stage_order: 7,
    artifact: "07-stage5a-product-functions.json",
    forensic_artifact: "37-stage5a-product-functions-forensic.json",
    required_input_keys: ["adapterResult"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      ctx.stage5a = await runStage5ABatch2Pipeline({ adapterResult: ctx.adapterResult, companyProfile: ctx.companyProfile, runGeminiPool, logs: ctx.logs, logStage: liveLogStage, runId });
      ctx.adapterResult.stage5a_batch2 = ctx.stage5a;
      ctx.adapterResult.target_feature_profile_input.stage5a_batch2 = { stage5a_product_function_mapping: ctx.stage5a.stage5a_product_function_mapping, stage5a_feature_package: ctx.stage5a.stage5a_feature_package, stage5a_validation: ctx.stage5a.stage5a_validation };
      ctx.modelBackedStages.push("stage5a_product_function_mapping");
      writeJson(this.artifact, ctx.stage5a);
      writeJson("05b-stage5a-product-function-mapping.json", ctx.stage5a);
      return { input: ctx.adapterResult.target_feature_profile_input, output: ctx.stage5a, usage_source: ctx.stage5a, validation: validationSummary(ctx.stage5a.stage5a_validation), handoff_integrity: { status: ctx.stage5a.stage5a_feature_package ? "PASS" : "FAIL", package_present: Boolean(ctx.stage5a.stage5a_feature_package) } };
    }
  },
  {
    id: "stage5b_archetype_surface_tagging",
    label: "Stage 5B - Archetype Surface Tagging",
    stage_order: 8,
    artifact: "08-stage5b-tags.json",
    forensic_artifact: "38-stage5b-tags-forensic.json",
    required_input_keys: ["stage5a"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      ctx.stage5b = await runStage5BBatch3Pipeline({ adapterResult: ctx.adapterResult, runGeminiPool, logs: ctx.logs, logStage: liveLogStage, runId });
      ctx.adapterResult.stage5b_batch3 = ctx.stage5b;
      ctx.adapterResult.target_feature_profile_input.stage5b_batch3 = { stage5b_archetype_surface_tagging: ctx.stage5b.stage5b_archetype_surface_tagging, stage5b_tag_package: ctx.stage5b.stage5b_tag_package, stage5b_validation: ctx.stage5b.stage5b_validation };
      ctx.modelBackedStages.push("stage5b_archetype_surface_tagging");
      writeJson(this.artifact, ctx.stage5b);
      writeJson("05c-stage5b-archetype-surface-tagging.json", ctx.stage5b);
      return { input: ctx.stage5a, output: ctx.stage5b, usage_source: ctx.stage5b, validation: validationSummary(ctx.stage5b.stage5b_validation), handoff_integrity: { status: ctx.stage5b.stage5b_tag_package ? "PASS" : "FAIL", package_present: Boolean(ctx.stage5b.stage5b_tag_package) } };
    }
  },
  {
    id: "stage5c_feature_inventory",
    label: "Stage 5C - Feature Inventory",
    stage_order: 9,
    artifact: "09-stage5c-feature-inventory.json",
    forensic_artifact: "39-stage5c-feature-inventory-forensic.json",
    required_input_keys: ["stage5b"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      ctx.stage5c = await runStage5CBatch4Pipeline({ adapterResult: ctx.adapterResult, runGeminiPool, logs: ctx.logs, logStage: liveLogStage, runId });
      ctx.adapterResult.stage5c_batch4 = ctx.stage5c;
      ctx.adapterResult.target_feature_profile_input.stage5c_batch4 = { stage5c_feature_inventory_package: ctx.stage5c.stage5c_feature_inventory_package, stage5c_validation: ctx.stage5c.stage5c_validation, stage5c_canonicalization_repair: ctx.stage5c.stage5c_canonicalization_repair };
      ctx.modelBackedStages.push("stage5c_feature_inventory");
      writeJson(this.artifact, ctx.stage5c);
      writeJson("05d-stage5c-feature-inventory.json", ctx.stage5c);
      return { input: ctx.stage5b, output: ctx.stage5c, usage_source: ctx.stage5c, validation: validationSummary(ctx.stage5c.stage5c_validation), handoff_integrity: { status: ctx.stage5c.stage5c_feature_inventory_package ? "PASS" : "FAIL", package_present: Boolean(ctx.stage5c.stage5c_feature_inventory_package) } };
    }
  },
  {
    id: "stage5d_data_touchpoints",
    label: "Stage 5D - Data Touchpoints",
    stage_order: 10,
    artifact: "10-stage5d-data-touchpoints.json",
    forensic_artifact: "40-stage5d-data-touchpoints-forensic.json",
    required_input_keys: ["stage5c"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      ctx.stage5d = await runStage5DBatch5Pipeline({ adapterResult: ctx.adapterResult, runGeminiPool, logs: ctx.logs, logStage: liveLogStage, runId });
      ctx.adapterResult.stage5d_batch5 = ctx.stage5d;
      ctx.adapterResult.target_feature_profile_input.stage5d_batch5 = { stage5d_data_touchpoint_package: ctx.stage5d.stage5d_data_touchpoint_package, stage5d_validation: ctx.stage5d.stage5d_validation, stage5d_data_touchpoints: ctx.stage5d.stage5d_data_touchpoints };
      ctx.modelBackedStages.push("stage5d_data_touchpoints");
      writeJson(this.artifact, ctx.stage5d);
      writeJson("05e-stage5d-data-touchpoints.json", ctx.stage5d);
      return { input: ctx.stage5c, output: ctx.stage5d, usage_source: ctx.stage5d, validation: validationSummary(ctx.stage5d.stage5d_validation), handoff_integrity: { status: ctx.stage5d.stage5d_data_touchpoint_package ? "PASS" : "FAIL", package_present: Boolean(ctx.stage5d.stage5d_data_touchpoint_package) } };
    }
  },
  {
    id: "stage5e_target_feature_profile",
    label: "Stage 5E - Target Feature Profile",
    stage_order: 11,
    artifact: "11-stage5e-target-feature-profile.json",
    forensic_artifact: "41-stage5e-target-feature-profile-forensic.json",
    required_input_keys: ["stage5d"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      ctx.stage5e = await runStage5EBatch6Pipeline({ adapterResult: ctx.adapterResult, companyProfile: ctx.companyProfile, logs: ctx.logs, logStage: liveLogStage, runId });
      ctx.adapterResult.stage5e_batch6 = ctx.stage5e;
      ctx.targetFeatureProfile = ctx.stage5e.target_feature_profile;
      ctx.modelBackedStages.push("stage5e_target_feature_profile");
      writeJson(this.artifact, ctx.stage5e);
      writeJson("05f-stage5e-target-feature-profile.json", ctx.stage5e);
      writeJson("05-target-feature-profile.json", ctx.targetFeatureProfile);
      return { input: ctx.stage5d, output: ctx.stage5e, usage_source: ctx.stage5e, validation: validationSummary(ctx.stage5e.stage5e_validation), handoff_integrity: { status: ctx.targetFeatureProfile ? "PASS" : "FAIL", canonical_handoff_key: "target_feature_profile", feature_count: asArray(ctx.targetFeatureProfile?.feature_inventory).length } };
    }
  },
  {
    id: "stage6a_legal_cartography",
    label: "Stage 6A - Legal Cartography",
    stage_order: 12,
    artifact: "12-stage6a-legal-cartography.json",
    forensic_artifact: "42-stage6a-legal-cartography-forensic.json",
    required_input_keys: ["targetFeatureProfile"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      ctx.stage6Input = buildStage6Input(ctx);
      ctx.stage6aStageResult = await runStage("stage6a_legal_document_cartography", ctx.stage6Input, {
        pool: process.env.LIVE_STAGE6A_POOL || process.env.LIVE_LEGAL_POOL || process.env.STAGE6A_POOL || process.env.STAGE6_POOL || "reasoning",
        maxOutputTokens: Number(process.env.LIVE_STAGE6A_MAX_OUTPUT_TOKENS || process.env.LIVE_LEGAL_MAX_OUTPUT_TOKENS || process.env.STAGE6A_MAX_OUTPUT_TOKENS || 24000),
        timeoutMs: Number(process.env.LIVE_STAGE6A_TIMEOUT_MS || process.env.LIVE_LEGAL_TIMEOUT_MS || process.env.STAGE6A_TIMEOUT_MS || 90000)
      });
      ctx.legalCartography = ctx.stage6aStageResult.stage6_review?.legal_document_cartography || null;
      ctx.modelBackedStages.push("stage6a_legal_cartography");
      writeJson(this.artifact, ctx.legalCartography);
      return { input: ctx.stage6Input, output: ctx.stage6aStageResult, usage_source: ctx.stage6aStageResult, validation: validationSummary(ctx.stage6aStageResult.validation, ctx.stage6aStageResult.stage6_guardrail), issue_sources: [ctx.stage6aStageResult.stage6_guardrail], handoff_integrity: { status: ctx.legalCartography ? "PASS" : "FAIL", canonical_handoff_key: "legal_cartography" } };
    }
  },
  {
    id: "stage6b_data_provenance",
    label: "Stage 6B - Data Provenance",
    stage_order: 13,
    artifact: "13-stage6b-data-provenance-profile.json",
    forensic_artifact: "43-stage6b-data-provenance-profile-forensic.json",
    required_input_keys: ["stage6aStageResult"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      ctx.stage6bInput = { ...ctx.stage6Input, stage6a_review: ctx.stage6aStageResult.stage6_review, legal_document_cartography: ctx.legalCartography };
      ctx.stage6bStageResult = await runStage6BDataProvenance({
        source_bundle: ctx.stage6bInput.source_bundle,
        target_profile: ctx.stage6bInput.target_profile,
        company_profile: ctx.stage6bInput.company_profile,
        target_feature_profile: ctx.stage6bInput.target_feature_profile,
        evidence_junction: ctx.stage6bInput.evidence_junction,
        legal_document_cartography: ctx.stage6bInput.legal_document_cartography,
        stage6a_review: ctx.stage6bInput.stage6a_review,
        runtime_options: {
          pool: process.env.LIVE_STAGE6B_POOL || process.env.STAGE6B_POOL || process.env.STAGE6_POOL || "reasoning",
          maxOutputTokens: Number(process.env.LIVE_STAGE6B_MAX_OUTPUT_TOKENS || process.env.STAGE6B_MAX_OUTPUT_TOKENS || 24000),
          timeoutMs: Number(process.env.LIVE_STAGE6B_TIMEOUT_MS || process.env.STAGE6B_TIMEOUT_MS || 90000)
        },
        env: process.env
      });
      if (!ctx.stage6bStageResult.ok) throw Object.assign(new Error(ctx.stage6bStageResult.error || "Stage 6B Data Provenance failed."), { result: ctx.stage6bStageResult });
      ctx.dataProvenanceProfile = ctx.stage6bStageResult.data_provenance_profile || ctx.stage6bStageResult.stage6_review?.data_provenance_profile || null;
      ctx.modelBackedStages.push("stage6b_data_provenance");
      writeJson(this.artifact, ctx.dataProvenanceProfile);
      return { input: ctx.stage6bInput, output: ctx.stage6bStageResult, usage_source: ctx.stage6bStageResult, validation: validationSummary(ctx.stage6bStageResult.validation, ctx.stage6bStageResult.stage6_guardrail), issue_sources: [ctx.stage6bStageResult.stage6_guardrail], handoff_integrity: { status: ctx.dataProvenanceProfile ? "PASS" : "FAIL", canonical_handoff_key: "data_provenance_profile" } };
    }
  },
  {
    id: "stage6_integrated_handoff_validation",
    label: "Stage 6 - Integrated Handoff Validation",
    stage_order: 14,
    artifact: "14-stage6-integrated-handoff-validation.json",
    forensic_artifact: "46-stage6-integrated-handoff-validation-forensic.json",
    required_input_keys: ["stage6bStageResult"],
    stop_stage_compatibility: ["6b", "stage6b"],
    async run(ctx) {
      ctx.stage6IntegratedArtifact = buildStage6IntegratedHandoffArtifact(
        { stage6a_review: ctx.stage6aStageResult.stage6_review, stage6b_review: ctx.stage6bStageResult.stage6_review },
        { run_id: `${runId}_stage6_integrated_handoff`, generated_at: nowIso(), stage6a_stage_id: ctx.stage6aStageResult.stage_id || "stage6a_legal_document_cartography", stage6b_stage_id: ctx.stage6bStageResult.stage_id || "stage6b_data_provenance" }
      );
      const schemaValidation = validateDiligenceStageOutput("stage6Review", ctx.stage6IntegratedArtifact.stage6_review);
      const guardrail = validateStage6ReviewGuardrail(ctx.stage6IntegratedArtifact.stage6_review, { input: ctx.stage6bInput, stageId: "stage6_integrated_handoff", semanticModelAttempted: true });
      ctx.stage6IntegratedValidation = { schemaValidation, guardrail };
      const output = { ok: schemaValidation.ok === true && guardrail.ok === true, stage6_integrated_artifact: ctx.stage6IntegratedArtifact, schemaValidation, guardrail };
      writeJson(this.artifact, output);
      if (!output.ok) throw Object.assign(new Error("Stage 6 integrated handoff validation failed."), { result: output });
      return { input: { stage6a_review: ctx.stage6aStageResult.stage6_review, stage6b_review: ctx.stage6bStageResult.stage6_review }, output, validation: validationSummary(schemaValidation, guardrail), issue_sources: [guardrail], handoff_integrity: { status: output.ok ? "PASS" : "FAIL", compatibility_adapter_only: true } };
    }
  }
];

async function runAuditStage(stage, ctx, recorder) {
  for (const key of stage.required_input_keys || []) if (ctx[key] == null) throw new Error(`${stage.id} missing required input: ${key}`);
  console.log(`::group::${stage.label}`);
  console.log(`::notice title=${stage.label} start::run_id=${runId}`);
  const started = Date.now();
  try {
    const result = await stage.run(ctx);
    const duration_ms = Date.now() - started;
    const entry = makeForensicEntry({
      stage: stage.id,
      stage_label: stage.label,
      input: result.input,
      output: result.output,
      validation: result.validation,
      issue_sources: result.issue_sources || [],
      handoff_integrity: result.handoff_integrity || {},
      source_coverage: result.source_coverage || {},
      usage_source: result.usage_source || result.output,
      canonical_output_pointer: stage.artifact,
      duration_ms
    });
    recorder.record(entry, stage.forensic_artifact);
    console.log(`::notice title=${stage.label} complete::status=${entry.status}; duration_ms=${duration_ms}; artifact=${stage.artifact}; token_usage=${JSON.stringify(entry.token_model_usage.totals)}`);
    if (entry.status === "FAIL") throw new Error(`${stage.label} validation failed`);
    console.log("::endgroup::");
    return entry;
  } catch (error) {
    const duration_ms = Date.now() - started;
    console.log(`::error title=${stage.label} failed::${error?.message || String(error)}; duration_ms=${duration_ms}; artifact=${stage.artifact}`);
    console.log("::endgroup::");
    throw error;
  }
}

async function main() {
  applyAuditRuntimeDefaults();
  clearAuditCaches();
  const recorder = makeStageRecorder();
  const ctx = {
    recorder,
    logs: [],
    modelBackedStages: [],
    legacyFallbackUsed: false,
    stage7Ran: false,
    stage8Ran: false,
    stage9Ran: false,
    stage10Ran: false
  };
  let lastSuccessfulStage = null;

  try {
    assertRuntimePolicy();
    const normalized = normalizeInput({ primary_url: targetUrl, company_name: companyName });
    ctx.targetInput = normalized.targetInput;
    ctx.normalizedTargetUrl = normalized.targetUrl;
    ctx.documentText = normalized.documentText;
    ctx.documentLabel = normalized.documentLabel;

    writeJson("00-audit-request.json", {
      ok: true,
      audit_phase: "full_live_runtime_audit",
      execution_model: "stage_registry_live_runtime_path_v1",
      github_run_id: githubRunId,
      run_id: runId,
      runtime_url: runtimeUrl,
      target_input: ctx.targetInput,
      audit_stop_stage: auditStopStage,
      endpoint_policy: "deployed_runtime_smoke_plus_public_live_stage_functions",
      status_endpoint: STATUS_ENDPOINT,
      forbidden_endpoint: FORBIDDEN_STAGE_ENDPOINT,
      stage_registry: AUDIT_STAGE_REGISTRY.map(({ id, label, stage_order, artifact, forensic_artifact, required_input_keys, stop_stage_compatibility }) => ({ id, label, stage_order, artifact, forensic_artifact, required_input_keys, stop_stage_compatibility }))
    });

    const runtimeStatusResponse = await getJson(`${runtimeUrl}${STATUS_ENDPOINT}`, { "x-runtime-access-token": token });
    writeJson("00-runtime-status.json", { status: runtimeStatusResponse.status, ok: runtimeStatusResponse.ok, body: runtimeStatusResponse.body });
    if (!runtimeStatusResponse.ok || runtimeStatusResponse.body?.ok === false) throw Object.assign(new Error("Runtime status check failed."), { result: runtimeStatusResponse });

    const stopOrder = STAGE_ORDER.get(auditStopStage);
    for (const stage of AUDIT_STAGE_REGISTRY) {
      if (stage.stage_order > stopOrder) break;
      await runAuditStage(stage, ctx, recorder);
      lastSuccessfulStage = stage.id;
    }

    const failedChecks = validatePassConditions(ctx);
    writeStageMatrices(recorder.entries);
    writeText("20-summary.md", createSummaryMarkdown({ ctx, failedChecks }));
    const manifest = writeManifest({ ok: failedChecks.length === 0, execution_model: "stage_registry_live_runtime_path_v1", failed_checks: failedChecks });
    writeLiveProof({ ctx, manifestPath: path.join(outputRoot, "21-artifact-manifest.json") });
    recorder.writeIndex({ completed: failedChecks.length === 0 });

    if (failedChecks.length) {
      const error = new Error("Full live runtime audit failed pass conditions.");
      writeAuditFailure({ failed_stage: "canonical_validation", error, last_successful_stage: lastSuccessfulStage, detail: { failed_checks: failedChecks }, recorder });
      process.exit(1);
    }

    console.log(JSON.stringify({
      ok: true,
      phase: "full_live_runtime_audit",
      execution_model: "stage_registry_live_runtime_path_v1",
      runtime_url: runtimeUrl,
      target_url: targetUrl,
      company_name: companyName,
      run_id: runId,
      audit_stop_stage: auditStopStage,
      legacy_fallback_used: false,
      artifact_dir: outputRoot,
      artifact_manifest: manifest.files.map((file) => file.name)
    }, null, 2));
  } catch (error) {
    writeAuditFailure({ failed_stage: lastSuccessfulStage ? `after_${lastSuccessfulStage}` : "startup", error, last_successful_stage: lastSuccessfulStage, recorder });
    process.exit(1);
  }
}

await main();
