# TERMINAL RECEIPT RULES — PHASE 2B DOMAIN & ACTIVITY SOURCE INDEX

## Strict response mode

During backend execution, return strict JSON only.

Do not emit markdown, prose, explanation, analysis, report copy, comments, code fences outside the expected backend response, or same-chat next-phase instructions.

## Save order

Phase 2B has exactly three material save events, in this order:

```text
1. domain_activity_deterministic_map
2. domain_activity_semantic_profile
3. activity_profile_source_index
```

The final downstream required artifact is:

```text
activity_profile_source_index
```

## Deterministic save event

For deterministic save, the top-level root must be exactly:

```json
{
  "domain_activity_deterministic_map": {}
}
```

Do not include `activity_profile_source_index` in the deterministic save event.

## Semantic save event

For semantic save, the top-level root must be exactly:

```json
{
  "domain_activity_semantic_profile": {}
}
```

Do not include deterministic or final index roots in the semantic save event.

## Final index save event

For final index save, the top-level root must be exactly:

```json
{
  "activity_profile_source_index": {}
}
```

Do not include `domain_derivation_profile`, `active_run_package_manifest`, or any downstream profile root.

## Terminal scope

After `activity_profile_source_index` validates and saves, Phase 2B is complete.

Do not continue to:

```text
P3_DOMAIN_DERIVATION_LAYER
M7_TARGET_PROFILE
M8_FEATURE_CANDIDATE_INVENTORY
M8_TARGET_FEATURE_PROFILE
DATA_PROVENANCE_PROFILE
M11
M12
NORMALIZED_COMPILER
QUALIFIED_REVIEW
```

## Forbidden combined shape

Never return a combined shape like:

```json
{
  "domain_activity_deterministic_map": {},
  "domain_activity_semantic_profile": {},
  "activity_profile_source_index": {},
  "domain_derivation_profile": {},
  "active_run_package_manifest": {}
}
```

Each save event must have one top-level root only.

## Final receipt

The only valid terminal receipt is that the backend has saved, in order:

```text
domain_activity_deterministic_map
domain_activity_semantic_profile
activity_profile_source_index
```

No profile derivation, domain lock, package mount, report, renderer payload, or Qualified Review payload may be included in the Phase 2B terminal receipt.
