import assert from "node:assert/strict";

import {
  buildPhase12AdmissionAdapter,
  buildPhase12RouteAdapter,
  compilePhase12DirectReportProjection,
  loadPhase12ReportContract,
  REPORT_FACING_ARTIFACTS,
  SECTION5_CHILD_PROFILES,
  SECTION8_CHILD_PROFILES,
  validatePhase12CompilerOutput
} from "../src/phases/12-normalized-compiler/phase12-adapters.js";
import {
  ACTIVITY_DECK_PAGE_SIZE,
  ACTIVITY_PRESENTATION_FIELDS,
  ACTIVITY_TABLE_PAGE_SIZE,
  PHASE12_ACTIVITY_PRESENTATION_SCHEMA
} from "../src/phases/12-normalized-compiler/phase12-activity-presentation.js";
import { FORBIDDEN_REPORT_KEYS } from "../src/phases/12-normalized-compiler/phase12-artifact-family.contract.js";
import {
  assertIncludesFailure,
  assertNoForbiddenKeys,
  assertOwnPropertyAbsent,
  assertSetEqual
} from "./test-support/assertions.mjs";
import { buildPhase12ProductionFixture } from "./test-support/phase12-production.fixture.mjs";

const contract = loadPhase12ReportContract();
assert.equal(contract.validation.status, "PASS");
assert.equal(contract.validation.active_owned_field_count, 430);
assert.equal(contract.validation.blocked_gap_field_count, 27);

const fixture = buildPhase12ProductionFixture(contract);
const artifacts = fixture.artifacts;
const run = { run_id: "PHASE12_PRODUCTION_ACCEPTANCE" };

const admission = buildPhase12AdmissionAdapter({ run, artifacts, contract }).phase12_admission;
assert.equal(admission.status, "PASS_WITH_LIMITATION");
assert.equal(admission.phase2g_inputs_present.length, 0);
assert.equal(admission.missing_owner_artifacts.length, 0);
assert.equal(admission.phase10_downstream_compatibility.phase11_warning_projection.warning_count, 1);

const forbiddenAdmission = buildPhase12AdmissionAdapter({
  run: { run_id: "PHASE12_PRODUCTION_FORBIDDEN_PHASE2G" },
  artifacts: { ...artifacts, phase_routing_manifest: { forbidden: true } },
  contract
}).phase12_admission;
assert.equal(forbiddenAdmission.validation.status, "CONTROLLED_FAILURE");
assertIncludesFailure(forbiddenAdmission.validation, "PHASE12_FORBIDDEN_PHASE2G_INPUT_PRESENT:phase_routing_manifest", "forbidden admission");

const route = buildPhase12RouteAdapter({ run, artifacts, admission, contract }).phase12_route_plan;
assert.equal(route.status, "PASS");
assert.equal(route.active_field_route_count, 430);
assert.equal(route.blocked_upstream_gap_count, 27);
assert.equal(route.section_count, 10);
assert.equal(route.phase2g_dependency_forbidden, true);
assert.ok(route.blocked_gap_rows.every((row) => row.p12_derivation_forbidden === true));

const output = compilePhase12DirectReportProjection({ run, artifacts, admission, routePlan: route, contract });
validateProductionProjection(output);
validateSection4(output);
validateSection5(output);
validateSection8(output);
validateWarningsAndCustody(output);
validateNegativeOutputMutations(output);

const passFixture = buildPhase12ProductionFixture(contract, { challengeStatus: "PASS" });
const passOutput = compilePhase12DirectReportProjection({
  run: { run_id: "PHASE12_PRODUCTION_PASS" },
  artifacts: passFixture.artifacts,
  contract
});
assert.equal(passOutput.report_manifest.status, "PASS");
assert.equal(passOutput.report_section__09_open_review_items_handoff.open_review_items.length, 0);

console.log(JSON.stringify({
  check: "Phase 12 production",
  status: "PASS",
  merged_acceptance_suites: ["CO-P12-03", "CO-P12-04"],
  behavioral_fixtures: {
    pass_with_limitation: 1,
    pass: 1,
    forbidden_phase2g_admission: 1,
    validator_mutations: 4
  },
  canonical_section_count: output.report_manifest.canonical_section_count,
  report_facing_artifact_count: output.report_manifest.report_facing_artifact_count,
  section4_activity_row_count: output.report_section__04_product_activity_architecture.activity_register.row_count,
  section5_child_profile_count: SECTION5_CHILD_PROFILES.length,
  section8_child_profile_count: SECTION8_CHILD_PROFILES.length,
  legacy_normalized_artifacts_emitted: false,
  local_counsel_review_required: true
}, null, 2));

function validateProductionProjection(projected) {
  assert.equal(projected.phase12_compiler_validation.validation.status, "PASS_WITH_LIMITATION");
  assert.equal(projected.phase12_compiler_validation.validation.section4_activity_presentation_enforced, true);
  assert.equal(projected.report_manifest.schema_version, "report_manifest.v1.co_p12_04");
  assert.equal(projected.report_manifest.status, "PASS_WITH_LIMITATION");
  assert.equal(projected.report_manifest.canonical_section_count, 10);
  assert.equal(projected.report_manifest.report_facing_artifact_count, 29);
  assertSetEqual(projected.report_manifest.report_facing_artifacts, REPORT_FACING_ARTIFACTS, "report-facing artifacts");
  assert.equal(projected.report_handoff.local_counsel_review_required, true);
  assert.equal(projected.final_output_handoff.compiler_trace.old_recursive_profiler_not_used_by_adapter, true);
  assert.equal(projected.renderer_payload.report_artifact_refs.length, 29);
  assert.equal(projected.renderer_payload.custody_artifact_rendering_forbidden, true);
  assertOwnPropertyAbsent(projected.renderer_payload, "sections", "renderer payload");
  assertOwnPropertyAbsent(projected, "normalized_report_manifest", "compiler output");
  assertOwnPropertyAbsent(projected, "review_ready_section_handoff", "compiler output");
  assert.equal(Object.keys(projected).some((key) => key.startsWith("normalized_section__")), false);

  for (const artifactName of REPORT_FACING_ARTIFACTS) {
    const artifact = projected[artifactName];
    assert.equal(artifact.renderable, true, artifactName);
    assertNoForbiddenKeys(artifact, FORBIDDEN_REPORT_KEYS, artifactName);
  }
}

function validateSection4(projected) {
  const section = projected.report_section__04_product_activity_architecture;
  const register = section.activity_register;
  assert.equal(register.schema_version, PHASE12_ACTIVITY_PRESENTATION_SCHEMA);
  assert.equal(register.presentation_only, true);
  assert.equal(register.substantive_derivation_performed, false);
  assert.equal(register.source_profile, "target_feature_profile");
  assert.equal(register.row_count, 2);
  assert.equal(register.rows.length, 2);
  assert.equal(register.table_rows_per_page, ACTIVITY_TABLE_PAGE_SIZE);
  assert.equal(register.deck_cards_per_page, ACTIVITY_DECK_PAGE_SIZE);
  assert.equal(register.primary_overlay_collapse_forbidden, true);
  assert.equal(section.summary.activity_row_count, 2);
  assert.equal(section.summary.primary_overlay_classification_separation_preserved, true);
  assert.equal(register.classification_paths.primary_behavior_class, "primary_classification.behavior_class_codes");
  assert.equal(register.classification_paths.primary_surface, "primary_classification.surface_context_tokens");
  assert.equal(register.classification_paths.overlay_behavior_class, "overlay_classifications[].behavior_class_codes");
  assert.equal(register.classification_paths.overlay_surface, "overlay_classifications[].surface_context_tokens");

  for (const row of register.rows) {
    assert.deepEqual(Object.keys(row), ACTIVITY_PRESENTATION_FIELDS);
    assert.ok(row.primary_classification.package_id);
    assert.ok(Array.isArray(row.primary_classification.behavior_class_codes));
    assert.ok(Array.isArray(row.primary_classification.surface_context_tokens));
    assert.ok(Array.isArray(row.overlay_classifications));
    assert.equal(row.overlay_classifications.length, 1);
    assert.ok(row.overlay_classifications[0].overlay_id);
    assert.ok(Array.isArray(row.overlay_classifications[0].behavior_class_codes));
    assert.ok(Array.isArray(row.overlay_classifications[0].surface_context_tokens));
    assertOwnPropertyAbsent(row, "behavior_class", "Section 04 activity row");
    assertOwnPropertyAbsent(row, "surface", "Section 04 activity row");
  }
}

function validateSection5(projected) {
  const wrapper = projected.report_section__05_data_provenance_privacy_architecture;
  assert.equal(wrapper.artifact_role, "SECTION_WRAPPER");
  assertOwnPropertyAbsent(wrapper, "findings", "section 5 wrapper");
  assertOwnPropertyAbsent(wrapper, "rows", "section 5 wrapper");
  assertSetEqual(wrapper.child_artifacts, SECTION5_CHILD_PROFILES.map((row) => row.artifact_name), "section 5 children");

  const findings = SECTION5_CHILD_PROFILES.flatMap((profile) => {
    const artifact = projected[profile.artifact_name];
    assert.equal(artifact.artifact_role, "SECTION_PROFILE", profile.artifact_name);
    assert.equal(artifact.section_id, "05", profile.artifact_name);
    return artifact.findings;
  });
  const expectedDapFields = projected.phase12_route_plan.route_rows
    .filter((row) => row.field_id.startsWith("DAP."))
    .map((row) => row.field_id);
  assert.equal(findings.length, expectedDapFields.length);
  assert.equal(new Set(findings.map((row) => row.field_id)).size, expectedDapFields.length);
  assertSetEqual(findings.map((row) => row.field_id), expectedDapFields, "section 5 field coverage");

  const sanitized = findings.find((row) => row.field_id === expectedDapFields[0]);
  assert.equal(sanitized.value.material_fact, "preserved");
  for (const key of ["batch_id", "forensics", "validation"]) assertOwnPropertyAbsent(sanitized.value, key, "sanitized DAP finding");
}

function validateSection8(projected) {
  const wrapper = projected.report_section__08_exposure_register;
  assert.equal(wrapper.artifact_role, "SECTION_WRAPPER");
  assertOwnPropertyAbsent(wrapper, "rows", "section 8 wrapper");
  assertOwnPropertyAbsent(wrapper, "findings", "section 8 wrapper");
  assertSetEqual(wrapper.child_artifacts, SECTION8_CHILD_PROFILES.map((row) => row.artifact_name), "section 8 children");

  for (const profile of SECTION8_CHILD_PROFILES) {
    const artifact = projected[profile.artifact_name];
    assert.equal(artifact.artifact_role, "SECTION_PROFILE", profile.artifact_name);
    assert.equal(artifact.rows.length, 1, profile.artifact_name);
    assert.equal(artifact.stream_scope, profile.stream_scope, profile.artifact_name);
    assert.equal(artifact.material_status, profile.material_status, profile.artifact_name);
    const row = artifact.rows[0];
    assert.equal(row.identity.material_status, profile.material_status, profile.artifact_name);
    assert.equal(row.identity.stream_scope, profile.stream_scope === "PRIMARY" ? "Primary Sector" : "Capability Overlay", profile.artifact_name);
    for (const value of [
      row.identity.threat_id,
      row.identity.threat_name,
      row.classification.lane,
      row.classification.behavior_class,
      row.classification.surface,
      row.classification.subcategory,
      row.authorities.india,
      row.authorities.european_union,
      row.authorities.united_states,
      row.severity.velocity,
      row.severity.pain_tier,
      row.severity.pain_category,
      row.severity.pain_depth,
      row.severity.legal_status,
      row.severity.effective_date,
      row.basis.target_match,
      row.basis.basis_proof,
      row.basis.control_or_exclusion_position,
      row.basis.evidence_basis,
      row.basis.provenance,
      row.impact.legal_pain,
      row.impact.false_positive_impact,
      row.false_positive.mechanism,
      row.false_positive.applied_mechanism,
      row.response.recommended_fix,
      row.response.review_route
    ]) assert.ok(value);
    assert.ok(Object.prototype.hasOwnProperty.call(row.classification, "compliance_framework"));
    assert.equal(row.limitations.length, 1);
    for (const key of ["registry_row_key", "batch_id", "Hunter_Trigger", "FIELD21"]) assertOwnPropertyAbsent(row, key, profile.artifact_name);
  }
}

function validateWarningsAndCustody(projected) {
  assert.equal(projected.phase12_report_custody_manifest.renderable, false);
  assert.equal(projected.phase12_report_custody_manifest.exposure_row_bindings.length, 8);
  assert.ok(projected.phase12_report_custody_manifest.exposure_row_bindings.every((row) => row.registry_row_key));
  assert.equal(projected.phase12_report_custody_manifest.field_binding_count > 0, true);
  assert.ok(projected.phase12_report_custody_manifest.profile_family_bindings.some((row) => row.report_section === "04" && row.projection_mode === "CLEAN_ACTIVITY_PRESENTATION_REGISTER" && row.activity_row_count === 2));
  const items = projected.report_section__09_open_review_items_handoff.open_review_items;
  assert.equal(items.length, 1);
  assert.equal(items[0].remaining_uncertainty, "Private workflow evidence remains unavailable.");
  assertOwnPropertyAbsent(items[0], "affected_registry_row_keys", "open review item");
}

function validateNegativeOutputMutations(projected) {
  const contaminated = structuredClone(projected);
  contaminated.report_section__05_parties_roles.batch_id = "LEAK";
  const contaminatedValidation = validatePhase12CompilerOutput({ output: contaminated, contract }).phase12_compiler_validation;
  assert.equal(contaminatedValidation.validation.status, "CONTROLLED_FAILURE");
  assertIncludesFailure(contaminatedValidation.validation, "REPORT_ARTIFACT_FORBIDDEN_KEY:report_section__05_parties_roles.batch_id", "contaminated output");

  const collapsedActivity = structuredClone(projected);
  collapsedActivity.report_section__04_product_activity_architecture.activity_register.rows[0].behavior_class = "COLLAPSED";
  const activityValidation = validatePhase12CompilerOutput({ output: collapsedActivity, contract }).phase12_compiler_validation;
  assert.equal(activityValidation.validation.status, "CONTROLLED_FAILURE");
  assert.ok(activityValidation.validation.failures.some((failure) => failure.includes("SECTION4_COLLAPSED_CLASSIFICATION_FIELD_FORBIDDEN")));

  const missingMaterial = structuredClone(projected);
  delete missingMaterial.report_section__08_primary_triggered_exposures.rows[0].response.recommended_fix;
  const missingValidation = validatePhase12CompilerOutput({ output: missingMaterial, contract }).phase12_compiler_validation;
  assert.equal(missingValidation.validation.status, "CONTROLLED_FAILURE");
  assert.ok(missingValidation.validation.failures.some((failure) => failure.includes("SECTION8_MANDATORY_MATERIAL_FIELD_MISSING") && failure.includes("Lex_Nova_Fix")));

  const pollutedWrapper = structuredClone(projected);
  pollutedWrapper.report_section__08_exposure_register.rows = [];
  const wrapperValidation = validatePhase12CompilerOutput({ output: pollutedWrapper, contract }).phase12_compiler_validation;
  assert.equal(wrapperValidation.validation.status, "CONTROLLED_FAILURE");
  assert.ok(wrapperValidation.validation.failures.includes("SECTION_WRAPPER_ROWS_FORBIDDEN:report_section__08_exposure_register"));
}
