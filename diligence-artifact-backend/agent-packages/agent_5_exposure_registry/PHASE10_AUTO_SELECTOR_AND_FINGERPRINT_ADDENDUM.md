# Phase 10 Auto-Selector and Execution Fingerprint Addendum

## Precedence

This addendum supersedes older Agent 5 language that treats the AI registry as the only selectable Phase 10 registry or treats registry selection as a model decision. `PHASE10_CLASSIFICATION_ROUTING_BATCH_ADDENDUM.md` governs Phase 5 inventory projection, stream routing, batching, and the semantic handoff.

## Authority

- `domain_derivation_profile` is the registry-selection authority.
- `active_run_package_manifest` is a consistency check only.
- `THREAT_REGISTRY_BINDINGS_v1.yaml` is the sole executable package-to-registry binding authority.
- Package registry keys remain taxonomy and vocabulary authorities and must not contain executable file bindings.

## Deterministic mount rules

The backend reads:

```text
domain_derivation_profile.primary_domain_derivation.selected_package
domain_derivation_profile.primary_domain_derivation.status
domain_derivation_profile.ai_mount_derivation.ai_package_mount
```

The primary status must be `LOCKED`.

- AI primary mounts `ai-governance` once as `PRIMARY`.
- Non-AI primary plus `AI_OVERLAY_MOUNTED` mounts the primary package as `PRIMARY` and `ai-governance` as `OVERLAY`.
- `AI_CANDIDATE_ONLY` and `AI_NOT_VISIBLE` do not mount AI.
- The semantic model must never select, mount, replace, or merge registries.

## Identity contract

```text
version: PHASE10_EXECUTION_IDENTITY_v2
global identity: registry_row_key
format: <package_id>::<Threat_ID>
```

Canonical registry `Threat_ID` remains unchanged. Cross-package reuse is recorded in the manifest and resolved through `registry_row_key`. Silent mutation or ad hoc namespacing is forbidden.

The model reads and returns canonical `Threat_ID` only. `registry_row_key` is deterministic custody metadata and must not be emitted or rewritten by the model.

## Fingerprint contract

The backend emits:

```text
registry_set_fingerprint
phase5_classification_fingerprint
phase5_classification_inventory_digest
phase10_execution_fingerprint
```

The active execution fingerprint includes mounted registries, compound identity, classification inventory, routing-rules version, maximum batch rows, and packet-ceiling version.

Every checkpoint after `active_threat_registry_manifest` must carry the current Phase 10 execution fingerprint. Missing or different fingerprints are stale and cannot be reused.

Covered checkpoints include:

```text
exposure_registry_route_plan
exposure_registry_batch_validation__{batch_id}
exposure_registry_batch__{batch_id}
exposure_registry_workpad_98
exposure_registry_controlled_profile
exposure_registry_triggered_profile
exposure_registry_profile_forensics
```

## Current staged boundary

CO-2 through CO-7 activate deterministic selection, registry loading, compound identity, fingerprinting, Phase 5 inventory projection, package-scoped route streams, maximum-15 batches, and the Agent 5 semantic package contract.

CO-8 remains required before any semantic model call. Until then, the runtime must save the current manifest and route plan, then controlled-stop.