# Legal Cartography and Index — Hybrid Compiler Contract

This file belongs to the **Legal Cartography and Index** phase.

The compatibility package path and filename retain the old internal identifier because the current backend still references those paths.

Legal Cartography and Index is split into two internal jobs:

```text
Job A — Legal Cartography Index
Job B — Legal Signal Derivation
```

This compiler contract governs Job A only.

## Job A Output

The Job A compiler is deterministic. It produces the index/navigation artifact:

```text
legal_cartography_index
```

## Job A Inputs

The Job A compiler may read:

```text
legal_cartography_deterministic_map
legal_cartography_semantic_profile
legal_cartography_reinvestigation_workpad
```

The reinvestigation workpad is optional.

## Job A Final Output Shape

The final `legal_cartography_index` must retain the backend-compatible top-level shape:

```text
document_coverage_index
document_structure_index
incorporated_linked_document_map
control_language_locator
semantic_navigation_index
priority_semantic_locator
legal_notice_locator
dispute_resolution_locator
governing_law_venue_locator
contact_grievance_locator
missing_limited_legal_governance_items
downstream_rules
lock_status
```

`legal_cartography_index` is an index/navigation artifact only.

It must not contain:

```text
question_id
reviewer_question
question_rows
question_index
legal_signal_derivation_profile
m7_deterministic_legal_signal_overlay
m10_selected_legal_support_packet
target_profile
data_provenance_profile
renderer_payload
```

The two old support artifact names above are forbidden output names. They are retained in this list only as prohibited compatibility artifacts.

## Merge Rules

The compiler performs a strict merge.

Deterministic map rows control factual identifiers, source URLs, artifact names, source status, and navigation pointers.

Semantic labels may attach only to an existing deterministic pointer.

If a semantic label does not attach to an existing deterministic pointer, the compiler rejects or quarantines it.

The compiler must not copy full source text into the final Legal Cartography and Index artifact.

The compiler must not fetch sources, browse, crawl, or infer private documents.

## Final Compatibility Rule

Downstream phases may continue to read:

```text
legal_cartography_index
```

The deterministic Job B separately emits:

```text
legal_signal_derivation_profile
```

Job B is not part of the Job A compiler. It consumes the saved Job A artifacts and loaded legal-governance corpus.

## Boundary Rules

The Job A compiler must not emit downstream profiles, registry-row decisions, redline instructions, final handoff, renderer payload, report prose, or field-derived signal answers.

The Job A compiler may emit locator rows and navigation pointers that Job B can later use.

## Status Rule

Use `LOCKED` only when the compiled index is complete against the loaded legal-governance corpus.

Use `LOCKED_WITH_LIMITATIONS` when the index is usable but contains unresolved ordinary limitations.

Use `REPAIR_REQUIRED` only for repairable schema or source-discipline problems.

Use `CONTROLLED_FAILURE` only when the legal-governance corpus or source custody is unusable.

## Legal Signal Derivation Boundary

The prior downstream object named `qualified_review_legal_signals` is retired from the Legal Cartography and Index package contract.

Legal signal derivation is now a separate deterministic Job B output:

```text
legal_signal_derivation_profile
```

Job B derives field-registry keyed rows only. It must not emit question-shaped or reviewer-facing rows.

Job B must follow:

```text
M9_LEGAL_SIGNAL_DERIVATION_CONTRACT.md
```

The filename is retained for compatibility; the governing phase name is **Legal Cartography and Index**.

Job B may use `legal_cartography_index`, `legal_cartography_deterministic_map`, `legal_cartography_semantic_profile`, and loaded legal-governance source text as source authority.
