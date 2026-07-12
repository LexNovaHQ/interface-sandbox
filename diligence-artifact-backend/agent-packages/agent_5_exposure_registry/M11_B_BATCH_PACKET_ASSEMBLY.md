# M11_B_BATCH_PACKET_ASSEMBLY

## PURPOSE

Define the only package-scoped semantic packet that Agent 5 may receive for one M11 batch.

This is a backend assembly contract. The model does not build, resize, reroute, merge, truncate, or repair the packet.

## CONTRACT VERSION

```text
M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1
```

## IMMUTABLE BATCH IDENTITY

Every packet represents exactly one deterministic route stream and one archetype group.

The backend supplies:

```text
semantic_packet_contract_version
batch_id
batch_group
batch_number
stream_id
stream_type
package_id
source_domain
expected_registry_row_keys[]
expected_threat_ids[]
row_count
max_rows
max_packet_chars
estimated_packet_chars
classification_inventory_digest
activity_references[]
registry_rows[]
```

Required invariants:

- `semantic_packet_contract_version` is `M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1`.
- `row_count` equals the number of `registry_rows`, `expected_registry_row_keys`, and `expected_threat_ids`.
- `1 <= row_count <= 15`.
- Every `expected_registry_row_key` belongs to the packet `package_id`.
- Every registry row belongs to the packet `package_id`, `stream_id`, and `stream_type`.
- Primary and overlay rows never share a packet.
- Different packages never share a packet.
- Different archetype groups never share a packet.
- Canonical `Threat_ID` values are unique within the packet.
- `registry_row_key` is globally unique custody metadata in `<package_id>::<Threat_ID>` form.

The model may read `registry_row_key` but must never emit, alter, derive, namespace, or validate it. The backend maps returned canonical `Threat_ID` values back to the deterministic row keys.

## REGISTRY ROW CONTENT

Each `registry_rows[]` entry contains the selected registry row, parsed Hunter Trigger, deterministic spine, immutable route metadata, and evidence selections required for that row.

Backend-owned row material includes:

```text
registry_row_key
Threat_ID
Threat_Name
package_id
source_domain
stream_id
stream_type
Archetype
Subcategory
Surface
Hunter_Trigger
Hunter_Trigger_Parsed
route
route_reason
matched_activity_references[]
deterministic_registry_spine
m9_legal_cartography_selection
```

The model must not rewrite any of those values.

## EVIDENCE PACKET

The packet may include:

- target and product/activity evidence admitted by the Phase 2G route;
- Phase 5 activity references and package-scoped classifications as context only;
- Phase 7 data-provenance material admitted by the route;
- legal-signal material admitted by the route;
- M9 legal-cartography navigation rows;
- full primary legal/governance evidence units selected through those navigation rows;
- recorded index-gap navigation into the same routed primary evidence bucket where M9 is silent or thin;
- domain-control-obligation context as non-dispositive context only.

Lossless legal/governance evidence is primary evidence. The legal cartography is the mandatory navigation map into that evidence. Index-gap navigation inside the same routed evidence bucket is not fallback evidence.

Phase 5 classification, route reason, package selection, overlay selection, registry status, domain-control-obligation context, and legal-cartography metadata are not substantive proof by themselves.

## NO TRUNCATION RULE

The backend must split before the fifteen-row or packet-size ceiling is exceeded. It must never truncate registry rows, Hunter Trigger text, selected evidence, or deterministic metadata to force a larger batch.

A single row that cannot fit inside the packet ceiling is a controlled structural failure. The model must not receive a truncated substitute.

## MODEL ACCESS BOUNDARY

The model evaluates only the supplied packet. It must not:

- request or infer another package or stream;
- compare the active package with another mounted package;
- read rows outside `expected_threat_ids`;
- expand the evidence corpus;
- scan source material outside the routed packet;
- use primary-package evidence to satisfy an overlay row unless that evidence is explicitly supplied and row-relevant;
- use overlay classification to alter primary routing, or primary classification to alter overlay routing.

## HANDOFF

A structurally valid packet is passed to `M11_C_BATCH_EVALUATION.md`.

A repair call receives the same immutable packet under `M11_D_BATCH_REINVESTIGATION_REPAIR.md`.
