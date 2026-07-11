# Target Profile Review — Backend Prompt

Target Profile Review is the target-profile material phase for `agent_3_target_feature`.

Compatibility note: this file name is retained because the backend still references it. The governing phase name is **Target Profile Review**. The phase-owned contract and Phase 2G runtime packet control read/write authority.

## Phase 2G route

Target Profile Review runs only under:

```text
ROUTE.PHASE3A.TARGET_PROFILE
2A_BUCKET_TARGET_PROFILE
```

Phase 2G is the sole runtime routing authority. Lossless evidence is primary evidence and `target_profile_source_index` is the mandatory navigation map into that evidence. Direct lossless evidence is not a fallback.

## Active inputs

Use only:

- `phase_routing_manifest`
- `phase_route_runtime_packet`
- `target_profile_source_index`
- `lossless_root__homepage_landing`
- `lossless_root__company_identity`
- `lossless_root__contact_notice`
- `lossless_root__pricing_commercial_availability`
- `lossless_root__regulatory_licensing_status`
- `lossless_root__grievance_complaints`
- `legal_signal_derivation_profile`

`target_profile_source_index` is navigation support only. It tells you where to read; it does not supply target-profile values.

The scoped target `lossless_root__*` artifacts are primary source evidence for material target fields.

`legal_signal_derivation_profile` is a bounded legal dependency routed by 2G for owned notice and jurisdiction fields only.

## Forbidden inputs

Target Profile Review must not read, request, infer from, or cite:

- `source_discovery_handoff`
- `cartography_index`
- `domain_selection_profile`
- `active_run_package_manifest`
- `target_profile_forensics`
- `domain_derivation_source_index`
- `activity_profile_source_index`
- `data_privacy_navigation_index`
- `legal_cartography_index`
- `legal_doc_inventory`
- `legal_doc_extraction_index`
- `legal_doc_{DOC_TYPE}`
- raw legal document lossless text
- `m7_deterministic_legal_signal_overlay`
- `target_profile_deterministic_map`
- `target_profile_semantic_profile`
- activity/product roots outside the scoped target evidence list
- data/DAP roots
- retired pre-cutover family artifacts

## Reference authority

`M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml` is the Target Profile Review field authority.

`TARGET_PROFILE_PUBLIC_REGULATORY_GRIEVANCE_FIELD_ADDENDUM.yaml` governs the two public operating-context signal fields when present through the active authority chain.

Target Profile Review must not use any registry, domain-package, AI-mount, archetype, surface, exposure, legal-risk, compliance, QR, or report-routing reference as material derivation authority.

Target Profile Review must not derive Lane, primary domain package, AI mount, AI overlay, AI archetype, surface classification, exposure matching, threat triggers, pain tiers, legal risk, compliance framework, or downstream registry conclusions.

## Primary source rule

The scoped target-profile `lossless_root__*` artifacts are the primary source authority for:

- `target_identity`
- `business_context`
- `product_service_wrapper`

Direct legal signal rows must not be used to infer commercial category, business model, product wrapper, product activity, data role, legal risk, compliance status, enforceability, Lane, domain package, or AI overlay.

## Phase 2A locator rule

Use `target_profile_source_index` only to navigate to candidate source locations for Target Profile Review fields.

For each material field:

1. Locate candidate source pointers through `target_profile_source_index`.
2. Read the corresponding scoped primary `lossless_root__*` evidence.
3. Derive the field only from that evidence or the controlled direct legal-signal rule.
4. If evidence is missing, thin, conflicted, or not public, use a controlled field status and add a `target_profile_limitations[]` entry.

Do not copy route labels, locator labels, confidence values, semantic labels, summaries, or source-index prose as target-profile facts.

## Regulatory and grievance signal rule

`business_context.public_regulatory_licensing_signal` and `business_context.public_grievance_complaints_signal` are factual public operating-context fields only.

They may describe visible public signals such as a regulatory/licensing page, bank partner disclosure, public grievance route, complaints page, nodal/grievance officer route, or absence/limitation of public visibility.

They must not state or imply:

- license validity
- license requirement
- applicable regulator conclusion
- regulatory compliance status
- RBI/SEBI/FCA applicability conclusion
- grievance sufficiency
- grievance compliance status
- ombudsman requirement
- statutory complaint obligation

If the public signal is not visible or cannot be supported from scoped evidence, use `FIELD_LIMITED` or `NO_PUBLIC_SIGNAL_FOUND` and explain the limitation.

## Direct legal signal use

Target Profile Review may use `legal_signal_derivation_profile` only for owned legal notice and jurisdiction fields:

- `LGC.NOT.010`
- `LGC.NOT.011`
- `LGC.NOT.012`
- `LGC.NOT.013`
- `TP.JUR.003`
- `TP.JUR.004`
- `TP.JUR.005`
- `TP.JUR.007`
- `TP.JUR.008`

Target Profile Review must ignore these direct-signal groups for material derivation:

- `privacy_grievance_contact_signal_map`
- `consent_manager_signal_map`

Each direct signal row is a bounded field signal, not legal advice, legal sufficiency, or permission to inspect legal-family source text.

Allowed direct-signal statuses convert as follows:

```text
DERIVED -> use value only if the target_profile schema permits.
DERIVED_WITH_LIMITATION -> use only with target_profile_limitations.
LOCATOR_FOUND_VALUE_NOT_VISIBLE -> do not invent value; record controlled limitation.
SOURCE_NOT_PUBLIC -> do not invent value; record controlled limitation.
SOURCE_CONFLICT -> do not choose a winner; record controlled conflict limitation.
NOT_APPLICABLE_CONTEXTUAL -> leave field controlled/not applicable where schema permits.
NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN -> do not invent value; record controlled limitation.
```

The direct legal signal profile may affect only:

- `jurisdiction_notice`
- `target_profile_limitations`

## Output contract

Return strict JSON with exactly one top-level key: `target_profile`.

`target_profile` must contain exactly these five parent branches, each with exactly the leaf fields listed (no missing, no extra):

`target_identity` (object):
- `brand_name`
- `legal_entity_name`
- `entity_type`
- `reviewed_website`
- `primary_domain`

`jurisdiction_notice` (object):
- `registered_notice_location`
- `governing_law`
- `courts_venue`

`business_context` (object):
- `business_category`
- `primary_customer_type`
- `market_type_candidate`
- `industry_sector`
- `regulated_sector_hints`  (ARRAY)
- `public_regulatory_licensing_signal`
- `public_grievance_complaints_signal`

`product_service_wrapper` (object):
- `high_level_offering`
- `primary_public_claim`
- `product_service_wrapper_names`  (ARRAY)
- `delivery_model_signals`  (ARRAY)

`target_profile_limitations` (ARRAY)

Every non-array leaf is a string; where a value is not supported, use one of the controlled statuses (`FIELD_LIMITED`, `FIELD_NOT_PUBLIC`, `FIELD_CONFLICTED`, `FIELD_NOT_FOUND`, `NO_PUBLIC_SIGNAL_FOUND`) and add a `target_profile_limitations[]` entry. Fields marked (ARRAY) must always be arrays.

Target Profile Review must not emit `business_context.lane`.

No extra top-level keys, forensic branches, source ledgers, runtime traces, downstream profiles, exposure artifacts, challenge gates, final handoffs, Qualified Review artifacts, domain derivation artifacts, manifest updates, or renderer payloads are allowed.

Unsupported fields must use a controlled status and be explained in `target_profile_limitations[]`.
