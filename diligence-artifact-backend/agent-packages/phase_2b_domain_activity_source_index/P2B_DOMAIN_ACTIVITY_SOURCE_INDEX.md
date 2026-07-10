# PHASE 2B — DOMAIN & ACTIVITY SOURCE INDEX

## Current System Patch — Phase 2B / Domain & Activity Source Index

This module is active only for:

```text
P2B_DOMAIN_ACTIVITY_SOURCE_INDEX
```

Phase 2B builds the Domain & Activity Source Index for downstream 3B Domain Derivation. It does not execute Phase 1 Source Discovery, Phase 2A Target Profile Source Index, Phase 2E Legal Cartography and Index, Phase 3A Target Profile Review, Phase 3B Domain Derivation, Activity Profile Review, Data Provenance, Exposure, Operator Challenge, Compiler, Renderer, or Qualified Review.

The package-local module authority is this file. The package-local reference map is:

```text
P2B_DOMAIN_ACTIVITY_SOURCE_INDEX_REFERENCE_MAP.yaml
```

The backend contract authority remains:

```text
src/phases/02-cartography-index/domain-activity-source-index.contract.js
```

## Purpose

Phase 2B creates a route-aware, pointer-only Domain & Activity Source Index.

It identifies:

1. source coverage from the allowed 12 Phase 1 v5 domain/activity roots;
2. domain/activity document and source structure;
3. primary domain locator candidates;
4. AI overlay locator candidates;
5. regulatory overlay locator candidates;
6. fusion candidate locator candidates;
7. activity capability, commercial availability, technical capability, integration ecosystem, and use-case/customer/industry locator material;
8. missing, thin, limited, or unavailable domain/activity source material;
9. semantic queue rows for bounded domain/activity route labeling.

Phase 2B is an index and source-navigation layer only. It is not a summary layer, not a domain derivation layer, not an overlay mounting layer, not a package selection layer, not a legal analysis layer, and not a compliance layer.

## Inputs

Use only Phase 1 v5 / 17-root source-contract inputs scoped to Domain & Activity Source Index:

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

Do not read retired pre-v5 family artifacts or retired pre-v5 root aliases.

Do not read legal document artifacts, legal cartography artifacts, legal signal artifacts, DPNI/data-provenance artifacts, target profile forensics, feature inventory, target feature profile, exposure artifacts, challenge artifacts, compiler artifacts, renderer artifacts, or Qualified Review artifacts.

Do not browse, crawl, search, fetch new URLs, refresh sources, infer private documents, or create downstream profile substance.

## 2B / 3B Boundary

Phase 2B owns `activity_profile_source_index` as a route-aware evidence locator for 3B.

Phase 3B Domain Derivation owns:

```text
primary domain derivation
AI overlay derivation
regulatory overlay derivation
fusion candidate derivation
domain package mount logic
active_run_package_manifest update
```

Phase 2B may map route candidates from product, feature, technical, docs/API, commercial, use-case, integration, AI safety/transparency, regulatory/licensing, and grievance/complaints sources.

Phase 2B must not emit primary-domain values, domain package selections, AI overlay mounts, regulatory overlay mounts, fusion locks, legal advice, regulatory compliance status, license validity, license requirement, applicable regulator conclusions, grievance sufficiency, ombudsman requirements, risk conclusions, or active manifest updates.

## Reference Authority

Phase 2B must follow these authorities:

```text
P2B_DOMAIN_ACTIVITY_SOURCE_INDEX_REFERENCE_MAP.yaml
src/phases/02-cartography-index/domain-activity-source-index.contract.js
src/phases/02-cartography-index/services/domain-activity-deterministic-map.builder.js
src/phases/02-cartography-index/validators/domain-activity-semantic-profile.validator.js
references/domain-packages/DOMAIN_DERIVATION_REGISTRY_v0.yaml
references/domain-packages/package-catalog.v0.json
references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md
```

The reference map inventories route families, source scopes, downstream owner, allowed semantic route classes, allowed signal families, and `LOCATE_ONLY` status. It does not define derivation rules.

If this module conflicts with the backend contract or reference map, the backend contract and reference map win.

If the reference map conflicts with the Domain Derivation Registry, the Domain Derivation Registry wins for downstream derivation. Phase 2B still remains locate-only.

## Domain-Activity Locator Execution Model

Execute source location as follows:

1. Load the route inventory from `P2B_DOMAIN_ACTIVITY_SOURCE_INDEX_REFERENCE_MAP.yaml`.
2. For each route family, read only the listed allowed source scopes.
3. For each route family, map candidate source locators using route-class hints only.
4. For AI overlay routes, emit evidence locators only. Do not decide whether AI is mounted.
5. For regulatory overlay routes, emit factual public operating-context locators only. Do not decide licensing, applicability, validity, compliance, regulator jurisdiction, legal obligations, or sufficiency.
6. For fusion candidate routes, emit locator rows only when there is a composite signal. Do not lock fusion.
7. Emit no route value, no package value, no summary, no excerpt, no quote, no conclusion, and no final domain fact.
8. Add thin, missing, ambiguous, unsupported, or conflicting source coverage to missing/limited locator rows or quality repair rows.
9. Add semantic queue rows only for deterministic locator rows requiring bounded semantic labeling.
10. Stop after the Domain & Activity Source Index artifacts are ready for backend validation and save.

A valid Phase 2B locator row may identify where source material exists. It may not answer what the final 3B Domain Derivation result is.

## Deterministic Layer Boundary

The deterministic layer owns factual locator indexing only:

```text
source artifact read accounting
domain/activity source coverage index
domain/activity document structure index
primary domain locator rows
AI overlay locator rows
regulatory overlay locator rows
fusion candidate locator rows
activity capability locator rows
commercial availability locator rows
technical capability locator rows
integration ecosystem locator rows
use-case/customer/industry locator rows
missing or limited source rows
semantic label queue creation
quality repair queue creation
```

The deterministic layer must not copy full source text, quote source passages, summarize source material, emit domain values, emit overlay values, make legal conclusions, make regulatory conclusions, select a package, update a manifest, or classify final domain status.

The source artifacts remain the source of truth. Downstream 3B must read source artifacts through navigation pointers and apply the domain derivation registry.

## Semantic Layer Boundary

Semantic labels deterministic `semantic_label_queue` rows. It does not recreate the deterministic index.

Semantic emits only:

```text
route_classes
route_signal_families
confidence
```

Semantic copies only:

```text
queue_id
unit_id
```

No summaries, quotes, excerpts, source text, document roles, unit descriptions, downstream treatment, notes, new IDs, new URLs, profile values, domain values, overlay values, package selections, legal conclusions, regulatory conclusions, compliance conclusions, or downstream artifacts are allowed.

## Semantic Artifact Contract

When the expected write artifact is `domain_activity_semantic_profile`, return strict JSON only:

```json
{
  "domain_activity_semantic_profile": {
    "schema_version": "P2B_DOMAIN_ACTIVITY_SEMANTIC_PROFILE_v1_PHASE1_V5_12_ROOT",
    "semantic_navigation_index": [
      {
        "queue_id": "",
        "unit_id": "",
        "route_classes": [],
        "route_signal_families": [],
        "confidence": ""
      }
    ],
    "semantic_integrity": {
      "required_queue_count": 0,
      "labeled_queue_count": 0,
      "coverage_ratio": 0,
      "ready_for_compiler": false
    },
    "lock_status": "REPAIR_REQUIRED"
  }
}
```

No other top-level key is allowed in semantic mode.

## Semantic Coverage Discipline

Emit one `semantic_navigation_index` row for every deterministic `semantic_label_queue` row where `semantic_label_required` is true or `priority` is `P0` or `P1`.

The raw source unit map is not the semantic coverage source. The deterministic `semantic_label_queue` is the semantic coverage source.

`semantic_integrity.coverage_ratio` must be at least `0.80` for compiler readiness.

If coverage is below `0.80`, `semantic_integrity.ready_for_compiler` must be false and `lock_status` must be `REPAIR_REQUIRED`.

Empty semantic output cannot satisfy required deterministic queue rows.

## Allowed Semantic Values

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

`confidence` must be one of:

```text
CLEAR
PARTIAL
UNCLEAR
```

If a row cannot be classified, still emit it with empty `route_classes`, `SOURCE_LIMITATION`, and `UNCLEAR` confidence.

## Final Backend Output Contract

The final compiled artifact remains:

```text
activity_profile_source_index
```

The final root must preserve:

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

Rows may include navigation labels, route classes, signal families, source artifact names, source IDs, root IDs, source URLs, source status, heading paths, navigation pointers, fusion basis, and limitation notes. Rows must not include source text, copied excerpts, final domain values, overlay values, package decisions, legal conclusions, compliance conclusions, or regulatory conclusions.

## Forbidden Output Content

Phase 2B must not emit:

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
legal_advice
compliance_conclusion
risk_conclusion
enforceability_assessment
primary_domain_locked
primary_domain_final
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
lane
```

## Stop Condition

Stop after the backend can save, in order:

```text
domain_activity_deterministic_map
domain_activity_semantic_profile
activity_profile_source_index
```

Do not emit markdown, prose, report text, final handoff, renderer payload, Qualified Review payload, or same-chat next-phase instructions during backend execution.

Do not continue to 3B. 3B runs later and derives values from scoped source artifacts, the Domain Derivation Registry, and package-catalog authority.
