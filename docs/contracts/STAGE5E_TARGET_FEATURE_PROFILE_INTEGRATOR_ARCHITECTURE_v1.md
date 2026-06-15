# STAGE5E TARGET FEATURE PROFILE INTEGRATOR ARCHITECTURE v1

## Status

Approved doctrine for Batch 6 / Stage 5E.

## Core Rule

5E replaces the old internal final Stage 5 builder but preserves the exact outbound handoff:

```js
return { companyProfile, targetFeatureProfile };
```

The final `targetFeatureProfile` is the existing canonical `feature_profile_v2` object. No wrapper, no new downstream structure, and no `stage5e_batch6` field inside the final profile.

## Inputs

5E consumes:
- Stage 5 adapter/source package,
- Stage 5A product-function mapping and feature package,
- Stage 5B tag package,
- Stage 5C feature inventory package,
- Stage 5D data touchpoint package,
- company profile / target profile reference,
- validation and limitation seeds.

## Output

5E returns only the final canonical target feature profile with the pre-existing schema fields:
- `feature_profile_version`
- `target_profile_ref`
- `feature_inventory`
- `product_feature_map`
- `data_provenance_map`
- `regulated_surface_map`
- `architecture_hints`
- `classification_quality`
- `unresolved_feature_candidates`
- `commercial_scan`
- `vault_feature_candidates`
- `evidence`
- `limitations`

## Boundary

5E is deterministic assembly. It does not create new features, reclassify archetypes, assign registry threat rows, perform Stage 6B review, or change the handoff contract.

## Replacement Rule

Live pipeline order becomes:

Stage 4 → Stage 5 adapter → 5A → 5B → 5C → 5D → 5E → `{ companyProfile, targetFeatureProfile }`

The previous final Stage 5 runner remains only as an explicit fallback path if 5E is disabled or configured non-blocking.
