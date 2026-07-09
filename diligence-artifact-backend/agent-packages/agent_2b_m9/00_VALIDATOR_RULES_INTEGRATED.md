# 00_VALIDATOR_RULES_INTEGRATED

## Agent 2B / M9 Validator Overlay

This overlay binds Phase 2 to two separate validation surfaces:

```text
Job A — legal_cartography_index
Job B — legal_signal_derivation_profile
```

## Active input contract

Legal Cartography and Index must validate against the Phase 1 source contract: common-root artifacts, legal-doc control artifacts, and `legal_doc_*` artifacts.

Old family input contracts and legacy family adapters are invalid.

## Job A Required Root

The compiled Job A artifact must contain exactly one root:

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
legal_notice_locator
dispute_resolution_locator
governing_law_venue_locator
contact_grievance_locator
missing_limited_legal_governance_items
downstream_rules
lock_status
```

Job A is index/navigation only.

Job A must not contain reviewer-question structures, field-derived signal answers, target outputs, data outputs, final handoff outputs, renderer payloads, old family input contracts, or legacy family adapter markers.

## Job B Required Root

The deterministic Job B artifact must contain exactly one root:

```text
legal_signal_derivation_profile
```

Job B must validate against:

```text
M9_LEGAL_SIGNAL_DERIVATION_CONTRACT.md
src/phases/02-legal-cartography-index/legal-cartography-index.contract.js
```

Job B must contain the locked 21 field-registry keyed rows across:

```text
legal_notice_contact_signal_map
jurisdiction_dispute_signal_map
privacy_grievance_contact_signal_map
consent_manager_signal_map
```

## Job B Status Discipline

Job B may use only the controlled status vocabulary locked in `M9_LEGAL_SIGNAL_DERIVATION_CONTRACT.md`.

Loose absence values are invalid.

If a locator exists, Job B must not emit exhaustive-scan failure.

## Required downstream_rules booleans for Job A

`downstream_rules.m6_is_navigation_not_legal_authority` must be `true`.

`downstream_rules.embedded_legal_instruments_are_indexable` must be `true`.

`downstream_rules.use_only_phase1_legal_common_root_and_legal_doc_sources` must be `true`.

`downstream_rules.referenced_unloaded_documents_must_not_be_fetched` must be `true`.

## Allowed source_type values only

Every `source_type` must be one of:

```text
LEGAL_DOC_ARTIFACT
COMMON_ROOT
EMBEDDED_UNIT
INTERNAL_REFERENCE
METADATA_ONLY
REFERENCED_URL
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

Use only backend validator artifact-class values.

## Structure-to-coverage parity

Every material document, annexure, schedule, exhibit, appendix, or internal instrument named in `document_structure_index` must also appear in `document_coverage_index`.

## Forbidden keys

Do not emit old source-routing keys, old family input contract names, legacy adapter markers, target artifacts, data artifacts, registry artifacts, final handoff, renderer payload, or registry evaluations inside Job A or Job B.

## Final self-check before output

Before returning/saving Job A, verify that no row contains a source_type, source_corpus_status, status, or artifact_class outside the allowed lists above.

Before returning/saving Job B, verify that all 21 field rows are present and no reviewer-question fields are present.
