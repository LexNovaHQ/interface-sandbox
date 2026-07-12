# AGENT5_BACKEND_OUTPUT_CONTRACT_SYNCED_M11

## Final synchronized contract

This file governs the active Phase 10 runtime after CO-0 through CO-10. Older AI-only, fixed-98, eight-row, or pre-auto-selector language is retired.

## Three-layer ownership

### Layer 1 — deterministic backend

The backend owns:

- Phase 3 package selection and AI mount resolution;
- dynamic package-key and threat-registry loading;
- `active_threat_registry_manifest`;
- `registry_row_key = package_id::Threat_ID`;
- Phase 5 classification inventory projection;
- package-scoped primary and overlay route plans;
- package/stream/archetype-isolated batch planning;
- maximum 15 rows and packet-ceiling enforcement;
- deterministic registry spine and evidence packet formation.

The canonical registry `Threat_ID` is never rewritten. Raw Threat IDs may repeat across packages. Global reconciliation uses `registry_row_key`.

### Layer 2 — semantic model

Each call evaluates exactly one package, one stream, one archetype group, and one batch.

The model returns exactly one root:

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

The model must not emit `registry_row_key`, deterministic registry fields, routing changes, batch changes, final status, profiles, workpad, forensics, challenge output, compiler output, or report prose.

### Layer 3 — deterministic backend

The backend validates exact ledger coverage, performs at most one repair attempt, maps canonical Threat IDs back to compound execution identities, derives final status, saves accepted batches, merges the dynamic workpad, projects controlled/triggered profiles, and assembles forensics.

## Final status contract

Allowed final material statuses are:

```text
TRIGGERED
CONTROLLED_BY_VISIBLE_CONTROL
CONTROLLED_BY_EXCLUSION
CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION
```

Deterministic derivation order:

```text
1. CONTROLLED_BY_EXCLUSION
2. CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION
3. CONTROLLED_BY_VISIBLE_CONTROL
4. TRIGGERED
```

`NOT_TRIGGERED_NOT_APPLICABLE` is a route/workpad-only status, not a final material-profile status.

## Dynamic registry manifest

The first persisted Phase 10 artifact is `active_threat_registry_manifest`.

It records:

- selected primary package;
- AI mount status;
- mounted package and stream inventory;
- key and registry bindings;
- parsed and routable counts;
- status counts;
- UNI counts;
- compound identity inventory;
- canonical collision inventory;
- registry-set, Phase 5, and Phase 10 execution fingerprints.

Status policy remains:

```text
INCLUDE_ALL_DECLARED_ROWS
row_filter: NONE
Status: metadata only
```

No fixed registry count is permitted.

## Routing and batching

- UNI rows are always routed within every mounted registry.
- Non-UNI rows require matching archetype classification from the same Phase 5 package stream.
- Surface is context only.
- Primary and overlay streams remain separate through routing, batching, semantic evaluation, deterministic validation, and accepted-batch custody.
- Maximum batch rows: 15.
- Evidence and registry content must never be truncated to fill a batch.

## Accepted batch contract

Accepted batch schema:

```text
m11_batch_registry_ledger.v3.package_scoped.accepted
```

Each accepted row carries:

- `registry_row_key`;
- package and stream identity;
- canonical `Threat_ID`;
- deterministic registry spine;
- semantic evidence application;
- backend-derived final status;
- 19-field material projection.

## Material row contract

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

Package and stream custody fields may wrap the 19-field material projection but do not replace it.

## Dynamic workpad and profiles

The stable artifact token remains `exposure_registry_workpad_98`, but its row count is dynamic and must equal `active_threat_registry_manifest.expected_registry_row_key_count`.

`exposure_registry_controlled_profile` contains only the three controlled statuses.

`exposure_registry_triggered_profile` contains only `TRIGGERED` rows.

Global duplicate checks use `registry_row_key`, never raw `Threat_ID`.

## Forensics

`exposure_registry_profile_forensics` uses `M11_DOMAIN_AGNOSTIC_FORENSICS_v1` and must prove:

- manifest, route, batch, workpad, and profile reconciliation;
- package and stream isolation;
- compound identity custody;
- dynamic row counts;
- accepted batch and validation pairing;
- no fixed AI vocabulary or 98-row assumption.

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
9. M12 may begin
```

## Downstream boundary

M12 and the normalized compiler consume Phase 10 material outputs through Phase 2G derived-only routing. They must preserve `registry_row_key`, package ID, stream ID, stream type, canonical Threat ID, and final status. They must not reclassify, re-evaluate, merge duplicate raw Threat IDs, or use forensics as substantive challenge evidence.
