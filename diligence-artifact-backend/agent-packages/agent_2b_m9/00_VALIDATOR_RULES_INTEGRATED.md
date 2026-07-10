# 00_VALIDATOR_RULES_INTEGRATED

## Agent 2B / M9 Validator Overlay

This overlay binds the restored main M9 validation surface.

M9 validates the final downstream root:

```text
legal_cartography_index
```

The deterministic and semantic artifacts remain M9-owned internal artifacts:

```text
legal_cartography_deterministic_map
legal_cartography_semantic_profile
legal_cartography_reinvestigation_workpad
```

`legal_signal_derivation_profile` is preserved as a compatibility artifact only until downstream cutover.

## Active input contract

M9 must validate against the Phase 1 v5 / 17-root source contract: common-root artifacts, legal-doc control artifacts, and individual `legal_doc_*` artifacts.

Required v5 roots include:

```text
lossless_root__regulatory_licensing_status
lossless_root__grievance_complaints
```

Old `lossless_family__L*` input contracts, retired root artifacts, and legacy family adapters are invalid.

## Required Root

The compiled artifact must contain exactly one root:

```text
legal_cartography_index
```

Inside `legal_cartography_index`, use these keys:

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

M9 is index/navigation only.

M9 may emit `qualified_review_legal_signals` only as a deterministic locator-signal object. It must not emit legal advice, compliance conclusions, enforceability conclusions, risk conclusions, regulatory conclusions, grievance sufficiency conclusions, or full clause text.

## Required downstream_rules booleans

`downstream_rules.source_discovery_is_navigation_not_legal_authority` must be `true`.

`downstream_rules.embedded_legal_instruments_are_indexable` must be `true`.

`downstream_rules.use_only_phase1_v5_legal_common_roots_and_legal_doc_artifacts` must be `true`.

`downstream_rules.phase1_v5_source_contract_required` must be `true`.

`downstream_rules.referenced_unloaded_documents_must_not_be_fetched` must be `true`.

`downstream_rules.qualified_review_legal_signals_true_derived_object` must be `true`.

`downstream_rules.target_profile_legal_signal_locators_owned_by_2a` must be `true`.

`downstream_rules.full_legal_governance_cartography_owned_by_2e` must be `true`.

`downstream_rules.regulatory_grievance_conclusions_forbidden` must be `true`.

## Allowed source_type values only

Every `source_type` must be one of:

```text
URL
LEGAL_DOC_ARTIFACT
COMMON_ROOT
EMBEDDED_UNIT
INTERNAL_REFERENCE
METADATA_ONLY
REFERENCED_URL
ABSENT_FAMILY
```

## Allowed source_corpus_status values only

Every coverage, linked, and missing row must include `source_corpus_status` using one of:

```text
FOUND_AS_PRIMARY_SOURCE
FOUND_EMBEDDED_IN_LEGAL_CORPUS
FOUND_AS_LINKED_REFERENCE
REFERENCED_BUT_NOT_FETCHED
STANDALONE_SOURCE_ABSENT
SOURCE_REJECTED_OR_FAILED
UNKNOWN_NOT_SEARCHED
FOUND_THIN
```

## Allowed row status values only

Use only:

```text
FOUND_INDEXED
FOUND_HOSTED_INDEXED
FOUND_EMBEDDED_IN_LEGAL_CORPUS
FOUND_THIN
STANDALONE_SOURCE_ABSENT
ACCESS_FAILED
GATED
DEFERRED
REFERENCED_BUT_NOT_FETCHED
SOURCE_REJECTED_OR_FAILED
UNKNOWN_NOT_SEARCHED
NOT_APPLICABLE_CONTEXTUAL
THIN
INSUFFICIENT_PUBLIC_MATERIAL
```

Never use old raw crawler states such as active, absent, rejected, not fetched, duplicate suppressed, or source-not-authorized phrasing.

## Artifact class discipline

Use only backend validator artifact-class values, including bounded Phase 1 v5 classes:

```text
REGULATORY_DISCLOSURE
GRIEVANCE_POLICY
CONSUMER_DISCLOSURE
```

## Structure-to-coverage parity

Every material document, annexure, schedule, exhibit, appendix, or internal instrument named in `document_structure_index` must also appear in `document_coverage_index`.

## Semantic validator discipline

`legal_cartography_semantic_profile` must use exactly:

```text
queue_id
unit_id
subcats
control_families
confidence
```

Confidence must be one of:

```text
CLEAR
PARTIAL
UNCLEAR
```

The semantic layer must label every deterministic P0/P1 queue row with at least 0.80 coverage. Empty model output must not be normalized into ready compiler status.

## Forbidden conclusions

Do not emit:

```text
license_validity
license_requirement
applicable_regulator
regulatory_compliance_status
RBI_applicability
SEBI_applicability
FCA_authorisation_status
grievance_sufficiency
grievance_compliance_status
ombudsman_requirement
statutory_complaint_obligation
```

## Forbidden keys

Do not emit old source-routing keys, old family input contract names, legacy adapter markers, target artifacts, data artifacts, registry artifacts, final handoff, renderer payload, legal advice, compliance conclusions, enforceability conclusions, risk conclusions, or registry evaluations inside M9.

## Final self-check before output

Before returning/saving M9, verify that no row contains a source_type, source_corpus_status, status, or artifact_class outside the allowed lists above and that `qualified_review_legal_signals` and regulatory/grievance locators are locator-only.
