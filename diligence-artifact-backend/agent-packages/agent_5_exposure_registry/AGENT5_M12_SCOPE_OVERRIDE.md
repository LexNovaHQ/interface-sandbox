# AGENT5_M12_SCOPE_OVERRIDE

This file overrides older Agent 5 package language that described Agent 5 as M11-only.

## Active Agent 5 scopes

Agent 5 now owns these backend scopes:

```text
M11_EXPOSURE_REGISTRY
M12_BATCH_VALIDATION
M12_GLOBAL_CHALLENGE
```

## Module boundary

M11 owns:

```text
exposure_registry_route_plan
m11_batch_registry_ledger
exposure_registry_batch__{GROUP}__{NNN}
exposure_registry_workpad_98
exposure_registry_controlled_profile
exposure_registry_triggered_profile
exposure_registry_profile_forensics
```

M12 batch owns:

```text
exposure_registry_batch_validation
```

The backend persists M12 batch output as:

```text
exposure_registry_batch_validation__{GROUP}__{NNN}
```

M12 global owns:

```text
challenge_gate
```

## Root rule

M11 must not emit `challenge_gate`.
M12 batch must not emit `challenge_gate`.
M12 global may emit only `challenge_gate`.

## Phase order

```text
M11 route plan
M11 batch evaluation
M12 batch validation
accepted batch save
workpad merge
controlled projection
triggered projection
M11 forensics
M12 global challenge_gate
```

Backend may advance to compiler only after `challenge_gate.lock_status` is `PASS` or `PASS_WITH_LIMITATION`.
