# 00_VALIDATOR_RULES_M8_FEATURE_INVENTORY_INDEX_ADDENDUM

This addendum governs the deterministic-led, semantic-supported Layer 1 inventory gate.

## 1. Inventory gate

`M8_FEATURE_CANDIDATE_INVENTORY` must save and lock before `M8_TARGET_FEATURE_PROFILE` begins.

The gate requires:

```text
artifact_type = feature_candidate_inventory
inventory_version = m8_feature_candidate_inventory_index_v4_deterministic_led_semantic_supported
derivation_mode = DETERMINISTIC_LED_SEMANTIC_SUPPORTED_FROM_INDEX_MAPPED_LOSSLESS_UNITS_NO_TEXT_COPY
source_index_artifact = activity_profile_source_index
candidates[] exists
raw_feature_hit_index[] exists
context_pointer_index[] exists
deterministic_baseline_metadata exists
semantic_support_receipt exists
```

## 2. Deterministic baseline gate

The baseline must be built before semantic support.

Every baseline candidate must:

- resolve through a candidate-creation locator in `activity_profile_source_index`;
- resolve to a Phase-2G-routed lossless evidence unit;
- contain the exact candidate field set;
- set `evidence_grounded: true`;
- contain one or more exact source pointers;
- avoid package taxonomy and copied evidence text.

Locator-only candidate creation without opening the mapped lossless unit fails.

## 3. Semantic proposal gate

The semantic response may contain only `semantic_candidate_support_proposals[]`.

Allowed actions:

```text
RECOVER_CANDIDATE
MERGE_CANDIDATES
SPLIT_CANDIDATE
RENAME_CANDIDATE
REJECT_CANDIDATE
```

Every proposal must use exact routed and index-mapped source pointers. Reject any proposal containing an unsupported action, unknown target ID, unrouted pointer, unindexed pointer, unauthorized root, copied evidence, package taxonomy, confidence field, legal analysis, free URL, ungrounded candidate, duplicate proposal ID, or malformed schema.

The semantic model must not emit final candidate IDs, canonical keys, the saved inventory, or the receipt.

## 4. Deterministic reconciliation gate

Only the backend reconciler may:

- accept or reject proposals;
- mutate the baseline candidate set;
- regenerate final candidate IDs;
- regenerate canonical keys;
- generate the semantic-support receipt;
- save `feature_candidate_inventory`.

Final IDs and canonical keys must be deterministic after reconciliation.

## 5. Receipt gate

The receipt must contain exactly:

```text
attempted
status
deterministic_baseline_count
proposal_count
accepted_count
rejected_count
accepted_proposal_ids
rejected_proposals
final_candidate_count
limitations
```

Allowed statuses are `APPLIED`, `NO_CHANGES`, `UNAVAILABLE`, and `OUTPUT_REJECTED`.

Provider unavailability and wholly rejected output retain the baseline and require `LOCKED_WITH_LIMITATIONS`.

Partial rejection alone is non-blocking when at least one accepted proposal or a usable no-change result remains and the deterministic baseline has no material limitation.

## 6. No evidence-copy or taxonomy gate

Fail if the inventory or proposal packet contains copied source text, source excerpts, mechanics proof, evidence summaries, package IDs, overlay IDs, taxonomy fields, archetype codes, surface tokens, Lane, compliance frameworks, legal conclusions, confidence fields, or risk scoring.

## 7. Candidate coverage and forensics boundary

Layer 1 does not perform final material-profile coverage adjudication. Existing candidate coverage and forensic ledgers remain downstream responsibilities. An unresolved candidate is not automatically blocking; it must be handled by the material profile or carried into controlled forensics/reinvestigation.

Forensics must not recompile or duplicate `feature_candidate_inventory` as a competing source of truth.
