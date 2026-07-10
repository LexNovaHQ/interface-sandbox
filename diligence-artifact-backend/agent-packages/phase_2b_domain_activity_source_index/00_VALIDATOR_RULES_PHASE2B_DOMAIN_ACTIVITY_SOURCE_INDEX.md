# VALIDATOR RULES — PHASE 2B DOMAIN & ACTIVITY SOURCE INDEX

## Backend contract authority

Validation authority is shared by:

```text
src/phases/02-cartography-index/domain-activity-source-index.contract.js
src/phases/02-cartography-index/services/domain-activity-deterministic-map.builder.js
src/phases/02-cartography-index/validators/domain-activity-semantic-profile.validator.js
P2B_DOMAIN_ACTIVITY_SOURCE_INDEX_REFERENCE_MAP.yaml
```

If this file conflicts with backend code, backend code wins.

## Required package output roots

Phase 2B has exactly three backend artifacts in this order:

```text
domain_activity_deterministic_map
domain_activity_semantic_profile
activity_profile_source_index
```

No other package output root is allowed.

## Deterministic map validation

`domain_activity_deterministic_map` must preserve these keys:

```text
source_artifacts_read
domain_activity_source_coverage_index
domain_activity_document_structure_index
primary_domain_locator_map
ai_overlay_locator_map
regulatory_overlay_locator_map
fusion_candidate_locator_map
activity_capability_locator_map
commercial_availability_locator_map
technical_capability_locator_map
integration_ecosystem_locator_map
use_case_customer_industry_locator_map
missing_limited_domain_activity_source_map
semantic_label_queue
quality_repair_queue
downstream_rules
lock_status
```

Deterministic locator rows must be pointer-only.

Rows may contain source artifact names, source IDs, common roots, source URLs, route classes, route codes, priorities, navigation pointers, fusion basis, limitations, and queue IDs.

Rows must not contain source text, source excerpts, source summaries, final values, package decisions, legal conclusions, compliance conclusions, or regulatory conclusions.

## Semantic profile validation

`domain_activity_semantic_profile` must be strict JSON and must contain only:

```text
schema_version
semantic_navigation_index
semantic_integrity
lock_status
```

Each `semantic_navigation_index` row may contain only:

```text
queue_id
unit_id
route_classes
route_signal_families
confidence
```

`route_classes` may contain only:

```text
PRIMARY_DOMAIN_ROUTE
AI_OVERLAY_ROUTE
REGULATORY_OVERLAY_ROUTE
FUSION_CANDIDATE_ROUTE
ACTIVITY_CAPABILITY_ROUTE
COMMERCIAL_AVAILABILITY_ROUTE
TECHNICAL_CAPABILITY_ROUTE
INTEGRATION_ECOSYSTEM_ROUTE
USE_CASE_CUSTOMER_INDUSTRY_ROUTE
SOURCE_LIMITATION_ROUTE
```

`route_signal_families` may contain only:

```text
PRIMARY_DOMAIN_SIGNAL
AI_OVERLAY_SIGNAL
REGULATORY_OVERLAY_SIGNAL
FUSION_CANDIDATE_SIGNAL
ACTIVITY_CAPABILITY_SIGNAL
COMMERCIAL_AVAILABILITY_SIGNAL
TECHNICAL_CAPABILITY_SIGNAL
INTEGRATION_ECOSYSTEM_SIGNAL
USE_CASE_CUSTOMER_INDUSTRY_SIGNAL
SOURCE_LIMITATION
```

`confidence` may contain only:

```text
CLEAR
PARTIAL
UNCLEAR
```

## Semantic coverage discipline

Semantic coverage is measured against deterministic `semantic_label_queue`, not against source units directly.

The semantic response must include one semantic row for every queue row where:

```text
semantic_label_required = true
priority = P0
priority = P1
```

`semantic_integrity.required_queue_count`, `labeled_queue_count`, `coverage_ratio`, and `ready_for_compiler` must match the deterministic queue.

Coverage ratio must be at least `0.80` for compiler readiness.

If coverage is below `0.80`, `ready_for_compiler` must be false and `lock_status` must be `REPAIR_REQUIRED`.

## Final index validation

`activity_profile_source_index` must preserve these final keys:

```text
source_coverage_index
domain_activity_document_structure_index
primary_domain_locator_map
ai_overlay_locator_map
regulatory_overlay_locator_map
fusion_candidate_locator_map
activity_capability_locator_map
commercial_availability_locator_map
technical_capability_locator_map
integration_ecosystem_locator_map
use_case_customer_industry_locator_map
priority_domain_activity_locator
semantic_navigation_index
missing_limited_domain_activity_items
downstream_rules
lock_status
```

Final rows must remain pointer-only. `activity_profile_source_index` is a route/navigation artifact, not a profile derivation artifact.

## Required downstream rules

Final `downstream_rules` must preserve the following doctrine:

```text
phase_2b_is_index_only = true
activity_profile_source_index_owned_by_2b = true
domain_derivation_layer_derives_values_later = true
primary_domain_derivation_forbidden_in_2b = true
ai_overlay_derivation_forbidden_in_2b = true
regulatory_overlay_derivation_forbidden_in_2b = true
fusion_lock_forbidden_in_2b = true
source_artifacts_remain_source_of_truth = true
full_text_copied = false
summaries_allowed = false
excerpts_allowed = false
legal_or_compliance_conclusions_allowed = false
phase1_v5_12_root_source_contract_required = true
old_family_input_contract_forbidden = true
```

## Forbidden content

Phase 2B output must not contain:

```text
domain_derivation_profile
active_run_package_manifest
target_profile
target_profile_forensics
feature_candidate_inventory
target_feature_profile
target_feature_profile_forensics
data_privacy_navigation_index
legal_cartography_index
legal_signal_derivation_profile
exposure_registry_profile
challenge_gate
final_output_handoff
renderer_payload
qualified_review_handoff
qualified_review_renderer_payload
summary
excerpt
snippet
lossless_text
clean_text
raw_text
body
content
value
derived_value
primary_domain
primary_domain_value
primary_domain_locked
primary_domain_final
domain_package
domain_package_selected
ai_overlay
ai_overlay_value
ai_overlay_mounted
ai_overlay_final
regulatory_overlay
regulatory_overlay_value
regulatory_overlay_mounted
regulatory_overlay_final
fusion_status
fusion_candidate_locked
license_validity
license_requirement
applicable_regulator
regulatory_compliance_status
grievance_sufficiency
grievance_compliance_status
ombudsman_requirement
legal_advice
compliance_conclusion
risk_conclusion
enforceability_assessment
lane
```

## Retired roots forbidden

The package must not read or emit retired pre-v5 roots or family artifacts, including:

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
lossless_family__
```

## Final self-check

Before saving, confirm:

```text
all required 12 roots are represented in read scope
all four 3B locator maps exist
fusion candidates require composite signal
semantic coverage is computed from semantic_label_queue
source artifacts remain source of truth
no source text is copied
no domain/overlay/package/legal/compliance conclusion is emitted
```
