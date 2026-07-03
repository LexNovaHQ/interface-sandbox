# BACKEND CANONICAL OUTPUT ADAPTER — AGENT 4 / M10

This adapter is loaded last in backend execution and controls the executable output root names for the current artifact backend.

Agent 4 / M10 has two backend phases. Each phase returns exactly one top-level JSON artifact. Do not combine the material artifact and forensic artifact in one response.

## Phase 1 — M10 material artifact

When `RUNTIME_PACKET.phase_name` is `M10` and `required_output_artifacts` lists `data_provenance_profile`, return exactly one top-level JSON artifact:

```json
{
  "data_provenance_profile": {}
}
```

Rules:

- `data_provenance_profile` is the only allowed top-level artifact in the `M10` material phase.
- `target_data_provenance_profile` is not a valid backend root.
- `data_provenance_profile_forensics` belongs only to the later `M10_FORENSICS` phase.
- After the material artifact is returned, stop.

## Phase 2 — M10 forensic artifact

When `RUNTIME_PACKET.phase_name` is `M10_FORENSICS` and `required_output_artifacts` lists `data_provenance_profile_forensics`, first consume the saved `data_provenance_profile` from `upstream_artifacts`, then return exactly one top-level JSON artifact:

```json
{
  "data_provenance_profile_forensics": {}
}
```

Rules:

- `data_provenance_profile_forensics` is the only allowed top-level artifact in the `M10_FORENSICS` phase.
- The forensic phase must not re-send the material artifact.
- `target_data_provenance_profile_forensics` is not a valid backend root.
- After the forensic artifact is returned, stop.

## Alias Reconciliation

Older wording that refers to `target_data_provenance_profile` resolves to the canonical backend root `data_provenance_profile`.

Older wording that refers to `target_data_provenance_profile_forensics` resolves to the canonical backend root `data_provenance_profile_forensics`.

Legacy alias roots are not valid production backend output keys.

## Stop Rule

After returning the required M10 artifact for the active phase, stop. Do not return M11, M12, compiler, renderer, report prose, terminal receipt text, markdown, phase-output wrappers, or compatibility wrappers.
