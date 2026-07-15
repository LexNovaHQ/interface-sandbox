# Phase 10 — Exposure Profile

## Job

Phase 10 evaluates the mounted threat registries against the upstream target, activity, data, legal and sector-control profiles. It preserves registry facts deterministically and uses the semantic model only for target-evidence application.

## Identity

Global row identity is:

```text
registry_row_key = package_id::Threat_ID
```

Canonical `Threat_ID` is preserved. The same raw `Threat_ID` may exist in multiple mounted packages and must never be globally deduplicated.

## Phase 5 routing substrate

Phase 10 consumes the package-scoped Phase 5 classification inventory:

```text
behavior_class_codes
surface_context_tokens
```

Primary and overlay streams remain separate. UNI rows always run. Package-specific rows route through the matching package stream and Behavior Class.

## Complete deterministic registry spine

Every model packet receives a read-only deterministic registry spine containing:

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

Physical registries may expose `Archetype`; ingestion may read `Behavior_Class || Archetype || FIELD21`. Canonical material output contains `Behavior_Class` only.

`Compliance_Framework` is preserved only when physically declared. It is never inferred from authority prose.

## Severity custody

`Pain_Tier`, `Pain_Category` and `Pain_Depth` are mandatory registry substrate. They are validated against the mounted Registry Key before routing or batching.

Missing, invalid or mismatched severity values are controlled preflight failures. No blank fallback and no semantic inference are permitted.

## Semantic allowlist

The model may return only:

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

The backend rejects any model-emitted registry fact or custody field.

## Accepted-row shape

Each accepted batch row carries:

```text
deterministic_registry_spine
semantic_evidence_application
final_material_status
material_projection
```

The workpad and controlled/triggered profiles preserve the complete material projection and execution custody, including `registry_row_key`, package, stream and batch identity.

## Schemas

- Report row: `phase10_report_row.v1.complete_registry_spine`
- Route plan: `exposure_registry_route_plan.v4.behavior_class_package_scoped`
- Accepted batch: `m11_batch_registry_ledger.v4.complete_registry_spine.accepted`
- Workpad: `exposure_registry_workpad.v4.complete_registry_spine`
- Controlled profile: `exposure_registry_controlled_profile.v4.complete_report_row`
- Triggered profile: `exposure_registry_triggered_profile.v4.complete_report_row`

## Downstream boundary

Phase 11 and Phase 12 may validate, carry warnings and arrange report output. They must not reclassify rows, replace identities, alter severity, create new remediation or re-evaluate target matching.