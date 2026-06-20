# Legacy Stage 5A Parking Notice

Canonical Stage 5A is now owned by exactly three files:

```text
5a.runtime.js
5a.prompt.js
5a.dictionary.js
```

The legacy Stage 5A chain is parked. These files must not be treated as authoritative evidence flow components during the canonical rebuild:

```text
stage5aProductFamilyInputAdapter.js
stage5aLosslessSourceIndexBuilder.js
stage5aDeterministicCandidatePoolBuilder.js
stage5aInstructionBuilder.js
stage5aPromptBuilder.js
stage5aProductFunctionMapper.js
stage5aOutputNormalizer.js
stage5aValidator.js
stage5aFeaturePackageBuilder.js
stage5aForensicBuilder.js
stage5aIndex.js
../stage5aPipelineConnector.js
```

## Parking Rule

Legacy logic may be reused only if moved into the canonical three-file shape and only if it obeys the lossless evidence rule.

Allowed reuse:

```text
controlled vocabulary
pattern hints
validation ideas
forensic field names
```

Forbidden reuse:

```text
normalizing source text
hydrating source text
renaming clean_text_lossless to clean_text
using metadata as evidence
using index refs as evidence
first-seen dedupe between metadata and full text
building model prompts without verbatim feature windows
```

## Phase 4 Canonical 5A Rule

5A receives full product-family lossless source custody from Stage 5 runtime.

5A runtime creates verbatim feature evidence windows from `clean_text_lossless`.

5A admitted functions must cite those windows.

5A hands those verbatim feature evidence windows to 5B.

If 5A cannot create an admitted function with valid source-window refs, it blocks.
