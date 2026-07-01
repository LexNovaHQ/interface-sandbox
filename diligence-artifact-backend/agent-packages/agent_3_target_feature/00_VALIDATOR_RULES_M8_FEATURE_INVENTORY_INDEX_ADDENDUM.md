# 00_VALIDATOR_RULES_M8_FEATURE_INVENTORY_INDEX_ADDENDUM

This addendum narrows Agent 3 / M8 validation for the feature candidate inventory architecture.

## Inventory Gate

`M8_FEATURE_CANDIDATE_INVENTORY` must lock before `M8_TARGET_FEATURE_PROFILE` begins.

The inventory gate passes only if:

```text
feature_candidate_inventory exists
artifact_type = feature_candidate_inventory
inventory_version = m8_feature_candidate_inventory_index_v1
derivation_mode = DETERMINISTIC_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION
candidates[] exists
raw_feature_hit_index[] exists
source_pointers[] exist for each candidate
canonical_feature_key values are unique
```

## No Evidence Compilation Gate

The inventory fails if it contains copied evidence text, source excerpts, mechanics proof, archetype proof, surface proof, legal analysis, privacy analysis, registry exposure analysis, or recommendations.

## Candidate Coverage Gate

`M8_TARGET_FEATURE_PROFILE` must treat the saved inventory as the candidate universe.

Every canonical candidate must resolve to one of:

```text
DIRECT_ACTIVITY_ROW
DIRECT_ACTIVITY_WITH_CHILD_CAPABILITIES
CHILD_CAPABILITY_OF_ACTIVITY
MERGED_DUPLICATE_SOURCE
EXCLUDED_NON_PRODUCT_ACTIVITY
POSSIBLE_OVERLAP_REVIEW
```

An unresolved candidate is `REPAIR_REQUIRED` and M8 may not lock.

## No Silent Absorption Gate

Standalone API, model, integration, and pricing-confirmed capability candidates may not be silently absorbed into a product wrapper. They must be direct activities, visible child capabilities, merged duplicate sources, or excluded with a reason.

## Forensics Gate

`target_feature_profile_forensics` must reference the saved inventory using `feature_candidate_inventory_ref` and must ledger:

```text
raw_feature_hit_derivation_ledger
canonicalization_derivation_ledger
dedup_decision_ledger
parent_child_overlap_ledger
candidate_to_activity_coverage_ledger
candidate_exclusion_ledger
```

Forensics must not recompile or duplicate `feature_candidate_inventory` as a competing source of truth.
