# 03 — M8 Feature Profile Backend Current

runtime_contract_version: m8_phase5_agnostic_taxonomy_v8

## S1. Phase call card

This prompt governs `M8_TARGET_FEATURE_PROFILE`, the Activity Profile Review material output.

It consumes:

```text
feature_candidate_inventory
activity_profile_source_index
phase_route_runtime_packet
target_profile
domain_derivation_profile
active_run_package_manifest
resolved_activity_taxonomy
activity_taxonomy_runtime_context
usable routed lossless_root__* evidence roots only
```

It emits only:

```text
target_feature_profile
```

It must not emit `feature_candidate_inventory`, forensics, validation ledgers, source pointers, or runtime traces.

## S2. Phase-2G boundary

Phase 2G is the sole routing authority.

Lossless evidence is primary evidence. `activity_profile_source_index` is the mandatory navigation map into that evidence.

The model must use only the runtime packet supplied by the backend. It must not fetch or infer evidence roots outside the packet.

Base activity evidence roots are:

```text
lossless_root__product_service
lossless_root__platform_feature_solution
lossless_root__technical_docs_api
lossless_root__docs_api_data_flow
lossless_root__integrations_ecosystem
lossless_root__pricing_commercial_availability
lossless_root__use_case_customer_industry
lossless_root__support_help_resources
```

The packet may include additional domain-declared activity evidence roots from mounted Registry Keys, but only when Phase 2G routed them and the source index maps them. If a declared root is absent, the backend records `DECLARED_ACTIVITY_EVIDENCE_ROOT_NOT_ROUTED:<root>` and the model must not fetch it.

## S3. Candidate universe

`feature_candidate_inventory` is the only candidate universe.

Layer 1 used `activity_profile_source_index` as the navigation map to open index-mapped `lossless_root__*` units as primary evidence and enumerate evidence-backed candidates deterministically.

Layer 1 copies no evidence text and applies no package taxonomy.

Layer 2 must not create a new candidate universe or re-emit Layer 1 artifacts.

## S4. Taxonomy authority

Archetype and surface taxonomy authority equals only:

```text
mounted domain package key(s)
auto-discovered from references/registry/*_Registry_Key.yml
selected by active_run_package_manifest
resolved by resolveActivityTaxonomy
```

Use:

- the mounted primary package key for `primary_classification`;
- each mounted capability-overlay key that resolves for `overlay_classifications[]`.

Use only `behavior_class` and `surface` vocabulary supplied by `resolved_activity_taxonomy`.

The AI key is one possible key, not universal authority. Do not name any specific Registry Key file as the global Phase-5 taxonomy source.

Regulatory overlays are excluded from activity archetype and surface classification.

## S5. Output envelope

Return strict JSON with exactly one top-level key:

```text
target_feature_profile
```

The `target_feature_profile` object contains exactly:

```text
activities
commercial_availability_posture
profile_level_limitations
mounted_taxonomy_ref
```

The backend stamps `mounted_taxonomy_ref`; the model must not modify it.

## S6. Activity row schema

Each `target_feature_profile.activities[]` entry contains exactly ten keys:

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

The first eight values are non-empty domain-blind strings.

Do not include:

```text
archetype_proof
surface_proof_and_routing_limits
candidate_id
source_id
source_url
source_pointer
source_ref
confidence
runtime_trace
*_ledger
excerpt
lossless_text
clean_text
raw text
```

## S7. Primary classification

`primary_classification` contains exactly:

```text
package_id
archetype_codes
archetype_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Rules:

- `package_id` equals the mounted primary package ID.
- `archetype_codes[]` values are selected only from the primary package `behavior_class` vocabulary.
- `surface_context_tokens[]` values are selected only from the primary package `surface` vocabulary.
- each selected archetype code has exactly one `archetype_derivation_basis[]` entry with matching `code_or_token`;
- each selected surface token has exactly one `surface_derivation_basis[]` entry with matching `code_or_token`;
- no basis entry may exist for an unselected value.

If no primary taxonomy key resolves, emit empty arrays and ensure `profile_level_limitations[]` includes:

```text
PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:<package_id>
```

If a key resolves but no archetype legitimately matches an activity, emit empty arrays and ensure `profile_level_limitations[]` includes:

```text
NO_PRIMARY_ARCHETYPE_MATCH:<activity_reference>
```

Do not force a catch-all archetype.

## S8. Overlay classifications

`overlay_classifications` is an array.

Each resolved mounted capability overlay gets one block containing exactly:

```text
package_id
overlay_id
archetype_codes
archetype_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Rules:

- use only the overlay key's own `behavior_class` and `surface` vocabulary;
- keep codes package-scoped by `package_id` and `overlay_id`;
- identical code strings from different packages do not collide;
- unresolved overlays produce no block and a limitation `OVERLAY_HAS_NO_TAXONOMY_KEY:<overlay_id>`;
- regulatory overlays produce no block;
- per-block 1:1 basis rules apply exactly as in the primary block.

## S9. Derivation basis entry

Each derivation-basis entry contains exactly:

```text
code_or_token
normalized_name
conditions_satisfied
trigger_if_applied
exclude_if_checked
material_basis
limitation
```

`conditions_satisfied` must be a non-empty array of strings when a code or token is selected.

`material_basis` must be a business-readable explanation based on reviewed material, without quoting or copying source text.

## S10. Commercial availability

`commercial_availability_posture` contains exactly:

```text
posture
free_trial_freemium_signal
beta_pilot_early_access_signal
paid_production_enterprise_plan_signal
evidence_basis
limitation
```

`evidence_basis` is an array of non-empty strings without source IDs, URLs, quotes, or copied evidence text.

## S11. Mounted taxonomy reference

`mounted_taxonomy_ref` contains exactly:

```text
primary_package_id
primary_key_version
overlays
```

Each overlay reference contains exactly:

```text
overlay_id
package_id
key_version
```

The backend stamps this object. The model must not override it. If it is visible in the prompt context, copy no alternate version into the output except the backend-stamped object.

## S12. Profile limitations

Use `profile_level_limitations[]` for controlled degradation only, including:

```text
PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:<package_id>
OVERLAY_HAS_NO_TAXONOMY_KEY:<overlay_id>
NO_PRIMARY_ARCHETYPE_MATCH:<activity_reference>
DECLARED_ACTIVITY_EVIDENCE_ROOT_NOT_ROUTED:<root>
```

Do not turn a limitation into a fake classification.

## S13. Final response rule

Return only valid JSON. No markdown. No commentary. No forensic sections. No source ledgers.
