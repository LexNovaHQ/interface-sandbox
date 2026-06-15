# STAGE5A_PRODUCT_FUNCTION_MAPPING_ARCHITECTURE_v1

Status: approved and locked.

## Purpose

Stage 5A is the hybrid product-function mapping lane for Stage 5. It receives the existing Stage 5 input rule without narrowing it: target profile plus product-family source package, lossless.

5A does not receive a pre-truncated prompt-only packet as its source truth. Efficiency comes from deterministic indexing, candidate pooling, and model routing, not from deleting the product-family source package.

## Core Doctrine

5A is not strict deterministic extraction. 5A is hybrid adjudication:

1. Runtime preserves target profile and product-family lossless source package.
2. Runtime builds a lossless source index.
3. Runtime builds a high-recall deterministic candidate pool.
4. Model decides admitted product functions from that candidate universe.
5. Model maps each admitted function to a core product name.
6. Runtime normalizes and validates the model output.
7. Runtime builds a 5B-ready feature package with source-lossless investigation refs.

## Model Job

The model must decide where deterministic extraction is likely to confuse:

- product name versus function,
- function versus product,
- product family versus atomic function,
- delivery channel versus product,
- API capability versus product,
- page label versus usable function.

The deterministic candidate pool is not truth. It is the candidate universe.

## Required 5A Outputs

5A emits two linked objects:

1. `stage5a_product_function_mapping`
2. `stage5a_feature_package`

The mapping object records the model admission decision. The feature package is the 5B handoff object.

## Required Function Fields

Every admitted product function must include:

- `function_id`
- `core_product_id`
- `core_product_name`
- `product_family_label`
- `function_name`
- `function_type`
- `primary_or_secondary`
- `commercial_function`
- `actor_or_user`
- `input_signal`
- `system_action`
- `output_or_result`
- `why_admitted`
- `why_not_product_only`
- `source_refs[]`
- `lossless_source_index_refs[]`
- `evidence_refs[]`
- `candidate_ids_used[]`
- `admission_confidence`

Many product functions may share one `core_product_name`.

## Candidate Disposition

Every deterministic candidate must receive one disposition:

- `ADMITTED_PRODUCT_FUNCTION`
- `CORE_PRODUCT_OR_PRODUCT_AREA`
- `DUPLICATE_OR_ALIAS`
- `DELIVERY_CHANNEL_SIGNAL`
- `ARCHITECTURE_SIGNAL`
- `DATA_SIGNAL`
- `COMMERCIAL_OUTCOME_ONLY`
- `INSUFFICIENT_FUNCTION_EVIDENCE`
- `OUT_OF_SCOPE_FOR_5A`

No deterministic candidate may disappear silently.

## Forbidden 5A Outputs

5A must not emit:

- final archetype codes,
- final surface tokens,
- registry row decisions,
- final exposure findings,
- final data provenance map,
- legal/governance conclusions.

## Handoff to 5B

5A must create `stage5a_feature_package.features_for_5b[]`.

Each 5B feature package row must include:

- product identity,
- function identity,
- mechanical input/action/output facts,
- source refs,
- lossless source index refs,
- evidence refs,
- candidate ids,
- nearby source context refs,
- model admission notes.

5B investigates this package. 5B does not re-run product-function admission.

## Implementation Boundary

5A files live under:

`runtime-api/src/diligence/stage5/5a/`

5A may import Batch 1 shared foundation files. It must not import live pipeline internals. Live Stage 5 wiring is not part of this batch.
