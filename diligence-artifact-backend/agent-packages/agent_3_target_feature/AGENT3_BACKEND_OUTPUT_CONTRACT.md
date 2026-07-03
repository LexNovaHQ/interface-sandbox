# AGENT3_BACKEND_OUTPUT_CONTRACT

This file overrides any older same-chat receipt, phase-output, checkpoint, markdown, visible terminal language, or combined-artifact response language for backend model execution.

When Agent 3 runs inside the backend, the model response must be strict JSON only. No markdown. No XML-like phase block. No array wrapper. No prose receipt. No checkpoint lines. No same-chat next-agent instruction.

Agent 3 backend execution is split by artifact save phase. M7 and M8 do not authorize combined material-plus-forensic responses in production backend execution.

---

## M7 required response shape

`M7_TARGET_PROFILE` has two backend terminal/save events. They are separate. The material artifact must be emitted, validated, and saved before the forensic artifact may be derived or emitted.

### M7 Phase B1 material response shape

For the M7 Phase B1 material save event, return exactly one plain top-level JSON object:

```json
{
  "target_profile": {}
}
```

Rules:

- The top-level value must be an object, not an array.
- Do not wrap the object inside `phase_output`, `output`, `result`, `data`, `M7`, `M7_TARGET_PROFILE`, or `M7_TARGET_PROFILE_MAIN`.
- Do not return `[ { "target_profile": {} } ]`.
- Do not include `target_profile_forensics` in the Phase B1 material response.
- Do not put source ledgers, derivation ledgers, runtime trace, validation status, lock status, confidence, evidence basis, extraction capsule, or forensic/provenance material inside `target_profile`.
- `target_profile` must contain exactly the five material parent branches required by the M7 module:
  - `target_identity`
  - `jurisdiction_notice`
  - `business_context`
  - `product_service_wrapper`
  - `target_profile_limitations`
- The backend runner must validate and save `target_profile` before Phase C/D forensic execution begins.

### M7 Phase D forensic response shape

For the M7 Phase D forensic save event, consume the saved `target_profile` artifact and return exactly one plain top-level JSON object:

```json
{
  "target_profile_forensics": {}
}
```

Rules:

- The top-level value must be an object, not an array.
- Do not wrap the object inside `phase_output`, `output`, `result`, `data`, `M7`, `M7_TARGET_PROFILE`, or `M7_TARGET_PROFILE_FORENSICS`.
- Do not return `[ { "target_profile_forensics": {} } ]`.
- Do not re-emit `target_profile` in the Phase D forensic response.
- `target_profile_forensics` must be separate from `target_profile`.
- `target_profile_forensics` must contain the forensic/provenance branches required by the M7 module.
- The forensic ledger branches `source_ledger_used_for_m7`, `target_source_extraction_capsule_summary`, `target_source_route_coverage_ledger`, `field_derivation_ledger`, `targeted_re_extraction_ledger`, `limitation_ledger`, and `cross_route_use_ledger` must be JSON arrays, never summary objects.
- The backend runner must validate and save `target_profile_forensics` before M8 may begin.

### M7 forbidden combined response shape

The following production backend response shape is forbidden:

```json
{
  "target_profile": {},
  "target_profile_forensics": {}
}
```

That shape incorrectly mixes the Phase B1 material artifact and the Phase D forensic artifact into one backend call.

---

## M8 required response shape

`M8_TARGET_FEATURE_PROFILE` has two backend terminal/save events. They are separate. The material artifact must be emitted, validated, and saved before the forensic artifact may be derived or emitted.

### M8 Phase B1 material response shape

For the M8 Phase B1 material save event, return exactly one plain top-level JSON object:

```json
{
  "target_feature_profile": {}
}
```

Rules:

- The top-level value must be an object, not an array.
- Do not wrap the object inside `phase_output`, `output`, `result`, `data`, `M8`, `M8_TARGET_FEATURE_PROFILE`, or `M8_TARGET_FEATURE_PROFILE_MAIN`.
- Do not return `[ { "target_feature_profile": {} } ]`.
- Do not include `target_feature_profile_forensics` in the Phase B1 material response.
- Do not put source ledgers, archetype ledgers, surface-token ledgers, derivation ledgers, runtime trace, validation status, lock status, confidence, source URLs, source IDs, source pointers, copied excerpts, extraction capsule, or forensic/provenance material inside `target_feature_profile`.
- `target_feature_profile.commercial_availability_posture.evidence_basis[]` is allowed only as short business-readable source-basis notes. It must not contain source URLs, source IDs, source pointers, copied source text, confidence fields, or forensic/provenance material.
- `target_feature_profile` must contain exactly:
  - `activities`
  - `commercial_availability_posture`
  - `profile_level_limitations`
- `target_feature_profile.activities` must be an array.
- `target_feature_profile.commercial_availability_posture` must be an object with exactly:
  - `posture`
  - `free_trial_freemium_signal`
  - `beta_pilot_early_access_signal`
  - `paid_production_enterprise_plan_signal`
  - `evidence_basis`
  - `limitation`
- Every emitted activity must use the M8 locked 12-field activity card.
- The backend runner must validate and save `target_feature_profile` before Phase C/D forensic execution begins.

### M8 Phase D forensic response shape

For the M8 Phase D forensic save event, consume the saved `target_feature_profile` artifact and return exactly one plain top-level JSON object:

```json
{
  "target_feature_profile_forensics": {}
}
```

Rules:

- The top-level value must be an object, not an array.
- Do not wrap the object inside `phase_output`, `output`, `result`, `data`, `M8`, `M8_TARGET_FEATURE_PROFILE`, or `M8_TARGET_FEATURE_PROFILE_FORENSICS`.
- Do not return `[ { "target_feature_profile_forensics": {} } ]`.
- Do not re-emit `target_feature_profile` in the Phase D forensic response.
- `target_feature_profile_forensics` must be separate from `target_feature_profile`.
- `target_feature_profile_forensics` must contain the forensic/provenance branches required by the M8 module, including selected PA field derivation rows, archetype derivation rows, surface-token derivation rows, targeted re-extraction rows, source URL custody, validation quality control, and forensic boundary.
- The backend runner must validate and save `target_feature_profile_forensics` before M10 may begin.

### M8 forbidden combined response shape

The following production backend response shape is forbidden:

```json
{
  "target_feature_profile": {},
  "target_feature_profile_forensics": {}
}
```

That shape incorrectly mixes the Phase B1 material artifact and the Phase D forensic artifact into one backend call.

---

## Global forbidden backend response shapes

Agent 3 must not return any of these production backend shapes:

```json
{
  "target_profile": {},
  "target_profile_forensics": {},
  "target_feature_profile": {},
  "target_feature_profile_forensics": {}
}
```

```json
{
  "target_profile": {},
  "target_feature_profile": {}
}
```

```json
{
  "target_profile_forensics": {},
  "target_feature_profile_forensics": {}
}
```

```json
{
  "phase_output": {}
}
```

```json
{
  "output": {}
}
```

```json
{
  "result": {}
}
```

```json
{
  "data": {}
}
```

Any response that combines artifacts from different save phases is invalid.

If older package text conflicts with this file, this file controls for Agent 3 backend execution.
