# LEGACY STAGE 5C / 5D PARKING NOTICE

Status: RETIRED / PARKED

Canonical Phase 6 merged old Stage 5C and old Stage 5D into the new Stage 5C Complete Feature Record Builder.

Canonical files now owning this responsibility:

```text
runtime-api/src/diligence/stage5/5c/5c.runtime.js
runtime-api/src/diligence/stage5/5c/5c.prompt.js
runtime-api/src/diligence/stage5/5c/5c.dictionary.js
```

Old Stage 5C responsibility:

```text
canonical feature inventory row shaping
```

Old Stage 5D responsibility:

```text
feature-level data touchpoint extraction
```

Both now belong to canonical 5C because a feature record is incomplete without input/action/output mechanics, archetype/surface tags, data touchpoints, data provenance, not-evidenced signals, and source-window evidence.

## Parked legacy 5C components

```text
stage5cPipelineConnector.js
5c/stage5cInputJoiner.js
5c/stage5cCanonicalDraftBuilder.js
5c/stage5cCompletenessAnalyzer.js
5c/stage5cCanonicalizationInstructionBuilder.js
5c/stage5cCanonicalizationPromptBuilder.js
5c/stage5cCanonicalizationAdjudicator.js
5c/stage5cOutputMerger.js
5c/stage5cValidator.js
5c/stage5cFeatureInventoryPackageBuilder.js
5c/stage5cForensicBuilder.js
5c/stage5cIndex.js
scripts/e2e-stage5c-feature-inventory.mjs
docs/contracts/STAGE5C_CANONICAL_FEATURE_INVENTORY_ARCHITECTURE_v1.md
```

## Parked legacy 5D components

```text
stage5dPipelineConnector.js
5d/stage5dInputJoiner.js
5d/stage5dFeatureContextBuilder.js
5d/stage5dDeterministicDataSignalBuilder.js
5d/stage5dInstructionBuilder.js
5d/stage5dPromptBuilder.js
5d/stage5dDataTouchpointExtractor.js
5d/stage5dOutputNormalizer.js
5d/stage5dValidator.js
5d/stage5dDataTouchpointPackageBuilder.js
5d/stage5dForensicBuilder.js
5d/stage5dIndex.js
scripts/e2e-stage5d-data-touchpoints.mjs
docs/contracts/STAGE5D_FEATURE_DATA_TOUCHPOINT_ARCHITECTURE_v1.md
```

## Reuse rule

Legacy code may be reused only if moved into one of the three canonical 5C files and only if it obeys the canonical evidence rule:

```text
full clean_text_lossless remains primary evidence;
5A/5B/5C source windows are verbatim slices with offsets and hashes;
metadata and index are reference/navigation only;
no normalization, hydration, summary, placeholder evidence, or ref-only data extraction.
```
