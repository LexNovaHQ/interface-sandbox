# Target and Activity Profile Backend Output Contract

This file overrides older same-chat receipt, phase-output, checkpoint, markdown, visible terminal language, or combined-artifact response language for backend model execution.

When this package runs inside the backend, the model response must be strict JSON only. No markdown. No XML-like phase block. No array wrapper. No prose receipt. No checkpoint lines. No same-chat next-agent instruction.

Compatibility note: existing internal job IDs and file names remain until explicit runtime cutover. Product-facing phase names control this document.

---

## Target Profile Review required response shape

Target Profile Review has one material save event.

For the Target Profile Review material save event, return exactly one plain top-level JSON object:

```json
{
  "target_profile": {}
}
```

Rules:

- The top-level value must be an object, not an array.
- Do not wrap the object inside `phase_output`, `output`, `result`, `data`, an internal job label, or a compatibility module label.
- Do not return `[ { "target_profile": {} } ]`.
- Do not include `target_profile_forensics` in the Target Profile Review material response.
- Do not put source ledgers, derivation ledgers, runtime trace, validation status, lock status, confidence, evidence basis, extraction capsule, or forensic/provenance material inside `target_profile`.
- Do not emit `legal_signal_derivation_profile` as an output. It is an input only.
- Do not emit `legal_cartography_index`, legal/governance material, downstream profiles, exposure artifacts, final handoff, renderer payload, or Qualified Review artifacts.
- `target_profile` must contain exactly the five material parent branches required by Target Profile Review:
  - `target_identity`
  - `jurisdiction_notice`
  - `business_context`
  - `product_service_wrapper`
  - `target_profile_limitations`
- The backend runner must validate and save `target_profile` before Target Profile Forensics begins.

Forbidden Target Profile Review combined shape:

```json
{
  "target_profile": {},
  "target_profile_forensics": {}
}
```

That shape incorrectly mixes material and forensic artifacts into one backend call.

---

## Target Profile Forensics required response shape

For the Target Profile Forensics save event, consume the saved `target_profile` artifact and return exactly one plain top-level JSON object:

```json
{
  "target_profile_forensics": {}
}
```

Rules:

- The top-level value must be an object, not an array.
- Do not wrap the object inside `phase_output`, `output`, `result`, `data`, an internal job label, or a compatibility module label.
- Do not return `[ { "target_profile_forensics": {} } ]`.
- Do not re-emit `target_profile` in the Target Profile Forensics response.
- `target_profile_forensics` must be separate from `target_profile`.
- `target_profile_forensics` must contain the forensic/provenance branches required by the active validator.
- The forensic ledger branches must be JSON arrays, never summary objects.
- The backend runner must validate and save `target_profile_forensics` before Activity Profile Review may begin.

---

## Activity Profile Review required response shapes

Activity Profile Review has deterministic inventory, material, and forensic save events. They are separate.

### Activity candidate inventory response shape

Return exactly one plain top-level JSON object:

```json
{
  "feature_candidate_inventory": {}
}
```

### Activity Profile Review material response shape

Return exactly one plain top-level JSON object:

```json
{
  "target_feature_profile": {}
}
```

Rules:

- The top-level value must be an object, not an array.
- Do not wrap the object inside `phase_output`, `output`, `result`, `data`, an internal job label, or a compatibility module label.
- Do not return `[ { "target_feature_profile": {} } ]`.
- Do not include `target_feature_profile_forensics` in the material response.
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
- Every emitted activity must use the locked activity-card schema.
- The backend runner must validate and save `target_feature_profile` before Activity Profile Forensics begins.

### Activity Profile Forensics response shape

Return exactly one plain top-level JSON object:

```json
{
  "target_feature_profile_forensics": {}
}
```

Rules:

- The top-level value must be an object, not an array.
- Do not wrap the object inside `phase_output`, `output`, `result`, `data`, an internal job label, or a compatibility module label.
- Do not return `[ { "target_feature_profile_forensics": {} } ]`.
- Do not re-emit `target_feature_profile` in the forensic response.
- `target_feature_profile_forensics` must be separate from `target_feature_profile`.
- The backend runner must validate and save `target_feature_profile_forensics` before Data Provenance Profile may begin.

---

## Global forbidden backend response shapes

This package must not return any combined production backend shape that includes artifacts from more than one save event.

Forbidden examples:

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

If older package text conflicts with this file, this file controls for backend execution.
