import assert from "node:assert/strict";

import {
  buildPhase12AdmissionAdapter,
  buildPhase12RouteAdapter,
  compilePhase12DirectReportProjection,
  loadPhase12ReportContract
} from "../src/phases/12-normalized-compiler/phase12-adapters.js";
import { uniqueOwnerArtifacts, getActiveOwnershipRows } from "../src/phases/12-normalized-compiler/phase12-report-contract.js";

const contract = loadPhase12ReportContract();
assert.equal(contract.validation.status, "PASS");
assert.equal(contract.validation.active_owned_field_count, 430);
assert.equal(contract.validation.blocked_gap_field_count, 27);

const artifacts = buildFixtureArtifacts(contract, "PASS_WITH_LIMITATION");

const admission = buildPhase12AdmissionAdapter({ run: { run_id: "CO_P12_03_TEST" }, artifacts, contract }).phase12_admission;
assert.equal(admission.status, "PASS_WITH_LIMITATION");
assert.equal(admission.validation.status, "PASS_WITH_LIMITATION");
assert.equal(admission.phase2g_inputs_present.length, 0);
assert.equal(admission.missing_owner_artifacts.length, 0);
assert.equal(admission.phase10_downstream_compatibility.phase11_warning_projection.warning_count, 1);
assert.equal(admission.compiler_runtime_cutover_status, "ADAPTER_READY_NOT_COMPILER_SWAPPED");

const forbidden = buildPhase12AdmissionAdapter({
  run: { run_id: "CO_P12_03_FORBIDDEN_PHASE2G" },
  artifacts: { ...artifacts, phase_routing_manifest: { forbidden: true } },
  contract
}).phase12_admission;
assert.equal(forbidden.validation.status, "CONTROLLED_FAILURE");
assert.ok(forbidden.validation.failures.some((failure) => failure.includes("PHASE12_FORBIDDEN_PHASE2G_INPUT_PRESENT:phase_routing_manifest")));

const route = buildPhase12RouteAdapter({ run: { run_id: "CO_P12_03_TEST" }, artifacts, admission, contract }).phase12_route_plan;
assert.equal(route.status, "PASS");
assert.equal(route.validation.status, "PASS");
assert.equal(route.active_field_route_count, 430);
assert.equal(route.blocked_upstream_gap_count, 27);
assert.equal(route.section_count, 10);
assert.equal(route.phase2g_dependency_forbidden, true);
assert.equal(route.validation.all_active_fields_routed, true);
assert.equal(route.validation.all_gap_fields_blocked, true);
assert.equal(route.section_routes.find((section) => section.section_id === "08").artifact_name, "report_section__08_exposure_register");
assert.equal(route.section_routes.find((section) => section.section_id === "09").artifact_name, "report_section__09_open_review_items_handoff");
assert.ok(route.blocked_gap_rows.every((row) => row.p12_derivation_forbidden === true));

const projected = compilePhase12DirectReportProjection({ run: { run_id: "CO_P12_03_TEST" }, artifacts, admission, routePlan: route, contract });
assert.equal(projected.normalized_report_manifest.status, "PASS_WITH_LIMITATION");
assert.equal(projected.normalized_report_manifest.section_count, 10);
assert.equal(projected.normalized_report_manifest.old_normalized_section_artifacts_emitted, false);
assert.equal(projected.normalized_report_manifest.phase2g_dependency_forbidden, true);
assert.equal(projected.normalized_report_manifest.phase12_projection_contract.one_report_section_one_artifact, true);
assert.equal(projected.normalized_report_manifest.phase12_projection_contract.section_8_complete_exposure_register, true);
assert.equal(projected.normalized_report_manifest.phase12_projection_contract.section_9_open_items_only, true);
assert.equal(projected.review_ready_section_handoff.local_counsel_review_required, true);
assert.equal(projected.final_output_handoff.compiler_trace.old_recursive_profiler_not_used_by_adapter, true);
assert.equal(projected.renderer_payload.sections.length, 10);

const outputKeys = Object.keys(projected);
assert.equal(outputKeys.some((key) => key.startsWith("normalized_section__")), false);
const reportSectionKeys = outputKeys.filter((key) => key.startsWith("report_section__"));
assert.equal(reportSectionKeys.length, 10);
assert.deepEqual(reportSectionKeys.sort(), [
  "report_section__01_matter_review_boundary",
  "report_section__02_executive_legal_risk_overview",
  "report_section__03_target_entity_sector_profile",
  "report_section__04_product_activity_architecture",
  "report_section__05_data_provenance_privacy_architecture",
  "report_section__06_sector_control_obligations",
  "report_section__07_legal_governance_architecture",
  "report_section__08_exposure_register",
  "report_section__09_open_review_items_handoff",
  "report_section__10_methodology_limitations_annexure"
].sort());

const section8 = projected.report_section__08_exposure_register;
assert.equal(section8.exposure_register.complete_exposure_register, true);
assert.equal(section8.exposure_register.triggered_rows.length, 1);
assert.equal(section8.exposure_register.controlled_rows.length, 1);
assert.equal(section8.exposure_register.no_row_re_evaluation, true);

const section9 = projected.report_section__09_open_review_items_handoff;
assert.equal(section9.open_handoff_items.open_or_unresolved_items_only, true);
assert.equal(section9.open_handoff_items.item_count, 1);
assert.equal(section9.open_handoff_items.exposure_register_duplication_forbidden, true);
assert.equal(section9.open_handoff_items.p12_question_creation_forbidden, true);
assert.equal(section9.open_handoff_items.p12_priority_creation_forbidden, true);
assert.equal(section9.open_handoff_items.p12_route_creation_forbidden, true);
assert.equal(Boolean(section9.exposure_register), false);

for (const artifactName of reportSectionKeys) {
  const section = projected[artifactName];
  assert.equal(section.schema_version, "report_section.v12.phase12_direct_projection", artifactName);
  assert.equal(section.p12_substantive_derivation_forbidden, true, artifactName);
}

const passArtifacts = buildFixtureArtifacts(contract, "PASS");
const passProjection = compilePhase12DirectReportProjection({ run: { run_id: "CO_P12_03_PASS_TEST" }, artifacts: passArtifacts, contract });
assert.equal(passProjection.normalized_report_manifest.status, "PASS");
assert.equal(passProjection.report_section__09_open_review_items_handoff.open_handoff_items.item_count, 0);

console.log("CO-P12-03 route, admission and projection adapters: PASS");

function buildFixtureArtifacts(contract, challengeStatus) {
  const artifacts = {};
  for (const name of uniqueOwnerArtifacts(contract)) artifacts[name] = { __fdr_values: {} };
  for (const row of getActiveOwnershipRows(contract)) {
    const artifactName = row.owner_artifacts[0];
    artifacts[artifactName].__fdr_values[row.field_id] = `fixture value for ${row.field_id}`;
  }

  const materialRows = [
    materialRow("ai-governance::UNI_CNS_001", "UNI_CNS_001", "TRIGGERED"),
    materialRow("ai-governance::UNI_PRIV_001", "UNI_PRIV_001", "CONTROLLED_BY_VISIBLE_CONTROL")
  ];
  artifacts.active_threat_registry_manifest = {
    expected_registry_row_key_count: 2,
    mounted_packages: ["ai-governance"],
    primary_package: "ai-governance",
    ai_mount: "AI_PRIMARY",
    report_row_contract: {
      report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
      registry_spine_completeness_status: "PASS",
      severity_validation_status: "PASS"
    }
  };
  artifacts.exposure_registry_route_plan = {
    route_rows: materialRows.map((row) => ({ registry_row_key: row.registry_row_key }))
  };
  artifacts.exposure_registry_workpad_98 = {
    registry_rows: materialRows.map((row) => ({
      ...row,
      final_material_status: row.evaluation_status,
      material_projection: row
    }))
  };
  artifacts.exposure_registry_triggered_profile = {
    report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
    triggered_rows: [materialRows[0]],
    __fdr_values: artifacts.exposure_registry_triggered_profile?.__fdr_values || {}
  };
  artifacts.exposure_registry_controlled_profile = {
    report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
    controlled_rows: [materialRows[1]],
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

function materialRow(registryRowKey, threatId, status) {
  return {
    registry_row_key: registryRowKey,
    package_id: "ai-governance",
    source_domain: "ai-governance",
    stream_id: "PRIMARY::ai-governance",
    stream_type: "PRIMARY",
    batch_id: "PRIMARY__AI__UNI__001",
    Threat_ID: threatId,
    Threat_Name: threatId === "UNI_CNS_001" ? "Browsewrap Invalidity" : "Privacy Notice Gap",
    Lane: "A",
    Behavior_Class: "UNI",
    Surface: "Consumer-Public",
    Subcategory: threatId === "UNI_CNS_001" ? "CNS" : "PRV",
    Compliance_Framework: null,
    Authority_IN: "Indian Contract Act",
    Authority_EU: "GDPR",
    Authority_US: "Specht v. Netscape",
    Velocity: "ACTIVE_NOW",
    Pain_Tier: status === "TRIGGERED" ? "T3" : "T4",
    Pain_Category: status === "TRIGGERED" ? "Deal Death" : "Regulatory Heat",
    Pain_Depth: "Corporate",
    Status: "Active",
    Effective_Date: "2002-10-01",
    Legal_Pain: "Legal consequence carried from Phase 10.",
    FP_Mechanism: "Mechanism carried from registry.",
    FP_Impact: "Impact carried from registry.",
    Lex_Nova_Fix: "Review-ready fix carried from registry.",
    Hunter_Trigger: "CONDITION_1: public footprint signal | TRIGGER_IF: CONDITION_1 = TRUE | EXCLUDE_IF: visible control",
    Provenance: "fixture",
    FIELD21: "UNI",
    FIELD22: threatId === "UNI_CNS_001" ? "CNS" : "PRV",
    FIELD23: 1,
    target_match: "Match.",
    evaluation_status: status,
    basis_proof: "Basis.",
    control_exclusion_evaluation: status === "TRIGGERED" ? "No defeating control." : "Visible control reduces exposure.",
    evidence_source_basis: "Public evidence.",
    applied_fp_mechanism: "Mechanism applied.",
    row_limitations: "Private evidence unavailable.",
    review_route: "QUALIFIED_REVIEW"
  };
}
