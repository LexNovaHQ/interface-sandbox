export const FEATURE_CANDIDATE_INVENTORY_ARTIFACT = "feature_candidate_inventory";
export const FEATURE_CANDIDATE_INVENTORY_VERSION = "m8_feature_candidate_inventory_index_v4_deterministic_led_semantic_supported";
export const FEATURE_CANDIDATE_INVENTORY_MODE = "DETERMINISTIC_LED_SEMANTIC_SUPPORTED_FROM_INDEX_MAPPED_LOSSLESS_UNITS_NO_TEXT_COPY";

export const FEATURE_CANDIDATE_INDEX_BOUNDARY = Object.freeze({
  deterministic_baseline_only: true,
  source_index_artifact: "activity_profile_source_index",
  source_index_is_navigation_only: true,
  lossless_primary_evidence_read: true,
  phase2g_routed_packet_is_read_ceiling: true,
  evidence_unit_mapping_required: true,
  no_source_text_copy: true,
  no_evidence_text_copy: true,
  no_mechanics_proof: true,
  no_activity_summary: true,
  no_archetype_or_surface_derivation: true,
  no_package_specific_activity_classification: true,
  semantic_support_non_authoritative: true,
  deterministic_reconciliation_required: true,
  mounted_domain_package_controls_activity_taxonomy_later: true
});
