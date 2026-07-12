import {
  TARGET_PROFILE_SOURCE_ARTIFACT_NAMES,
  DOMAIN_DERIVATION_SOURCE_ROOT_ARTIFACT_NAMES,
  ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES,
  DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES,
  DOMAIN_CONTROL_OBLIGATION_SOURCE_ARTIFACT_NAMES,
  LEGAL_GOVERNANCE_SOURCE_ARTIFACT_NAMES,
  PHASE7_DAP_LAYER4_ARTIFACT_NAMES,
  PHASE7_DAP_LAYER5_ARTIFACT_NAMES
} from "../../runtime/contracts/artifact-permissions.contract.js";

export const P2G_PHASE_ROUTER_JOB_ID = "P2G_PHASE_ROUTER";
export const P2G_PHASE_ROUTER_PUBLIC_LABEL = "Phase Routing Manifest";
export const P2G_ROUTING_DOCTRINE = "LOSSLESS_EVIDENCE_IS_PRIMARY_AND_MUST_BE_NAVIGATED_THROUGH_INDEX";
export const P2G_NO_FALLBACK_DOCTRINE = "DIRECT_LOSSLESS_EVIDENCE_IS_NOT_FALLBACK";
export const P2G_SOURCE_BUCKET_DELIVERY_MODE = "SOURCE_BUCKET_PROFILE";
export const P2G_DERIVED_ONLY_DELIVERY_MODE = "DERIVED_ONLY";
export const P2G_DYNAMIC_M11_BATCH_INPUT = "M11_BATCHES_FROM_EXPOSURE_ROUTE_PLAN";

export const P2G_PHASE_ROUTING_ARTIFACTS = Object.freeze({ manifest: "phase_routing_manifest", validation: "phase_route_validation_manifest" });
export const P2G_PHASE_ROUTING_SAVE_ORDER = Object.freeze([P2G_PHASE_ROUTING_ARTIFACTS.manifest, P2G_PHASE_ROUTING_ARTIFACTS.validation]);

export const PHASE_ROUTE_BUCKET_IDS = Object.freeze({ targetProfile: "2A_BUCKET_TARGET_PROFILE", domainDerivation: "2B_BUCKET_DOMAIN_DERIVATION", activityProfile: "2C_BUCKET_ACTIVITY_PROFILE", dataPrivacy: "2D_BUCKET_DATA_PRIVACY", domainControlObligation: "2E_BUCKET_DOMAIN_CONTROL_OBLIGATION", legalCartographySignals: "2F_BUCKET_LEGAL_CARTOGRAPHY_LEGAL_SIGNALS" });
export const PHASE_ROUTE_IDS = Object.freeze({ targetProfile: "ROUTE.PHASE3A.TARGET_PROFILE", domainDerivation: "ROUTE.PHASE3B.DOMAIN_DERIVATION", activityProfile: "ROUTE.PHASE5.ACTIVITY_PROFILE", dataPrivacy: "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE", domainControlObligation: "ROUTE.PHASE8.DOMAIN_CONTROL_OBLIGATION_PROFILE", legalCartographySignals: "ROUTE.PHASE9.EXPOSURE_PROFILE" });

const ROUTE_BOUNDARY = Object.freeze({ lossless_evidence_role: "PRIMARY_EVIDENCE", index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE", direct_lossless_as_fallback_forbidden: true, free_corpus_read_forbidden: true, bucket_scope_required: true, phase_may_read_only_routed_bucket: true, profile_forensics_inputs_forbidden: true, derived_value_generation_forbidden_in_2g: true, legal_or_compliance_conclusions_forbidden: true });
const TARGET_FORENSICS_DERIVED_INPUTS = Object.freeze(["target_profile_source_index", "legal_signal_derivation_profile", "target_profile", "domain_derivation_profile"]);
const ACTIVITY_FORENSICS_DERIVED_INPUTS = Object.freeze(["activity_profile_source_index", "target_profile", "domain_derivation_profile", "feature_candidate_inventory", "target_feature_profile"]);
const PHASE8_DERIVED_INPUTS = Object.freeze(["data_privacy_navigation_index", ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES]);
const M11_MATERIAL_OUTPUTS = Object.freeze(["exposure_registry_route_plan", "exposure_registry_workpad_98", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile"]);
const M12_DERIVED_INPUTS = Object.freeze(["legal_cartography_index", "legal_signal_derivation_profile", "target_profile", "domain_derivation_profile", "feature_candidate_inventory", "target_feature_profile", ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES, ...M11_MATERIAL_OUTPUTS]);
const COMPILER_DERIVED_INPUTS = Object.freeze([...M12_DERIVED_INPUTS, "challenge_gate"]);

function route({ route_id, bucket_id, parent_phase, parent_jobs, downstream_jobs = [], required_index_artifacts, primary_lossless_evidence, allowed_preceding_derived_profiles = [], job_scoped_derived_profiles = {}, job_scoped_delivery_modes = {}, job_scoped_dynamic_inputs = {}, allowed_runtime_context = [], requires_legal_dependency = false, allowed_legal_artifacts = [], forbidden_artifacts = [] }) {
  return Object.freeze({ route_id, bucket_id, parent_phase, parent_jobs: Object.freeze(parent_jobs), downstream_jobs: Object.freeze(downstream_jobs), required_index_artifacts: Object.freeze(required_index_artifacts), primary_lossless_evidence: Object.freeze(primary_lossless_evidence), allowed_preceding_derived_profiles: Object.freeze(allowed_preceding_derived_profiles), job_scoped_derived_profiles: freezeJobScopedDerivedProfiles(job_scoped_derived_profiles), job_scoped_delivery_modes: Object.freeze({ ...job_scoped_delivery_modes }), job_scoped_dynamic_inputs: freezeJobScopedDerivedProfiles(job_scoped_dynamic_inputs), allowed_runtime_context: Object.freeze(allowed_runtime_context), requires_legal_dependency, allowed_legal_artifacts: Object.freeze(allowed_legal_artifacts), forbidden_artifacts: Object.freeze(forbidden_artifacts), navigation_rule: P2G_ROUTING_DOCTRINE, lossless_evidence_primary: true, index_navigation_mandatory: true, direct_lossless_as_fallback_allowed: false, direct_lossless_as_fallback_forbidden: true, free_corpus_read_allowed: false, route_boundary: ROUTE_BOUNDARY });
}

export const P2G_ROUTE_BUCKETS = Object.freeze([
  route({
    route_id: PHASE_ROUTE_IDS.targetProfile,
    bucket_id: PHASE_ROUTE_BUCKET_IDS.targetProfile,
    parent_phase: "TARGET_PROFILE_REVIEW",
    parent_jobs: ["M7_TARGET_PROFILE"],
    downstream_jobs: ["M7_TARGET_PROFILE_FORENSICS"],
    required_index_artifacts: ["target_profile_source_index"],
    primary_lossless_evidence: TARGET_PROFILE_SOURCE_ARTIFACT_NAMES,
    job_scoped_derived_profiles: { M7_TARGET_PROFILE_FORENSICS: TARGET_FORENSICS_DERIVED_INPUTS },
    job_scoped_delivery_modes: { M7_TARGET_PROFILE_FORENSICS: P2G_DERIVED_ONLY_DELIVERY_MODE },
    allowed_legal_artifacts: ["legal_signal_derivation_profile"],
    requires_legal_dependency: true,
    forbidden_artifacts: ["target_profile_forensics", "activity_profile_source_index", "data_privacy_navigation_index", "domain_control_obligation_navigation_index"]
  }),
  route({
    route_id: PHASE_ROUTE_IDS.domainDerivation,
    bucket_id: PHASE_ROUTE_BUCKET_IDS.domainDerivation,
    parent_phase: "TARGET_PROFILE_REVIEW",
    parent_jobs: ["P3_DOMAIN_DERIVATION_LAYER"],
    required_index_artifacts: ["domain_derivation_source_index"],
    primary_lossless_evidence: DOMAIN_DERIVATION_SOURCE_ROOT_ARTIFACT_NAMES,
    allowed_preceding_derived_profiles: ["target_profile"],
    allowed_runtime_context: ["domain_selection_profile", "active_run_package_manifest"],
    forbidden_artifacts: ["target_profile_forensics", "activity_profile_source_index", "data_privacy_navigation_index", "domain_control_obligation_navigation_index", "legal_cartography_index", "legal_signal_derivation_profile"]
  }),
  route({
    route_id: PHASE_ROUTE_IDS.activityProfile,
    bucket_id: PHASE_ROUTE_BUCKET_IDS.activityProfile,
    parent_phase: "ACTIVITY_PROFILE_REVIEW",
    parent_jobs: ["M8_FEATURE_CANDIDATE_INVENTORY", "M8_TARGET_FEATURE_PROFILE"],
    downstream_jobs: ["M8_TARGET_FEATURE_PROFILE_FORENSICS"],
    required_index_artifacts: ["activity_profile_source_index"],
    primary_lossless_evidence: ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES,
    allowed_preceding_derived_profiles: ["target_profile", "domain_derivation_profile"],
    job_scoped_derived_profiles: { M8_TARGET_FEATURE_PROFILE: ["feature_candidate_inventory"], M8_TARGET_FEATURE_PROFILE_FORENSICS: ACTIVITY_FORENSICS_DERIVED_INPUTS },
    job_scoped_delivery_modes: { M8_TARGET_FEATURE_PROFILE_FORENSICS: P2G_DERIVED_ONLY_DELIVERY_MODE },
    allowed_runtime_context: ["domain_selection_profile", "active_run_package_manifest"],
    forbidden_artifacts: ["target_profile_forensics", "target_feature_profile_forensics", "data_privacy_navigation_index", "domain_control_obligation_navigation_index"]
  }),
  route({
    route_id: PHASE_ROUTE_IDS.dataPrivacy,
    bucket_id: PHASE_ROUTE_BUCKET_IDS.dataPrivacy,
    parent_phase: "DATA_PROVENANCE_PROFILE",
    parent_jobs: ["DATA_PROVENANCE_PROFILE_LAYER4"],
    downstream_jobs: ["DATA_PROVENANCE_PROFILE_FORENSICS"],
    required_index_artifacts: ["data_privacy_navigation_index"],
    primary_lossless_evidence: DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES,
    allowed_preceding_derived_profiles: ["target_profile", "domain_derivation_profile", "feature_candidate_inventory", "target_feature_profile"],
    job_scoped_derived_profiles: { DATA_PROVENANCE_PROFILE_FORENSICS: PHASE8_DERIVED_INPUTS },
    job_scoped_delivery_modes: { DATA_PROVENANCE_PROFILE_FORENSICS: P2G_DERIVED_ONLY_DELIVERY_MODE },
    allowed_runtime_context: ["domain_selection_profile", "active_run_package_manifest"],
    requires_legal_dependency: true,
    allowed_legal_artifacts: ["legal_cartography_index", "legal_signal_derivation_profile"],
    forbidden_artifacts: ["target_profile_forensics", "target_feature_profile_forensics", "dap_forensics_profile", "exposure_registry_route_plan"]
  }),
  route({
    route_id: PHASE_ROUTE_IDS.domainControlObligation,
    bucket_id: PHASE_ROUTE_BUCKET_IDS.domainControlObligation,
    parent_phase: "DOMAIN_CONTROL_OBLIGATION_PROFILE",
    parent_jobs: ["DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY", "DOMAIN_CONTROL_OBLIGATION_PROFILE"],
    required_index_artifacts: ["domain_control_obligation_navigation_index"],
    primary_lossless_evidence: DOMAIN_CONTROL_OBLIGATION_SOURCE_ARTIFACT_NAMES,
    allowed_preceding_derived_profiles: ["target_profile", "domain_derivation_profile", "target_feature_profile"],
    job_scoped_derived_profiles: { DOMAIN_CONTROL_OBLIGATION_PROFILE: ["domain_control_obligation_candidate_inventory"] },
    job_scoped_delivery_modes: { DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY: P2G_SOURCE_BUCKET_DELIVERY_MODE, DOMAIN_CONTROL_OBLIGATION_PROFILE: P2G_SOURCE_BUCKET_DELIVERY_MODE },
    allowed_runtime_context: ["domain_selection_profile", "active_run_package_manifest"],
    requires_legal_dependency: true,
    allowed_legal_artifacts: ["legal_cartography_index", "legal_signal_derivation_profile"],
    forbidden_artifacts: ["target_profile_forensics", "target_feature_profile_forensics", "dap_forensics_profile", "exposure_registry_profile_forensics", ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES]
  }),
  route({
    route_id: PHASE_ROUTE_IDS.legalCartographySignals,
    bucket_id: PHASE_ROUTE_BUCKET_IDS.legalCartographySignals,
    parent_phase: "EXPOSURE_PROFILE",
    parent_jobs: ["M11"],
    downstream_jobs: ["M12", "NORMALIZED_COMPILER"],
    required_index_artifacts: ["legal_cartography_index", "legal_signal_derivation_profile"],
    primary_lossless_evidence: LEGAL_GOVERNANCE_SOURCE_ARTIFACT_NAMES,
    allowed_preceding_derived_profiles: ["target_profile", "domain_derivation_profile", "feature_candidate_inventory", "target_feature_profile", ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES],
    job_scoped_derived_profiles: { M12: M12_DERIVED_INPUTS, NORMALIZED_COMPILER: COMPILER_DERIVED_INPUTS },
    job_scoped_delivery_modes: { M12: P2G_DERIVED_ONLY_DELIVERY_MODE, NORMALIZED_COMPILER: P2G_DERIVED_ONLY_DELIVERY_MODE },
    job_scoped_dynamic_inputs: { M12: [P2G_DYNAMIC_M11_BATCH_INPUT], NORMALIZED_COMPILER: [P2G_DYNAMIC_M11_BATCH_INPUT] },
    allowed_runtime_context: ["domain_selection_profile", "active_run_package_manifest"],
    requires_legal_dependency: true,
    forbidden_artifacts: ["legal_governance_source_index", "data_provenance_source_index", "target_profile_forensics", "target_feature_profile_forensics", "dap_forensics_profile", "exposure_registry_profile_forensics"]
  })
]);

export const P2G_PHASE_ROUTER_CONTRACT = Object.freeze({ job_id: P2G_PHASE_ROUTER_JOB_ID, public_label: P2G_PHASE_ROUTER_PUBLIC_LABEL, phase_id: "CARTOGRAPHY_INDEX", designation: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY", reads: Object.freeze(["target_profile_source_index", "domain_derivation_source_index", "activity_profile_source_index", "data_privacy_navigation_index", "domain_control_obligation_navigation_index", "legal_cartography_index", "legal_signal_derivation_profile", "domain_selection_profile", "active_run_package_manifest"]), writes: P2G_PHASE_ROUTING_SAVE_ORDER, route_buckets: P2G_ROUTE_BUCKETS, doctrine: Object.freeze({ centralized_routing_authority: true, no_other_routing_authority_allowed_after_cutover: true, lossless_evidence_is_primary: true, index_navigation_mandatory: true, direct_lossless_fallback_framing_forbidden: true, each_phase_gets_only_own_bucket: true, preceding_derived_profiles_allowed: true, job_scoped_derived_profiles_must_be_declared_in_2g: true, preceding_forensics_profiles_forbidden: true, phase2f_forward_owner_exposure_profile: true, derived_only_downstream_packets_supported: true, runtime_cutover_complete_through_compiler: true }) });
export function getP2GRouteBucket(bucketId) { const bucket = P2G_ROUTE_BUCKETS.find((row) => row.bucket_id === bucketId || row.route_id === bucketId); if (!bucket) throw new Error(`UNKNOWN_P2G_ROUTE_BUCKET:${bucketId || "missing"}`); return bucket; }
function freezeJobScopedDerivedProfiles(value = {}) { return Object.freeze(Object.fromEntries(Object.entries(value).map(([jobId, artifacts]) => [jobId, Object.freeze([...(artifacts || [])])] ))); }
