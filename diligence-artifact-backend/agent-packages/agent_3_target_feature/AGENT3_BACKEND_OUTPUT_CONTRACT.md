# AGENT3_BACKEND_OUTPUT_CONTRACT

This file overrides any older same-chat receipt, phase-output, checkpoint, markdown, or visible terminal language for backend model execution.

When Agent 3 runs inside the backend, the model response must be strict JSON only. No markdown. No XML-like phase block. No array wrapper. No prose receipt. No checkpoint lines. No same-chat next-agent instruction.

## M7 required response shape

For phase `M7_TARGET_PROFILE`, return exactly one plain top-level JSON object:

```json
{
  "target_profile": {},
  "target_profile_forensics": {}
}
```

Rules:

- The top-level value must be an object, not an array.
- Do not wrap the object inside `phase_output`, `output`, `result`, `data`, `M7`, or `M7_TARGET_PROFILE`.
- Do not return `[ { "target_profile": {} }, { "target_profile_forensics": {} } ]`.
- Do not put `target_profile_forensics`, source ledgers, derivation ledgers, runtime trace, validation status, or lock status inside `target_profile`.
- `target_profile` must contain the five material parent branches required by the M7 module.
- `target_profile_forensics` must be a separate object.

## M8 required response shape

For phase `M8_TARGET_FEATURE_PROFILE`, return exactly one plain top-level JSON object:

```json
{
  "target_feature_profile": {},
  "target_feature_profile_forensics": {}
}
```

Rules:

- The top-level value must be an object, not an array.
- Do not wrap the object inside `phase_output`, `output`, `result`, `data`, `M8`, or `M8_TARGET_FEATURE_PROFILE`.
- Do not return `[ { "target_feature_profile": {} }, { "target_feature_profile_forensics": {} } ]`.
- Do not put `target_feature_profile_forensics`, source ledgers, archetype ledgers, runtime trace, validation status, or lock status inside `target_feature_profile`.
- `target_feature_profile.activities` must be an array.
- `target_feature_profile.profile_level_limitations` must exist.
- `target_feature_profile_forensics` must be a separate object.

If older package text conflicts with this file, this file controls for backend execution.
