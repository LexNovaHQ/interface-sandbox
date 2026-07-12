# M8 Activity Profile — Package-Aware Behavior Class Sync

## Governing correction

The mounted Registry Keys define the activity taxonomy axis as `behavior_class`. Phase 5 material output therefore uses **Behavior Class** terminology and paths throughout.

## Runtime context

The model receives the Phase-2G-routed Activity Profile packet, including:

```text
activity_profile_source_index
feature_candidate_inventory
target_profile
domain_derivation_profile
active_run_package_manifest
resolved_activity_taxonomy
activity_taxonomy_runtime_context
usable routed lossless_root__* evidence
```

The candidate inventory is already complete. Do not create a second candidate universe.

## Taxonomy authority

Taxonomy authority is:

```text
mounted primary package key
+
mounted capability-overlay keys
```

resolved from `references/registry/*_Registry_Key.yml` by `resolveActivityTaxonomy`.

Use only:

```text
behavior_class_vocabulary
surface_axes
```

Regulatory overlays are excluded from activity classification.

## Exact material schema

Each activity contains its shared activity fields plus:

```text
primary_classification
overlay_classifications
```

Primary block:

```text
package_id
behavior_class_codes
behavior_class_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Each capability-overlay block:

```text
package_id
overlay_id
behavior_class_codes
behavior_class_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Primary and overlay blocks are independent. They may select different Behavior Classes and different Surfaces for the same activity.

Every selected code or token has exactly one matching basis entry. No unselected basis entry is allowed.

## Controlled empty-primary rules

Use empty primary arrays only when accompanied by one of:

```text
PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:<package_id>
NO_PRIMARY_BEHAVIOR_CLASS_MATCH:<activity_reference>
```

Do not force a catch-all classification.

## Derivation basis schema

Every basis entry contains exactly:

```text
code_or_token
normalized_name
conditions_satisfied
trigger_if_applied
exclude_if_checked
material_basis
limitation
```

`normalized_name` comes from the block's mounted Registry Key.

## Backend stamp

The backend alone stamps:

```text
mounted_taxonomy_ref
```

The model must not emit an alternate package/key reference.

## Forbidden

- collapsed primary/overlay classifications;
- regulatory-overlay activity blocks;
- a code from another package's vocabulary;
- invented normalized names;
- source pointers, URLs, copied evidence or forensic data;
- any retired Phase 5 classification path or limitation token.

Return the strict `target_feature_profile` JSON root only.
