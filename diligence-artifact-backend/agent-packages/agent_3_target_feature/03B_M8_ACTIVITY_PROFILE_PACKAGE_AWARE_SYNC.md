# 03B — M8 Activity Profile Package-Aware Sync

## 1. Purpose

This file synchronizes Activity Profile Review material output with the mounted package taxonomy supplied by the backend runtime.

It applies only to `M8_TARGET_FEATURE_PROFILE`.

Layer 1 candidate inventory is already complete before this material profile begins. The material model must not rebuild or re-emit the candidate inventory.

## 2. Runtime packet

The material profile receives only the Phase-2G-routed 2C packet and backend-injected taxonomy context.

Required context:

```text
phase_route_runtime_packet
activity_profile_source_index
feature_candidate_inventory
target_profile
domain_derivation_profile
active_run_package_manifest
resolved_activity_taxonomy
activity_taxonomy_runtime_context
usable routed lossless_root__* evidence roots only
```

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

The packet may also include domain-declared activity evidence roots from the mounted key's `activity_evidence_roots`, but only when Phase 2G routed them and the `activity_profile_source_index` maps them. Resolver-declared roots never expand reads.

## 3. Layer 1 boundary

`feature_candidate_inventory` is the candidate universe.

Layer 1 used `activity_profile_source_index` as the navigation map to open index-mapped `lossless_root__*` units as primary evidence and enumerate evidence-backed candidates deterministically.

Layer 1 still copies no evidence text and applies no package taxonomy.

Layer 2 must consume the inventory. It must not create a competing candidate universe.

## 4. Taxonomy authority

Taxonomy authority is never a hardcoded registry key.

Activity archetype and surface derivation authority equals:

```text
mounted primary package key + mounted capability-overlay keys
selected by active_run_package_manifest
resolved from references/registry/*_Registry_Key.yml
through resolveActivityTaxonomy
using behavior_class and surface axes
```

The AI key is one key among many and is never universal Phase-5 authority.

Explicit `AI_Registry_Key.yml` and `FinTech_Registry_Key.yml` prompt references are forbidden in Phase 5 material instructions. Adding a domain must require only a valid new registry key and no prompt edit.

Regulatory overlays are excluded from activity archetype and surface classification. They are obligation-level context for later phases.

## 5. Material profile rule

For each activity row:

- derive `primary_classification` from the mounted primary package vocabulary;
- add one `overlay_classifications[]` block per mounted capability overlay that resolves to a registry key;
- do not add an overlay block for unresolved overlays;
- never add a block for regulatory overlays;
- keep identical code strings package-scoped by `package_id` and `overlay_id`;
- if the primary package has no resolved taxonomy key, emit empty arrays in `primary_classification` and add `PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:<package_id>` to `profile_level_limitations`;
- if a primary key resolves but no archetype legitimately matches an activity, emit empty primary arrays and add `NO_PRIMARY_ARCHETYPE_MATCH:<activity_reference>` to `profile_level_limitations`;
- never force a catch-all archetype.

## 6. Target feature profile top-level schema

The top-level `target_feature_profile` object contains exactly:

```text
activities
commercial_availability_posture
profile_level_limitations
mounted_taxonomy_ref
```

The model may not invent, modify, or override `mounted_taxonomy_ref`. The backend stamps it.

## 7. Activity row schema

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

The first eight fields are non-empty domain-blind strings.

## 8. Primary classification block

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
- `archetype_codes[]` values come only from that package's `behavior_class`.
- `surface_context_tokens[]` values come only from that package's `surface`.
- each selected archetype code has exactly one matching derivation-basis entry;
- each selected surface token has exactly one matching derivation-basis entry;
- no basis entry may exist for an unselected code or token.

## 9. Overlay classification blocks

`overlay_classifications` is an array.

Each entry contains exactly:

```text
package_id
overlay_id
archetype_codes
archetype_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Rules:

- one block per resolved mounted capability overlay;
- no block for unresolved overlays;
- no block for regulatory overlays;
- values are package-scoped by `package_id` and `overlay_id`;
- membership and basis checks apply independently to each overlay block.

## 10. Derivation basis entry schema

Every `archetype_derivation_basis[]` and `surface_derivation_basis[]` entry contains exactly:

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

## 11. Commercial availability schema

`commercial_availability_posture` contains exactly:

```text
posture
free_trial_freemium_signal
beta_pilot_early_access_signal
paid_production_enterprise_plan_signal
evidence_basis
limitation
```

`evidence_basis` is an array of non-empty strings and must not contain source IDs, URLs, quotes, or copied evidence text.

## 12. Mounted taxonomy reference

`mounted_taxonomy_ref` contains exactly:

```text
primary_package_id
primary_key_version
overlays
```

Each `overlays[]` entry contains exactly:

```text
overlay_id
package_id
key_version
```

The backend stamps this object. The model must not change it.

## 13. Forbidden material-profile content

Forbidden anywhere in `target_feature_profile`:

```text
URLs
source_id
source_url
source_pointer
source_ref
candidate_id
confidence
validation_status
lock_status
*_ledger
runtime_trace
archetype_proof
surface_proof_and_routing_limits
excerpt
lossless_text
clean_text
raw text
```

Do not return source pointers, IDs, URLs, copied evidence, or forensic ledgers.
