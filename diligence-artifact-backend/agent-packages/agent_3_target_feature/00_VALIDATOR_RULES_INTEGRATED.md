# 00_VALIDATOR_RULES_INTEGRATED

## Agent 3 validator kernel

This validator is bounded by the backend phase contract. It cannot expand read authority.

## Universal gates

- Validate exact active phase.
- Validate exact run_id.
- Validate phase-owned output only.
- Validate material artifacts are saved before forensic artifacts.
- Reject downstream artifacts, source-discovery artifacts, legal-cartography artifacts, data-provenance artifacts, exposure artifacts, challenge gates, final handoffs, and renderer payloads from Agent 3 outputs.
- Reject model memory, unsupported source claims, route labels copied as facts, and schema-shaped but unsupported values.

## M7 input gate

For `M7_TARGET_PROFILE`, allowed inputs are exactly:

- `source_discovery_handoff`
- `m7_deterministic_legal_signal_overlay`
- `lossless_family__T0_ROOT`
- `lossless_family__T1_IDENTITY`
- `lossless_family__T2_LEGAL_IDENTITY`
- `lossless_family__T3_OPERATOR_ENTITY`
- `lossless_family__T4_SUPPORTING_IDENTITY`
- selected `TP.*` authority rows

The M7 validator must reject M7 use of:

- `legal_cartography_index`
- any artifact whose name starts with `lossless_family__L`
- `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families`
- raw legal/governance source text
- legal/governance route buckets

M7 must not block merely because legal/governance lossless artifacts are unavailable. Missing overlay values must become controlled field statuses and limitation rows.

## M7 overlay gate

`m7_deterministic_legal_signal_overlay` may support only:

- `target_identity.legal_entity_name`
- `jurisdiction_notice.governing_law`
- `jurisdiction_notice.courts_venue`

If the relevant overlay row status is not `FOUND`, M7 must use a controlled field status and limitation.

## M7 material output gate

`target_profile` must contain exactly five parent sections:

- `target_identity`
- `jurisdiction_notice`
- `business_context`
- `product_service_wrapper`
- `target_profile_limitations`

No forensic branch, profile metadata, evidence ledger, source ledger, confidence object, trace object, downstream object, legal-risk object, data object, registry object, final handoff, or renderer payload may appear inside `target_profile`.

## M8 gate

M8 may use only target-profile artifacts, feature candidate inventory, and product/activity families authorized by the backend phase contract.

M8 may not use M7 to import legal/governance source material.

## Failure routing

Forbidden artifact use is `CONTROLLED_FAILURE`.

Unsupported but in-scope fields are controlled limitations, not legal-family repair requests.
