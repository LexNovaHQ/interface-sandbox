# STAGE5_MULTI_SUBSTAGE_ARCHITECTURE_v1

## Status

Approved Batch 0 doctrine.

This document is the governing architecture for the Stage 5 rebuild. It does not modify runtime behavior by itself.

## Purpose

Stage 5 is being rebuilt because the prior monolithic Target Feature Profile flow repeatedly failed to preserve visible product functions when classification or downstream canonical fields were incomplete.

The rebuilt Stage 5 execution contract is split into five sub-stages:

- Stage 5A — Product Function Extraction
- Stage 5B — Archetype, Surface, and Trigger Tagging
- Stage 5C — Canonical Feature Inventory Construction
- Stage 5D — Feature Data Touchpoint Extraction
- Stage 5E — Target Feature Profile Assembly

The final downstream contract remains the canonical `target_feature_profile`.

## Core Rule

Stage 5 has two contracts:

1. The final canonical output contract.
2. The internal execution contract.

The final output contract remains stable. The execution contract changes from a single overloaded model call into a controlled multi-stage pipeline.

## Authority Hierarchy

Stage 5 execution must follow this hierarchy:

1. Canonical runtime schema.
2. Stage 5 field derivation instructions.
3. Registry key runtime vocabulary.
4. Source candidate manifest.
5. Sub-stage instruction packets.
6. Model output.
7. Deterministic validators and assemblers.

A model output cannot override a controlled vocabulary, canonical schema, or evidence-reference rule.

## Final Stage 5 Output

The final Stage 5 output is `target_feature_profile`.

Compatibility aliases may expose `feature_profile_v2`, but the canonical object is the target feature profile.

The final output must include:

- `feature_profile_version`
- `target_profile_ref`
- `feature_inventory[]`
- `product_feature_map[]`
- `data_provenance_map[]`
- `regulated_surface_map[]`
- `architecture_hints[]`
- `commercial_scan`
- `vault_feature_candidates`
- `evidence.field_evidence_refs[]`
- `limitations[]`
- `unresolved_feature_candidates[]`
- `classification_quality`

## Non-Goals

Stage 5 must not perform:

- Registry threat row evaluation.
- Final exposure findings.
- Stage 7 registry ledger decisions.
- Legal document cartography.
- Stage 6A legal stack review.
- Stage 6B legal/governance data provenance.
- Stage 9 report finding creation.
- Stage 10 vault handoff creation.

Stage 5 may create routing signals for later stages, but it may not decide downstream legal exposure.

## Corrected Failure Model

The previous system failed because it treated Stage 5 as one combined reasoning task:

- find features,
- decide whether they are real,
- classify archetypes,
- classify surfaces,
- infer data flows,
- fill canonical fields,
- repair gaps,
- validate guardrails,
- decide unresolved candidates.

That overloaded the model and created destructive behavior. If a feature was not cleanly tagged, the system could erase or demote it instead of preserving the extraction and reporting a tagging failure.

The rebuilt system separates existence, tagging, canonicalization, data mapping, and assembly.

## Stage 5A — Product Function Extractor

### Responsibility

Stage 5A answers: what product functions are visible in admitted public evidence?

It extracts product functions from product pages, API docs, documentation, commercial pages, and source candidate manifests.

### Input

- Target profile reference.
- Stage 3/Stage 5 source package.
- Candidate manifest.
- Product/docs/commercial evidence refs.
- Baseline derivation logic.
- Source coverage metadata.

### Output

`stage5a_product_function_extraction`

Minimum shape:

- `stage5a_version`
- `target_profile_ref`
- `product_functions[]`
- `candidate_disposition[]`
- `source_function_bindings[]`
- `commercial_outcome_candidates[]`
- `visible_but_unmapped_candidates[]`
- `limitations[]`
- `model_metadata`

Each `product_functions[]` row must contain:

- `function_id`
- `function_name`
- `primary_or_secondary`
- `commercial_function`
- `business_label_or_product_area`
- `feature_description`
- `actor_or_user`
- `input_signal`
- `system_action`
- `output_or_result`
- `source_refs[]`
- `evidence_refs[]`
- `candidate_confidence`
- `candidate_status`

### Model Use

Stage 5A is model-led.

The model may identify product functions, decompose product areas into atomic functions, classify primary/secondary role, explain input/action/output mechanics, and bind evidence refs.

The runtime must deterministically build the candidate manifest, provide source refs, validate evidence refs, normalize function IDs, ensure every candidate is disposed, and prevent product-area labels from being emitted as final atomic functions without decomposition.

### Hard Rules

Stage 5A must not:

- assign registry threat IDs,
- assign final archetype/surface tags,
- delete functions due to missing 5B tags,
- make legal conclusions,
- infer training, retention, or subprocessors unless evidence is explicit.

## Stage 5B — Archetype, Surface, and Trigger Tagger

### Responsibility

Stage 5B answers: what controlled archetype and surface categories apply to each 5A product function?

It does not decide whether the function exists. 5A already decided existence.

### Input

- `stage5a_product_function_extraction`
- Registry key runtime vocabulary.
- Controlled archetype definitions.
- Controlled surface definitions.
- Negative controls.
- Target profile reference.
- Evidence refs already bound by 5A.

### Output

`stage5b_archetype_surface_tagging`

Minimum shape:

- `stage5b_version`
- `target_profile_ref`
- `feature_tags[]`
- `archetype_provenance_seed[]`
- `surface_provenance_seed[]`
- `triggering_summary`
- `tagging_failures[]`
- `limitations[]`
- `model_metadata`

Each `feature_tags[]` row must contain:

- `function_id`
- `archetype_codes[]`
- `surface_tokens[]`
- `triggering_status`
- `triggering_reason`
- `autonomy_level`
- `human_review_signal`
- `external_action_signal`
- `tagging_confidence`
- `tagging_gaps[]`
- `evidence_refs[]`

### Model Use

Stage 5B is model-led but controlled.

The model may select archetype codes from allowed values, select surface tokens from allowed values, explain matched behavior, explain matched surface context, and determine ambiguous autonomy/review/action signals.

The runtime must deterministically load allowed archetypes and surfaces from registry key runtime vocabulary, reject free-text values, attach dictionary labels, ensure one 5B row exists for every 5A promoted function, and prevent deletion of 5A functions.

### Hard Rules

Stage 5B must not:

- delete a 5A product function,
- convert a function into an unresolved candidate merely because tagging is difficult,
- use `UNI` as an uncertainty fallback,
- invent new archetypes,
- invent new surface tokens,
- assign final registry threat IDs,
- evaluate Stage 7 threat rows.

### Failure Handling

If a function cannot be safely tagged, Stage 5B must emit:

- `TAGGING_FAILURE`
- `failure_reason`
- `candidate_archetype_possibilities[]`
- `candidate_surface_possibilities[]`
- `evidence_refs[]`
- `needs_review: true`

The function remains preserved for audit and 5C quality handling.

## Stage 5C — Canonical Feature Inventory Builder

### Responsibility

Stage 5C answers: what is the canonical `feature_inventory[]` row for each 5A product function after attaching 5B tags?

Stage 5C is deterministic.

### Input

- `stage5a_product_function_extraction`
- `stage5b_archetype_surface_tagging`
- Canonical field ownership map.
- Target feature profile schema.
- Evidence ref index.

### Output

`stage5c_feature_inventory`

Minimum shape:

- `stage5c_version`
- `target_profile_ref`
- `feature_inventory[]`
- `feature_inventory_build_log[]`
- `classification_quality_seed`
- `unresolved_feature_candidates_seed[]`
- `limitations[]`

### Hard Rules

Stage 5C must not:

- re-decide whether a 5A feature exists,
- call a model to rename or reinterpret features by default,
- delete a feature because 5B tagging is degraded,
- fill missing archetype/surface with fake values,
- use the old guardrail behavior that silently removes final rows.

## Stage 5D — Feature Data Touchpoint Extractor

### Responsibility

Stage 5D answers: what functional data touchpoints are visible for each feature?

This is not Stage 6B legal/governance data provenance.

### Input

- `stage5c_feature_inventory`
- 5A source/evidence refs.
- Product/docs evidence.
- Target profile reference.
- Data category enum.
- 5D instruction packet.

### Output

`stage5d_feature_data_touchpoints`

Minimum shape:

- `stage5d_version`
- `target_profile_ref`
- `feature_data_touchpoints[]`
- `data_touchpoint_gaps[]`
- `limitations[]`
- `model_metadata`

Each `feature_data_touchpoints[]` row must contain:

- `feature_id`
- `input_data[]`
- `output_data[]`
- `processing_action[]`
- `data_origin`
- `data_subject`
- `data_category`
- `processing_context`
- `storage_or_retention_signal`
- `training_or_finetuning_signal`
- `sharing_or_subprocessor_signal`
- `source_url`
- `evidence_refs[]`
- `confidence`
- `gaps[]`

### Hard Rules

Stage 5D must not:

- decide controller/processor legal roles,
- decide DPA sufficiency,
- decide privacy policy gaps,
- make transfer, retention, or subprocessor conclusions without explicit evidence,
- replace Stage 6B.

## Stage 5E — Target Feature Profile Assembler

### Responsibility

Stage 5E assembles 5A, 5B, 5C, and 5D into the final canonical `target_feature_profile`.

Stage 5E is deterministic.

### Input

- Stage 5 input manifest.
- Master instruction plan.
- Candidate manifest.
- 5A output.
- 5B output.
- 5C output.
- 5D output.
- Canonical field map.
- Schema validator.
- Guardrail validator.

### Output

`target_feature_profile`

Forensic artifacts must remain separate from canonical output unless the schema explicitly allows metadata containers.

### Hard Rules

Stage 5E must not:

- hide sub-stage failures,
- rewrite 5A/5B/5D outputs without a repair log,
- delete evidence refs,
- merge forensic artifacts into canonical fields unless schema-approved,
- allow old mega-prompt fallback by default.

## Orchestrator Rule

The live runtime should eventually import only:

`stage5Orchestrator.js`

The orchestrator must not contain inline archetype taxonomy, inline surface taxonomy, Sarvam hardcoded defaults, prompt text, schema definitions, or guardrail rules.

The orchestrator coordinates only:

1. Build input manifest.
2. Build candidate manifest.
3. Build master instruction plan.
4. Run 5A.
5. Validate 5A.
6. Run 5B.
7. Validate 5B.
8. Build 5C.
9. Validate 5C.
10. Run 5D.
11. Validate 5D.
12. Build 5E.
13. Validate final target feature profile.
14. Persist forensic trace.

## Forensic Requirements

Every Stage 5 run must emit:

- `stage5-00-input-manifest.json`
- `stage5-01-candidate-manifest.json`
- `stage5-02-instruction-plan.json`
- `stage5-5a-product-functions.json`
- `stage5-5a-validation.json`
- `stage5-5b-archetype-surface-tags.json`
- `stage5-5b-validation.json`
- `stage5-5c-feature-inventory.json`
- `stage5-5c-validation.json`
- `stage5-5d-data-touchpoints.json`
- `stage5-5d-validation.json`
- `stage5-5e-target-feature-profile.json`
- `stage5-final-validation.json`
- `stage5-token-usage.json`
- `stage5-handoff-integrity.json`

A Stage 5 failure must still write all completed artifacts before failing.

## Anti-Scaffold Rules

The following are prohibited:

1. One giant Stage 5 runner file.
2. Hardcoded registry taxonomy inside the runner.
3. Hardcoded company-specific feature clusters inside the runner.
4. Silent feature deletion.
5. Old mega-prompt fallback as default.
6. Unvalidated free-text archetypes/surfaces.
7. Runtime wiring before standalone sub-stage tests.
8. Model repair that changes upstream facts without a repair diff.
9. Truncating evidence to make the stage pass.

## Acceptance Criteria

This architecture is accepted only when:

- Every canonical field has a named owner.
- Every sub-stage has input/output contracts.
- Every model call has a narrow purpose.
- Every deterministic builder has no hidden model dependency.
- 5B uses registry key/runtime registry vocabulary, not inline constants.
- Stage 5 can fail visibly without losing upstream artifacts.
- The live pipeline is not wired until sub-stage tests pass.
