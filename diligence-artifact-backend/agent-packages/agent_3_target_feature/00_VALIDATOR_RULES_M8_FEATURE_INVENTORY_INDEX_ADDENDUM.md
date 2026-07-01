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

Every canonical candidate should resolve to one of:

```text
DIRECT_ACTIVITY_ROW
DIRECT_ACTIVITY_WITH_CHILD_CAPABILITIES
CHILD_CAPABILITY_OF_ACTIVITY
MERGED_DUPLICATE_SOURCE
EXCLUDED_NON_PRODUCT_ACTIVITY
POSSIBLE_OVERLAP_REVIEW
```

An unresolved candidate is not automatically a blocking failure. It is a controlled forensic limitation and must lead to one of:

```text
TARGETED_REINVESTIGATION_REQUIRED
LOCKED_WITH_LIMITATIONS
```

Blocking is the exception, not the rule. The M8 forensic gate may return `REPAIR_REQUIRED` only for critical structural failures, including:

```text
missing feature_candidate_inventory artifact
invalid feature_candidate_inventory schema
missing target_feature_profile artifact
invalid target_feature_profile schema
empty activity trace with no limitation trace
missing field_trace_index where activities exist
forensics artifact cannot satisfy required top-level contract
```

Candidate coverage mismatch, weak name matching, incomplete human readability, or unresolved parent/child treatment is non-critical. Those issues must be recorded in warnings, `targeted_re_extraction_ledger`, `candidate_to_activity_coverage_ledger`, `candidate_exclusion_ledger`, or `activity_limitations_ledger`, and the phase should proceed as `LOCKED_WITH_LIMITATIONS`.

## No Silent Absorption Gate

Standalone API, model, integration, and pricing-confirmed capability candidates may not be silently absorbed into a product wrapper. They must be direct activities, visible child capabilities, merged duplicate sources, excluded with a reason, or carried as a limitation for targeted reinvestigation.

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
