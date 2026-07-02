# MODULE VII — TARGET PROFILE

M7 is the target-profile phase for `agent_3_target_feature`.

M7 active inputs are limited to:

- `source_discovery_handoff`
- `source_discovery_handoff.bucket_family_index.target_profile_urls.families`
- `lossless_family__T0_ROOT`
- `lossless_family__T1_IDENTITY`
- `lossless_family__T2_LEGAL_IDENTITY`
- `lossless_family__T3_OPERATOR_ENTITY`
- `lossless_family__T4_SUPPORTING_IDENTITY`
- `m7_deterministic_legal_signal_overlay`
- the selected `TP.*` rows from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`

M7 must not use any artifact whose name starts with `lossless_family__L`.

M7 must not use `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families`.

M7 must not use raw `legal_cartography_index` as model evidence. Any M9-derived support must come only through `m7_deterministic_legal_signal_overlay`.

`legal_cartography_index` is not an active M7 model input.

The overlay may affect only these fields when the overlay status is `FOUND`:

- `target_identity.legal_entity_name`
- `jurisdiction_notice.governing_law`
- `jurisdiction_notice.courts_venue`

M7 must return strict JSON with exactly one top-level key: `target_profile`.

`target_profile` must contain exactly these parent branches:

- `target_identity`
- `jurisdiction_notice`
- `business_context`
- `product_service_wrapper`
- `target_profile_limitations`

The exact field schema is governed by `m7-validator.js`. No extra top-level keys, forensic branches, source ledgers, runtime traces, downstream profiles, exposure artifacts, challenge gates, final handoffs, or renderer payloads are allowed.

Unsupported fields must use a controlled status and must be explained in `target_profile_limitations[]`.
