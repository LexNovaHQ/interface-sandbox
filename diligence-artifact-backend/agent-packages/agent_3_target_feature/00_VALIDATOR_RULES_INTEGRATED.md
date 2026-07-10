# Target and Activity Profile Validator Rules

## Validator kernel

This validator is bounded by the backend phase contract. It cannot expand read authority.

## Universal gates

- Validate exact active phase.
- Validate exact run_id.
- Validate phase-owned output only.
- Validate material artifacts are saved before forensic artifacts.
- Reject downstream artifacts, Source Discovery artifacts, Legal Cartography and Index artifacts, Data Provenance Profile artifacts, Exposure Profile artifacts, challenge gates, final handoffs, renderer payloads, and Qualified Review artifacts from this package's outputs.
- Reject model memory, unsupported source claims, route labels copied as facts, and schema-shaped but unsupported values.

## Target Profile Review input gate

For Target Profile Review, allowed inputs are exactly:

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

`cartography_index` and `target_profile_source_index` are navigation only. The scoped `lossless_root__*` target artifacts are the evidence source.

`target_profile_deterministic_map` and `target_profile_semantic_profile` are Phase 2A internal artifacts and must not be treated as Target Profile Review model inputs.

The validator must reject Target Profile Review use of:

- `legal_cartography_index`
- `legal_doc_inventory`
- `legal_doc_extraction_index`
- `legal_doc_{DOC_TYPE}`
- raw legal/governance source text
- `m7_deterministic_legal_signal_overlay`
- `target_profile_deterministic_map`
- `target_profile_semantic_profile`
- activity/product evidence roots outside the scoped target list
- data-provenance roots
- retired pre-cutover family artifacts

Target Profile Review must not block merely because legal/governance lossless artifacts are unavailable. Missing or limited direct legal signal rows must become controlled field statuses and limitation rows.

## Target Profile Review direct signal gate

`legal_signal_derivation_profile` may support only these field IDs:

- `LGC.NOT.010`
- `LGC.NOT.011`
- `LGC.NOT.012`
- `LGC.NOT.013`
- `TP.JUR.003`
- `TP.JUR.004`
- `TP.JUR.005`
- `TP.JUR.007`
- `TP.JUR.008`

The validator must reject Target Profile Review use of:

- `privacy_grievance_contact_signal_map`
- `consent_manager_signal_map`

Direct signal status behavior:

```text
DERIVED -> use value only if the target_profile schema permits.
DERIVED_WITH_LIMITATION -> use value only with target_profile_limitations entry.
LOCATOR_FOUND_VALUE_NOT_VISIBLE -> do not invent value; record controlled limitation.
SOURCE_NOT_PUBLIC -> do not invent value; record controlled limitation.
SOURCE_CONFLICT -> do not choose a winner; record conflict limitation.
NOT_APPLICABLE_CONTEXTUAL -> controlled not applicable where schema permits.
NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN -> do not invent value; record controlled limitation.
```

## Target Profile Review material output gate

`target_profile` must contain exactly five parent sections:

- `target_identity`
- `jurisdiction_notice`
- `business_context`
- `product_service_wrapper`
- `target_profile_limitations`

`business_context` must contain exactly the active backend contract fields, including:

- `business_category`
- `primary_customer_type`
- `market_type_candidate`
- `industry_sector`
- `regulated_sector_hints`
- `public_regulatory_licensing_signal`
- `public_grievance_complaints_signal`

`business_context` must not include `lane`.

`public_regulatory_licensing_signal` and `public_grievance_complaints_signal` must remain factual public operating-context signals. The validator must reject license validity, license requirement, applicable regulator conclusion, regulatory compliance status, grievance sufficiency, grievance compliance status, ombudsman requirement, or statutory complaint obligation.

No forensic branch, profile metadata, evidence ledger, source ledger, confidence object, trace object, downstream object, domain derivation object, manifest update, legal-risk object, data object, registry object, final handoff, renderer payload, or Qualified Review object may appear inside `target_profile`.

## Domain Derivation Layer input gate

For `P3_DOMAIN_DERIVATION_LAYER`, allowed inputs are exactly:

- `source_discovery_handoff`
- `cartography_index`
- `target_profile_source_index`
- `activity_profile_source_index`
- `target_profile`
- `lossless_root__homepage_landing`
- `lossless_root__company_identity`
- `lossless_root__product_service`
- `lossless_root__platform_feature_solution`
- `lossless_root__technical_docs_api`
- `lossless_root__docs_api_data_flow`
- `lossless_root__pricing_commercial_availability`
- `lossless_root__use_case_customer_industry`
- `lossless_root__integrations_ecosystem`
- `domain_selection_profile`
- `active_run_package_manifest`

For `P3_DOMAIN_DERIVATION_LAYER`, allowed references are exactly:

- `references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md`
- `references/domain-packages/package-catalog.v0.json`
- `references/domain-packages/DOMAIN_DERIVATION_REGISTRY_v0.yaml`

The validator must reject Domain Derivation Layer use of:

- `legal_cartography_index`
- `legal_signal_derivation_profile`
- `legal_doc_inventory`
- `legal_doc_extraction_index`
- `legal_doc_{DOC_TYPE}`
- raw legal/governance source text
- `data_privacy_navigation_index`
- privacy/security/trust roots
- retired pre-cutover family artifacts
- exposure artifacts
- compiler artifacts
- Qualified Review artifacts

## Domain Derivation Layer registry ladder gate

The Domain Derivation Layer prompt is domain-agnostic. It must not hardcode domain-specific classification logic.

The registry is the ladder:

- `DOMAIN_DERIVATION_REGISTRY_v0.yaml` is rule authority.
- `package-catalog.v0.json` is package authority.
- scoped target/activity `lossless_root__*` artifacts are evidence authority.
- Phase 2 indexes are navigation only.
- `target_profile` is context only, not proof.
- the model returns condition-level semantic evaluations.
- deterministic validator/compiler is lock authority.

New supported domains, overlays, fusion candidates, and regulatory overlays must be added through registry/catalog updates, not prompt edits.

## Domain Derivation Layer output gate

The model response must contain exactly one top-level key:

- `domain_derivation_profile`

The model must not emit top-level `active_run_package_manifest`. The compiler writes `active_run_package_manifest` after validation.

`domain_derivation_profile` must contain the branches defined by the phase-owned contract and must not contain target profile edits, activity rows, data profile artifacts, exposure rows, legal advice, compliance conclusions, risk conclusions, Lane, AI archetype lock, or surface lock.

Every true registry condition must carry scoped lossless evidence anchors. Index artifacts and `target_profile` must never be cited as evidence.

## Activity Profile Review gate

Activity Profile Review may use only target-profile artifacts, domain derivation context, feature candidate inventory, and product/activity evidence authorized by the backend phase contract.

Activity Profile Review may not use Target Profile Review or Domain Derivation Layer to import legal/governance source material.

## Failure routing

Forbidden artifact use is `CONTROLLED_FAILURE`.

Unsupported but in-scope fields are controlled limitations, not legal-family repair requests.