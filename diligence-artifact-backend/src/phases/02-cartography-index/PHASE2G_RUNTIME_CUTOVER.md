# Phase 2G Runtime Cutover — Final Architecture

## Status

```text
routing_authority: P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY
runtime_cutover_status: RUNTIME_CUTOVER_COMPLETE_THROUGH_NORMALIZED_COMPILER
```

Phase 2G is the only routing authority for downstream profile, forensic, challenge, and compiler jobs.

No downstream job may create its own route map, widen its read corpus, directly load its central contract read array, or treat raw lossless evidence as a fallback.

## Six buckets

### 2A — Target Profile

Primary profile job:

```text
M7_TARGET_PROFILE
```

Derived-only downstream job:

```text
M7_TARGET_PROFILE_FORENSICS
```

Required navigation authority:

```text
target_profile_source_index
```

### 2B — Domain Derivation

Primary profile job:

```text
P3_DOMAIN_DERIVATION_LAYER
```

Required navigation authority:

```text
domain_derivation_source_index
```

### 2C — Activity Profile

Primary jobs:

```text
M8_FEATURE_CANDIDATE_INVENTORY
M8_TARGET_FEATURE_PROFILE
```

Derived-only downstream job:

```text
M8_TARGET_FEATURE_PROFILE_FORENSICS
```

Required navigation authority:

```text
activity_profile_source_index
```

### 2D — Data and Privacy

Primary profile job:

```text
DATA_PROVENANCE_PROFILE_LAYER4
```

Route-neutral internal gate:

```text
DATA_PROVENANCE_PROFILE_LAYER5
```

Derived-only downstream job:

```text
DATA_PROVENANCE_PROFILE_FORENSICS
```

Required navigation authority:

```text
data_privacy_navigation_index
```

### 2E — Domain Control Obligation

Reserved parent job:

```text
DOMAIN_CONTROL_OBLIGATION_PROFILE
```

Required navigation authority:

```text
domain_control_obligation_navigation_index
```

The active pipeline does not yet execute the reserved parent job. The route is declared without deriving obligation posture in Phase 2.

### 2F — Legal Cartography and Legal Signals

Primary profile job and forward route owner:

```text
M11
```

Derived-only downstream jobs:

```text
M12
NORMALIZED_COMPILER
```

Required navigation and signal authorities:

```text
legal_cartography_index
legal_signal_derivation_profile
```

M9 builds the 2F indexes and signals. M9 is not the downstream route owner. The route points forward to Phase 9 / M11.

## Packet modes

### SOURCE_BUCKET_PROFILE

Used only by profile jobs that must inspect primary evidence.

The packet contains:

1. the route’s required index or indexes;
2. the route’s primary lossless evidence bucket;
3. admitted legal documents when the route permits them;
4. explicitly allowed preceding material profiles;
5. explicitly allowed runtime context.

Rules:

- lossless evidence is primary evidence;
- index navigation is mandatory;
- direct lossless evidence is not a fallback;
- sparse lossless-root shard resolution belongs to Phase 2G;
- dynamic legal-document expansion belongs to Phase 2G;
- no forensic profile is admitted as an input.

### DERIVED_ONLY

Used by forensic, challenge, and compiler jobs that must not receive a source bucket.

The packet contains only the job-scoped derived artifacts declared in the 2G route contract.

Rules:

- no lossless root is delivered;
- no legal document is delivered;
- no primary source bucket is delivered;
- the route’s general runtime context is not inherited;
- no forensic profile is admitted as an upstream input;
- M12 and the compiler receive dynamic M11 batch and validation artifacts through Phase 2G.

## Routed jobs

```text
M7_TARGET_PROFILE
P3_DOMAIN_DERIVATION_LAYER
M7_TARGET_PROFILE_FORENSICS
M8_FEATURE_CANDIDATE_INVENTORY
M8_TARGET_FEATURE_PROFILE
M8_TARGET_FEATURE_PROFILE_FORENSICS
DATA_PROVENANCE_PROFILE_LAYER4
DATA_PROVENANCE_PROFILE_FORENSICS
M11
M12
NORMALIZED_COMPILER
```

`DATA_PROVENANCE_PROFILE_LAYER5` is intentionally route-neutral because it validates and compiles already-saved Phase 7 outputs and does not read a source bucket.

## Forensic boundary

The following artifacts remain valid audit outputs:

```text
target_profile_forensics
target_feature_profile_forensics
dap_forensics_profile
exposure_registry_profile_forensics
```

They are not prerequisites for later profile derivation, M11, M12, the compiler, renderer, Qualified Review, or submission.

Forensic stages receive derived-only packets containing the material artifacts required to build their audit trace. A forensic artifact must never be used to derive a later material profile.

## Central contract boundary

For every routed job, the central pipeline contract exposes only:

```text
phase_routing_manifest
```

The route-scoped runtime reader resolves the actual job packet. This prevents central contracts, phase runners, agent packages, and actor-level permission unions from becoming competing routing authorities.

## Permission boundary

Actor-level read permissions are the minimum union needed to execute the routed jobs belonging to that actor.

Read permissions do not authorize a job to widen its packet. The active route packet remains the execution-time authority.

No later profile, challenge, compiler, renderer, or review actor has read permission for preceding forensic profiles.

## Save-order boundary

Material progression does not depend on forensic completion.

The active material chain is:

```text
target_profile
domain_derivation_profile
feature_candidate_inventory
target_feature_profile
Phase 7 DAP material artifacts
M11 material artifacts
challenge_gate
normalized compiler artifacts
```

Forensic artifacts are auditable side outputs. They may depend on their corresponding material profile, but later material stages do not depend on them.

## Dynamic ownership

Phase 2G owns:

- sparse lossless-root resolution;
- dynamic legal-document expansion from `legal_doc_inventory`;
- dynamic M11 batch and validation loading from `exposure_registry_route_plan`;
- exact packet delivery and undeclared-artifact rejection.

No other runtime component may implement an alternative source or profile routing map.

## Validation

The aggregate structural checks include:

```text
check-phase2g-phase-router.mjs
check-phase2g-runtime-cutover-through-compiler.mjs
check-phase2g-no-competing-routing-authority.mjs
```

These checks enforce:

- six buckets only;
- forward 2F ownership by M11;
- source-bucket versus derived-only packet separation;
- no central shadow read arrays;
- no competing route resolver;
- no forensic input propagation;
- no forbidden lossless fallback framing;
- cutover completion through the normalized compiler.
