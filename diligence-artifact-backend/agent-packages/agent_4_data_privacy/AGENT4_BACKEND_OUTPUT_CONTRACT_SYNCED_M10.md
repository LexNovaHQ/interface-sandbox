# AGENT4_BACKEND_OUTPUT_CONTRACT_SYNCED_M10

This file controls Agent 4 / M10 backend model execution.

## Canonical backend artifact roots

Agent 4 / M10 has exactly two production backend artifacts:

```text
data_provenance_profile
data_provenance_profile_forensics
```

The retired legacy roots are not valid production backend outputs:

```text
target_data_provenance_profile
target_data_provenance_profile_forensics
```

## M10 material response shape

For backend phase `M10`, return exactly one plain top-level JSON object:

```json
{
  "data_provenance_profile": {
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

- The only top-level key is `data_provenance_profile`.
- Do not include `data_provenance_profile_forensics` in the material response.
- Do not emit `target_data_provenance_profile`.
- `data_provenance_profile` must contain exactly the 34 locked material fields listed above.
- The backend must validate and save `data_provenance_profile` before M10 forensics may begin.

## M10 QR nested material objects

The 34 top-level field contract remains locked. M10 must not add top-level `contact_routes` or top-level `consent_manager_readiness`.

M10 may emit these nested material derivation objects inside existing locked fields:

```text
data_provenance_profile.privacy_governance_contact_accountability_signals[].contact_routes
```

```text
data_provenance_profile.consent_withdrawal_controls[].consent_manager_readiness
```

```text
data_provenance_profile.law_regulatory_readiness_matrix[] where readiness_area = "consent_manager_readiness"
```

`contact_routes` must use this exact nested shape when emitted:

```json
{
  "contact_routes": {
    "privacy_contact_email": "",
    "grievance_contact_email": "",
    "dpo_or_privacy_officer_contact": "",
    "rights_request_contact_route": "",
    "evidence_basis": [],
    "anti_unknown_status": "",
    "limitation": ""
  }
}
```

`consent_manager_readiness` must use this exact nested shape when emitted:

```json
{
  "consent_manager_readiness": {
    "applicability_signal": "",
    "public_flow_visible": "",
    "consent_collection_artefact_route": "",
    "withdrawal_revocation_grievance_route": "",
    "third_party_route_signal": "",
    "evidence_basis": [],
    "anti_unknown_status": "",
    "limitation_private_confirmation_required": ""
  }
}
```

These nested objects are material values. They are not forensic-only notes, not report-only summaries, and not QR placeholders.

They must be derived only from M10-approved sources and governed by `DAP.CONTACT.*` and `DAP.CM.*` registry authority. They must not contain legal applicability, compliance, adequacy, transfer-legality, lawful-basis sufficiency, liability, or registry/exposure conclusions.

## M10 forensic response shape

For backend phase `M10_FORENSICS`, consume the saved `data_provenance_profile` artifact and return exactly one plain top-level JSON object:

```json
{
  "data_provenance_profile_forensics": {
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

- The only top-level key is `data_provenance_profile_forensics`.
- Do not re-emit `data_provenance_profile` in the forensic response.
- Do not emit `target_data_provenance_profile_forensics`.
- The backend must validate and save `data_provenance_profile_forensics` before M11 may begin.

## Forbidden combined output

The material and forensic artifacts must not be emitted together in one production backend response.

## Stop rule

After emitting the required artifact for the active M10 boundary, stop. Do not emit downstream artifacts or report output.
