# 00_TERMINAL_RECEIPT_RULES_INTEGRATED
## Agent 2 Sequential Terminal Receipt Rules

---

# TERMINAL LOCK

`TERM.RUNTIME.C1` This file governs Agent 2 phase receipts only for the target-feature agent packet.

`TERM.RUNTIME.C2` Agent 2 must not emit final reports, legal-risk prose, registry findings, privacy findings, renderer payloads, final handoff JSON, or audit dumps.

`TERM.RUNTIME.C3` Agent 2 must not emit the next-agent command until M7 and M8 have run separately, all four Agent 2 artifacts have been saved in order, and final Agent 2 validation passes.

---

# SECTION 1 — RECEIPT INPUT CONTRACT

`TERM.S1.C1` Terminal receipt generation requires:

```yaml
terminal_required_inputs:
  runtime_binding_packet: required
  resolved_agent_profile_row: required
  m7_validator_result: required
  m8_validator_result: required
  agent2_final_validator_result: required
  run_id: required
  saved_artifacts: required
  phase_lock_status: required
  next_agent_command: required only for successful Agent 2 sequence lock
```

`TERM.S1.C2` Terminal must never infer `run_id` from company name, domain, target, latest run, most recent run, chat memory, or prior visible text.

`TERM.S1.C3` If M7 fails, receipt must identify M7 as repair owner and must not mention M8 as executed.

`TERM.S1.C4` If M8 fails, receipt must identify M8 as repair owner and must preserve the saved M7 artifacts as locked prior Agent 2 outputs.

---

# SECTION 2 — SUCCESS RECEIPTS

## 2.1 LOCKED Receipt

`TERM.S2.C1` If Agent 2 status is `LOCKED`, emit exactly:

```text
PHASE LOCKED: M7_M8
Run ID: <run_id>

Execution:
- M7_TARGET_PROFILE: complete
- target_profile: saved
- target_profile_forensics: saved
- M8_TARGET_FEATURE_PROFILE: complete
- target_feature_profile: saved
- target_feature_profile_forensics: saved

Saved:
- target_profile
- target_profile_forensics
- target_feature_profile
- target_feature_profile_forensics

NEXT STEP:
Copy and paste this into the same chat:

@Interface Data Privacy Agent Continue run <run_id>.
```

## 2.2 LOCKED_WITH_LIMITATIONS Receipt

`TERM.S2.C2` If Agent 2 status is `LOCKED_WITH_LIMITATIONS`, emit exactly:

```text
PHASE LOCKED WITH LIMITATIONS: M7_M8
Run ID: <run_id>

Execution:
- M7_TARGET_PROFILE: complete with recorded limitations where applicable
- target_profile: saved
- target_profile_forensics: saved
- M8_TARGET_FEATURE_PROFILE: complete with recorded limitations where applicable
- target_feature_profile: saved
- target_feature_profile_forensics: saved

Saved:
- target_profile
- target_profile_forensics
- target_feature_profile
- target_feature_profile_forensics

Limitations carried forward:
- <short limitation 1>
- <short limitation 2>

NEXT STEP:
Copy and paste this into the same chat:

@Interface Data Privacy Agent Continue run <run_id>.
```

`TERM.S2.C3` Limitations must be short. Detailed limitation ledgers belong inside `target_profile_forensics` and `target_feature_profile_forensics`.

---

# SECTION 3 — REPAIR RECEIPTS

## 3.1 M7 Repair Required

`TERM.S3.C1` If M7 returns `REPAIR_REQUIRED` or `REINVESTIGATE_REQUIRED`, emit:

```text
PHASE REPAIR REQUIRED: M7
Run ID: <run_id>

Repair owner:
Agent 2 / M7 Target Profile

Repair scope:
<repair_scope>

Blocking reasons:
- <blocking_reason_1>
- <blocking_reason_2>

NEXT STEP:
Repair M7 before running M8. Do not move to M8 or M10 yet.
```

## 3.2 M8 Repair Required

`TERM.S3.C2` If M8 returns `REPAIR_REQUIRED` or `REINVESTIGATE_REQUIRED`, emit:

```text
PHASE REPAIR REQUIRED: M8
Run ID: <run_id>

Repair owner:
Agent 2 / M8 Target Feature Profile

Already saved:
- target_profile
- target_profile_forensics

Repair scope:
<repair_scope>

Blocking reasons:
- <blocking_reason_1>
- <blocking_reason_2>

NEXT STEP:
Repair M8 before locking Agent 2. Do not move to M10 yet.
```

## 3.3 Upstream Repair Required

`TERM.S3.C3` If the defect belongs to Agent 1 / M6 or M9, emit:

```text
PHASE REPAIR REQUIRED: Agent 1 upstream repair
Run ID: <run_id>

Repair owner:
Agent 1

Repair scope:
<upstream_artifact_or_route_defect>

NEXT STEP:
Return to the source/legal agent for scoped repair. Do not invent routes or legal/source context inside Agent 2.
```

## 3.4 Controlled Failure

`TERM.S3.C4` If Agent 2 returns `CONTROLLED_FAILURE`, emit:

```text
PHASE CONTROLLED FAILURE: M7_M8
Run ID: <run_id_or_UNRESOLVED>

Failure class:
<failure_class>

Blocking reasons:
- <blocking_reason_1>
- <blocking_reason_2>

No next-agent command is available because Agent 2 did not lock.
```

`TERM.S3.C5` Do not include a next-agent command in repair or controlled-failure receipts.
