# BACKEND CANONICAL OUTPUT ADAPTER — AGENT 4 / M10

This adapter is loaded last in backend execution and controls the executable output root names for the current artifact backend.

## Canonical Backend Artifact

Return exactly one top-level JSON artifact:

```json
{
  "data_provenance_profile": {}
}
```

## Alias Reconciliation

The older package wording `target_data_provenance_profile` means the backend canonical artifact `data_provenance_profile`.
Do not emit `target_data_provenance_profile` in backend execution.
Do not emit `target_data_provenance_profile_forensics` or `data_provenance_profile_forensics` unless the phase contract explicitly lists that artifact in `required_output_artifacts`.

## Stop Rule

After emitting `data_provenance_profile`, stop. Do not emit M11, M12, compiler, renderer, report prose, terminal receipt text, or compatibility wrappers.
