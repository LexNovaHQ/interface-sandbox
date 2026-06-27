# 00_TERMINAL_RECEIPT_RULES_INTEGRATED_AGENT5_SYNCED
## Agent 5 / M11 Terminal and Manual Receipt Rules

---

# TERMINAL LOCK

`A5.TERM.C1` Backend execution for Agent 5 emits strict JSON only at the active boundary. Terminal receipts are manual/same-chat receipts only.

`A5.TERM.C2` Agent 5 terminal receipts must not contain report prose, legal-risk prose, legal conclusions, renderer output, final handoff JSON, hidden chain-of-thought, or M12 global challenge output during M11/M12 batch boundaries.

`A5.TERM.C3` If validator status is `SOURCE_REPAIR_REQUIRED`, `REPAIR_REQUIRED`, or `CONTROLLED_FAILURE`, do not emit the next-agent command.

---

# SECTION 1 — SUCCESS RECEIPT

For successful Agent 5 lock, emit exactly:

```text
PHASE LOCKED: M11_EXPOSURE_REGISTRY
Run ID: <run_id>

Saved:
- exposure_registry_route_plan
- exposure_registry_batch__{GROUP}__{NNN}
- exposure_registry_batch_validation__{GROUP}__{NNN}
- exposure_registry_workpad_98
- exposure_registry_controlled_profile
- exposure_registry_triggered_profile
- exposure_registry_profile_forensics
- challenge_gate

NEXT STEP:
Backend may advance to COMPILER only after challenge_gate locks with PASS or PASS_WITH_LIMITATION.
```

`A5.TERM.S1.C1` Manual terminal receipts may summarize batch count, but must not dump full registry rows.

`A5.TERM.S1.C2` Saved artifacts must match the actual backend save manifest. Do not claim a batch, workpad, split profile, or forensic artifact was saved unless backend save receipts exist.

---

# SECTION 2 — LOCKED WITH LIMITATIONS RECEIPT

For successful Agent 5 lock with safe limitations, emit exactly:

```text
PHASE LOCKED WITH LIMITATIONS: M11_EXPOSURE_REGISTRY
Run ID: <run_id>

Saved:
- exposure_registry_route_plan
- exposure_registry_batch__{GROUP}__{NNN}
- exposure_registry_batch_validation__{GROUP}__{NNN}
- exposure_registry_workpad_98
- exposure_registry_controlled_profile
- exposure_registry_triggered_profile
- exposure_registry_profile_forensics
- challenge_gate

Limitations carried forward:
- <short limitation 1>
- <short limitation 2>

NEXT STEP:
Backend may advance to COMPILER only after challenge_gate locks with PASS or PASS_WITH_LIMITATION.
```

`A5.TERM.S2.C1` Limitations must be short. Detailed limitation ledgers belong in `exposure_registry_profile_forensics`.

---

# SECTION 3 — REPAIR REQUIRED RECEIPT

If Agent 5 requires repair, emit exactly:

```text
PHASE REPAIR REQUIRED: M11_EXPOSURE_REGISTRY
Run ID: <run_id>

Repair owner:
<Agent 5 / backend deterministic system / M12 batch validator / upstream owner>

Repair scope:
<route plan | batch {GROUP}__{NNN} | M12 batch validation | accepted batch save | workpad merge | controlled projection | triggered projection | forensics | upstream artifact>

Blocking reasons:
- <blocking_reason_1>
- <blocking_reason_2>

NEXT STEP:
Repair the smallest affected unit before continuing. Do not move to M12 global challenge yet.
```

---

# SECTION 4 — CONTROLLED FAILURE RECEIPT

If Agent 5 controlled-fails, emit exactly:

```text
PHASE CONTROLLED FAILURE: M11_EXPOSURE_REGISTRY
Run ID: <run_id_or_UNRESOLVED>

Failure class:
<failure_class>

Blocking reasons:
- <blocking_reason_1>
- <blocking_reason_2>

No next-agent command is available because M11 did not lock.
```

---

# SECTION 5 — FORBIDDEN RECEIPT CONTENT

Agent 5 receipts must not include:

```text
full 98-row registry ledger
full batch ledger dumps
legal advice
compliance conclusions
liability findings
risk-score verdicts
final_output_handoff
renderer_payload
HTML/report prose
target_exposure_profile
target_exposure_profile_forensics
exposure_registry_profile
rebuilt legal cartography map
```

---

# SECTION 6 — TERMINAL MATRIX ROW

| active_agent_id | terminal_receipt_profile | successful_phase_line | saved_artifacts | next step |
|---|---|---|---|---|
| `agent_5_exposure_registry` | `agent_5_m11_batched_manual_receipt` | `PHASE LOCKED: M11_EXPOSURE_REGISTRY` / `M12_GLOBAL_CHALLENGE` | `exposure_registry_route_plan`, all accepted `exposure_registry_batch__{GROUP}__{NNN}`, all paired `exposure_registry_batch_validation__{GROUP}__{NNN}`, `exposure_registry_workpad_98`, `exposure_registry_controlled_profile`, `exposure_registry_triggered_profile`, `exposure_registry_profile_forensics`, `challenge_gate` | backend advances to COMPILER only after challenge_gate locks |

`A5.TERM.S6.C1` Agent 5 provides no compiler command until M12 global challenge_gate is saved and locked with PASS or PASS_WITH_LIMITATION.
