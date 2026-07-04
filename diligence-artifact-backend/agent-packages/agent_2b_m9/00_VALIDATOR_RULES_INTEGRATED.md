# 00_VALIDATOR_RULES_INTEGRATED
## Agent 2B / M9 Hybrid Validator Overlay

This overlay binds the final compiled `legal_cartography_index` to the current backend M9 validator and normalizer.

It does not loosen final artifact validation.

The internal artifacts `legal_cartography_deterministic_map`, `legal_cartography_semantic_profile`, and optional `legal_cartography_reinvestigation_workpad` are M9-owned internal artifacts. They are not the final downstream contract.

## Required final top-level shape

The final compiled artifact must contain exactly one final downstream root: `legal_cartography_index`.

Inside `legal_cartography_index`, use exactly these keys:

- `document_coverage_index`
- `document_structure_index`
- `incorporated_linked_document_map`
- `control_language_locator`
- `qualified_review_legal_signals`
- `missing_limited_legal_governance_items`
- `downstream_rules`
- `lock_status`

`qualified_review_legal_signals` must be an object with exactly three branches: `legal_notice_contact`, `liability_cap_basis`, and `sla_support_posture`.

It must include exactly three `question_rows`, one each for `QR-004`, `QR-013`, and `QR-016`.

`question_index` must include keys `QR-004`, `QR-013`, and `QR-016`.

The object must not copy full clause text, generate legal advice, generate compliance conclusions, or generate enforceability conclusions. `full_clause_text_copied`, `legal_advice_generated`, `compliance_conclusion_generated`, and `enforceability_conclusion_generated` must be `false`.

## Required downstream_rules booleans

`downstream_rules.m6_is_navigation_not_legal_authority` must be `true`.

`downstream_rules.embedded_legal_instruments_are_indexable` must be `true`.

`downstream_rules.use_only_loaded_legal_corpus` must be `true`.

`downstream_rules.referenced_unloaded_documents_must_not_be_fetched` must be `true`.

## Allowed source_type values only

Every `source_type` must be one of:

- `URL`
- `EMBEDDED_UNIT`
- `INTERNAL_REFERENCE`
- `METADATA_ONLY`
- `REFERENCED_URL`
- `ABSENT_FAMILY`

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

## Artifact class discipline

Use only the backend validator artifact-class values.

Keep these hard mappings:

- `AI_USAGE_GOVERNANCE` -> `AI_TERMS_POLICY`, `CONTENT_POLICY`, or `HOSTED_LEGAL_ARTIFACT`
- `PRIVACY_ADJACENT_NOTICES` -> `COOKIE_POLICY`, `DATA_REQUEST_PAGE`, `PRIVACY_POLICY`, or `NOTICE_PAGE`
- `DPA` -> `DATA_PROCESSING_AGREEMENT`
- `SLA` -> `SLA_SUPPORT_TERMS`
- `TERMS_OF_USE` -> `TERMS_OF_SERVICE`
- `LEGAL_HUB` and `ADDITIONAL_TERMS` -> `HOSTED_LEGAL_ARTIFACT`
- `PRIVACY_ADDENDUM` -> `PRIVACY_POLICY`
- `BUSINESS_CONTINUITY_PLAN` and `INCIDENT_RESPONSE_PLAN` -> `SECURITY_POLICY`

## Structure-to-coverage parity

Every material document, annexure, schedule, exhibit, appendix, or internal legal instrument named in `document_structure_index` must also appear in `document_coverage_index`.

If `document_structure_index` contains Support Services, Support Terms, support annexure, SLA-support annexure, or a support-services unit, then `document_coverage_index` must include a corresponding row using:

- `artifact_class: SUPPORT_TERMS` or `SLA_SUPPORT_TERMS`
- `source_type: EMBEDDED_UNIT` if embedded in a loaded document
- `source_corpus_status: FOUND_EMBEDDED_IN_LEGAL_CORPUS`
- `status: FOUND_EMBEDDED_IN_LEGAL_CORPUS`

## Hybrid row enrichment

Final rows may include additional navigation fields such as `document_id`, `section_id`, `lossless_artifact_name`, `heading_path`, `navigation_pointer`, semantic labels, confidence, and boundary notes.

These enrichment fields must not replace the current required fields.

## Forbidden keys

Do not emit `m6_authorization_status`, `m6_bucket_subcategory`, `legal_stack_summary`, target-profile artifacts, data-provenance artifacts, registry artifacts, final handoff, renderer payload, legal advice, compliance conclusions, sufficiency conclusions, enforceability assessments, risk conclusions, or registry evaluations inside the final compiled `legal_cartography_index`.

## Final self-check before output

Before returning/saving the final compiled index, verify that no row contains a source_type, source_corpus_status, status, or artifact_class outside the allowed lists above. If a value is uncertain, use the nearest allowed normalized value and carry the uncertainty in `limitation`.
