# BACKEND CANONICAL OUTPUT ADAPTER — AGENT 4 / M10

This adapter is loaded last in backend execution and controls the executable output root names for the current artifact backend.

Agent 4 / M10 has two backend phases. Each phase returns exactly one top-level JSON artifact. Do not combine the material artifact and forensic artifact in one response.

## Phase 1 â€” M10 material artifact

When `RUNTIME_PACKET.phase_name` is `M10` and `required_output_artifacts` lists `data_provenance_profile`, return exactly one top-level JSON artifact:

```json
{
  "data_provenance_profile": {}
}
```

Rules:

- Do not emit `data_provenance_profile` in backend execution.
- Do not emit `data_provenance_profile_forensics` in the `M10` material phase.
- After emitting `data_provenance_profile`, stop.

## Phase 2 â€” M10 forensic artifact

When `RUNTIME_PACKET.phase_name` is `M10_FORENSICS` and `required_output_artifacts` lists `data_provenance_profile_forensics`, first consume the saved `data_provenance_profile` from `upstream_artifacts`, then return exactly one top-level JSON artifact:

```json
{
  "data_provenance_profile_forensics": {}
}
```

Rules:

- Do not re-emit `data_provenance_profile` in the forensic phase.
- Do not emit `data_provenance_profile_forensics` in backend execution.
- After emitting `data_provenance_profile_forensics`, stop.

## Alias Reconciliation

The older package wording `data_provenance_profile` means the backend canonical artifact `data_provenance_profile`.
The older package wording `data_provenance_profile_forensics` means the backend canonical artifact `data_provenance_profile_forensics`.
Do not emit `data_provenance_profile` in backend execution.
Do not emit either M10 forensic root unless the phase contract explicitly lists `data_provenance_profile_forensics` in `required_output_artifacts`.

## Stop Rule

After emitting the required M10 artifact for the active phase, stop. Do not emit M11, M12, compiler, renderer, report prose, terminal receipt text, markdown, phase-output wrappers, or compatibility wrappers.
