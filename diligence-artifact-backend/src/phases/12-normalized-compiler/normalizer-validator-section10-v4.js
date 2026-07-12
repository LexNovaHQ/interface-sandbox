import { NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS } from "./normalized-profiler-m9-section6-v4.js";
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
const REQUIRED_SECTION_10_ARTIFACT = "normalized_section__methodology_limitations_forensic_annexure";
const REQUIRED_SECTION_6_ARTIFACT = "normalized_section__legal_document_control_review";
const MAIN_REPORT_VALUE_FORBIDDEN_TOKENS = Object.freeze([
  "trace_id",
  "field_path",
  "value_preview",
  "forensic_trace_present",
  "technical_annexure_only",
  "\"display_in_main_report\":false",
  "normalized_dap_field_id",
  "integrated_field_group",
  "row_type"
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
    if (!Object.keys(section).length) { failures.push(`${artifactName} missing`); continue; }
    if (section.artifact_name !== artifactName) failures.push(`${artifactName} artifact_name mismatch`);
    if (!section.section_id) failures.push(`${artifactName} missing section_id`);
    if (!section.section_title) failures.push(`${artifactName} missing section_title`);
    if (!MACHINE_STATUSES.has(String(section.section_status || ""))) failures.push(`${artifactName} section_status is not machine status:${section.section_status || "blank"}`);
    if (asArray(section.section_limitations).length) failures.push(`${artifactName} section_limitations must be empty; limitation ledger belongs in Section 10 fields/annexure, not report-body section envelopes`);
    if (!Array.isArray(section.subsections) || !section.subsections.length) failures.push(`${artifactName} has no subsections`);
    for (const subsection of asArray(section.subsections)) {
      if (!subsection.subsection_id) failures.push(`${artifactName} subsection missing subsection_id`);
      if (!subsection.subsection_title) failures.push(`${artifactName} subsection missing subsection_title`);
      if (!Array.isArray(subsection.fields)) failures.push(`${artifactName}.${subsection.subsection_id || "unknown"} fields missing or not array`);
      for (const field of asArray(subsection.fields)) {
        if (!field.field_id) failures.push(`${artifactName}.${subsection.subsection_id || "unknown"} field missing field_id`);
        if (!field.label) failures.push(`${artifactName}.${subsection.subsection_id || "unknown"}.${field.field_id || "unknown"} missing lawyer-readable label`);
        if (RAW_MAIN_LABEL_TOKENS.includes(field.label)) failures.push(`${artifactName}.${field.field_id} raw internal label used as primary label:${field.label}`);
        if (containsNestedSectionShape(field.value)) failures.push(`${artifactName}.${subsection.subsection_id || "unknown"}.${field.field_id || "unknown"} field value contains nested section/subsection objects`);
        if (artifactName !== REQUIRED_SECTION_10_ARTIFACT) {
          const serializedFieldValue = JSON.stringify(field.value || "");
          for (const token of MAIN_REPORT_VALUE_FORBIDDEN_TOKENS) if (serializedFieldValue.includes(token)) failures.push(`${artifactName}.${field.field_id || "unknown"} contains public-report forbidden machine token:${token}`);
        }
        if (!field.source_artifact) warnings.push(`${artifactName}.${field.field_id || "unknown"} missing source_artifact`);
        if (!field.source_path) warnings.push(`${artifactName}.${field.field_id || "unknown"} missing source_path`);
      }
    }
  }

  for (const artifactName of REQUIRED_SECTION_789_ARTIFACTS) if (!output[artifactName]) failures.push(`${artifactName} missing from Section 7/8/9 split compiler output`);
  if (!output[REQUIRED_SECTION_10_ARTIFACT]) failures.push(`${REQUIRED_SECTION_10_ARTIFACT} missing from merged Section 10 compiler output`);
  if (!output[REQUIRED_SECTION_6_ARTIFACT]) failures.push(`${REQUIRED_SECTION_6_ARTIFACT} missing from M9 Section 6 compiler output`);
  if (output.normalized_section__methodology_limitations_review_notes) failures.push("old methodology section emitted after Section 10 merge");
  if (output.normalized_section__forensic_ledger_appendix) failures.push("old forensic ledger appendix emitted after Section 10 merge");

  const serializedSection789 = JSON.stringify(REQUIRED_SECTION_789_ARTIFACTS.map((name) => output[name] || {}));
  const diagnosisRows = asArray(output.normalized_section__exposure_diagnosis_table?.subsections?.[0]?.fields?.[0]?.value);
  const actionRows = asArray(output.normalized_section__review_route_action_plan?.subsections?.[1]?.fields?.[0]?.value);
  if (serializedSection789.includes("Business Category")) failures.push("Business Category appears in Section 7/8/9 split artifacts");
  if ((diagnosisRows.length || actionRows.length) && !serializedSection789.includes("Threat_Name")) failures.push("Threat_Name not present in populated Section 7/8/9 split artifacts");
  if ((diagnosisRows.length || actionRows.length) && !serializedSection789.includes("Subcat")) failures.push("Subcat not present in populated Section 7/8/9 split artifacts");

  const serializedSection6 = JSON.stringify(output[REQUIRED_SECTION_6_ARTIFACT] || {});
  if (!serializedSection6.includes("Legal Coverage Summary")) failures.push("Section 6 missing Legal Coverage Summary");
  if (!serializedSection6.includes("Core Legal Document Inventory")) failures.push("Section 6 missing Core Legal Document Inventory");
  if (serializedSection6.includes("document_structure_index") || serializedSection6.includes("control_language_locator")) failures.push("Section 6 appears to render raw M9 technical map names inline");

  const serializedSection10 = JSON.stringify(output[REQUIRED_SECTION_10_ARTIFACT] || {});
  if (!serializedSection10.includes("Upstream artifact annexure manifest")) failures.push("merged Section 10 missing annexure manifest");
  if (!serializedSection10.includes("Manifest only")) failures.push("merged Section 10 missing manifest-only display rule");
  if (serializedSection10.includes("full_registry_ledger") || serializedSection10.includes("row_level_proof")) failures.push("merged Section 10 appears to render heavy forensic payload keys inline");

  for (const artifactName of QUALIFIED_REVIEW_BRANCH_ARTIFACTS) if (Object.prototype.hasOwnProperty.call(output, artifactName)) failures.push(`${artifactName} emitted by normalized compiler; Qualified Review artifacts must be emitted only by qualified_review_system branch`);
  if (compilerTrace.qualified_review_branch_separate !== true) warnings.push("compiler_trace.qualified_review_branch_separate missing or not true");
  if (compilerTrace.section_789_artifact_split !== true) failures.push("compiler_trace.section_789_artifact_split missing or not true");
  if (compilerTrace.section_10_merged_forensic_annexure !== true) failures.push("compiler_trace.section_10_merged_forensic_annexure missing or not true");
  if (compilerTrace.section_6_m9_summary_not_raw_index !== true) failures.push("compiler_trace.section_6_m9_summary_not_raw_index missing or not true");
  if (compilerTrace.no_separate_section_11 !== true) failures.push("compiler_trace.no_separate_section_11 missing or not true");
  if (compilerTrace.report_body_section_limitations_removed !== true) warnings.push("compiler_trace.report_body_section_limitations_removed missing or not true");

  if (output.profiles_combined) failures.push("profiles_combined emitted by normalized compiler");
  if (output.forensics_combined) failures.push("forensics_combined emitted by normalized compiler");
  if (final.profiles || final.profile || final.forensics) failures.push("final_output_handoff contains legacy merged profile/forensics blob");
  if (!final.legacy_archive || final.legacy_archive.profiles_combined !== "ARCHIVED_LEGACY") warnings.push("final_output_handoff legacy_archive marker missing or incomplete");

  return { status: failures.length ? "REPAIR_REQUIRED" : "PASS", failures, warnings, checked_sections: NORMALIZED_SECTION_ARTIFACT_NAMES.length, validator_version: "normalizer_validator_v6_locked_public_report_cleanup" };
}

export function assertNormalizedProfilerOutput(output = {}) {
  const validation = validateNormalizedProfilerOutput(output);
  if (validation.status !== "PASS") throw new Error(`NORMALIZER_VALIDATION_FAILED:${JSON.stringify(validation)}`);
  return validation;
}

function containsNestedSectionShape(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsNestedSectionShape);
  if (Object.prototype.hasOwnProperty.call(value, "subsection_id") && Object.prototype.hasOwnProperty.call(value, "fields")) return true;
  if (Object.prototype.hasOwnProperty.call(value, "section_id") && Object.prototype.hasOwnProperty.call(value, "subsections")) return true;
  return Object.values(value).some(containsNestedSectionShape);
}
