import { NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS } from "./normalized-profiler.js";
import { asArray, safeObject } from "./report-safe-language.js";

const MACHINE_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE", "COMPLETE"]);
const RAW_MAIN_LABEL_TOKENS = Object.freeze(["Threat_ID", "Pain_Tier", "Pain_Depth", "Pain_Category", "Legal_Pain", "archetype_codes", "surface_context_tokens"]);

export function validateNormalizedProfilerOutput(output = {}) {
  const failures = [];
  const warnings = [];
  const manifest = safeObject(output.normalized_report_manifest);
  const final = safeObject(output.final_output_handoff?.final_output_handoff || output.final_output_handoff);

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

  if (!output.qualified_review_handoff) failures.push("qualified_review_handoff missing");
  if (output.qualified_review_handoff?.public_label !== "Qualified Review") failures.push("qualified_review_handoff public_label must be Qualified Review");
  if (!Array.isArray(output.qualified_review_handoff?.section_intake)) failures.push("qualified_review_handoff.section_intake missing or not array");
  if (asArray(output.qualified_review_handoff?.forbidden_public_actions).includes("Download JSON") !== true) failures.push("qualified_review_handoff must explicitly forbid Download JSON public action");

  if (output.profiles_combined) failures.push("profiles_combined emitted by normalized compiler");
  if (output.forensics_combined) failures.push("forensics_combined emitted by normalized compiler");
  if (final.profiles || final.profile || final.forensics) failures.push("final_output_handoff contains legacy merged profile/forensics blob");
  if (!final.legacy_archive || final.legacy_archive.profiles_combined !== "ARCHIVED_LEGACY") warnings.push("final_output_handoff legacy_archive marker missing or incomplete");

  return {
    status: failures.length ? "REPAIR_REQUIRED" : "PASS",
    failures,
    warnings,
    checked_sections: NORMALIZED_SECTION_ARTIFACT_NAMES.length,
    validator_version: "normalizer_validator_v1"
  };
}

export function assertNormalizedProfilerOutput(output = {}) {
  const validation = validateNormalizedProfilerOutput(output);
  if (validation.status !== "PASS") throw new Error(`NORMALIZER_VALIDATION_FAILED:${JSON.stringify(validation)}`);
  return validation;
}
