# Pass 1 Baseline Audit — Phase 1 to Phase 6

Branch: `phase1-8-central-runtime-integration`
Base branch: `runtime-central-tree-pass1`
Scope: Baseline only. No runtime behavior patched in this pass.

## Pass 0 Result

A new recovery branch was created from `runtime-central-tree-pass1`:

```txt
phase1-8-central-runtime-integration
```

Freeze rule for this branch:

```txt
No root-helper deletion yet.
No old DAP archive yet.
No Phase 7/8 integration yet.
No post-Phase-8 rebuild.
```

## Executive Verdict

`runtime-central-tree-pass1` contains a real central-runtime build for Phase 1 through Phase 6, but it is not yet fully pure phase-owned implementation.

Baseline state:

```txt
Phase 1 — Source Discovery: connected and phase-owned.
Phase 2 — Legal Cartography and Index: connected; hybrid M9 runner wraps root M9 orchestrator; legal signal derivation is phase-owned.
Phase 3 — Target Profile Review: connected through phase runner; validator still root bridge.
Phase 4 — Target Profile Forensics: connected through phase runner; deterministic builder still root bridge.
Phase 5 — Activity Profile Review: connected through phase runners; M8 inventory/validator helpers still root bridge.
Phase 6 — Activity Profile Forensics: phase runner exists, but central dispatcher still uses generic root deterministic forensics path instead of the phase runner.
```

## Central Phase Contract Baseline

`src/runtime/contracts/central-phase.contract.js` declares the first six central phases:

```txt
1 SOURCE_DISCOVERY
2 LEGAL_CARTOGRAPHY_INDEX
3 TARGET_PROFILE_REVIEW
4 TARGET_PROFILE_FORENSICS
5 ACTIVITY_PROFILE_REVIEW
6 ACTIVITY_PROFILE_FORENSICS
```

with internal jobs:

```txt
AGENT_1A_URL_MANIFEST
AGENT_1B_EXTRACT
M6_BUCKET_INDEX
M9
M7_TARGET_PROFILE
M7_TARGET_PROFILE_FORENSICS
M8_FEATURE_CANDIDATE_INVENTORY
M8_TARGET_FEATURE_PROFILE
M8_TARGET_FEATURE_PROFILE_FORENSICS
```

Phase 7 and Phase 8 are still old DAP on this baseline:

```txt
M10
M10_FORENSICS
AGENT_4B_EXTENDED_DAP_INDIA_READINESS
AGENT_4C_INTEGRATED_DAP_REPORT
```

This is intentional baseline state. Phase 7/8 cutover happens later.

## Pipeline Contract Baseline

`src/runtime/contracts/pipeline.contract.js` contains a coherent Phase 1 to Phase 6 chain:

```txt
AGENT_1A_URL_MANIFEST
→ AGENT_1B_EXTRACT
→ M6_BUCKET_INDEX
→ M9
→ M7_TARGET_PROFILE
→ M7_TARGET_PROFILE_FORENSICS
→ M8_FEATURE_CANDIDATE_INVENTORY
→ M8_TARGET_FEATURE_PROFILE
→ M8_TARGET_FEATURE_PROFILE_FORENSICS
→ M10
```

Model-agent package integration exists for:

```txt
M9 → agent-packages/agent_2b_m9/*
M7/M8 → agent-packages/agent_3_target_feature/*
```

## Runtime Dispatcher Baseline

`src/runtime/services/pipeline.service.js` imports and dispatches:

```txt
Source Discovery phase runner
Target Profile Review phase runner
Target Profile Forensics phase runner
Activity Candidate Inventory phase runner
Activity Profile Review phase runner
M9 root hybrid orchestrator
M11/M12/compiler/report bridges
old M10/4B/4C DAP chain
```

The dispatcher does not yet import or call:

```txt
src/phases/06-activity-profile-forensics/activity-profile-forensics.runner.js
```

Instead, `M8_TARGET_FEATURE_PROFILE_FORENSICS` is routed through the generic root deterministic forensics path.

## Phase 1 — Source Discovery

Status: PASS with metadata cleanup needed.

Evidence baseline:

```txt
src/phases/01-source-discovery/source-discovery.runner.js
src/phases/01-source-discovery/source-discovery.contract.js
jobs/url-manifest.job.js
jobs/source-extraction.job.js
jobs/source-family-handoff.job.js
```

Phase-owned runner executes:

```txt
URL_MANIFEST
SOURCE_EXTRACTION
SOURCE_FAMILY_HANDOFF
```

Runtime dispatch exists.

Metadata issue:

```txt
production_entrypoint_switched remains false in Source Discovery runner/contract metadata even though runtime dispatcher imports it.
```

## Phase 2 — Legal Cartography and Index

Status: FUNCTIONALLY BUILT AND CONNECTED; structural cleanup remains.

Contract and agent package integration are present:

```txt
central_phase_id: LEGAL_CARTOGRAPHY_INDEX
internal job: M9
agent_id: agent_2b_m9
prompt files: agent-packages/agent_2b_m9/*
```

M9 writes:

```txt
legal_cartography_deterministic_map
legal_cartography_semantic_profile
legal_cartography_index
legal_signal_derivation_profile
```

The Phase 2 folder contains:

```txt
legal-cartography-index.runner.js
legal-cartography-index.contract.js
jobs/legal-signal-derivation.job.js
services/legal-signal-derivation.service.js
validators/legal-signal-derivation.validator.js
```

Legal signal derivation is phase-owned and validator-locked.

Structural bridge still present:

```txt
legal-cartography-index.runner.js wraps ../../m9-hybrid-orchestrator.js
m9-hybrid-orchestrator.js imports root M9 deterministic/semantic/compiler helpers
```

This is acceptable as baseline but must be internalized later.

## Phase 3 — Target Profile Review

Status: CONNECTED; root validator bridge remains.

Phase runner exists:

```txt
src/phases/03-target-profile-review/target-profile-review.runner.js
```

Central runtime dispatcher imports and dispatches it.

Agent package integration exists through `agent_3_target_feature` prompt files in pipeline contract.

Bridge:

```txt
runner imports ../../m7-validator.js
```

This is acceptable as baseline but must be internalized later.

## Phase 4 — Target Profile Forensics

Status: CONNECTED; root deterministic forensic helper bridge remains.

Phase runner exists:

```txt
src/phases/04-target-profile-forensics/target-profile-forensics.runner.js
```

Central runtime dispatcher imports and dispatches it.

Bridge:

```txt
runner imports ../../deterministic-profile-forensics.js
```

This is acceptable as baseline but must be internalized later.

## Phase 5 — Activity Profile Review

Status: CONNECTED; root M8 helper bridges remain.

Phase runners exist:

```txt
src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js
src/phases/05-activity-profile-review/activity-profile-review.runner.js
```

Central runtime dispatcher imports and dispatches both.

Agent package integration exists through `agent_3_target_feature` prompt files in pipeline contract.

Bridges:

```txt
activity-candidate-inventory.runner.js imports ../../m8-feature-candidate-inventory-index.js
activity-profile-review.runner.js imports ../../m8-validator.js
```

This is acceptable as baseline but must be internalized later.

## Phase 6 — Activity Profile Forensics

Status: INCOMPLETE CUTOVER.

Phase runner exists:

```txt
src/phases/06-activity-profile-forensics/activity-profile-forensics.runner.js
```

Runner contract shape is present and validates reads/writes.

But central dispatcher does not import or call this runner. It currently routes `M8_TARGET_FEATURE_PROFILE_FORENSICS` through generic root deterministic forensics.

Required Pass 2 action:

```txt
Patch pipeline.service.js so M8_TARGET_FEATURE_PROFILE_FORENSICS calls src/phases/06-activity-profile-forensics/activity-profile-forensics.runner.js.
```

## Do Not Archive Yet

The following root helpers are still temporary bridges for built phases and must not be deleted until phase-owned replacements are internalized:

```txt
m9-*.js
m7-validator.js
m8-*.js
deterministic-profile-forensics.js
```

Old DAP/M10/4B/4C files are still active on this baseline. They must not be removed until the Phase 7/8 replacement chain is wired and validated.

## Pass 1 Lock

Pass 1 establishes this branch as the recovery base. Next pass is only:

```txt
Pass 2 — Fix Phase 6 dispatcher cutover.
```

No Phase 7/8 integration should happen before Pass 2 is completed.
