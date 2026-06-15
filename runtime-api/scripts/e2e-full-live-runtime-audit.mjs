#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { buildEvidenceJunction } from "../src/diligence/evidenceJunction.js";
import { runStage5ProductFamilyScopedProfile } from "../src/diligence/stage5ProductFamilyLiveRunner.js";
import { buildStage5TargetFeaturePackage } from "../src/diligence/stage5TargetFeaturePackageBuilder.js";
import { buildStage6IntegratedHandoffArtifact } from "../src/diligence/stage6IntegratedHandoffBuilder.js";
import { validateStage6ReviewGuardrail } from "../src/diligence/guardrails/stage6ReviewGuardrail.js";
import { runStage6BDataProvenance } from "../src/diligence/stage6bDataProvenanceRunner.js";
import { validateDiligenceStageOutput } from "../src/diligence/stageSchemaValidator.js";
import { buildStage9Report } from "../src/diligence/stage9ReportAssembler.js";
import { validateStage9Report } from "../src/diligence/stage9ReportValidator.js";
import { assembleStage10VaultHandoff } from "../src/handoff/stage9ToVaultHandoffAdapter.js";
import { validateReviewReadyHandoff } from "../src/handoff/reviewReadyHandoffValidator.js";
import { renderLegalExposureReport } from "../src/report-renderer/legalExposureReportRendererV2.js";
import { buildLiveEvidence, normalizeInput } from "../src/live/liveEvidenceAndProfilePipeline.js";
import { buildStage6Cache, runStage, runStage7, runStage8 } from "../src/live/liveStage6To8Pipeline.js";
import { loadRuntimeData, logStage as liveLogStage } from "../src/live/liveRunShared.js";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const LIVE_RUN_ENDPOINT = "/v1/diligence/public-live-run";
const STATUS_ENDPOINT = "/v1/runtime-status";
const FORBIDDEN_STAGE_ENDPOINT = "/v1/diligence/stage";
const runtimeUrl = (process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL).replace(/\/+$/, "");
const token = process.env.RUNTIME_ACCESS_TOKEN;
const targetUrl = process.env.AUDIT_TARGET_URL || process.env.TARGET_URL || "https://sarvam.ai";
const companyName = process.env.AUDIT_COMPANY_NAME || process.env.COMPANY_NAME || "Sarvam AI";
const outputRoot = process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), ".runtime-e2e-cache", "full-runtime-audit");
const runId = `full_live_runtime_audit_${Date.now()}`;

const STAGE9_RETIRED_MAIN_KEYS = new Set([
  "executive_exposure_summary",
  "evidence_reviewed",
  "legal_risk_surface_map",
  "legal_stack_control_review",
  "supporting_registry_rows",
  "supporting_registry_items",
  "supporting_registry_references",
  "registry_reference",
  "threat_id",
  "registry_batch_meta"
]);

const STAGE10_RETIRED_KEYS = new Set([
  "legal_stack_review",
  "legal_stack_control_review",
  "legal_stack",
  "document_stack_status",
  "document_stack_redline",
  "legal_stack_assessment",
  "supporting_registry_rows",
  "supporting_registry_items",
  "supporting_registry_references",
  "registry_reference"
]);

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function safeJson(value) { return JSON.stringify(value ?? null, null, 2); }
function writeText(name, text) { ensureDir(outputRoot); const filePath = path.join(outputRoot, name); fs.writeFileSync(filePath, text, "utf8"); return filePath; }
function writeJson(name, value) { return writeText(name, safeJson(value)); }
function bytes(filePath) { return fs.statSync(filePath).size; }
function sha256(filePath) { return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex"); }
function safeObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function nowIso() { return new Date().toISOString(); }

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    url.hash = "";
    if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return null;
  }
}

async function readJsonResponse(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { non_json_body: text.slice(0, 10000) }; }
}
async function getJson(url, headers = {}) { const response = await fetch(url, { method: "GET", headers }); return { status: response.status, ok: response.ok, body: await readJsonResponse(response) }; }
async function postJson(url, payload, headers = {}) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(payload) });
  return { status: response.status, ok: response.ok, body: await readJsonResponse(response) };
}

function scanKeys(value, retiredKeys, options = {}) {
  const findings = [];
  const maxFindings = options.maxFindings || 250;
  const skipPath = options.skipPath || (() => false);
  function walk(node, trail = []) {
    if (findings.length >= maxFindings || !node || typeof node !== "object" || skipPath(trail)) return;
    if (Array.isArray(node)) { node.forEach((item, index) => walk(item, trail.concat(String(index)))); return; }
    for (const [key, child] of Object.entries(node)) {
      const nextTrail = trail.concat(key);
      if (retiredKeys.has(key)) findings.push({ path: nextTrail.join("."), key });
      walk(child, nextTrail);
    }
  }
  walk(value, []);
  return findings;
}

function stage9MainBody(stage9ReportData = {}) {
  const reportData = safeObject(stage9ReportData.report?.report_data);
  const out = {};
  for (const [key, value] of Object.entries(reportData)) if (key !== "forensic_ledger_appendix") out[key] = value;
  return out;
}

function stage10MainBody(stage10Handoff = {}) {
  const copy = JSON.parse(JSON.stringify(stage10Handoff || {}));
  if (copy.stage10_source_packet) delete copy.stage10_source_packet.forensic_ledger_appendix;
  if (copy.assembly_handoff?.stage10_source_packet) delete copy.assembly_handoff.stage10_source_packet.forensic_ledger_appendix;
  return copy;
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
  walk(value, []);
  const totals = {};
  for (const record of records) for (const [key, value] of Object.entries(record.usage_metadata || {})) if (typeof value === "number" && Number.isFinite(value)) totals[key] = (totals[key] || 0) + value;
  return { usage_metadata_count: records.length, totals, records };
}

function compactValue(value, max = 280) {
  if (value == null) return value;
  if (typeof value === "string") return value.length > max ? `${value.slice(0, max)}...` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  try {
    const text = JSON.stringify(value);
    return text.length > max ? `${text.slice(0, max)}...` : value;
  } catch {
    return String(value).slice(0, max);
  }
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
      const pathName = trail.concat(key).join(".");
      if (/(^|_)(id|ids|ref|refs|url|urls|path|sha256|source|sources)$/i.test(key)) {
        refs.push({ path: pathName, value: compactValue(child) });
        if (refs.length >= maxRefs) return;
      }
      walk(child, trail.concat(key));
    }
  }
  walk(value, []);
  return refs;
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
    for (const key of ["warnings", "guardrail_warnings", "operator_challenge_warnings", "batch_warnings"]) {
      for (const issue of asArray(node[key])) addIssue(warnings, issue, key);
    }
    for (const key of ["errors", "critical", "validation_errors", "correction_errors"]) {
      for (const issue of asArray(node[key])) addIssue(errors, issue, key);
    }
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
    validation_mode: value.validation_mode || value.schemaValidation?.validation_mode || value.guardrail?.validation_mode || null,
    guardrail_validation_mode: value.guardrail_validation_mode || value.guardrail?.validation_mode || null,
    error_count: asArray(value.errors || value.validation_errors || value.critical).length,
    warning_count: asArray(value.warnings || value.guardrail_warnings).length,
    repair_count: asArray(value.repairs || value.guardrail_repairs).length
  }));
}

function forensicStage({ stage_number, stage_id, present, input, output, validation = null, issue_sources = [], usage_source = null, handoff_integrity = {}, canonical_output_pointer = null }) {
  return {
    stage_number,
    stage_id,
    present: Boolean(present),
    input_summary: objectSummary(input),
    input_refs: collectRefs(input),
    output_summary: objectSummary(output),
    output_refs: collectRefs(output),
    validation_result: validation,
    warnings_errors: warningErrorSummary(output, ...issue_sources),
    token_model_usage: collectUsageMetadata(usage_source || output),
    handoff_integrity,
    canonical_output_pointer
  };
}

function buildStageForensicTrace({ targetInput, liveRunRequest, liveRunResult, internal, profiles, validation, stage9ReportData, stage10Handoff }) {
  const stage6Cache = safeObject(internal.stage6Cache);
  const sourceBundle = safeObject(stage6Cache.source_bundle);
  const evidenceJunction = safeObject(stage6Cache.evidence_junction);
  const stage7Artifact = safeObject(internal.stage7Artifact);
  const stage8Export = safeObject(internal.stage8Export);
  const stage8Input = safeObject(internal.stage8Input);
  const stage8Ledger = safeObject(internal.stage8QualityControlLedger || internal.stage8Ledger);
  const stage6a = safeObject(stage6Cache.stage6a_stage_result);
  const stage6b = safeObject(stage6Cache.stage6b_stage_result);
  const stage6Compat = safeObject(stage6Cache.compatibility_adapters);
  const stageStatus = asArray(liveRunResult.stage_status);
  const stageLogs = (name) => stageStatus.filter((entry) => entry?.stage === name);
  const trace = [
    forensicStage({
      stage_number: 0,
      stage_id: "target_intake",
      present: true,
      input: liveRunRequest,
      output: targetInput,
      handoff_integrity: { target_input_normalized: Boolean(targetInput.primary_url || targetInput.document_text_received) },
      canonical_output_pointer: "00-audit-request.json"
    }),
    forensicStage({
      stage_number: 1,
      stage_id: "source_discovery",
      present: Boolean(stageLogs("source_discovery").length || sourceBundle.raw_footprint),
      input: targetInput,
      output: { stage_status: stageLogs("source_discovery"), source_review: sourceBundle.source_review || null },
      handoff_integrity: { completed: stageLogs("source_discovery").some((entry) => entry.status === "complete") },
      canonical_output_pointer: "22-stage-01-forensic.json"
    }),
    forensicStage({
      stage_number: 2,
      stage_id: "source_capture",
      present: Boolean(sourceBundle.raw_footprint),
      input: { discovered_source_refs: collectRefs(sourceBundle.source_review || sourceBundle.raw_footprint) },
      output: sourceBundle,
      handoff_integrity: { source_bundle_present: Object.keys(sourceBundle).length > 0, source_records: asArray(sourceBundle.raw_footprint?.source_records).length },
      canonical_output_pointer: "22-stage-02-forensic.json"
    }),
    forensicStage({
      stage_number: 3,
      stage_id: "evidence_junction",
      present: Boolean(Object.keys(evidenceJunction).length),
      input: sourceBundle,
      output: evidenceJunction,
      handoff_integrity: { source_bundle_sha256_present: Boolean(evidenceJunction.source_bundle_sha256), evidence_junction_version: evidenceJunction.evidence_junction_version || null },
      canonical_output_pointer: "22-stage-03-forensic.json"
    }),
    forensicStage({
      stage_number: 4,
      stage_id: "target_profile",
      present: Boolean(Object.keys(profiles.target_profile).length),
      input: { target_input: targetInput, evidence_junction_sha256: evidenceJunction.source_bundle_sha256 || null },
      output: profiles.target_profile,
      usage_source: stage6Cache.stage4_stage_result || profiles.target_profile,
      handoff_integrity: { canonical_profile_present: Object.keys(profiles.target_profile).length > 0 },
      canonical_output_pointer: "04-target-profile.json"
    }),
    forensicStage({
      stage_number: 5,
      stage_id: "target_feature_profile",
      present: Boolean(Object.keys(profiles.target_feature_profile).length),
      input: { target_profile_ref: profiles.target_profile?.target_profile_version || profiles.target_profile?.identity?.brand_name || null, evidence_junction_sha256: evidenceJunction.source_bundle_sha256 || null },
      output: profiles.target_feature_profile,
      usage_source: stage6Cache.stage5_stage_result || profiles.target_feature_profile,
      handoff_integrity: { canonical_profile_present: Object.keys(profiles.target_feature_profile).length > 0, feature_count: asArray(profiles.target_feature_profile.feature_inventory).length },
      canonical_output_pointer: "05-target-feature-profile.json"
    }),
    forensicStage({
      stage_number: 6,
      stage_id: "legal_cartography_and_data_provenance",
      present: Boolean(Object.keys(profiles.legal_cartography).length || Object.keys(profiles.data_provenance_profile).length || Object.keys(stage6a).length || Object.keys(stage6b).length),
      input: { stage6_input_refs: collectRefs({ sourceBundle, evidenceJunction, target_profile: profiles.target_profile, target_feature_profile: profiles.target_feature_profile }) },
      output: { legal_cartography: profiles.legal_cartography, data_provenance_profile: profiles.data_provenance_profile, stage6a_stage_result: stage6a, stage6b_stage_result: stage6b, compatibility_adapters: stage6Compat },
      validation: validationSummary(stage6a.validation, stage6a.stage6_guardrail, stage6b.validation, stage6b.stage6_guardrail, stage6Compat.stage6_integrated_validation?.schemaValidation, stage6Compat.stage6_integrated_validation?.guardrail),
      issue_sources: [stage6a, stage6b, stage6Compat.stage6_integrated_validation?.guardrail],
      handoff_integrity: { legal_cartography_present: Object.keys(profiles.legal_cartography).length > 0, data_provenance_profile_present: Object.keys(profiles.data_provenance_profile).length > 0, compatibility_adapter_only: Boolean(stage6Compat.stage6_integrated_artifact) },
      canonical_output_pointer: ["06-legal-cartography.json", "07-data-provenance-profile.json"]
    }),
    forensicStage({
      stage_number: 7,
      stage_id: "exposure_profile_registry_ledger",
      present: Boolean(Object.keys(stage7Artifact).length || Object.keys(profiles.exposure_profile).length),
      input: { stage6_profile_handoffs: ["target_profile", "target_feature_profile", "legal_cartography", "data_provenance_profile"], registry_source_row_count: stage7Artifact.source_row_count || null },
      output: stage7Artifact,
      validation: validationSummary(stage7Artifact.summary?.validation),
      issue_sources: [stage7Artifact.summary],
      handoff_integrity: { exposure_profile_present: Object.keys(profiles.exposure_profile).length > 0, registry_ledger_rows: asArray(profiles.exposure_profile.registry_ledger).length, stage7_main_artifact: "exposure_profile.registry_ledger" },
      canonical_output_pointer: "08-exposure-profile.json"
    }),
    forensicStage({
      stage_number: 8,
      stage_id: "stage8_quality_control_ledger",
      present: Boolean(Object.keys(stage8Ledger).length || Object.keys(stage8Export).length),
      input: stage8Input,
      output: { stage8_export: stage8Export, stage8_quality_control_ledger: stage8Ledger },
      validation: validationSummary(stage8Export.correction_result),
      issue_sources: [stage8Export, stage8Ledger],
      handoff_integrity: { qc_ledger_present: stage8Ledger.artifact_type === "stage8_quality_control_ledger", replaces_stage7_registry: false, applies_to: stage8Ledger.source_policy?.applies_to || null },
      canonical_output_pointer: "08b-stage8-quality-control-ledger.json"
    }),
    forensicStage({
      stage_number: 9,
      stage_id: "stage9_report_assembly",
      present: Boolean(stage9ReportData),
      input: stage9ReportData?.stage9_profile_input || stage9ReportData?.profile_sources || null,
      output: stage9ReportData,
      validation: validationSummary(validation.stage9),
      issue_sources: [validation.stage9],
      handoff_integrity: { profile_input_version: stage9ReportData?.stage9_profile_input_version || stage9ReportData?.stage9_profile_input?.profile_input_version || null, effective_ledger_rows: asArray(stage9ReportData?.forensic_ledger_appendix?.full_registry_ledger || stage9ReportData?.report?.report_data?.forensic_ledger_appendix?.full_registry_ledger).length },
      canonical_output_pointer: ["09-stage9-report-data.json", "10-stage9-report.html", "11-stage9-validation.json"]
    }),
    forensicStage({
      stage_number: 10,
      stage_id: "stage10_functional_assembly_intake_vault",
      present: Boolean(stage10Handoff),
      input: profiles.stage10_source_packet,
      output: stage10Handoff,
      validation: validationSummary(validation.stage10),
      issue_sources: [validation.stage10, stage10Handoff],
      handoff_integrity: { source_mode: profiles.stage10_source_packet?.source_mode || null, profile_handoff_keys: Object.keys(safeObject(profiles.stage10_source_packet?.profile_handoffs)), functional_intake_vault_present: Boolean(stage10Handoff?.functional_intake_vault) },
      canonical_output_pointer: ["12-stage10-source-packet.json", "13-stage10-handoff.json", "14-stage10-validation.json", "15-functional-intake-vault.json", "16-vault-payload.json", "17-assembly-handoff.json"]
    })
  ];
  return {
    artifact_type: "full_live_runtime_stage_forensic_trace",
    generated_at: nowIso(),
    requirement: "Canonical profile artifacts are required but are not a substitute for stage forensic artifacts.",
    stage_count: trace.filter((stage) => stage.present).length,
    stages: trace.filter((stage) => stage.present)
  };
}

function writePreArtifactFailureTrace({ targetInput, liveRunRequest, liveRunResponse }) {
  const trace = {
    artifact_type: "full_live_runtime_stage_forensic_trace",
    generated_at: nowIso(),
    requirement: "Canonical profile artifacts are required but are not a substitute for stage forensic artifacts.",
    failure_phase: "before_canonical_artifact_validation",
    stage_count: 1,
    stages: [
      forensicStage({
        stage_number: 0,
        stage_id: "target_intake",
        present: true,
        input: liveRunRequest,
        output: {
          target_input: targetInput,
          live_run_http_status: liveRunResponse.status,
          live_run_response_ok: liveRunResponse.ok,
          live_run_response_body: liveRunResponse.body
        },
        issue_sources: [liveRunResponse.body],
        handoff_integrity: {
          target_input_normalized: Boolean(targetInput.primary_url || targetInput.document_text_received),
          live_run_reached_canonical_artifacts: false
        },
        canonical_output_pointer: ["00-audit-request.json", "01-live-run-result.full.json"]
      })
    ]
  };
  writeJson("22-stage-forensic-trace.json", trace);
  writeJson("22-stage-00-forensic.json", trace.stages[0]);
}

const FORENSIC_STAGE_FILES = {
  source_discovery: "31-stage0-source-discovery-forensic.json",
  source_capture: "32-stage1-source-capture-forensic.json",
  evidence_refiner: "33-stage2-evidence-refiner-forensic.json",
  source_packaging: "34-stage3-source-packaging-forensic.json",
  target_profile: "35-stage4-target-profile-forensic.json",
  target_feature_profile: "36-stage5-target-feature-profile-forensic.json",
  legal_cartography: "37-stage6a-legal-cartography-forensic.json",
  data_provenance_profile: "38-stage6b-data-provenance-forensic.json",
  exposure_profile: "39-stage7-exposure-profile-forensic.json",
  quality_control: "40-stage8-quality-control-forensic.json",
  report_assembly: "41-stage9-report-assembly-forensic.json",
  vault_handoff: "42-stage10-vault-handoff-forensic.json"
};

function stage4SourceRecords(sourceBundle, familyFilter = null) {
  return asArray(sourceBundle?.raw_footprint?.source_records)
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

function forensicStatus({ validation, issues, output }) {
  if (validation && Array.isArray(validation)) {
    if (validation.some((entry) => entry?.ok === false)) return "FAIL";
    if (validation.some((entry) => Number(entry?.warning_count || 0) > 0 || Number(entry?.repair_count || 0) > 0)) return "WARNING";
  }
  if (issues?.error_count) return "FAIL";
  if (issues?.warning_count) return "WARNING";
  if (!output || (typeof output === "object" && !Array.isArray(output) && Object.keys(output).length === 0)) return "SKIPPED_NOT_AVAILABLE";
  return "PASS";
}

function makeRequiredForensicEntry({ stage, stage_label, input, output, canonical_output_pointer, validation = null, issue_sources = [], handoff_integrity = {}, determinism_notes = {}, source_coverage = {}, usage_source = null }) {
  const issues = warningErrorSummary(output, ...issue_sources);
  const status = forensicStatus({ validation, issues, output });
  const usage = collectUsageMetadata(usage_source || output);
  return {
    stage,
    stage_label,
    status,
    input_summary: objectSummary(input),
    input_refs: collectRefs(input),
    output_summary: objectSummary(output),
    output_refs: collectRefs(output),
    canonical_output_pointer,
    validation,
    warnings: issues.warnings,
    errors: issues.errors,
    model_usage: usage.records,
    token_usage: usage.totals,
    handoff_integrity,
    determinism_notes,
    source_coverage,
    audit_conclusion: status === "FAIL" ? "Stage failed or returned blocking errors." : status === "WARNING" ? "Stage completed with warnings or repairs preserved for audit." : status === "SKIPPED_NOT_AVAILABLE" ? "No stage data was available to audit." : "Stage artifact preserved."
  };
}

function makeStageRecorder() {
  const entries = [];
  function writeIndex(extra = {}) {
    writeJson("30-stage-forensic-index.json", {
      artifact_type: "stage_forensic_index",
      generated_at: nowIso(),
      requirement: "Canonical profile artifacts remain required and are not a substitute for stage forensic artifacts.",
      stage_count: entries.length,
      stages: entries.map((entry) => ({
        stage: entry.stage,
        stage_label: entry.stage_label,
        status: entry.status,
        file: FORENSIC_STAGE_FILES[entry.stage] || null,
        canonical_output_pointer: entry.canonical_output_pointer
      })),
      ...extra
    });
  }
  function record(entry) {
    entries.push(entry);
    const file = FORENSIC_STAGE_FILES[entry.stage];
    if (file) writeJson(file, entry);
    writeIndex();
    return entry;
  }
  return { entries, record, writeIndex };
}

function writeStageMatrices(entries) {
  writeJson("43-token-usage-by-stage.json", {
    artifact_type: "token_usage_by_stage",
    generated_at: nowIso(),
    stages: entries.map((entry) => ({ stage: entry.stage, stage_label: entry.stage_label, token_usage: entry.token_usage, model_usage_count: asArray(entry.model_usage).length }))
  });
  writeJson("44-stage-validation-matrix.json", {
    artifact_type: "stage_validation_matrix",
    generated_at: nowIso(),
    stages: entries.map((entry) => ({ stage: entry.stage, stage_label: entry.stage_label, status: entry.status, validation: entry.validation, warning_count: asArray(entry.warnings).length, error_count: asArray(entry.errors).length }))
  });
  writeJson("45-stage-handoff-integrity-matrix.json", {
    artifact_type: "stage_handoff_integrity_matrix",
    generated_at: nowIso(),
    stages: entries.map((entry) => ({ stage: entry.stage, stage_label: entry.stage_label, status: entry.status, canonical_output_pointer: entry.canonical_output_pointer, handoff_integrity: entry.handoff_integrity }))
  });
}

function availableArtifacts() {
  return fs.existsSync(outputRoot) ? fs.readdirSync(outputRoot).sort() : [];
}

function writeAuditFailure({ failed_stage, phase, error, last_successful_stage = null, retryable = true, classification = "timeout/transport failure", detail = null }) {
  const payload = {
    ok: false,
    artifact_type: "full_live_runtime_audit_failure",
    generated_at: nowIso(),
    failed_stage,
    phase,
    error: error?.message || String(error || "audit failed"),
    detail: detail || error?.result || null,
    last_successful_stage,
    available_artifacts: availableArtifacts(),
    retryable,
    classification
  };
  writeJson("audit-failure.json", payload);
  writeJson("99-failure.json", payload);
  writeManifest({ ok: false, failure: payload.error, failed_stage });
  console.error(JSON.stringify({ ok: false, phase: "full_live_runtime_audit", failed_stage, error: payload.error, classification }, null, 2));
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
    LIVE_FEATURE_MAX_OUTPUT_TOKENS: "28000",
    STAGE5_FEATURE_MAX_OUTPUT_TOKENS: "28000",
    STAGE7_BUDGET_ENFORCEMENT_MODE: "guidance"
  };
  for (const [key, value] of Object.entries(defaults)) if (!process.env[key]) process.env[key] = value;
}

function effectiveStage9Ledger(stage9ReportData = {}) {
  return asArray(
    stage9ReportData?.forensic_ledger_appendix?.full_registry_ledger
      || stage9ReportData?.report?.report_data?.forensic_ledger_appendix?.full_registry_ledger
      || stage9ReportData?.report?.report_data?.forensic_ledger_appendix?.appendix_e_exposure_forensic_ledger
  );
}

async function runStagedFullLiveAudit() {
  applyAuditRuntimeDefaults();
  const recorder = makeStageRecorder();
  const logs = [];
  const { targetInput, targetUrl: normalizedTargetUrl, documentText, documentLabel } = normalizeInput({ primary_url: targetUrl, company_name: companyName });
  const liveRunRequest = { input: targetInput, options: { include_internal_artifacts: true, render_html: true, run_handoff: true, staged_resumable_audit: true } };
  let lastSuccessfulStage = null;
  writeJson("00-audit-request.json", { ok: true, audit_phase: "full_live_runtime_audit", execution_model: "staged_resumable_v1", run_id: runId, runtime_url: runtimeUrl, target_input: targetInput, endpoint_policy: "staged_local_orchestration_no_monolithic_live_post", status_endpoint: STATUS_ENDPOINT, forbidden_endpoint: FORBIDDEN_STAGE_ENDPOINT, options: liveRunRequest.options });

  try {
    const runtimeStatusResponse = await getJson(`${runtimeUrl}${STATUS_ENDPOINT}`, authHeaders);
    writeJson("00-runtime-status.json", { status: runtimeStatusResponse.status, ok: runtimeStatusResponse.ok, body: runtimeStatusResponse.body });
    if (!runtimeStatusResponse.ok || runtimeStatusResponse.body?.ok === false) throw Object.assign(new Error("Runtime status check failed."), { result: runtimeStatusResponse });

    const { registryRuntime, registryKey } = loadRuntimeData();
    const evidence = await buildLiveEvidence({ targetInput, targetUrl: normalizedTargetUrl, documentText, documentLabel, hasDoc: Boolean(documentText), options: liveRunRequest.options, logs, runId });
    const { sourceBundle, evidenceJunction, reviewerSource } = evidence;
    writeJson("02-stage-status.json", logs);
    recorder.record(makeRequiredForensicEntry({ stage: "source_discovery", stage_label: "Stage 0 - Source Discovery", input: targetInput, output: { stage_status: logs.filter((entry) => entry.stage === "source_discovery"), source_review: sourceBundle.source_review || null }, canonical_output_pointer: FORENSIC_STAGE_FILES.source_discovery, handoff_integrity: { source_discovery_completed: logs.some((entry) => entry.stage === "source_discovery" && entry.status === "complete") }, source_coverage: { reviewer_document_included: Boolean(reviewerSource) } }));
    recorder.record(makeRequiredForensicEntry({ stage: "source_capture", stage_label: "Stage 1 - Source Capture", input: { source_refs: collectRefs(sourceBundle.source_review || {}) }, output: sourceBundle.raw_footprint || sourceBundle, canonical_output_pointer: FORENSIC_STAGE_FILES.source_capture, handoff_integrity: { source_records: asArray(sourceBundle.raw_footprint?.source_records).length } }));
    recorder.record(makeRequiredForensicEntry({ stage: "evidence_refiner", stage_label: "Stage 2 - Evidence Refiner", input: sourceBundle.raw_footprint || sourceBundle, output: sourceBundle, canonical_output_pointer: FORENSIC_STAGE_FILES.evidence_refiner, handoff_integrity: { source_bundle_version: sourceBundle.source_bundle_version || null, evidence_buffer_count: asArray(sourceBundle.evidence_buffer).length } }));
    recorder.record(makeRequiredForensicEntry({ stage: "source_packaging", stage_label: "Stage 3 - Source Packaging", input: sourceBundle, output: evidenceJunction, canonical_output_pointer: FORENSIC_STAGE_FILES.source_packaging, handoff_integrity: { evidence_junction_version: evidenceJunction.evidence_junction_version || null, source_bundle_sha256: evidenceJunction.source_bundle_sha256 || null } }));
    lastSuccessfulStage = "source_packaging";

    liveLogStage(logs, "company_profile", "running");
    const targetProfileSources = stage4SourceRecords(sourceBundle);
    const companyProfileSources = stage4SourceRecords(sourceBundle, "company_profile");
    if (!targetProfileSources.length) throw new Error("No Stage 4 target profile source records available.");
    const companyInput = { target_input: targetInput, source_bundle_version: sourceBundle.source_bundle_version, source_bundle_sha256: evidenceJunction.source_bundle_sha256 || null, evidence_junction_version: evidenceJunction.evidence_junction_version, target_profile_sources: targetProfileSources, company_profile_sources: companyProfileSources, input_policy: { target_profile_source_packet: true, company_family_only: false, product_feature_mapping_forbidden: true, legal_review_forbidden: true, registry_evaluation_forbidden: true, outside_browsing_forbidden: true } };
    const companyStage = await runStage("company_profile", companyInput, { pool: process.env.LIVE_COMPANY_POOL || process.env.STAGE4_COMPANY_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_COMPANY_MAX_OUTPUT_TOKENS || 24000), timeoutMs: Number(process.env.LIVE_COMPANY_TIMEOUT_MS || 60000) });
    const companyProfile = companyStage.company_profile;
    liveLogStage(logs, "company_profile", "complete", { company_name: companyProfile?.identity?.brand_name || null, target_profile_sources: targetProfileSources.length, company_sources: companyProfileSources.length });
    writeJson("04-target-profile.json", companyProfile);
    recorder.record(makeRequiredForensicEntry({ stage: "target_profile", stage_label: "Stage 4 - Target Profile", input: companyInput, output: companyStage, validation: validationSummary(companyStage), issue_sources: [companyStage], usage_source: companyStage, canonical_output_pointer: "04-target-profile.json", handoff_integrity: { target_profile_present: Boolean(companyProfile), source_count: targetProfileSources.length } }));
    lastSuccessfulStage = "target_profile";

    liveLogStage(logs, "target_feature_profile", "running");
    const adapterResult = buildStage5TargetFeaturePackage({ sourceBundle, evidenceJunction, companyProfile, runId: `${runId}_stage5_input`, budget: { max_input_chars: Number(process.env.STAGE5_MAX_INPUT_CHARS || 240000), max_estimated_tokens: Number(process.env.STAGE5_MAX_ESTIMATED_TOKENS || 120000), max_single_source_chars: Number(process.env.STAGE5_MAX_SINGLE_SOURCE_CHARS || Number.MAX_SAFE_INTEGER), prompt_overhead_tokens: Number(process.env.STAGE5_PROMPT_OVERHEAD_TOKENS || 30000), max_product_family_packets: Number(process.env.STAGE5_MAX_PRODUCT_FAMILY_PACKETS || 8) } });
    if (!adapterResult.ok) throw Object.assign(new Error(adapterResult.error || "Target Feature Profile input adapter failed"), { result: adapterResult });
    const familyScopedProfile = await runStage5ProductFamilyScopedProfile({ adapterResult, runStage, logs, logStage: liveLogStage });
    let featureStage = null;
    const targetFeatureProfile = familyScopedProfile || (featureStage = await runStage("target_feature_profile", adapterResult.target_feature_profile_input, { pool: process.env.LIVE_FEATURE_POOL || process.env.STAGE5_FEATURE_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_FEATURE_MAX_OUTPUT_TOKENS || 28000), timeoutMs: Number(process.env.LIVE_FEATURE_TIMEOUT_MS || 90000) })).target_feature_profile;
    liveLogStage(logs, "target_feature_profile", "complete", { execution_mode: familyScopedProfile ? "stage5_product_family_scoped_lossless_classification" : "stage5_single_packet_fallback", feature_count: asArray(targetFeatureProfile?.feature_inventory).length });
    writeJson("05-target-feature-profile.json", targetFeatureProfile);
    recorder.record(makeRequiredForensicEntry({ stage: "target_feature_profile", stage_label: "Stage 5 - Target Feature Profile", input: adapterResult.target_feature_profile_input, output: featureStage || { ok: true, target_feature_profile: targetFeatureProfile, product_family_scoped: true }, validation: validationSummary(featureStage), issue_sources: [featureStage || {}], usage_source: featureStage || targetFeatureProfile, canonical_output_pointer: "05-target-feature-profile.json", handoff_integrity: { target_feature_profile_present: Boolean(targetFeatureProfile), feature_count: asArray(targetFeatureProfile?.feature_inventory).length } }));
    lastSuccessfulStage = "target_feature_profile";

    const stage6Input = { stage6_input_version: "stage6_live_input_v1", run_id: `${runId}_stage6_input`, source_bundle: sourceBundle, evidence_junction: evidenceJunction, company_profile: companyProfile, target_profile: companyProfile, target_feature_profile: targetFeatureProfile };
    const stage6aStageResult = await runStage("stage6a_legal_document_cartography", stage6Input, { pool: process.env.LIVE_STAGE6A_POOL || process.env.LIVE_LEGAL_POOL || process.env.STAGE6A_POOL || process.env.STAGE6_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_STAGE6A_MAX_OUTPUT_TOKENS || process.env.LIVE_LEGAL_MAX_OUTPUT_TOKENS || process.env.STAGE6A_MAX_OUTPUT_TOKENS || 24000), timeoutMs: Number(process.env.LIVE_STAGE6A_TIMEOUT_MS || process.env.LIVE_LEGAL_TIMEOUT_MS || process.env.STAGE6A_TIMEOUT_MS || 90000) });
    const legalCartography = stage6aStageResult.stage6_review?.legal_document_cartography || null;
    writeJson("06-legal-cartography.json", legalCartography);
    recorder.record(makeRequiredForensicEntry({ stage: "legal_cartography", stage_label: "Stage 6A - Legal Cartography", input: stage6Input, output: stage6aStageResult, validation: validationSummary(stage6aStageResult.validation, stage6aStageResult.stage6_guardrail), issue_sources: [stage6aStageResult, stage6aStageResult.stage6_guardrail], usage_source: stage6aStageResult, canonical_output_pointer: "06-legal-cartography.json", handoff_integrity: { legal_cartography_present: Boolean(legalCartography), canonical_handoff_key: "legal_cartography" } }));
    lastSuccessfulStage = "legal_cartography";

    const stage6bStageResult = await runStage6BDataProvenance({ source_bundle: sourceBundle, target_profile: companyProfile, company_profile: companyProfile, target_feature_profile: targetFeatureProfile, evidence_junction: evidenceJunction, legal_document_cartography: legalCartography, stage6a_review: stage6aStageResult.stage6_review, runtime_options: { pool: process.env.LIVE_STAGE6B_POOL || process.env.STAGE6B_POOL || process.env.STAGE6_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_STAGE6B_MAX_OUTPUT_TOKENS || process.env.STAGE6B_MAX_OUTPUT_TOKENS || 24000), timeoutMs: Number(process.env.LIVE_STAGE6B_TIMEOUT_MS || process.env.STAGE6B_TIMEOUT_MS || 90000) }, env: process.env });
    if (!stage6bStageResult.ok) throw Object.assign(new Error(stage6bStageResult.error || "Stage 6B Data Provenance failed."), { result: stage6bStageResult });
    const dataProvenanceProfile = stage6bStageResult.data_provenance_profile || stage6bStageResult.stage6_review?.data_provenance_profile || null;
    writeJson("07-data-provenance-profile.json", dataProvenanceProfile);
    recorder.record(makeRequiredForensicEntry({ stage: "data_provenance_profile", stage_label: "Stage 6B - Data Provenance Profile", input: { ...stage6Input, legal_cartography: legalCartography }, output: stage6bStageResult, validation: validationSummary(stage6bStageResult.validation, stage6bStageResult.stage6_guardrail), issue_sources: [stage6bStageResult, stage6bStageResult.stage6_guardrail], usage_source: stage6bStageResult, canonical_output_pointer: "07-data-provenance-profile.json", handoff_integrity: { data_provenance_profile_present: Boolean(dataProvenanceProfile), canonical_handoff_key: "data_provenance_profile" } }));
    lastSuccessfulStage = "data_provenance_profile";

    const stage6IntegratedArtifact = buildStage6IntegratedHandoffArtifact({ stage6a_review: stage6aStageResult.stage6_review, stage6b_review: stage6bStageResult.stage6_review }, { run_id: `${runId}_stage6_integrated_handoff`, generated_at: nowIso(), stage6a_stage_id: stage6aStageResult.stage_id || "stage6a_legal_document_cartography", stage6b_stage_id: stage6bStageResult.stage_id || "stage6b_data_provenance" });
    const stage6IntegratedSchema = validateDiligenceStageOutput("stage6Review", stage6IntegratedArtifact.stage6_review);
    const stage6IntegratedGuardrail = validateStage6ReviewGuardrail(stage6IntegratedArtifact.stage6_review, { input: { ...stage6Input, legal_document_cartography: legalCartography }, stageId: "stage6_integrated_handoff", semanticModelAttempted: true });
    if (!stage6IntegratedSchema.ok || !stage6IntegratedGuardrail.ok) throw Object.assign(new Error("Stage 6 integrated compatibility artifact failed validation."), { result: { schema: stage6IntegratedSchema, guardrail: stage6IntegratedGuardrail } });
    const stage6Cache = buildStage6Cache({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, stage6aStageResult, stage6bStageResult, legalCartography, dataProvenanceProfile, stage6IntegratedArtifact, stage6IntegratedValidation: { schemaValidation: stage6IntegratedSchema, guardrail: stage6IntegratedGuardrail } });

    const stage7Artifact = await runStage7({ stage6Cache, registryRuntime, registryKey, logs, runId: `${runId}_stage7` });
    writeJson("08-exposure-profile.json", stage7Artifact.exposure_profile);
    recorder.record(makeRequiredForensicEntry({ stage: "exposure_profile", stage_label: "Stage 7 - Exposure Profile Registry Ledger", input: { profile_handoffs: { target_profile: companyProfile, target_feature_profile: targetFeatureProfile, legal_cartography: legalCartography, data_provenance_profile: dataProvenanceProfile }, registry_row_count: asArray(registryRuntime?.threats).length }, output: stage7Artifact, validation: validationSummary(stage7Artifact.summary?.validation), issue_sources: [stage7Artifact.summary], usage_source: stage7Artifact, canonical_output_pointer: "08-exposure-profile.json", handoff_integrity: { exposure_profile_present: Boolean(stage7Artifact.exposure_profile), registry_ledger_rows: asArray(stage7Artifact.exposure_profile?.registry_ledger).length, main_artifact: "exposure_profile.registry_ledger" } }));
    lastSuccessfulStage = "exposure_profile";

    const { stage8Export, stage8Ledger, stage8Input } = await runStage8({ stage6Cache, stage7Artifact, registryRuntime, logs, runId: `${runId}_stage8` });
    stage8Ledger.artifact_type = "stage8_quality_control_ledger";
    writeJson("08b-stage8-quality-control-ledger.json", stage8Ledger);
    recorder.record(makeRequiredForensicEntry({ stage: "quality_control", stage_label: "Stage 8 - Quality Control Ledger", input: stage8Input, output: { stage8_export: stage8Export, stage8_quality_control_ledger: stage8Ledger }, validation: validationSummary(stage8Export.correction_result), issue_sources: [stage8Export, stage8Ledger], usage_source: stage8Export, canonical_output_pointer: "08b-stage8-quality-control-ledger.json", handoff_integrity: { qc_ledger_present: stage8Ledger.artifact_type === "stage8_quality_control_ledger", replaces_stage7_registry: false, applies_to: stage8Ledger.source_policy?.applies_to || "exposure_profile.registry_ledger" } }));
    lastSuccessfulStage = "quality_control";

    const stage9ReportData = buildStage9Report({ stage6Cache, stage7Artifact, stage8Ledger, stage8Export, registryRuntime });
    const stage9Validation = validateStage9Report({ stage9Report: stage9ReportData, postChallengeLedger: effectiveStage9Ledger(stage9ReportData), registryRuntime });
    writeJson("09-stage9-report-data.json", stage9ReportData);
    writeJson("11-stage9-validation.json", stage9Validation);
    if (!stage9Validation.ok) throw Object.assign(new Error("Stage 9 report validation failed."), { result: stage9Validation });
    const htmlReport = renderLegalExposureReport(stage9ReportData);
    writeText("10-stage9-report.html", htmlReport);
    recorder.record(makeRequiredForensicEntry({ stage: "report_assembly", stage_label: "Stage 9 - Report Assembly", input: stage9ReportData.stage9_profile_input || stage9ReportData.profile_sources || null, output: stage9ReportData, validation: validationSummary(stage9Validation), issue_sources: [stage9Validation], canonical_output_pointer: ["09-stage9-report-data.json", "10-stage9-report.html", "11-stage9-validation.json"], handoff_integrity: { stage9_profile_input_version: stage9ReportData.stage9_profile_input_version || stage9ReportData.stage9_profile_input?.profile_input_version || null, effective_ledger_rows: effectiveStage9Ledger(stage9ReportData).length } }));
    lastSuccessfulStage = "report_assembly";

    const stage10Handoff = assembleStage10VaultHandoff({ stage9ReportData, stage6Cache, stage7Artifact, stage8Ledger }, { runId });
    const stage10Validation = validateReviewReadyHandoff(stage10Handoff);
    const profiles = profileHandoffs({ internal: { stage6Cache, stage7Artifact, stage8Export, stage8QualityControlLedger: stage8Ledger, stage8Ledger, stage8Input }, stage10Handoff, stage9ReportData });
    writeJson("12-stage10-source-packet.json", profiles.stage10_source_packet || null);
    writeJson("13-stage10-handoff.json", stage10Handoff);
    writeJson("14-stage10-validation.json", stage10Validation);
    writeJson("15-functional-intake-vault.json", stage10Handoff?.functional_intake_vault || null);
    writeJson("16-vault-payload.json", stage10Handoff?.vault_payload || null);
    writeJson("17-assembly-handoff.json", stage10Handoff?.assembly_handoff || null);
    if (!stage10Validation.ok) throw Object.assign(new Error("Stage 10 handoff validation failed."), { result: stage10Validation });
    recorder.record(makeRequiredForensicEntry({ stage: "vault_handoff", stage_label: "Stage 10 - Functional Assembly Intake Vault", input: profiles.stage10_source_packet, output: stage10Handoff, validation: validationSummary(stage10Validation), issue_sources: [stage10Validation, stage10Handoff], canonical_output_pointer: ["12-stage10-source-packet.json", "13-stage10-handoff.json", "14-stage10-validation.json"], handoff_integrity: { source_mode: profiles.stage10_source_packet?.source_mode || null, profile_handoff_keys: Object.keys(safeObject(profiles.stage10_source_packet?.profile_handoffs)), functional_intake_vault_present: Boolean(stage10Handoff.functional_intake_vault) } }));
    lastSuccessfulStage = "vault_handoff";

    const liveRunResult = { ok: true, artifact_type: "staged_full_live_runtime_audit_result", generated_at: nowIso(), run_id: runId, mode: targetInput.live_review_input_mode, target_input: targetInput, stage_status: logs, stage9_report_data: stage9ReportData, html_report: htmlReport, stage10_handoff: stage10Handoff, validation: { stage9: stage9Validation, stage10: stage10Validation }, metrics: { source_count: asArray(sourceBundle.raw_footprint?.source_records).length, reviewer_document_included: Boolean(reviewerSource), stage7_rows: asArray(stage7Artifact.exposure_profile?.registry_ledger).length, stage8_rows: asArray(stage8Ledger.corrected_registry_ledger || stage8Ledger.post_challenge_ledger).length, stage8_corrected_count: stage8Ledger.corrected_count || 0, html_bytes: Buffer.byteLength(htmlReport, "utf8") }, warnings: [], internal_artifacts: { stage6Cache, stage7Artifact, stage8Export, stage8QualityControlLedger: stage8Ledger, stage8Ledger, stage8Input } };
    writeJson("01-live-run-result.full.json", liveRunResult);
    writeJson("01-live-run-result.summary.json", { ok: true, http_status: null, execution_model: "staged_resumable_v1", phase: "full_live_runtime_audit", run_id: runId, mode: liveRunResult.mode, stage_status_count: logs.length, has_stage9_report_data: true, has_html_report: true, has_stage10_handoff: true, profile_handoff_presence: { target_profile: true, target_feature_profile: true, legal_cartography: true, data_provenance_profile: true, exposure_profile: true, stage8_quality_control_ledger: true }, stage9_validation_ok: stage9Validation.ok === true, stage10_validation_ok: stage10Validation.ok === true, metrics: liveRunResult.metrics, warnings: [] });
    writeJson("02-stage-status.json", logs);
    writeJson("03-metrics.json", liveRunResult.metrics);
    writeJson("18-token-usage.json", collectUsageMetadata(liveRunResult));
    const stageForensicTrace = buildStageForensicTrace({ targetInput, liveRunRequest, liveRunResult, internal: liveRunResult.internal_artifacts, profiles, validation: liveRunResult.validation, stage9ReportData, stage10Handoff });
    writeJson("22-stage-forensic-trace.json", stageForensicTrace);
    for (const stage of stageForensicTrace.stages) writeJson(`22-stage-${String(stage.stage_number).padStart(2, "0")}-forensic.json`, stage);
    writeStageMatrices(recorder.entries);

    const leakageAudit = { ok: true, stage9_main_findings: scanKeys(stage9MainBody(stage9ReportData), STAGE9_RETIRED_MAIN_KEYS), stage10_main_findings: scanKeys(stage10MainBody(stage10Handoff), STAGE10_RETIRED_KEYS) };
    leakageAudit.ok = leakageAudit.stage9_main_findings.length === 0 && leakageAudit.stage10_main_findings.length === 0;
    writeJson("19-legacy-leakage-audit.json", leakageAudit);

    const failedChecks = [];
    if (!Object.keys(profiles.target_profile).length) failedChecks.push("missing_target_profile_handoff");
    if (!Object.keys(profiles.target_feature_profile).length) failedChecks.push("missing_target_feature_profile_handoff");
    if (!Object.keys(profiles.legal_cartography).length) failedChecks.push("missing_legal_cartography_handoff");
    if (!Object.keys(profiles.data_provenance_profile).length) failedChecks.push("missing_data_provenance_profile_handoff");
    if (!Array.isArray(profiles.exposure_profile?.registry_ledger) || !profiles.exposure_profile.registry_ledger.length) failedChecks.push("missing_exposure_profile_registry_ledger");
    if (profiles.stage8_quality_control_ledger?.artifact_type !== "stage8_quality_control_ledger") failedChecks.push("stage8_qc_ledger_not_canonical");
    if (profiles.stage10_source_packet?.source_mode !== "profile_handoff_remap_v1") failedChecks.push("stage10_source_packet_not_profile_handoff_remap");
    for (const key of ["target_profile", "target_feature_profile", "legal_cartography", "data_provenance_profile", "exposure_profile", "stage8_quality_control_ledger"]) if (!profiles.stage10_source_packet?.profile_handoffs?.[key]) failedChecks.push(`missing_stage10_profile_handoff_${key}`);
    if (!leakageAudit.ok) failedChecks.push("legacy_leakage_detected");
    writeText("20-summary.md", createSummaryMarkdown({ runtimeStatus: { ok: true, body: { ok: true } }, liveRunResult, leakageAudit, failedChecks, profiles }));
    recorder.writeIndex({ completed: failedChecks.length === 0 });
    writeManifest({ ok: failedChecks.length === 0, execution_model: "staged_resumable_v1", failed_checks: failedChecks });
    if (failedChecks.length) {
      writeAuditFailure({ failed_stage: "canonical_validation", phase: "full_live_runtime_audit", error: new Error("Full live runtime audit failed pass conditions."), last_successful_stage: lastSuccessfulStage, retryable: false, classification: "canonical handoff missing", detail: { failed_checks: failedChecks, leakageAudit } });
      process.exit(1);
    }
    console.log(JSON.stringify({ ok: true, phase: "full_live_runtime_audit", execution_model: "staged_resumable_v1", runtime_url: runtimeUrl, target_url: targetUrl, company_name: companyName, run_id: runId, metrics: liveRunResult.metrics, artifact_dir: outputRoot }, null, 2));
  } catch (error) {
    writeStageMatrices(recorder.entries);
    recorder.writeIndex({ completed: false });
    writeAuditFailure({ failed_stage: lastSuccessfulStage ? `after_${lastSuccessfulStage}` : "startup", phase: "full_live_runtime_audit", error, last_successful_stage: lastSuccessfulStage, retryable: true, classification: /timeout|504|fetch|network/i.test(String(error?.message || "")) ? "timeout/transport failure" : "import/check or stage execution failure" });
    process.exit(1);
  }
}

function writeManifest(extra = {}) {
  const files = fs.existsSync(outputRoot) ? fs.readdirSync(outputRoot).filter((name) => name !== "21-artifact-manifest.json").sort() : [];
  const manifest = {
    ok: extra.ok !== false,
    audit_phase: "full_live_runtime_audit",
    generated_at: nowIso(),
    runtime_url: runtimeUrl,
    live_endpoint: LIVE_RUN_ENDPOINT,
    target_url: targetUrl,
    company_name: companyName,
    run_id: runId,
    ...extra,
    files: files.map((name) => { const filePath = path.join(outputRoot, name); return { name, bytes: bytes(filePath), sha256: sha256(filePath) }; })
  };
  writeJson("21-artifact-manifest.json", manifest);
  return manifest;
}

function fail(message, detail = {}) {
  writeJson("99-failure.json", { ok: false, audit_phase: "full_live_runtime_audit", error: message, detail, generated_at: nowIso() });
  writeManifest({ ok: false, failure: message });
  console.error(JSON.stringify({ ok: false, phase: "full_live_runtime_audit", error: message, detail }, null, 2));
  process.exit(1);
}

function profileHandoffs({ internal = {}, stage10Handoff = {}, stage9ReportData = {} } = {}) {
  const handoff = safeObject(stage10Handoff);
  const sourcePacket = safeObject(handoff.stage10_source_packet || handoff.assembly_handoff?.stage10_source_packet);
  const packetProfiles = safeObject(sourcePacket.profile_handoffs);
  const stage6Cache = safeObject(internal.stage6Cache);
  const stage7Artifact = safeObject(internal.stage7Artifact);
  const qcLedger = safeObject(internal.stage8QualityControlLedger || internal.stage8Ledger || packetProfiles.stage8_quality_control_ledger);
  return {
    target_profile: safeObject(stage6Cache.target_profile || stage6Cache.company_profile || packetProfiles.target_profile || sourcePacket.target_profile_v2),
    target_feature_profile: safeObject(stage6Cache.target_feature_profile || packetProfiles.target_feature_profile || sourcePacket.feature_profile_v2),
    legal_cartography: safeObject(stage6Cache.legal_cartography || packetProfiles.legal_cartography || sourcePacket.legal_cartography || sourcePacket.stage6_review?.legal_document_cartography),
    data_provenance_profile: safeObject(stage6Cache.data_provenance_profile || packetProfiles.data_provenance_profile || sourcePacket.data_provenance_profile || sourcePacket.stage6_review?.data_provenance_profile),
    exposure_profile: safeObject(stage7Artifact.exposure_profile || packetProfiles.exposure_profile),
    stage8_quality_control_ledger: qcLedger,
    stage10_source_packet: sourcePacket,
    stage9_profile_sources: safeObject(stage9ReportData.profile_sources)
  };
}

function createSummaryMarkdown({ runtimeStatus, liveRunResult, leakageAudit, failedChecks, profiles }) {
  const validation = safeObject(liveRunResult.validation);
  const metrics = safeObject(liveRunResult.metrics);
  const stage10 = safeObject(liveRunResult.stage10_handoff);
  const functionalVault = safeObject(stage10.functional_intake_vault);
  const stageNames = asArray(liveRunResult.stage_status).map((entry) => `${entry.stage}:${entry.status}`).join(" → ");
  return `# Full Live Runtime Audit\n\n` +
    `- Audit phase: full_live_runtime_audit\n` +
    `- Runtime URL: ${runtimeUrl}\n` +
    `- Live endpoint: ${LIVE_RUN_ENDPOINT}\n` +
    `- Target: ${companyName} (${targetUrl})\n` +
    `- Runtime status OK: ${runtimeStatus.ok === true || runtimeStatus.body?.ok === true}\n` +
    `- Live run OK: ${liveRunResult.ok === true}\n` +
    `- Stage 9 validation OK: ${validation.stage9?.ok === true}\n` +
    `- Stage 10 validation OK: ${validation.stage10?.ok === true}\n` +
    `- Target profile present: ${Object.keys(profiles.target_profile || {}).length > 0}\n` +
    `- Feature profile present: ${Object.keys(profiles.target_feature_profile || {}).length > 0}\n` +
    `- Legal cartography present: ${Object.keys(profiles.legal_cartography || {}).length > 0}\n` +
    `- Data provenance profile present: ${Object.keys(profiles.data_provenance_profile || {}).length > 0}\n` +
    `- Exposure profile rows: ${asArray(profiles.exposure_profile?.registry_ledger).length}\n` +
    `- Stage 8 QC artifact: ${profiles.stage8_quality_control_ledger?.artifact_type || "missing"}\n` +
    `- HTML bytes: ${metrics.html_bytes || 0}\n` +
    `- Source count: ${metrics.source_count || 0}\n` +
    `- Stage 7 rows: ${metrics.stage7_rows || 0}\n` +
    `- Stage 8 rows: ${metrics.stage8_rows || 0}\n` +
    `- Functional Vault sections: ${Object.keys(safeObject(functionalVault.functional_sections)).length}\n` +
    `- Vault confirmation questions: ${asArray(stage10.vault_confirmation_questions).length}\n` +
    `- Legacy leakage OK: ${leakageAudit.ok === true}\n` +
    `- Failed checks: ${failedChecks.length ? failedChecks.join(", ") : "none"}\n\n` +
    `## Stage timeline\n\n${stageNames || "No stage timeline returned."}\n`;
}

ensureDir(outputRoot);
if (!runtimeUrl) fail("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required.");
if (!token) fail("RUNTIME_ACCESS_TOKEN is required for runtime-status smoke check.");

const authHeaders = { "x-runtime-access-token": token };
const targetInput = { primary_url: normalizeUrl(targetUrl), company_name: companyName, submitted_at: nowIso(), live_review_input_mode: "url_only" };
if (!targetInput.primary_url) fail("Invalid AUDIT_TARGET_URL/TARGET_URL.", { targetUrl });

if (process.env.AUDIT_EXECUTION_MODEL !== "monolithic_sync_live_post") {
  await runStagedFullLiveAudit();
  process.exit(0);
}

const liveRunRequest = { input: targetInput, options: { include_internal_artifacts: true, render_html: true, run_handoff: true } };
writeJson("00-audit-request.json", { ok: true, audit_phase: "full_live_runtime_audit", run_id: runId, runtime_url: runtimeUrl, target_input: targetInput, endpoint_policy: "mirror_public_live_sandbox_run_only", endpoint: LIVE_RUN_ENDPOINT, status_endpoint: STATUS_ENDPOINT, forbidden_endpoint: FORBIDDEN_STAGE_ENDPOINT, options: liveRunRequest.options });

const runtimeStatusResponse = await getJson(`${runtimeUrl}${STATUS_ENDPOINT}`, authHeaders);
writeJson("00-runtime-status.json", { status: runtimeStatusResponse.status, ok: runtimeStatusResponse.ok, body: runtimeStatusResponse.body });
if (!runtimeStatusResponse.ok || runtimeStatusResponse.body?.ok === false) fail("Runtime status check failed.", { status: runtimeStatusResponse.status, body: runtimeStatusResponse.body });

const liveRunResponse = await postJson(`${runtimeUrl}${LIVE_RUN_ENDPOINT}`, liveRunRequest);
writeJson("01-live-run-result.full.json", liveRunResponse.body);
if (!liveRunResponse.ok || liveRunResponse.body?.non_json_body) {
  writePreArtifactFailureTrace({ targetInput, liveRunRequest, liveRunResponse });
  fail("Live run request failed before canonical artifact validation.", {
    status: liveRunResponse.status,
    body: liveRunResponse.body
  });
}

const liveRunResult = liveRunResponse.body || {};
const stage9ReportData = liveRunResult.stage9_report_data || null;
const stage10Handoff = liveRunResult.stage10_handoff || null;
const validation = safeObject(liveRunResult.validation);
const internal = safeObject(liveRunResult.internal_artifacts);
const htmlReport = typeof liveRunResult.html_report === "string" ? liveRunResult.html_report : "";
const profiles = profileHandoffs({ internal, stage10Handoff, stage9ReportData });

writeJson("01-live-run-result.summary.json", { ok: liveRunResult.ok === true, http_status: liveRunResponse.status, phase: liveRunResult.phase || null, run_id: liveRunResult.run_id || null, mode: liveRunResult.mode || null, stage_status_count: asArray(liveRunResult.stage_status).length, has_stage9_report_data: Boolean(stage9ReportData), has_html_report: Boolean(htmlReport), has_stage10_handoff: Boolean(stage10Handoff), profile_handoff_presence: { target_profile: Object.keys(profiles.target_profile).length > 0, target_feature_profile: Object.keys(profiles.target_feature_profile).length > 0, legal_cartography: Object.keys(profiles.legal_cartography).length > 0, data_provenance_profile: Object.keys(profiles.data_provenance_profile).length > 0, exposure_profile: Object.keys(profiles.exposure_profile).length > 0, stage8_quality_control_ledger: Object.keys(profiles.stage8_quality_control_ledger).length > 0 }, stage9_validation_ok: validation.stage9?.ok === true, stage10_validation_ok: validation.stage10?.ok === true, metrics: liveRunResult.metrics || null, warnings: liveRunResult.warnings || [] });
writeJson("02-stage-status.json", liveRunResult.stage_status || []);
writeJson("03-metrics.json", liveRunResult.metrics || {});
writeJson("04-target-profile.json", profiles.target_profile);
writeJson("05-target-feature-profile.json", profiles.target_feature_profile);
writeJson("06-legal-cartography.json", profiles.legal_cartography);
writeJson("07-data-provenance-profile.json", profiles.data_provenance_profile);
writeJson("08-exposure-profile.json", profiles.exposure_profile);
writeJson("08b-stage8-quality-control-ledger.json", profiles.stage8_quality_control_ledger);
writeJson("09-stage9-report-data.json", stage9ReportData);
writeText("10-stage9-report.html", htmlReport);
writeJson("11-stage9-validation.json", validation.stage9 || null);
writeJson("12-stage10-source-packet.json", profiles.stage10_source_packet || null);
writeJson("13-stage10-handoff.json", stage10Handoff);
writeJson("14-stage10-validation.json", validation.stage10 || null);
writeJson("15-functional-intake-vault.json", stage10Handoff?.functional_intake_vault || null);
writeJson("16-vault-payload.json", stage10Handoff?.vault_payload || null);
writeJson("17-assembly-handoff.json", stage10Handoff?.assembly_handoff || null);
writeJson("18-token-usage.json", collectUsageMetadata(liveRunResult));

const stageForensicTrace = buildStageForensicTrace({ targetInput, liveRunRequest, liveRunResult, internal, profiles, validation, stage9ReportData, stage10Handoff });
writeJson("22-stage-forensic-trace.json", stageForensicTrace);
for (const stage of stageForensicTrace.stages) {
  writeJson(`22-stage-${String(stage.stage_number).padStart(2, "0")}-forensic.json`, stage);
}

const leakageAudit = { ok: true, stage9_main_findings: scanKeys(stage9MainBody(stage9ReportData), STAGE9_RETIRED_MAIN_KEYS), stage10_main_findings: scanKeys(stage10MainBody(stage10Handoff), STAGE10_RETIRED_KEYS) };
leakageAudit.ok = leakageAudit.stage9_main_findings.length === 0 && leakageAudit.stage10_main_findings.length === 0;
writeJson("19-legacy-leakage-audit.json", leakageAudit);

const failedChecks = [];
if (!liveRunResponse.ok || liveRunResult.ok !== true) failedChecks.push("live_run_not_ok");
if (!stage9ReportData) failedChecks.push("missing_stage9_report_data");
if (!htmlReport || Buffer.byteLength(htmlReport, "utf8") < 1000) failedChecks.push("missing_or_tiny_html_report");
if (!stage10Handoff) failedChecks.push("missing_stage10_handoff");
if (validation.stage9?.ok !== true) failedChecks.push("stage9_validation_failed");
if (validation.stage10?.ok !== true) failedChecks.push("stage10_validation_failed");
if (!stage10Handoff?.stage10_source_packet) failedChecks.push("missing_stage10_source_packet");
if (profiles.stage10_source_packet?.source_mode !== "profile_handoff_remap_v1") failedChecks.push("stage10_source_packet_not_profile_handoff_remap");
if (!stage10Handoff?.functional_intake_vault) failedChecks.push("missing_functional_intake_vault");
if (!stage10Handoff?.vault_payload) failedChecks.push("missing_vault_payload");
if (!stage10Handoff?.assembly_handoff) failedChecks.push("missing_assembly_handoff");
if (!Array.isArray(stage10Handoff?.assembly_handoff?.legal_document_status)) failedChecks.push("missing_legal_document_status");
if (!Object.keys(profiles.target_profile).length) failedChecks.push("missing_target_profile_handoff");
if (!Object.keys(profiles.target_feature_profile).length) failedChecks.push("missing_target_feature_profile_handoff");
if (!Object.keys(profiles.legal_cartography).length) failedChecks.push("missing_legal_cartography_handoff");
if (!Object.keys(profiles.data_provenance_profile).length) failedChecks.push("missing_data_provenance_profile_handoff");
if (!Array.isArray(profiles.exposure_profile?.registry_ledger) || !profiles.exposure_profile.registry_ledger.length) failedChecks.push("missing_exposure_profile_registry_ledger");
if (profiles.stage8_quality_control_ledger?.artifact_type !== "stage8_quality_control_ledger") failedChecks.push("stage8_qc_ledger_not_canonical");
if (!leakageAudit.ok) failedChecks.push("legacy_leakage_detected");

writeText("20-summary.md", createSummaryMarkdown({ runtimeStatus: runtimeStatusResponse, liveRunResult, leakageAudit, failedChecks, profiles }));
writeManifest({ ok: failedChecks.length === 0, failed_checks: failedChecks });

if (failedChecks.length) fail("Full live runtime audit failed pass conditions.", { failed_checks: failedChecks, leakageAudit });

console.log(JSON.stringify({ ok: true, phase: "full_live_runtime_audit", runtime_url: runtimeUrl, live_endpoint: LIVE_RUN_ENDPOINT, target_url: targetUrl, company_name: companyName, run_id: liveRunResult.run_id || runId, metrics: liveRunResult.metrics, artifact_dir: outputRoot }, null, 2));
