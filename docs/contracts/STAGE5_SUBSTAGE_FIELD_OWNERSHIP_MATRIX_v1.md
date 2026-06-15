# STAGE5_SUBSTAGE_FIELD_OWNERSHIP_MATRIX_v1

## Status

Approved Batch 0 doctrine.

This matrix assigns every canonical Stage 5 field to an owning sub-stage so the Stage 5 split does not lose fields.

## Ownership Principles

1. A field may have multiple contributors, but only one final owner.
2. Model outputs are interpreted findings, not final canonical truth.
3. Deterministic builders own canonical assembly.
4. Validators own rejection, repair routing, and failure classification.
5. No field may be silently dropped.
6. No canonical output field may rely on hidden fallback logic.
7. Stage 5 does not own registry threat IDs or legal exposure findings.

## Sub-Stage Legend

- 5A — Product Function Extraction
- 5B — Archetype, Surface, and Trigger Tagging
- 5C — Canonical Feature Inventory Construction
- 5D — Feature Data Touchpoint Extraction
- 5E — Target Feature Profile Assembly

## Top-Level Target Feature Profile Fields

| Canonical Field | Final Owner | Contributors | Mode | Failure Behavior |
|---|---|---|---|---|
| `feature_profile_version` | 5E | none | Deterministic | Required static version. |
| `target_profile_ref` | 5E | Stage 4 | Deterministic | Fail if missing target identity. |
| `feature_inventory[]` | 5C then 5E | 5A, 5B, 5D | Deterministic assembly | Fail/warn by validator; no silent deletion. |
| `product_feature_map[]` | 5E | 5A, candidate manifest | Deterministic | Empty only with explicit limitation. |
| `data_provenance_map[]` | 5E | 5D, 5C | Deterministic flattening | Preserve unknowns; do not infer legal conclusions. |
| `regulated_surface_map[]` | 5E | 5B, 5D | Deterministic flattening | Missing surfaces become validation issue. |
| `architecture_hints[]` | 5E | 5A, 5D, source manifest | Mostly deterministic | Evidence-backed hints only. |
| `commercial_scan` | 5E | 5A, source manifest | Deterministic ledger with 5A outcomes | Must account for every admitted source. |
| `vault_feature_candidates` | 5E | 5C, 5D | Deterministic | Helper only; no Stage 10 final handoff. |
| `evidence.field_evidence_refs[]` | 5E | 5A, 5B, 5D | Deterministic | Required for material claims. |
| `limitations[]` | 5E | all substages | Deterministic rollup | Preserve sub-stage limitations. |
| `unresolved_feature_candidates[]` | 5E | 5A, 5B, 5C | Deterministic rollup | Must include reason and refs. |
| `classification_quality` | 5E | all validators | Deterministic | Required; cannot be implied. |

## Feature Inventory Field Ownership

| Field | Final Owner | Contributors | Mode | Notes |
|---|---|---|---|---|
| `feature_id` | 5C | none | Deterministic | Stable sequential ID after ordering. |
| `feature_name` | 5C | 5A | Model extraction + deterministic normalization | Atomic function, not mere product area. |
| `feature_role` | 5C | 5A | Model classification + deterministic validation | Core or secondary. |
| `commercial_function` | 5C | 5A | Model | Business/customer outcome from evidence. |
| `business_label_or_product_area` | 5C | 5A, source manifest | Deterministic seed + model resolution | Public label linked to function. |
| `feature_description` | 5C | 5A | Model | Mechanical input/action/output description. |
| `actor_or_user` | 5C | 5A | Model | User/caller/admin/customer/developer. |
| `input_data[]` | 5C | 5A, 5D | Model + deterministic merge | 5D refines. |
| `system_action` | 5C | 5A | Model | Required for emitted feature. |
| `output_or_result` | 5C | 5A | Model | Required for emitted feature. |
| `autonomy_level` | 5C | 5B | Model constrained enum | From behavior classification. |
| `human_review_signal` | 5C | 5B | Model constrained enum | Do not infer from enterprise language alone. |
| `external_action_signal` | 5C | 5B | Model constrained boolean/unknown | API alone is not external action. |
| `delivery_channels` | 5C | source manifest, 5A | Mostly deterministic | App/API/web/docs/source metadata. |
| `data_provenance[]` | 5C | 5D | Model extraction + deterministic attach | Feature-level functional provenance. |
| `archetype_codes[]` | 5C | 5B | Model constrained by registry key | Controlled values only. |
| `archetype_labels[]` | 5C | 5B taxonomy | Deterministic | Dictionary expansion only. |
| `archetype_provenance[]` | 5C | 5B | Model basis + deterministic refs | One row per code. |
| `surface_tokens[]` | 5C | 5B | Model constrained by registry key | Controlled values only. |
| `surface_provenance[]` | 5C | 5B | Model basis + deterministic refs | One row per surface. |
| `confidence` | 5C | 5A, 5B, 5D validators | Deterministic formula | Extraction + tagging + evidence strength. |
| `feature_source_url` | 5C | 5A | Deterministic | Primary source proving feature. |
| `evidence_refs[]` | 5C | 5A, 5B, 5D | Deterministic | Must resolve to source/chunk refs. |
| `linked_threat_ids[]` | 5C | none | Deterministic | Empty in Stage 5 unless external mapping supplied. |

## Stage 5A Field Ownership

| 5A Field | Type | Required | Failure Handling |
|---|---|---|---|
| `stage5a_version` | Deterministic | Yes | Static. |
| `product_functions[]` | Model | Yes | If empty, Stage 5A failed. |
| `function_id` | Deterministic | Yes | Stable temporary ID. |
| `function_name` | Model | Yes | Must not be mere product area. |
| `primary_or_secondary` | Model | Yes | Unknown not allowed for promoted function. |
| `commercial_function` | Model | Yes | Conservative; evidence-backed. |
| `business_label_or_product_area` | Model/deterministic | Yes | From page/nav/source title. |
| `actor_or_user` | Model | Yes | `unknown` allowed with limitation. |
| `input_signal` | Model | Yes | `unknown` allowed only with limitation. |
| `system_action` | Model | Yes | Required. |
| `output_or_result` | Model | Yes | Required. |
| `source_refs[]` | Deterministic | Yes | Validate source IDs. |
| `evidence_refs[]` | Model-selected, deterministic-validated | Yes | Must resolve. |
| `candidate_status` | Model/deterministic | Yes | Promoted or non-feature disposition. |
| `candidate_disposition[]` | Deterministic rollup | Yes | No silent candidate loss. |
| `source_function_bindings[]` | Deterministic/model | Yes | Source coverage accounting. |
| `commercial_outcome_candidates[]` | Model | Yes | Feeds commercial scan. |
| `limitations[]` | Model/deterministic | Yes | Must roll to 5E. |

## Stage 5B Field Ownership

| 5B Field | Type | Required | Failure Handling |
|---|---|---|---|
| `stage5b_version` | Deterministic | Yes | Static. |
| `feature_tags[]` | Model constrained | Yes | One row per 5A promoted function. |
| `function_id` | Deterministic | Yes | Must match 5A. |
| `archetype_codes[]` | Model constrained | Yes | Controlled values only. |
| `surface_tokens[]` | Model constrained | Yes | Controlled values only. |
| `triggering_status` | Deterministic first, model assist | Yes | Controlled enum. |
| `triggering_reason` | Model | Yes | Evidence-bound. |
| `autonomy_level` | Model constrained | Yes | Controlled enum. |
| `human_review_signal` | Model constrained | Yes | Controlled enum. |
| `external_action_signal` | Model constrained | Yes | true/false/unknown. |
| `tagging_confidence` | Model | Yes | Can be downgraded deterministically. |
| `tagging_gaps[]` | Model | Yes | Required if confidence low. |
| `archetype_provenance_seed[]` | Model/deterministic | Yes | One row per archetype. |
| `surface_provenance_seed[]` | Model/deterministic | Yes | One row per surface. |
| `tagging_failures[]` | Deterministic rollup | Conditional | Required when any function cannot be tagged. |
| `limitations[]` | Deterministic/model | Yes | Must roll to 5E. |

## Stage 5C Field Ownership

| 5C Field | Type | Required | Failure Handling |
|---|---|---|---|
| `stage5c_version` | Deterministic | Yes | Static. |
| `feature_inventory[]` | Deterministic | Yes | Must map from 5A + 5B. |
| `feature_inventory_build_log[]` | Deterministic | Yes | Logs every included/excluded function. |
| `classification_quality_seed` | Deterministic | Yes | Used by 5E. |
| `unresolved_feature_candidates_seed[]` | Deterministic | Yes | Includes exact reasons. |
| `limitations[]` | Deterministic | Yes | Must roll to 5E. |

## Stage 5D Field Ownership

| 5D Field | Type | Required | Failure Handling |
|---|---|---|---|
| `stage5d_version` | Deterministic | Yes | Static. |
| `feature_data_touchpoints[]` | Model | Yes | One or more per feature where possible. |
| `feature_id` | Deterministic | Yes | Must match 5C. |
| `input_data[]` | Model | Yes | Unknown allowed with evidence limitation. |
| `output_data[]` | Model | Yes | Unknown allowed with evidence limitation. |
| `processing_action[]` | Model | Yes | Functional only. |
| `data_origin` | Model constrained | Yes | Controlled enum. |
| `data_subject` | Model constrained | Yes | Controlled enum. |
| `data_category` | Model constrained | Yes | Controlled enum. |
| `processing_context` | Model | Yes | Feature-specific. |
| `storage_or_retention_signal` | Model evidence-bound | Yes | `not visible in admitted evidence` allowed. |
| `training_or_finetuning_signal` | Model evidence-bound | Yes | No inference. |
| `sharing_or_subprocessor_signal` | Model evidence-bound | Yes | No inference. |
| `source_url` | Deterministic/model | Yes | Primary source for claim. |
| `evidence_refs[]` | Deterministic | Yes | Must resolve. |
| `confidence` | Model/deterministic | Yes | Based on evidence specificity. |
| `gaps[]` | Model | Yes | Required if unknowns exist. |

## Stage 5E Field Ownership

| 5E Field | Type | Required | Failure Handling |
|---|---|---|---|
| `target_feature_profile` | Deterministic | Yes | Final Stage 5 object. |
| `commercial_scan.source_coverage[]` | Deterministic | Yes | One row per admitted source. |
| `commercial_scan.distinct_commercial_outcomes_seen[]` | 5A + deterministic | Yes | No visible outcome may be lost. |
| `commercial_scan.mapped_core_feature_ids[]` | Deterministic | Yes | Maps core features. |
| `commercial_scan.unmapped_outcomes_due_to_insufficient_detail[]` | 5A + deterministic | Yes | Explicit unresolved outcomes. |
| `commercial_scan.completeness_status` | Deterministic | Yes | COMPLETE/PARTIAL/DEGRADED. |
| `data_provenance_map[]` | Deterministic | Yes | Flatten 5D by feature. |
| `regulated_surface_map[]` | Deterministic | Yes | Flatten 5B surfaces and provenance. |
| `architecture_hints[]` | Deterministic/model-derived evidence | Conditional | Explicit evidence only. |
| `vault_feature_candidates` | Deterministic | Yes | Stage 10 helper only. |
| `evidence.field_evidence_refs[]` | Deterministic | Yes | Required for material claims. |
| `limitations[]` | Deterministic | Yes | Rollup all sub-stage gaps. |
| `unresolved_feature_candidates[]` | Deterministic | Yes | No silent unresolved deletion. |
| `classification_quality` | Deterministic | Yes | Final quality state. |

## Forbidden Ownership Patterns

Invalid patterns:

1. 5B deciding product function existence.
2. 5C calling model to redo 5A or 5B.
3. 5E calling model to repair facts without a repair diff.
4. Schema validator deleting feature rows.
5. Guardrail moving a feature to unresolved without preserving its 5A artifact.
6. Inline registry vocabulary inside orchestrator.
7. Hardcoded target-specific clusters as canonical truth.
8. Missing evidence refs repaired with fabricated refs.
9. Using `UNI` as fallback when classification is uncertain.
10. Stage 5 emitting `linked_threat_ids[]` based on its own inference.

## Required Validation Matrix

| Validation | Applies To | Blocks? |
|---|---|---|
| Candidate disposition completeness | 5A | Yes if silent loss. |
| Function existence minimum fields | 5A | Yes. |
| 5A-to-5B one-to-one coverage | 5B | Yes. |
| Controlled archetype values | 5B | Yes. |
| Controlled surface values | 5B | Yes. |
| Tagging failure visibility | 5B | Yes. |
| 5A-to-5C preservation | 5C | Yes. |
| Feature inventory schema shape | 5C | Yes. |
| Data touchpoint coverage | 5D | Warning/degraded unless total absence. |
| No legal/governance overreach | 5D | Yes if present. |
| Source coverage accounting | 5E | Warning/degraded if partial; block if omitted. |
| Evidence ref resolution | 5E | Yes for material claims. |
| Final schema validation | 5E | Yes. |
| Handoff integrity | Final | Yes. |
