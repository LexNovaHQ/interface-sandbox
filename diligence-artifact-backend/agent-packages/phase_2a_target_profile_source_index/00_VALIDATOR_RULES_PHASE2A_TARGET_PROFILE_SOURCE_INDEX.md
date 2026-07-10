# 00_VALIDATOR_RULES_PHASE2A_TARGET_PROFILE_SOURCE_INDEX

## Phase 2A Validator Overlay

This overlay binds the Phase 2A package-facing validation surface. The backend contract and validator remain the source of truth.

```text
src/phases/02-cartography-index/target-profile-source-index.contract.js
src/phases/02-cartography-index/validators/target-profile-semantic-profile.validator.js
```

## Required Package Output Roots

Phase 2A may produce only:

```text
target_profile_deterministic_map
target_profile_semantic_profile
target_profile_source_index
```

The final downstream artifact is:

```text
target_profile_source_index
```

## Required Final Index Keys

`target_profile_source_index` must preserve the backend final index shape:

```text
source_coverage_index
target_document_structure_index
material_target_field_locator
entity_identity_locator
brand_trade_name_locator
homepage_positioning_locator
contact_route_locator
commercial_availability_locator
pricing_sales_route_locator
customer_segment_context_locator
regulatory_licensing_locator
grievance_complaints_locator
legal_target_signal_locator
priority_target_locator
semantic_navigation_index
missing_limited_target_profile_items
downstream_rules
lock_status
```

No extra final branches are allowed unless the backend contract is updated first.

## Deterministic Discipline

The deterministic map is navigation-only.

Every locator row must be pointer-only. It must not contain copied source text, excerpts, summaries, derived values, downstream profile values, or conclusion fields forbidden by the backend contract.

Required deterministic maps include:

```text
source_artifacts_read
target_source_coverage_index
target_document_structure_index
material_target_field_locator_map
regulatory_licensing_locator_map
grievance_complaints_locator_map
legal_target_signal_locator_map
semantic_label_queue
missing_limited_target_source_map
downstream_rules
lock_status
```

## Semantic Artifact Contract

When the expected write artifact is `target_profile_semantic_profile`, return strict JSON only:

```json
{
  "target_profile_semantic_profile": {
    "schema_version": "P2A_TARGET_PROFILE_SEMANTIC_PROFILE_v1",
    "semantic_navigation_index": [
      {
        "queue_id": "",
        "unit_id": "",
        "target_subcats": [],
        "target_signal_families": [],
        "confidence": ""
      }
    ],
    "semantic_integrity": {
      "required_queue_count": 0,
      "labeled_queue_count": 0,
      "coverage_ratio": 0,
      "ready_for_compiler": false
    },
    "lock_status": "REPAIR_REQUIRED"
  }
}
```

No other top-level key is allowed in semantic mode.

## Semantic Coverage Rule

The coverage source is:

```text
target_profile_deterministic_map.semantic_label_queue
```

Coverage must attach to every required queue row where `semantic_label_required` is true or priority is `P0` / `P1`.

Minimum required coverage is:

```text
0.80
```

If coverage is below `0.80`, `semantic_integrity.ready_for_compiler` must be false and `lock_status` must be `REPAIR_REQUIRED`.

## Allowed Semantic Row Fields

Each semantic row may contain only:

```text
queue_id
unit_id
target_subcats
target_signal_families
confidence
```

`queue_id` and `unit_id` must copy deterministic queue values exactly.

Allowed semantic vocabularies are those exported by the backend contract.

If a queue row cannot be classified, emit empty `target_subcats`, `UNKNOWN_TARGET_SIGNAL`, and `UNCLEAR` confidence.

## Forbidden Content

Phase 2A must enforce:

```text
P2A_TARGET_PROFILE_FORBIDDEN_OUTPUTS
P2A_TARGET_PROFILE_FORBIDDEN_CONCLUSIONS
P2A_TARGET_PROFILE_RETIRED_ROOTS_FORBIDDEN
```

These are exported by the backend contract and are not redefined here.

## Final Self-Check

Before save, verify:

1. all rows are pointer-only;
2. no copied source text appears;
3. no derived value appears;
4. no downstream artifact appears;
5. no forbidden conclusion field appears;
6. semantic rows attach to deterministic queue rows;
7. final index keys match the backend contract.
