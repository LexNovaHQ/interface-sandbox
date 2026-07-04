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
qualified_review_legal_signals
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

## Qualified Review Legal Signals Addendum

The compiler must emit one mandatory downstream object inside `legal_cartography_index`:

```text
qualified_review_legal_signals
```

This object is index-only. It exposes navigation-backed signals for legal notice/contact, liability-cap basis, and SLA/support posture. It must not copy full clause text, compute legal effect, produce legal advice, produce compliance conclusions, or evaluate enforceability.

The object must be compiler-built from existing M9 map rows, semantic locators, keyword locators, and loaded-corpus navigation pointers. The semantic model must not emit this object directly.

The required object shape is:

```text
signal_object_version
derivation_mode
source_boundary
full_clause_text_copied
legal_advice_generated
compliance_conclusion_generated
enforceability_conclusion_generated
legal_notice_contact
liability_cap_basis
sla_support_posture
question_rows
question_index
coverage_summary
downstream_rules
```

`full_clause_text_copied`, `legal_advice_generated`, `compliance_conclusion_generated`, and `enforceability_conclusion_generated` must be `false`.

`legal_notice_contact` must derive from `legal_cartography_deterministic_map.legal_notice_contact_signal_map` and include:

```text
signal_key
question_id
field_key
reviewer_question
signal_status
legal_notice_email
legal_notice_contact_route
legal_notice_contact_source
legal_notice_contact_limitation
derived_answer_summary
evidence_basis
locator_refs
registry_basis
source_path
primary_locator
downstream_use_limit
```

`liability_cap_basis` must derive from `legal_cartography_deterministic_map.liability_cap_signal_map` and include:

```text
signal_key
question_id
field_key
reviewer_question
signal_status
clause_location
cap_formula_reference_basis
cap_period_lookback_window
exclusions_carveouts_signal
fees_pricing_reference_signal
private_value_required
limitation
derived_answer_summary
evidence_basis
locator_refs
registry_basis
source_path
primary_locator
downstream_use_limit
```

`sla_support_posture` must derive from `legal_cartography_deterministic_map.sla_support_signal_map` and include:

```text
signal_key
question_id
field_key
reviewer_question
signal_status
sla_support_artifact_found
availability_uptime_commitment_signal
service_credit_remedy_signal
support_tier_response_commitment_signal
standard_vs_custom_sla_posture
sla_exclusions_dependencies_signal
private_confirmation_required
derived_answer_summary
evidence_basis
locator_refs
registry_basis
source_path
primary_locator
downstream_use_limit
```

`question_rows` must contain exactly one row each for `QR-004`, `QR-013`, and `QR-016`. `question_index` must be keyed by `QR-004`, `QR-013`, and `QR-016`. `coverage_summary` must include `required_question_count`, `derived_question_count`, and per-branch source counts.
