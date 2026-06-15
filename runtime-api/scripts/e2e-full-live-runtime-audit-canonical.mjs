#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { buildStage6IntegratedHandoffArtifact } from "../src/diligence/stage6IntegratedHandoffBuilder.js";
import { validateStage6ReviewGuardrail } from "../src/diligence/guardrails/stage6ReviewGuardrail.js";
import { runStage6BDataProvenance } from "../src/diligence/stage6bDataProvenanceRunner.js";
import { validateDiligenceStageOutput } from "../src/diligence/stageSchemaValidator.js";
import { assertWindowIsVerbatim, buildStage5CanonicalInput, runStage5Runtime } from "../src/diligence/stage5/stage5.runtime.js";
import { runGeminiPool } from "../src/gemini/geminiPool.js";
import { buildLiveEvidence, normalizeInput } from "../src/live/liveEvidenceAndProfilePipeline.js";
import { runStage } from "../src/live/liveStage6To8Pipeline.js";
import { logStage as liveLogStage } from "../src/live/liveRunShared.js";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const STATUS_ENDPOINT = "/v1/runtime-status";
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

const REQUIRED_TRUE_FLAGS = ["STAGE5_CANONICAL_ENABLED", "STAGE5_CANONICAL_BLOCKING"];

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function safeJson(value) { return JSON.stringify(value ?? null, null, 2); }
function writeText(name, text) { ensureDir(outputRoot); const filePath = path.join(outputRoot, name); fs.writeFileSync(filePath, text, "utf8"); return filePath; }
function writeJson(name, value) { return writeText(name, safeJson(value)); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function asText(value) { return typeof value === "string" ? value.trim() : ""; }
function nowIso() { return new Date().toISOString(); }
function fileBytes(filePath) { return fs.statSync(filePath).size; }
function fileSha256(filePath) { return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex"); }
function statusFromOk(ok) { return ok ? "PASS" : "FAIL"; }

function appendSummary(text) {
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`, "utf8");
}

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
    STAGE5_CANONICAL_ENABLED: "true",
    STAGE5_CANONICAL_BLOCKING: "true",
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
  const oldStage5Flags = ["A", "B", "C", "D", "E"].flatMap((letter, index) => {
    const oldBatch = index + 2;
    return [`STAGE5${letter}_BATCH${oldBatch}_ENABLED`, `STAGE5${letter}_BATCH${oldBatch}_BLOCKING`];
  }).filter((key) => process.env[key] !== undefined);
  if (oldStage5Flags.length) throw new Error(`Old Stage 5 batch flag(s) are not allowed in canonical audit: ${oldStage5Flags.join(", ")}`);
  if (String(process.env.STAGE5_LEGACY_FALLBACK || "").toLowerCase() !== "false") throw new Error("STAGE5_LEGACY_FALLBACK must be false for this audit.");
  if (!["6b", "stage6b"].includes(auditStopStage)) throw new Error(`Unsupported AUDIT_STOP_STAGE for canonical full audit: ${auditStopStage}`);
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

function buildStage5Input({ sourceBundle, evidenceJunction, companyProfile, targetInput }) {
  return {
    source_bundle: sourceBundle,
    evidence_junction: evidenceJunction,
    target_profile_ref: {
      target_profile_version: companyProfile?.target_profile_version || "target_profile_v2",
      brand_name: companyProfile?.identity?.brand_name || targetInput.company_name || "Unknown target",
      legal_name: companyProfile?.identity?.legal_name || "",
      domain: companyProfile?.identity?.domain || companyProfile?.identity?.website || targetInput.primary_url || ""
    }
  };
}

function collectStage5Windows(stage5Result = {}) {
  const substage = stage5Result.substage_outputs || {};
  return [
    ...asArray(substage.stage5a?.feature_evidence_windows),
    ...asArray(substage.stage5b?.supplemental_evidence_windows),
    ...asArray(substage.stage5c?.supplemental_evidence_windows)
  ];
}

function buildStage5SourceWindowLedger({ canonicalInput, stage5Result }) {
  const sourcesById = new Map(asArray(canonicalInput?.primary_evidence?.sources).map((source) => [source.source_id, source]));
  return collectStage5Windows(stage5Result).map((window) => {
    const source = sourcesById.get(window.source_id);
    let verbatim = false;
    try {
      assertWindowIsVerbatim(source, window);
      verbatim = true;
    } catch {
      verbatim = false;
    }
    return {
      window_id: window.window_id,
      source_id: window.source_id,
      source_url: window.source_url,
      source_title: window.source_title,
      char_start: window.char_start,
      char_end: window.char_end,
      source_sha256: window.source_sha256,
      created_by_substage: window.created_by_substage,
      used_for: window.used_for,
      selection_reason: window.selection_reason,
      verbatim_text_length: String(window.verbatim_text || "").length,
      exact_substring_verified: verbatim
    };
  });
}

function buildStage5AuditEvidence({ canonicalInput, stage5Result, companyProfile, targetFeatureProfile }) {
  const sources = asArray(canonicalInput?.primary_evidence?.sources);
  const ledger = buildStage5SourceWindowLedger({ canonicalInput, stage5Result });
  const substage = stage5Result.substage_outputs || {};
  const windowIds = new Set(ledger.map((row) => row.window_id));
  const citesWindows = (rows, key) => asArray(rows).every((row) => asArray(row?.[key]).length > 0 && asArray(row?.[key]).every((ref) => windowIds.has(ref)));
  return {
    stage5_runtime: "runStage5Runtime",
    stage5_input_source: "live_pipeline_sourceBundle_evidenceJunction_companyProfile",
    legacy_adapter_used: false,
    substages: [
      "5A Product Function Discovery",
      "5B Archetype Surface Tagging",
      "5C Complete Feature Record Builder",
      "5D Final target_feature_profile Integrator"
    ],
    clean_text_lossless_present: sources.length > 0 && sources.every((source) => typeof source.clean_text_lossless === "string" && source.clean_text_lossless.length > 0),
    source_sha256_present: sources.length > 0 && sources.every((source) => Boolean(source.source_sha256)),
    all_windows_verbatim: ledger.length > 0 && ledger.every((row) => row.exact_substring_verified),
    metadata_not_primary_evidence: sources.every((source) => source.clean_text_lossless !== source.source_url && source.clean_text_lossless !== source.source_title),
    index_not_primary_evidence: asArray(canonicalInput?.reference?.navigation_index_sidecar).every((row) => row.verbatim_text === undefined && row.clean_text_lossless === undefined),
    stage5a_output_cited_windows: citesWindows(substage.stage5a?.admitted_functions, "source_window_refs"),
    stage5b_output_cited_windows: citesWindows(substage.stage5b?.feature_tags, "source_window_refs"),
    stage5c_output_cited_windows: citesWindows(substage.stage5c?.complete_feature_records, "evidence_window_refs"),
    stage5d_final_profile_schema_passed: substage.stage5d?.validation?.ok === true || targetFeatureProfile?.classification_quality?.reinvestigation_required === true,
    external_handoff_ok: Boolean(companyProfile && targetFeatureProfile && !targetFeatureProfile.substage_outputs && !targetFeatureProfile.stage5a),
    source_window_count: ledger.length,
    primary_source_count: sources.length,
    feature_count: asArray(targetFeatureProfile?.feature_inventory).length,
    reinvestigation_required: stage5Result?.validation?.reinvestigation_required === true,
    reinvestigation_request_count: asArray(stage5Result?.validation?.reinvestigation_requests).length
  };
}

function writeStage5CanonicalArtifacts(ctx) {
  const substage = ctx.stage5Result.substage_outputs || {};
  const ledger = buildStage5SourceWindowLedger({ canonicalInput: ctx.stage5CanonicalInput, stage5Result: ctx.stage5Result });
  ctx.stage5SourceWindowLedger = ledger;
  ctx.stage5AuditEvidence = buildStage5AuditEvidence({
    canonicalInput: ctx.stage5CanonicalInput,
    stage5Result: ctx.stage5Result,
    companyProfile: ctx.companyProfile,
    targetFeatureProfile: ctx.targetFeatureProfile
  });
  writeJson("stage5-canonical-runtime-summary.json", {
    ok: ctx.stage5Result.ok === true,
    stage5_version: ctx.stage5Result.stage5_version,
    runtime_entrypoint: "runStage5Runtime",
    source_input_contract: "same_as_live_pipeline_stage5Input_source_bundle_evidence_junction_target_profile_ref",
    legacy_adapter_used: false,
    external_handoff_shape: "{ companyProfile, targetFeatureProfile }",
    substage_flow: ctx.stage5AuditEvidence.substages,
    validation: ctx.stage5Result.validation,
    evidence: ctx.stage5AuditEvidence
  });
  writeJson("stage5a-product-function-discovery.json", substage.stage5a);
  writeJson("stage5b-archetype-surface-tagging.json", substage.stage5b);
  writeJson("stage5c-complete-feature-records.json", substage.stage5c);
  writeJson("stage5d-target-feature-profile-integrator.json", substage.stage5d);
  writeJson("stage5-final-target-feature-profile.json", ctx.targetFeatureProfile);
  writeJson("stage5-lossless-custody-manifest.json", ctx.stage5Result.custody_manifest);
  writeJson("stage5-source-window-ledger.json", ledger);
  writeJson("stage5-validation-summary.json", ctx.stage5AuditEvidence);
}

function writeManifest(extra = {}) {
  const files = fs.existsSync(outputRoot) ? fs.readdirSync(outputRoot).filter((name) => name !== "21-artifact-manifest.json").sort() : [];
  const manifest = {
    ok: extra.ok !== false,
    audit_phase: "full_live_runtime_audit_canonical",
    generated_at: nowIso(),
    github_run_id: githubRunId,
    runtime_url: runtimeUrl,
    target_url: targetUrl,
    company_name: companyName,
    run_id: runId,
    audit_stop_stage: auditStopStage,
    legacy_fallback_used: false,
    legacy_stage5_adapter_used: false,
    ...extra,
    files: files.map((name) => {
      const filePath = path.join(outputRoot, name);
      return { name, bytes: fileBytes(filePath), sha256: fileSha256(filePath) };
    })
  };
  writeJson("21-artifact-manifest.json", manifest);
  return manifest;
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

function validatePassConditions(ctx) {
  const failed = [];
  const sourceRecords = asArray(ctx.sourceBundle?.raw_footprint?.source_records);
  if (!sourceRecords.length) failed.push("source_discovery_or_capture_returned_no_sources");
  if (!ctx.evidenceJunction || !Object.keys(ctx.evidenceJunction).length) failed.push("missing_evidence_junction");
  if (!ctx.companyProfile || !Object.keys(ctx.companyProfile).length) failed.push("missing_target_profile");
  if (ctx.stage5Result?.stage5_version !== "stage5_lossless_windowed_runtime_v1") failed.push("missing_stage5_canonical_runtime_result");
  if (!ctx.stage5a?.admitted_functions?.length && ctx.stage5a?.validation?.reinvestigation_required !== true) failed.push("missing_stage5a_product_function_discovery");
  if (!ctx.stage5b?.feature_tags?.length && ctx.stage5b?.validation?.reinvestigation_required !== true) failed.push("missing_stage5b_archetype_surface_tagging");
  if (!ctx.stage5c?.complete_feature_records?.length && ctx.stage5c?.validation?.reinvestigation_required !== true) failed.push("missing_stage5c_complete_feature_records");
  if (ctx.stage5d?.validation?.ok !== true && ctx.targetFeatureProfile?.classification_quality?.reinvestigation_required !== true) failed.push("stage5d_target_feature_profile_schema_invalid");
  if (!ctx.stage5AuditEvidence?.clean_text_lossless_present) failed.push("stage5_clean_text_lossless_missing");
  if (!ctx.stage5AuditEvidence?.source_sha256_present) failed.push("stage5_source_sha256_missing");
  if (!ctx.stage5AuditEvidence?.all_windows_verbatim && !ctx.stage5AuditEvidence?.reinvestigation_required) failed.push("stage5_source_windows_not_verbatim");
  if (!ctx.stage5AuditEvidence?.metadata_not_primary_evidence) failed.push("stage5_metadata_used_as_primary_evidence");
  if (!ctx.stage5AuditEvidence?.index_not_primary_evidence) failed.push("stage5_index_used_as_primary_evidence");
  if (!ctx.stage5AuditEvidence?.external_handoff_ok) failed.push("stage5_external_handoff_shape_changed");
  if (!ctx.targetFeatureProfile || !Object.keys(ctx.targetFeatureProfile).length) failed.push("missing_stage5_target_feature_profile");
  if (!ctx.legalCartography || !Object.keys(ctx.legalCartography).length) failed.push("missing_stage6a_legal_cartography");
  if (!ctx.dataProvenanceProfile || !Object.keys(ctx.dataProvenanceProfile).length) failed.push("missing_stage6b_data_provenance_profile");
  if (ctx.stage6IntegratedValidation?.schemaValidation?.ok !== true || ctx.stage6IntegratedValidation?.guardrail?.ok !== true) failed.push("stage6_integrated_handoff_validation_failed");
  if (ctx.legacyFallbackUsed !== false) failed.push("legacy_stage5_fallback_used_or_unknown");
  return failed;
}

function writeStageSummary(ctx, failedChecks = []) {
  const rows = ctx.stage_rows || [];
  const markdown = `# Runtime API Full Live Audit — Canonical Stage 5 Path\n\n` +
    `- Runtime URL: ${runtimeUrl}\n` +
    `- Target: ${companyName} (${targetUrl})\n` +
    `- Run ID: ${runId}\n` +
    `- Stage 5 runtime: runStage5Runtime\n` +
    `- Stage 5 input: live sourceBundle + evidenceJunction + companyProfile, no legacy adapter\n` +
    `- Failed checks: ${failedChecks.length ? failedChecks.join(", ") : "none"}\n\n` +
    `| Stage | Status | Artifact | Notes |\n|---|---:|---|---|\n` +
    rows.map((row) => `| ${row.stage} | ${row.status} | ${row.artifact} | ${row.notes || ""} |`).join("\n") + "\n";
  writeText("20-summary.md", markdown);
  appendSummary(markdown);
}

function recordStage(ctx, stage, status, artifact, notes = "") {
  ctx.stage_rows.push({ stage, status, artifact, notes });
  console.log(`::notice title=${stage}::status=${status}; artifact=${artifact}; ${notes}`);
}

async function main() {
  applyAuditRuntimeDefaults();
  clearAuditCaches();
  const ctx = { logs: [], modelBackedStages: [], legacyFallbackUsed: false, stage_rows: [] };
  try {
    assertRuntimePolicy();
    const normalized = normalizeInput({ primary_url: targetUrl, company_name: companyName });
    ctx.targetInput = normalized.targetInput;
    ctx.normalizedTargetUrl = normalized.targetUrl;
    ctx.documentText = normalized.documentText;
    ctx.documentLabel = normalized.documentLabel;

    writeJson("00-audit-request.json", {
      ok: true,
      audit_phase: "full_live_runtime_audit_canonical",
      execution_model: "public_live_pipeline_canonical_stage5_runtime_v2",
      github_run_id: githubRunId,
      run_id: runId,
      runtime_url: runtimeUrl,
      target_input: ctx.targetInput,
      audit_stop_stage: auditStopStage,
      stage5_legacy_adapter_used: false,
      stage5_runtime_entrypoint: "runStage5Runtime"
    });

    const runtimeStatusResponse = await getJson(`${runtimeUrl}${STATUS_ENDPOINT}`, { "x-runtime-access-token": token });
    writeJson("00-runtime-status.json", { status: runtimeStatusResponse.status, ok: runtimeStatusResponse.ok, body: runtimeStatusResponse.body });
    if (!runtimeStatusResponse.ok || runtimeStatusResponse.body?.ok === false) throw Object.assign(new Error("Runtime status check failed."), { result: runtimeStatusResponse });
    recordStage(ctx, "Runtime status smoke", "PASS", "00-runtime-status.json");

    const evidence = await buildLiveEvidence({ targetInput: ctx.targetInput, targetUrl: ctx.normalizedTargetUrl, documentText: ctx.documentText, documentLabel: ctx.documentLabel, hasDoc: Boolean(ctx.documentText), options: {}, logs: ctx.logs, runId });
    ctx.sourceBundle = evidence.sourceBundle;
    ctx.evidenceJunction = evidence.evidenceJunction;
    ctx.reviewerSource = evidence.reviewerSource;
    writeJson("01-source-discovery.json", { ok: true, source_review: ctx.sourceBundle?.source_review || ctx.sourceBundle?.raw_footprint?.source_review || {}, diagnostics: ctx.sourceBundle?.diagnostics || null, source_count: asArray(ctx.sourceBundle?.raw_footprint?.source_records).length });
    writeJson("02-source-capture.json", { ok: true, raw_footprint: ctx.sourceBundle.raw_footprint, reviewer_source: ctx.reviewerSource || null });
    writeJson("03-evidence-refiner-source-bundle.json", ctx.sourceBundle);
    writeJson("04-evidence-junction.json", ctx.evidenceJunction);
    recordStage(ctx, "Stage 1-4 live evidence", "PASS", "01/02/03/04 artifacts", `sources=${asArray(ctx.sourceBundle?.raw_footprint?.source_records).length}`);

    liveLogStage(ctx.logs, "company_profile", "running");
    const targetProfileSources = stage4SourceRecords(ctx.sourceBundle);
    const companyProfileSources = stage4SourceRecords(ctx.sourceBundle, "company_profile");
    if (!targetProfileSources.length) throw new Error("No Stage 4 target profile source records available.");
    const companyStage = await runStage("company_profile", {
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
    ctx.companyStage = companyStage;
    ctx.companyProfile = companyStage.company_profile;
    ctx.modelBackedStages.push("target_profile");
    liveLogStage(ctx.logs, "company_profile", "complete", { company_name: ctx.companyProfile?.identity?.brand_name || null, target_profile_sources: targetProfileSources.length, company_sources: companyProfileSources.length });
    writeJson("05-target-profile.json", ctx.companyProfile);
    recordStage(ctx, "Stage 4 company profile", statusFromOk(Boolean(ctx.companyProfile)), "05-target-profile.json");

    ctx.stage5Input = buildStage5Input({ sourceBundle: ctx.sourceBundle, evidenceJunction: ctx.evidenceJunction, companyProfile: ctx.companyProfile, targetInput: ctx.targetInput });
    ctx.stage5CanonicalInput = buildStage5CanonicalInput({ companyProfile: ctx.companyProfile, stage5Input: ctx.stage5Input });
    writeJson("06-stage5-input-custody-package.json", {
      ok: true,
      artifact_type: "stage5_input_custody_package",
      legacy_adapter_used: false,
      source_input_contract: "same_as_live_pipeline_stage5Input_source_bundle_evidence_junction_target_profile_ref",
      stage5_input_version: ctx.stage5CanonicalInput.stage5_input_version,
      target_profile_ref: ctx.stage5CanonicalInput.target_profile_ref,
      primary_source_count: asArray(ctx.stage5CanonicalInput.primary_evidence?.sources).length,
      navigation_index_count: asArray(ctx.stage5CanonicalInput.reference?.navigation_index_sidecar).length,
      duplicate_lossless_source_report: ctx.stage5CanonicalInput.reference?.duplicate_lossless_source_report || []
    });
    recordStage(ctx, "Stage 5 Input Custody Package", "PASS", "06-stage5-input-custody-package.json", "no legacy adapter");

    ctx.stage5Result = await runStage5Runtime({
      companyProfile: ctx.companyProfile,
      stage5Input: ctx.stage5Input,
      runContext: { runId },
      modelPorts: { runGeminiPool },
      registryPorts: {},
      schemaValidator: null
    });
    ctx.stage5a = ctx.stage5Result.substage_outputs.stage5a;
    ctx.stage5b = ctx.stage5Result.substage_outputs.stage5b;
    ctx.stage5c = ctx.stage5Result.substage_outputs.stage5c;
    ctx.stage5d = ctx.stage5Result.substage_outputs.stage5d;
    ctx.targetFeatureProfile = ctx.stage5Result.target_feature_profile;
    ctx.modelBackedStages.push("stage5_canonical_runtime");
    writeStage5CanonicalArtifacts(ctx);
    writeJson("07-stage5-canonical-runtime.json", ctx.stage5Result);
    writeJson("05-target-feature-profile.json", ctx.targetFeatureProfile);
    recordStage(ctx, "Stage 5 canonical runtime", ctx.stage5Result.ok ? "PASS" : "FAIL", "07-stage5-canonical-runtime.json", `windows=${ctx.stage5AuditEvidence.source_window_count}; reinvestigation=${ctx.stage5AuditEvidence.reinvestigation_request_count}`);

    ctx.stage6Input = buildStage6Input(ctx);
    ctx.stage6aStageResult = await runStage("stage6a_legal_document_cartography", ctx.stage6Input, {
      pool: process.env.LIVE_STAGE6A_POOL || process.env.LIVE_LEGAL_POOL || process.env.STAGE6A_POOL || process.env.STAGE6_POOL || "reasoning",
      maxOutputTokens: Number(process.env.LIVE_STAGE6A_MAX_OUTPUT_TOKENS || process.env.LIVE_LEGAL_MAX_OUTPUT_TOKENS || process.env.STAGE6A_MAX_OUTPUT_TOKENS || 24000),
      timeoutMs: Number(process.env.LIVE_STAGE6A_TIMEOUT_MS || process.env.LIVE_LEGAL_TIMEOUT_MS || process.env.STAGE6A_TIMEOUT_MS || 90000)
    });
    ctx.legalCartography = ctx.stage6aStageResult.stage6_review?.legal_document_cartography || null;
    ctx.modelBackedStages.push("stage6a_legal_cartography");
    writeJson("12-stage6a-legal-cartography.json", ctx.legalCartography);
    recordStage(ctx, "Stage 6A Legal Cartography", statusFromOk(Boolean(ctx.legalCartography)), "12-stage6a-legal-cartography.json");

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
    writeJson("13-stage6b-data-provenance-profile.json", ctx.dataProvenanceProfile);
    recordStage(ctx, "Stage 6B Data Provenance", statusFromOk(Boolean(ctx.dataProvenanceProfile)), "13-stage6b-data-provenance-profile.json");

    ctx.stage6IntegratedArtifact = buildStage6IntegratedHandoffArtifact(
      { stage6a_review: ctx.stage6aStageResult.stage6_review, stage6b_review: ctx.stage6bStageResult.stage6_review },
      { run_id: `${runId}_stage6_integrated_handoff`, generated_at: nowIso(), stage6a_stage_id: ctx.stage6aStageResult.stage_id || "stage6a_legal_document_cartography", stage6b_stage_id: ctx.stage6bStageResult.stage_id || "stage6b_data_provenance" }
    );
    const schemaValidation = validateDiligenceStageOutput("stage6Review", ctx.stage6IntegratedArtifact.stage6_review);
    const guardrail = validateStage6ReviewGuardrail(ctx.stage6IntegratedArtifact.stage6_review, { input: ctx.stage6bInput, stageId: "stage6_integrated_handoff", semanticModelAttempted: true });
    ctx.stage6IntegratedValidation = { schemaValidation, guardrail };
    const integratedOutput = { ok: schemaValidation.ok === true && guardrail.ok === true, stage6_integrated_artifact: ctx.stage6IntegratedArtifact, schemaValidation, guardrail };
    writeJson("14-stage6-integrated-handoff-validation.json", integratedOutput);
    if (!integratedOutput.ok) throw Object.assign(new Error("Stage 6 integrated handoff validation failed."), { result: integratedOutput });
    recordStage(ctx, "Stage 6 Integrated Handoff", "PASS", "14-stage6-integrated-handoff-validation.json");

    const failedChecks = validatePassConditions(ctx);
    writeStageSummary(ctx, failedChecks);
    const manifest = writeManifest({ ok: failedChecks.length === 0, execution_model: "public_live_pipeline_canonical_stage5_runtime_v2", failed_checks: failedChecks });
    writeJson("00-live-run-proof.json", {
      github_run_id: githubRunId,
      runtime_url: runtimeUrl,
      target_url: targetUrl,
      run_id: runId,
      audit_stop_stage: auditStopStage,
      cache_cleared_at: cacheClearedAt,
      legacy_fallback_used: false,
      legacy_stage5_adapter_used: false,
      stage5_runtime: "runStage5Runtime",
      stage5_input_contract: "live_pipeline_stage5Input_source_bundle_evidence_junction_target_profile_ref",
      stage5_substages: ["5A Product Function Discovery", "5B Archetype Surface Tagging", "5C Complete Feature Record Builder", "5D Final target_feature_profile Integrator"],
      model_backed_stages: ctx.modelBackedStages,
      artifact_manifest_path: path.join(outputRoot, "21-artifact-manifest.json")
    });
    if (failedChecks.length) {
      writeJson("99-failure.json", { ok: false, failed_stage: "canonical_validation", failed_checks: failedChecks, available_artifacts: fs.readdirSync(outputRoot).sort() });
      throw new Error(`Canonical full live audit failed: ${failedChecks.join(", ")}`);
    }

    console.log(JSON.stringify({
      ok: true,
      phase: "full_live_runtime_audit_canonical",
      execution_model: "public_live_pipeline_canonical_stage5_runtime_v2",
      runtime_url: runtimeUrl,
      target_url: targetUrl,
      company_name: companyName,
      run_id: runId,
      audit_stop_stage: auditStopStage,
      legacy_stage5_adapter_used: false,
      artifact_dir: outputRoot,
      artifact_manifest: manifest.files.map((file) => file.name)
    }, null, 2));
  } catch (error) {
    const payload = { ok: false, artifact_type: "full_live_runtime_audit_canonical_failure", generated_at: nowIso(), run_id: runId, audit_stop_stage: auditStopStage, error: error?.message || String(error), detail: error?.result || null, available_artifacts: fs.existsSync(outputRoot) ? fs.readdirSync(outputRoot).sort() : [] };
    writeJson("audit-failure.json", payload);
    writeJson("99-failure.json", payload);
    writeManifest({ ok: false, failure: payload.error });
    console.log(`::error title=canonical full live runtime audit failed::${payload.error}`);
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }
}

await main();
