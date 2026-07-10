# RUNTIME CONTROLLER — PHASE 2B DOMAIN & ACTIVITY SOURCE INDEX

## Active scope

This runtime controller is active only for:

```text
P2B_DOMAIN_ACTIVITY_SOURCE_INDEX
```

It controls the Domain & Activity Source Index package only. It does not execute Source Discovery, Target Profile Review, Domain Derivation, Activity Profile Review, Data Provenance, Legal Cartography, Exposure, Challenge, Compiler, Renderer, Qualified Review, or Assembly Engine.

## Purpose

Phase 2B builds a pointer-only source index for 3B Domain Derivation.

The purpose is to locate and prioritize public source evidence for:

```text
primary_domain_locator_map
ai_overlay_locator_map
regulatory_overlay_locator_map
fusion_candidate_locator_map
activity_profile_source_index
```

The purpose is not to decide the primary domain, mount an AI overlay, mount a regulatory overlay, lock a fusion candidate, select a package, update a manifest, or produce downstream profile substance.

## Inputs

Read only the control artifacts and 12 scoped Phase 1 v5 common-root artifacts listed in `P2B_DOMAIN_ACTIVITY_SOURCE_INDEX_RUNTIME_BINDING_PACKET.yaml`.

The active scoped roots are:

```text
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

Do not read legal document artifacts, legal cartography artifacts, legal signal artifacts, data privacy navigation artifacts, target profile forensics, activity profile artifacts, DAP artifacts, exposure artifacts, challenge artifacts, compiler artifacts, renderer artifacts, or Qualified Review artifacts.

## Execution sequence

Run the package in this order:

```text
1. P2B_DETERMINISTIC_DOMAIN_ACTIVITY_MAP
2. P2B_BOUNDED_SEMANTIC_ROUTE_LABELING
3. P2B_DETERMINISTIC_COMPILER
4. P2B_FINAL_VALIDATOR
```

The backend save order must be:

```text
domain_activity_deterministic_map
domain_activity_semantic_profile
activity_profile_source_index
```

## Deterministic layer command

The deterministic layer must locate source units and route candidates only.

It may emit:

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

It must not emit source text, summaries, excerpts, quotes, derived values, primary-domain values, overlay values, package selections, legal conclusions, compliance conclusions, or risk conclusions.

## Semantic layer command

The semantic layer may label deterministic `semantic_label_queue` rows only.

It may emit only:

```text
queue_id
unit_id
route_classes
route_signal_families
confidence
```

The semantic layer must not create new source rows, new URLs, new source IDs, new routes, new final values, explanations, report text, source summaries, source excerpts, legal conclusions, compliance conclusions, domain package decisions, active manifest updates, or downstream artifacts.

## Boundary rule

Phase 2B is an index layer. 3B is the derivation layer.

The correct handoff is:

```text
Phase 2B locates and prioritizes evidence.
Phase 3B reads the scoped source evidence through pointers and applies the domain derivation registry.
```

Any attempt to derive, lock, select, mount, approve, reject, or conclude in Phase 2B is a contract breach.

## Stop condition

Stop after the backend can validate and save:

```text
domain_activity_deterministic_map
domain_activity_semantic_profile
activity_profile_source_index
```

Do not continue to 3B. Do not emit same-chat next-phase instructions. Do not emit markdown outside strict backend JSON during model execution.
