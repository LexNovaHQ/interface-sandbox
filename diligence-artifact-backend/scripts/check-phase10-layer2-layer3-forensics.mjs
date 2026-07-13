import assert from "node:assert/strict";
import {
  assembleAcceptedBatch,
  buildDomainAgnosticForensics,
  buildDynamicWorkpad,
  deriveFinalMaterialStatus,
  projectDynamicProfiles,
  validateSemanticLedger
} from "../src/phases/10-exposure-profile/phase10-semantic-finalization.js";

const manifest = {
  execution_identity_contract: { version: "PHASE10_EXECUTION_IDENTITY_v2" },
  phase10_execution_fingerprint: "a".repeat(64),
  registry_set_fingerprint: "b".repeat(64),
  mounted_packages: ["fintech", "ai-governance"],
  primary_package: "fintech",
  ai_mount: "AI_OVERLAY_MOUNTED",
  expected_registry_row_key_count: 5,
  expected_row_count: 5
};
const routeRows = [
  row("fintech::UNI_PRV_001", "UNI_PRV_001", "fintech", "PRIMARY::fintech", "PRIMARY", "UNI", 1),
  row("fintech::PAY_001", "PAY_001", "fintech", "PRIMARY::fintech", "PRIMARY", "PAY", 2),
  row("ai-governance::UNI_PRV_001", "UNI_PRV_001", "ai-governance", "OVERLAY::ai-governance", "OVERLAY", "UNI", 3),
  row("ai-governance::DOE_001", "DOE_001", "ai-governance", "OVERLAY::ai-governance", "OVERLAY", "DOE", 4),
  { ...row("ai-governance::HAL_001", "HAL_001", "ai-governance", "OVERLAY::ai-governance", "OVERLAY", "HAL", 5), route: "NOT_TRIGGERED_NOT_APPLICABLE", route_reason: "PACKAGE_BEHAVIOR_CLASS_NOT_ACTIVE" }
];
const routePlan = {
  exposure_registry_route_plan: {
    schema_version: "exposure_registry_route_plan.v4.behavior_class_package_scoped",
    route_rows: routeRows,
    stream_plans: [
      { stream_id: "PRIMARY::fintech", stream_type: "PRIMARY", package_id: "fintech", expected_registry_rows: 2 },
      { stream_id: "OVERLAY::ai-governance", stream_type: "OVERLAY", package_id: "ai-governance", expected_registry_rows: 3 }
    ],
    batch_plan: []
  }
};
const fintechBatch = batch("PRIMARY__fintech__UNI__001", "PRIMARY::fintech", "PRIMARY", "fintech", [routeRows[0], routeRows[1]]);
const aiBatch = batch("OVERLAY__ai-governance__UNI__001", "OVERLAY::ai-governance", "OVERLAY", "ai-governance", [routeRows[2], routeRows[3]]);
routePlan.exposure_registry_route_plan.batch_plan = [fintechBatch, aiBatch];

const fintechOutput = semantic(fintechBatch, [
  semanticRow("UNI_PRV_001", { exclude_if_met: "yes" }),
  semanticRow("PAY_001", { visible_control_present: "yes", visible_control_defeats_or_reduces_exposure: "yes" })
]);
const aiOutput = semantic(aiBatch, [
  semanticRow("UNI_PRV_001", { public_evidence_limitation: "yes", evidence_sufficient: "partial" }),
  semanticRow("DOE_001", { trigger_if_met: "yes", hunter_conditions_met: "yes", target_match_present: "yes" })
]);

assert.equal(validateSemanticLedger({ semanticOutput: fintechOutput, batch: fintechBatch, routePlan }).exposure_registry_batch_validation.status, "PASS");
assert.equal(validateSemanticLedger({ semanticOutput: aiOutput, batch: aiBatch, routePlan }).exposure_registry_batch_validation.status, "PASS");
const bad = structuredClone(aiOutput);
bad.m11_batch_registry_ledger.batch_registry_ledger[0].registry_row_key = "forbidden";
assert.equal(validateSemanticLedger({ semanticOutput: bad, batch: aiBatch, routePlan }).exposure_registry_batch_validation.status, "REPAIR_REQUIRED");

const accepted = [
  assembleAcceptedBatch({ semanticOutput: fintechOutput, batch: fintechBatch, routePlan }),
  assembleAcceptedBatch({ semanticOutput: aiOutput, batch: aiBatch, routePlan })
];
const validations = [
  validateSemanticLedger({ semanticOutput: fintechOutput, batch: fintechBatch, routePlan }),
  validateSemanticLedger({ semanticOutput: aiOutput, batch: aiBatch, routePlan })
];
const workpad = buildDynamicWorkpad({ manifest, routePlan, acceptedBatches: accepted, batchValidations: validations });
assert.equal(workpad.exposure_registry_workpad_98.registry_rows.length, 5);
assert.equal(workpad.exposure_registry_workpad_98.actual_registry_row_key_count, 5);
assert.equal(workpad.exposure_registry_workpad_98.final_status_counts.NOT_TRIGGERED_NOT_APPLICABLE, 1);
assert.equal(workpad.exposure_registry_workpad_98.report_row_schema_version, "phase10_report_row.v1.complete_registry_spine");

const projections = projectDynamicProfiles(workpad);
assert.equal(projections.controlled.exposure_registry_controlled_profile.controlled_rows.length, 3);
assert.equal(projections.triggered.exposure_registry_triggered_profile.triggered_rows.length, 1);
const collisionRows = [...projections.controlled.exposure_registry_controlled_profile.controlled_rows, ...projections.triggered.exposure_registry_triggered_profile.triggered_rows]
  .filter((item) => item.Threat_ID === "UNI_PRV_001");
assert.equal(collisionRows.length, 2);
assert.deepEqual(collisionRows.map((item) => item.registry_row_key).sort(), ["ai-governance::UNI_PRV_001", "fintech::UNI_PRV_001"]);
assert.ok(collisionRows.every((item) => item.Lane && item.Behavior_Class && item.Authority_IN && item.Lex_Nova_Fix));

const forensics = buildDomainAgnosticForensics({
  manifest,
  routePlan,
  workpad,
  controlledProfile: projections.controlled,
  triggeredProfile: projections.triggered,
  acceptedBatches: accepted,
  batchValidations: validations
}).exposure_registry_profile_forensics;
assert.equal(forensics.schema_version, "M11_DOMAIN_AGNOSTIC_FORENSICS_v2_COMPLETE_REPORT_ROW");
assert.equal(forensics.expected_registry_row_key_count, 5);
assert.equal(forensics.forensic_lock_gate_result.status, "PASS");
assert.equal(forensics.forensic_lock_gate_result.dynamic_registry_count_verified, true);
assert.equal(forensics.forensic_lock_gate_result.compound_identity_reconciled, true);
assert.equal(forensics.forensic_lock_gate_result.complete_registry_spine_preserved, true);
assert.equal(forensics.forensic_lock_gate_result.primary_overlay_trace_separate, true);
assert.equal(forensics.row_trace.length, 5);

assert.equal(deriveFinalMaterialStatus(inputs({ exclude_if_met: "yes" })), "CONTROLLED_BY_EXCLUSION");
assert.equal(deriveFinalMaterialStatus(inputs({ public_evidence_limitation: "yes", evidence_sufficient: "partial" })), "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION");
assert.equal(deriveFinalMaterialStatus(inputs({ visible_control_present: "yes", visible_control_defeats_or_reduces_exposure: "yes" })), "CONTROLLED_BY_VISIBLE_CONTROL");
assert.equal(deriveFinalMaterialStatus(inputs({ trigger_if_met: "yes", hunter_conditions_met: "yes", target_match_present: "yes" })), "TRIGGERED");

console.log(JSON.stringify({
  check: "Phase 10 domain-agnostic Layer 2, dynamic Layer 3 and forensics",
  status: "PASS",
  packages: manifest.mounted_packages,
  registry_rows: 5,
  report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
  raw_id_collision_preserved: true,
  final_statuses_verified: 4,
  workpad_count_dynamic: true,
  complete_registry_spine_preserved: true,
  fixed_98_forensics: false,
  fixed_ai_subcategories: false
}, null, 2));

function row(key, id, packageId, streamId, streamType, behaviorClass, registryOrder) {
  const subcategory = id.split("_").slice(1, -1).join("_") || "GEN";
  const numeric = Number(id.split("_").at(-1)) || 1;
  return {
    registry_row_key: key,
    Threat_ID: id,
    package_id: packageId,
    source_domain: packageId,
    stream_id: streamId,
    stream_type: streamType,
    route: "EVALUATION_ROUTED",
    route_reason: behaviorClass === "UNI" ? "UNI_ALWAYS_RUN" : "PACKAGE_BEHAVIOR_CLASS_MATCH",
    matched_activity_references: ["ACT-001"],
    registry_order: registryOrder,
    registry_key_version: packageId === "fintech" ? "v1.0" : "v4.0",
    threat_registry_version: "fixture-v1",
    registry_row: {
      Threat_ID: id,
      Threat_Name: `${packageId} ${id}`,
      Lane: packageId === "fintech" ? "PAY" : "A",
      Behavior_Class: behaviorClass,
      Surface: "API",
      Subcategory: subcategory,
      Compliance_Framework: null,
      Authority_IN: "Indian authority",
      Authority_EU: "European Union authority",
      Authority_US: "United States authority",
      Velocity: "ACTIVE_NOW",
      Pain_Tier: "T2",
      Pain_Category: "Legal",
      Pain_Depth: "Corporate",
      Status: "Active",
      Effective_Date: "2026-01-01",
      Legal_Pain: "Review required",
      FP_Mechanism: "False positive mechanism",
      FP_Impact: "Material false-positive impact",
      Lex_Nova_Fix: "Review-ready remediation",
      Hunter_Trigger: "CONDITION_1: evidence | TRIGGER_IF: CONDITION_1 = TRUE | EXCLUDE_IF: false",
      Provenance: "Phase 10 semantic fixture",
      FIELD21: behaviorClass,
      FIELD22: subcategory,
      FIELD23: numeric
    }
  };
}

function batch(id, streamId, streamType, packageId, rows) {
  return {
    batch_id: id,
    batch_group: "TEST",
    stream_id: streamId,
    stream_type: streamType,
    package_id: packageId,
    source_domain: packageId,
    row_count: rows.length,
    expected_registry_row_keys: rows.map((item) => item.registry_row_key),
    expected_threat_ids: rows.map((item) => item.Threat_ID),
    max_packet_chars: 180000,
    classification_inventory_digest: "fixture",
    activity_references: ["ACT-001"]
  };
}

function semantic(batchValue, rows) {
  return { m11_batch_registry_ledger: {
    semantic_contract_version: "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1",
    batch_id: batchValue.batch_id,
    batch_group: batchValue.batch_group,
    stream_id: batchValue.stream_id,
    stream_type: batchValue.stream_type,
    package_id: batchValue.package_id,
    source_domain: batchValue.source_domain,
    expected_threat_ids: [...batchValue.expected_threat_ids],
    returned_threat_ids: [...batchValue.expected_threat_ids],
    m9_legal_cartography_consumed: true,
    batch_registry_ledger: rows
  } };
}

function semanticRow(id, overrides) {
  return {
    Threat_ID: id,
    target_match: "Specific target activity matches the supplied row.",
    basis_proof: "The supplied evidence was evaluated against each Hunter Trigger condition.",
    control_exclusion_evaluation: "The supplied control and exclusion evidence was evaluated.",
    evidence_source_basis: "Product and legal-governance primary evidence supplied in the batch.",
    applied_fp_mechanism: "False-positive controls applied.",
    row_limitations: "No additional limitation beyond the structured inputs.",
    status_inputs: inputs(overrides)
  };
}

function inputs(overrides = {}) {
  return {
    target_match_present: "yes",
    hunter_conditions_met: "no",
    trigger_if_met: "no",
    exclude_if_met: "no",
    visible_control_present: "no",
    visible_control_defeats_or_reduces_exposure: "no",
    evidence_sufficient: "yes",
    public_evidence_limitation: "no",
    false_positive_concern: "no",
    ...overrides
  };
}
