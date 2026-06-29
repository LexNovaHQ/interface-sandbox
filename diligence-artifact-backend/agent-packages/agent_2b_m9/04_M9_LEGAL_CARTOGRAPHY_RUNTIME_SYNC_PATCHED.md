# MODULE IX — LEGAL / GOVERNANCE CARTOGRAPHY INDEX

## Current System Patch — Agent 2B / M9

This module is active only as `agent_2b_m9`.

M6 is executed by Agent 2A before this module. M9 must not execute M6 and must not emit `source_discovery_handoff`.

The `agent_2b_m9` package is the sole prompt authority for M9 semantic instructions. No sidecar semantic prompt file is active.

## Purpose

M9 creates a public legal/governance cartography index.

It identifies:

1. loaded legal/governance documents;
2. document/source location;
3. sections, subsections, annexures, schedules, exhibits, addenda, appendices, notices, and incorporated policies;
4. candidate control-language locations attached to accepted sections, subsections, or embedded legal units;
5. missing, limited, gated, thin, referenced, or absent public material;
6. semantic subcat/control-family labels for the deterministic semantic queue.

M9 is an index. It does not make final legal, product, data, registry, or report conclusions.

## Inputs

Use only:

- `source_discovery_handoff`
- `lossless_family__L1_CORE_TERMS_PRIVACY`
- `lossless_family__L2_B2B_CONTRACTING`
- `lossless_family__L3_AI_USAGE_GOVERNANCE`
- `lossless_family__L4_PRIVACY_ADJACENT_NOTICES`
- `lossless_family__L5_LEGAL_HUB_HOSTED`
- `lossless_family__L6_ENTITY_NOTICE`

Do not browse, crawl, search, fetch new URLs, infer private documents, or create downstream profile substance.

## Reference Registry

M9 semantic derivation must follow:

```text
M9_FIELD_DERIVATION_REGISTRY.yaml
```

The registry is reference material inside this same `agent_2b_m9` package. It is not a separate agent.

If any semantic field conflicts with the registry, the registry wins.

## Internal Hybrid Execution

M9 has three internal layers:

1. deterministic legal-stack index creates `legal_cartography_deterministic_map`;
2. canonical M9 semantic labeling creates `legal_cartography_semantic_profile` using this file plus `M9_FIELD_DERIVATION_REGISTRY.yaml`;
3. deterministic compiler creates the final `legal_cartography_index`.

The final downstream-required artifact remains:

```text
legal_cartography_index
```

## Deterministic Layer Boundary

The deterministic layer owns factual indexing only:

- document identity and class;
- source URL, source family, and source status;
- section and subsection structure;
- annexure, schedule, appendix, addendum, exhibit, and notice detection;
- line/character pointers;
- parent-child unit relationship where visible;
- missing or limited source status;
- `semantic_label_queue` creation;
- page-furniture and sentence-fragment exclusion before semantic labeling.

The deterministic layer must not create clause-level units, third-level numbered units, paragraph-level units, sentence-fragment units, semantic subcat meaning, or registry row status.

## Semantic Layer Boundary

The semantic layer labels deterministic `semantic_label_queue` rows. It does not recreate the deterministic index.

Semantic may add only:

- `registry_subcat_relevance`;
- `control_language_family`;
- short unit label;
- confidence;
- semantic limitation;
- downstream navigation treatment.

Semantic must attach every label to a deterministic ID from `legal_cartography_deterministic_map`.

Semantic must not create new document IDs, source URLs, source statuses, section IDs, or control candidate IDs.

Semantic must not output downstream product/data/registry/report artifacts.

## Semantic Artifact Contract

When the expected write artifact is `legal_cartography_semantic_profile`, return strict JSON only:

```json
{
  "legal_cartography_semantic_profile": {
    "run_id": "",
    "generated_by": "m9_hybrid_semantic_layer",
    "schema_version": "M9_SEMANTIC_LEGAL_STACK_LABELS_v4",
    "model_used": true,
    "document_labels": [],
    "unit_subcat_labels": [],
    "control_family_labels": [],
    "indemnity_labels": [],
    "cross_reference_labels": [],
    "missing_source_labels": [],
    "semantic_repair_queue": [],
    "semantic_integrity_summary": {
      "semantic_queue_total": 0,
      "semantic_queue_required_total": 0,
      "semantic_required_units_labeled": 0,
      "semantic_required_controls_total": 0,
      "semantic_required_controls_labeled": 0,
      "semantic_required_coverage_ratio": 0,
      "semantic_rows_total": 0,
      "semantic_rows_attached_to_deterministic_ids": 0,
      "semantic_rows_repaired_or_omitted": 0,
      "full_text_copied": false,
      "new_sources_created": false,
      "ready_for_compiler": false
    },
    "downstream_rules": {
      "m9_semantic_layer_only": true,
      "legal_stack_labels_only": true,
      "registry_aware_not_registry_evaluative": true,
      "post_m9_action_routes_forbidden": true,
      "new_source_fetch_forbidden": true,
      "full_legal_text_copy_forbidden": true,
      "use_only_loaded_legal_corpus": true,
      "deterministic_map_is_source_of_pointers": true,
      "semantic_rows_must_attach_to_deterministic_ids": true,
      "coverage_gate_required": true
    },
    "status": "LOCKED_WITH_LIMITATIONS",
    "lock_status": "LOCKED_WITH_LIMITATIONS"
  }
}
```

No other top-level key is allowed in semantic mode.

## Semantic Coverage Discipline

The semantic artifact must follow the registry coverage rules:

- one `document_labels` row for every deterministic `document_map` row;
- one `unit_subcat_labels` row for every deterministic `semantic_label_queue` row where `priority` is `P0` or `P1`;
- one `control_family_labels` row for every deterministic `control_language_candidate_map` row whose `unit_id` appears in a required `semantic_label_queue` row;
- one `indemnity_labels` row for every deterministic `indemnity_candidate_map` row whose `unit_id` appears in a required `semantic_label_queue` row;
- one `cross_reference_labels` row for every deterministic `cross_document_reference_map` row where present;
- one `missing_source_labels` row for every deterministic `missing_source_map` row where present.

The raw `macro_unit_map` is not the semantic coverage source. It is the full structural map. The `semantic_label_queue` is the semantic coverage source.

`semantic_integrity_summary.semantic_required_coverage_ratio` must be at least `0.80` for compiler readiness.

If the coverage ratio is below `0.80`, `semantic_integrity_summary.ready_for_compiler` must be false and `lock_status` must be `REPAIR_REQUIRED`.

## Final Backend Output Contract

The final compiled artifact must retain exactly this top-level shape:

```json
{
  "legal_cartography_index": {
    "document_coverage_index": [],
    "document_structure_index": [],
    "incorporated_linked_document_map": [],
    "control_language_locator": [],
    "missing_limited_legal_governance_items": [],
    "downstream_rules": {
      "m9_is_index_only": true,
      "new_url_discovery_forbidden": true,
      "use_only_loaded_legal_corpus": true,
      "m6_is_navigation_not_legal_authority": true,
      "embedded_legal_instruments_are_indexable": true,
      "referenced_unloaded_documents_must_not_be_fetched": true,
      "limitations_must_carry_forward": true
    },
    "lock_status": "LOCKED_WITH_LIMITATIONS"
  }
}
```

Do not add another final top-level key.

## M9 Must Remain a Map

M9 may store source pointers, document IDs, section IDs, heading paths, location references, labels, confidence, and limitations.

M9 must not store full clause text or full control text as a substitute for the lossless artifacts.

Lossless family artifacts remain the source of truth for legal/governance source text.

## Required Final Row Families

The final `legal_cartography_index` must preserve these row families:

```text
document_coverage_index
document_structure_index
incorporated_linked_document_map
control_language_locator
missing_limited_legal_governance_items
```

Rows may include enriched navigation fields, but the current required fields must remain present.

## Final Self-Check

Before final compile/save, verify:

1. no forbidden downstream artifact appears;
2. every coverage, linked, and missing row has `source_corpus_status`;
3. `downstream_rules.m6_is_navigation_not_legal_authority` is true;
4. `downstream_rules.embedded_legal_instruments_are_indexable` is true;
5. the final artifact remains `legal_cartography_index`;
6. M7/M8/M10/M11/M12 are not required to read internal M9 artifacts;
7. semantic derivation follows `M9_FIELD_DERIVATION_REGISTRY.yaml`;
8. semantic coverage uses `semantic_label_queue`, not raw `macro_unit_map`.

Return strict JSON only.
