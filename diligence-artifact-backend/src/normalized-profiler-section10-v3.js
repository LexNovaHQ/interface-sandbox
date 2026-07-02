import { buildNormalizedProfilerOutput as buildSection789Output } from "./normalized-profiler-section789-v2.js";
import { buildMethodologyLimitationsForensicAnnexureSection } from "./forensic-annexure-normalizer.js";
import { safeObject, safeText } from "./report-safe-language.js";
import { NORMALIZATION_MAP_VERSION } from "./report-normalization-map.js";

export const NORMALIZED_PROFILER_VERSION = "normalized_profiler_section_10_merged_forensic_annexure_v3";

export const NORMALIZED_SECTION_DEFINITIONS = Object.freeze([
  ["matter_overview", "Matter Overview"],
  ["executive_summary", "Executive Summary"],
  ["target_profile", "Target Profile"],
  ["product_activity_ip_profile", "Product, Activity & IP Profile"],
  ["data_provenance_controls", "Data Provenance & Controls"],
  ["legal_document_control_review", "Legal Document & Control Review"],
  ["exposure_summary_harm_mechanism_workpad_summary", "7A. Exposure Summary, Harm Mechanism & Workpad Summary"],
  ["exposure_diagnosis_table", "7B. Exposure Diagnosis Table"],
  ["exposure_control_discipline", "7C. Control & False-Positive Discipline"],
  ["review_route_action_plan", "8A. Review Route & Priority Action Plan"],
  ["control_handoff_readiness", "8B. Control Preservation & Handoff Readiness"],
  ["exposure_clarification_queue", "9A. Exposure Clarification & Missing Source Queue"],
  ["global_confirmation_queue", "9B. Global Confirmation & Data-Flow Queue"],
  ["methodology_limitations_forensic_annexure", "10. Methodology, Limitations & Forensic Annexure"]
]);

export const NORMALIZED_SECTION_KEYS = Object.freeze(NORMALIZED_SECTION_DEFINITIONS.map(([key]) => key));
export const NORMALIZED_SECTION_ARTIFACT_NAMES = Object.freeze(NORMALIZED_SECTION_KEYS.map((key) => `normalized_section__${key}`));

export function buildNormalizedProfilerOutput({ run = {}, artifacts = {} } = {}) {
  const base = buildSection789Output({ run, artifacts });
  const validation_status = normalizeMachineStatus(base.normalized_report_manifest?.validation_status || run.validation_status || run.status || "LOCKED_WITH_LIMITATIONS");
  const section10 = buildMethodologyLimitationsForensicAnnexureSection({ run, artifacts, baseOutput: base, sectionStatus: validation_status });

  const sections = {};
  for (const key of NORMALIZED_SECTION_KEYS) {
    sections[key] = key === "methodology_limitations_forensic_annexure" ? section10 : safeObject(base[`normalized_section__${key}`]);
  }

  const orderedSections = Object.fromEntries(NORMALIZED_SECTION_KEYS.map((key, index) => [key, normalizeSectionEnvelope(sections[key], key, index, validation_status)]));
  const namedSections = Object.fromEntries(NORMALIZED_SECTION_KEYS.map((key) => [`normalized_section__${key}`, orderedSections[key]]));
  const normalized_report_manifest = buildNormalizedReportManifest({ run, base, sections: orderedSections, validation_status });
  const vault_section_handoff = buildVaultSectionHandoff({ run, sections: orderedSections, validation_status });
  const final_output_handoff = buildFinalOutputHandoff({ base, normalized_report_manifest, vault_section_handoff, sections: orderedSections, validation_status });

  const output = {
    ...base,
    normalized_report_manifest,
    vault_section_handoff,
    final_output_handoff,
    ...namedSections
  };
  delete output.normalized_section__methodology_limitations_review_notes;
  delete output.normalized_section__forensic_ledger_appendix;
  return output;
}

function normalizeSectionEnvelope(sectionValue, key, index, validation_status) {
  const sectionObject = stripReportBodySectionLimitations(safeObject(sectionValue));
  return {
    ...sectionObject,
    section_id: key,
    artifact_name: `normalized_section__${key}`,
    section_title: NORMALIZED_SECTION_DEFINITIONS[index]?.[1] || sectionObject.section_title || key,
    section_order: index + 1,
    section_status: validation_status,
    display_section_status: sectionObject.display_section_status || sectionObject.section_status || validation_status,
    section_limitations: [],
    normalization: {
      ...(sectionObject.normalization || {}),
      profiler_version: NORMALIZED_PROFILER_VERSION,
      normalization_map_version: NORMALIZATION_MAP_VERSION,
      section_10_merged_forensic_annexure: true,
      separate_section_11_removed: true,
      full_forensic_payload_rendered_inline: false,
      report_body_section_limitations_removed: true,
      limitation_ledger_routed_to_section_10: true
    }
  };
}

function stripReportBodySectionLimitations(sectionObject) {
  return { ...sectionObject, section_limitations: [] };
}

function buildNormalizedReportManifest({ run, base, sections, validation_status }) {
  const baseManifest = safeObject(base.normalized_report_manifest);
  return {
    ...baseManifest,
    manifest_type: "normalized_report_manifest",
    profiler_version: NORMALIZED_PROFILER_VERSION,
    normalization_map_version: NORMALIZATION_MAP_VERSION,
    run_id: run.run_id || baseManifest.run_id || "UNKNOWN_RUN",
    target: run.target || baseManifest.target || hostFromUrl(run.root_url),
    target_url: run.root_url || run.target_url || baseManifest.target_url || run.target || "",
    generated_at: new Date().toISOString(),
    validation_status,
    section_order: NORMALIZED_SECTION_KEYS,
    section_artifacts: NORMALIZED_SECTION_KEYS.map((key) => ({ section_id: key, artifact_name: `normalized_section__${key}`, title: sections[key]?.section_title || key, status: sections[key]?.section_status || validation_status })),
    renderer_contract: { ...(baseManifest.renderer_contract || {}), renderer_may_render: true, renderer_may_sort: false, renderer_may_filter_for_view: true, renderer_may_add_facts: false, renderer_may_change_statuses: false, renderer_may_generate_legal_advice: false, model_used_after_m12: false, section_789_artifact_split: true, section_10_merged_forensic_annexure: true, no_separate_section_11: true },
    vault_contract: { ...(baseManifest.vault_contract || {}), vault_may_prefill_review_ready_objects: true, vault_must_preserve_source_refs: true, vault_must_not_treat_public_signals_as_confirmed_private_facts: true, qualified_review_required_before_assembly_reliance: true }
  };
}

function buildVaultSectionHandoff({ run, sections, validation_status }) {
  return {
    handoff_type: "vault_section_handoff",
    profiler_version: NORMALIZED_PROFILER_VERSION,
    run_id: run.run_id || "UNKNOWN_RUN",
    validation_status,
    sections: NORMALIZED_SECTION_KEYS.map((key) => ({ section_id: key, artifact_name: `normalized_section__${key}`, section_title: sections[key]?.section_title || key, eligible_for_vault: sections[key]?.vault_mapping?.eligible_for_vault !== false, vault_category: sections[key]?.vault_mapping?.vault_category || key, requires_confirmation_before_assembly: true })),
    assembly_boundary: "Use section artifacts as Review-Ready support material only. Public-footprint facts require qualified-review confirmation before document assembly reliance."
  };
}

function buildFinalOutputHandoff({ base, normalized_report_manifest, vault_section_handoff, sections, validation_status }) {
  const baseFinal = safeObject(base.final_output_handoff?.final_output_handoff || base.final_output_handoff);
  const normalized_sections = Object.fromEntries(NORMALIZED_SECTION_KEYS.map((key) => [key, sections[key]]));
  return {
    final_output_handoff: {
      ...baseFinal,
      validation_status,
      normalized_report_manifest_ref: "normalized_report_manifest",
      vault_section_handoff_ref: "vault_section_handoff",
      section_artifacts: normalized_report_manifest.section_artifacts,
      normalized_report_manifest,
      normalized_sections,
      renderer_contract: normalized_report_manifest.renderer_contract,
      vault_contract: normalized_report_manifest.vault_contract,
      terminal_checks: { ...(baseFinal.terminal_checks || {}), normalized_section_count: NORMALIZED_SECTION_KEYS.length, normalized_sections_emitted: NORMALIZED_SECTION_KEYS.length, section_789_artifact_split: true, section_10_merged_forensic_annexure: true, no_separate_section_11: true, legacy_blob_replaced_by_section_artifacts: true, report_body_section_limitations_removed: true },
      compiler_trace: { ...(baseFinal.compiler_trace || {}), compiler_version: "normalized_profiler_compiler_replacement_v6_section_10_merged_forensic_annexure", deterministic_only: true, no_new_findings_created: true, no_row_re_evaluation: true, section_789_artifact_split: true, section_10_merged_forensic_annexure: true, no_separate_section_11: true, full_forensic_payload_rendered_inline: false, forensic_annexure_manifest_only: true, exposure_identity_required: true, threat_name_required: true, subcat_required: true, business_category_removed_from_sections_7_8_9: true, qualified_review_branch_separate: true, report_body_section_limitations_removed: true, limitation_ledger_routed_to_section_10: true },
      legacy_archive: baseFinal.legacy_archive || { profiles_combined: "ARCHIVED_LEGACY", forensics_combined: "ARCHIVED_LEGACY", old_compiler_blob: "REPLACED_BY_NORMALIZED_SECTION_ARTIFACTS", active_replacement: "normalized_report_manifest + normalized_section__*" },
      vault_section_handoff
    }
  };
}

function normalizeMachineStatus(value) {
  const raw = String(value || "").trim().toUpperCase().replace(/\s+/g, "_");
  if (raw === "LOCKED" || raw === "PASS") return "LOCKED";
  if (raw === "LOCKED_WITH_LIMITATIONS" || raw === "PASS_WITH_LIMITATION" || raw === "COMPLETED_WITH_LIMITATIONS") return "LOCKED_WITH_LIMITATIONS";
  if (raw === "REPAIR_REQUIRED") return "REPAIR_REQUIRED";
  if (raw === "CONTROLLED_FAILURE") return "CONTROLLED_FAILURE";
  if (raw === "COMPLETE") return "COMPLETE";
  return "LOCKED_WITH_LIMITATIONS";
}

function hostFromUrl(value) {
  try {
    return new URL(String(value || "")).hostname.replace(/^www\./i, "");
  } catch {
    return safeText(value, "Target not specified");
  }
}
