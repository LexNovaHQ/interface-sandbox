# Stage 6A Intelligence Surgery Log

Purpose: track the bounded model-intelligence layer added after deterministic Stage 6A spine work.

## Restore anchors

- Pre-6A surgery base: `2b45bc92dd8c6f0c47033bc86f3d6a5395903725`
- Pre-intelligence layer anchor: `533f5434d65f57eb943ab4569779698c6ea1e297` (`Add Stage 6A cartography merge helper`)

## Locked doctrine

- Deterministic code creates document, section, source, and locator facts.
- Model intelligence classifies controlled semantic fields only.
- Model may not create document IDs, section IDs, source refs, source URLs, or locators.
- Model may not output quotes, prose analysis, legal conclusions, registry statuses, Vault fields, reports, or HTML.
- Deterministic normalizer validates, repairs, or drops model overlay rows before merge.
- Final Stage 6A remains separate from Stage 6B and Stage 7.

## 6A.R4.1 — Intelligence input packet builder

Commit:
- `b524e76ce8179ecb0b34e0bbe5fe437e4cc641a7` — `runtime-api/src/diligence/stage6aModelOverlayPacketBuilder.js`

Audit:
- Static pass.
- Builds `stage6a_model_overlay_packet_v1` from deterministic cartography seeds.
- Provides bounded text windows for model classification only.
- Includes allowed enums and explicit instruction boundary.
- Does not wire runtime.

## 6A.R4.2 — Bounded model overlay schema

Commit:
- `58ac47456490d21f0d6816f907993b804b90c4d0` — `data/schemas/stage6aModelOverlay.schema.json`

Audit:
- Static pass.
- Intermediate schema only; not final Stage 6A output.
- Requires overlay arrays for section classification, document relationship, document control, document mismatch, feature-section mapping, and limitations.
- Uses enum-controlled fields and `additionalProperties: false`.
- No quote/prose/legal-conclusion fields.

## 6A.R4.3 — Bounded model overlay prompt

Commits:
- `e33ac346606dcf3ce968e431854a8684fc25ad74` — `functions/_prompts/diligence-v2/03A_MODEL_LEGAL_CARTOGRAPHY_OVERLAY.prompt.md`
- `0f66535238ae462aa436d8c1b0306e81c882a602` — `functions/_prompts/diligence-v2/PROMPT_INDEX.md`

Audit:
- Static pass.
- Prompt says the model only classifies deterministic seeds.
- Prompt forbids creating documents, sections, source records, source locators, registry threat evaluation, and legal advice.
- Prompt output is limited to `stage6a_model_overlay_v1`.
- Prompt requires existing IDs and controlled values only.

## 6A.R4.4 — Overlay normalizer

Commit:
- `36ca2208712dddc6d0ad3c6804ae5f699272a6d9` — `runtime-api/src/diligence/stage6aModelOverlayNormalizer.js`

Audit:
- Static pass.
- Reconstructs overlay field-by-field.
- Drops unknown document/section/feature/source/control refs.
- Filters invalid enum arrays and converts invalid enum scalars to `unknown`.
- Records repairs.
- Runtime still not wired.

## 6A.R4.5 — Merge normalized overlay into canonical cartography

Commit:
- `19b79f29064c91f288321123b2ec7c3256441fc4` — `runtime-api/src/diligence/stage6aLegalCartographyMerge.js`

Audit:
- Static pass.
- Applies overlay to existing section rows only.
- Builds control signals from deterministic seed plus overlay rows.
- Builds relationship, mismatch, feature-section, and control-family indexes from normalized overlay rows.
- Still returns canonical 6A without legacy fields and without 6B fields.
- Runtime still not wired.

## 6A.R4.6 — Isolated model overlay runner

Commit:
- `1b5b6b976779c09f4b6b9ff18ad622644c0817c2` — `runtime-api/src/diligence/stage6aModelOverlayRunner.js`

Audit:
- Static pass.
- Runner accepts explicit prompt text and Stage 6A input.
- Runner builds packet, calls Gemini through the existing pool, normalizes model output, and merges into canonical cartography.
- Runner returns packet/model/cartography summaries for later audit.
- Runner is isolated and not wired into active Stage 6 route, adapter, guardrail, Stage 7, deploy, or live runtime.

## 6A.R6 — Static intelligence path audit

Commits:
- `7e3177ca57e7b3923020d8ff465211b457409002` — `runtime-api/scripts/audit-stage6a-intelligence-path.mjs`
- `0e768abd32b1104a4c26f64174e621b1b6c3a55f` — added `audit:stage6a:intelligence` script name.
- `5ccf8517c6c5b04d57e3e86dd7a15342fe527b6f` — repaired accidental dependency drift so only the script addition remains.

Audit:
- Static file audit pass.
- Script exercises deterministic packet builder, overlay normalizer, and canonical merge with synthetic source/feature input.
- Script asserts inventory, section index, control map, feature-section index, control-family index, and locator index are populated.
- Script asserts legacy Stage 6 fields and 6B fields do not leak into canonical 6A.
- Script is local/CI only and does not call Gemini.

## Current active-runtime status

- Active Stage 6 runtime behavior is intentionally unchanged.
- No adapter touched.
- No Stage 7 touched.
- No Stage 9/10/Vault/UI touched.
- No deployment performed.

## Next layer

6A.R6.1 — Run/verify the static intelligence audit in CI/local context if possible, then 6A.R7 can wire the isolated 6A path into a dedicated audit route/script before any live Stage 6 replacement.

## 6A.R7 - Canonical runtime wiring and live audit separation

Base HEAD before patch:
- `7f1f089c810bdceec83e289bbd392274fd7d41f5` (`Track Stage 6A intelligence static audit layer`)

Scope:
- Expose `runStage6ALegalCartography(...)` as the canonical Stage 6A runtime function.
- Add first-class runtime stage ID `stage6a_legal_cartography`.
- Replace the fake Stage 6A wrapper audit with a real Stage 6A audit that calls the canonical runtime path locally or the deployed runtime route in live mode.
- Separate Stage 6B from Stage 6A by making the 6B audit explicit/not-yet-canonical instead of importing the integrated legacy Stage 6 audit.
- Preserve legacy Stage 6 under `e2e:stage6:legal` and add `e2e:stage6:legacy`.
- Add Stage 6A to the live runtime audit workflow after Stage 5 cache generation.

Files changed:
- `.github/workflows/runtime-stage4-stage5-audit.yml`
- `functions/_generated/diligencePromptBundle.js`
- `functions/_generated/diligenceSchemaBundle.js`
- `functions/_generated/diligenceValidatorBundle.js`
- `runtime-api/package.json`
- `runtime-api/scripts/e2e-stage6a-legal-cartography.mjs`
- `runtime-api/scripts/e2e-stage6b-data-provenance.mjs`
- `runtime-api/src/diligence/stage6aModelOverlayRunner.js`
- `runtime-api/src/diligence/stageConfigs.js`
- `runtime-api/src/diligence/stageRunnerLocked.js`
- `scripts/generate-diligence-prompt-bundle.mjs`
- `scripts/generate-diligence-validator-bundle.mjs`
- `src/lib/schemas.js`
- `docs/build-log/STAGE6A_INTELLIGENCE_SURGERY_LOG.md`
- `docs/build-log/STAGE6_SURGERY_LOG.md`

What changed:
- Runtime dispatcher now accepts `stage6a_legal_cartography` and validates against `stage6aLegalCartography`.
- The dispatcher uses the same canonical function as the audit path; Stage 6A no longer proves itself by importing legacy Stage 6.
- The Stage 6A audit writes `.runtime-e2e-cache/stage6a-legal-cartography.json`.
- Stage 6A audit fails on legacy fields, 6B fields, report/Vault/registry/conclusion fields, missing source locators, missing control signals, and missing feature-to-section rows when Stage 5 features exist.
- Stage 6A audit prints legal cartography counts, model overlay row counts, and normalizer repair/drop counts.
- Stage 6B audit no longer imports Stage 6A or old integrated Stage 6; it fails explicitly until canonical 6B exists.
- Prompt/schema/validator bundles were regenerated so the runtime can resolve Stage 6A schema and prompt metadata.
- Validator generator gained an ESM `createRequire` shim because the added Stage 6A schemas cause AJV standalone output to emit helper `require(...)` calls under the repo's ESM package mode.

Intentionally not touched:
- Stage 4 logic.
- Stage 5 logic.
- Stage 7 prompt/schema/adapter/planner.
- Stage 9/10.
- Vault.
- UI/product pages.
- `legalStackReviewInputAdapter.js`.
- `registryLedgerInputAdapter.js`.

Validation:
- `npm run build:runtime` from repo root: pass.
- `npm run audit:stage6a:intelligence` from `runtime-api`: pass.
- `npm run check` from `runtime-api`: pass after copying generated bundles into `runtime-api/functions/_generated`, matching the GitHub workflow layout.
- `runDiligenceStage({ stageId: "stage6a_legal_cartography", options: { disableModelOverlay: true } })`: pass; validates against generated `stage6aLegalCartography` schema.
- `npm run e2e:stage4:company` from `runtime-api`: blocked locally because `RUNTIME_ACCESS_TOKEN` was not present in this shell.
- `npm run e2e:stage5:features`: not run locally because Stage 4 cache could not be generated without `RUNTIME_ACCESS_TOKEN`.
- `npm run e2e:stage6a:legal-cartography`: not run locally because Stage 5 cache could not be generated without `RUNTIME_ACCESS_TOKEN`; the GitHub live audit workflow now runs it against deployed runtime after Stage 5.

Static Stage 6A audit counts:
- `document_inventory_seed_count`: 2
- `section_index_seed_count`: 6
- `deterministic_control_seed_count`: 13
- `feature_ref_count`: 1
- `legal_document_inventory_count`: 2
- `legal_document_index_count`: 6
- `document_control_signal_map_count`: 13
- `feature_to_document_section_index_count`: 1
- `control_family_index_count`: 7
- `document_source_locator_index_count`: 6
- `normalizer repair_count`: 1

Deployment/live audit:
- Pending post-push. Live proof is the updated GitHub workflow `Runtime Stage 4 and Stage 5 Audit`, which now runs `npm run e2e:stage6a:legal-cartography` with `STAGE6A_AUDIT_TARGET=remote`.

Restore command:
- `git reset --hard 7f1f089c810bdceec83e289bbd392274fd7d41f5`

## 6.CANON.R1 - Stage 6A absorbed into canonical Stage 6

Base HEAD before patch:
- `233fe9f687c94c6c1201dec4ebd3c6b8a66b565e`

Status:
- Stage 6A no longer has an independent schema authority.
- The old model overlay schema/prompt dialect is retired as an independent authority.
- Stage 6A now emits through the single `stage6Review` schema with `stage6_component: "stage6a_legal_document_cartography"`.
- Stage 6A semantic classification uses canonical vocabulary from `stage6CanonicalVocabulary.js`.
- Legacy Stage 6A audit scripts are disabled until rebuilt from `DILIGENCE_CANONICAL_SPINE_v1.md` and `stage6Review.schema.json`.

Validation:
- `npm.cmd run build:runtime`: pass.
- Deterministic Stage 6A schema smoke: pass against generated `stage6Review` validator.
- `npm.cmd run check` in `runtime-api`: pass after temporary local generated-bundle copy.

Disabled until rebuild:
- Static Stage 6A intelligence audit.
- Stage 6A live E2E audit.
- Stage 6B placeholder E2E.
- Legacy Stage 6 legal-stack E2E.

Restore command:
- `git reset --hard 233fe9f687c94c6c1201dec4ebd3c6b8a66b565e`
