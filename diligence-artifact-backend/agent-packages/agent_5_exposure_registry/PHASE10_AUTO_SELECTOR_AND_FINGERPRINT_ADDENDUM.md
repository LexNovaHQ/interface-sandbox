# Phase 10 Auto-Selector and Execution Fingerprint Addendum

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

The model continues to return the canonical `Threat_ID` within one package-scoped batch. `registry_row_key` is deterministic custody metadata and must not be invented or rewritten by the model.

## Fingerprint contract

The backend emits:

```text
registry_set_fingerprint
phase5_classification_fingerprint
phase10_execution_fingerprint
```

Every Phase 10 checkpoint after `active_threat_registry_manifest` must carry the current `phase10_execution_fingerprint`. A checkpoint with a missing or different fingerprint is stale and must not be reused.

Covered checkpoints include:

```text
exposure_registry_route_plan
exposure_registry_batch_validation__{GROUP}__{NNN}
exposure_registry_batch__{GROUP}__{NNN}
exposure_registry_workpad_98
exposure_registry_controlled_profile
exposure_registry_triggered_profile
exposure_registry_profile_forensics
```

## Staged routing boundary

CO-2 and CO-3 activate deterministic selection, loading, identity, and checkpoint fingerprinting. Until the Phase 5 package-scoped inventory adapter and separate route streams are completed in CO-4 and CO-5, a non-AI-primary or multi-registry mount must controlled-fail after saving the active registry manifest rather than silently running the legacy AI-only route planner.
