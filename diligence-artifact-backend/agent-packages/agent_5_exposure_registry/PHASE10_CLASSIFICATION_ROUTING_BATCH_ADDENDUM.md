# Phase 10 Classification Inventory, Package Routing and Batch Planner Addendum

## Authority and scope

This addendum governs Phase 10 deterministic Layer 1B after the registry auto-selector has mounted the active registry set.

- Phase 5 owns activity classification.
- Phase 10 projects Phase 5 classifications into package-scoped routing inventories.
- Phase 10 must not reclassify activities, invent archetype codes, or move a classification between primary and overlay packages.
- The semantic model has no authority over classification inventory, route decisions, stream membership, batch membership, or packet sizing.

## Phase 5 source contract

Phase 10 reads only the current nested Phase 5 structure:

```text
target_feature_profile.activities[]
  primary_classification
    package_id
    archetype_codes[]
    surface_context_tokens[]

  overlay_classifications[]
    overlay_id
    package_id
    archetype_codes[]
    surface_context_tokens[]
```

Flat activity-level classification paths are forbidden:

```text
activities[].archetype_codes
activities[].surface_context_tokens
```

## Package-scoped inventory projection

The backend creates one inventory for every mounted Phase 10 stream:

```text
PRIMARY::<primary_package>
OVERLAY::<overlay_package>
```

Each inventory preserves:

```text
stream_id
stream_type
package_id
activity_references[]
archetype_codes[]
surface_context_tokens[]
overlay_ids[]
classifications[]
inventory_digest
```

Primary inventory values come only from `primary_classification` for the selected primary package.

Overlay inventory values come only from matching `overlay_classifications[]` blocks for that mounted overlay package.

A global cross-package archetype union is forbidden.

## Registry routing

Each mounted registry is routed only against its matching package and stream inventory.

```text
Archetype == UNI
  -> EVALUATION_ROUTED
  -> UNI_ALWAYS_RUN

Non-UNI Archetype in matching package inventory
  -> EVALUATION_ROUTED
  -> PACKAGE_ARCHETYPE_MATCH

Non-UNI Archetype absent from matching package inventory
  -> NOT_TRIGGERED_NOT_APPLICABLE
  -> PACKAGE_ARCHETYPE_NOT_ACTIVE
```

Surface tokens remain context only. Surface-only routing is forbidden.

Every execution row carries deterministic custody metadata:

```text
registry_row_key
Threat_ID
package_id
source_domain
stream_type
stream_id
registry_order
stream_registry_order
route
route_reason
matched_activity_references[]
```

The canonical `Threat_ID` remains unchanged. Global reconciliation uses `registry_row_key` under `PHASE10_EXECUTION_IDENTITY_v2`.

## Primary and overlay isolation

Primary and overlay streams are independently routed and batched.

A batch may contain exactly one:

```text
package_id
stream_id
stream_type
Archetype batch group
```

Rows from different packages or different streams must never be combined to fill a batch.

## Batch ceiling

```text
MAX_M11_BATCH_ROWS = 15
MAX_M11_BATCH_PACKET_CHARS = 180000
packet_ceiling_version = M11_PACKET_CHARS_180000_v1
```

Fifteen is a maximum, not a required fixed size.

The deterministic planner greedily fills a package-scoped archetype batch while both conditions remain true:

```text
row_count <= 15
estimated_packet_chars <= 180000
```

The planner must split before either ceiling is exceeded. Evidence or registry content must not be truncated to force fifteen rows into one packet.

A single row exceeding the packet ceiling creates a controlled failure. It must not be silently truncated.

Every batch records:

```text
batch_id
stream_id
stream_type
package_id
source_domain
batch_group
expected_registry_row_keys[]
expected_threat_ids[]
row_count
max_rows
max_packet_chars
estimated_packet_chars
classification_inventory_digest
activity_references[]
```

Raw `Threat_ID` may repeat across different package streams. `registry_row_key` must remain globally unique and appear in exactly one batch.

## Current semantic safety gate

CO-4, CO-5 and CO-6 authorize deterministic inventory projection, route planning and batch planning only.

After saving a valid `exposure_registry_route_plan`, the active runtime must controlled-stop before any model call until:

```text
CO-7 Agent 5 semantic package and prompt contract
CO-8 domain-agnostic Layer 2 runtime
```

The old AI-only semantic package must not receive the new package-scoped or 15-row batches.
