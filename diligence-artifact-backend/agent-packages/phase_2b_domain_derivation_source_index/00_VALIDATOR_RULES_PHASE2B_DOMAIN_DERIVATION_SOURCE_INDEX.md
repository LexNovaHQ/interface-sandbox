# VALIDATOR RULES — PHASE 2B DOMAIN DERIVATION SOURCE INDEX

## Backend authority

The backend contract is:

```text
src/phases/02-cartography-index/domain-derivation-source-index.contract.js
```

The package reference map is:

```text
P2B_DOMAIN_DERIVATION_SOURCE_INDEX_REFERENCE_MAP.yaml
```

## Required artifacts

The validator must accept only this save sequence:

```text
domain_derivation_deterministic_map
domain_derivation_semantic_profile
domain_derivation_source_index
```

## Required final artifact

The final artifact must be:

```text
domain_derivation_source_index
```

The final artifact must not be:

```text
activity_profile_source_index
```

`activity_profile_source_index` is reserved for 2C / Phase 5 Activity Profile Review.

## Required final keys

The final root must include:

```text
source_coverage_index
domain_derivation_document_structure_index
primary_domain_locator_map
ai_overlay_locator_map
regulatory_overlay_locator_map
fusion_candidate_locator_map
activity_capability_locator_map
commercial_availability_locator_map
technical_capability_locator_map
integration_ecosystem_locator_map
use_case_customer_industry_locator_map
priority_domain_derivation_locator
semantic_navigation_index
missing_limited_domain_derivation_items
downstream_rules
lock_status
```

## Locator row rules

Every locator row must be pointer-only.

Allowed locator row material:

```text
locator_id
unit_id
source_artifact
source_id
common_root
route_class
route_code
route_signal_families
phase_2b_action
downstream_owner
priority
source_url
heading_path
navigation_pointer
matched_terms
fusion_basis
limitation
```

Forbidden locator row material:

```text
summary
excerpt
snippet
quote
lossless_text
clean_text
raw_text
body
content
notes
reasoning
value
derived_value
primary_domain
domain_package
ai_overlay
regulatory_overlay
fusion_status
conclusion
```

## Semantic coverage discipline

Semantic coverage is measured against deterministic `semantic_label_queue` rows.

`coverage_ratio` must be at least `0.80` for compiler readiness.

If coverage is below `0.80`, `ready_for_compiler` must be false and `lock_status` must be `REPAIR_REQUIRED`.

## Fusion rule

`fusion_candidate_locator_map` rows are valid only when:

```text
route_class = FUSION_CANDIDATE_ROUTE
phase_2b_action = LOCATE_ONLY
fusion_basis.ai_signal_visible = true
fusion_basis.composite_signal_count >= 2
fusion_basis.rule = AI_SIGNAL_PLUS_ONE_OR_MORE_PRIMARY_REGULATORY_ACTIVITY_OR_COMMERCIAL_SIGNAL
```

A single AI keyword is not enough. A single regulated keyword is not enough. Fusion requires a composite signal.

## Forbidden outputs

Phase 2B must not output:

```text
activity_profile_source_index
domain_derivation_profile
active_run_package_manifest
target_profile
feature_candidate_inventory
target_feature_profile
data_privacy_navigation_index
legal_cartography_index
legal_signal_derivation_profile
```

## Forbidden conclusions

Phase 2B must not conclude:

```text
primary_domain_final
primary_domain_locked
domain_package_selected
ai_overlay_mounted
ai_overlay_final
regulatory_overlay_mounted
regulatory_overlay_final
fusion_candidate_locked
license_validity
license_requirement
applicable_regulator
regulatory_compliance_status
grievance_sufficiency
grievance_compliance_status
ombudsman_requirement
statutory_complaint_obligation
legal_advice
compliance_conclusion
risk_conclusion
```

## Retired roots forbidden

The validator must fail if any active 2B package file uses old family or retired roots as active reads:

```text
lossless_family__
lossless_root__about_company
lossless_root__legal_identity_notice
lossless_root__operator_entity_signals
lossless_root__supporting_company_signals
lossless_root__technical_docs_api_developer
lossless_root__security_trust
lossless_root__trust_compliance
```

## Stop condition

Validation ends after `domain_derivation_source_index` is proven pointer-only, route-index-only, and cleanly reserved for 3B. It does not validate 3B derivation substance.
