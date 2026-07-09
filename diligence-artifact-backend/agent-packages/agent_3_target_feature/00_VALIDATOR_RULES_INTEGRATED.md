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
- `lossless_root__about_company`
- `lossless_root__legal_identity_notice`
- `lossless_root__pricing_commercial_availability`
- `lossless_root__contact_notice`
- `lossless_root__operator_entity_signals`
- `lossless_root__supporting_company_signals`
- `legal_signal_derivation_profile`
- `domain_selection_profile`
- `active_run_package_manifest`

`cartography_index` and `target_profile_source_index` are navigation only. The scoped `lossless_root__*` target artifacts are the evidence source.

The validator must reject Target Profile Review use of:

- `legal_cartography_index`
- `legal_doc_inventory`
- `legal_doc_extraction_index`
- `legal_doc_{DOC_TYPE}`
- raw legal/governance source text
- `m7_deterministic_legal_signal_overlay`
- activity/product evidence roots outside the scoped target list
- data-provenance roots
- any retired `lossless_family__*` artifact

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

`business_context` must not include `lane`.

No forensic branch, profile metadata, evidence ledger, source ledger, confidence object, trace object, downstream object, domain derivation object, manifest update, legal-risk object, data object, registry object, final handoff, renderer payload, or Qualified Review object may appear inside `target_profile`.

## Activity Profile Review gate

Activity Profile Review may use only target-profile artifacts, domain derivation context, feature candidate inventory, and product/activity evidence authorized by the backend phase contract.

Activity Profile Review may not use Target Profile Review to import legal/governance source material.

## Failure routing

Forbidden artifact use is `CONTROLLED_FAILURE`.

Unsupported but in-scope fields are controlled limitations, not legal-family repair requests.
