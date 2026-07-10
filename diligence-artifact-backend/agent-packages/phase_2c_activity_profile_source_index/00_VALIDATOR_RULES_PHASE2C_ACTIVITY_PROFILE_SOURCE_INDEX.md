# 00_VALIDATOR_RULES_PHASE2C_ACTIVITY_PROFILE_SOURCE_INDEX

## 1. Validator Purpose

The Phase 2C validator rules protect the Activity Profile Source Index from becoming an activity profile, a domain-package classifier, or a source-text summary.

2C validates locator infrastructure only.

## 2. Required Root Artifact

The semantic model must return exactly one top-level semantic artifact:

```json
{
  "activity_profile_semantic_profile": {}
}
```

The final compiler step later emits:

```json
{
  "activity_profile_source_index": {}
}
```

The model must not emit the final index until the backend compiler is built.

## 3. Required Semantic Branches

`activity_profile_semantic_profile` must contain only:

```text
artifact_type
schema_version
generated_by
source_text_policy
semantic_route_labels
semantic_navigation_index
semantic_integrity
package_boundary
downstream_rules
lock_status
```

Any extra top-level branch is invalid unless the backend validator contract is amended first.

## 4. Required Semantic Row Fields

Each row in `semantic_route_labels[]` must contain:

```text
queue_id
unit_id
route_classes
route_signal_families
confidence
semantic_reason_code
source_text_copied
package_specific_classification_forbidden
```

Optional row fields:

```text
route_label_status
limitation
```

No prose reasoning is allowed. `semantic_reason_code` must be a compact code, not an explanatory paragraph.

## 5. Allowed Route Classes

The semantic layer may use only:

```text
ACTIVITY_CANDIDATE_SOURCE_ROUTE
PRODUCT_CAPABILITY_ROUTE
FEATURE_MECHANICS_ROUTE
TECHNICAL_MECHANICS_ROUTE
API_INTERACTION_ROUTE
DATA_OBJECT_INTERACTION_ROUTE
INTEGRATION_ACTION_ROUTE
COMMERCIAL_AVAILABILITY_ROUTE
CUSTOMER_USE_CONTEXT_ROUTE
SUPPORT_OPERATIONAL_CONTEXT_ROUTE
AUTOMATION_TRANSPARENCY_CONTEXT_ROUTE
HUMAN_CONTROL_CONTEXT_ROUTE
EXTERNAL_ACTION_CONTEXT_ROUTE
INPUT_OUTPUT_OBJECT_CONTEXT_ROUTE
SOURCE_LIMITATION_ROUTE
```

These are neutral evidence-route classes. They are not package classifications.

## 6. Allowed Signal Families

The semantic layer may use only:

```text
ACTIVITY_CANDIDATE_SOURCE_SIGNAL
PRODUCT_CAPABILITY_SIGNAL
FEATURE_MECHANICS_SIGNAL
TECHNICAL_MECHANICS_SIGNAL
API_INTERACTION_SIGNAL
DATA_OBJECT_INTERACTION_SIGNAL
INTEGRATION_ACTION_SIGNAL
COMMERCIAL_AVAILABILITY_SIGNAL
CUSTOMER_USE_CONTEXT_SIGNAL
SUPPORT_OPERATIONAL_CONTEXT_SIGNAL
AUTOMATION_TRANSPARENCY_CONTEXT_SIGNAL
HUMAN_CONTROL_CONTEXT_SIGNAL
EXTERNAL_ACTION_SIGNAL
INPUT_OUTPUT_OBJECT_CONTEXT_SIGNAL
SOURCE_LIMITATION
```

## 7. Allowed Confidence Values

```text
CLEAR
PARTIAL
UNCLEAR
```

No numeric confidence score is allowed in 2C semantic output.

## 8. Required Package Boundary Flags

The semantic artifact must state:

```yaml
package_boundary:
  domain_agnostic_activity_locator_only: true
  mounted_domain_package_controls_activity_taxonomy: true
  archetype_surface_and_package_field_derivation_forbidden: true
  phase_5_derives_profile_values_later: true
```

## 9. Required Downstream Rules

The semantic artifact must state:

```yaml
downstream_rules:
  phase_2c_is_index_only: true
  activity_profile_source_index_owned_by_2c: true
  phase_5_activity_profile_review_derives_values_later: true
  domain_package_specific_activity_taxonomy_deferred_to_phase5: true
  archetype_derivation_allowed: false
  surface_derivation_allowed: false
  package_specific_classification_allowed: false
  feature_candidate_inventory_emission_allowed: false
  mechanics_proof_allowed: false
  source_text_copy_allowed: false
```

## 10. Forbidden Output Keys

The semantic artifact must not include:

```text
feature_candidate_inventory
target_feature_profile
target_feature_profile_forensics
domain_derivation_profile
active_run_package_manifest
target_profile
target_profile_forensics
data_privacy_navigation_index
legal_cartography_index
legal_signal_derivation_profile
exposure_registry_profile
challenge_gate
final_output_handoff
renderer_payload
```

## 11. Forbidden Package-Specific Classification Keys

The semantic artifact must not include:

```text
archetype_codes
surface_context_tokens
archetype_derivation_basis
surface_derivation_basis
activity_archetype
activity_surface
domain_activity_taxonomy
package_activity_classification
package_specific_field_family
selected_package
primary_domain_package
domain_package_selected
AI_REGISTRY_KEY
FIELD_DERIVATION_REGISTRY
CLASSIFICATION_DERIVATION_MATRIX
```

If Phase 5 needs any of those, Phase 5 must derive them using the active package after 3B has mounted the package.

## 12. Forbidden Source-Copy Keys

The semantic artifact must not include:

```text
lossless_text
clean_text
text
body
content
excerpt
snippet
summary
source_summary
evidence_summary
profile_answer
answer
derived_value
value
mechanics_proof
activity_candidate_summary
```

## 13. Forbidden Conclusions

The semantic artifact must not include conclusions such as:

```text
mechanics_proof
activity_candidate_summary
activity_profile_answer
profile_activity_final
archetype_locked
surface_locked
package_classification_locked
legal_advice
compliance_conclusion
risk_conclusion
exposure_match
data_provenance_conclusion
```

## 14. Retired Roots Forbidden

The semantic artifact must not reference old or retired source roots:

```text
lossless_root__about_company
lossless_root__legal_identity_notice
lossless_root__operator_entity_signals
lossless_root__supporting_company_signals
lossless_root__security_trust
lossless_root__trust_compliance
lossless_root__support_help
lossless_root__blog_resources
lossless_root__careers_hiring
lossless_root__public_repository_developer_assets
lossless_root__third_party_profiles
lossless_root__technical_docs_api_developer
lossless_family__P1_PRODUCT
lossless_family__P2_PLATFORM_FEATURE_SOLUTION
lossless_family__P3_AI_CAPABILITY_TECHNICAL
lossless_family__P4_USE_CASE_INDUSTRY
lossless_family__P5_ENTERPRISE_PRICING
```

## 15. Semantic Integrity Gate

The semantic artifact must prove:

```text
deterministic_queue_count
labeled_queue_count
coverage_ratio
ready_for_compiler
```

The backend validator requires semantic coverage of at least 0.80 where a deterministic queue exists.

## 16. Hard Stop Rule

If the model cannot classify a queue row using the neutral route classes, it must mark the row as `SOURCE_LIMITATION_ROUTE` or leave it for repair. It must not invent package-specific classifications to fill the gap.
