# BACKEND CANONICAL OUTPUT ADAPTER — AGENT 5 / M11

This adapter is loaded last in backend execution and controls the executable output root names for the current artifact backend.

## Canonical Backend Artifact

Return exactly one top-level JSON artifact:

```json
{
  "exposure_registry_profile": {}
}
```

## Alias Reconciliation

The older package wording `target_exposure_profile` means the backend canonical artifact `exposure_registry_profile`.
Do not emit `target_exposure_profile` in backend execution.
Do not emit `target_exposure_profile_forensics` or `exposure_registry_profile_forensics` unless the phase contract explicitly lists that artifact in `required_output_artifacts`.

## Material Emission Rule

`exposure_registry_profile` must contain every final TRIGGERED and CONTROLLED row supported by the registry evaluation. Do not suppress controlled rows into summaries only. Do not mark UNI rows as not applicable.

## Stop Rule

After emitting `exposure_registry_profile`, stop. Do not emit M12, compiler, renderer, report prose, terminal receipt text, or compatibility wrappers.
