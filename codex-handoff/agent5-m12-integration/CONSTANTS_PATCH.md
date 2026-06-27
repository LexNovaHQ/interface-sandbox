# CONSTANTS PATCH SPEC

File: `diligence-artifact-backend/src/constants.js`

Goal: move active M12 ownership into Agent 5 without touching compiler/renderer.

## Required changes

1. In `WRITE_PERMISSIONS`, update `agent_5_exposure_registry` to include:

```js
ART.exposureBatchValidationPattern,
ART.challenge
```

So Agent 5 write permissions become conceptually:

```js
[AGENT_IDS.a5]: [
  ART.exposureRoutePlan,
  ART.exposureBatchPattern,
  ART.exposureBatchValidationPattern,
  ART.exposureWorkpad,
  ART.exposureControlled,
  ART.exposureTriggered,
  ART.exposureForensics,
  ART.challenge
]
```

2. In `READ_PERMISSIONS`, update `agent_5_exposure_registry` to include:

```js
ART.exposureForensics,
ART.challenge
```

Conceptual final Agent 5 read list must include:

```js
[AGENT_IDS.a5]: [
  ART.sourceHandoff,
  ART.legalIndex,
  ART.targetMain,
  ART.targetForensics,
  ART.featureMain,
  ART.featureForensics,
  ART.dataMain,
  ART.dataForensics,
  ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES,
  ART.exposureRoutePlan,
  ART.exposureBatchPattern,
  ART.exposureBatchValidationPattern,
  ART.exposureWorkpad,
  ART.exposureControlled,
  ART.exposureTriggered,
  ART.exposureForensics,
  ART.challenge
]
```

3. It is acceptable to leave `agent_7_m12` constants in place temporarily for backward compatibility, but phase contracts must not use `agent_7_m12` after this patch.

4. Do not modify compiler or renderer permissions.

## Validation

After patching, these must pass:

```js
assertCanWriteArtifact("agent_5_exposure_registry", "challenge_gate")
assertCanWriteArtifact("agent_5_exposure_registry", "exposure_registry_batch_validation__UNI__001")
assertCanReadArtifact("agent_5_exposure_registry", "exposure_registry_profile_forensics")
```
