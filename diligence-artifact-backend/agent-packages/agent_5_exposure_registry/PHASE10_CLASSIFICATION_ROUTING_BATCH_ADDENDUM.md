# Phase 10 Classification Inventory, Package Routing and Batch Planner Addendum

## Authority and scope

This addendum governs deterministic Phase 10 Layer 1B.

- Phase 5 owns activity classification.
- Phase 10 projects Phase 5 classifications into package-scoped routing inventories.
- Phase 10 must not reclassify activities, invent archetype codes, or move a classification between primary and overlay packages.
- The semantic model has no authority over classification inventory, route decisions, stream membership, batch membership, or packet sizing.

## Phase 5 source contract

Phase 10 reads only:

```text
target_feature_profile.activities[].primary_classification
target_feature_profile.activities[].overlay_classifications[]
```

Flat activity-level classification paths are forbidden.

Every mounted primary or overlay stream must have a matching non-empty Phase 5 classification inventory. Missing mounted-stream classification is a controlled failure.

## Package-scoped inventory

The backend creates one inventory for each mounted stream:

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

Primary values come only from matching `primary_classification` blocks. Overlay values come only from matching `overlay_classifications[]` blocks. A global cross-package archetype union is forbidden.

## Registry routing

Each registry is routed only against its matching package and stream inventory.

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

Every route row carries deterministic custody:

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

Canonical `Threat_ID` remains unchanged. Global reconciliation uses `registry_row_key` under `PHASE10_EXECUTION_IDENTITY_v2`.

## Stream isolation

Primary and overlay streams are independently routed and batched.

A batch contains exactly one:

```text
package_id
stream_id
stream_type
Archetype batch group
```

Rows from different packages, streams, or archetype groups must never be combined.

## Batch ceiling

```text
MAX_M11_BATCH_ROWS = 15
MAX_M11_BATCH_PACKET_CHARS = 180000
packet_ceiling_version = M11_PACKET_CHARS_180000_v1
```

Fifteen is a maximum, not a fixed size. The planner splits before either ceiling is exceeded. Evidence or registry content must not be truncated to force fifteen rows into one packet.

A single row over the packet ceiling creates a controlled failure.

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

Raw `Threat_ID` may repeat across package streams. `registry_row_key` remains globally unique and appears in exactly one batch.

## Semantic handoff

CO-7 defines the package-scoped semantic contracts:

```text
packet: M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1
output: M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1
repair: M11_PACKAGE_SCOPED_SEMANTIC_REPAIR_v1
```

The model returns canonical Threat IDs only. It must not emit `registry_row_key`, change routing, mix streams, or alter batch membership.

## Current runtime safety gate

CO-4 through CO-7 are contract-complete. The active runtime must continue to stop after saving the package-scoped route plan until CO-8 implements the domain-agnostic Layer 2 runtime.

The pre-CO-7 AI-only semantic path must remain unreachable.