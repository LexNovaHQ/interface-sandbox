# M9 Hybrid Compiler Contract

This file belongs to `agent_2b_m9` only.

The compiler is deterministic. It produces the final downstream-facing artifact:

```text
legal_cartography_index
```

## Inputs

The compiler may read:

```text
legal_cartography_deterministic_map
legal_cartography_semantic_profile
legal_cartography_reinvestigation_workpad
```

The reinvestigation workpad is optional.

## Final Output Shape

The final `legal_cartography_index` must retain the current backend-compatible top-level shape:

```text
document_coverage_index
document_structure_index
incorporated_linked_document_map
control_language_locator
missing_limited_legal_governance_items
downstream_rules
lock_status
```

## Merge Rules

The compiler performs a strict merge.

Deterministic map rows control factual identifiers, source URLs, artifact names, source status, and navigation pointers.

Semantic labels may attach only to an existing deterministic pointer.

If a semantic label does not attach to an existing deterministic pointer, the compiler rejects or quarantines it.

The compiler must not copy full legal text or full control text into the final M9 artifact.

The compiler must not fetch sources, browse, crawl, or infer private documents.

## Final Compatibility Rule

Downstream phases continue to read only:

```text
legal_cartography_index
```

Internal artifacts remain M9-owned and non-required downstream.

## Boundary Rules

The compiler must not emit downstream profiles, registry-row decisions, redline instructions, final handoff, renderer payload, or report prose.

## Status Rule

Use `LOCKED` only when the compiled index is complete against the loaded legal corpus.

Use `LOCKED_WITH_LIMITATIONS` when the index is usable but contains unresolved ordinary limitations.

Use `REPAIR_REQUIRED` only for repairable schema or source-discipline problems.

Use `CONTROLLED_FAILURE` only when the legal/governance corpus or source custody is unusable.
