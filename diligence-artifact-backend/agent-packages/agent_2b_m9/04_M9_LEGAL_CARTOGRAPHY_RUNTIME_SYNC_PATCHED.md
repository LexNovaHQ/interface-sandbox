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
4. control-language locations attached to accepted sections, subsections, or embedded legal units;
5. missing, limited, referenced, or absent public material;
6. subcat and control-family labels for the deterministic semantic queue.

M9 is an index and map only. It is not a summary layer.

## Inputs

Use only:

- `source_discovery_handoff`
- `lossless_family__L1_CORE_TERMS_PRIVACY`
- `lossless_family__L2_B2B_CONTRACTING`
- `lossless_family__L3_AI_USAGE_GOVERNANCE`
- `lossless_family__L4_PRIVACY_ADJACENT_NOTICES`
- `lossless_family__L5_LEGAL_HUB_HOSTED`
- `lossless_family__L6_ENTITY_NOTICE`

Do not browse, crawl, search, fetch new URLs, or create downstream profile substance.

## Reference Registry

M9 semantic derivation must follow:

```text
M9_FIELD_DERIVATION_REGISTRY.yaml
```

The registry is reference material inside this same `agent_2b_m9` package. It is not a separate agent.

If any semantic field conflicts with the registry, the registry wins.

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

The deterministic layer stops at subsection depth. Clause-level and sentence-level units are not emitted.

## Semantic Layer Boundary

Semantic labels deterministic `semantic_label_queue` rows. It does not recreate the deterministic index.

Semantic emits only:

- `subcats`;
- `control_families`;
- `confidence`.

Semantic copies only:

- `queue_id`;
- `unit_id`.

No summaries, quotes, excerpts, document roles, unit descriptions, downstream treatment, notes, new IDs, new URLs, or downstream artifacts.

## Semantic Artifact Contract

When the expected write artifact is `legal_cartography_semantic_profile`, return strict JSON only:

```json
{
  "legal_cartography_semantic_profile": {
    "schema_version": "M9_SEMANTIC_NAVIGATION_INDEX_v1",
    "semantic_navigation_index": [
      {
        "queue_id": "",
        "unit_id": "",
        "subcats": [],
        "control_families": [],
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

## Semantic Coverage Discipline

Emit one `semantic_navigation_index` row for every deterministic `semantic_label_queue` row where `priority` is `P0` or `P1`.

The raw `macro_unit_map` is not the semantic coverage source. The `semantic_label_queue` is the semantic coverage source.

`semantic_integrity.coverage_ratio` must be at least `0.80` for compiler readiness.

If coverage is below `0.80`, `semantic_integrity.ready_for_compiler` must be false and `lock_status` must be `REPAIR_REQUIRED`.

## Allowed Semantic Values

`subcats` may contain only:

```text
CNS
LIA
HAL
INF
PRV
BIO
DEC
HRM
FRD
TRD
```

`control_families` may contain only:

```text
FORMATION_CONTRACT
ACTIVITY_SPECIFIC_DISCLOSURE
DATA_PRIVACY
VENDORS_TRANSFER
SECURITY
USE_SAFETY
AGENT_AUTHORITY
IP_CONTENT
COMMERCIAL_LEGAL_ALLOCATION
CONTACT_ROUTES
INDEMNITY
UNKNOWN_CONTROL_LANGUAGE
```

`confidence` must be one of:

```text
CLEAR
PARTIAL
UNCLEAR
```

If a row cannot be classified, still emit it with empty `subcats`, `UNKNOWN_CONTROL_LANGUAGE`, and `UNCLEAR` confidence.

## Final Backend Output Contract

The final compiled artifact remains:

```text
legal_cartography_index
```

The final root must preserve:

```text
document_coverage_index
document_structure_index
incorporated_linked_document_map
control_language_locator
missing_limited_legal_governance_items
qualified_review_legal_signals
downstream_rules
lock_status
```

Rows may include enriched navigation labels, but the current required fields must remain present.

Return strict JSON only.
