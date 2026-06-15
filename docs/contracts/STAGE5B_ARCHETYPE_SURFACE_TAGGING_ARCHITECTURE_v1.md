# STAGE5B_ARCHETYPE_SURFACE_TAGGING_ARCHITECTURE_v1

## Status

Approved architecture for Batch 3 build.

## Purpose

Stage 5B is the controlled taxonomy adjudication lane for Stage 5. It consumes Stage 5A admitted product functions and assigns controlled archetype/surface routing signals for later deterministic assembly and Stage 7 routing.

Stage 5B does not decide whether a feature exists. Stage 5A already made product-function admission. Stage 5B must preserve every 5A function.

## Inputs

Stage 5B receives:

- `stage5a_feature_package`
- `stage5a_product_function_mapping`
- `lossless_source_index`
- Registry Key runtime vocabulary
- Stage 5B instruction packet
- Routing plan
- Integration ports

## Outputs

Stage 5B emits:

- `stage5b_archetype_surface_tagging`
- `stage5b_tag_package`
- `stage5b_validation`
- `stage5b_forensic_artifact`

## Authority

Registry Key runtime is the source of truth for controlled archetype codes, archetype labels, surface tokens, and subcategory codes.

The model may choose only from the controlled taxonomy slice supplied at runtime.

## Scope

Stage 5B owns:

- `primary_archetype_code`
- `secondary_archetype_codes`
- `archetype_codes`
- `archetype_labels`
- `archetype_provenance`
- `surface_tokens`
- `surface_provenance`
- `triggering_status`
- `triggering_reason`
- `autonomy_level`
- `human_review_signal`
- `external_action_signal`
- `tagging_confidence`
- `tagging_gaps`

Stage 5B does not own:

- feature existence
- product-function admission
- final `feature_inventory`
- data provenance
- registry threat IDs
- legal exposure findings
- Stage 7 final status
- Stage 9 report findings

## Operating Rule

One 5B row must exist for every 5A feature.

If 5B cannot classify a feature, it must emit a visible `TAGGING_FAILURE` row. It must not delete the feature or fake `UNI`.

## Multiple Archetype Rule

Each function must have one `primary_archetype_code`.

Secondary archetypes are allowed only when behavior is materially distinct and evidence-backed.

Every archetype must carry provenance or an explicit gap.

## Artifacts

Expected standalone artifacts:

- `stage5-5b-input.json`
- `stage5-5b-taxonomy-slice.json`
- `stage5-5b-signal-seed.json`
- `stage5-5b-instruction-packet.json`
- `stage5-5b-prompt-preview.json`
- `stage5-5b-tags.json`
- `stage5-5b-validation.json`
- `stage5-5b-tag-package.json`
- `stage5-5b-forensic.json`
- `stage5-5b-token-usage.json`

## Non-Goals

No live pipeline replacement.

No 5C/5D/5E.

No final target profile assembly.

No deploy.
