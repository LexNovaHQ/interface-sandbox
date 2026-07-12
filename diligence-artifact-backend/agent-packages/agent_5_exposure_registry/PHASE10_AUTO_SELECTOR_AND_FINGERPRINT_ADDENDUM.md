# Phase 10 Auto-Selector and Execution Fingerprint Addendum

## Precedence

This addendum supersedes older Agent 5 language stating `CURRENT_SINGLE_REGISTRY_PRE_AUTO_SELECTOR`, `PENDING_CO_2`, or treating the AI registry as the only selectable Phase 10 registry. `PHASE10_CLASSIFICATION_ROUTING_BATCH_ADDENDUM.md` governs Phase 5 inventory projection, stream routing and batch planning.

## Authority

This addendum governs the deterministic Phase 10 registry mount and checkpoint-custody boundary.

- `domain_derivation_profile` is the registry-selection authority.
- `active_run_package_manifest` is a consistency check only.
- `THREAT_REGISTRY_BINDINGS_v1.yaml` is the sole executable package-to-registry binding authority.
- Package registry keys remain taxonomy/vocabulary authorities and must not contain executable file bindings.

## Deterministic mount rules

The backend reads:

```text
domain_derivation_profile.primary_domain_derivation.selected_package
domain_derivation_profile.primary_domain_derivation.status
domain_derivation_profile.ai_mount_derivation.ai_package_mount
```

The primary status must be `LOCKED`.

- AI primary: mount `ai-governance` once as `PRIMARY`.
- Non-AI primary + `AI_OVERLAY_MOUNTED`: mount the primary package as `PRIMARY` and `ai-governance` as `OVERLAY`.
- `AI_CANDIDATE_ONLY` and `AI_NOT_VISIBLE`: do not mount AI.
- The semantic model must never select, mount, replace, or merge registries.

## Identity contract

```text
version: PHASE10_EXECUTION_IDENTITY_v2
global identity: registry_row_key
format: <package_id>::<Threat_ID>
```

The canonical registry `Threat_ID` remains unchanged. Cross-package reuse of a canonical `Threat_ID` is recorded in the manifest and resolved through `registry_row_key`. Silent mutation or ad hoc namespacing of canonical registry rows is forbidden.

The model returns the canonical `Threat_ID` only inside a future package-scoped batch. `registry_row_key` is deterministic custody metadata and must not be invented or rewritten by the model.

## Fingerprint contract

The backend emits:

```text
registry_set_fingerprint
phase5_classification_fingerprint
phase10_execution_fingerprint
```

The active execution fingerprint includes the package-scoped classification-inventory digest, routing-rules version, maximum batch rows, and packet-ceiling version.

Every Phase 10 checkpoint after `active_threat_registry_manifest` must carry the current `phase10_execution_fingerprint`. A checkpoint with a missing or different fingerprint is stale and must not be reused.

Covered checkpoints include:

```text
exposure_registry_route_plan
exposure_registry_batch_validation__{STREAM}__{GROUP}__{NNN}
exposure_registry_batch__{STREAM}__{GROUP}__{NNN}
exposure_registry_workpad_98
exposure_registry_controlled_profile
exposure_registry_triggered_profile
exposure_registry_profile_forensics
```

## Current staged runtime boundary

CO-4, CO-5 and CO-6 are active:

```text
Phase 5 package-scoped classification inventory projection
separate primary and overlay route streams
maximum-15 package-scoped batch planning
180000-character deterministic packet ceiling
```

The runtime now saves a valid package-scoped `exposure_registry_route_plan` for AI-primary, non-AI-primary, and primary-plus-AI-overlay mounts.

The semantic stage remains blocked until CO-7 and CO-8 update Agent 5 and the model runtime. The old AI-only semantic contract must not receive the new route streams or batches.
