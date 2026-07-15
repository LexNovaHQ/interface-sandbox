import {
  DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_SCHEMA_VERSION
} from "./domain-control-obligation.constants.js";

export const DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_VERSION =
  "phase8_dco_downstream_handoff_v1";

export const DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS = Object.freeze({
  exposure: "M11",
  operatorChallenge: "M12",
  compiler: "NORMALIZED_COMPILER"
});

export const DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_ALLOWED_ARTIFACTS = Object.freeze([
  DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT
]);

export const DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_FORBIDDEN_ARTIFACTS = Object.freeze([
  "domain_control_obligation_candidate_inventory",
  "target_profile_forensics",
  "target_feature_profile_forensics",
  "dap_forensics_profile",
  "exposure_registry_profile_forensics"
]);

export const DOMAIN_CONTROL_OBLIGATION_M11_HANDOFF_FIELDS = Object.freeze([
  "candidate_id",
  "obligation_id",
  "obligation_family",
  "source_layer",
  "source_package_id",
  "capability_overlay_id",
  "linked_activity_references",
  "matched_behavior_codes",
  "matched_surface_tokens",
  "normalized_name",
  "target_specific_obligation_context",
  "authority_dependency",
  "exposure_role_context",
  "expected_control_signal",
  "control_mechanism_present",
  "control_posture_status",
  "evidence_basis",
  "missing_proof",
  "diligence_question",
  "limitation",
  "regulatory_overlay_refs"
]);

export const DOMAIN_CONTROL_OBLIGATION_M12_HANDOFF_FIELDS = Object.freeze([
  "candidate_id",
  "obligation_id",
  "obligation_family",
  "source_layer",
  "source_package_id",
  "capability_overlay_id",
  "linked_activity_references",
  "matched_behavior_codes",
  "matched_surface_tokens",
  "normalized_name",
  "what_it_requires",
  "target_specific_obligation_context",
  "authority_dependency",
  "exposure_role_context",
  "obligation_locus",
  "obligation_trigger_timing",
  "expected_control_signal",
  "control_mechanism_present",
  "control_posture_status",
  "evidence_basis",
  "missing_proof",
  "diligence_question",
  "derivation_basis",
  "limitation",
  "regulatory_overlay_refs"
]);

export const DOMAIN_CONTROL_OBLIGATION_COMPILER_HANDOFF_FIELDS = Object.freeze([
  "obligation_id",
  "obligation_family",
  "source_layer",
  "source_package_id",
  "capability_overlay_id",
  "linked_activity_references",
  "normalized_name",
  "what_it_requires",
  "target_specific_obligation_context",
  "authority_dependency",
  "exposure_role_context",
  "obligation_locus",
  "obligation_trigger_timing",
  "expected_control_signal",
  "control_mechanism_present",
  "control_posture_status",
  "evidence_basis",
  "missing_proof",
  "diligence_question",
  "limitation",
  "regulatory_overlay_refs"
]);

export const DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_CONTRACT = Object.freeze({
  contract_name: "DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_CONTRACT_v1",
  handoff_version: DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_VERSION,
  source_phase: "DOMAIN_CONTROL_OBLIGATION_PROFILE",
  source_artifact: DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
  source_schema_version: DOMAIN_CONTROL_OBLIGATION_PROFILE_SCHEMA_VERSION,
  propagated_artifacts: DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_ALLOWED_ARTIFACTS,
  forbidden_propagated_artifacts: DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_FORBIDDEN_ARTIFACTS,
  persisted_intermediate_handoff_artifact_allowed: false,
  candidate_inventory_propagation_allowed: false,
  forensic_profile_propagation_allowed: false,
  accepted_source_lock_statuses: Object.freeze(["LOCKED", "LOCKED_WITH_LIMITATIONS"]),
  consumers: Object.freeze({
    [DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS.exposure]: Object.freeze({
      central_phase_id: "EXPOSURE_PROFILE",
      public_phase_order_after_cutover: 10,
      delivery_mode: "SOURCE_BUCKET_PROFILE_WITH_DERIVED_CONTEXT",
      fields: DOMAIN_CONTROL_OBLIGATION_M11_HANDOFF_FIELDS,
      context_only: true,
      may_create_threat_rows: false,
      may_route_threat_rows: false,
      may_replace_threat_registry: false,
      may_treat_phase8_control_as_m11_control_proof: false,
      may_determine_legal_applicability: false,
      may_determine_breach_or_compliance: false
    }),
    [DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS.operatorChallenge]: Object.freeze({
      central_phase_id: "OPERATOR_CHALLENGE",
      public_phase_order_after_cutover: 11,
      delivery_mode: "DERIVED_ONLY",
      fields: DOMAIN_CONTROL_OBLIGATION_M12_HANDOFF_FIELDS,
      challenge_only: true,
      may_rederive_phase8_profile: false,
      may_rewrite_phase8_profile: false,
      may_create_obligation_rows: false,
      may_challenge_unsupported_linkage: true,
      may_challenge_control_posture_overstatement: true,
      may_challenge_authority_dependency_overstatement: true,
      may_challenge_hidden_missing_proof: true,
      may_challenge_regulatory_overlay_misuse: true
    }),
    [DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS.compiler]: Object.freeze({
      central_phase_id: "COMPILER",
      public_phase_order_after_cutover: 12,
      delivery_mode: "DERIVED_ONLY",
      fields: DOMAIN_CONTROL_OBLIGATION_COMPILER_HANDOFF_FIELDS,
      deterministic_projection_only: true,
      may_create_new_findings: false,
      may_create_new_rendered_section: false,
      may_render_candidate_inventory: false,
      may_render_derivation_basis: false,
      may_render_registry_or_route_pointers: false,
      existing_structures_only: Object.freeze([
        "legal_document_control_review",
        "exposure_control_discipline",
        "review_route_action_plan",
        "control_handoff_readiness",
        "exposure_clarification_queue",
        "methodology_limitations_review_notes"
      ])
    })
  }),
  global_boundaries: Object.freeze({
    phase8_profile_is_material_context_not_legal_verdict: true,
    phase8_evidence_basis_is_derived_paraphrase_not_primary_source: true,
    authority_dependency_is_context_not_applicability: true,
    regulatory_overlay_refs_are_candidate_only: true,
    downstream_must_not_mutate_phase8_artifact: true,
    downstream_must_not_backfill_phase8_material_fields: true,
    downstream_must_not_use_phase8_to_bypass_own_evidence_rules: true
  })
});

export function domainControlObligationDownstreamReadArtifacts() {
  return [...DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_ALLOWED_ARTIFACTS];
}

export function domainControlObligationDownstreamFields(consumer) {
  const contract = DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_CONTRACT.consumers[consumer];
  if (!contract) throw new Error(`UNKNOWN_DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMER:${consumer || "missing"}`);
  return [...contract.fields];
}

export function assertAcceptedDomainControlObligationHandoffStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();
  if (!DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_CONTRACT.accepted_source_lock_statuses.includes(normalized)) {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_SOURCE_NOT_LOCKED:${normalized || "missing"}`);
  }
  return normalized;
}
