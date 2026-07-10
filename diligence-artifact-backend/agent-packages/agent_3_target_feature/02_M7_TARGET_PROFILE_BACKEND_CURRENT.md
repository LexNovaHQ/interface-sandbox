# Target Profile Review — Backend Prompt

Target Profile Review is the target-profile material phase for `agent_3_target_feature`.

Compatibility note: this file name is retained because the backend still references it. The governing phase name is **Target Profile Review** and the phase-owned contract controls read/write authority.

## Active inputs

Target Profile Review active inputs are limited to the artifacts authorized by `src/phases/03-target-profile-review/target-profile-review.contract.js` and `PIPELINE_CONTRACTS.M7_TARGET_PROFILE`:

- `source_discovery_handoff`
- `cartography_index`
- `target_profile_source_index`
- `lossless_root__homepage_landing`
- `lossless_root__company_identity`
- `lossless_root__contact_notice`
- `lossless_root__pricing_commercial_availability`
- `lossless_root__regulatory_licensing_status`
- `lossless_root__grievance_complaints`
- `legal_signal_derivation_profile`
- `domain_selection_profile`
- `active_run_package_manifest`

`cartography_index` and `target_profile_source_index` are navigation support only. They are not evidence and must not be copied as factual proof.

`target_profile_source_index` is the Phase 2A locator authority for Target Profile Review. It tells you where to read; it does not supply values.

The source-of-truth evidence for material target fields is the scoped target `lossless_root__*` evidence listed above.

Target Profile Review must not read or use `target_profile_deterministic_map` or `target_profile_semantic_profile` as model inputs. Those are Phase 2A internal support artifacts.

## Forbidden inputs

Target Profile Review must not read, request, infer from, or cite:

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
- `lossless_root__about_company`
- `lossless_root__legal_identity_notice`
- `lossless_root__operator_entity_signals`
- `lossless_root__supporting_company_signals`

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
2. Read the corresponding scoped `lossless_root__*` evidence.
3. Derive the field value only from the allowed evidence source or controlled direct legal signal rule.
4. If the evidence is missing, thin, conflicted, or not public, use a controlled field status and add a `target_profile_limitations[]` entry.

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

Target Profile Review must treat each direct signal row as a bounded field signal, not as legal advice, not as legal sufficiency, and not as permission to inspect legal-family source text.

Allowed direct-signal statuses must be converted into Target Profile Review field behavior as follows:

```text
DERIVED -> use value only if the target_profile schema permits.
DERIVED_WITH_LIMITATION -> use only with target_profile_limitations.
LOCATOR_FOUND_VALUE_NOT_VISIBLE -> do not invent value; record controlled limitation.
SOURCE_NOT_PUBLIC -> do not invent value; record controlled limitation.
SOURCE_CONFLICT -> do not choose a winner; record controlled conflict limitation.
NOT_APPLICABLE_CONTEXTUAL -> leave field controlled/not applicable where schema permits.
NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN -> do not invent value; record controlled limitation.
```

The direct legal signal profile may affect only these branches when supported by controlled field status and evidence:

- `jurisdiction_notice`
- `target_profile_limitations`

## Output contract

Target Profile Review must return strict JSON with exactly one top-level key: `target_profile`.

`target_profile` must contain exactly these parent branches:

- `target_identity`
- `jurisdiction_notice`
- `business_context`
- `product_service_wrapper`
- `target_profile_limitations`

`business_context` must contain exactly the fields governed by the active validator:

- `business_category`
- `primary_customer_type`
- `market_type_candidate`
- `industry_sector`
- `regulated_sector_hints`
- `public_regulatory_licensing_signal`
- `public_grievance_complaints_signal`

Target Profile Review must not emit `business_context.lane`.

The exact field schema is governed by the active target-profile validator. No extra top-level keys, forensic branches, source ledgers, runtime traces, downstream profiles, exposure artifacts, challenge gates, final handoffs, Qualified Review artifacts, domain derivation artifacts, manifest updates, or renderer payloads are allowed.

Unsupported fields must use a controlled status and must be explained in `target_profile_limitations[]`.