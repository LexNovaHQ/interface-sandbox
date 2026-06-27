# AGENT 5 PACKAGE PATCH SPEC

Patch these files under:

`diligence-artifact-backend/agent-packages/agent_5_exposure_registry/`

Do not modify M11 core text except where package boundary files need to mention M12 ownership.

## 1. AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml

Add M12 ownership without weakening M11 boundary:

- M11 owns registry route plan, batch evaluation, workpad, controlled profile, triggered profile, forensics.
- M12 batch validates each M11 batch before accepted batch save.
- M12 global emits `challenge_gate` after M11 forensics save.
- M11 may not emit `challenge_gate`.
- M12 global may emit `challenge_gate`.

Add write events:

```yaml
PHASE_B2_BATCH_VALIDATION_SAVE_EVENT:
  - exposure_registry_batch_validation__{GROUP}__{NNN}
M12_GLOBAL_CHALLENGE_SAVE_EVENT:
  - challenge_gate
```

## 2. BACKEND_CANONICAL_OUTPUT_ADAPTER.md

Keep M11 active boundary roots as-is. Add M12 allowed roots:

```text
M12 batch root: exposure_registry_batch_validation
M12 global root: challenge_gate
```

Clarify:

```text
M11 forbidden root: challenge_gate
M12 global allowed root: challenge_gate
```

## 3. AGENT5_BACKEND_OUTPUT_CONTRACT_SYNCED_M11.md

Add a new section after batch validation:

```text
M12 batch validation is Agent 5-owned. The backend persists the M12 semantic output under exposure_registry_batch_validation__{GROUP}__{NNN}. Accepted batch save is forbidden unless semantic M12 status is PASS or PASS_WITH_LIMITATION.
```

Add a global challenge section:

```text
After exposure_registry_profile_forensics is saved, M12 global emits challenge_gate. challenge_gate is the only M12 global backend artifact. Compiler may proceed only if challenge_gate.lock_status is PASS or PASS_WITH_LIMITATION.
```

## 4. 00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md

Add gates:

- Batch validation artifact must exist before accepted batch artifact.
- Batch validation status must be PASS or PASS_WITH_LIMITATION before accepted batch is saved.
- challenge_gate root must exist after M12 global.
- challenge_gate may not be emitted by M11.
- challenge_gate may only be emitted by M12 global.

## 5. 00_TERMINAL_RECEIPT_RULES_INTEGRATED_AGENT5_SYNCED.md

Update success receipt:

Saved artifacts should include:

- exposure_registry_route_plan
- exposure_registry_batch__{GROUP}__{NNN}
- exposure_registry_batch_validation__{GROUP}__{NNN}
- exposure_registry_workpad_98
- exposure_registry_controlled_profile
- exposure_registry_triggered_profile
- exposure_registry_profile_forensics
- challenge_gate

Next step:

```text
Backend may advance to COMPILER only after challenge_gate locks with PASS or PASS_WITH_LIMITATION.
```

## Hard boundary

Do not touch compiler or renderer in this patch.
