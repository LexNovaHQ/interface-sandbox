# Legacy Stage 5 Parking Notice

Status: PARKED DURING CANONICAL REBUILD

The old Stage 5 Batch 2/3/4/5/6 chain remains in the repository only for historical reference and selective migration of useful controlled values or schema mapping logic.

It must not control evidence flow in the canonical Stage 5 runtime.

## Parked legacy pattern

The following old pattern is parked:

```text
connector -> adapter -> source normalizer -> source index -> candidate packet -> prompt packet -> package builder
```

Reason: the pattern allowed metadata/index records to compete with full lossless source custody and allowed full source text to be renamed or dropped before model execution.

## Canonical replacement pattern

```text
Stage 3 routed full lossless source
  -> stage5.runtime.js custody assertion
  -> substage runtime creates verbatim windows
  -> substage output cites source windows
  -> final integrator validates custody chain
```

## Legacy components may be reused only if

1. logic is moved into one of the three canonical files for the relevant stage/substage;
2. the logic does not normalize, hydrate, summarize, truncate, rename, or replace `clean_text_lossless`;
3. the logic treats metadata and indexes as reference only;
4. the logic is covered by the canonical Stage 5 e2e tests.

## Legacy components may not

- create primary evidence;
- create source windows;
- dedupe away a full text source;
- treat metadata as source;
- treat index refs as evidence;
- provide fallback after canonical validation fails;
- remain wired into live runtime after the canonical cutover.

## Current canonical files

```text
stage5.prompt.js
stage5.runtime.js
stage5.dictionary.js
5a/5a.prompt.js
5a/5a.runtime.js
5a/5a.dictionary.js
5b/5b.prompt.js
5b/5b.runtime.js
5b/5b.dictionary.js
5c/5c.prompt.js
5c/5c.runtime.js
5c/5c.dictionary.js
5d/5d.prompt.js
5d/5d.runtime.js
5d/5d.dictionary.js
```

The canonical runtime is not live-wired by this notice. Live cutover happens only after canonical 5A-5D e2e and Stage 6 handoff smoke pass.
