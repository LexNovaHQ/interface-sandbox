# 00_M11_RUNTIME_CONTROLLER

## ROLE

This file is the mechanical controller for Phase 10 / M11 package-scoped execution. It sits below the Phase 2G runtime controller and does not override global evidence, no-simulation, or no-legal-advice rules.

## CONTROLLER VERSION

```text
M11_PACKAGE_SCOPED_RUNTIME_CONTROLLER_v1
```

## BLOCKING RULE

Only structural, identity, routing, schema, source-integrity, or unusable-output failures block.

Thin public evidence, unavailable public materials, registry metadata gaps, and unresolved non-structural uncertainty must be carried as limitations unless they prevent a structurally usable semantic ledger.

## CHECKPOINT FINGERPRINT RULE

Every Phase 10 checkpoint after `active_threat_registry_manifest` must match the current:

```text
phase10_execution_identity_version
registry_set_fingerprint
phase5_classification_fingerprint
phase5_classification_inventory_digest
phase10_execution_fingerprint
mounted_packages[]
```

Missing or mismatched execution identity means the checkpoint is stale and must not be reused.

## CHECKPOINT ORDER

After the CO-8 runtime cutover:

```text
1. active_threat_registry_manifest
2. exposure_registry_route_plan
3. for each package-scoped batch:
   a. construct M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1
   b. call semantic evaluation
   c. structurally validate M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1
   d. perform one targeted repair when required
   e. save exposure_registry_batch_validation__{batch_id}
   f. save exposure_registry_batch__{batch_id}
4. merge exposure_registry_workpad_98 dynamically
5. project exposure_registry_controlled_profile
6. project exposure_registry_triggered_profile
7. assemble exposure_registry_profile_forensics
```

The stable workpad artifact name does not impose a fixed 98-row count.

## PACKAGE AND STREAM SEPARATION

Each model call receives exactly one:

```text
package_id
stream_id
stream_type
batch_group
```

A model call must never mix:

- different packages;
- primary and overlay streams;
- different archetype groups;
- rows outside the deterministic batch plan.

Each batch contains at most 15 rows and must remain within the deterministic packet ceiling.

## MODEL PHASE

The model receives only the active package-scoped packet and returns only:

```text
m11_batch_registry_ledger
```

The model returns canonical `Threat_ID` values only. It must not emit `registry_row_key`.

The backend owns compound-key reconciliation, deterministic spine assembly, final status, validation, save state, workpad merge, projections, and forensics.

## EVIDENCE ACCESS

The model receives only the evidence admitted and assembled for the active batch.

Lossless legal/governance evidence is primary evidence. Legal cartography is the mandatory navigation map into it. Recorded index-gap navigation inside the same routed primary evidence bucket is not fallback evidence.

The model must not scan outside the packet or treat route membership, package classification, registry status, or domain-control-obligation context as substantive proof.

## REPAIR

One repair pass is allowed for the same immutable batch.

Repair must return the complete ledger for all expected canonical Threat IDs. It may change only identified semantic fields and cannot alter package, stream, group, batch, route, or classification identity.

## ARTIFACT FIREWALL

The model must not emit:

```text
active_threat_registry_manifest
exposure_registry_route_plan
exposure_registry_batch_validation
exposure_registry_workpad_98
exposure_registry_controlled_profile
exposure_registry_triggered_profile
exposure_registry_profile_forensics
challenge_gate
compiler output
renderer output
report prose
```

## CURRENT BUILD STATUS

```text
CO_7_AGENT5_SEMANTIC_PACKAGE: READY
CO_8_DOMAIN_AGNOSTIC_LAYER2_RUNTIME: PENDING
CURRENT_RUNTIME_MODEL_CALL_ALLOWED: false
```

Until CO-8 is complete, the runtime must stop after saving the valid package-scoped route and batch plan.