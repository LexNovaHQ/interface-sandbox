# Target Profile Review — Backend Prompt

Target Profile Review is the target-profile phase for `agent_3_target_feature`.

Compatibility note: this file name is retained because the current backend still references it. The governing phase name is **Target Profile Review**.

## Active inputs

Target Profile Review active inputs are limited to:

- `source_discovery_handoff`
- `source_discovery_handoff.bucket_family_index.target_profile_urls.families`
- `lossless_family__T0_ROOT`
- `lossless_family__T1_IDENTITY`
- `lossless_family__T2_LEGAL_IDENTITY`
- `lossless_family__T3_OPERATOR_ENTITY`
- `lossless_family__T4_SUPPORTING_IDENTITY`
- `legal_signal_derivation_profile`
- the selected `TP.*` rows from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`

Target Profile Review must not use any artifact whose name starts with `lossless_family__L`.

Target Profile Review must not use `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families`.

Target Profile Review must not use raw `legal_cartography_index` as model evidence.

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

Target Profile Review must treat each direct signal row as a bounded field signal, not as legal advice, not as legal sufficiency, and not as an instruction to inspect legal-family source text.

Allowed direct-signal statuses must be converted into Target Profile Review field behavior as follows:

```text
DERIVED -> use value with supporting limitation/evidence summary where the target schema permits.
DERIVED_WITH_LIMITATION -> use only with limitation in target_profile_limitations.
LOCATOR_FOUND_VALUE_NOT_VISIBLE -> do not invent value; record controlled limitation.
SOURCE_NOT_PUBLIC -> do not invent value; record controlled limitation.
SOURCE_CONFLICT -> do not choose a winner; record controlled conflict limitation.
NOT_APPLICABLE_CONTEXTUAL -> leave field controlled/not applicable where schema permits.
NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN -> do not invent value; record controlled limitation.
```

The direct legal signal profile may affect only these branches when supported by controlled field status and evidence:

- `target_identity`
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

The exact field schema is governed by the active target-profile validator. No extra top-level keys, forensic branches, source ledgers, runtime traces, downstream profiles, exposure artifacts, challenge gates, final handoffs, or renderer payloads are allowed.

Unsupported fields must use a controlled status and must be explained in `target_profile_limitations[]`.
