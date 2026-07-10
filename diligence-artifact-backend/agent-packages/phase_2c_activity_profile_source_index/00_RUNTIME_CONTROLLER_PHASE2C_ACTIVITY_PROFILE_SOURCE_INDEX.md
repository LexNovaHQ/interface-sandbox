# 00_RUNTIME_CONTROLLER_PHASE2C_ACTIVITY_PROFILE_SOURCE_INDEX

## 1. Active Scope

This controller applies only to `P2C_ACTIVITY_PROFILE_SOURCE_INDEX`.

2C builds the domain-agnostic source-navigation substrate for Phase 5 Activity Profile Review. It locates public activity evidence. It does not interpret that evidence through any domain-specific package taxonomy.

The only final artifact owned by 2C is:

```text
activity_profile_source_index
```

Intermediate artifacts are:

```text
activity_profile_deterministic_map
activity_profile_semantic_profile
activity_profile_source_index
```

## 2. Current Wiring Status

This package is contract-only at creation.

```yaml
runtime_wiring_changed: false
artifact_permissions_registered: false
pipeline_contract_registered: false
pipeline_service_dispatch_registered: false
save_order_gates_registered: false
```

No runtime claim may be made until the backend integration step registers 2C in artifact permissions, central phase outputs, the pipeline contract, pipeline service dispatch, and save-order gates.

## 3. Phase 1 Source Authority

2C reads the Phase 1 v5 source contract only.

Allowed common-root inputs:

```text
lossless_root__product_service
lossless_root__platform_feature_solution
lossless_root__technical_docs_api
lossless_root__docs_api_data_flow
lossless_root__integrations_ecosystem
lossless_root__pricing_commercial_availability
lossless_root__use_case_customer_industry
lossless_root__support_help_resources
lossless_root__ai_safety_transparency
```

Control inputs:

```text
source_discovery_handoff
post_phase_1_domain_gate_handoff
source_discovery_matrix_manifest
neutral_evidence_bucket_manifest
adapter_expansion_log
source_family_index
```

2C must be sparse-root safe. Empty/no-material roots may be virtual only. Missing physical root artifacts are not automatic hard failures when Phase 1 root manifests prove the root was evaluated and unsaved due to no material text.

## 4. Candidate-Creation Boundary

Candidate-creation roots are:

```text
product_service
platform_feature_solution
technical_docs_api
docs_api_data_flow
integrations_ecosystem
pricing_commercial_availability
```

Context-only roots are:

```text
use_case_customer_industry
support_help_resources
ai_safety_transparency
```

Context-only roots may enrich later Phase 5 interpretation. They must not create standalone activity candidates by themselves.

## 5. Domain Package Boundary

2C is package-agnostic. It does not know or select the active package.

3B and the active run manifest determine the mounted domain package. Phase 5 consumes the mounted package and interprets the 2C locator substrate.

Therefore 2C must never emit:

```text
archetype_codes
surface_context_tokens
archetype_derivation_basis
surface_derivation_basis
activity_archetype
activity_surface
domain_activity_taxonomy
package_activity_classification
package_specific_field_family
selected_package
primary_domain_package
domain_package_selected
AI_REGISTRY_KEY
FIELD_DERIVATION_REGISTRY
CLASSIFICATION_DERIVATION_MATRIX
```

## 6. Permitted Work

2C may:

1. Read authorized Phase 1 v5 activity/source roots.
2. Build source coverage rows.
3. Build document structure rows.
4. Create neutral locator rows for activity-relevant evidence shapes.
5. Build semantic labeling queues over neutral route classes.
6. Accept semantic route labels only when they remain package-agnostic.
7. Record missing/limited source coverage.
8. Emit pointer-only navigation artifacts.

## 7. Forbidden Work

2C must not:

1. Emit `feature_candidate_inventory`.
2. Emit `target_feature_profile`.
3. Emit `target_feature_profile_forensics`.
4. Derive mechanics proof.
5. Derive an activity summary.
6. Derive archetypes, surfaces, domain activity taxonomies, or package field families.
7. Select or reference the active package as a conclusion.
8. Perform legal, data provenance, exposure, compiler, QR, or report work.
9. Copy lossless source text, snippets, summaries, excerpts, or profile answers into the index.
10. Read old `lossless_family__P*` artifacts.

## 8. Route Discipline

Allowed neutral route maps:

```text
activity_candidate_source_locator_map
product_capability_locator_map
feature_mechanics_locator_map
technical_mechanics_locator_map
api_interaction_locator_map
data_object_interaction_locator_map
integration_action_locator_map
commercial_availability_locator_map
customer_use_context_locator_map
support_operational_context_locator_map
automation_transparency_context_locator_map
human_control_context_locator_map
external_action_context_locator_map
input_output_object_context_locator_map
```

These route maps are evidence-shape routes only. They are not package classifications.

## 9. Save Order

When runtime-wired, the save order must be:

```text
activity_profile_deterministic_map
activity_profile_semantic_profile
activity_profile_source_index
```

No downstream Phase 5 job should be allowed to run from the new source-index contract until `activity_profile_source_index` is saved and locked.

## 10. Stop Condition

Stop after the semantic profile is validated for this package step. Compiler, final validator, orchestrator, runtime wiring, and Phase 5 sync are separate steps and must not be implied by this package.
