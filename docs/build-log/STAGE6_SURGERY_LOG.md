# Stage 6 Surgical Build Log

Base state before surgery:
- Last known Stage 6B build commit: `2b45bc92dd8c6f0c47033bc86f3d6a5395903725`
- Problem found in runtime audit: Stage 6A canonical maps were hollow while legacy Stage 6 fields carried most of the useful content.

Locked surgical doctrine:
- Stage 6A = Legal Cartography.
- Stage 6B = Data Provenance.
- Stage 6I = Integrated Stage 6 handoff to Stage 7.
- Deterministic code should create the document/source/section spine.
- The model should classify only controlled semantic fields.
- Legacy Stage 6 fields must be removed from active canonical output during 6A contraction.
- Stage 6A and Stage 6B must have separate audit namespaces and cache artifacts.
- Do not touch Stage 4, Stage 5, Stage 7, Stage 9, Stage 10, Vault, UI, registry planner, priority planner, or adapters unless explicitly discussed.

## 6A.R0 — Nomenclature and audit split

Goal:
- Add separate audit script names for Stage 6A and Stage 6B.
- Add separate cache artifact names.
- Avoid changing model behavior, schema, prompt, guardrail, adapters, Stage 7, or deployment.

Commits in this layer:
- `61f591ea0f04cc235519db735fa84ef82f95fbcb` — added `e2e:stage6a:legal-cartography` and `e2e:stage6b:data-provenance` script names in `runtime-api/package.json`.
- `54725f82e83e96f653a84de00fbecde839ad5333` — added `runtime-api/scripts/e2e-stage6a-legal-cartography.mjs` wrapper.
- `0dffa9b5d957d6723cce14f84516513d3cc7ec28` — added `runtime-api/scripts/e2e-stage6b-data-provenance.mjs` wrapper.

Files changed:
- `runtime-api/package.json`
- `runtime-api/scripts/e2e-stage6a-legal-cartography.mjs`
- `runtime-api/scripts/e2e-stage6b-data-provenance.mjs`
- `docs/build-log/STAGE6_SURGERY_LOG.md`

Audit status:
- Static audit only. This layer intentionally does not change runtime behavior.
- New wrappers call the existing Stage 6 runtime audit with separate `STAGE6_AUDIT_MODE` and cache paths.

Next layer:
- 6A.R1 — Contract Stage 6A output to canonical legal cartography only.
