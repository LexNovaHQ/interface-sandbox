# STAGE5_REBUILD_MIGRATION_PLAN_v1

## Status

Approved Batch 0 doctrine.

This plan defines how Stage 5 will be rebuilt without repeating the prior failure: a rushed scaffold wired into live runtime before sub-stage architecture was reviewed and validated.

## Purpose

The Stage 5 rebuild must proceed in controlled batches.

No batch may modify live runtime behavior unless the previous batch has:

1. Approved architecture.
2. Approved file list.
3. Standalone tests.
4. Forensic artifact output.
5. Import graph check.
6. Explicit founder approval.

## Current Repo Risk

The current repo contains a temporary multistage runner:

`runtime-api/src/diligence/stage5MultiSubstageRunner.js`

This runner is not accepted as the final implementation because it:

- combines 5A, 5B, 5C, 5D, and 5E in one file,
- embeds archetype taxonomy directly inside runtime code,
- embeds surface taxonomy directly inside runtime code,
- embeds target-like cluster defaults directly inside runtime code,
- does not create independent sub-stage files,
- was wired into live runtime before sub-stage approval,
- does not satisfy the review-first rebuild approach.

## Migration Strategy

The existing scaffold should not be expanded.

It should be treated as temporary reference material and retired from the active path once the approved architecture is built.

Correct migration:

1. Freeze current behavior.
2. Approve Batch 0 docs.
3. Build shared foundations.
4. Build one sub-stage at a time.
5. Validate each sub-stage independently.
6. Assemble orchestrator only after sub-stages pass.
7. Wire live runtime only after orchestrator passes.
8. Retire old scaffold and old mega-prompt fallback.

## Batch 0 — Approval Documents Only

### Objective

Produce approval-grade architecture documents.

### Repo Behavior

Docs only.

No runtime behavior change.

### Deliverables

- `docs/contracts/STAGE5_MULTI_SUBSTAGE_ARCHITECTURE_v1.md`
- `docs/contracts/STAGE5_SUBSTAGE_FIELD_OWNERSHIP_MATRIX_v1.md`
- `docs/contracts/STAGE5_REBUILD_MIGRATION_PLAN_v1.md`

### Exit Criteria

Founder approves, edits, or rejects each document.

## Batch 1 — Shared Foundations

### Objective

Create shared deterministic foundations without changing live runtime behavior.

### Files

- `runtime-api/src/diligence/stage5/shared/stage5SharedTypes.js`
- `runtime-api/src/diligence/stage5/shared/stage5CanonicalFieldMap.js`
- `runtime-api/src/diligence/stage5/shared/stage5PhaseRegistry.js`
- `runtime-api/src/diligence/stage5/shared/stage5RoutingPlanBuilder.js`
- `runtime-api/src/diligence/stage5/shared/stage5IntegrationPorts.js`
- `runtime-api/src/diligence/stage5/shared/stage5SourceManifestBuilder.js`
- `runtime-api/src/diligence/stage5/shared/stage5InstructionPlanBuilder.js`
- `runtime-api/src/diligence/stage5/shared/stage5TokenBudgetPolicy.js`
- `runtime-api/src/diligence/stage5/shared/stage5ValidationEnvelope.js`
- `runtime-api/src/diligence/stage5/shared/stage5ForensicEnvelope.js`
- `runtime-api/src/diligence/stage5/shared/stage5SharedIndex.js`

### Behavior

No live route import.
No live pipeline wiring.
No Stage 5 replacement.

### Tests

- `node --check` for new files.
- Unit test for field map completeness.
- Unit test for candidate manifest shape.
- Unit test confirming candidate buckets are controlled.
- Unit test confirming every canonical field has an owner.

### Exit Criteria

Batch 1 passes standalone checks and founder approves Batch 2.

## Batch 2 — Stage 5A Only

### Objective

Build product function extraction as a standalone model-led sub-stage.

### Files

- `runtime-api/src/diligence/stage5/5a/stage5aProductFunctionInstructionBuilder.js`
- `runtime-api/src/diligence/stage5/5a/stage5aProductFunctionExtractor.js`
- `runtime-api/src/diligence/stage5/5a/stage5aProductFunctionValidator.js`
- `runtime-api/scripts/e2e-stage5a-product-functions.mjs`

### Behavior

No live route import.
No final target feature profile assembly.
No 5B/5C/5D/5E wiring yet.

### Required Artifacts

- `stage5-5a-input.json`
- `stage5-5a-instruction-packet.json`
- `stage5-5a-product-functions.json`
- `stage5-5a-validation.json`
- `stage5-5a-token-usage.json`

### Tests

- At least one product function extracted where evidence supports it.
- Product areas not emitted as atomic features unless decomposed.
- Every candidate has disposition.
- Every promoted function has input/action/output.
- Every promoted function has evidence refs.
- No archetype/surface tagging in 5A output.

### Exit Criteria

Founder reviews 5A output and approves Batch 3.

## Batch 3 — Stage 5B Only

### Objective

Build registry-key-driven archetype and surface tagging.

### Files

- `runtime-api/src/diligence/stage5/5b/stage5bRegistryTaxonomyBuilder.js`
- `runtime-api/src/diligence/stage5/5b/stage5bArchetypeSurfaceInstructionBuilder.js`
- `runtime-api/src/diligence/stage5/5b/stage5bArchetypeSurfaceTagger.js`
- `runtime-api/src/diligence/stage5/5b/stage5bTaggingValidator.js`
- `runtime-api/scripts/e2e-stage5b-archetype-surface.mjs`

### Behavior

No live route import.
No final feature inventory assembly.
Consumes saved 5A artifact.

### Required Artifacts

- `stage5-5b-input-from-5a.json`
- `stage5-5b-registry-taxonomy-slice.json`
- `stage5-5b-instruction-packet.json`
- `stage5-5b-tags.json`
- `stage5-5b-validation.json`
- `stage5-5b-token-usage.json`

### Tests

- One 5B row per 5A promoted function.
- Archetypes must be controlled registry values.
- Surfaces must be controlled registry values.
- Free-text values fail.
- Unknown tagging creates `TAGGING_FAILURE`.
- No function deletion.
- `UNI` not allowed as uncertainty fallback.

### Exit Criteria

Founder reviews 5B output and approves Batch 4.

## Batch 4 — Stage 5C Only

### Objective

Build deterministic canonical feature inventory from 5A and 5B.

### Files

- `runtime-api/src/diligence/stage5/5c/stage5cFeatureInventoryBuilder.js`
- `runtime-api/src/diligence/stage5/5c/stage5cFeatureInventoryValidator.js`
- `runtime-api/scripts/e2e-stage5c-feature-inventory.mjs`

### Behavior

No model call.
No final target feature profile assembly.
Consumes saved 5A and 5B artifacts.

### Required Artifacts

- `stage5-5c-input-5a-5b.json`
- `stage5-5c-feature-inventory.json`
- `stage5-5c-build-log.json`
- `stage5-5c-validation.json`

### Tests

- Feature IDs deterministic.
- Every included feature maps to 5A function.
- Every 5B tag maps to a 5C feature.
- Missing 5B tags are visible as quality issues.
- No product-area-only feature rows.
- No hidden model call.
- No silent deletion.

### Exit Criteria

Founder reviews 5C output and approves Batch 5.

## Batch 5 — Stage 5D Only

### Objective

Build feature-level data touchpoint extraction.

### Files

- `runtime-api/src/diligence/stage5/5d/stage5dFeatureDataTouchpointInstructionBuilder.js`
- `runtime-api/src/diligence/stage5/5d/stage5dFeatureDataTouchpointExtractor.js`
- `runtime-api/src/diligence/stage5/5d/stage5dFeatureDataTouchpointValidator.js`
- `runtime-api/scripts/e2e-stage5d-data-touchpoints.mjs`

### Behavior

No live route import.
No final target feature profile assembly.
Consumes saved 5C artifact and evidence refs.

### Required Artifacts

- `stage5-5d-input-from-5c.json`
- `stage5-5d-instruction-packet.json`
- `stage5-5d-data-touchpoints.json`
- `stage5-5d-validation.json`
- `stage5-5d-token-usage.json`

### Tests

- Every feature gets touchpoint attempt.
- Data categories constrained.
- Unknown retention/training permitted only where evidence absent.
- No legal/governance conclusions.
- No Stage 6B replacement behavior.

### Exit Criteria

Founder reviews 5D output and approves Batch 6.

## Batch 6 — Stage 5E Only

### Objective

Build deterministic final target feature profile assembler.

### Files

- `runtime-api/src/diligence/stage5/5e/stage5eTargetFeatureProfileAssembler.js`
- `runtime-api/src/diligence/stage5/5e/stage5eTargetFeatureProfileValidator.js`
- `runtime-api/scripts/e2e-stage5e-target-feature-profile.mjs`

### Behavior

No live route import.
No model call.
Consumes saved 5A, 5B, 5C, and 5D artifacts.

### Required Artifacts

- `stage5-5e-input-all-substages.json`
- `stage5-5e-target-feature-profile.json`
- `stage5-5e-final-validation.json`
- `stage5-5e-handoff-integrity.json`

### Tests

- Final schema validation passes.
- `feature_inventory[]` complete.
- `data_provenance_map[]` flattened correctly.
- `regulated_surface_map[]` flattened correctly.
- `commercial_scan.source_coverage[]` accounts for admitted sources.
- `evidence.field_evidence_refs[]` resolves.
- `limitations[]` roll up all sub-stage gaps.
- `classification_quality` present.
- No hidden model call.

### Exit Criteria

Founder reviews final Stage 5 profile and approves Batch 7.

## Batch 7 — Orchestrator and Live Wiring

### Objective

Wire approved sub-stages into live Stage 5.

### Files

- `runtime-api/src/diligence/stage5/stage5Orchestrator.js`
- live pipeline import update
- runtime check update
- audit script update for Stage 5 substage forensic artifacts
- retirement of old scaffold from active path

### Behavior

Only after approval:

- Live Stage 5 calls `stage5Orchestrator.js`.
- Old `stage5MultiSubstageRunner.js` is removed from live import path.
- Old mega-prompt fallback is disabled by default.
- Fallback, if retained, must be explicit and env-gated.

### Tests

- `npm run check`
- `npm run build:runtime`
- Standalone Stage 5 audit.
- Live Stage 4 to Stage 5 audit.
- Full runtime audit only after Stage 5 passes.

### Required Runtime Audit Markers

- `[AUDIT][STAGE5][5A][START]`
- `[AUDIT][STAGE5][5A][DONE]`
- `[AUDIT][STAGE5][5B][START]`
- `[AUDIT][STAGE5][5B][DONE]`
- `[AUDIT][STAGE5][5C][START]`
- `[AUDIT][STAGE5][5C][DONE]`
- `[AUDIT][STAGE5][5D][START]`
- `[AUDIT][STAGE5][5D][DONE]`
- `[AUDIT][STAGE5][5E][START]`
- `[AUDIT][STAGE5][5E][DONE]`

### Exit Criteria

Full Stage 5 live audit passes without silent omission or destructive deletion.

## Rollback Rule

If any batch fails, revert only that batch.

Never patch forward by hiding validation.

Never make downstream stages compensate for Stage 5 failure.

## Approval Gates

No file goes into repo without founder approval.
No runtime import changes without founder approval.
No deployment without founder approval.
No Codex build prompt without founder approval.
No live audit until the approved substage path exists.

## Final Success Criteria

The rebuild succeeds only when:

1. Stage 5 extracts visible product functions.
2. Every function has a 5A artifact.
3. Every function receives a 5B tagging attempt.
4. Every tag uses controlled registry-key values.
5. 5C builds canonical inventory deterministically.
6. 5D maps functional data touchpoints.
7. 5E assembles the final schema-clean profile.
8. The audit clearly shows time, tokens, input, output, and validation by sub-stage.
9. No old scaffold controls live Stage 5.
10. No feature disappears without an explicit forensic reason.
