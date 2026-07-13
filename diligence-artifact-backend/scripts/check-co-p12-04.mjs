import assert from "node:assert/strict";

import {
  compilePhase12DirectReportProjection,
  loadPhase12ReportContract,
  REPORT_FACING_ARTIFACTS,
  SECTION5_CHILD_PROFILES,
  SECTION8_CHILD_PROFILES,
  validatePhase12CompilerOutput
} from "../src/phases/12-normalized-compiler/phase12-adapters.js";
import { FORBIDDEN_REPORT_KEYS } from "../src/phases/12-normalized-compiler/phase12-artifact-family.contract.js";
import { getActiveOwnershipRows, uniqueOwnerArtifacts } from "../src/phases/12-normalized-compiler/phase12-report-contract.js";

const contract = loadPhase12ReportContract();
assert.equal(contract.validation.status, "PASS");
const artifacts = fixtureArtifacts(contract);
const output = compilePhase12DirectReportProjection({ run: { run_id: "CO_P12_04_ACCEPTANCE" }, artifacts, contract });

assert.equal(output.phase12_compiler_validation.validation.status, "PASS_WITH_LIMITATION");
assert.equal(output.report_manifest.schema_version, "report_manifest.v1.co_p12_04");
assert.equal(output.report_manifest.canonical_section_count, 10);
assert.equal(output.report_manifest.report_facing_artifact_count, 29);
assert.deepEqual(new Set(output.report_manifest.report_facing_artifacts), new Set(REPORT_FACING_ARTIFACTS));
assert.equal(Object.prototype.hasOwnProperty.call(output, "normalized_report_manifest"), false);
assert.equal(Object.prototype.hasOwnProperty.call(output, "review_ready_section_handoff"), false);
assert.equal(output.report_handoff.local_counsel_review_required, true);
assert.equal(output.renderer_payload.custody_artifact_rendering_forbidden, true);
assert.equal(Object.prototype.hasOwnProperty.call(output.renderer_payload, "sections"), false);
assert.equal(Object.keys(output).some((key) => key.startsWith("normalized_section__")), false);

for (const artifactName of REPORT_FACING_ARTIFACTS) {
  const artifact = output[artifactName];
  assert.equal(artifact.renderable, true, artifactName);
  const forbidden = findForbiddenKeys(artifact);
  assert.deepEqual(forbidden, [], `${artifactName}:${forbidden.join(",")}`);
}

const section5 = output.report_section__05_data_provenance_privacy_architecture;
assert.equal(section5.artifact_role, "SECTION_WRAPPER");
assert.equal(Object.prototype.hasOwnProperty.call(section5, "findings"), false);
assert.equal(Object.prototype.hasOwnProperty.call(section5, "rows"), false);
assert.deepEqual(new Set(section5.child_artifacts), new Set(SECTION5_CHILD_PROFILES.map((row) => row.artifact_name)));
const section5Findings = SECTION5_CHILD_PROFILES.flatMap((profile) => output[profile.artifact_name].findings);
const expectedDapFields = output.phase12_route_plan.route_rows.filter((row) => row.field_id.startsWith("DAP.")).map((row) => row.field_id);
assert.equal(section5Findings.length, expectedDapFields.length);
assert.equal(new Set(section5Findings.map((row) => row.field_id)).size, expectedDapFields.length);
assert.deepEqual(new Set(section5Findings.map((row) => row.field_id)), new Set(expectedDapFields));

const sanitizedFinding = section5Findings.find((row) => row.field_id === expectedDapFields[0]);
assert.equal(sanitizedFinding.value.material_fact, "preserved");
assert.equal(Object.prototype.hasOwnProperty.call(sanitizedFinding.value, "batch_id"), false);
assert.equal(Object.prototype.hasOwnProperty.call(sanitizedFinding.value, "forensics"), false);
assert.equal(Object.prototype.hasOwnProperty.call(sanitizedFinding.value, "validation"), false);

const section8 = output.report_section__08_exposure_register;
assert.equal(section8.artifact_role, "SECTION_WRAPPER");
assert.equal(Object.prototype.hasOwnProperty.call(section8, "rows"), false);
assert.equal(Object.prototype.hasOwnProperty.call(section8, "findings"), false);
assert.deepEqual(new Set(section8.child_artifacts), new Set(SECTION8_CHILD_PROFILES.map((row) => row.artifact_name)));
for (const profile of SECTION8_CHILD_PROFILES) {
  const artifact = output[profile.artifact_name];
  assert.equal(artifact.rows.length, 1, profile.artifact_name);
  assert.equal(artifact.stream_scope, profile.stream_scope, profile.artifact_name);
  assert.equal(artifact.material_status, profile.material_status, profile.artifact_name);
  const row = artifact.rows[0];
  assert.equal(row.identity.material_status, profile.material_status, profile.artifact_name);
  assert.equal(row.identity.stream_scope, profile.stream_scope === "PRIMARY" ? "Primary Sector" : "Capability Overlay", profile.artifact_name);
  assert.ok(row.identity.threat_id);
  assert.ok(row.identity.threat_name);
  assert.ok(row.classification.lane);
  assert.ok(row.classification.behavior_class);
  assert.ok(row.classification.surface);
  assert.ok(row.classification.subcategory);
  assert.ok(Object.prototype.hasOwnProperty.call(row.classification, "compliance_framework"));
  assert.ok(row.authorities.india);
  assert.ok(row.authorities.european_union);
  assert.ok(row.authorities.united_states);
  assert.ok(row.severity.velocity);
  assert.ok(row.severity.pain_tier);
  assert.ok(row.severity.pain_category);
  assert.ok(row.severity.pain_depth);
  assert.ok(row.severity.legal_status);
  assert.ok(row.severity.effective_date);
  assert.ok(row.basis.target_match);
  assert.ok(row.basis.basis_proof);
  assert.ok(row.basis.control_or_exclusion_position);
  assert.ok(row.basis.evidence_basis);
  assert.ok(row.basis.provenance);
  assert.ok(row.impact.legal_pain);
  assert.ok(row.impact.false_positive_impact);
  assert.ok(row.false_positive.mechanism);
  assert.ok(row.false_positive.applied_mechanism);
  assert.ok(row.response.recommended_fix);
  assert.ok(row.response.review_route);
  assert.equal(row.limitations.length, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(row, "registry_row_key"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, "batch_id"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, "Hunter_Trigger"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, "FIELD21"), false);
}

assert.equal(output.phase12_report_custody_manifest.renderable, false);
assert.equal(output.phase12_report_custody_manifest.exposure_row_bindings.length, 8);
assert.ok(output.phase12_report_custody_manifest.exposure_row_bindings.every((row) => row.registry_row_key));
assert.equal(output.phase12_report_custody_manifest.field_binding_count > 0, true);
assert.equal(output.report_section__09_open_review_items_handoff.open_review_items.length, 1);
assert.equal(output.report_section__09_open_review_items_handoff.open_review_items[0].remaining_uncertainty, "Private workflow evidence remains unavailable.");
assert.equal(Object.prototype.hasOwnProperty.call(output.report_section__09_open_review_items_handoff.open_review_items[0], "affected_registry_row_keys"), false);

const contaminated = structuredClone(output);
contaminated.report_section__05_parties_roles.batch_id = "LEAK";
const contaminatedValidation = validatePhase12CompilerOutput({ output: contaminated, contract }).phase12_compiler_validation;
assert.equal(contaminatedValidation.validation.status, "CONTROLLED_FAILURE");
assert.ok(contaminatedValidation.validation.failures.some((failure) => failure.includes("REPORT_ARTIFACT_FORBIDDEN_KEY:report_section__05_parties_roles.batch_id")));

const missingMaterial = structuredClone(output);
delete missingMaterial.report_section__08_primary_triggered_exposures.rows[0].response.recommended_fix;
const missingValidation = validatePhase12CompilerOutput({ output: missingMaterial, contract }).phase12_compiler_validation;
assert.equal(missingValidation.validation.status, "CONTROLLED_FAILURE");
assert.ok(missingValidation.validation.failures.some((failure) => failure.includes("SECTION8_MANDATORY_MATERIAL_FIELD_MISSING") && failure.includes("Lex_Nova_Fix")));

const pollutedWrapper = structuredClone(output);
pollutedWrapper.report_section__08_exposure_register.rows = [];
const wrapperValidation = validatePhase12CompilerOutput({ output: pollutedWrapper, contract }).phase12_compiler_validation;
assert.equal(wrapperValidation.validation.status, "CONTROLLED_FAILURE");
assert.ok(wrapperValidation.validation.failures.includes("SECTION_WRAPPER_ROWS_FORBIDDEN:report_section__08_exposure_register"));

console.log("CO-P12-04 clean section families, manifest, handoff and validator: PASS");

function fixtureArtifacts(contract) {
  const artifacts = {};
  for (const name of uniqueOwnerArtifacts(contract)) artifacts[name] = { __fdr_values: {} };
  let firstDapField = null;
  for (const row of getActiveOwnershipRows(contract)) {
    const artifactName = row.owner_artifacts[0];
    if (row.field_id.startsWith("DAP.") && !firstDapField) firstDapField = row.field_id;
    artifacts[artifactName].__fdr_values[row.field_id] = `fixture value for ${row.field_id}`;
  }
  if (firstDapField) {
    const owner = getActiveOwnershipRows(contract).find((row) => row.field_id === firstDapField).owner_artifacts[0];
    artifacts[owner].__fdr_values[firstDapField] = {
      material_fact: "preserved",
      limitation: "Upstream limitation preserved.",
      batch_id: "MECHANICAL_LEAK",
      forensics: { raw: true },
      validation: { status: "INTERNAL" }
    };
  }

  const statuses = [
    "TRIGGERED",
    "CONTROLLED_BY_VISIBLE_CONTROL",
    "CONTROLLED_BY_EXCLUSION",
    "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"
  ];
  const materialRows = [];
  for (const streamType of ["PRIMARY", "OVERLAY"]) {
    for (const [index, status] of statuses.entries()) {
      const packageId = streamType === "PRIMARY" ? "ai-governance" : "fintech";
      const threatId = `${streamType === "PRIMARY" ? "UNI" : "PAY"}_TEST_${index + 1}`;
      materialRows.push(materialRow(`${packageId}::${threatId}`, threatId, status, streamType, packageId));
    }
  }

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
  artifacts.exposure_registry_workpad_98 = { registry_rows: materialRows.map((row) => ({ ...row, final_material_status: row.evaluation_status, material_projection: row })) };
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
    status: "PASS_WITH_LIMITATION",
    compiler_handoff_allowed: true,
    final_gate_fingerprint: "c".repeat(64),
    layer_status: { layer_1: "COMPLETE", layer_2: "COMPLETE", layer_3: "COMPLETE" },
    reinvestigation_dispatch_required: false,
    advisory_warnings: [{
      challenge_candidate_id: "P11.C.001",
      disposition: "UNRESOLVED_AFTER_REINVESTIGATION",
      affected_artifacts: ["target_feature_profile"],
      affected_field_paths: ["activities[0].mechanics_proof"],
      affected_registry_row_keys: [materialRows[0].registry_row_key],
      limitation_if_unresolved: "Private workflow evidence remains unavailable.",
      materiality_analysis: "Preserve the limitation."
    }]
  };
  return artifacts;
}

function materialRow(registryRowKey, threatId, status, streamType, packageId) {
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
    Hunter_Trigger: "Internal trigger mechanics that must not enter the report profile.",
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

function findForbiddenKeys(value, path = "artifact", found = []) {
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((item, index) => findForbiddenKeys(item, `${path}[${index}]`, found));
    return found;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_REPORT_KEYS.has(key)) found.push(`${path}.${key}`);
    findForbiddenKeys(nested, `${path}.${key}`, found);
  }
  return found;
}
