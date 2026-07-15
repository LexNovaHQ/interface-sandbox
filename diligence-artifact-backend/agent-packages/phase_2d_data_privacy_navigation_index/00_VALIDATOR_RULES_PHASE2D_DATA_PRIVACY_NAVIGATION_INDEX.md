# Validator Rules — P2D Data Privacy Navigation Index

## Required Artifacts

P2D must emit exactly:

```text
data_privacy_deterministic_map
data_privacy_semantic_profile
data_privacy_navigation_index
```

## Required Final Artifact

`data_privacy_navigation_index` must be the final artifact. Its `artifact_type` must equal `data_privacy_navigation_index`.

## Required Final Keys

The final artifact must preserve this key order:

```text
artifact_type
manifest_version
phase_id
downstream_phase_id
layer_id
execution_mode
navigation_policy
deterministic_navigation_spine
semantic_navigation_overlay
validation_quality_control_result
lock_status
```

## Required Route Counts

The deterministic navigation spine must include:

```text
5 data_source_routes
5 d_family_routes compatibility aliases
2 legal_index_routes
2 l_family_routes compatibility aliases
```

## Required Batch Pointer Rules

Each semantic batch pointer must include:

```text
batch_id
families
field_count
expected_artifact_name
required_data_source_route_ids
selective_legal_route_ids
required_d_family_route_ids
selective_l_family_route_ids
reading_priority
```

The compatibility keys must be populated so Phase 7 Layer 3 can continue operating without semantic-batch surgery.

## Forbidden

The output must not contain retired D-family or retired root inputs:

```text
lossless_family__D1_SECURITY_TRUST
lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER
lossless_family__D3_DATA_GOVERNANCE_CONTROLS
lossless_family__D4_DOCS_API_DATA_FLOW
lossless_family__D5_AI_SAFETY_TRANSPARENCY
lossless_root__security_trust
lossless_root__trust_compliance
lossless_root__technical_docs_api_developer
```

The output must not contain:

```text
data_provenance_source_index
data_provenance_profile
data_provenance_profile_forensics
integrated_dap_report
extended_dap_india_readiness_profile
```

## Navigation Boundary

The validator must enforce:

```text
no_free_corpus_read
no_source_text_copy
no_summaries
no_excerpts
no_profile_values
no_legal_or_compliance_conclusions
```
