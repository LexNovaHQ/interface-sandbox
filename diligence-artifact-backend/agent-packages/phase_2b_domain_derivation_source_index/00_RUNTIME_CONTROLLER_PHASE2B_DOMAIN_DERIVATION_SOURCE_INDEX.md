# RUNTIME CONTROLLER — PHASE 2B DOMAIN DERIVATION SOURCE INDEX

## Active scope

This controller is active only for:

```text
P2B_DOMAIN_DERIVATION_SOURCE_INDEX
```

Phase 2B exists only to build a pointer-only source index for downstream 3B Domain Derivation.

It does not run Target Profile Review, Domain Derivation, Activity Profile Review, Data Provenance, Legal Cartography, Exposure, Operator Challenge, Compiler, Renderer, or Qualified Review.

## Inputs

Read only the allowed 12 Phase 1 v5 roots and control artifacts:

```text
source_discovery_handoff
post_phase_1_domain_gate_handoff
source_discovery_matrix_manifest
neutral_evidence_bucket_manifest
adapter_expansion_log
source_family_index
lossless_root__homepage_landing
lossless_root__company_identity
lossless_root__product_service
lossless_root__platform_feature_solution
lossless_root__technical_docs_api
lossless_root__docs_api_data_flow
lossless_root__pricing_commercial_availability
lossless_root__use_case_customer_industry
lossless_root__integrations_ecosystem
lossless_root__ai_safety_transparency
lossless_root__regulatory_licensing_status
lossless_root__grievance_complaints
```

## Output order

Save exactly these artifacts, in this order:

```text
domain_derivation_deterministic_map
domain_derivation_semantic_profile
domain_derivation_source_index
```

## Boundary

Phase 2B may locate evidence for:

```text
primary_domain_locator_map
ai_overlay_locator_map
regulatory_overlay_locator_map
fusion_candidate_locator_map
activity_capability_locator_map
commercial_availability_locator_map
technical_capability_locator_map
integration_ecosystem_locator_map
use_case_customer_industry_locator_map
```

Phase 2B must not derive the primary domain, mount an AI overlay, mount a regulatory overlay, lock a fusion candidate, select a package, update the active run package manifest, or emit the 3B domain derivation profile.

## 2C reservation

`activity_profile_source_index` is reserved for Phase 2C / Phase 5 Activity Profile Review. Phase 2B must not emit it, own it, overwrite it, or use it as its final artifact.

## Source of truth

Phase 1 source artifacts remain the source of truth. This package creates navigation pointers only.

## Stop condition

Stop after `domain_derivation_source_index` is ready for backend validation and save. Do not continue to 3B in the same execution.
