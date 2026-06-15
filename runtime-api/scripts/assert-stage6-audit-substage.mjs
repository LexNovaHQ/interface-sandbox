#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const outputRoot = path.resolve(process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), ".runtime-e2e-cache", "full-runtime-audit"));
const requested = String(process.argv[2] || "").toLowerCase();

function fail(message, detail = {}) {
  console.error(JSON.stringify({ ok: false, stage: requested, error: message, ...detail }, null, 2));
  process.exit(1);
}
function warn(message) { console.log(`::warning title=Stage 6 audit reinvestigation::${message}`); }
function readJson(name) {
  const filePath = path.join(outputRoot, name);
  if (!fs.existsSync(filePath)) fail(`Missing artifact ${name}`);
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch (error) { fail(`Invalid JSON artifact ${name}`, { parse_error: error?.message || String(error) }); }
}
function asArray(value) { return Array.isArray(value) ? value : []; }
function hasObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length); }
function requireIoFor(stageId) {
  const input = readJson(`${stageId}-input-summary.json`);
  const output = readJson(`${stageId}-output-summary.json`);
  const forensic = readJson(`${stageId}-forensic-summary.json`);
  if (input.stage_id !== stageId || input.direction !== "input") fail(`Invalid ${stageId} input summary identity`, { input });
  if (output.stage_id !== stageId || output.direction !== "output") fail(`Invalid ${stageId} output summary identity`, { output });
  if (forensic.stage_id !== stageId) fail(`Invalid ${stageId} forensic summary identity`, { forensic });
  return { input, output, forensic };
}
function validationStatus(output = {}) {
  return output?.validation?.status || output?.validation?.foundation?.status || output?.status || null;
}
function reinvestigationRequired(output = {}) {
  return validationStatus(output) === "REINVESTIGATE_REQUIRED" || output?.validation?.reinvestigation_required === true || output?.validation?.foundation?.status === "REINVESTIGATE_REQUIRED";
}

const SPECS = {
  "6": {
    stageId: "stage6",
    artifact: "08-stage6-canonical-runtime.json",
    versionKey: "stage6_output_version",
    expectedVersion: "stage6_canonical_runtime_v1",
    validate(output) {
      if (output.status === "CONTRACT_VIOLATION") return { reinvestigation: true, reason: "Stage 6 foundation contract violation requires upstream legal/governance source custody repair." };
      if (output.ok !== true) fail("Stage 6 canonical runtime did not pass", { output_status: output.status, validation: output.validation });
      if (!hasObject(output.stage7_handoff)) fail("Stage 6 runtime missing stage7_handoff");
    }
  },
  "6a": {
    stageId: "stage6a",
    artifact: "12-stage6a-legal-cartography.json",
    versionKey: "stage6a_output_version",
    expectedVersion: "stage6a_legal_cartography_v1",
    validate(output) {
      const cartography = output.legal_cartography || {};
      if (!asArray(cartography.legal_unit_map).length && !reinvestigationRequired(output)) fail("6A legal_unit_map is empty without reinvestigation request");
      if (!asArray(cartography.legal_source_window_ledger).length && !reinvestigationRequired(output)) fail("6A legal_source_window_ledger is empty without reinvestigation request");
      const windowIds = new Set(asArray(cartography.legal_source_window_ledger).map((row) => row.window_id));
      for (const unit of asArray(cartography.legal_unit_map)) {
        if (!unit.source_window_ref || !windowIds.has(unit.source_window_ref)) fail("6A legal unit has missing source_window_ref", { legal_unit_id: unit.legal_unit_id, source_window_ref: unit.source_window_ref });
      }
    }
  },
  "6b": {
    stageId: "stage6b",
    artifact: "13-stage6b-legal-governance-data-provenance-profile.json",
    versionKey: "stage6b_output_version",
    expectedVersion: "stage6b_legal_governance_data_provenance_v1",
    validate(output) {
      const profile = output.legal_governance_data_provenance_profile || {};
      const findings = asArray(profile.legal_data_findings);
      if (!findings.length && !reinvestigationRequired(output)) fail("6B legal_data_findings is empty without reinvestigation request");
      for (const finding of findings) {
        if (!asArray(finding.legal_unit_refs).length) fail("6B finding missing legal_unit_refs", { legal_data_finding_id: finding.legal_data_finding_id });
        if (!asArray(finding.source_window_refs).length) fail("6B finding missing source_window_refs", { legal_data_finding_id: finding.legal_data_finding_id });
        if (finding.source_basis !== "LEGAL_GOVERNANCE_SOURCE") fail("6B finding source_basis is not LEGAL_GOVERNANCE_SOURCE", { legal_data_finding_id: finding.legal_data_finding_id, source_basis: finding.source_basis });
      }
    }
  },
  "6c": {
    stageId: "stage6c",
    artifact: "14-stage6c-data-provenance-integration.json",
    versionKey: "stage6c_output_version",
    expectedVersion: "stage6c_data_provenance_integration_v1",
    validate(output) {
      const profile = output.data_provenance_profile || {};
      const rows = asArray(profile.integrated_data_flows);
      const productFlows = asArray(output.product_observed_flows);
      const legalFindings = asArray(output.legal_governance_findings);
      if (!rows.length && (productFlows.length || legalFindings.length) && !reinvestigationRequired(output)) fail("6C integrated_data_flows is empty despite inputs and no reinvestigation request");
      for (const row of rows) {
        if (!row.integrated_data_flow_id) fail("6C row missing integrated_data_flow_id");
        if (!row.alignment_status) fail("6C row missing alignment_status", { row });
      }
    }
  },
  "6handoff": {
    stageId: "stage6handoff",
    artifact: "15-stage6-stage7-handoff.json",
    validate(output) {
      if (!hasObject(output.primary_evidence)) fail("Stage 6→7 handoff missing primary_evidence");
      if (!hasObject(output.reference_profiles)) fail("Stage 6→7 handoff missing reference_profiles");
      if (!hasObject(output.source_custody)) fail("Stage 6→7 handoff missing source_custody");
      if (!hasObject(output.reference_profiles.data_provenance_profile)) fail("Stage 6→7 handoff missing 6C data_provenance_profile");
    }
  }
};

const spec = SPECS[requested];
if (!spec) fail("Usage: node scripts/assert-stage6-audit-substage.mjs <6|6a|6b|6c|6handoff>");
const io = requireIoFor(spec.stageId);
const artifact = readJson(spec.artifact);
if (spec.versionKey && artifact?.[spec.versionKey] !== spec.expectedVersion) {
  fail(`Unexpected ${spec.stageId} output version`, { expected: spec.expectedVersion, received: artifact?.[spec.versionKey] });
}
const result = spec.validate(artifact) || {};
if (result.reinvestigation) warn(result.reason || `${spec.stageId} requires reinvestigation`);
console.log(JSON.stringify({ ok: true, stage: spec.stageId, artifact: spec.artifact, status: io.output.status || artifact.status || artifact.validation?.status || "PASS", input_summary: `${spec.stageId}-input-summary.json`, output_summary: `${spec.stageId}-output-summary.json`, forensic_summary: `${spec.stageId}-forensic-summary.json` }, null, 2));