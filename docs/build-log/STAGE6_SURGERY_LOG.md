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
- Static audit passed. This layer intentionally does not change runtime behavior.
- New wrappers call the existing Stage 6 runtime audit with separate `STAGE6_AUDIT_MODE` and cache paths.

## 6A.R1 — Canonical 6A output contract

Goal:
- Add an isolated canonical Stage 6A schema and prompt contract.
- Do not wire it into runtime yet.
- Do not modify active Stage 6 schema, active Stage 6 prompt, guardrail, adapter, Stage 7, or deployment.

Commits in this layer:
- `bd0cc143fea16efb5d7f6947689fe2bb2df9e347` — added `data/schemas/stage6aLegalCartography.schema.json`.
- `38b800320857c0bc5873de7510e320b3c6736f74` — added `functions/_prompts/diligence-v2/03A_LEGAL_CARTOGRAPHY.prompt.md`.

Files changed:
- `data/schemas/stage6aLegalCartography.schema.json`
- `functions/_prompts/diligence-v2/03A_LEGAL_CARTOGRAPHY.prompt.md`
- `docs/build-log/STAGE6_SURGERY_LOG.md`

Audit status:
- Static contract audit passed.
- The Stage 6A schema has no active legacy fields: no `legal_stack`, `document_stack_redline`, `document_stack_synthesis`, `legal_stack_assessment`, or `limitations`.
- The Stage 6A schema has no 6B fields: no `data_provenance_profile`, `feature_to_data_flow_index`, or `data_signal_index`.
- The Stage 6A prompt contract explicitly forbids legacy fields and 6B fields.
- Runtime behavior is intentionally unchanged.

## 6A.R2 — Deterministic source inventory builder

Goal:
- Add a pure deterministic builder for Stage 6A document/source inventory.
- Do not wire it into runtime yet.
- Do not touch adapters.
- Preserve current active Stage 6 behavior while creating the deterministic spine module.

Commits in this layer:
- `e4dd0d727b5139dbc2c0a47e7417960c46f200fb` — added `runtime-api/src/diligence/stage6aLegalCartographyBuilder.js`.
- `59741f716a0d3ac992a50bb262b764310f4b1d23` — fixed status page classification in the builder.

Files changed:
- `runtime-api/src/diligence/stage6aLegalCartographyBuilder.js`
- `docs/build-log/STAGE6_SURGERY_LOG.md`

Audit status:
- Static source audit passed.
- Builder reads source records from raw source bundle, evidence junction packet, or Stage 6 adapter evidence/artifact inventories.
- Builder deterministically classifies admitted legal/governance sources into `legal_document_inventory[]`.
- Builder creates canonical `doc_id`, `doc_type`, `doc_family`, `source_record_ref`, `source_url`, and visibility/access statuses without model judgment.
- Builder does not modify active adapters or runtime execution.

## 6A.R3 — Deterministic section index and locator builder

Goal:
- Extend the pure deterministic builder to create section index rows and source locator rows from admitted source headings.
- Do not wire it into runtime yet.
- Do not touch adapters.

Commits in this layer:
- `8fbeea95d5b00c61d3dcf06dc217188f8cf57636` — added heading-derived `legal_document_index[]` and `document_source_locator_index[]` builders.
- `343668e7c3d63feeb1a44cc89cbf8b1305edf78c` — preserved source URLs in locator rows.

Files changed:
- `runtime-api/src/diligence/stage6aLegalCartographyBuilder.js`
- `docs/build-log/STAGE6_SURGERY_LOG.md`

Audit status:
- Static section-index audit passed.
- Section rows are deterministic from admitted source headings when headings are present.
- Source locator rows now retain source URLs from inventory.
- Builder still leaves control/mismatch/relationship maps empty pending the controlled classification overlay layer.
- Runtime behavior is intentionally unchanged.

## 6A.R4 — Deterministic control signal helper

Goal:
- Add a separate helper for deriving `document_control_signal_map[]` and `control_family_index[]` from deterministic section rows.
- Keep the helper isolated until the merge/wiring layer.
- Do not change runtime behavior yet.

Commits in this layer:
- `d00b5a06e1ad6d5ab9ba04fec918ba7cc464a9a8` — added `runtime-api/src/diligence/stage6aLegalControlSignalBuilder.js`.

Files changed:
- `runtime-api/src/diligence/stage6aLegalControlSignalBuilder.js`
- `docs/build-log/STAGE6_SURGERY_LOG.md`

Audit status:
- Static helper audit passed.
- Helper derives one controlled signal row per section/control-family pair.
- Helper groups control signals into `control_family_index[]`.
- Helper does not rely on model prose or evidence quotes.
- Runtime behavior is intentionally unchanged.

## 6A.R5 — Canonical Stage 6A merge helper

Goal:
- Add a canonical helper that merges the deterministic source/section spine with deterministic control signal grouping.
- Keep the helper isolated until active runtime wiring.

Commits in this layer:
- `533f5434d65f57eb943ab4569779698c6ea1e297` — added `runtime-api/src/diligence/stage6aLegalCartographyMerge.js`.

Files changed:
- `runtime-api/src/diligence/stage6aLegalCartographyMerge.js`
- `docs/build-log/STAGE6_SURGERY_LOG.md`

Audit status:
- Static merge audit passed.
- Merge helper returns canonical 6A output without legacy fields and without 6B fields.
- Runtime behavior is intentionally unchanged.

Blocked/remaining:
- Attempted to add a builder audit script, but the GitHub write tool blocked the file creation twice. No runtime/audit wiring was committed for that script.

Next layer:
- 6A.R6 — Add a smaller audit/wiring path that the GitHub tool accepts, then wire 6A into active runtime only after source-level audit passes.
