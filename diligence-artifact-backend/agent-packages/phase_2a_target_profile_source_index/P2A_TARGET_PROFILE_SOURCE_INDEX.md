# PHASE 2A — TARGET PROFILE SOURCE INDEX

## Current System Patch — Phase 2A / Target Profile Source Index

This module is active only for `P2A_TARGET_PROFILE_SOURCE_INDEX`.

Phase 2A builds the Target Profile Source Index for downstream Target Profile Review. It does not execute Phase 1 Source Discovery, Phase 2E Legal Cartography and Index, Phase 3A Target Profile Review, domain derivation, activity derivation, data provenance, exposure analysis, operator challenge, compiler, renderer, or Qualified Review.

The package-local module authority is this file. The package-local reference map is:

```text
P2A_TARGET_PROFILE_SOURCE_INDEX_REFERENCE_MAP.yaml
```

The backend contract authority remains:

```text
src/phases/02-cartography-index/target-profile-source-index.contract.js
```

## Purpose

Phase 2A creates a field-aware, pointer-only Target Profile Source Index.

It identifies:

1. target-profile source coverage from the allowed Phase 1 v5 target roots;
2. target document/source structure;
3. material Target Profile Review field locator candidates;
4. identity, brand, homepage-positioning, contact, commercial, pricing/sales, and customer-context locators;
5. regulatory/licensing, consumer-disclosure, counterparty-institution, grievance, complaints, nodal-officer, ombudsman, and escalation-route locator material;
6. target-relevant legal signal locators from legal document artifacts, without full legal cartography;
7. missing, thin, limited, or unavailable target-profile source material;
8. semantic queue rows for bounded target-profile semantic labeling.

Phase 2A is an index and source-navigation layer only. It is not a summary layer, not a profile derivation layer, not a legal analysis layer, and not a compliance layer.

## Inputs

Use only Phase 1 v5 / 17-root source-contract inputs scoped to Target Profile Source Index:

```text
source_discovery_handoff
post_phase_1_domain_gate_handoff
source_discovery_matrix_manifest
neutral_evidence_bucket_manifest
adapter_expansion_log
source_family_index
legal_doc_inventory
legal_doc_extraction_index
legal_doc_lossless_validation_manifest
legal_doc_{DOC_TYPE}
lossless_root__homepage_landing
lossless_root__company_identity
lossless_root__contact_notice
lossless_root__pricing_commercial_availability
lossless_root__regulatory_licensing_status
lossless_root__grievance_complaints
```

Do not read retired pre-v5 family artifacts or retired pre-v5 root aliases.

Do not read product/activity roots, data-provenance roots, full M9 legal/governance roots outside target-profile locator scope, exposure artifacts, challenge artifacts, compiler artifacts, renderer artifacts, or Qualified Review artifacts.

Do not browse, crawl, search, fetch new URLs, refresh sources, infer private documents, or create downstream profile substance.

## 2A / 2E / 3A Boundary

Phase 2A owns Target Profile Source Index and target-profile legal signal locators.

Phase 3A Target Profile Review owns material target-profile value derivation.

Phase 2E / M9 owns full legal/governance cartography.

Phase 2A may map target-profile locator material from regulatory, licensing, consumer-disclosure, counterparty-institution, grievance, complaints, nodal-officer, ombudsman, and escalation-route sources. Phase 2A must not emit target-profile values, license validity, license requirement, regulator applicability, compliance status, grievance sufficiency, ombudsman requirement, legal risk, enforceability, or legal advice.

`legal_signal_derivation_profile` is compatibility-preserved outside this module. Phase 2A must not emit it, mutate it, or treat it as the active Target Profile Review authority after the 2A locator cutover.

## Reference Authority

Phase 2A must follow these authorities:

```text
P2A_TARGET_PROFILE_SOURCE_INDEX_REFERENCE_MAP.yaml
src/phases/02-cartography-index/target-profile-source-index.contract.js
src/phases/02-cartography-index/services/target-profile-deterministic-map.builder.js
src/phases/02-cartography-index/validators/target-profile-semantic-profile.validator.js
references/registry/Diligence_Field_Derivation_Registry.yml
references/registry/Diligence_Field_Derivation_Registry.yml
references/registry/Diligence_Field_Derivation_Registry.yml
```

The reference map inventories field IDs, downstream owner, allowed source scopes, locator families, and `LOCATE_ONLY` status. It does not define derivation rules.

If this module conflicts with the backend contract or reference map, the backend contract and reference map win.

If the reference map conflicts with the Target Profile Review derivation authority, the Target Profile Review derivation authority wins for downstream value derivation. Phase 2A still remains locate-only.

## Material Field Locator Execution Model

Execute field-aware source location as follows:

1. Load the material field locator inventory from `P2A_TARGET_PROFILE_SOURCE_INDEX_REFERENCE_MAP.yaml`.
2. For each field row, read only the listed `allowed_source_scopes`.
3. For each field row, map candidate source locators using only listed `locator_families`.
4. For regulatory/licensing and grievance/complaints fields, emit factual locator candidates only.
5. For legal target signal fields, emit legal document locator candidates only; do not perform full legal cartography.
6. For governing law and courts/venue support, preserve the boundary that regulatory, grievance, complaints, support, and contact pages may not derive governing law or courts/venue.
7. Emit no field value, no summary, no excerpt, no quote, no conclusion, and no final profile fact.
8. Add thin, missing, ambiguous, unsupported, or conflicting source coverage to missing/limited locator rows or quality repair rows.
9. Add semantic queue rows only for deterministic locator rows requiring bounded semantic labeling.
10. Stop after the Target Profile Source Index artifacts are ready for backend validation and save.

A valid Phase 2A locator row may identify where source material exists. It may not answer what the final Target Profile Review value is.

## Deterministic Layer Boundary

The deterministic layer owns factual locator indexing only:

- source artifact read accounting;
- target source coverage index;
- target document/source structure index;
- material target field locator rows;
- entity identity locator rows;
- brand/trade-name locator rows;
- homepage positioning locator rows;
- contact route locator rows;
- commercial availability locator rows;
- pricing/sales route locator rows;
- customer segment context locator rows;
- regulatory/licensing locator rows;
- grievance/complaints locator rows;
- target-relevant legal signal locator rows;
- missing or limited target source rows;
- semantic label queue creation;
- quality repair queue creation.

The deterministic layer must not copy full source text, quote source passages, summarize source material, emit target-profile values, make legal conclusions, make regulatory conclusions, or classify domain/lane/activity.

The source artifacts remain the source of truth. Downstream Target Profile Review must read source artifacts through navigation pointers.

## Semantic Layer Boundary

Semantic labels deterministic `semantic_label_queue` rows. It does not recreate the deterministic index.

Semantic emits only:

- `target_subcats`;
- `target_signal_families`;
- `confidence`.

Semantic copies only:

- `queue_id`;
- `unit_id`.

No summaries, quotes, excerpts, source text, document roles, unit descriptions, downstream treatment, notes, new IDs, new URLs, profile values, legal conclusions, regulatory conclusions, compliance conclusions, or downstream artifacts are allowed.

## Semantic Artifact Contract

When the expected write artifact is `target_profile_semantic_profile`, return strict JSON only:

```json
{
  "target_profile_semantic_profile": {
    "schema_version": "P2A_TARGET_PROFILE_SEMANTIC_PROFILE_v2_PHASE1_V5",
    "semantic_navigation_index": [
      {
        "queue_id": "",
        "unit_id": "",
        "target_subcats": [],
        "target_signal_families": [],
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

`target_subcats` may contain only:

```text
ENTITY_IDENTITY
BRAND_IDENTITY
OPERATOR_IDENTITY
MARKET_POSITIONING
CONTACT_NOTICE
COMMERCIAL_AVAILABILITY
PRICING_SALES
CUSTOMER_SEGMENT
GEOGRAPHY_JURISDICTION
LEGAL_NOTICE_POINTER
LEGAL_TARGET_SIGNAL
REGULATORY_LICENSING_SIGNAL
PUBLIC_REGULATORY_DISCLOSURE
GRIEVANCE_COMPLAINTS_SIGNAL
COMPLAINTS_ESCALATION_ROUTE
COUNTERPARTY_INSTITUTION_SIGNAL
CONSUMER_DISCLOSURE_SIGNAL
LIMITED_PUBLIC_DISCLOSURE
```

`target_signal_families` may contain only:

```text
IDENTITY
CONTACT
COMMERCIAL
MARKET
JURISDICTION_POINTER
LEGAL_NOTICE_POINTER
LEGAL_TARGET_SIGNAL
REGULATORY_OPERATING_CONTEXT
GRIEVANCE_OPERATING_CONTEXT
COUNTERPARTY_INSTITUTION
CONSUMER_DISCLOSURE
MONEY_MOVEMENT_CONTEXT
SOURCE_LIMITATION
UNKNOWN_TARGET_SIGNAL
```

`confidence` must be one of:

```text
CLEAR
PARTIAL
UNCLEAR
```

If a row cannot be classified, still emit it with empty `target_subcats`, `UNKNOWN_TARGET_SIGNAL`, and `UNCLEAR` confidence.

## Final Backend Output Contract

The final compiled artifact remains:

```text
target_profile_source_index
```

The final root must preserve:

```text
source_coverage_index
target_document_structure_index
material_target_field_locator
entity_identity_locator
brand_trade_name_locator
homepage_positioning_locator
contact_route_locator
commercial_availability_locator
pricing_sales_route_locator
customer_segment_context_locator
regulatory_licensing_locator
grievance_complaints_locator
legal_target_signal_locator
priority_target_locator
semantic_navigation_index
missing_limited_target_profile_items
downstream_rules
lock_status
```

Rows may include navigation labels, locator families, source artifact names, source IDs, root IDs, source URLs, source status, heading paths, navigation pointers, and limitation notes. Rows must not include source text, copied excerpts, final target-profile values, legal conclusions, compliance conclusions, or regulatory conclusions.

## Forbidden Output Content

Phase 2A must not emit:

```text
target_profile
domain_derivation_profile
active_run_package_manifest
feature_candidate_inventory
target_feature_profile
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
license_status
regulatory_compliance_status
is_regulated
applicable_regulator
required_license
license_validity
grievance_compliance_status
grievance_sufficiency
ombudsman_required
RBI_applicability
SEBI_applicability
FCA_authorisation_status
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

Phase 2A must not derive governing law or courts/venue from regulatory, grievance, complaints, support, or contact pages.

## Stop Condition

Stop after the backend can save, in order:

```text
target_profile_deterministic_map
target_profile_semantic_profile
target_profile_source_index
```

Do not emit markdown, prose, report text, final handoff, renderer payload, Qualified Review payload, or same-chat next-phase instructions during backend execution.

Do not continue to Target Profile Review. Target Profile Review runs later and derives values from scoped source artifacts and active derivation authority.
