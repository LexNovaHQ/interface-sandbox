export const DOMAIN_DERIVATION_PROFILE_ARTIFACT_NAME = "domain_derivation_profile";
export const DOMAIN_DERIVATION_INTERNAL_JOB_ID = "P3_DOMAIN_DERIVATION_LAYER";

export const DOMAIN_DERIVATION_ARTIFACT_CONTRACT = Object.freeze({
  central_phase_id: "TARGET_PROFILE_REVIEW",
  internal_job_id: DOMAIN_DERIVATION_INTERNAL_JOB_ID,
  public_label: "Domain Derivation Layer",
  writes: Object.freeze([
    DOMAIN_DERIVATION_PROFILE_ARTIFACT_NAME,
    "active_run_package_manifest"
  ]),
  reads_required_after_phase_2: Object.freeze([
    "cartography_index",
    "target_profile_source_index",
    "activity_profile_source_index",
    "legal_cartography_index",
    "legal_signal_derivation_profile",
    "domain_selection_profile",
    "active_run_package_manifest",
    "target_profile"
  ]),
  registry_reference: "references/domain-packages/DOMAIN_DERIVATION_REGISTRY_v0.yaml",
  package_catalog_reference: "references/domain-packages/package-catalog.v0.json",
  domain_package_key_reference: "references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md",
  runtime_boundary: Object.freeze({
    phase_3b_agnostic: true,
    registry_driven_derivation: true,
    phase_2_indexes_navigation_only: true,
    domain_logic_hardcoded_in_3b_forbidden: true,
    exposure_rows_forbidden: true,
    company_level_lane_forbidden: true,
    dynamic_routing_enabled: false
  })
});
