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

For Target Profile Review, allowed inputs remain governed by `ROUTE.PHASE3A.TARGET_PROFILE`, the 2A bucket, `target_profile_source_index`, scoped target `lossless_root__*` evidence, and `legal_signal_derivation_profile` only.

`target_profile_source_index` is navigation only. Scoped target artifacts are the evidence source. `source_discovery_handoff`, `cartography_index`, `domain_selection_profile`, `active_run_package_manifest`, forensic artifacts, legal source text, data-provenance roots, and retired family artifacts are forbidden.

## Target Profile Review direct signal gate

`legal_signal_derivation_profile` may support only bounded legal notice and jurisdiction fields. Direct signal rows are bounded field signals, not legal advice, legal sufficiency, or permission to inspect legal source text.

## Target Profile Review material output gate

`target_profile` must contain exactly five parent sections:

- `target_identity`
- `jurisdiction_notice`
- `business_context`
- `product_service_wrapper`
- `target_profile_limitations`

`business_context` must not include `lane`. Regulatory/licensing and grievance fields must remain factual public operating-context signals only.

## Domain Derivation Layer input gate

For `P3_DOMAIN_DERIVATION_LAYER`, allowed inputs remain governed by `ROUTE.PHASE3B.DOMAIN_DERIVATION`, the 2B bucket, `domain_derivation_source_index`, `target_profile`, scoped domain-derivation `lossless_root__*` evidence, `domain_selection_profile`, and `active_run_package_manifest`.

`activity_profile_source_index` is reserved for 2C / Phase 5 and forbidden in 3B. Legal source text, data/privacy roots, exposure artifacts, compiler artifacts, and Qualified Review artifacts are forbidden.

## Domain Derivation Layer registry ladder gate

The Domain Derivation Layer prompt is domain-agnostic. The registry is the ladder. Mounted Registry Keys plus Field Derivation Registry grammar are rule authority, package catalog is package authority, scoped lossless artifacts are evidence authority, and deterministic validator/compiler is lock authority.

New supported domains, overlays, fusion candidates, and regulatory overlays must be added through registry/catalog updates, not prompt edits.

## Domain Derivation Layer regulatory overlay gate

`regulatory_overlay_derivation` is candidate-only. It must avoid legal applicability, license validity, license requirement, applicable-regulator conclusion, compliance-status, grievance sufficiency, ombudsman requirement, statutory-obligation, legal advice, compliance conclusion, and risk conclusion.

## Domain Derivation Layer output gate

The model response must contain exactly one top-level key: `domain_derivation_profile`. The model must not emit top-level `active_run_package_manifest`. The compiler writes `active_run_package_manifest` after validation.

## Activity Profile Review gate

Activity Profile Review must use its own backend phase contract. It may read `activity_profile_source_index` only when 2C / Phase 5 has made that artifact available.

Activity Profile Review must not use Domain Derivation Layer to backdoor legal/governance source material.

## Phase 5 Activity Profile Review material validator schema — agnostic v8

`M8_TARGET_FEATURE_PROFILE` must emit exactly one top-level object: `target_feature_profile`.

`target_feature_profile` contains exactly:

```text
activities
commercial_availability_posture
profile_level_limitations
mounted_taxonomy_ref
```

Each `activities[]` row contains exactly:

```text
activity_reference
product_service_wrapper
activity_feature_name
activity_candidate_summary
mechanics_proof
autonomy_human_control_signal
data_content_object_touched
external_internal_action_signal
primary_classification
overlay_classifications
```

`primary_classification` contains exactly:

```text
package_id
archetype_codes
archetype_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Each `overlay_classifications[]` entry contains exactly:

```text
package_id
overlay_id
archetype_codes
archetype_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Each derivation-basis entry contains exactly:

```text
code_or_token
normalized_name
conditions_satisfied
trigger_if_applied
exclude_if_checked
material_basis
limitation
```

Validation applies per block:

- package-scoped membership against that block's `package_id`;
- exactly one basis entry per selected archetype code;
- exactly one basis entry per selected surface token;
- no basis entry for an unselected code or token;
- no unresolved overlay block;
- no regulatory overlay block;
- no false catch-all archetype.

`mounted_taxonomy_ref` contains exactly:

```text
primary_package_id
primary_key_version
overlays
```

Each overlay reference contains exactly:

```text
overlay_id
package_id
key_version
```

Forbidden in the material profile: URLs, source IDs, source pointers, candidate IDs, confidence, validation status, lock status, ledgers, runtime traces, `archetype_proof`, `surface_proof_and_routing_limits`, excerpts, lossless text, clean text, and raw text.
