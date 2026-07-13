import {
  CANONICAL_SECTION_ARTIFACTS,
  REPORT_FACING_ARTIFACTS,
  SECTION5_CHILD_PROFILES,
  SECTION8_CHILD_PROFILES
} from "./phase12-artifact-family.contract.js";
import { assertPhase12ActivityPresentation } from "./phase12-activity-presentation.js";
import { assertNoForbiddenReportKeys } from "./phase12-profile-normalizer.js";

const EXPOSURE_DISPLAY_PATHS = Object.freeze({
  Threat_ID: "identity.threat_id",
  Threat_Name: "identity.threat_name",
  Lane: "classification.lane",
  Behavior_Class: "classification.behavior_class",
  Surface: "classification.surface",
  Subcategory: "classification.subcategory",
  Compliance_Framework: "classification.compliance_framework",
  Authority_IN: "authorities.india",
  Authority_EU: "authorities.european_union",
  Authority_US: "authorities.united_states",
  Velocity: "severity.velocity",
  Pain_Tier: "severity.pain_tier",
  Pain_Category: "severity.pain_category",
  Pain_Depth: "severity.pain_depth",
  Status: "severity.legal_status",
  Effective_Date: "severity.effective_date",
  Legal_Pain: "impact.legal_pain",
  FP_Mechanism: "false_positive.mechanism",
  FP_Impact: "impact.false_positive_impact",
  Lex_Nova_Fix: "response.recommended_fix",
  Provenance: "basis.provenance",
  target_match: "basis.target_match",
  evaluation_status: "identity.material_status",
  basis_proof: "basis.basis_proof",
  control_exclusion_evaluation: "basis.control_or_exclusion_position",
  evidence_source_basis: "basis.evidence_basis",
  applied_fp_mechanism: "false_positive.applied_mechanism",
  row_limitations: "limitations",
  review_route: "response.review_route"
});

export function validatePhase12CompilerOutput({ output = {}, contract = null } = {}) {
  const failures = [];
  const warnings = [];
  const admission = output.phase12_admission || {};
  const route = output.phase12_route_plan || {};
  if (admission.validation?.status === "CONTROLLED_FAILURE") failures.push("PHASE12_ADMISSION_CONTROLLED_FAILURE");
  if (route.validation?.status === "CONTROLLED_FAILURE") failures.push("PHASE12_ROUTE_CONTROLLED_FAILURE");
  if (route.active_field_route_count !== 430) failures.push(`PHASE12_ROUTE_ACTIVE_COUNT:${route.active_field_route_count}:430`);
  if (route.blocked_upstream_gap_count !== 27) failures.push(`PHASE12_ROUTE_GAP_COUNT:${route.blocked_upstream_gap_count}:27`);

  const reportArtifacts = REPORT_FACING_ARTIFACTS.filter((name) => Object.prototype.hasOwnProperty.call(output, name));
  for (const name of REPORT_FACING_ARTIFACTS) {
    const artifact = output[name];
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      failures.push(`REPORT_ARTIFACT_MISSING:${name}`);
      continue;
    }
    if (artifact.renderable !== true) failures.push(`REPORT_ARTIFACT_NOT_RENDERABLE:${name}`);
    assertNoForbiddenReportKeys(artifact, name, failures);
  }
  if (reportArtifacts.length !== 29) failures.push(`REPORT_FACING_ARTIFACT_COUNT:${reportArtifacts.length}:29`);
  for (const key of Object.keys(output)) if (key.startsWith("normalized_section__")) failures.push(`LEGACY_NORMALIZED_SECTION_EMITTED:${key}`);

  validateWrappers(output, failures);
  validateSection4(output, failures);
  validateSection5(output, route, failures);
  validateSection8(output, admission, failures);
  validateManifestAndHandoff(output, failures);

  const status = failures.length ? "CONTROLLED_FAILURE" : warnings.length || admission.status === "PASS_WITH_LIMITATION" ? "PASS_WITH_LIMITATION" : "PASS";
  return {
    phase12_compiler_validation: {
      schema_version: "phase12_compiler_validation.v1.co_p12_04",
      renderable: false,
      status,
      doctrine: "Preserve all mandatory upstream material fields; exclude forensic and unnecessary mechanical pollution from report-facing artifacts.",
      canonical_section_count: CANONICAL_SECTION_ARTIFACTS.length,
      report_facing_artifact_count: reportArtifacts.length,
      section5_child_artifact_count: SECTION5_CHILD_PROFILES.length,
      section8_child_artifact_count: SECTION8_CHILD_PROFILES.length,
      active_owned_field_count: route.active_field_route_count || 0,
      blocked_upstream_gap_count: route.blocked_upstream_gap_count || 0,
      validation: {
        status,
        failures,
        warnings,
        mandatory_material_field_preservation_enforced: true,
        report_artifact_purity_enforced: true,
        custody_isolation_enforced: true,
        forensic_payloads_forbidden: true,
        section4_activity_presentation_enforced: true,
        section5_family_split_enforced: true,
        section8_stream_status_split_enforced: true,
        phase2g_dependency_forbidden: true,
        p12_new_substantive_derivation_forbidden: true
      }
    }
  };
}

export function assertPhase12CompilerValidation(value) {
  const root = value?.phase12_compiler_validation || value;
  if (root?.validation?.status === "CONTROLLED_FAILURE") throw new Error(`PHASE12_COMPILER_VALIDATION_FAILED:${(root.validation.failures || []).join("|")}`);
  return root;
}

function validateWrappers(output, failures) {
  for (const name of ["report_section__05_data_provenance_privacy_architecture", "report_section__08_exposure_register"]) {
    const wrapper = output[name] || {};
    if (wrapper.artifact_role !== "SECTION_WRAPPER") failures.push(`SECTION_WRAPPER_ROLE_INVALID:${name}`);
    if (Object.prototype.hasOwnProperty.call(wrapper, "rows")) failures.push(`SECTION_WRAPPER_ROWS_FORBIDDEN:${name}`);
    if (Object.prototype.hasOwnProperty.call(wrapper, "findings")) failures.push(`SECTION_WRAPPER_FINDINGS_FORBIDDEN:${name}`);
  }
}

function validateSection4(output, failures) {
  const section = output.report_section__04_product_activity_architecture || {};
  try {
    const register = assertPhase12ActivityPresentation(section);
    if (register.row_count !== register.rows.length) failures.push(`SECTION4_ACTIVITY_ROW_COUNT_INVALID:${register.row_count}:${register.rows.length}`);
    if (section.summary?.activity_row_count !== register.rows.length) failures.push(`SECTION4_ACTIVITY_SUMMARY_COUNT_INVALID:${section.summary?.activity_row_count}:${register.rows.length}`);
    if (section.summary?.primary_overlay_classification_separation_preserved !== true) failures.push("SECTION4_PRIMARY_OVERLAY_SEPARATION_NOT_PRESERVED");
  } catch (error) {
    failures.push(error?.message || String(error));
  }
}

function validateSection5(output, route, failures) {
  const wrapper = output.report_section__05_data_provenance_privacy_architecture || {};
  const expectedNames = SECTION5_CHILD_PROFILES.map((row) => row.artifact_name);
  if (!sameSet(wrapper.child_artifacts, expectedNames)) failures.push("SECTION5_CHILD_REFERENCE_SET_INVALID");
  const projectedIds = [];
  for (const profile of SECTION5_CHILD_PROFILES) {
    const artifact = output[profile.artifact_name] || {};
    if (artifact.section_id !== "05") failures.push(`SECTION5_CHILD_SECTION_INVALID:${profile.artifact_name}`);
    if (artifact.artifact_role !== "SECTION_PROFILE") failures.push(`SECTION5_CHILD_ROLE_INVALID:${profile.artifact_name}`);
    for (const finding of artifact.findings || []) projectedIds.push(finding.field_id);
  }
  const expectedIds = (route.route_rows || []).filter((row) => String(row.field_id || "").startsWith("DAP.")).map((row) => row.field_id);
  if (!sameSet(projectedIds, expectedIds)) failures.push(`SECTION5_MATERIAL_FIELD_SET_INVALID:${projectedIds.length}:${expectedIds.length}`);
  if (new Set(projectedIds).size !== projectedIds.length) failures.push("SECTION5_MATERIAL_FIELD_DUPLICATION");
}

function validateSection8(output, admission, failures) {
  const wrapper = output.report_section__08_exposure_register || {};
  const expectedNames = SECTION8_CHILD_PROFILES.map((row) => row.artifact_name);
  if (!sameSet(wrapper.child_artifacts, expectedNames)) failures.push("SECTION8_CHILD_REFERENCE_SET_INVALID");
  const rows = [];
  for (const profile of SECTION8_CHILD_PROFILES) {
    const artifact = output[profile.artifact_name] || {};
    if (artifact.section_id !== "08") failures.push(`SECTION8_CHILD_SECTION_INVALID:${profile.artifact_name}`);
    if (artifact.artifact_role !== "SECTION_PROFILE") failures.push(`SECTION8_CHILD_ROLE_INVALID:${profile.artifact_name}`);
    if (artifact.stream_scope !== profile.stream_scope) failures.push(`SECTION8_STREAM_SCOPE_INVALID:${profile.artifact_name}`);
    if (artifact.material_status !== profile.material_status) failures.push(`SECTION8_STATUS_SCOPE_INVALID:${profile.artifact_name}`);
    for (const row of artifact.rows || []) {
      rows.push(row);
      const expectedStreamLabel = profile.stream_scope === "PRIMARY" ? "Primary Sector" : "Capability Overlay";
      if (row.identity?.stream_scope !== expectedStreamLabel) failures.push(`SECTION8_ROW_STREAM_LEAK:${profile.artifact_name}`);
      if (row.identity?.material_status !== profile.material_status) failures.push(`SECTION8_ROW_STATUS_LEAK:${profile.artifact_name}`);
      for (const [field, displayPath] of Object.entries(EXPOSURE_DISPLAY_PATHS)) {
        if (!hasPath(row, displayPath)) failures.push(`SECTION8_MANDATORY_MATERIAL_FIELD_MISSING:${profile.artifact_name}:${field}:${displayPath}`);
      }
    }
  }
  const sourceRows = admission.phase10_downstream_compatibility?.material_rows || [];
  if (rows.length !== sourceRows.length) failures.push(`SECTION8_MATERIAL_ROW_COUNT:${rows.length}:${sourceRows.length}`);
  const custody = output.phase12_report_custody_manifest || {};
  if ((custody.exposure_row_bindings || []).length !== sourceRows.length) failures.push(`SECTION8_CUSTODY_ROW_COUNT:${(custody.exposure_row_bindings || []).length}:${sourceRows.length}`);
  const sourceKeys = sourceRows.map((row) => row.registry_row_key);
  const custodyKeys = (custody.exposure_row_bindings || []).map((row) => row.registry_row_key);
  if (!sameSet(sourceKeys, custodyKeys)) failures.push("SECTION8_CUSTODY_IDENTITY_SET_INVALID");
}

function validateManifestAndHandoff(output, failures) {
  const manifest = output.report_manifest || {};
  if (manifest.schema_version !== "report_manifest.v1.co_p12_04") failures.push(`REPORT_MANIFEST_SCHEMA_INVALID:${manifest.schema_version || "missing"}`);
  if (manifest.canonical_section_count !== 10) failures.push(`REPORT_MANIFEST_SECTION_COUNT:${manifest.canonical_section_count}:10`);
  if (manifest.report_facing_artifact_count !== 29) failures.push(`REPORT_MANIFEST_ARTIFACT_COUNT:${manifest.report_facing_artifact_count}:29`);
  if (!sameSet(manifest.report_facing_artifacts, REPORT_FACING_ARTIFACTS)) failures.push("REPORT_MANIFEST_ARTIFACT_SET_INVALID");
  if (!sameSet((manifest.section_artifacts || []).map((row) => row.artifact_name), CANONICAL_SECTION_ARTIFACTS)) failures.push("REPORT_MANIFEST_CANONICAL_SECTION_SET_INVALID");
  if (Object.prototype.hasOwnProperty.call(output, "normalized_report_manifest")) failures.push("LEGACY_NORMALIZED_REPORT_MANIFEST_ALIAS_EMITTED");

  const handoff = output.report_handoff || {};
  if (handoff.schema_version !== "report_handoff.v1.co_p12_04") failures.push(`REPORT_HANDOFF_SCHEMA_INVALID:${handoff.schema_version || "missing"}`);
  if (!sameSet(handoff.report_facing_artifacts, REPORT_FACING_ARTIFACTS)) failures.push("REPORT_HANDOFF_ARTIFACT_SET_INVALID");
  if (handoff.local_counsel_review_required !== true) failures.push("REPORT_HANDOFF_LOCAL_COUNSEL_NOT_REQUIRED");
  if (Object.prototype.hasOwnProperty.call(output, "review_ready_section_handoff")) failures.push("LEGACY_REVIEW_READY_HANDOFF_ALIAS_EMITTED");

  const renderer = output.renderer_payload || {};
  if (!sameSet(renderer.report_artifact_refs, REPORT_FACING_ARTIFACTS)) failures.push("RENDERER_PAYLOAD_ARTIFACT_SET_INVALID");
  if (Object.prototype.hasOwnProperty.call(renderer, "sections")) failures.push("RENDERER_PAYLOAD_EMBEDDED_SECTION_DUPLICATION_FORBIDDEN");
  if (renderer.custody_artifact_rendering_forbidden !== true) failures.push("RENDERER_CUSTODY_BOUNDARY_NOT_LOCKED");
}

function hasPath(value, path) {
  let current = value;
  for (const segment of path.split(".")) {
    if (!current || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, segment)) return false;
    current = current[segment];
  }
  return current !== undefined;
}

function sameSet(left = [], right = []) {
  const a = [...new Set(left)].sort();
  const b = [...new Set(right)].sort();
  return JSON.stringify(a) === JSON.stringify(b);
}
