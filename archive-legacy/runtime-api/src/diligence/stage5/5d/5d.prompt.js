import { STAGE5D_DICTIONARY } from "./5d.dictionary.js";

export const STAGE5D_PROMPT_CONTRACT = Object.freeze({
  substage: "5D",
  task: "target_feature_profile_integrator",
  role: "Assemble the downstream target_feature_profile handoff from 5A, 5B, and merged 5C outputs without re-adjudicating source evidence.",
  primary_evidence_rule: "5D validates source-window custody. It does not use metadata, navigation indexes, source URLs, or summaries as evidence.",
  integration_rule: "5C complete_feature_records are internal assembly material only. The downstream handoff must remain feature_profile_v2 target_feature_profile with the exact approved top-level keys.",
  reinvestigation_rule: "If validation cannot safely assemble a field, preserve the downstream contract and request reinvestigation through classification_quality/unresolved_feature_candidates instead of throwing a runtime failure.",
  forbidden_behavior: Object.freeze([
    "Do not expose complete_feature_records or other merged-5C internal fields downstream.",
    "Do not create placeholder evidence refs or placeholder source URLs.",
    "Do not reclassify 5B archetype/surface tags without an upstream reinvestigation request.",
    "Do not convert source-window refs into index refs.",
    "Do not mark classification_quality PASS when any substage validation requests reinvestigation."
  ]),
  required_handoff_keys: STAGE5D_DICTIONARY.required_top_level_keys
});

export function buildStage5DIntegratorInput({ canonicalInput, stage5a, stage5b, stage5c } = {}) {
  return {
    substage: "5D",
    task: "target_feature_profile_integrator",
    contract: STAGE5D_PROMPT_CONTRACT,
    target_profile_ref: canonicalInput?.target_profile_ref || {},
    custody_manifest_required: true,
    source_window_validation_required: true,
    downstream_contract_must_remain: "feature_profile_v2 target_feature_profile",
    stage5a_validation: stage5a?.validation || {},
    stage5b_validation: stage5b?.validation || {},
    stage5c_validation: stage5c?.validation || {},
    internal_inputs_reference_only: {
      stage5a_admitted_function_count: Array.isArray(stage5a?.admitted_functions) ? stage5a.admitted_functions.length : 0,
      stage5b_tag_count: Array.isArray(stage5b?.feature_tags) ? stage5b.feature_tags.length : 0,
      stage5c_complete_feature_record_count: Array.isArray(stage5c?.complete_feature_records) ? stage5c.complete_feature_records.length : 0
    },
    dictionary: STAGE5D_DICTIONARY
  };
}
