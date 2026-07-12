# 00_TERMINAL_RECEIPT_RULES_INTEGRATED_AGENT5_SYNCED

## Ownership lock

Agent 5 owns Phase 10 only. It must never claim that it saved `challenge_gate`; that artifact belongs to Agent 7 / M12.

Terminal receipts are manual summaries. Runtime outputs remain strict JSON artifacts.

## Successful Phase 10 receipt

```text
PHASE LOCKED: M11_EXPOSURE_REGISTRY
Run ID: <run_id>
Runtime contract: v18_final_runtime_package_downstream_sync

Mounted packages:
- <package_id / stream_type>

Saved:
- active_threat_registry_manifest
- exposure_registry_route_plan
- exposure_registry_batch_validation__<permission-compatible suffix> for every evaluated batch
- exposure_registry_batch__<permission-compatible suffix> for every accepted batch
- exposure_registry_workpad_98
- exposure_registry_controlled_profile
- exposure_registry_triggered_profile
- exposure_registry_profile_forensics

Dynamic registry rows reconciled: <actual>/<expected>
Accepted batches: <actual>/<expected>

NEXT STEP:
Backend may advance to M12 Operator Challenge.
```

`exposure_registry_workpad_98` is a stable artifact token only. Never describe it as proof of a 98-row run.

## Locked with limitations receipt

Use the same receipt, replacing the first line with:

```text
PHASE LOCKED WITH LIMITATIONS: M11_EXPOSURE_REGISTRY
```

List only short limitations. Detailed evidence and custody traces remain in the saved artifacts.

## Repair required receipt

```text
PHASE REPAIR REQUIRED: M11_EXPOSURE_REGISTRY
Run ID: <run_id>

Repair owner:
<Agent 5 semantic batch / deterministic Layer 1 / deterministic Layer 3 / upstream owner>

Repair scope:
<manifest | route plan | package/stream batch | batch validation | accepted batch | workpad | controlled profile | triggered profile | forensics>

Compound identity:
<registry_row_key or batch_id>

Blocking reasons:
- <reason>

NEXT STEP:
Repair the smallest affected unit. Do not advance to M12.
```

## Controlled failure receipt

```text
PHASE CONTROLLED FAILURE: M11_EXPOSURE_REGISTRY
Run ID: <run_id_or_UNRESOLVED>
Failure class: <failure_class>
Blocking reasons:
- <reason>

No next-phase command is available because Phase 10 did not lock.
```

## Forbidden receipt content

Do not include:

- complete registry or batch ledgers;
- fixed 98-row claims;
- raw `Threat_ID` as global identity;
- legal advice or compliance/liability conclusions;
- risk-score verdicts;
- `challenge_gate` as an Agent 5 save;
- compiler, renderer, or final handoff output;
- retired combined exposure artifacts;
- rebuilt legal cartography.

## M12 boundary

M12 independently reads the locked Phase 10 derived outputs through Phase 2G, validates dynamic counts and compound identities, and saves `challenge_gate`. Agent 5 does not simulate or pre-announce the M12 result.
