# Agent 5 / Phase 10 Backend Output Contract

contract_version: `PHASE10_COMPLETE_REPORT_ROW_v1`

## Three-layer ownership

### Layer 1 — deterministic backend

The backend owns:

- mounted package-key and threat-registry loading;
- registry completeness and severity validation;
- `registry_row_key = package_id::Threat_ID`;
- package-scoped primary and overlay Behavior Class routing;
- package, stream and Behavior Class isolated batches;
- maximum 15 rows and packet-ceiling enforcement;
- complete deterministic registry spine insertion before every model call.

Raw `Threat_ID` may repeat across packages. Global identity is always `registry_row_key`.

### Layer 2 — semantic model

Each call evaluates exactly one package, one stream, one Behavior Class group and one batch.

The model returns exactly:

```text
m11_batch_registry_ledger
```

The model may emit only:

```text
Threat_ID
trigger_status
target_match
basis_proof
control_exclusion_evaluation
evidence_source_basis
applied_fp_mechanism
row_limitations
status_inputs
```

The model must not emit or rewrite registry facts, execution custody, routing, batch identity, final status, workpad, profiles, forensics, challenge output, compiler output or report prose.

### Layer 3 — deterministic backend

The backend validates exact semantic coverage, performs at most one repair attempt, maps canonical Threat IDs back to compound execution identities, derives final status, merges semantic evidence onto the original registry spine, saves accepted batches, builds the workpad, projects controlled/triggered profiles and assembles forensics.

## Complete deterministic registry spine

Every batch row contains:

```text
Threat_ID
Threat_Name
Lane
Behavior_Class
Surface
Subcategory
Compliance_Framework
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

Physical threat registries may still expose `Archetype`; ingestion may read `Behavior_Class || Archetype || FIELD21`. Canonical downstream output is only `Behavior_Class`.

`Compliance_Framework` is preserved only when physically declared. It is never inferred from authority prose.

## Mandatory registry preflight

Every mounted row must have all mandatory registry facts and at least one authority anchor.

Severity is mandatory:

```text
Pain_Tier
Pain_Category
Pain_Depth
```

The backend validates:

- Pain Tier is an allowed mounted-key value;
- Pain Category exactly matches that tier;
- Pain Depth is an allowed mounted-key value;
- no blank fallback;
- no model inference.

Any severity defect is a registry substrate failure and blocks Phase 10 preflight.

## Execution custody

Every accepted and material row preserves:

```text
registry_row_key
package_id
source_domain
stream_id
stream_type
batch_id
matched_activity_references
route_reason
registry_order
registry_key_version
threat_registry_version
```

## Final material statuses

Allowed statuses are:

```text
TRIGGERED
CONTROLLED_BY_VISIBLE_CONTROL
CONTROLLED_BY_EXCLUSION
CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION
```

`NOT_TRIGGERED_NOT_APPLICABLE` is workpad-only.

## Accepted batch

Schema:

```text
m11_batch_registry_ledger.v4.complete_registry_spine.accepted
```

Each accepted row contains:

```text
deterministic_registry_spine
semantic_evidence_application
final_material_status
material_projection
```

The material projection retains the complete registry spine plus approved semantic evidence fields and backend-derived status. It must never collapse back to the retired subset.

## Workpad and profiles

- `exposure_registry_workpad_98` remains a stable artifact token with dynamic row count.
- `exposure_registry_controlled_profile` contains only controlled statuses.
- `exposure_registry_triggered_profile` contains only `TRIGGERED` rows.
- Both material profiles preserve compound identity, execution custody and the complete report row.

## Save order

```text
1. active_threat_registry_manifest
2. exposure_registry_route_plan
3. each batch validation
4. each accepted batch
5. exposure_registry_workpad_98
6. exposure_registry_controlled_profile
7. exposure_registry_triggered_profile
8. exposure_registry_profile_forensics
9. Phase 11 may begin
```

## Downstream boundary

Phase 11 and Phase 12 must preserve Phase 10 identities and values. They must not reclassify, re-evaluate, deduplicate by raw Threat ID, alter severity, create replacement exposure IDs or use forensics as substantive evidence.

The current compiler loader remains transitional. The rebuilt Phase 12 will read canonical material profile artifacts directly under `PHASE12_REPORT_PROJECTION_AUTHORITY.md`; Phase 2G removal occurs atomically with that later loader cutover.
