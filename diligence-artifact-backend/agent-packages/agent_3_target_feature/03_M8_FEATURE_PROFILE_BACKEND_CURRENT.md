# M8 Activity Profile Review — Behavior Class Canonical Contract

runtime_contract_version: `m8_phase5_behavior_class_canonical_v9`

## Boundary

This prompt governs only `M8_TARGET_FEATURE_PROFILE` and emits exactly:

```text
target_feature_profile
```

`feature_candidate_inventory` is the only candidate universe. Do not rebuild it, discover new sources, emit forensics, or perform legal, data, exposure, challenge, compiler or report work.

Lossless evidence is used only through the Phase-2G-routed Activity Profile packet and the mandatory `activity_profile_source_index` navigation map.

## Taxonomy authority

The backend injects `resolved_activity_taxonomy` from mounted `*_Registry_Key.yml` files.

Canonical taxonomy axes are:

```text
behavior_class
surface
```

Do not use or emit retired Phase 5 material names.

Primary classification resolves only against the mounted primary package key. Each capability overlay resolves only against its own mounted overlay key. Regulatory overlays never receive activity classification blocks.

## Output envelope

Return strict JSON with exactly one root:

```text
target_feature_profile
```

That object contains exactly:

```text
activities
commercial_availability_posture
profile_level_limitations
mounted_taxonomy_ref
```

The backend stamps `mounted_taxonomy_ref`; do not author or alter it.

## Activity row

Each `activities[]` entry contains exactly:

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

The first eight fields are non-empty, business-readable strings grounded in the supplied evidence packet.

## Primary classification

`primary_classification` contains exactly:

```text
package_id
behavior_class_codes
behavior_class_derivation_basis
surface_context_tokens
surface_derivation_basis
```

- `package_id` equals the mounted primary package.
- Behavior Class values come only from that package's `behavior_class` vocabulary.
- Surface values come only from that package's `surface` vocabulary.
- Every selected code/token has exactly one matching derivation-basis entry.
- No basis entry exists for an unselected value.
- Do not force a catch-all.

When the primary package has no key, emit empty arrays and add:

```text
PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:<package_id>
```

When the key resolves but no Behavior Class legitimately matches, emit empty arrays and add:

```text
NO_PRIMARY_BEHAVIOR_CLASS_MATCH:<activity_reference>
```

## Capability overlay classifications

`overlay_classifications` is an array with exactly one block for each resolved mounted capability overlay.

Each block contains exactly:

```text
package_id
overlay_id
behavior_class_codes
behavior_class_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Primary and overlay Behavior Class and Surface values are independent and may differ. Never collapse them.

Unresolved capability overlays produce no block and use:

```text
OVERLAY_HAS_NO_TAXONOMY_KEY:<overlay_id>
```

Regulatory overlays produce no block.

## Derivation basis

Each Behavior Class and Surface basis entry contains exactly:

```text
code_or_token
normalized_name
conditions_satisfied
trigger_if_applied
exclude_if_checked
material_basis
limitation
```

`conditions_satisfied` is an array. `normalized_name` must come from the mounted package key. Do not invent display names.

## Commercial availability

`commercial_availability_posture` contains exactly:

```text
posture
free_trial_freemium_signal
beta_pilot_early_access_signal
paid_production_enterprise_plan_signal
evidence_basis
limitation
```

## Forbidden output

Do not emit URLs, source IDs, pointers, confidence, validation/lock status, runtime traces, ledgers, copied source text, or any retired Phase 5 classification path.

Return JSON only.
