import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { runPhase12Compiler, PHASE12_DIRECT_COMPILER_RUNNER_STATUS } from "../src/phases/12-normalized-compiler/phase12-compiler.runner.js";
import { buildRendererPayload } from "../src/runtime/services/reporting/report-renderer.service.js";
import { loadPhase12ReportContract, getActiveOwnershipRows, uniqueOwnerArtifacts } from "../src/phases/12-normalized-compiler/phase12-report-contract.js";
import { REPORT_FACING_ARTIFACTS } from "../src/phases/12-normalized-compiler/phase12-artifact-family.contract.js";
import {
  COMPILER_ARTIFACT_NAMES,
  PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES,
  PHASE12_RENDERER_READ_ARTIFACT_NAMES
} from "../src/runtime/contracts/artifact-permissions.contract.js";
import { PIPELINE_CONTRACTS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import {
  P2G_RUNTIME_ROUTE_BY_JOB,
  P2G_PHASE_ROUTE_RUNTIME_READER_STATUS
} from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";
import { P2G_ROUTE_BUCKETS } from "../src/phases/02-cartography-index/phase-routing.contract.js";

const reportContract = loadPhase12ReportContract();
const artifacts = fixtureArtifacts(reportContract);

validatePhase2GBoundary();
const compilerOutput = await validateDirectPhase12Compiler();
validateCleanRenderer(compilerOutput);
validateRetiredAuthoritiesAbsent();

console.log(JSON.stringify({
  check: "runtime authority boundaries",
  status: "PASS",
  authorities: {
    phase2g: "ENDS_AT_PHASE11_OPERATOR_CHALLENGE",
    phase12_compiler: "DIRECT_MATERIAL_PROFILE_ARTIFACTS",
    report_renderer: "REPORT_MANIFEST_CLEAN_PROFILES"
  },
  legacy_recursive_compiler_retired: true,
  legacy_normalized_artifacts_emitted: false,
  stale_ownership_checks_retired: true
}, null, 2));

function validatePhase2GBoundary() {
  assert.equal(P2G_ROUTE_BUCKETS.length, 6);
  assert.equal(Object.prototype.hasOwnProperty.call(P2G_RUNTIME_ROUTE_BY_JOB, "NORMALIZED_COMPILER"), false);
  assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.cutover_jobs.includes("NORMALIZED_COMPILER"), false);
  assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.phase12_compiler_excluded, true);
  assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_runtime_boundary_ends_before_compiler, true);
  assert.equal(PIPELINE_CONTRACT_STATUS.phase12_direct_profile_runtime_wired, true);
  assert.equal(PIPELINE_CONTRACTS.M12.reads.includes("phase_routing_manifest"), true);
  assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.reads.includes("phase_routing_manifest"), false);
  assert.deepEqual(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.reads, PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES);
}

async function validateDirectPhase12Compiler() {
  assert.equal(PHASE12_DIRECT_COMPILER_RUNNER_STATUS.phase2g_dependency_forbidden, true);
  assert.equal(PHASE12_DIRECT_COMPILER_RUNNER_STATUS.input_authority, "DIRECT_MATERIAL_PROFILE_ARTIFACTS");
  assert.equal(PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES.includes("phase_routing_manifest"), false);
  for (const forbidden of [
    "exposure_registry_route_plan",
    "exposure_registry_workpad_98",
    "exposure_registry_profile_forensics",
    "target_profile_forensics",
    "target_feature_profile_forensics",
    "dap_forensics_profile"
  ]) assert.equal(PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES.includes(forbidden), false, `Phase 12 direct reads include forbidden artifact ${forbidden}`);

  const result = await runPhase12Compiler({
    run: { run_id: "RUNTIME_AUTHORITY_BOUNDARY_CHECK", target: "Example", root_url: "https://example.com" },
    contract: PIPELINE_CONTRACTS.NORMALIZED_COMPILER,
    readArtifacts: async ({ reads }) => Object.fromEntries(reads.map((name) => [name, artifacts[name]]))
  });

  assert.equal(result.ok, true);
  assert.equal(result.phase_lock_status, "LOCKED_WITH_LIMITATIONS");
  assert.equal(result.phase2g_dependency_forbidden, true);
  assert.deepEqual(new Set(result.artifacts_read), new Set(PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES));

  const output = result.output;
  assert.equal(output.phase12_compiler_validation.validation.status, "PASS_WITH_LIMITATION");
  assert.equal(output.report_manifest.report_facing_artifact_count, 29);
  assert.deepEqual(new Set(output.report_manifest.report_facing_artifacts), new Set(REPORT_FACING_ARTIFACTS));
  assert.equal(Object.prototype.hasOwnProperty.call(output, "normalized_report_manifest"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(output, "review_ready_section_handoff"), false);
  assert.equal(Object.keys(output).some((key) => key.startsWith("normalized_section__")), false);
  assert.deepEqual(new Set(COMPILER_ARTIFACT_NAMES), new Set(Object.keys(output)));
  assert.deepEqual(new Set(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.writes), new Set(COMPILER_ARTIFACT_NAMES));
  assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.route_delivery_mode, "DIRECT_MATERIAL_PROFILES");
  assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.phase2g_dependency_forbidden, true);
  return output;
}

function validateCleanRenderer(output) {
  assert.deepEqual(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.reads, PHASE12_RENDERER_READ_ARTIFACT_NAMES);
  const rendered = buildRendererPayload({
    run: { run_id: "RUNTIME_AUTHORITY_BOUNDARY_CHECK", target: "Example", root_url: "https://example.com" },
    artifacts: output
  }).renderer_payload;

  assert.equal(rendered.renderer_source, "report_manifest_clean_profiles");
  assert.equal(rendered.renderer_design, "ten_section_clean_profile_report");
  assert.deepEqual(rendered.section_order, ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
  assert.equal(rendered.sections.length, 10);
  assert.equal(rendered.report_artifact_source_count, 29);
  assert.equal(rendered.semantic_merge_performed, false);
  assert.equal(rendered.custody_rendered, false);
  assert.equal(rendered.report_shell.review_ready_draft, true);
  assert.equal(rendered.report_shell.local_counsel_review_required, true);
  assert.equal(rendered.sections.find((section) => section.section_id === "05").subsections.length, 12);
  assert.equal(rendered.sections.find((section) => section.section_id === "08").subsections.length, 9);
  for (const forbidden of ["registry_row_key", "batch_id", "Hunter_Trigger", "FIELD21"]) {
    assert.equal(JSON.stringify(rendered).includes(forbidden), false, `renderer leaked custody field ${forbidden}`);
  }

  const rendererSource = readFileSync("src/runtime/services/reporting/report-renderer.service.js", "utf8");
  assert.ok(rendererSource.includes("report_manifest_clean_profiles"));
  assert.equal(rendererSource.includes("normalized_section_artifacts_only"), false);
  assert.equal(rendererSource.includes("normalized_section__"), false);

  const publicReport = readFileSync("public/interface-diligence/diligence-system/report.js", "utf8");
  assert.ok(publicReport.includes('LOCKED_RENDERER_SOURCE = "report_manifest_clean_profiles"'));
  assert.equal(publicReport.includes('LOCKED_RENDERER_SOURCE = "normalized_section_artifacts_only"'), false);
}

function validateRetiredAuthoritiesAbsent() {
  for (const file of [
    "src/phases/12-normalized-compiler/compiler-m9-section6-v3.js",
    "src/phases/12-normalized-compiler/phase7-dap-report-projection.js",
    "src/phases/12-normalized-compiler/exposure-tier-normalizer.js",
    "src/phases/12-normalized-compiler/normalized-profiler-m9-section6-v4.js",
    "src/phases/12-normalized-compiler/normalized-profiler-section10-v3.js",
    "src/phases/12-normalized-compiler/normalized-profiler-section789-v2.js",
    "src/phases/12-normalized-compiler/normalized-profiler.js",
    "src/phases/12-normalized-compiler/legal-section-normalizer.js",
    "src/phases/12-normalized-compiler/report-safe-language.js",
    "src/phases/12-normalized-compiler/forensic-annexure-normalizer.js",
    "src/phases/12-normalized-compiler/report-normalization-map.js",
    "src/phases/12-normalized-compiler/normalized-status.js",
    "src/phases/12-normalized-compiler/normalizer-validator.js",
    "src/phases/12-normalized-compiler/normalizer-validator-new-field-sync-v5.js",
    "src/phases/12-normalized-compiler/normalizer-validator-section10-v4.js",
    "src/phases/12-normalized-compiler/normalized-compiler.runner.js",
    "scripts/check-phase2g-no-competing-routing-authority.mjs",
    "scripts/check-phase2g-runtime-cutover-through-compiler.mjs",
    "scripts/check-phase11-ownership-cleanup.mjs",
    "scripts/check-renderer-ownership-cleanup.mjs",
    "scripts/check-central-runtime-no-legacy-implementation.mjs",
    "scripts/check-co-p12-05.mjs"
  ]) assert.equal(existsSync(file), false, `retired authority remains: ${file}`);

  const pipeline = readFileSync("src/runtime/services/pipeline.service.js", "utf8");
  assert.ok(pipeline.includes("../../phases/12-normalized-compiler/phase12-compiler.runner.js"));
  assert.equal(pipeline.includes("runCompilerPhase2G"), false);
  assert.equal(pipeline.includes("phase12_compiler_phase2g_derived_only_runner_wired"), false);
}

function fixtureArtifacts(contract) {
  const out = {};
  for (const name of uniqueOwnerArtifacts(contract)) out[name] = { __fdr_values: {} };
  for (const row of getActiveOwnershipRows(contract)) {
    const owner = row.owner_artifacts[0];
    out[owner].__fdr_values[row.field_id] = `fixture value for ${row.field_id}`;
  }
  const rows = [
    materialRow("ai-governance::UNI_TEST_001", "UNI_TEST_001", "TRIGGERED", "PRIMARY", "ai-governance"),
    materialRow("ai-governance::UNI_TEST_002", "UNI_TEST_002", "CONTROLLED_BY_VISIBLE_CONTROL", "PRIMARY", "ai-governance"),
    materialRow("fintech::PAY_TEST_001", "PAY_TEST_001", "CONTROLLED_BY_EXCLUSION", "OVERLAY", "fintech"),
    materialRow("fintech::PAY_TEST_002", "PAY_TEST_002", "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION", "OVERLAY", "fintech")
  ];
  out.exposure_registry_triggered_profile = {
    report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
    triggered_rows: rows.filter((row) => row.evaluation_status === "TRIGGERED"),
    __fdr_values: out.exposure_registry_triggered_profile?.__fdr_values || {}
  };
  out.exposure_registry_controlled_profile = {
    report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
    controlled_rows: rows.filter((row) => row.evaluation_status !== "TRIGGERED"),
    __fdr_values: out.exposure_registry_controlled_profile?.__fdr_values || {}
  };
  out.challenge_gate = {
    schema_version: "challenge_gate.v4.operator_challenge",
    status: "PASS_WITH_LIMITATION",
    compiler_handoff_allowed: true,
    final_gate_fingerprint: "d".repeat(64),
    layer_status: { layer_1: "COMPLETE", layer_2: "COMPLETE", layer_3: "COMPLETE" },
    reinvestigation_dispatch_required: false,
    advisory_warnings: [{
      challenge_candidate_id: "P11.C.001",
      disposition: "UNRESOLVED_AFTER_REINVESTIGATION",
      affected_artifacts: ["target_feature_profile"],
      affected_field_paths: ["activities[0].mechanics_proof"],
      affected_registry_row_keys: [rows[0].registry_row_key],
      limitation_if_unresolved: "Private workflow evidence remains unavailable.",
      materiality_analysis: "Preserve the limitation."
    }]
  };
  return out;
}

function materialRow(registryRowKey, threatId, status, streamType, packageId) {
  return {
    registry_row_key: registryRowKey,
    package_id: packageId,
    source_domain: packageId,
    stream_id: `${streamType}::${packageId}`,
    stream_type: streamType,
    Threat_ID: threatId,
    Threat_Name: `${threatId} exposure`,
    Lane: packageId === "fintech" ? "PAY" : "A",
    Behavior_Class: packageId === "fintech" ? "PAY" : "UNI",
    Surface: "Consumer-Public",
    Subcategory: "TEST",
    Compliance_Framework: null,
    Authority_IN: "Indian authority",
    Authority_EU: "EU authority",
    Authority_US: "US authority",
    Velocity: "ACTIVE_NOW",
    Pain_Tier: status === "TRIGGERED" ? "T2" : "T4",
    Pain_Category: status === "TRIGGERED" ? "Deal Death" : "Regulatory Heat",
    Pain_Depth: "Corporate",
    Status: "Active",
    Effective_Date: "2026-01-01",
    Legal_Pain: "Legal consequence carried from Phase 10.",
    FP_Mechanism: "False-positive mechanism carried from Phase 10.",
    FP_Impact: "False-positive impact carried from Phase 10.",
    Lex_Nova_Fix: "Recommended response carried from Phase 10.",
    Hunter_Trigger: "Internal trigger mechanics.",
    Provenance: "Phase 10 fixture provenance.",
    FIELD21: "TEST",
    FIELD22: "TEST",
    FIELD23: 1,
    target_match: "Target match carried from Phase 10.",
    evaluation_status: status,
    basis_proof: "Basis proof carried from Phase 10.",
    control_exclusion_evaluation: "Control or exclusion position carried from Phase 10.",
    evidence_source_basis: "Evidence basis carried from Phase 10.",
    applied_fp_mechanism: "Applied false-positive mechanism carried from Phase 10.",
    row_limitations: "Upstream row limitation.",
    review_route: "QUALIFIED_REVIEW"
  };
}
