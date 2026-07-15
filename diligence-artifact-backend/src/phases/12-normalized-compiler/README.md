# Phase 12 — Normalized Compiler

## Governing authority

`PHASE12_REPORT_PROJECTION_AUTHORITY.md` is the governing Phase 12 doctrine.

**Upstream phases decide. Phase 12 arranges.**

Phase 12 is deterministic. It must not use a semantic model or repeat upstream analysis.

## Current transitional state

The existing compiler still uses its current Phase 2G-based loading path. CO-P12-01 does not remove that loader.

The later Phase 12 rebuild must atomically:

1. install direct reads of the frozen canonical material-profile allowlist; and
2. remove `phase_routing_manifest`, `phase_route_runtime_packet` and every Phase 2G bucket/packet dependency from Phase 12.

Phase 12 must never read Phase 2G and direct profile artifacts simultaneously.

Marker:

```text
PHASE12_DIRECT_PROFILE_ARTIFACTS_NO_PHASE2G
```

This marker locks the future boundary; it does not claim the current runtime cutover is complete.

## Exact Phase 11 admission

The compiler reads only the final `challenge_gate` from Phase 11.

Accepted statuses are exactly:

```text
PASS
PASS_WITH_LIMITATION
```

Admission also requires:

```text
schema_version = challenge_gate.v4.operator_challenge
compiler_handoff_allowed = true
layer_status.layer_3 = COMPLETE
reinvestigation_dispatch_required != true
final_gate_fingerprint is non-empty
```

`LOCKED`, `LOCKED_WITH_LIMITATIONS`, `REINVESTIGATION_REQUIRED`, `CONTROLLED_FAILURE`, runtime lock aliases and Phase 11 internal ledgers are not accepted.

A `PASS_WITH_LIMITATION` gate must carry its warning projection in the final gate. Phase 12 may project those warnings but may not inspect separate Phase 11 semantic, reinvestigation, dispatch, checkpoint or forensic artifacts.

## Phase 10 custody

The transitional compatibility layer admits only Phase 10 material profiles that preserve:

- `phase10_report_row.v1.complete_registry_spine`;
- compound `registry_row_key` identity;
- complete deterministic registry facts;
- mandatory Pain Tier, Pain Category and Pain Depth custody;
- final Phase 10 status and semantic evidence application without mutation.

## Public terminology

Client-facing output uses `Sector`, `Primary Sector`, `Sector Classification Profile`, `Capability Overlays`, `Regulatory Context Overlays` and `Sector-Specific Control Obligations`.

Internal artifact and backend field names remain unchanged.