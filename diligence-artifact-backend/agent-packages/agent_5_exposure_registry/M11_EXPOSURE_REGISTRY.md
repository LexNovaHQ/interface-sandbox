# MODULE XI — PACKAGE-SCOPED EXPOSURE REGISTRY

## Three-Layer M11 Contract

## LOCK

M11 remains batched and package-scoped.

The active model evaluates only one backend-selected batch containing one package, one stream, and one archetype group. It never receives or evaluates the full mounted union at once.

M11 uses three layers:

1. deterministic backend registry selection, classification inventory projection, route planning, batch planning, evidence packet formation, and registry spine prefill;
2. semantic model evidence application for the active package-scoped batch;
3. deterministic backend validation, final status, accepted-batch save, dynamic workpad merge, material projection, and forensics.

## EXECUTION IDENTITY

Global deterministic identity is:

```text
registry_row_key = <package_id>::<Threat_ID>
```

Canonical `Threat_ID` remains unchanged.

- The backend owns `registry_row_key`.
- The model reads canonical Threat IDs and returns canonical Threat IDs only.
- Raw Threat IDs may repeat across different package streams but cannot repeat inside one package-scoped batch.
- Silent renaming or namespacing of canonical Threat IDs is forbidden.

## LAYER 1 — DETERMINISTIC BACKEND

Backend owns:

```text
Phase 3 package and AI-mount resolution
selected registry loading and validation
active_threat_registry_manifest
compound execution identity
Phase 5 package-scoped classification inventory projection
separate primary and overlay route streams
UNI mandatory routing
non-UNI package-archetype routing
maximum-15 package-scoped batch plan
packet-size ceiling
legal-cartography navigation and evidence packet formation
registry spine prefill
checkpoint fingerprints
```

Phase 5 owns classification. Phase 10 projects classifications only and must not invent codes or move values between primary and overlay streams.

Surface is context only and cannot route a row.

## LAYER 2 — SEMANTIC MODEL

The model owns only active-batch evidence application:

```text
target_match
basis_proof
control_exclusion_evaluation
evidence_source_basis
applied_fp_mechanism
row_limitations
status_inputs
```

The model applies the exact parsed Hunter Trigger to admitted target, product, data, and governance evidence.

The model must not:

```text
select or mount registries
classify activities
route rows
choose streams
choose batch membership
change batch size
emit registry_row_key
rewrite registry spine fields
choose final material status
save artifacts
merge the workpad
project profiles
assemble forensics
perform M12 global challenge
compile or render
write report prose
```

Semantic packet contract:

```text
M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1
```

Semantic output contract:

```text
M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1
```

Repair contract:

```text
M11_PACKAGE_SCOPED_SEMANTIC_REPAIR_v1
```

## LAYER 3 — DETERMINISTIC BACKEND

Backend owns:

```text
structural and semantic validation
canonical Threat_ID to registry_row_key reconciliation
final material status derivation
full material row assembly
accepted batch save
dynamic mounted-registry workpad merge
controlled projection
triggered projection
forensic assembly
```

Allowed final material statuses:

```text
TRIGGERED
CONTROLLED_BY_VISIBLE_CONTROL
CONTROLLED_BY_EXCLUSION
CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION
```

## PACKAGE-SCOPED ROUTING

Route values:

```text
EVALUATION_ROUTED
NOT_TRIGGERED_NOT_APPLICABLE
```

Route reasons:

```text
UNI_ALWAYS_RUN
PACKAGE_ARCHETYPE_MATCH
PACKAGE_ARCHETYPE_NOT_ACTIVE
```

Rules:

- UNI rows always route within each mounted registry.
- Non-UNI rows route only when their archetype exists in the matching package and stream inventory.
- Primary and overlay streams remain separate.
- Different packages never share a batch.
- Surface-only routing is forbidden.

## BATCH CONTRACT

Each batch contains:

```text
one package_id
one stream_id
one stream_type
one archetype group
one to fifteen rows
```

Every batch carries both deterministic compound row keys and canonical Threat IDs. The model returns only canonical Threat IDs.

Fifteen is a maximum, not a fixed size. Packet-size limits may produce smaller batches. Evidence and registry text cannot be truncated to force fifteen rows.

## EVIDENCE DISCIPLINE

Lossless legal/governance evidence is primary evidence.

`legal_cartography_index` is the mandatory navigation map into that evidence. Recorded index-gap navigation inside the same routed primary evidence bucket is not fallback evidence.

M9 is not substantive proof by itself except for document presence, absence, custody, navigation, or limitation questions.

Phase 5 classification and route membership explain why a row entered the batch; they do not prove the Hunter Trigger.

Domain-control-obligation context is non-dispositive context only.

Where direct proof is absent, the model must carry evidence limitation and false-positive concern rather than invent a trigger, control, exclusion, jurisdiction, deployment context, or user flow.

## REGISTRY CANON

Each selected registry row remains authoritative for:

```text
Threat_ID
Threat_Name
Lane
Archetype
Surface
Authority_IN
Authority_EU
Authority_US
Velocity
Pain_Tier
Pain_Category
Pain_Depth
Status
Effective_Date
Legal_Pain
FP_Mechanism
FP_Impact
Lex_Nova_Fix
Hunter_Trigger
Provenance
FIELD21
FIELD22
FIELD23
```

Hunter Trigger plus the locked registry evaluation rules are the row-level derivation authority.

## MODEL ROW

The model returns exactly one semantic row per expected canonical Threat ID:

```text
Threat_ID
optional trigger_status
target_match
basis_proof
control_exclusion_evaluation
evidence_source_basis
applied_fp_mechanism
row_limitations
status_inputs
```

No extra rows. No grouped rows. No deterministic fields. No profile containers.

## FULL MATERIAL ROW

The backend assembles 19 fields:

```text
Threat_ID
Threat_Name
target_match
evaluation_status
basis_proof
control_exclusion_evaluation
evidence_source_basis
fp_mechanism
Archetype
Subcategory
Surface
authority_anchors
Pain_Tier
Pain_Depth
Pain_Category
Legal_Pain
remediation
review_route
row_limitations
```

## DYNAMIC COVERAGE

Workpad and forensic coverage reconcile against `active_threat_registry_manifest.expected_registry_row_key_count`.

The stable artifact token `exposure_registry_workpad_98` may remain for compatibility, but it does not impose a fixed row count.

LEP coverage remains a separate locked 22-row obligation.

## REPAIR

Repair the smallest affected semantic batch. A repair call must preserve package, stream, group, batch identity, and exact expected Threat ID coverage.

## CURRENT BUILD BOUNDARY

CO-7 makes the semantic package contract ready. The active runtime must still stop before the model call until CO-8 implements and validates the domain-agnostic Layer 2 runtime.