# MODULE XII — GLOBAL CHALLENGE GATE
## Agent 5 / M12-GLOBAL

<phase_call_card>
phase_id: M12_GLOBAL_CHALLENGE
module_id: M12
module_name: GLOBAL_CHALLENGE_GATE
active_phase_only: true
active_agent: agent_5_exposure_registry
canonical_backend_output: challenge_gate
canonical_semantic_output: challenge_gate.operator_challenge_gate

execution_rule:
  Execute M12 global challenge only.
  Challenge saved M6-M11 outputs, limitations, controlled failures, and undertrigger risk.
  Do not create new source evidence.
  Do not rewrite locked upstream artifacts.
  Do not rewrite M11 artifacts.
  Do not emit final_output_handoff.
  Do not emit compiler, renderer, report, or HTML output.

required_inputs:
  - source_discovery_handoff
  - legal_cartography_index
  - target_profile
  - target_profile_forensics
  - target_feature_profile
  - target_feature_profile_forensics
  - data_provenance_profile
  - data_provenance_profile_forensics
  - exposure_registry_route_plan
  - exposure_registry_batch__{GROUP}__{NNN}
  - exposure_registry_batch_validation__{GROUP}__{NNN}
  - exposure_registry_workpad_98
  - exposure_registry_controlled_profile
  - exposure_registry_triggered_profile
  - exposure_registry_profile_forensics

required_machine_output:
  - challenge_gate

forbidden_outputs:
  - operator_challenge_gate as top-level root
  - target_exposure_profile
  - exposure_registry_profile
  - triggered_and_controlled_rows as combined material container
  - final_output_handoff
  - renderer_payload
  - report prose
  - mutated upstream artifacts

stop_condition:
  Stop after emitting challenge_gate.
</phase_call_card>

## M12G.S1 — Function

`M12G.S1.C1` M12 global challenge converts saved M6-M11 artifacts into one backend `challenge_gate` object.

`M12G.S1.C2` The semantic gate lives at `challenge_gate.operator_challenge_gate`.

`M12G.S1.C3` Isolated row defects route to the owning boundary before full-run failure is considered.

`M12G.S1.C4` M12 global challenge does not create new diligence findings and does not assemble final handoff branches.

## M12G.S2 — Required Challenge Gates

M12 global must run these checks:

1. Required state object gate.
2. Module lock matrix gate.
3. Source custody and evidence route gate.
4. M7-M10 material contract gate.
5. FD selector coverage gate.
6. M8 archetype and surface integrity gate.
7. M9 legal cartography boundary gate.
8. M10 data provenance custody gate.
9. M11 registry integrity and split material gate.
10. Machine field leakage gate.
11. Forensic and workpad retention gate.
12. Compiler readiness gate.

## M12G.S3 — M11 Split Material Gate

The M11 registry gate must check:

- `exposure_registry_workpad_98` has 98 active rows.
- every Threat_ID appears exactly once.
- every UNI row was evaluation-routed.
- every model-routed row has an accepted M11 batch artifact and a paired M12 batch validation artifact.
- every final CONTROLLED workpad row appears in `exposure_registry_controlled_profile.controlled_rows[]`.
- every final TRIGGERED workpad row appears in `exposure_registry_triggered_profile.triggered_rows[]`.
- no CONTROLLED row is omitted.
- no TRIGGERED row is omitted.
- no combined `triggered_and_controlled_rows[]` material container exists.
- no old `target_exposure_profile` or `exposure_registry_profile` root is used.

## M12G.S4 — Output Contract

Return exactly one JSON root:

```json
{
  "challenge_gate": {
    "operator_challenge_gate": {
      "challenge_call_card": {},
      "input_custody_check": {},
      "module_lock_matrix": {},
      "material_profile_contract_checks": {},
      "fd_selector_coverage_checks": {},
      "source_and_evidence_checks": {},
      "feature_archetype_surface_integrity_checks": {},
      "registry_integrity_checks": {},
      "legal_firewall_checks": {},
      "ledger_retention_checks": {},
      "handoff_readiness_checks": {},
      "challenge_findings": [],
      "repair_directives": [],
      "unresolved_blockers": [],
      "pass_with_limitation_notes": [],
      "lock_status": "PASS | PASS_WITH_LIMITATION | REPAIR_REQUIRED | CONTROLLED_FAILURE"
    },
    "lock_status": "PASS | PASS_WITH_LIMITATION | REPAIR_REQUIRED | CONTROLLED_FAILURE"
  }
}
```

`M12G.S4.C1` Compiler may proceed only if `challenge_gate.lock_status` is `PASS` or `PASS_WITH_LIMITATION`.

`M12G.S4.C2` `REPAIR_REQUIRED` routes to the smallest owning module, phase, batch, artifact, or row boundary.

`M12G.S4.C3` `CONTROLLED_FAILURE` is reserved for systemic, unsafe, unrecoverable, or materially misleading corruption.
