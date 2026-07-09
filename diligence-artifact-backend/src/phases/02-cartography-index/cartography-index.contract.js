import { CARTOGRAPHY_ARTIFACT_NAMES, CARTOGRAPHY_LAYER1_ARTIFACT_NAMES, CARTOGRAPHY_LAYER2_ARTIFACT_NAMES, CARTOGRAPHY_LAYER3_ARTIFACT_NAMES, CARTOGRAPHY_LAYER4_ARTIFACT_NAMES, CARTOGRAPHY_LAYER5_ARTIFACT_NAMES, CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES } from "../../runtime/contracts/artifact-permissions.contract.js";

export const CARTOGRAPHY_INDEX_PHASE_ID = "CARTOGRAPHY_INDEX";
export const CARTOGRAPHY_INDEX_PUBLIC_LABEL = "Cartography and Index";

export const CARTOGRAPHY_INDEX_CONTRACT = Object.freeze({
  central_phase_id: CARTOGRAPHY_INDEX_PHASE_ID,
  public_label: CARTOGRAPHY_INDEX_PUBLIC_LABEL,
  implementation_status: "CONTRACT_LOCKED_IMPLEMENTATION_PENDING",
  execution_mode: "DETERMINISTIC_LED_SEMANTIC_GUIDED_NAVIGATION_INDEXING",
  production_entrypoint_switched: false,
  global_production_deployment_switched: false,
  migration_boundary: Object.freeze({
    phase_layer: "src/phases/02-cartography-index",
    runtime_owner: "src/runtime/services/pipeline.service.js",
    migration_mode: "contract_first_full_replacement",
    old_legal_cartography_runtime_retired_from_active_contract: true,
    old_data_privacy_navigation_index_retired_from_active_contract: true
  }),
  doctrine: Object.freeze({
    phase_1_saves_lossless_sources: true,
    phase_2_indexes_navigation_only: true,
    profile_phases_derive_facts_from_index_guided_source_reads: true,
    indexes_are_source_root_and_profile_family_based_not_phase_specific: true,
    domain_selection_happens_in_phase_3_target_profile: true,
    domain_lock_allowed_in_phase_2: false,
    summaries_allowed: false,
    excerpts_allowed: false,
    lossless_text_copy_allowed: false,
    profile_answers_allowed: false,
    legal_or_compliance_conclusions_allowed: false,
    free_corpus_read_for_downstream_phases_allowed: false
  }),
  reads: Object.freeze(CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES),
  dynamic_reads: Object.freeze(["legal_doc_{DOC_TYPE}"]),
  writes: Object.freeze(CARTOGRAPHY_ARTIFACT_NAMES),
  jobs: Object.freeze({
    P2_SOURCE_INVENTORY_CARTOGRAPHY: Object.freeze({
      job_id: "P2_SOURCE_INVENTORY_CARTOGRAPHY",
      layer_id: "P2-L1",
      public_label: "Source Inventory Cartography",
      execution_mode: "DETERMINISTIC",
      purpose: "Create the master source custody inventory over Phase 1 common-root artifacts, legal-doc artifacts, neutral buckets, and access gaps.",
      reads: Object.freeze(CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES),
      dynamic_reads: Object.freeze(["legal_doc_{DOC_TYPE}"]),
      writes: Object.freeze(CARTOGRAPHY_LAYER1_ARTIFACT_NAMES),
      output_policy: navigationOnlyPolicy()
    }),
    P2_LOCATOR_SPINE: Object.freeze({
      job_id: "P2_LOCATOR_SPINE",
      layer_id: "P2-L2",
      public_label: "Locator Spine",
      execution_mode: "DETERMINISTIC",
      purpose: "Create structural locators over lossless source text without copying source text into the index.",
      reads: Object.freeze(["cartography_source_inventory", ...CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES]),
      dynamic_reads: Object.freeze(["legal_doc_{DOC_TYPE}"]),
      writes: Object.freeze(CARTOGRAPHY_LAYER2_ARTIFACT_NAMES),
      output_policy: navigationOnlyPolicy()
    }),
    P2_PROFILE_ROUTE_MATRIX: Object.freeze({
      job_id: "P2_PROFILE_ROUTE_MATRIX",
      layer_id: "P2-L3",
      public_label: "Profile Route Matrix",
      execution_mode: "DETERMINISTIC",
      purpose: "Map source roots, legal documents, and locators into target, activity, data provenance, and legal governance profile-family routing lanes.",
      reads: Object.freeze(["cartography_source_inventory", "cartography_locator_spine"]),
      writes: Object.freeze(CARTOGRAPHY_LAYER3_ARTIFACT_NAMES),
      output_policy: navigationOnlyPolicy()
    }),
    P2_SEMANTIC_NAVIGATION_OVERLAY: Object.freeze({
      job_id: "P2_SEMANTIC_NAVIGATION_OVERLAY",
      layer_id: "P2-L4",
      public_label: "Semantic Navigation Overlay",
      execution_mode: "SEMANTIC_GUIDANCE_BOUNDED",
      purpose: "Add bounded route labels, reading priority, ambiguity flags, profile relevance, field-family relevance, and overlay candidate tags without deriving facts.",
      reads: Object.freeze(["cartography_source_inventory", "cartography_locator_spine", "cartography_profile_route_matrix"]),
      writes: Object.freeze(CARTOGRAPHY_LAYER4_ARTIFACT_NAMES),
      output_policy: Object.freeze({ ...navigationOnlyPolicy(), semantic_guidance_only: true, no_fact_derivation: true, no_domain_lock: true })
    }),
    P2_INDEX_COMPILER_VALIDATION: Object.freeze({
      job_id: "P2_INDEX_COMPILER_VALIDATION",
      layer_id: "P2-L5",
      public_label: "Index Compiler and Validation Gate",
      execution_mode: "DETERMINISTIC_COMPILER_VALIDATOR",
      purpose: "Compile accepted profile source indexes and the master cartography index, then validate navigation-only discipline and pointer integrity.",
      reads: Object.freeze(["cartography_source_inventory", "cartography_locator_spine", "cartography_profile_route_matrix", "cartography_semantic_navigation_overlay"]),
      writes: Object.freeze(CARTOGRAPHY_LAYER5_ARTIFACT_NAMES),
      output_policy: Object.freeze({ ...navigationOnlyPolicy(), validation_gate: true })
    })
  }),
  final_artifacts: Object.freeze(CARTOGRAPHY_ARTIFACT_NAMES),
  profile_index_artifacts: Object.freeze(["target_profile_source_index", "activity_profile_source_index", "data_provenance_source_index", "legal_governance_source_index"]),
  master_index_artifact: "cartography_index",
  validation_artifact: "cartography_validation_manifest",
  retired_phase_2_artifacts: Object.freeze(["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_reinvestigation_workpad", "legal_cartography_index", "legal_signal_derivation_profile"]),
  retired_phase_7_index_artifacts: Object.freeze(["data_privacy_navigation_index"]),
  downstream_contract: Object.freeze({
    target_profile_reads: Object.freeze(["cartography_index", "target_profile_source_index"]),
    activity_profile_reads: Object.freeze(["cartography_index", "activity_profile_source_index"]),
    data_provenance_reads: Object.freeze(["cartography_index", "data_provenance_source_index", "legal_governance_source_index"]),
    legal_governance_reads: Object.freeze(["cartography_index", "legal_governance_source_index"]),
    exposure_reads: Object.freeze(["cartography_index", "legal_governance_source_index", "locked_profiles"]),
    free_read_lossless_roots_without_index_route_forbidden: true
  }),
  validation_hard_failures: Object.freeze([
    "INDEX_CONTAINS_LOSSLESS_TEXT",
    "INDEX_CONTAINS_EXCERPT_OR_SNIPPET",
    "INDEX_CONTAINS_SUMMARY",
    "INDEX_CONTAINS_PROFILE_ANSWER",
    "INDEX_CONTAINS_LEGAL_OR_COMPLIANCE_CONCLUSION",
    "PHASE_2_DOMAIN_LOCK_ATTEMPTED",
    "ROUTE_MISSING_LOSSLESS_TEXT_POINTER",
    "LOCATOR_POINTS_TO_MISSING_ARTIFACT",
    "LEGAL_DOC_ROUTE_MISSING_INVENTORY_BACKING",
    "OLD_LOSSLESS_FAMILY_ARTIFACT_REFERENCED",
    "OLD_LEGAL_CARTOGRAPHY_ARTIFACT_REFERENCED",
    "OLD_DATA_PRIVACY_NAVIGATION_INDEX_REFERENCED",
    "DOWNSTREAM_FREE_READ_ESCAPE_ROUTE"
  ])
});

export function getCartographyIndexJobContract(jobId) {
  const job = CARTOGRAPHY_INDEX_CONTRACT.jobs[jobId];
  if (!job) throw new Error(`UNKNOWN_CARTOGRAPHY_INDEX_JOB:${jobId || "missing"}`);
  return job;
}

function navigationOnlyPolicy() {
  return Object.freeze({
    navigation_only: true,
    contains_lossless_text: false,
    contains_excerpts: false,
    contains_summaries: false,
    contains_profile_answers: false,
    contains_legal_or_compliance_conclusions: false,
    domain_lock_allowed: false,
    downstream_free_read_allowed: false
  });
}
