# AGENT4_BACKEND_OUTPUT_CONTRACT_SYNCED_M10

This file overrides any older same-chat receipt, phase-output, checkpoint, markdown, or visible terminal language for Agent 4 / M10 backend model execution.

When Agent 4 runs inside the backend, the model response must be strict JSON only. No markdown. No XML-like phase block. No array wrapper. No prose receipt. No checkpoint lines. No same-chat next-agent instruction.

Agent 4 / M10 has two canonical backend save events. The material artifact and forensic artifact must not be emitted together in production backend execution.

## M10 Phase B1 material response shape

For phase `M10_DATA_PROVENANCE`, at the Phase B1 material save boundary, return exactly one plain top-level JSON object:

```json
{
  "target_data_provenance_profile": {
    "assessment_scope": [],
    "source_coverage": [],
    "individuals_and_relationships": [],
    "role_relationship_readiness": [],
    "data_categories": [],
    "generated_output_and_derived_data_treatment": [],
    "sensitive_special_category_signals": [],
    "children_minors_signal": [],
    "collection_sources_and_activity_data_flows": [],
    "processing_operations_lifecycle": [],
    "purpose_use_signals": [],
    "privacy_notice_visibility": [],
    "lawful_basis_consent_authorization_readiness": [],
    "consent_withdrawal_controls": [],
    "rights_request_routes": [],
    "privacy_governance_contact_accountability_signals": [],
    "contractual_dpa_customer_terms_readiness": [],
    "vendor_subprocessor_partner_inventory": [],
    "processor_subprocessor_governance_controls": [],
    "third_party_disclosure_sharing_controls": [],
    "cross_border_transfer_location_custody": [],
    "retention_deletion_return_export_controls": [],
    "security_access_controls": [],
    "breach_incident_readiness": [],
    "cookies_tracking_marketing_controls": [],
    "ai_model_provider_processing_chain": [],
    "ai_training_finetuning_model_improvement_controls": [],
    "embeddings_vector_memory_controls": [],
    "prompt_output_logging_telemetry_controls": [],
    "automated_decision_profiling_human_review_signal": [],
    "privacy_accountability_documentation_signals": [],
    "law_regulatory_readiness_matrix": [],
    "missing_proof_and_diligence_requests": [],
    "limitations": []
  }
}
```

Rules:

- The top-level value must be an object, not an array.
- The only top-level key is `target_data_provenance_profile`.
- Do not wrap the object inside `phase_output`, `output`, `result`, `data`, `M10`, or `M10_DATA_PROVENANCE`.
- Do not return `[ { "target_data_provenance_profile": {} } ]`.
- Do not include `target_data_provenance_profile_forensics` in the Phase B1 response.
- Do not place source ledgers, DAP derivation ledgers, extraction capsules, validation trace, confidence branches, or runtime trace as top-level branches inside `target_data_provenance_profile`.
- `target_data_provenance_profile` must contain exactly the 34 locked material fields listed above.
- The backend must validate and save `target_data_provenance_profile` before Phase C forensic derivation may begin.

## M10 Phase D forensic response shape

For phase `M10_DATA_PROVENANCE`, at the Phase D forensic save boundary, consume the saved `target_data_provenance_profile` artifact and return exactly one plain top-level JSON object:

```json
{
  "target_data_provenance_profile_forensics": {
    "data_control_source_coverage_ledger": [],
    "data_control_extraction_capsule_summary": [],
    "selected_dap_field_derivation_ledger": [],
    "anti_unknown_resolution_ledger": [],
    "readiness_matrix_derivation_ledger": [],
    "missing_proof_request_ledger": [],
    "cross_route_use_ledger": [],
    "validation_quality_control_result": {},
    "runtime_trace_m10_only": {},
    "forensic_boundary": {}
  }
}
```

Rules:

- The top-level value must be an object, not an array.
- The only top-level key is `target_data_provenance_profile_forensics`.
- Do not wrap the object inside `phase_output`, `output`, `result`, `data`, `M10`, or `M10_DATA_PROVENANCE`.
- Do not return `[ { "target_data_provenance_profile_forensics": {} } ]`.
- Do not re-emit `target_data_provenance_profile` in the Phase D response.
- `target_data_provenance_profile_forensics` must contain the proof families listed above.
- The forensic artifact must prove source custody, primary D lossless bucket coverage, extraction capsule coverage, selected DAP field derivation, Anti-Unknown resolution, readiness matrix derivation, missing-proof routing, cross-route use, validation/QC, runtime trace, and forensic boundary.
- The backend must validate and save `target_data_provenance_profile_forensics` before M11 / exposure registry may begin.

## Forbidden combined output

The following production backend response shape is forbidden:

```json
{
  "target_data_provenance_profile": {},
  "target_data_provenance_profile_forensics": {}
}
```

That shape incorrectly mixes the Phase B1 material artifact and the Phase D forensic artifact into one response. It may be shown only as documentation that M10 ultimately owns two artifacts, not as an executable backend response.

## Forbidden downstream or external outputs

Agent 4 / M10 backend execution must not emit:

```text
target_exposure_profile
operator_challenge_gate
final_output_handoff
renderer_payload
REGISTRY_ROW lines
threat IDs
exposure statuses
control statuses
risk levels
legal applicability conclusions
compliance conclusions
report prose
same-chat next-agent instruction
```

If older package text conflicts with this file, this file controls for Agent 4 / M10 backend execution.
