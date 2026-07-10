# P2C Activity Profile Source Index

## 1. Current System Patch

This module creates the Phase 2C package doctrine for:

```text
P2C_ACTIVITY_PROFILE_SOURCE_INDEX
```

It is intentionally modeled after the 2A/2B source-index package structure, but its substantive doctrine is different:

- 2A locates target-profile evidence for 3A.
- 2B locates domain-derivation evidence for 3B.
- 2C locates activity-profile evidence for Phase 5.

2C is not an Activity Profile generator. 2C is the evidence-navigation layer that allows Phase 5 to derive activity facts later.

## 2. Purpose

2C builds a pointer-only activity source index over Phase 1 v5 material roots. It identifies where public source evidence may support later Phase 5 activity review, including capability language, mechanics language, technical interaction, data-object interaction, integration action, commercial availability, use context, operational support context, automation/transparency context, human-control context, external-action context, and input/output object context.

2C does not decide what those signals mean under a domain package.

The mounted domain package later controls the activity taxonomy, field families, classification vocabulary, archetype vocabulary, surface vocabulary, and profile field interpretation.

## 3. Inputs

2C reads only the following control artifacts:

```text
source_discovery_handoff
post_phase_1_domain_gate_handoff
source_discovery_matrix_manifest
neutral_evidence_bucket_manifest
adapter_expansion_log
source_family_index
```

2C reads only the following Phase 1 v5 common-root artifacts:

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

2C must not read old family artifacts such as:

```text
lossless_family__P1_PRODUCT
lossless_family__P2_PLATFORM_FEATURE_SOLUTION
lossless_family__P3_AI_CAPABILITY_TECHNICAL
lossless_family__P4_USE_CASE_INDUSTRY
lossless_family__P5_ENTERPRISE_PRICING
```

## 4. Candidate-Creation vs Context-Only Roots

Candidate-creation roots:

```text
product_service
platform_feature_solution
technical_docs_api
docs_api_data_flow
integrations_ecosystem
pricing_commercial_availability
```

Context-only roots:

```text
use_case_customer_industry
support_help_resources
ai_safety_transparency
```

The context-only roots may provide context for Phase 5. They may not create standalone activity candidates inside 2C or downstream deterministic candidate inventory.

## 5. 2C / Phase 5 Boundary

2C owns:

```text
activity_profile_source_index
```

Phase 5 owns:

```text
feature_candidate_inventory
target_feature_profile
target_feature_profile_forensics
```

2C must not emit, mutate, compile, or validate Phase 5 material outputs.

Phase 5 must eventually consume:

```text
activity_profile_source_index
active_run_package_manifest
domain_derivation_profile
mounted domain package
```

Phase 5 then derives package-specific activity values.

## 6. Domain Package Boundary

2C must stay domain-agnostic because it runs before the mounted domain package is applied to Activity Profile Review.

2C may locate generic evidence shapes.

2C must not derive package-specific classifications. Forbidden examples include:

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

These belong to Phase 5 after the domain package is mounted.

## 7. Deterministic Layer Boundary

The deterministic layer may:

1. Collect sparse Phase 1 v5 source rows.
2. Produce a source coverage index.
3. Produce a document structure index.
4. Produce neutral locator maps.
5. Build a semantic label queue.
6. Record missing/limited source items.

The deterministic layer must not:

1. Copy source text.
2. Summarize source text.
3. Produce mechanics proof.
4. Produce an activity profile answer.
5. Emit feature candidate inventory.
6. Emit package-specific classifications.
7. Interpret regulatory, exposure, data-provenance, legal, compiler, or QR consequences.

## 8. Semantic Layer Boundary

The semantic layer may label deterministic queue rows with allowed neutral route classes and signal families only.

Allowed route classes:

```text
ACTIVITY_CANDIDATE_SOURCE_ROUTE
PRODUCT_CAPABILITY_ROUTE
FEATURE_MECHANICS_ROUTE
TECHNICAL_MECHANICS_ROUTE
API_INTERACTION_ROUTE
DATA_OBJECT_INTERACTION_ROUTE
INTEGRATION_ACTION_ROUTE
COMMERCIAL_AVAILABILITY_ROUTE
CUSTOMER_USE_CONTEXT_ROUTE
SUPPORT_OPERATIONAL_CONTEXT_ROUTE
AUTOMATION_TRANSPARENCY_CONTEXT_ROUTE
HUMAN_CONTROL_CONTEXT_ROUTE
EXTERNAL_ACTION_CONTEXT_ROUTE
INPUT_OUTPUT_OBJECT_CONTEXT_ROUTE
SOURCE_LIMITATION_ROUTE
```

Allowed confidence values:

```text
CLEAR
PARTIAL
UNCLEAR
```

The semantic layer must not output prose explanations, source excerpts, profile values, package labels, archetypes, surfaces, or any selected-package conclusion.

## 9. Final Backend Output Contract

When Steps 4-6 are built, the final index must be:

```text
activity_profile_source_index
```

Expected final branches:

```text
source_coverage_index
activity_profile_document_structure_index
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
priority_activity_profile_locator
semantic_navigation_index
missing_limited_activity_profile_items
downstream_rules
lock_status
```

## 10. Source Text Policy

The index may carry source pointers and unit pointers. It must not carry copied lossless text.

Allowed pointer fields include:

```text
source_artifact
source_id
common_root
source_url
source_pointer
unit_pointer
char_range
route_class
route_code
signal_families
candidate_creation_allowed
context_only
confidence_hint
```

Forbidden copied evidence fields include:

```text
lossless_text
clean_text
text
body
content
excerpt
snippet
summary
source_summary
evidence_summary
profile_answer
mechanics_proof
activity_candidate_summary
```

## 11. Stop Condition

For the current build stage, stop after the 2C package is created. Do not claim compiler, final validator, orchestrator, runtime wiring, package audit check, implementation check, cartography sync, or Phase 5 sync until those steps are explicitly built.
