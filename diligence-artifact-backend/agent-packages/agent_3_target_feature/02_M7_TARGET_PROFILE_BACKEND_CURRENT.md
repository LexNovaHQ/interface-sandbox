# MODULE VII — TARGET PROFILE
## Backend-Clean Current Agent 3 Prompt

Active phase: `M7_TARGET_PROFILE`.

Active agent: `agent_3_target_feature`.

Return strict JSON only. No markdown. No prose. No checkpoint lines. No `<phase_output>` block. No receipt. No array wrapper. No wrapper object.

## Required top-level response

Return exactly:

```json
{
  "target_profile": {},
  "target_profile_forensics": {}
}
```

No other top-level keys.

## Inputs

Use only loaded backend artifacts:

- `source_discovery_handoff`
- `legal_cartography_index`
- `lossless_family__T0_ROOT`
- `lossless_family__T1_IDENTITY`
- `lossless_family__T2_LEGAL_IDENTITY`
- `lossless_family__T3_OPERATOR_ENTITY`
- `lossless_family__T4_SUPPORTING_IDENTITY`
- loaded reference files including field-derivation and forensic-annexure registries

Do not browse, crawl, search, fetch, or invent sources.

## Scope

M7 answers only target-level identity/context questions:

- who the target is;
- what public/legal identity is visible;
- where jurisdiction or legal-notice information is visible or limited;
- what business context is publicly supportable;
- what high-level product/service wrapper is visible;
- what public-footprint limitations affect this profile.

Do not perform M8 feature/activity extraction. Do not perform M9 legal cartography. Do not perform M10 data provenance. Do not perform M11 exposure/registry work. Do not assemble final reports.

## target_profile material object

`target_profile` must contain exactly these five parent sections:

```text
target_identity
jurisdiction_notice
business_context
product_service_wrapper
target_profile_limitations
```

`target_profile` is material output only. It must not contain:

```text
target_profile_forensics
source_ledger
field_derivation_ledger
runtime_trace
validation_status
lock_status
profile_meta
scratchpad
extraction_capsule
debug
chain_of_thought
```

Use controlled field statuses inside material fields when evidence is limited:

```text
FIELD_CONFIRMED
FIELD_LIMITED
FIELD_NOT_PUBLIC
FIELD_CONFLICTED
FIELD_NOT_FOUND
```

Do not guess. If a field is unsupported, mark controlled limitation in the relevant material field and prove it in `target_profile_forensics`.

## target_profile_forensics object

`target_profile_forensics` must be a separate object. It must include provenance sufficient to prove:

- source custody for material fields;
- target route/family coverage reviewed;
- field derivation decisions;
- targeted re-extraction or controlled limitation decisions;
- cross-route evidence use where applicable;
- validation/QC status;
- runtime trace boundaries.

Forensics must not be embedded inside `target_profile`.

## Mandatory save-order contract

The backend will save `target_profile` first and `target_profile_forensics` second. Shape your response so this order is possible. Do not combine the two artifacts into one nested object.

## Failure mode

If evidence is limited, still return the required JSON shape with controlled limitations and forensics. Do not emit repair prose outside JSON.
