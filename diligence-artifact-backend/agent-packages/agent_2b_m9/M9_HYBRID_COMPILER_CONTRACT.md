# Legal Cartography and Index — Hybrid Compiler Contract

This file belongs to the **Legal Cartography and Index** phase.

The compatibility package path and filename retain the old internal identifier because the current backend still references those paths.

Legal Cartography and Index is split into two compiler outputs:

```text
Job A — legal_cartography_index
Job B — legal_signal_derivation_profile compatibility artifact
```

This compiler contract governs both output boundaries.

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
qualified_review_locator
qualified_review_legal_signals
legal_notice_locator
dispute_resolution_locator
governing_law_venue_locator
contact_grievance_locator
regulatory_governance_locator
grievance_redressal_locator
consumer_disclosure_locator
counterparty_institution_locator
missing_limited_legal_governance_items
downstream_rules
lock_status
```

`legal_cartography_index` is an index/navigation artifact only.

It must not contain:

```text
legal_signal_derivation_profile
m7_deterministic_legal_signal_overlay
m10_selected_legal_support_packet
target_profile
data_provenance_profile
renderer_payload
legal_advice
compliance_conclusion
enforceability_assessment
risk_conclusion
license_validity
license_requirement
applicable_regulator
regulatory_compliance_status
grievance_sufficiency
grievance_compliance_status
ombudsman_requirement
```

The old support artifact names above are forbidden output names. They are retained in this list only as prohibited compatibility artifacts.

## Merge Rules

The compiler performs a strict merge.

Deterministic map rows control factual identifiers, source URLs, artifact names, source status, and navigation pointers.

Semantic labels may attach only to an existing deterministic pointer.

If a semantic label does not attach to an existing deterministic pointer, the compiler rejects or quarantines it.

The compiler must not copy full source text into the final Legal Cartography and Index artifact.

The compiler must not fetch sources, browse, crawl, or infer private documents.

## Phase 1 v5 Locator Rules

M9 may compile locator rows for:

```text
regulatory_governance_locator
grievance_redressal_locator
consumer_disclosure_locator
counterparty_institution_locator
```

These are locator rows only. They must not determine license validity, license requirement, applicable regulator, regulatory compliance, grievance sufficiency, ombudsman requirement, or statutory obligation.

## Qualified Review Locator Object

`qualified_review_legal_signals` remains inside `legal_cartography_index` as a deterministic locator-signal object.

It must remain locator-only and must not copy full clause text, produce legal advice, determine enforceability, determine compliance, or calculate liability/SLA/legal effect.

## Job B Compatibility Output

Downstream phases may continue to read:

```text
legal_signal_derivation_profile
```

This artifact is compatibility-only until downstream cutover. It must not become the active Target Profile legal-signal authority after 2A is active.

Job B derives field-registry keyed rows only. It must not emit question-shaped or reviewer-facing rows.

Job B must follow:

```text
M9_LEGAL_SIGNAL_DERIVATION_CONTRACT.md
```

## 2A / 2E Boundary

2A owns Target Profile Source Index and target-profile legal signal locators.

2E / M9 owns full legal/governance cartography.

The Job A compiler may emit locator rows and navigation pointers that Job B can later use, but neither Job A nor Job B may emit Target Profile values.

## Status Rule

Use `LOCKED` only when the compiled index is complete against the loaded legal-governance corpus.

Use `LOCKED_WITH_LIMITATIONS` when the index is usable but contains unresolved ordinary limitations.

Use `REPAIR_REQUIRED` only for repairable schema or source-discipline problems.

Use `CONTROLLED_FAILURE` only when the legal-governance corpus or source custody is unusable.

The filename is retained for compatibility; the governing phase name is **Legal Cartography and Index**.
