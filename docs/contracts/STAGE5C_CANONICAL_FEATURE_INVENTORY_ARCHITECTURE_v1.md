# STAGE5C_CANONICAL_FEATURE_INVENTORY_ARCHITECTURE_v1

Status: Approved for Batch 4 build.

## Purpose

5C builds row-level canonical `feature_inventory[]` from the admitted 5A product functions and the controlled 5B archetype/surface tag package.

5C does not assemble the final `target_feature_profile`. 5E owns final profile integration.

## Locked formula

```text
5C = deterministic join + completeness audit + bounded model canonicalization repair + canonical feature inventory package.
```

## Inputs

- `stage5a_feature_package`
- `stage5a_product_function_mapping`
- `stage5b_tag_package`
- `stage5b_archetype_surface_tagging`
- source/lossless index refs from 5A
- validation outputs from 5A and 5B

## Outputs

5C emits only:

```text
stage5c_feature_inventory_package
```

The package includes:

- `feature_inventory[]`
- `feature_id_map[]`
- `feature_inventory_build_log[]`
- `canonicalization_repairs[]`
- `true_unknowns[]`
- `unresolved_feature_candidates_seed[]`
- `classification_quality_seed`
- `limitations[]`
- `handoff_integrity`

## Model boundary

The 5C model may repair only row-level canonical fields:

- `feature_name`
- `feature_role`
- `commercial_function`
- `business_label_or_product_area`
- `feature_description`
- `actor_or_user`
- `input_data[]`
- `system_action`
- `output_or_result`
- `delivery_channels`
- row-level rationale/limitations

The 5C model must not change:

- `feature_id`
- `autonomy_level`
- `human_review_signal`
- `external_action_signal`
- `archetype_codes[]`
- `archetype_labels[]`
- `archetype_provenance[]`
- `surface_tokens[]`
- `surface_provenance[]`
- `data_provenance[]`
- `feature_source_url`
- `evidence_refs[]`
- `linked_threat_ids[]`

## Unknown rule

A field becomes `UNKNOWN_NOT_EVIDENCED` only after deterministic join, source/index check, bounded repair attempt, and validator logging. Lazy unknowns are not allowed.

## Forbidden behavior

5C must not create features, delete 5A functions, reclassify 5B tags, assign registry threat IDs, make legal findings, extract 5D data provenance, or assemble final profile-level maps.
