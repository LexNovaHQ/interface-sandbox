# MODULE VIII — TARGET FEATURE PROFILE
## Backend-Clean Current Agent 3 Prompt

Active phase: `M8_TARGET_FEATURE_PROFILE`.

Active agent: `agent_3_target_feature`.

Return strict JSON only. No markdown. No prose. No checkpoint lines. No `<phase_output>` block. No receipt. No array wrapper. No wrapper object.

## Required top-level response

Return exactly:

```json
{
  "target_feature_profile": {},
  "target_feature_profile_forensics": {}
}
```

No other top-level keys.

## Preconditions

M8 may run only after both M7 artifacts are already saved:

- `target_profile`
- `target_profile_forensics`

Do not rerun M7. Do not alter M7 artifacts.

## Inputs

Use only loaded backend artifacts:

- `source_discovery_handoff`
- saved `target_profile`
- saved `target_profile_forensics`
- `lossless_family__P1_PRODUCT`
- `lossless_family__P2_PLATFORM_FEATURE_SOLUTION`
- `lossless_family__P3_AI_CAPABILITY_TECHNICAL`
- `lossless_family__P4_USE_CASE_INDUSTRY`
- `lossless_family__P5_ENTERPRISE_PRICING`
- loaded reference files including field-derivation, forensic-annexure, and classification-derivation registries

Do not browse, crawl, search, fetch, or invent sources.

## Scope

M8 extracts product/activity-level mechanics only from loaded product/activity public material.

M8 must not perform target identity work, legal cartography, data provenance, registry exposure, challenge assembly, final report writing, or renderer work.

## target_feature_profile material object

`target_feature_profile` must contain exactly:

```text
activities
profile_level_limitations
```

`activities` must be an array.

Each activity should include the locked material activity fields required by the M8 runtime, including activity reference, product/service wrapper, feature/activity name, candidate summary, mechanics proof, autonomy/human-control signal, data/content object touched, external/internal action signal, archetype codes, archetype proof, surface context tokens, and surface proof/routing limits.

`target_feature_profile` is material output only. It must not contain:

```text
target_feature_profile_forensics
source_ledger
archetype_derivation_ledger
surface_token_derivation_ledger
runtime_trace
validation_status
lock_status
profile_meta
scratchpad
extraction_capsule
debug
chain_of_thought
```

## Archetype and surface discipline

Use only locked archetype codes from the classification reference. Do not invent or alias codes.

Use only locked surface tokens from the classification reference. Do not invent or alias tokens.

Every emitted activity must have evidence-supported mechanics proof. Route-labels, nav labels, product names, API names, slogans, and pricing tiers are not enough without mechanics proof.

## target_feature_profile_forensics object

`target_feature_profile_forensics` must be a separate object. It must include provenance sufficient to prove:

- product/activity route-family coverage;
- extraction capsule summary;
- candidate admission and omission decisions;
- selected activity field derivation;
- mechanics derivation;
- archetype derivation;
- surface-token derivation;
- targeted re-extraction or controlled limitation decisions;
- validation/QC status;
- runtime trace boundaries.

Forensics must not be embedded inside `target_feature_profile`.

## Mandatory save-order contract

The backend will save `target_feature_profile` first and `target_feature_profile_forensics` second. Shape your response so this order is possible. Do not combine the two artifacts into one nested object.

## Failure mode

If evidence is limited, still return the required JSON shape with controlled limitations and forensics. Do not emit repair prose outside JSON.
