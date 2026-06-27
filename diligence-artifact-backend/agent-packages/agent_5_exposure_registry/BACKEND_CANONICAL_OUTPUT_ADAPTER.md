# BACKEND CANONICAL OUTPUT ADAPTER — AGENT 5 / M11
## Batched M11 Boundary Adapter

This adapter is loaded near the end of Agent 5 backend prompt assembly. It controls executable output roots for the new M11 reality.

---

# ADAPTER LOCK

`A5.ADAPTER.C1` The old single-root backend artifact `exposure_registry_profile` is retired.

`A5.ADAPTER.C2` The old package aliases `target_exposure_profile` and `target_exposure_profile_forensics` are forbidden in production backend execution.

`A5.ADAPTER.C3` Agent 5 does not emit one final combined response. It emits or saves one active boundary object at a time.

---

# ACTIVE BOUNDARY ROOTS

Exactly one of the following roots may appear at any production boundary:

```text
exposure_registry_route_plan
m11_batch_registry_ledger
exposure_registry_workpad_98
exposure_registry_controlled_profile
exposure_registry_triggered_profile
exposure_registry_profile_forensics
```

M12 batch validation is Agent 5-owned, outside M11 model output, and returns this root:

```text
exposure_registry_batch_validation
```

The backend persists it as:

```text
exposure_registry_batch_validation__{GROUP}__{NNN}
```

M12 global root:

```text
challenge_gate
```

Accepted batch save artifacts are backend-controlled and use:

```text
exposure_registry_batch__{GROUP}__{NNN}
```

---

# BOUNDARY OUTPUT SHAPES

## Phase A route plan

```json
{
  "exposure_registry_route_plan": {}
}
```

## Phase B active batch model ledger

```json
{
  "m11_batch_registry_ledger": {}
}
```

## Phase C canonical workpad

```json
{
  "exposure_registry_workpad_98": {}
}
```

## Phase D controlled profile

```json
{
  "exposure_registry_controlled_profile": {
    "controlled_rows": []
  }
}
```

## Phase E triggered profile

```json
{
  "exposure_registry_triggered_profile": {
    "triggered_rows": []
  }
}
```

## Phase F forensics

```json
{
  "exposure_registry_profile_forensics": {}
}
```

---

# LEGAL CARTOGRAPHY ADAPTER RULE

`A5.ADAPTER.C4` `legal_cartography_index` is consumed as the saved M9 artifact. M11 must not output `legal_cartography_index`, a rebuilt legal cartography map, a row-scoped legal cartography artifact, or any replacement legal navigation object.

`A5.ADAPTER.C5` Legal/governance source selection may be represented inside route plan, batch packet metadata, workpad trace, or forensics only as consumption trace. It must not become a new legal-cartography artifact.

---

# FORBIDDEN ROOTS

The following production roots are forbidden:

```text
exposure_registry_profile
target_exposure_profile
target_exposure_profile_forensics
triggered_and_controlled_rows as a top-level artifact
controlled_exposure_rows
material_exposure_findings
exposure_summary
registry_coverage_matrix
activity_to_exposure_matrix
data_asset_to_exposure_matrix
legal_control_to_exposure_matrix
review_priority_register
operator_challenge_gate
final_output_handoff
renderer_payload
```

---

# M11 / M12 CHALLENGE ROOT RULE

M11 forbidden root: challenge_gate
M12 batch root: exposure_registry_batch_validation
M12 batch forbidden root: challenge_gate
M12 global allowed root: challenge_gate

---

# STOP RULE

After emitting the active boundary root, stop. M11 and M12 batch must not emit M12 global challenge, compiler, renderer, report prose, terminal receipt text, compatibility wrappers, or additional artifacts. M12 global must stop after emitting challenge_gate.
