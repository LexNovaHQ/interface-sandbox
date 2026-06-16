#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const outputRoot = path.resolve(process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), ".runtime-e2e-cache", "full-runtime-audit"));
const generatedAt = new Date().toISOString();

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function asObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function readJsonOptional(name) {
  const filePath = path.join(outputRoot, name);
  if (!fs.existsSync(filePath)) return null;
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch (error) { return { __parse_error: error?.message || String(error), __artifact_name: name }; }
}
function writeJson(name, value) { ensureDir(outputRoot); fs.writeFileSync(path.join(outputRoot, name), JSON.stringify(value, null, 2), "utf8"); return name; }
function writeText(name, value) { ensureDir(outputRoot); fs.writeFileSync(path.join(outputRoot, name), value, "utf8"); return name; }
function appendSummary(markdown) { if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, "utf8"); }

function countSourceFamilies(records = []) {
  const counts = {};
  for (const record of asArray(records)) counts[record?.source_family || "unknown"] = (counts[record?.source_family || "unknown"] || 0) + 1;
  return counts;
}
function losslessCount(records = []) { return asArray(records).filter((record) => typeof record?.text?.clean_text_lossless === "string" && record.text.clean_text_lossless.length > 0).length; }
function cleanTextBytes(records = []) { return asArray(records).reduce((sum, record) => sum + Buffer.byteLength(String(record?.text?.clean_text_lossless || ""), "utf8"), 0); }
function reinvestigationFrom(validation = {}) { return validation?.reinvestigation_required === true || validation?.status === "REINVESTIGATE_REQUIRED"; }
function reinvestigationCount(validation = {}) { return asArray(validation?.reinvestigation_requests).length; }
function makeArtifact(stage_id, direction, summary) {
  const name = `${stage_id}-${direction}-summary.json`;
  writeJson(name, { ok: summary?.ok !== false, artifact_type: "full_live_runtime_audit_stage_io_summary", generated_at: generatedAt, stage_id, direction, ...summary });
  return name;
}
function stageStatus(outputSummary = {}) {
  if (outputSummary.present === false) return "MISSING";
  if (outputSummary.ok === false && outputSummary.reinvestigation_required !== true) return "FAIL";
  if (outputSummary.reinvestigation_required === true) return "REINVESTIGATION";
  return "PASS";
}

const auditRequest = readJsonOptional("00-audit-request.json") || {};
const sourceDiscovery = readJsonOptional("01-source-discovery.json") || {};
const sourceCapture = readJsonOptional("02-source-capture.json") || {};
const sourceBundle = readJsonOptional("03-evidence-refiner-source-bundle.json") || {};
const evidenceJunction = readJsonOptional("04-evidence-junction.json") || {};
const companyProfile = readJsonOptional("05-target-profile.json") || {};
const targetFeatureProfile = readJsonOptional("05-target-feature-profile.json") || readJsonOptional("stage5-final-target-feature-profile.json") || {};
const stage5Input = readJsonOptional("06-stage5-input-custody-package.json") || {};
const stage5Runtime = readJsonOptional("stage5-canonical-runtime-summary.json") || {};
const stage5Ledger = readJsonOptional("stage5-source-window-ledger.json") || [];
const stage5a = readJsonOptional("stage5a-product-function-discovery.json") || {};
const stage5b = readJsonOptional("stage5b-archetype-surface-tagging.json") || {};
const stage5c = readJsonOptional("stage5c-complete-feature-records.json") || {};
const stage5d = readJsonOptional("stage5d-target-feature-profile-integrator.json") || {};
const stage6Input = readJsonOptional("11-stage6-input-custody-package.json") || {};
const stage6Runtime = readJsonOptional("08-stage6-canonical-runtime.json") || {};
const stage6a = readJsonOptional("12-stage6a-legal-cartography.json") || {};
const stage6b = readJsonOptional("13-stage6b-legal-governance-data-provenance-profile.json") || readJsonOptional("13-stage6b-data-provenance-profile.json") || {};
const stage6c = readJsonOptional("14-stage6c-data-provenance-integration.json") || {};
const stage6Handoff = readJsonOptional("15-stage6-stage7-handoff.json") || {};

const sourceRecords = asArray(sourceBundle?.raw_footprint?.source_records || sourceCapture?.raw_footprint?.source_records);
const productLossless = sourceRecords.filter((record) => ["product_profile", "product_family"].includes(record?.source_family) && typeof record?.text?.clean_text_lossless === "string" && record.text.clean_text_lossless.length > 0);
const legalLossless = sourceRecords.filter((record) => /legal|governance|privacy|terms|security|trust|dpa|policy/i.test(`${record?.source_family || ""} ${record?.url || ""} ${record?.title || ""}`) && typeof record?.text?.clean_text_lossless === "string" && record.text.clean_text_lossless.length > 0);

const stageRows = [];
function addStage(stage_id, label, inputSummary, outputSummary) {
  const inputArtifact = makeArtifact(stage_id, "input", inputSummary);
  const outputArtifact = makeArtifact(stage_id, "output", outputSummary);
  stageRows.push({
    stage_id,
    label,
    status: stageStatus(outputSummary),
    input_artifact: inputArtifact,
    output_artifact: outputArtifact,
    output_rows: outputSummary?.primary_rows ?? outputSummary?.output_rows ?? outputSummary?.records ?? outputSummary?.source_count ?? outputSummary?.feature_count ?? 0,
    notes: outputSummary?.notes || ""
  });
}

addStage("stage1", "Stage 1 - Source Discovery", {
  input_contract: "target_url + company_name + live discovery policy",
  target_url: auditRequest?.target_input?.primary_url || auditRequest?.target_input?.url || null,
  company_name: auditRequest?.target_input?.company_name || null,
  runtime_url: auditRequest?.runtime_url || null,
  forbidden_fixture_mode: true
}, {
  present: Boolean(sourceDiscovery && Object.keys(sourceDiscovery).length),
  ok: sourceDiscovery?.ok === true,
  source_count: Number(sourceDiscovery?.source_count || 0),
  diagnostics_present: Boolean(sourceDiscovery?.diagnostics),
  output_artifact: "01-source-discovery.json"
});

addStage("stage2", "Stage 2 - Source Capture", {
  input_contract: "Stage 1 discovery candidates + live capture policy",
  source_count_from_stage1: Number(sourceDiscovery?.source_count || 0),
  capture_requires_lossless_text: true
}, {
  present: Boolean(sourceCapture && Object.keys(sourceCapture).length),
  ok: sourceCapture?.ok === true,
  records: asArray(sourceCapture?.raw_footprint?.source_records).length,
  clean_text_lossless_records: losslessCount(sourceCapture?.raw_footprint?.source_records),
  clean_text_lossless_bytes: cleanTextBytes(sourceCapture?.raw_footprint?.source_records),
  family_counts: countSourceFamilies(sourceCapture?.raw_footprint?.source_records),
  output_artifact: "02-source-capture.json"
});

addStage("stage3", "Stage 3 - Evidence Refiner / Source Bundle", {
  input_contract: "Stage 2 raw footprint + captured clean_text_lossless records",
  captured_records: asArray(sourceCapture?.raw_footprint?.source_records).length,
  captured_lossless_records: losslessCount(sourceCapture?.raw_footprint?.source_records)
}, {
  present: Boolean(sourceBundle && Object.keys(sourceBundle).length && evidenceJunction && Object.keys(evidenceJunction).length),
  ok: Boolean(asArray(sourceBundle?.raw_footprint?.source_records).length && evidenceJunction && Object.keys(evidenceJunction).length),
  records: sourceRecords.length,
  clean_text_lossless_records: losslessCount(sourceRecords),
  product_profile_lossless_records: productLossless.length,
  product_family_lossless_records: productLossless.length,
  legal_governance_lossless_records: legalLossless.length,
  source_bundle_sha256: evidenceJunction?.source_bundle_sha256 || null,
  family_counts: countSourceFamilies(sourceRecords),
  output_artifacts: ["03-evidence-refiner-source-bundle.json", "04-evidence-junction.json"]
});

addStage("stage4", "Stage 4 - Company / Target Profile", {
  input_contract: "Stage 3 source bundle + evidence junction; product-feature mapping forbidden",
  target_profile_source_count: sourceRecords.length,
  company_family_source_count: sourceRecords.filter((record) => record?.source_family === "company_profile").length
}, {
  present: Boolean(companyProfile && Object.keys(companyProfile).length),
  ok: Boolean(companyProfile && Object.keys(companyProfile).length),
  target_profile_version: companyProfile?.target_profile_version || null,
  brand_name: companyProfile?.identity?.brand_name || companyProfile?.identity?.legal_name || null,
  domain: companyProfile?.identity?.domain || companyProfile?.identity?.website || null,
  output_artifact: "05-target-profile.json"
});

addStage("stage5", "Stage 5 - Canonical Lossless Window Runtime", {
  input_contract: "live sourceBundle + evidenceJunction + companyProfile; no legacy adapter",
  input_artifact: "06-stage5-input-custody-package.json",
  primary_source_count: Number(stage5Input?.primary_source_count || 0),
  navigation_index_count: Number(stage5Input?.navigation_index_count || 0),
  product_profile_lossless_records: productLossless.length,
  legacy_adapter_used: stage5Input?.legacy_adapter_used === true
}, {
  present: Boolean(stage5Runtime && Object.keys(stage5Runtime).length),
  ok: stage5Runtime?.ok === true,
  stage5_version: stage5Runtime?.stage5_version || null,
  source_window_count: Number(stage5Runtime?.evidence?.source_window_count || asArray(stage5Ledger).length || 0),
  feature_count: asArray(targetFeatureProfile?.feature_inventory).length,
  reinvestigation_required: stage5Runtime?.validation?.reinvestigation_required === true,
  reinvestigation_request_count: asArray(stage5Runtime?.validation?.reinvestigation_requests).length,
  output_artifacts: ["stage5-canonical-runtime-summary.json", "stage5-final-target-feature-profile.json", "stage5-source-window-ledger.json"]
});

addStage("stage5a", "Stage 5A - Product Function Discovery", { input_contract: "Stage 5 primary lossless custody + verbatim capability windows", primary_source_count: Number(stage5Input?.primary_source_count || 0) }, { present: Boolean(Object.keys(stage5a).length), ok: stage5a?.validation?.ok !== false, output_version: stage5a?.stage5a_output_version || null, primary_rows: asArray(stage5a?.admitted_functions).length, source_window_count: asArray(stage5a?.feature_evidence_windows).length, reinvestigation_required: stage5a?.validation?.reinvestigation_required === true, reinvestigation_request_count: asArray(stage5a?.validation?.reinvestigation_requests).length, output_artifact: "stage5a-product-function-discovery.json" });
addStage("stage5b", "Stage 5B - Archetype / Surface Tagging", { input_contract: "5A admitted functions + 5A windows + full source custody", upstream_functions: asArray(stage5a?.admitted_functions).length }, { present: Boolean(Object.keys(stage5b).length), ok: stage5b?.validation?.ok !== false, output_version: stage5b?.stage5b_output_version || null, primary_rows: asArray(stage5b?.feature_tags).length, source_window_count: asArray(stage5b?.supplemental_evidence_windows).length, reinvestigation_required: stage5b?.validation?.reinvestigation_required === true, reinvestigation_request_count: asArray(stage5b?.validation?.reinvestigation_requests).length, output_artifact: "stage5b-archetype-surface-tagging.json" });
addStage("stage5c", "Stage 5C - Complete Feature Record Builder", { input_contract: "5A functions + 5B tags/windows + full source custody", upstream_functions: asArray(stage5a?.admitted_functions).length, upstream_tags: asArray(stage5b?.feature_tags).length }, { present: Boolean(Object.keys(stage5c).length), ok: stage5c?.validation?.ok !== false, output_version: stage5c?.stage5c_output_version || null, primary_rows: asArray(stage5c?.complete_feature_records).length, source_window_count: asArray(stage5c?.supplemental_evidence_windows).length, data_touchpoint_count: asArray(stage5c?.data_touchpoints || stage5c?.feature_data_touchpoints).length, reinvestigation_required: stage5c?.validation?.reinvestigation_required === true, reinvestigation_request_count: asArray(stage5c?.validation?.reinvestigation_requests).length, output_artifact: "stage5c-complete-feature-records.json" });
addStage("stage5d", "Stage 5D - target_feature_profile Integrator", { input_contract: "5A + 5B + 5C canonical substage outputs; downstream contract preserved", upstream_complete_feature_records: asArray(stage5c?.complete_feature_records).length, internal_5c_fields_must_not_leak: true }, { present: Boolean(Object.keys(stage5d).length), ok: stage5d?.validation?.ok === true || targetFeatureProfile?.classification_quality?.reinvestigation_required === true, output_version: stage5d?.stage5d_output_version || null, primary_rows: asArray(stage5d?.target_feature_profile?.feature_inventory || targetFeatureProfile?.feature_inventory).length, reinvestigation_required: stage5d?.validation?.reinvestigation_required === true || targetFeatureProfile?.classification_quality?.reinvestigation_required === true, reinvestigation_request_count: asArray(stage5d?.validation?.reinvestigation_requests).length, output_artifacts: ["stage5d-target-feature-profile-integrator.json", "stage5-final-target-feature-profile.json"] });

addStage("stage6", "Stage 6 - Canonical Legal/Governance Runtime", {
  input_contract: "Stage 3 legal/governance lossless source family + Stage 4 profile + Stage 5 target_feature_profile",
  input_artifact: "11-stage6-input-custody-package.json",
  legal_governance_lossless_records: legalLossless.length,
  target_feature_count: asArray(targetFeatureProfile?.feature_inventory).length
}, {
  present: Boolean(Object.keys(stage6Runtime).length),
  ok: stage6Runtime?.ok === true,
  output_version: stage6Runtime?.stage6_output_version || null,
  active_substages: asArray(stage6Runtime?.forensic_log?.active_substages).join(", "),
  reinvestigation_required: reinvestigationFrom(stage6Runtime?.validation?.foundation),
  reinvestigation_request_count: reinvestigationCount(stage6Runtime?.validation?.foundation),
  output_artifacts: ["08-stage6-canonical-runtime.json", "11-stage6-input-custody-package.json"]
});

addStage("stage6a", "Stage 6A - Legal Cartography", {
  input_contract: "Stage 6 legal/governance full lossless source custody",
  source_family: "legal_governance",
  legal_governance_lossless_records: legalLossless.length
}, {
  present: Boolean(Object.keys(stage6a).length),
  ok: stage6a?.ok !== false,
  output_version: stage6a?.stage6a_output_version || null,
  primary_rows: asArray(stage6a?.legal_cartography?.legal_unit_map).length,
  source_window_count: asArray(stage6a?.legal_cartography?.legal_source_window_ledger).length,
  reinvestigation_required: stage6a?.validation?.status === "REINVESTIGATE_REQUIRED",
  reinvestigation_request_count: asArray(stage6a?.validation?.reinvestigation_requests).length,
  output_artifact: "12-stage6a-legal-cartography.json"
});

addStage("stage6b", "Stage 6B - Legal Governance Data Provenance", {
  input_contract: "Stage 6 input + 6A legal cartography; Stage 5 reference only",
  legal_unit_count: asArray(stage6a?.legal_cartography?.legal_unit_map).length,
  source_window_count: asArray(stage6a?.legal_cartography?.legal_source_window_ledger).length
}, {
  present: Boolean(Object.keys(stage6b).length),
  ok: stage6b?.ok !== false,
  output_version: stage6b?.stage6b_output_version || null,
  primary_rows: asArray(stage6b?.legal_governance_data_provenance_profile?.legal_data_findings).length,
  legal_unit_packet_count: asArray(stage6b?.legal_unit_packets).length,
  source_window_count: asArray(stage6b?.source_window_ledger).length,
  reinvestigation_required: stage6b?.validation?.status === "REINVESTIGATE_REQUIRED",
  reinvestigation_request_count: asArray(stage6b?.validation?.reinvestigation_requests).length,
  output_artifact: "13-stage6b-legal-governance-data-provenance-profile.json"
});

addStage("stage6c", "Stage 6C - Data Provenance Integration", {
  input_contract: "Stage 5 product-observed profile + 6B legal/governance data provenance profile",
  target_feature_count: asArray(targetFeatureProfile?.feature_inventory).length,
  legal_data_finding_count: asArray(stage6b?.legal_governance_data_provenance_profile?.legal_data_findings).length
}, {
  present: Boolean(Object.keys(stage6c).length),
  ok: stage6c?.ok !== false,
  output_version: stage6c?.stage6c_output_version || null,
  primary_rows: asArray(stage6c?.data_provenance_profile?.integrated_data_flows).length,
  product_observed_flow_count: asArray(stage6c?.product_observed_flows).length,
  legal_governance_finding_count: asArray(stage6c?.legal_governance_findings).length,
  reinvestigation_required: stage6c?.validation?.status === "REINVESTIGATE_REQUIRED",
  reinvestigation_request_count: asArray(stage6c?.validation?.reinvestigation_requests).length,
  output_artifact: "14-stage6c-data-provenance-integration.json"
});

addStage("stage6handoff", "Stage 6C → Stage 7 Handoff", {
  input_contract: "Stage 6 runtime output + 6C integrated data provenance profile",
  stage6_runtime_present: Boolean(Object.keys(stage6Runtime).length),
  stage6c_present: Boolean(Object.keys(stage6c).length)
}, {
  present: Boolean(Object.keys(stage6Handoff).length),
  ok: Boolean(stage6Handoff?.primary_evidence && stage6Handoff?.reference_profiles),
  output_rows: asArray(stage6Handoff?.reference_profiles?.data_provenance_profile?.integrated_data_flows).length,
  output_artifact: "15-stage6-stage7-handoff.json"
});

const index = { ok: stageRows.every((row) => row.status === "PASS" || row.status === "REINVESTIGATION"), artifact_type: "full_live_runtime_audit_stage_io_index", generated_at: generatedAt, stages: stageRows };
writeJson("full-audit-stage-io-index.json", index);

const summary = `# Runtime API Full Live Audit — Stage Input/Output Map\n\n` +
  `| Stage | Status | Input summary | Output summary | Output rows | Notes |\n` +
  `|---|---:|---|---|---:|---|\n` +
  stageRows.map((row) => `| ${row.label} | ${row.status} | ${row.input_artifact} | ${row.output_artifact} | ${row.output_rows ?? 0} | ${row.notes || ""} |`).join("\n") +
  "\n";
writeText("20-summary.md", summary);
appendSummary(summary);
console.log(JSON.stringify(index, null, 2));