# Phase 5 — Activity Profile Review

## Job

Phase 5 converts the Phase 2G-routed activity evidence packet and the locked `feature_candidate_inventory` into the material `target_feature_profile`.

It does not discover sources, create a second candidate universe, perform forensics, or make legal, data, exposure, challenge, compiler or report findings.

## Evidence boundary

- `activity_profile_source_index` is the mandatory navigation map.
- Routed `lossless_root__*` units are the primary evidence.
- `feature_candidate_inventory` is the sole candidate universe.
- Resolver-declared roots never expand the Phase 2G read ceiling.

## Canonical classification schema

Every activity retains separate package-scoped classification blocks:

```text
primary_classification
overlay_classifications[]
```

Primary block:

```text
package_id
behavior_class_codes
behavior_class_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Capability-overlay block:

```text
package_id
overlay_id
behavior_class_codes
behavior_class_derivation_basis
surface_context_tokens
surface_derivation_basis
```

The mounted Registry Keys are the taxonomy authority. The canonical axes are `behavior_class` and `surface`.

Primary and overlay Behavior Class and Surface values are independent and may differ. Regulatory overlays do not receive activity-classification blocks.

## Controlled limitations

```text
PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:<package_id>
NO_PRIMARY_BEHAVIOR_CLASS_MATCH:<activity_reference>
OVERLAY_HAS_NO_TAXONOMY_KEY:<overlay_id>
DECLARED_ACTIVITY_EVIDENCE_ROOT_NOT_ROUTED:<root>
DECLARED_ACTIVITY_EVIDENCE_ROOT_NOT_INDEXED:<root>
```

## Version

- Contract: `ACTIVITY_PROFILE_REVIEW_CONTRACT_v9_BEHAVIOR_CLASS_CANONICAL`
- Schema: `activity_profile_material.v9.behavior_class`
- Resolver: `activity_taxonomy_resolver.v2.behavior_class_canonical`

## Downstream ownership

Phase 5 owns activity mechanics, package-scoped Behavior Class/Surface classification and commercial-availability posture. Downstream phases must preserve these values and may not reclassify them.