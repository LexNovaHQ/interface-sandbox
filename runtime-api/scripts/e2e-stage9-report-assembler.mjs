#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import { buildStage9Report } from "../src/diligence/stage9ReportAssembler.js";
import { validateStage9Report } from "../src/diligence/stage9ReportValidator.js";

const stage6CachePath = process.env.STAGE6_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage6-integrated-handoff.json");
const stage7ArtifactPath = process.env.STAGE7_AUDIT_EXPORT_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage7-priority-ledger.json");
const stage8CorrectedLedgerPath = process.env.STAGE8_CORRECTED_LEDGER_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage8-corrected-ledger.json");
const registryPath = process.env.REGISTRY_RUNTIME_PATH || path.join(process.cwd(), "..", "data", "runtime", "registry.runtime.json");
const reportDataPath = process.env.STAGE9_REPORT_DATA_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage9-report-data.json");
const reportPreviewPath = process.env.STAGE9_REPORT_PREVIEW_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage9-report-preview.json");
const reportValidationPath = process.env.STAGE9_REPORT_VALIDATION_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage9-report-validation.json");

function fail(message, detail) {
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2));
  process.exit(1);
}

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) fail(`${label} file missing`, { filePath });
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

const asArray = (value) => Array.isArray(value) ? value : [];

function statusCounts(rows = []) {
  return rows.reduce((acc, entry) => {
    const key = entry?.final_status || entry?.assessment_status || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildPreview(stage9Report, validation) {
  const report = stage9Report.report;
  const reportData = report.report_data;
  const exposureFindings = reportData.exposure_findings || {};
  return {
    artifact_type: "stage9_report_preview_v2",
    generated_at: new Date().toISOString(),
    report_title: report.report_title,
    report_status: report.report_status,
    report_version: report.report_version,
    navigation: report.navigation,
    matter_overview: reportData.matter_overview,
    executive_summary: reportData.executive_summary,
    target_profile_preview: {
      identity: reportData.target_profile?.identity,
      jurisdiction: reportData.target_profile?.jurisdiction,
      business_model: reportData.target_profile?.business_model
    },
    product_activity_ip_preview: {
      total_features: reportData.product_activity_ip_profile?.feature_inventory_summary?.total_features || 0,
      active_surfaces: reportData.product_activity_ip_profile?.risk_surface_profile?.active_surfaces || []
    },
    data_risk_preview: {
      data_flow_summary: reportData.data_risk_provenance_controls?.data_flow_summary,
      data_gaps_count: asArray(reportData.data_risk_provenance_controls?.data_gaps).length
    },
    legal_document_control_preview: {
      document_inventory_summary: reportData.legal_document_control_review?.document_inventory_summary,
      control_signal_count: asArray(reportData.legal_document_control_review?.control_signal_matrix).length
    },
    exposure_findings_preview: {
      category_count: asArray(exposureFindings.exposure_category_groups).length,
      finding_count: asArray(exposureFindings.finding_rows).length,
      first_five_categories: asArray(exposureFindings.exposure_category_groups).slice(0, 5),
      first_five_findings: asArray(exposureFindings.finding_rows).slice(0, 5)
    },
    forensic_appendix_preview: {
      row_count: asArray(reportData.forensic_ledger_appendix?.full_registry_ledger).length,
      status_counts: reportData.forensic_ledger_appendix?.full_ledger_summary?.status_counts || {}
    },
    validation
  };
}

const stage6Cache = readJson(stage6CachePath, "Stage 6 cache");
const stage7Artifact = readJson(stage7ArtifactPath, "Stage 7 audit export");
const stage8Ledger = readJson(stage8CorrectedLedgerPath, "Stage 8 corrected ledger");
const registryRuntime = readJson(registryPath, "Runtime registry");

const postChallengeLedger = asArray(stage8Ledger.post_challenge_ledger);
if (!postChallengeLedger.length) fail("Stage 8 corrected ledger contains no post_challenge_ledger", { stage8CorrectedLedgerPath });

console.log(JSON.stringify({
  ok: true,
  phase: "stage_9_report_assembler_v2_start",
  stage6_cache_path: stage6CachePath,
  stage7_artifact_path: stage7ArtifactPath,
  stage8_corrected_ledger_path: stage8CorrectedLedgerPath,
  registry_path: registryPath,
  post_challenge_rows: postChallengeLedger.length,
  post_challenge_status_counts: statusCounts(postChallengeLedger)
}, null, 2));

const stage9Report = buildStage9Report({ stage6Cache, stage7Artifact, stage8Ledger, registryRuntime });
const validation = validateStage9Report({ stage9Report, postChallengeLedger, registryRuntime });

writeJson(reportDataPath, stage9Report);
writeJson(reportValidationPath, { artifact_type: "stage9_report_validation_v2", generated_at: new Date().toISOString(), ...validation });
writeJson(reportPreviewPath, buildPreview(stage9Report, validation));

if (!validation.ok) fail("Stage 9 report validation failed", { validation, reportDataPath, reportValidationPath });

console.log(JSON.stringify({
  ok: true,
  phase: "stage_9_report_assembler_v2_complete",
  report_data_path: reportDataPath,
  report_validation_path: reportValidationPath,
  report_preview_path: reportPreviewPath,
  validation
}, null, 2));
