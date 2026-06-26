# 00_VALIDATOR_RULES_INTEGRATED
## Agent 2B / M9 Current Backend Validator Overlay

This overlay binds the package to the current backend M9 validator. It does not loosen the validator. The model must comply with these exact values before returning JSON.

## Required top-level shape

Return exactly one object with one top-level key: `legal_cartography_index`.

Inside `legal_cartography_index`, use exactly these keys:

- `document_coverage_index`
- `document_structure_index`
- `incorporated_linked_document_map`
- `control_language_locator`
- `missing_limited_legal_governance_items`
- `downstream_rules`
- `lock_status`

## Required downstream_rules booleans

`downstream_rules.m6_is_navigation_not_legal_authority` must be `true`.

`downstream_rules.embedded_legal_instruments_are_indexable` must be `true`.

## Allowed source_type values only

Every `source_type` must be one of:

- `URL`
- `EMBEDDED_UNIT`
- `INTERNAL_REFERENCE`
- `METADATA_ONLY`
- `REFERENCED_URL`
- `ABSENT_FAMILY`

Hard mappings:

- `Embedded`, `EMBEDDED_TEXT`, embedded source fragments, and embedded sections -> `EMBEDDED_UNIT`
- `Family Probe`, `ABSENT_PROBE`, and absent family checks -> `ABSENT_FAMILY`
- `Referenced`, `REFERENCED_EXTERNAL`, and external referenced documents with no loaded text -> `REFERENCED_URL`
- loaded public URLs -> `URL`
- internal cross-references inside a loaded document -> `INTERNAL_REFERENCE`
- metadata-only listed material -> `METADATA_ONLY`

## Allowed source_corpus_status values only

Every coverage, linked, and missing row must include `source_corpus_status` using one of:

- `FOUND_AS_PRIMARY_SOURCE`
- `FOUND_EMBEDDED_IN_LEGAL_CORPUS`
- `FOUND_AS_LINKED_REFERENCE`
- `REFERENCED_BUT_NOT_FETCHED`
- `STANDALONE_SOURCE_ABSENT`
- `SOURCE_REJECTED_OR_FAILED`
- `UNKNOWN_NOT_SEARCHED`

## Allowed row status values only

Use only:

- `FOUND_INDEXED`
- `FOUND_HOSTED_INDEXED`
- `FOUND_EMBEDDED_IN_LEGAL_CORPUS`
- `FOUND_THIN`
- `STANDALONE_SOURCE_ABSENT`
- `ACCESS_FAILED`
- `GATED`
- `DEFERRED`
- `REFERENCED_BUT_NOT_FETCHED`
- `SOURCE_REJECTED_OR_FAILED`
- `UNKNOWN_NOT_SEARCHED`
- `NOT_APPLICABLE_CONTEXTUAL`
- `THIN`
- `INSUFFICIENT_PUBLIC_MATERIAL`

Never use `ACTIVE`, `ABSENT`, `REJECTED`, `NOT_FETCHED`, `DUPLICATE_SUPPRESSED`, `ABSENT_AFTER_M6_TARGETED_PROBE`, `REFERENCED_NOT_AUTHORIZED_BY_M6`, or `UPLOADED_ONLY_LIMITATION`.

## Allowed artifact_class values only

Use only the backend validator values. Map `AI_USAGE_GOVERNANCE` to `AI_TERMS_POLICY` when the item is an AI/usage legal terms document, to `CONTENT_POLICY` when it is content/usage restriction material, or to `HOSTED_LEGAL_ARTIFACT` if unclear.

## Forbidden keys

Do not emit `m6_authorization_status`, `m6_bucket_subcategory`, `legal_stack_summary`, `source_discovery_handoff`, target-profile artifacts, data-provenance artifacts, registry artifacts, final handoff, renderer payload, legal advice, compliance conclusions, sufficiency conclusions, enforceability assessments, risk conclusions, or registry evaluations.

## Final self-check before output

Before returning JSON, verify that no row contains a source_type, source_corpus_status, status, or artifact_class outside the allowed lists above. If a value is uncertain, use the nearest allowed normalized value and carry the uncertainty in `limitation`.
