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
- `lossless_family__T0_ROOT`
- `lossless_family__T1_IDENTITY`
- `lossless_family__T2_LEGAL_IDENTITY`
- `lossless_family__T3_OPERATOR_ENTITY`
- `lossless_family__T4_SUPPORTING_IDENTITY`
- `legal_signal_derivation_profile`

The validator must reject Target Profile Review use of:

- `legal_cartography_index`
- `m7_deterministic_legal_signal_overlay`
- any artifact whose name starts with `lossless_family__L`
- `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families`
- raw legal/governance source text
- legal/governance route buckets
- product/activity source families
- data-provenance source families

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

No forensic branch, profile metadata, evidence ledger, source ledger, confidence object, trace object, downstream object, legal-risk object, data object, registry object, final handoff, renderer payload, or Qualified Review object may appear inside `target_profile`.

## Activity Profile Review gate

Activity Profile Review may use only target-profile artifacts, feature candidate inventory, and product/activity families authorized by the backend phase contract.

Activity Profile Review may not use Target Profile Review to import legal/governance source material.

## Failure routing

Forbidden artifact use is `CONTROLLED_FAILURE`.

Unsupported but in-scope fields are controlled limitations, not legal-family repair requests.
