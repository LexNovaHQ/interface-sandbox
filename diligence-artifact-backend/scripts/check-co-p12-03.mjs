import assert from "node:assert/strict";

import {
  buildPhase12AdmissionAdapter,
  buildPhase12RouteAdapter,
  compilePhase12DirectReportProjection,
  loadPhase12ReportContract,
  REPORT_FACING_ARTIFACTS,
  SECTION5_CHILD_PROFILES,
  SECTION8_CHILD_PROFILES
} from "../src/phases/12-normalized-compiler/phase12-adapters.js";
import { uniqueOwnerArtifacts, getActiveOwnershipRows } from "../src/phases/12-normalized-compiler/phase12-report-contract.js";

const contract = loadPhase12ReportContract();
assert.equal(contract.validation.status, "PASS");
assert.equal(contract.validation.active_owned_field_count, 430);
assert.equal(contract.validation.blocked_gap_field_count, 27);

const artifacts = buildFixtureArtifacts(contract, "PASS_WITH_LIMITATION");
const admission = buildPhase12AdmissionAdapter({ run: { run_id: "CO_P12_03_TEST" }, artifacts, contract }).phase12_admission;
assert.equal(admission.status, "PASS_WITH_LIMITATION");
assert.equal(admission.phase2g_inputs_present.length, 0);
assert.equal(admission.missing_owner_artifacts.length, 0);
assert.equal(admission.phase10_downstream_compatibility.phase11_warning_projection.warning_count, 1);

const forbidden = buildPhase12AdmissionAdapter({
  run: { run_id: "CO_P12_03_FORBIDDEN_PHASE2G" },
  artifacts: { ...artifacts, phase_routing_manifest: { forbidden: true } },
  contract
}).phase12_admission;
assert.equal(forbidden.validation.status, "CONTROLLED_FAILURE");
assert.ok(forbidden.validation.failures.some((failure) => failure.includes("PHASE12_FORBIDDEN_PHASE2G_INPUT_PRESENT:phase_routing_manifest")));

const route = buildPhase12RouteAdapter({ run: { run_id: "CO_P12_03_TEST" }, artifacts, admission, contract }).phase12_route_plan;
assert.equal(route.status, "PASS");
assert.equal(route.active_field_route_count, 430);
assert.equal(route.blocked_upstream_gap_count, 27);
assert.equal(route.section_count, 10);
assert.equal(route.phase2g_dependency_forbidden, true);
assert.ok(route.blocked_gap_rows.every((row) => row.p12_derivation_forbidden === true));

const projected = compilePhase12DirectReportProjection({ run: { run_id: "CO_P12_03_TEST" }, artifacts, admission, routePlan: route, contract });
assert.equal(projected.report_manifest.status, "PASS_WITH_LIMITATION");
assert.equal(projected.report_manifest.canonical_section_count, 10);
assert.equal(projected.report_manifest.report_facing_artifact_count, 29);
assert.deepEqual(new Set(projected.report_manifest.report_facing_artifacts), new Set(REPORT_FACING_ARTIFACTS));
assert.equal(projected.phase12_compiler_validation.validation.status, "PASS_WITH_LIMITATION");
assert.equal(projected.report_handoff.local_counsel_review_required, true);
assert.equal(projected.final_output_handoff.compiler_trace.old_recursive_profiler_not_used_by_adapter, true);
assert.equal(projected.renderer_payload.report_artifact_refs.length, 29);
assert.equal(Object.keys(projected).some((key) => key.startsWith("normalized_section__")), false);

const section5 = projected.report_section__05_data_provenance_privacy_architecture;
assert.equal(section5.artifact_role, "SECTION_WRAPPER");
assert.equal(Object.prototype.hasOwnProperty.call(section5, "findings"), false);
assert.deepEqual(new Set(section5.child_artifacts), new Set(SECTION5_CHILD_PROFILES.map((row) => row.artifact_name)));
for (const profile of SECTION5_CHILD_PROFILES) {
  const artifact = projected[profile.artifact_name];
  assert.equal(artifact.artifact_role, "SECTION_PROFILE", profile.artifact_name);
  assert.equal(artifact.section_id, "05", profile.artifact_name);
}

const section8 = projected.report_section__08_exposure_register;
assert.equal(section8.artifact_role, "SECTION_WRAPPER");
assert.equal(Object.prototype.hasOwnProperty.call(section8, "rows"), false);
assert.deepEqual(new Set(section8.child_artifacts), new Set(SECTION8_CHILD_PROFILES.map((row) => row.artifact_name)));
for (const profile of SECTION8_CHILD_PROFILES) {
  const artifact = projected[profile.artifact_name];
  assert.equal(artifact.artifact_role, "SECTION_PROFILE", profile.artifact_name);
  assert.equal(artifact.stream_scope, profile.stream_scope, profile.artifact_name);
  assert.equal(artifact.material_status, profile.material_status, profile.artifact_name);
}
assert.equal(projected.report_section__08_primary_triggered_exposures.rows.length, 1);
assert.equal(projected.report_section__08_primary_controlled_by_visible_control.rows.length, 1);
assert.equal(projected.report_section__08_overlay_controlled_by_exclusion.rows.length, 1);
assert.equal(projected.report_section__08_overlay_controlled_by_public_evidence_limitation.rows.length, 1);
assert.equal(projected.report_section__09_open_review_items_handoff.open_review_items.length, 1);
assert.equal(projected.phase12_report_custody_manifest.exposure_row_bindings.length, 4);

const passProjection = compilePhase12DirectReportProjection({
  run: { run_id: "CO_P12_03_PASS_TEST" },
  artifacts: buildFixtureArtifacts(contract, "PASS"),
  contract
});
assert.equal(passProjection.report_manifest.status, "PASS");
assert.equal(passProjection.report_section__09_open_review_items_handoff.open_review_items.length, 0);

console.log("CO-P12-03 route, admission and amended projection adapters: PASS");

function buildFixtureArtifacts(contract, challengeStatus) {
  const artifacts = {};
  for (const name of uniqueOwnerArtifacts(contract)) artifacts[name] = { __fdr_values: {} };
  for (const row of getActiveOwnershipRows(contract)) {
    const artifactName = row.owner_artifacts[0];
    artifacts[artifactName].__fdr_values[row.field_id] = `fixture value for ${row.field_id}`;
  }

  const materialRows = [
    materialRow("ai-governance::UNI_CNS_001", "UNI_CNS_001", "TRIGGERED", "PRIMARY"),
    materialRow("ai-governance::UNI_PRIV_001", "UNI_PRIV_001", "CONTROLLED_BY_VISIBLE_CONTROL", "PRIMARY"),
    materialRow("fintech::PAY_SETL_001", "PAY_SETL_001", "CONTROLLED_BY_EXCLUSION", "OVERLAY"),
    materialRow("fintech::CUST_DISC_001", "CUST_DISC_001", "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION", "OVERLAY")
  ];
  artifacts.active_threat_registry_manifest = {
    expected_registry_row_key_count: materialRows.length,
    mounted_packages: ["ai-governance", "fintech"],
    primary_package: "ai-governance",
    ai_mount: "AI_PRIMARY",
    report_row_contract: {
      report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
      registry_spine_completeness_status: "PASS",
      severity_validation_status: "PASS"
    }
  };
  artifacts.exposure_registry_route_plan = { route_rows: materialRows.map((row) => ({ registry_row_key: row.registry_row_key })) };
  artifacts.exposure_registry_workpad_98 = {
    registry_rows: materialRows.map((row) => ({ ...row, final_material_status: row.evaluation_status, material_projection: row }))
  };
  artifacts.exposure_registry_triggered_profile = {
    report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
    triggered_rows: materialRows.filter((row) => row.evaluation_status === "TRIGGERED"),
    __fdr_values: artifacts.exposure_registry_triggered_profile?.__fdr_values || {}
  };
  artifacts.exposure_registry_controlled_profile = {
    report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
    controlled_rows: materialRows.filter((row) => row.evaluation_status !== "TRIGGERED"),
    __fdr_values: artifacts.exposure_registry_controlled_profile?.__fdr_values || {}
  };
  artifacts.challenge_gate = {
    schema_version: "challenge_gate.v4.operator_challenge",
    status: challengeStatus,
    compiler_handoff_allowed: true,
    final_gate_fingerprint: "b".repeat(64),
    layer_status: { layer_1: "COMPLETE", layer_2: "COMPLETE", layer_3: "COMPLETE" },
    reinvestigation_dispatch_required: false,
    advisory_warnings: challengeStatus === "PASS_WITH_LIMITATION" ? [warning()] : []
  };
  return artifacts;
}

function warning() {
  return {
    challenge_candidate_id: "P11.C.001",
    disposition: "UNRESOLVED_AFTER_REINVESTIGATION",
    affected_artifacts: ["target_feature_profile"],
    affected_field_paths: ["activities[0].mechanics_proof"],
    affected_registry_row_keys: ["ai-governance::UNI_CNS_001"],
    limitation_if_unresolved: "Private workflow evidence remains unavailable.",
    materiality_analysis: "Preserve the limitation."
  };
}

function materialRow(registryRowKey, threatId, status, streamType) {
  const packageId = registryRowKey.split("::")[0];
  return {
    registry_row_key: registryRowKey,
    package_id: packageId,
    source_domain: packageId,
    stream_id: `${streamType}::${packageId}`,
    stream_type: streamType,
    batch_id: `${streamType}__TEST__001`,
    Threat_ID: threatId,
    Threat_Name: `${threatId} exposure`,
    Lane: packageId === "fintech" ? "PAY" : "A",
    Behavior_Class: packageId === "fintech" ? "PAY" : "UNI",
    Surface: "Consumer-Public",
    Subcategory: threatId.split("_")[1] || "GEN",
    Compliance_Framework: null,
    Authority_IN: "Indian authority",
    Authority_EU: "EU authority",
    Authority_US: "US authority",
    Velocity: "ACTIVE_NOW",
    Pain_Tier: status === "TRIGGERED" ? "T3" : "T4",
    Pain_Category: status === "TRIGGERED" ? "Deal Death" : "Regulatory Heat",
    Pain_Depth: "Corporate",
    Status: "Active",
    Effective_Date: "2026-01-01",
    Legal_Pain: "Legal consequence carried from Phase 10.",
    FP_Mechanism: "Mechanism carried from registry.",
    FP_Impact: "Impact carried from registry.",
    Lex_Nova_Fix: "Review-ready fix carried from registry.",
    Hunter_Trigger: "Internal registry trigger mechanics.",
    Provenance: "fixture",
    FIELD21: "TEST",
    FIELD22: "TEST",
    FIELD23: 1,
    target_match: "Match.",
    evaluation_status: status,
    basis_proof: "Basis.",
    control_exclusion_evaluation: "Upstream control or exclusion position.",
    evidence_source_basis: "Public evidence.",
    applied_fp_mechanism: "Mechanism applied.",
    row_limitations: "Private evidence unavailable.",
    review_route: "QUALIFIED_REVIEW"
  };
}
