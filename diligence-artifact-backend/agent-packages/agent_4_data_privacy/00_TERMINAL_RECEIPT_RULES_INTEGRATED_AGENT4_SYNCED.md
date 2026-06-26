# 00_TERMINAL_RECEIPT_RULES_INTEGRATED
## Universal Terminal and Same-Chat Receipt Kernel for Phased Interface Diligence Agents
### Model-Agnostic Receipt Discipline: Custom GPT, Gemini API, OpenAI API, Claude, Manual Prompt, Backend Runner

---

# TERMINAL LOCK

`TERM.RUNTIME.C1` This is the single integrated terminal/receipt rule file for all phased Interface Diligence agents.

`TERM.RUNTIME.C2` Do not create separate full terminal overlays per agent.

`TERM.RUNTIME.C3` Terminal customization happens through the prompt-level `RUNTIME_BINDING_PACKET`, the Agent Profile Matrix in `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`, and the Terminal Receipt Matrix in this file.

`TERM.RUNTIME.C4` This file governs manual-mode phase receipts, failure receipts, repair receipts, backend/manual handoff boundaries, and final-agent terminal boundaries.

`TERM.RUNTIME.C5` In backend execution, early and middle agents must not emit terminal receipts at all; they return only the strict JSON artifact authorized by the active backend output contract. In manual/same-chat mode only, early and middle agents may emit compact phase receipts. They must not emit reports, final handoff JSON, renderer payloads, legal-risk prose, audit dumps, or hidden chain-of-thought.

---

# SECTION 1 — TERMINAL INPUT CONTRACT

`TERM.S1.C1` Terminal receipt generation requires:

```yaml
terminal_required_inputs:
  runtime_binding_packet: required
  resolved_agent_profile_row: required
  validator_result: required
  run_id: required unless Agent 1 just created it and has now resolved it
  saved_artifacts: required
  phase_lock_status: required
  next_agent_command: required only for successful non-final manual-mode receipts; forbidden in backend artifact output
```

`TERM.S1.C2` If validator status is `REPAIR_REQUIRED` or `CONTROLLED_FAILURE`, terminal must not emit the next-agent command.

`TERM.S1.C3` If validator status is `PASS_WITH_LIMITATION`, terminal may emit the next-agent command only if validator result sets `next_agent_command_allowed: true`.

`TERM.S1.C4` Terminal must never infer `run_id` from company name, domain, target, latest run, most recent run, chat memory, or prior visible text.

---

# SECTION 2 — UNIVERSAL SUCCESS RECEIPT FORMAT

## 2.1 LOCKED Receipt

`TERM.S2.C1` For a successful non-final manual-mode agent with `LOCKED`, emit exactly this shape. Backend execution must not emit this receipt and must instead return only the active phase artifact JSON:

```text
PHASE LOCKED: <phase_lock>
Run ID: <run_id>

Saved:
- <artifact_1>
- <artifact_2>

NEXT STEP:
Copy and paste this into the same chat:

<next_agent_command>
```

`TERM.S2.C2` Saved artifacts must exactly match the artifacts written by the active agent, in write order.

`TERM.S2.C3` The next-agent command must exactly match the `next_agent_command` resolved from the Agent Profile Matrix / Runtime Binding Packet.

## 2.2 LOCKED_WITH_LIMITATIONS Receipt

`TERM.S2.C4` For a successful non-final manual-mode agent with `LOCKED_WITH_LIMITATIONS`, emit exactly this shape. Backend execution must not emit this receipt and must instead return only the active phase artifact JSON:

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
Copy and paste this into the same chat:

<next_agent_command>
```

`TERM.S2.C5` Limitations must be short. Detailed limitation ledgers belong in forensic/provenance artifacts, not terminal receipt.

---

# SECTION 3 — FAILURE AND REPAIR RECEIPTS

## 3.1 REPAIR_REQUIRED Receipt

`TERM.S3.C1` If validator status is `REPAIR_REQUIRED`, emit:

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
Repair this phase before continuing. Do not move to the next agent yet.
```

`TERM.S3.C2` Do not include a next-agent @mention command in `REPAIR_REQUIRED` receipts.

## 3.2 CONTROLLED_FAILURE Receipt

`TERM.S3.C3` If validator status is `CONTROLLED_FAILURE`, emit:

```text
PHASE CONTROLLED FAILURE: <phase_lock_or_active_phase>
Run ID: <run_id_or_UNRESOLVED>

Failure class:
<failure_class>

Blocking reasons:
- <blocking_reason_1>
- <blocking_reason_2>

No next-agent command is available because this phase did not lock.
```

`TERM.S3.C4` Do not include a next-agent @mention command in `CONTROLLED_FAILURE` receipts.

## 3.3 RETURN_TO_UPSTREAM_REPAIR Receipt

`TERM.S3.C5` If the defect belongs to an upstream agent, emit:

```text
PHASE REPAIR REQUIRED: <phase_lock_or_active_phase>
Run ID: <run_id>

Repair owner:
<upstream_agent_name>

Repair scope:
<upstream_artifact_or_route_defect>

NEXT STEP:
Copy and paste this into the same chat:

<upstream_repair_command>
```

`TERM.S3.C6` Upstream repair commands are allowed only for repair routing. They are not successful next-agent handoff commands.

---

# SECTION 4 — TERMINAL RECEIPT MATRIX

## 4.1 Active Terminal Matrix

| active_agent_id | terminal_receipt_profile | successful_phase_line | saved_artifacts | next_agent_command |
|---|---|---|---|---|
| `agent_1_source_legal` | `agent_1_manual_receipt` | `PHASE LOCKED: M6_M9` | `source_discovery_handoff`, `legal_cartography_index` | backend advances to `agent_3_target_feature`; manual mode may show next-step text only after lock |
| `agent_3_target_feature` | `agent_3_manual_receipt` | `PHASE LOCKED: M7_TARGET_PROFILE` and `PHASE LOCKED: M8_TARGET_FEATURE_PROFILE` | `target_profile`, `target_profile_forensics`, `target_feature_profile`, `target_feature_profile_forensics` | backend advances to `agent_4_data_privacy`; manual mode may show next-step text only after M8 lock |
| `agent_4_data_privacy` | `agent_4_manual_receipt` | `PHASE LOCKED: M10_DATA_PROVENANCE` | `target_data_provenance_profile`, `target_data_provenance_profile_forensics` | backend advances to exposure registry agent; manual mode may show next-step text only after M10 lock |
| `agent_5_exposure_registry` | `agent_5_same_chat_receipt_PLACEHOLDER` | `PHASE LOCKED: M11` | `target_exposure_profile`, `target_exposure_profile_forensics` | backend/manual advance to challenge assembly after M11 lock |
| `agent_6_challenge_handoff` | `agent_6_same_chat_receipt_PLACEHOLDER` | `PHASE LOCKED: M12_M13` | `operator_challenge_gate`, `final_output_handoff`, `final_output_handoff_forensics` | backend/manual advance to terminal renderer after M12/M13 lock |
| `agent_7_terminal_renderer` | `agent_7_final_terminal_PLACEHOLDER` | `PHASE LOCKED: M14` | `renderer_payload`, `terminal_validation_result` | final report/rendered result only; no next agent |

`TERM.S4.C1` Agent 1, Agent 3, and Agent 4 terminal rows are active design rows. Agent 3 is the Target Feature owner for M7/M8. Agent 4 is the Data Privacy owner for M10.

`TERM.S4.C2` Agent 5 through Agent 7 rows are placeholders until their module prompts, validators, backend schemas, and terminal contracts are locked.

`TERM.S4.C3` Placeholder rows cannot be used for production success receipts unless their active module contracts are present in the prompt payload and validator has not returned `VALIDATOR_PROFILE_NOT_LOCKED_FOR_PRODUCTION`. Agent 4 may use the active M10 receipt only when the locked Agent 4 M10 prompt, Agent 4 validator profile, Agent 4 runtime binding packet, and Agent 4 backend output contract are present in the prompt payload.

---

# SECTION 5 — AGENT 3 TARGET FEATURE TERMINAL RECEIPTS

## 5.1 Agent 3 Target Feature LOCKED Receipt

`TERM.A3TF.C1` In manual mode only, if Agent 3 locks M7 and M8 successfully, emit exactly:

```text
PHASE LOCKED: M7_TARGET_PROFILE + M8_TARGET_FEATURE_PROFILE
Run ID: <run_id>

Saved:
- target_profile
- target_profile_forensics
- target_feature_profile
- target_feature_profile_forensics

NEXT STEP:
Continue with Agent 4 Data Privacy for run <run_id>.
```

`TERM.A3TF.C2` Backend execution must not emit this receipt. Backend execution must return only the strict JSON artifact required by the active M7/M8 backend output contract.

## 5.2 Agent 3 Target Feature LOCKED_WITH_LIMITATIONS Receipt

`TERM.A3TF.C3` In manual mode only, if Agent 3 locks M7/M8 with limitations, emit exactly:

```text
PHASE LOCKED WITH LIMITATIONS: M7_TARGET_PROFILE + M8_TARGET_FEATURE_PROFILE
Run ID: <run_id>

Saved:
- target_profile
- target_profile_forensics
- target_feature_profile
- target_feature_profile_forensics

Limitations carried forward:
- <short M7/M8 limitation summary>

NEXT STEP:
Continue with Agent 4 Data Privacy for run <run_id>.
```

`TERM.A3TF.C4` Do not include detailed M7/M8 forensics, route coverage ledgers, field derivation rows, archetype derivation rows, surface derivation rows, source quotes, debug notes, or validator logs in the terminal receipt.

## 5.3 Agent 3 Target Feature Repair Receipt

`TERM.A3TF.C5` If M7 fails before M8, repair scope must say Agent 3 / M7 and must not route to Agent 4.

`TERM.A3TF.C6` If M8 fails after M7, repair scope must say Agent 3 / M8 and must not route to Agent 4.

`TERM.A3TF.C7` If the missing route universe is the blocker, repair owner must be Agent 1 / M6, and the next step may route back to Agent 1 repair, not Agent 4.

---

# SECTION 6 — AGENT 4 DATA PRIVACY TERMINAL RECEIPTS

## 6.1 Agent 4 LOCKED Receipt

`TERM.A4.C1` In manual mode only, if Agent 4 status is `LOCKED`, emit exactly:

```text
PHASE LOCKED: M10_DATA_PROVENANCE
RUN ID: <run_id>
ACTIVE AGENT: Interface Data Privacy Agent
ACTIVE SCOPE: M10_DATA_PROVENANCE

SAVED ARTIFACTS:
1. target_data_provenance_profile
2. target_data_provenance_profile_forensics

VALIDATION:
- target_data_provenance_profile: PASS
- target_data_provenance_profile_forensics: PASS
- Data-Control Source Extraction Capsule: PASS
- DAP material selector coverage: PASS
- Anti-Unknown / missing-proof routing: PASS
- law_regulatory_readiness_matrix: PASS
- legal / registry firewall: PASS

NEXT STEP:
Continue with Exposure Registry for run <run_id>.
```

`TERM.A4.C2` Backend execution must not emit this receipt. Backend execution must return only the strict JSON artifact required by the active M10 backend output contract.

## 6.2 Agent 4 LOCKED_WITH_LIMITATIONS Receipt

`TERM.A4.C3` In manual mode only, if Agent 4 status is `LOCKED_WITH_LIMITATIONS`, emit exactly:

```text
PHASE LOCKED WITH LIMITATIONS: M10_DATA_PROVENANCE
RUN ID: <run_id>
ACTIVE AGENT: Interface Data Privacy Agent
ACTIVE SCOPE: M10_DATA_PROVENANCE

SAVED ARTIFACTS:
1. target_data_provenance_profile
2. target_data_provenance_profile_forensics

LIMITATIONS:
- <compact source/evidence/privacy-control limitation>

VALIDATION:
- target_data_provenance_profile: PASS_WITH_LIMITATION
- target_data_provenance_profile_forensics: PASS_WITH_LIMITATION
- Data-Control Source Extraction Capsule: PASS_WITH_LIMITATION
- DAP material selector coverage: PASS_WITH_LIMITATION
- Anti-Unknown / missing-proof routing: PASS
- law_regulatory_readiness_matrix: PASS_WITH_LIMITATION
- legal / registry firewall: PASS

NEXT STEP:
Continue with Exposure Registry for run <run_id>.
```

## 6.3 Agent 4 Repair Receipt

`TERM.A4.C4` If Agent 4 fails validation, emit the universal repair receipt in Section 3.

`TERM.A4.C5` The repair receipt must identify the exact failing M10 gate: upstream custody, primary lossless data-control bucket availability, Data-Control Source Extraction Capsule, DAP row coverage, Anti-Unknown status, missing-proof linkage, readiness matrix schema, forensics separation, legal firewall, registry firewall, or backend save order.

`TERM.A4.C6` If M10 requires M6 repair because a necessary approved data/control route or primary D lossless bucket is absent, route repair to Agent 1 / M6 and do not provide the exposure-registry command.

`TERM.A4.C7` If M10 fails for legal/conclusion leakage or registry leakage, repair M10 only and do not provide the exposure-registry command.

---
# SECTION 7 — PROHIBITED TERMINAL CONTENT

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

`TERM.S6.C3` If a user asks an early/middle agent for final report content, the agent must refuse within workflow terms and provide the correct manual-mode continuation or repair status.

---

# SECTION 8 — FINAL AGENT BOUNDARY

`TERM.S7.C1` Only `agent_7_terminal_renderer` may emit renderer payload or final report receipt.

`TERM.S7.C2` Agent 7 terminal contract is placeholder until M14 is locked.

`TERM.S7.C3` No earlier agent may emit final report content even if all prior artifacts are available.

---

# SECTION 9 — TERMINAL FINAL LOCK

`TERM.LOCK.C1` This integrated terminal/receipt file is subordinate to the integrated 00 runtime and the integrated validator, but it is the governing receipt rule file for all phased agents.

`TERM.LOCK.C2` If validator says no next-agent command, terminal must not provide one.

`TERM.LOCK.C3` If runtime and terminal receipt text conflict, runtime controls phase scope and next-agent identity; terminal controls formatting.

`TERM.LOCK.C4` If module contracts require exact terminal checkpoint lines inside phase output, those lines remain module-local and do not authorize final report or next-agent handoff without validator pass.
