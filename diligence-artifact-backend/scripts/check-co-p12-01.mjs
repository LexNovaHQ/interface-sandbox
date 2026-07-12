import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CLASSIFICATION_BLOCK_FIELDS, OVERLAY_CLASSIFICATION_BLOCK_FIELDS } from "../src/phases/05-activity-profile-review/activity-profile.constants.js";
import { validateM8TargetFeatureOutput } from "../src/phases/05-activity-profile-review/validators/activity-profile-review.validator.js";
import { DETERMINISTIC_REGISTRY_SPINE_FIELDS, EXECUTION_CUSTODY_FIELDS, parseAiThreatRegistryYaml, validateRegistryRows } from "../src/phases/10-exposure-profile/m11-deterministic-system-m11v2.js";
import { validateSemanticLedger } from "../src/phases/10-exposure-profile/phase10-semantic-finalization.js";
import { buildPhase10CompilerCompatibility } from "../src/phases/12-normalized-compiler/phase10-downstream-compatibility.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

checkDoctrine();
checkPhase5();
checkRegistries();
checkSemanticFirewall();
checkExactGate();
checkStaticMarkers();
console.log("CO-P12-01 upstream report contracts: PASS");

function checkDoctrine() {
  const authority = read("src/phases/12-normalized-compiler/PHASE12_REPORT_PROJECTION_AUTHORITY.md");
  assert.match(authority, /Upstream phases decide\. Phase 12 arranges\./);
  assert.match(authority, /PHASE12_DIRECT_PROFILE_ARTIFACTS_NO_PHASE2G/);
  assert.match(authority, /Current runtime cutover: `NOT_YET_APPLIED`/);
}

function checkPhase5() {
  assert.deepEqual(CLASSIFICATION_BLOCK_FIELDS, ["package_id", "behavior_class_codes", "behavior_class_derivation_basis", "surface_context_tokens", "surface_derivation_basis"]);
  assert.deepEqual(OVERLAY_CLASSIFICATION_BLOCK_FIELDS, ["package_id", "overlay_id", "behavior_class_codes", "behavior_class_derivation_basis", "surface_context_tokens", "surface_derivation_basis"]);
  const taxonomy = {
    mounted_primary_package_id: "fintech",
    primary: { package_id: "fintech", key_version: "1", behavior_class_vocabulary: [{ code: "PAY" }], surface_axes: [{ tokens: [{ token: "Transaction-Data" }] }] },
    overlays: [{ overlay_id: "ai-native", package_id: "ai-governance", key_version: "4", behavior_class_vocabulary: [{ code: "JDG" }], surface_axes: [{ tokens: [{ token: "PII" }] }] }],
    limitations: [], routing_limitations: [], excluded_regulatory_overlay_ids: ["regulatory"]
  };
  const output = phase5Fixture();
  validateM8TargetFeatureOutput(output, { resolvedTaxonomy: taxonomy });
  assert.notDeepEqual(output.target_feature_profile.activities[0].primary_classification.behavior_class_codes, output.target_feature_profile.activities[0].overlay_classifications[0].behavior_class_codes);
  assert.notDeepEqual(output.target_feature_profile.activities[0].primary_classification.surface_context_tokens, output.target_feature_profile.activities[0].overlay_classifications[0].surface_context_tokens);
  const retired = structuredClone(output);
  const block = retired.target_feature_profile.activities[0].primary_classification;
  block.archetype_codes = block.behavior_class_codes;
  delete block.behavior_class_codes;
  assert.throws(() => validateM8TargetFeatureOutput(retired, { resolvedTaxonomy: taxonomy }), /retired Phase 5 material key|keys mismatch/);
  const collapsed = structuredClone(output);
  collapsed.target_feature_profile.activities[0].overlay_classifications = [];
  assert.throws(() => validateM8TargetFeatureOutput(collapsed, { resolvedTaxonomy: taxonomy }), /overlay_id/);
}

function checkRegistries() {
  for (const relative of ["references/registry/AI_THREAT_REGISTRY.yaml", "references/registry/FinTech_Threat_Registry.yaml"]) {
    const rows = parseAiThreatRegistryYaml(read(relative));
    assert.ok(rows.length > 0);
    const result = validateRegistryRows(rows, { expectedCount: rows.length });
    assert.equal(result.ok, true, `${relative}: ${result.failures.join("|")}`);
    assert.equal(result.severity_validation_status, "PASS");
  }
  for (const field of ["Behavior_Class", "Pain_Tier", "Pain_Category", "Pain_Depth", "FP_Impact", "Provenance"]) assert.ok(DETERMINISTIC_REGISTRY_SPINE_FIELDS.includes(field));
  for (const field of ["registry_row_key", "package_id", "stream_id", "stream_type", "batch_id"]) assert.ok(EXECUTION_CUSTODY_FIELDS.includes(field));
  const bad = parseAiThreatRegistryYaml(read("references/registry/AI_THREAT_REGISTRY.yaml")).slice(0, 1);
  bad[0] = { ...bad[0], Pain_Tier: "", Pain_Category: "", Pain_Depth: "" };
  const invalid = validateRegistryRows(bad, { expectedCount: 1 });
  for (const code of ["REGISTRY_PAIN_TIER_MISSING", "REGISTRY_PAIN_CATEGORY_MISSING", "REGISTRY_PAIN_DEPTH_MISSING"]) assert.ok(invalid.failures.some((failure) => failure.includes(code)));
}

function checkSemanticFirewall() {
  const batch = { batch_id: "PRIMARY__AI__UNI__001", batch_group: "UNI", stream_id: "PRIMARY::ai-governance", stream_type: "PRIMARY", package_id: "ai-governance", source_domain: "ai-governance", row_count: 1, expected_registry_row_keys: ["ai-governance::UNI_CNS_001"], expected_threat_ids: ["UNI_CNS_001"] };
  const routePlan = { exposure_registry_route_plan: { route_rows: [{ registry_row_key: batch.expected_registry_row_keys[0], Threat_ID: batch.expected_threat_ids[0], package_id: batch.package_id, stream_id: batch.stream_id, stream_type: batch.stream_type }] } };
  const valid = semanticLedger(batch, semanticRow());
  assert.equal(validateSemanticLedger({ semanticOutput: valid, batch, routePlan }).exposure_registry_batch_validation.status, "PASS");
  const illegal = semanticLedger(batch, { ...semanticRow(), Pain_Tier: "T1" });
  const result = validateSemanticLedger({ semanticOutput: illegal, batch, routePlan }).exposure_registry_batch_validation;
  assert.equal(result.status, "REPAIR_REQUIRED");
  assert.ok(result.failures.some((failure) => failure.includes("MODEL_FIELD_FORBIDDEN") && failure.includes("Pain_Tier")));
}

function checkExactGate() {
  assert.equal(compatibility("PASS", []).validation.status, "PASS");
  assert.equal(compatibility("PASS_WITH_LIMITATION", [warning()]).validation.status, "PASS_WITH_LIMITATION");
  for (const status of ["LOCKED", "LOCKED_WITH_LIMITATIONS", "REINVESTIGATION_REQUIRED", "CONTROLLED_FAILURE", ""]) assert.equal(compatibility(status, []).validation.status, "CONTROLLED_FAILURE");
  const noHandoff = artifacts("PASS", []); noHandoff.challenge_gate.compiler_handoff_allowed = false;
  assert.equal(rootCompatibility(noHandoff).validation.status, "CONTROLLED_FAILURE");
  const noFingerprint = artifacts("PASS", []); noFingerprint.challenge_gate.final_gate_fingerprint = "";
  assert.equal(rootCompatibility(noFingerprint).validation.status, "CONTROLLED_FAILURE");
  const pending = artifacts("PASS", []); pending.challenge_gate.reinvestigation_dispatch_required = true;
  assert.equal(rootCompatibility(pending).validation.status, "CONTROLLED_FAILURE");
}

function checkStaticMarkers() {
  const active = [
    "src/phases/05-activity-profile-review/activity-profile.constants.js",
    "src/phases/05-activity-profile-review/activity-profile-review.contract.js",
    "src/phases/05-activity-profile-review/validators/activity-profile-review.validator.js",
    "src/runtime/domain-gate/activity-taxonomy.resolver.js",
    "src/phases/10-exposure-profile/phase10-classification-routing.js",
    "agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md",
    "agent-packages/agent_3_target_feature/03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md",
    "agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md",
    "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md"
  ].map(read).join("\n");
  for (const token of ["archetype_codes", "archetype_derivation_basis", "archetype_vocabulary", "NO_PRIMARY_ARCHETYPE_MATCH"]) assert.equal(active.includes(token), false, token);
  const p10 = read("src/phases/10-exposure-profile/phase10-semantic-finalization.js");
  for (const marker of ["deterministic_registry_spine_read_only", "model_must_not_emit_registry_spine_fields", "phase10_report_row.v1.complete_registry_spine"]) assert.ok(p10.includes(marker));
  const gate = read("src/phases/12-normalized-compiler/phase10-downstream-compatibility.js");
  assert.ok(gate.includes('new Set(["PASS", "PASS_WITH_LIMITATION"])'));
  assert.equal(gate.includes("operator_challenge_reinvestigation_ledger"), false);
}

function phase5Fixture() {
  return { target_feature_profile: {
    activities: [{
      activity_reference: "ACT.001", product_service_wrapper: "Credit platform", activity_feature_name: "Underwriting", activity_candidate_summary: "Assesses applications.", mechanics_proof: "The reviewed material states the assessment workflow.", autonomy_human_control_signal: "Automated assessment with review.", data_content_object_touched: "Credit application data.", external_internal_action_signal: "Produces a recommendation.",
      primary_classification: { package_id: "fintech", behavior_class_codes: ["PAY"], behavior_class_derivation_basis: [basis("PAY", "Payments")], surface_context_tokens: ["Transaction-Data"], surface_derivation_basis: [basis("Transaction-Data", "Transaction Data")] },
      overlay_classifications: [{ package_id: "ai-governance", overlay_id: "ai-native", behavior_class_codes: ["JDG"], behavior_class_derivation_basis: [basis("JDG", "Automated Decision System")], surface_context_tokens: ["PII"], surface_derivation_basis: [basis("PII", "Personal Data")] }]
    }],
    commercial_availability_posture: { posture: "Paid production", free_trial_freemium_signal: "No public free tier.", beta_pilot_early_access_signal: "No public beta limit.", paid_production_enterprise_plan_signal: "Paid enterprise plan visible.", evidence_basis: ["Public commercial statements."], limitation: "Private terms not reviewed." },
    profile_level_limitations: [],
    mounted_taxonomy_ref: { primary_package_id: "fintech", primary_key_version: "1", overlays: [{ overlay_id: "ai-native", package_id: "ai-governance", key_version: "4" }] }
  }};
}
function basis(code, name) { return { code_or_token: code, normalized_name: name, conditions_satisfied: ["Condition satisfied."], trigger_if_applied: "Trigger applied.", exclude_if_checked: "Exclusion checked.", material_basis: "Reviewed mechanics support the classification.", limitation: "Public-material classification." }; }
function semanticRow() { return { Threat_ID: "UNI_CNS_001", trigger_status: "evaluated", target_match: "Match.", basis_proof: "Basis.", control_exclusion_evaluation: "No defeating control.", evidence_source_basis: "Public evidence.", applied_fp_mechanism: "Mechanism.", row_limitations: "Private evidence unavailable.", status_inputs: { target_match_present: "yes", hunter_conditions_met: "yes", trigger_if_met: "yes", exclude_if_met: "no", visible_control_present: "no", visible_control_defeats_or_reduces_exposure: "no", evidence_sufficient: "yes", public_evidence_limitation: "no", false_positive_concern: "no" } }; }
function semanticLedger(batch, row) { return { m11_batch_registry_ledger: { semantic_contract_version: "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1", batch_id: batch.batch_id, batch_group: batch.batch_group, stream_id: batch.stream_id, stream_type: batch.stream_type, package_id: batch.package_id, source_domain: batch.source_domain, expected_threat_ids: [...batch.expected_threat_ids], returned_threat_ids: [...batch.expected_threat_ids], batch_registry_ledger: [row] } }; }
function compatibility(status, warnings) { return rootCompatibility(artifacts(status, warnings)); }
function rootCompatibility(value) { return buildPhase10CompilerCompatibility({ artifacts: value }).phase10_downstream_compatibility; }
function artifacts(status, advisoryWarnings) { const row = materialRow(); return {
  active_threat_registry_manifest: { expected_registry_row_key_count: 1, mounted_packages: ["ai-governance"], primary_package: "ai-governance", ai_mount: "AI_PRIMARY", report_row_contract: { report_row_schema_version: "phase10_report_row.v1.complete_registry_spine", registry_spine_completeness_status: "PASS", severity_validation_status: "PASS" } },
  exposure_registry_route_plan: { route_rows: [{ registry_row_key: row.registry_row_key }] },
  exposure_registry_workpad_98: { registry_rows: [{ ...row, final_material_status: "TRIGGERED", material_projection: row }] },
  exposure_registry_controlled_profile: { report_row_schema_version: "phase10_report_row.v1.complete_registry_spine", controlled_rows: [] },
  exposure_registry_triggered_profile: { report_row_schema_version: "phase10_report_row.v1.complete_registry_spine", triggered_rows: [row] },
  challenge_gate: { schema_version: "challenge_gate.v4.operator_challenge", status, compiler_handoff_allowed: true, final_gate_fingerprint: "a".repeat(64), layer_status: { layer_1: "COMPLETE", layer_2: "COMPLETE", layer_3: "COMPLETE" }, reinvestigation_dispatch_required: false, advisory_warnings: advisoryWarnings }
}; }
function warning() { return { challenge_candidate_id: "P11.C.001", disposition: "UNRESOLVED_AFTER_REINVESTIGATION", affected_artifacts: ["target_feature_profile"], affected_field_paths: ["activities[0].mechanics_proof"], affected_registry_row_keys: ["ai-governance::UNI_CNS_001"], limitation_if_unresolved: "Private workflow evidence remains unavailable.", materiality_analysis: "Preserve the limitation." }; }
function materialRow() { return {
  registry_row_key: "ai-governance::UNI_CNS_001", package_id: "ai-governance", source_domain: "ai-governance", stream_id: "PRIMARY::ai-governance", stream_type: "PRIMARY", batch_id: "PRIMARY__AI__UNI__001",
  Threat_ID: "UNI_CNS_001", Threat_Name: "Browsewrap Invalidity", Lane: "A", Behavior_Class: "UNI", Surface: "Consumer-Public", Subcategory: "CNS", Compliance_Framework: null, Authority_IN: "Indian Contract Act", Authority_EU: "—", Authority_US: "Specht v. Netscape", Velocity: "ACTIVE_NOW", Pain_Tier: "T3", Pain_Category: "Deal Death", Pain_Depth: "Corporate", Status: "Active", Effective_Date: "2002-10-01", Legal_Pain: "Passive assent may not bind.", FP_Mechanism: "Passive assent.", FP_Impact: "Contract protections may not bind.", Lex_Nova_Fix: "Use affirmative assent.", Hunter_Trigger: "CONDITION_1: passive assent | TRIGGER_IF: CONDITION_1 = TRUE | EXCLUDE_IF: affirmative assent", Provenance: "fixture", FIELD21: "UNI", FIELD22: "CNS", FIELD23: 1,
  target_match: "Match.", evaluation_status: "TRIGGERED", basis_proof: "Basis.", control_exclusion_evaluation: "No defeating control.", evidence_source_basis: "Public evidence.", applied_fp_mechanism: "Passive assent.", row_limitations: "Private logs unavailable.", review_route: "QUALIFIED_REVIEW"
}; }
