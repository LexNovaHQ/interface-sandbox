import { NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS } from "./normalized-profiler-section789-v2.js";
import { asArray, safeObject } from "./report-safe-language.js";

const MACHINE_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE", "COMPLETE"]);
const RAW_MAIN_LABEL_TOKENS = Object.freeze(["Threat_ID", "Pain_Tier", "Pain_Depth", "Pain_Category", "Legal_Pain", "archetype_codes", "surface_context_tokens"]);
const QUALIFIED_REVIEW_BRANCH_ARTIFACTS = Object.freeze(["qualified_review_handoff", "qualified_review_renderer_payload"]);
const REQUIRED_SECTION_789_ARTIFACTS = Object.freeze([
  "normalized_section__exposure_summary_harm_mechanism_workpad_summary",
  "normalized_section__exposure_diagnosis_table",
  "normalized_section__exposure_control_discipline",
  "normalized_section__review_route_action_plan",
  "normalized_section__control_handoff_readiness",
  "normalized_section__exposure_clarification_queue",
  "normalized_section__global_confirmation_queue"
]);

export function validateNormalizedProfilerOutput(output = {}) {
  const failures = [];
  const warnings = [];
  const manifest = safeObject(output.normalized_report_manifest);
  const final = safeObject(output.final_output_handoff?.final_output_handoff || output.final_output_handoff);
  const compilerTrace = safeObject(final.compiler_trace);

  if (!manifest.manifest_type) failures.push("normalized_report_manifest missing manifest_type");
  if (!Array.isArray(manifest.section_order)) failures.push("normalized_report_manifest.section_order missing or not array");
  if (JSON.stringify(manifest.section_order || []) !== JSON.stringify(NORMALIZED_SECTION_KEYS)) failures.push("normalized_report_manifest.section_order does not match locked section order");
  if (!MACHINE_STATUSES.has(String(manifest.validation_status || ""))) failures.push(`normalized_report_manifest.validation_status is not machine status:${manifest.validation_status || "blank"}`);

  for (const artifactName of NORMALIZED_SECTION_ARTIFACT_NAMES) {
    const section = safeObject(output[artifactName]);
    if (!Object.keys(section).length) {
      failures.push(`${artifactName} missing`);
      continue;
    }
    if (section.artifact_name !== artifactName) failures.push(`${artifactName} artifact_name mismatch`);
    if (!section.section_id) failures.push(`${artifactName} missing section_id`);
    if (!section.section_title) failures.push(`${artifactName} missing section_title`);
    if (!MACHINE_STATUSES.has(String(section.section_status || ""))) failures.push(`${artifactName} section_status is not machine status:${section.section_status || "blank"}`);
    if (!Array.isArray(section.subsections) || !section.subsections.length) failures.push(`${artifactName} has no subsections`);
    for (const subsection of asArray(section.subsections)) {
      if (!subsection.subsection_id) failures.push(`${artifactName} subsection missing subsection_id`);
      if (!subsection.subsection_title) failures.push(`${artifactName} subsection missing subsection_title`);
      if (!Array.isArray(subsection.fields)) failures.push(`${artifactName}.${subsection.subsection_id || "unknown"} fields missing or not array`);
      for (const field of asArray(subsection.fields)) {
        if (!field.field_id) failures.push(`${artifactName}.${subsection.subsection_id || "unknown"} field missing field_id`);
        if (!field.label) failures.push(`${artifactName}.${subsection.subsection_id || "unknown"}.${field.field_id || "unknown"} missing lawyer-readable label`);
        if (artifactName !== "normalized_section__forensic_ledger_appendix" && RAW_MAIN_LABEL_TOKENS.includes(field.label)) failures.push(`${artifactName}.${field.field_id} raw internal label used as primary label:${field.label}`);
        if (!field.source_artifact) warnings.push(`${artifactName}.${field.field_id || "unknown"} missing source_artifact`);
        if (!field.source_path) warnings.push(`${artifactName}.${field.field_id || "unknown"} missing source_path`);
      }
    }
  }

  for (const artifactName of REQUIRED_SECTION_789_ARTIFACTS) {
    if (!output[artifactName]) failures.push(`${artifactName} missing from Section 7/8/9 split compiler output`);
  }

  const serializedSection789 = JSON.stringify(REQUIRED_SECTION_789_ARTIFACTS.map((name) => output[name] || {}));
  const diagnosisRows = asArray(output.normalized_section__exposure_diagnosis_table?.subsections?.[0]?.fields?.[0]?.value);
  const actionRows = asArray(output.normalized_section__review_route_action_plan?.subsections?.[1]?.fields?.[0]?.value);
  if (serializedSection789.includes("Business Category")) failures.push("Business Category appears in Section 7/8/9 split artifacts");
  if ((diagnosisRows.length || actionRows.length) && !serializedSection789.includes("Threat_Name")) failures.push("Threat_Name not present in populated Section 7/8/9 split artifacts");
  if ((diagnosisRows.length || actionRows.length) && !serializedSection789.includes("Subcat")) failures.push("Subcat not present in populated Section 7/8/9 split artifacts");

  for (const artifactName of QUALIFIED_REVIEW_BRANCH_ARTIFACTS) {
    if (Object.prototype.hasOwnProperty.call(output, artifactName)) {
      failures.push(`${artifactName} emitted by normalized compiler; Qualified Review artifacts must be emitted only by qualified_review_system branch`);
    }
  }
  if (compilerTrace.qualified_review_branch_separate !== true) warnings.push("compiler_trace.qualified_review_branch_separate missing or not true");
  if (compilerTrace.section_789_artifact_split !== true) failures.push("compiler_trace.section_789_artifact_split missing or not true");

  if (output.profiles_combined) failures.push("profiles_combined emitted by normalized compiler");
  if (output.forensics_combined) failures.push("forensics_combined emitted by normalized compiler");
  if (final.profiles || final.profile || final.forensics) failures.push("final_output_handoff contains legacy merged profile/forensics blob");
  if (!final.legacy_archive || final.legacy_archive.profiles_combined !== "ARCHIVED_LEGACY") warnings.push("final_output_handoff legacy_archive marker missing or incomplete");

  return {
    status: failures.length ? "REPAIR_REQUIRED" : "PASS",
    failures,
    warnings,
    checked_sections: NORMALIZED_SECTION_ARTIFACT_NAMES.length,
    validator_version: "normalizer_validator_v3_section_789_artifact_split"
  };
}

export function assertNormalizedProfilerOutput(output = {}) {
  const validation = validateNormalizedProfilerOutput(output);
  if (validation.status !== "PASS") throw new Error(`NORMALIZER_VALIDATION_FAILED:${JSON.stringify(validation)}`);
  return validation;
}
