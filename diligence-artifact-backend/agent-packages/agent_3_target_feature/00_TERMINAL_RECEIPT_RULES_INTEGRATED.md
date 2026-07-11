# 00_TERMINAL_RECEIPT_RULES_INTEGRATED
## Universal Terminal and Manual-Mode Receipt Kernel for Phased Interface Diligence Agents
### Model-Agnostic Receipt Discipline: Custom GPT, Gemini API, OpenAI API, Claude, Manual Prompt, Backend Runner

---

# TERMINAL LOCK

`TERM.RUNTIME.C1` This is the single integrated terminal/receipt rule file for all phased Interface Diligence agents.

`TERM.RUNTIME.C2` Do not create separate full terminal overlays per agent.

`TERM.RUNTIME.C3` Terminal customization happens through the prompt-level `RUNTIME_BINDING_PACKET`, the Agent Profile Matrix in `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`, and the Terminal Receipt Matrix in this file.

`TERM.RUNTIME.C4` This file governs production backend terminal boundaries, manual-mode phase receipts, failure receipts, repair receipts, and final-agent terminal boundaries.

`TERM.RUNTIME.C5` In production backend execution, early and middle agents must emit only the strict JSON artifact authorized by the active phase output contract. They must not emit same-chat receipts, reports, final handoff JSON, renderer payloads, legal-risk prose, audit dumps, or hidden chain-of-thought.

`TERM.RUNTIME.C6` Same-chat receipt formats in this file are manual-mode only. They do not authorize custom action schemas, hidden handoff prompts, or backend prompt-output wrappers.

---

# SECTION 1 — TERMINAL INPUT CONTRACT

`TERM.S1.C1` Terminal receipt generation requires:

```yaml
terminal_required_inputs:
  runtime_binding_packet: required
  resolved_agent_profile_row: required
  validator_result: required
  run_id: required unless the run is being created by the source/bootstrap phase
  saved_artifacts: required
  phase_lock_status: required
  next_phase_or_backend_advance_instruction: required for successful non-final phases
```

`TERM.S1.C2` If validator status is `REPAIR_REQUIRED`, `SOURCE_REPAIR_REQUIRED`, or `CONTROLLED_FAILURE`, terminal must not emit a next-phase or next-agent command.

`TERM.S1.C3` If validator status is `PASS_WITH_LIMITATION`, `PASS_WITH_WARNING`, or `REINVESTIGATION_COMPLETED_WITH_LIMITATION`, terminal may emit the backend advance instruction only if validator result sets `next_agent_command_allowed: true` or equivalent downstream-safe flag.

`TERM.S1.C4` Terminal must never infer `run_id` from company name, domain, target, latest run, most recent run, chat memory, or prior visible text.

`TERM.S1.C5` In backend mode, terminal receipt generation is not part of the model phase response. Backend mode returns only the active phase artifact JSON required by the active module output contract.

---

# SECTION 2 — UNIVERSAL SUCCESS RECEIPT FORMAT

## 2.1 LOCKED Receipt

`TERM.S2.C1` In manual same-chat mode only, for a successful non-final phase with `LOCKED`, emit exactly this shape:

```text
PHASE LOCKED: <phase_lock>
Run ID: <run_id>

Saved:
- <artifact_1>
- <artifact_2>

NEXT STEP:
<backend runner advance instruction or manually authorized continuation>
```

`TERM.S2.C2` Saved artifacts must exactly match the artifacts written by the active phase, in phase-specific write order.

`TERM.S2.C3` The next-step line must exactly match the backend advance instruction resolved from the Agent Profile Matrix / Runtime Binding Packet. It must not invent a Custom GPT @mention or action-schema command.

## 2.2 LOCKED_WITH_LIMITATIONS Receipt

`TERM.S2.C4` In manual same-chat mode only, for a successful non-final phase with `LOCKED_WITH_LIMITATIONS`, emit exactly this shape:

```text
PHASE LOCKED WITH LIMITATIONS: <phase_lock>
Run ID: <run_id>

Saved:
- <artifact_1>
- <artifact_2>

Limitations carried forward:
- <short limitation 1>
- <short limitation 2>

NEXT STEP:
<backend runner advance instruction or manually authorized continuation>
```

`TERM.S2.C5` Limitations must be short. Detailed limitation ledgers belong in forensic/provenance artifacts, not terminal receipt.

---

# SECTION 3 — FAILURE AND REPAIR RECEIPTS

## 3.1 REPAIR_REQUIRED Receipt

`TERM.S3.C1` If validator status is `REPAIR_REQUIRED` or `SOURCE_REPAIR_REQUIRED`, emit in manual mode:

```text
PHASE REPAIR REQUIRED: <phase_lock_or_active_phase>
Run ID: <run_id>

Repair owner:
<repair_owner>

Repair scope:
<repair_scope>

Blocking reasons:
- <blocking_reason_1>
- <blocking_reason_2>

NEXT STEP:
Repair this phase before continuing. Do not move to the next phase yet.
```

`TERM.S3.C2` Do not include a next-agent command in `REPAIR_REQUIRED` or `SOURCE_REPAIR_REQUIRED` receipts.

## 3.2 CONTROLLED_FAILURE Receipt

`TERM.S3.C3` If validator status is `CONTROLLED_FAILURE`, emit in manual mode:

```text
PHASE CONTROLLED FAILURE: <phase_lock_or_active_phase>
Run ID: <run_id_or_UNRESOLVED>

Failure class:
<failure_class>

Blocking reasons:
- <blocking_reason_1>
- <blocking_reason_2>

No next-phase command is available because this phase did not lock.
```

`TERM.S3.C4` Do not include a next-agent command in `CONTROLLED_FAILURE` receipts.

## 3.3 RETURN_TO_UPSTREAM_REPAIR Receipt

`TERM.S3.C5` If the defect belongs to an upstream source/routing agent, emit in manual mode:

```text
PHASE REPAIR REQUIRED: <phase_lock_or_active_phase>
Run ID: <run_id>

Repair owner:
<upstream_agent_name>

Repair scope:
<upstream_artifact_or_route_defect>

NEXT STEP:
Return to the upstream repair phase identified above. Do not continue this phase until upstream repair is saved.
```

`TERM.S3.C6` Upstream repair instructions are allowed only for repair routing. They are not successful next-phase handoff commands.

---

# SECTION 4 — TERMINAL RECEIPT MATRIX

## 4.1 Active Terminal Matrix

| active_agent_id | terminal_receipt_profile | successful_phase_line | saved_artifacts | next_agent_command |
|---|---|---|---|---|
| `agent_1a_url_manifest` | `agent_1a_manual_receipt` | `PHASE LOCKED: AGENT_1A_URL_MANIFEST` | `deduped_url_manifest` | backend runner advances to `AGENT_1B_EXTRACT` |
| `agent_1b_extract` | `agent_1b_manual_receipt` | `PHASE LOCKED: AGENT_1B_EXTRACT` | `source_family_index`, `lossless_family__*` artifacts | backend runner advances to `M6_BUCKET_INDEX` |
| `agent_2a_bucket_routing` | `agent_2a_manual_receipt` | `PHASE LOCKED: M6_BUCKET_INDEX` | `source_discovery_handoff` | backend runner advances to `M9` |
| `agent_2b_m9` | `agent_2b_m9_manual_receipt` | `PHASE LOCKED: M9_LEGAL_CARTOGRAPHY` | `legal_cartography_index` | backend runner advances to `M7_TARGET_PROFILE` |
| `agent_3_target_feature` / M7 | `agent_3_m7_manual_receipt` | `PHASE LOCKED: M7_TARGET_PROFILE` | `target_profile` | backend runner advances to `P3_DOMAIN_DERIVATION_LAYER` |
| `agent_3_target_feature` / P3 | `agent_3_p3_manual_receipt` | `PHASE LOCKED: P3_DOMAIN_DERIVATION_LAYER` | `domain_derivation_profile`, `active_run_package_manifest` | backend runner advances to `M7_TARGET_PROFILE_FORENSICS` |
| `agent_3_target_feature` / M8 | `agent_3_m8_manual_receipt` | `PHASE LOCKED: M8_TARGET_FEATURE_PROFILE` | `target_feature_profile`, `target_feature_profile_forensics` | backend runner advances to `M10` |
| `agent_4_data_privacy` | `agent_3_m10_manual_receipt_PLACEHOLDER` | `PHASE LOCKED: M10_DATA_PROVENANCE` | `target_data_provenance_profile`, `target_data_provenance_profile_forensics` | backend runner advances to `M11` |
| `agent_5_exposure_registry` | `agent_4_m11_manual_receipt_PLACEHOLDER` | `PHASE LOCKED: M11_EXPOSURE_REGISTRY` | `target_exposure_profile`, `target_exposure_profile_forensics` | backend runner advances to `M12` |
| `agent_6_challenge_handoff` | `agent_5_m12_m13_manual_receipt_PLACEHOLDER` | `PHASE LOCKED: M12_M13` | `operator_challenge_gate`, `final_output_handoff`, `final_output_handoff_forensics` | backend runner advances to terminal/renderer |
| `agent_7_terminal_renderer` | `agent_6_final_terminal_PLACEHOLDER` | `PHASE LOCKED: M14` | `renderer_payload`, `terminal_validation_result` | final report/rendered result only; no next phase |

`TERM.S4.C1` Agent 1A, Agent 1B, Agent 2A, Agent 2B, Agent 3, Agent 4, and Agent 5 rows for M7/M8 are active design rows.

`TERM.S4.C2` Agent 6 challenge/handoff and Agent 7 terminal renderer rows remain placeholders until their module prompts, validators, backend schemas, and terminal contracts are locked.

`TERM.S4.C3` Placeholder rows cannot be used for production success receipts unless their active module contracts are present in the prompt payload and validator has not returned `VALIDATOR_PROFILE_NOT_LOCKED_FOR_PRODUCTION`.

`TERM.S4.C4` The active target-feature sequence has two separate locks. M7 and M8 must not be collapsed into a single receipt or a single lock line.

---

# SECTION 5 — AGENT 3 TARGET FEATURE TERMINAL RECEIPTS

## 5.1 Agent 3 M7 LOCKED Receipt

`TERM.A3.C1` In manual same-chat mode only, if M7 status is `LOCKED`, emit exactly:

```text
PHASE LOCKED: M7_TARGET_PROFILE
Run ID: <run_id>

Saved:
- target_profile

NEXT STEP:
Backend runner may advance this run to P3_DOMAIN_DERIVATION_LAYER.
```

## 5.2 Agent 3 M8 LOCKED_WITH_LIMITATIONS Receipt

`TERM.A3.C2` In manual same-chat mode only, if M8 status is `LOCKED_WITH_LIMITATIONS`, emit exactly:

```text
PHASE LOCKED WITH LIMITATIONS: M8_TARGET_FEATURE_PROFILE
Run ID: <run_id>

Saved:
- target_feature_profile
- target_feature_profile_forensics

Limitations carried forward:
- <short M8 limitation summary>

NEXT STEP:
Backend runner may advance this run to M10.
```

`TERM.A3.C3` Do not include detailed M7/M8 forensics, route coverage ledgers, field derivation rows, archetype derivation rows, surface derivation rows, source quotes, debug notes, or validator logs in the terminal receipt.

## 5.3 Agent 3 P3 Domain Derivation LOCKED Receipt

`TERM.A3.P3.C1` In manual same-chat mode only, if P3 status is `LOCKED`, emit exactly:

```text
PHASE LOCKED: P3_DOMAIN_DERIVATION_LAYER
Run ID: <run_id>

Saved:
- domain_derivation_profile
- active_run_package_manifest

NEXT STEP:
Backend runner may advance this run to M7_TARGET_PROFILE_FORENSICS.
```

`TERM.A3.P3.C2` The model emits only `domain_derivation_profile`; the compiler writes `active_run_package_manifest`. If P3 status is `CONTROLLED_FAILURE`, emit the CONTROLLED_FAILURE receipt and no next-phase command.

## 5.4 Agent 3 Target Feature Repair Receipt

`TERM.A3.C4` If M7 fails before M8, repair scope must say `M7_TARGET_PROFILE`, and the backend must not advance to M8.

`TERM.A3.C5` If M8 fails after M7, repair scope must say `M8_TARGET_FEATURE_PROFILE`, and the backend must not advance to M10. Saved M7 artifacts remain read-only unless M8 repair exposes a material M7 defect requiring explicit upstream repair.

`TERM.A3.C6` If missing route universe is the blocker, repair owner must be the upstream source/routing phase, and the next step may route back to source repair. Do not invent, search, or proceed.

`TERM.A3.C7` M7 has two backend terminal events: Phase B1 material save event for `target_profile`, and Phase D forensic save event for `target_profile_forensics`.

`TERM.A3.C8` M8 has two backend terminal events: Phase B1 material save event for `target_feature_profile`, and Phase D forensic save event for `target_feature_profile_forensics`.

---

# SECTION 6 — PROHIBITED TERMINAL CONTENT

`TERM.S6.C1` Early/middle phase receipts must not include:

```text
technical_audit_log
operator_challenge_gate
final_output_handoff
renderer_payload
screen_report_payload
full forensic ledger
full source ledger
full route coverage ledger
full FD row export
full registry row export
chain-of-thought
hidden scratchpad
legal advice
compliance conclusion
risk recommendation
HTML report
markdown report prose
```

`TERM.S6.C2` Terminal receipt is a workflow receipt, not a substantive report.

`TERM.S6.C3` If a user asks an early/middle agent for final report content, the agent must refuse within workflow terms and provide the correct backend phase status or repair status.

---

# SECTION 7 — FINAL AGENT BOUNDARY

`TERM.S7.C1` Only `agent_7_terminal_renderer` may emit renderer payload or final report receipt.

`TERM.S7.C2` Agent 6 terminal contract is placeholder until M14 is locked.

`TERM.S7.C3` No earlier agent may emit final report content even if all prior artifacts are available.

---

# SECTION 8 — TERMINAL FINAL LOCK

`TERM.LOCK.C1` This integrated terminal/receipt file is subordinate to the integrated 00 runtime and the integrated validator, but it is the governing receipt rule file for all phased agents.

`TERM.LOCK.C2` If validator says no next-phase command, terminal must not provide one.

`TERM.LOCK.C3` If runtime and terminal receipt text conflict, runtime controls phase scope, active phase, backend execution mode, and next-phase identity; terminal controls formatting only in manual receipt mode.

`TERM.LOCK.C4` If module contracts require exact terminal checkpoint lines inside manual/debug phase output, those lines remain module-local and do not authorize final report, next-phase handoff, combined artifact output, or backend advancement without validator pass.
