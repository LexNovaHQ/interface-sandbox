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
