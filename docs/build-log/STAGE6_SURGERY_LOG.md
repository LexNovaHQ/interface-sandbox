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

## 6A.R3.5 — Deterministic control signal seed

Goal:
- Add a separate helper for deriving seed `document_control_signal_map[]` and `control_family_index[]` from deterministic section rows.
- Treat this helper as a deterministic seed/fallback only, not as the final model intelligence layer.
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
- This is deterministic seeding, not model intelligence.
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

## 6A.R4.1 — Intelligence input packet builder

Goal:
- Add a bounded model-overlay input packet builder.
- Give the model deterministic document/section/source seeds plus short text windows.
- Do not let the model create documents, sections, source refs, or locators.
- Do not wire model execution into runtime yet.
- Do not touch adapters, Stage 7, guardrails, or deployment.

Commits in this layer:
- `b524e76ce8179ecb0b34e0bbe5fe437e4cc641a7` — added `runtime-api/src/diligence/stage6aModelOverlayPacketBuilder.js`.

Files changed:
- `runtime-api/src/diligence/stage6aModelOverlayPacketBuilder.js`
- `docs/build-log/STAGE6_SURGERY_LOG.md`

Audit status:
- Static packet-builder audit passed.
- Packet builder exports `buildStage6AModelOverlayPacket()`.
- Packet uses deterministic canonical 6A seeds from `buildStage6ACartography()`.
- Packet includes `allowed_enums` for model classification boundaries.
- Packet includes bounded `nearby_text_window` for classification only; output remains quote-free later.
- Packet explicitly marks that the model may not create documents, sections, source refs, locators, quotes, or prose analysis.
- Runtime behavior is intentionally unchanged.

## 6A.R4.2 — Bounded model overlay schema

Goal:
- Add an intermediate schema for the model overlay only.
- Keep it separate from final Stage 6A output schema.
- Force the model overlay into controlled rows that reference existing deterministic IDs.
- Do not wire it into runtime yet.

Commits in this layer:
- `58ac47456490d21f0d6816f907993b804b90c4d0` — added `data/schemas/stage6aModelOverlay.schema.json`.

Files changed:
- `data/schemas/stage6aModelOverlay.schema.json`
- `docs/build-log/STAGE6_SURGERY_LOG.md`

Audit status:
- Static overlay-schema audit passed.
- Schema requires `stage6a_model_overlay_version`, section classification, document relationship, document control, document mismatch, feature-section overlay, and overlay limitations arrays.
- Schema uses `additionalProperties: false` at root and item levels.
- Schema contains enums for section functions, control families, relationship types, mismatch types, reference types, basis codes, signals, and confidence.
- Schema has no quote/prose/legal-conclusion fields.
- Runtime behavior is intentionally unchanged.

## 6A.R4.3 — Bounded model overlay prompt

Goal:
- Add a separate model prompt for Stage 6A overlay classification.
- Update the prompt index without changing the active Stage 6 prompt.
- Keep this prompt isolated until runtime overlay wiring.

Commits in this layer:
- `e33ac346606dcf3ce968e431854a8684fc25ad74` — added `functions/_prompts/diligence-v2/03A_MODEL_LEGAL_CARTOGRAPHY_OVERLAY.prompt.md`.
- `0f66535238ae462aa436d8c1b0306e81c882a602` — indexed the overlay prompt in `PROMPT_INDEX.md`.

Files changed:
- `functions/_prompts/diligence-v2/03A_MODEL_LEGAL_CARTOGRAPHY_OVERLAY.prompt.md`
- `functions/_prompts/diligence-v2/PROMPT_INDEX.md`
- `docs/build-log/STAGE6_SURGERY_LOG.md`

Audit status:
- Static overlay-prompt audit passed.
- Prompt states the model is only classifying deterministic Stage 6A seeds.
- Prompt forbids creating documents, sections, source records, source locators, registry threat evaluation, and legal advice.
- Prompt output is limited to `stage6a_model_overlay_v1` overlay arrays.
- Prompt forbids quote/prose/legal-conclusion/report fields.
- Prompt requires existing IDs and controlled enum values only.
- Runtime behavior is intentionally unchanged.

## 6A.R4.4 — Overlay normalizer

Goal:
- Add deterministic normalization and repair for model overlay rows.
- Enforce enum boundaries and existing-ID boundaries after model output.
- Strip/reject forbidden quote/prose/legal-conclusion fields.
- Do not wire it into runtime yet.

Commits in this layer:
- `36ca2208712dddc6d0ad3c6804ae5f699272a6d9` — added `runtime-api/src/diligence/stage6aModelOverlayNormalizer.js`.

Files changed:
- `runtime-api/src/diligence/stage6aModelOverlayNormalizer.js`
- `docs/build-log/STAGE6_SURGERY_LOG.md`

Audit status:
- Static normalizer audit passed.
- Normalizer reconstructs overlay objects field-by-field, so extra/prose keys cannot survive into normalized output.
- Normalizer drops rows that reference unknown sections, documents, features, source records, or control signals.
- Normalizer replaces invalid enum values with `unknown` or filters invalid enum arrays.
- Normalizer records repairs for forbidden keys and dropped rows.
- Runtime behavior is intentionally unchanged.

## 6A.R4.5 — Merge normalized model overlay into canonical 6A

Goal:
- Extend the canonical merge helper so normalized model overlay rows can enrich deterministic cartography.
- Keep deterministic spine as the source of truth for document, section, locator, and source refs.
- Keep deterministic control seed as fallback when no overlay is supplied.
- Do not wire model execution into runtime yet.

Commits in this layer:
- `19b79f29064c91f288321123b2ec7c3256441fc4` — updated `runtime-api/src/diligence/stage6aLegalCartographyMerge.js`.

Files changed:
- `runtime-api/src/diligence/stage6aLegalCartographyMerge.js`
- `docs/build-log/STAGE6_SURGERY_LOG.md`

Audit status:
- Static overlay-merge audit passed.
- Merge applies section classification overlay to existing section rows only.
- Merge builds control signals from deterministic seed plus normalized overlay rows.
- Merge creates relationship, mismatch, feature-section, and control-family indexes from normalized overlay rows.
- Merge still returns canonical 6A without legacy fields and without 6B fields.
- Runtime behavior is intentionally unchanged.

Blocked/remaining:
- The previous attempt to add a builder audit script was blocked by the GitHub write tool. No runtime/audit wiring was committed for that script.

Next layer:
- 6A.R4.6 — Add isolated model overlay runner/executor path, still not wired into active Stage 6 route.

## 6A.R7 - Canonical runtime wiring and live audit separation

Base HEAD before patch:
- `7f1f089c810bdceec83e289bbd392274fd7d41f5`

Layer:
- `6A.R7 - Canonical runtime wiring and live audit separation`

Summary:
- Stage 6A Legal Cartography is now a first-class runtime stage under `stage6a_legal_cartography`.
- Runtime and audit both call the same canonical `runStage6ALegalCartography(...)` function path.
- Stage 6A audit no longer imports the legacy integrated Stage 6 audit.
- Stage 6B audit is separated and explicitly not-yet-canonical instead of reusing Stage 6A or legacy Stage 6 as proof.
- Legacy Stage 6 remains available through `e2e:stage6:legal` and `e2e:stage6:legacy`.
- Live runtime audit workflow now runs `npm run e2e:stage6a:legal-cartography` after Stage 5.

Validation:
- `npm run build:runtime`: pass.
- `npm run audit:stage6a:intelligence`: pass.
- `npm run check` in `runtime-api`: pass after local copy of generated bundles to match workflow layout.
- Stage 4/5/6A remote E2E local run: blocked by missing `RUNTIME_ACCESS_TOKEN`; live GitHub audit is the required post-push proof.

Not touched:
- Stage 4/5 logic.
- Stage 7.
- Stage 9/10.
- Vault.
- UI/product pages.
- `legalStackReviewInputAdapter.js`.
- `registryLedgerInputAdapter.js`.

Restore command:
- `git reset --hard 7f1f089c810bdceec83e289bbd392274fd7d41f5`
