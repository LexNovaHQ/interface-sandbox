# 04_LEGAL_CARTOGRAPHY_INDEX.md

# THE INTERFACE — PHASE 4 LEGAL CARTOGRAPHY INDEX PROMPT

## PHASE_CALL_CARD

```yaml
phase_id: P4_LEGAL_CARTOGRAPHY_INDEX
phase_name: Legal Cartography Index
mode: prompt_live
purpose: >
  Build the canonical legal_cartography_index by classifying and indexing admitted
  legal/governance artifacts as a reference-first navigation map. Phase 4 records
  artifact classes, artifact families, artifact status, macro document units,
  notice units, control-language reference locations, cross-document references,
  artifact absence records, source coverage, routing candidates, evidence references,
  limitations, and quality.
primary_output_object: legal_cartography_index
required_top_level_output_keys:
  - legal_cartography_forensic_ledger
  - legal_cartography_trace
  - legal_cartography_index
atomic_unit: artifact -> macro_document_unit -> control_language_reference
phase_boundary: >
  Phase 4 is legal/governance cartography only. It is not legal review, compliance
  review, enforceability review, registry evaluation, data provenance, feature
  extraction, or final report drafting.
```

---

## HARD_RULES

### HR4.001 — Legal/Governance Family Only
Phase 4 may receive and reason over only admitted legal/governance family material and admitted hosted governance material. Product pages, homepage text, docs/API/developer text, pricing pages, commercial pages, feature evidence, data evidence, and registry evidence must not enter Phase 4 model context.

### HR4.002 — Reference-First, No Text Payload
Phase 4 maps locations. It does not carry long text, clause text, policy text, quotes, or summaries. Store `source_ref`, `artifact_ref`, `unit_ref`, and `char_start`/`char_end` ranges. Downstream phases fetch text only when needed.

### HR4.003 — Macro Units Only
Index macro-level structure only: titles, notices, preambles, definitions, scope/application sections, major sections, tables, schedules, annexures, appendices, exhibits, FAQ-control blocks, contact channels, version/date blocks, cross-reference blocks, and fallback full-artifact units. Do not micro-index every paragraph, subclause, bullet, definition, FAQ item, or sentence.

### HR4.004 — NOTICE Unit Required
Standalone notices, disclaimers, warning blocks, AI notices, privacy notices, legal notice blocks, review-ready notices, update notices, and banner-like warnings must be captured as `NOTICE` units when visible.

### HR4.005 — Deterministic Prepass Mandatory
Before any model confirmation, a deterministic prepass must filter sources, dedupe artifacts, assign artifact IDs, assign statuses, preclassify artifact candidates, extract macro units and char ranges, detect notices, detect cross-document references, extract contact channels, build absence records from Stage 1, and generate candidate control-language tags.

### HR4.006 — Closed Taxonomy Only
Artifact families, artifact classes, artifact statuses, document unit types, control-language types, reference methods, and quality markers must use the closed vocabularies in this prompt. Do not invent new classes, codes, or labels.

### HR4.007 — Absence Requires Upstream Basis
Artifact absence can only come from Stage 1 search/probe/access/deferred records. The model must not infer absence because a document is not remembered or not present in current context.

### HR4.008 — No Legal Review
Do not assess sufficiency, enforceability, adequacy, risk, compliance, applicability, legal validity, legal gaps, liability, or whether a clause is “good enough.”

### HR4.009 — No Registry Evaluation
Do not emit threat IDs, row statuses, TRUE/FALSE condition results, exposure ratings, registry triggers, risk scores, or registry conclusions.

### HR4.010 — No Data Provenance
Do not determine controller/processor roles, data-flow diagrams, data transfer analysis, retention sufficiency, subprocessor sufficiency, or privacy-law compliance. Phase 4 may only reference where relevant language appears.

### HR4.011 — No Feature Extraction
Do not create or revise target features, feature archetypes, surfaces, commercial outcomes, architecture hints, or feature confidence.

### HR4.012 — Navigation Priority Is Not Risk
Any priority field in Phase 4 is a navigation priority only. It is not legal risk, business risk, exposure severity, or compliance priority.

---

## INPUTS_AND_CONTEXT

```yaml
required_inputs:
  - runtime_slice:
      purpose: active governing rules required by Phase 4
  - runtime_index_slice:
      purpose: phase-specific rule call map
  - source_discovery_handoff:
      purpose: Stage 1 source admission, family routing, artifact-family coverage, absence/access/deferred records
  - source_discovery_forensic_ledger:
      purpose: upstream evidence custody, source-family status, hosted-governance admission, dedupe/absence/access-failed basis
  - legal_governance_evidence_package:
      purpose: admitted legal_governance and admitted hosted_governance artifacts only
  - legal_governance_absence_package:
      purpose: Stage 1 documented absence, unknown_not_searched, access_failed, deferred records for legal/governance artifact classes
  - target_profile_ref_metadata:
      purpose: deterministic target metadata only; not evidence for legal/governance classification
```

### Hard Input Boundary

Allowed into Phase 4 model context:

```yaml
allowed_source_material:
  - admitted legal_governance sources
  - admitted hosted_governance sources
  - legal/governance artifact absence records
  - legal/governance access_failed/deferred records
  - legal/governance dedupe/suppression records
  - deterministic target_ref metadata
```

Forbidden from Phase 4 model context:

```yaml
forbidden_source_material:
  - product pages
  - root/homepage text
  - docs/API/developer text unless already admitted as legal/governance artifact text by Stage 1
  - pricing/commercial pages
  - target profile evidence text
  - feature profile evidence text
  - data provenance evidence text
  - registry evidence
  - third-party articles, reviews, directories, news, speculation
```

### Deterministic Target Ref Copy

```yaml
deterministic_copy_only:
  legal_cartography_index.target_ref.brand_name: target_profile.identity.brand_name
  legal_cartography_index.target_ref.legal_name: target_profile.identity.legal_name
  legal_cartography_index.target_ref.domain: target_profile.identity.domain
```

The model must not inspect legal/governance artifacts to re-derive these fields.

---

## RULE_CALL_AND_CONTEXT_RETRIEVAL_PROTOCOL

### Universal Runtime Rules Called

```yaml
universal_runtime_rules:
  - public-footprint-only boundary
  - no legal advice / no legal conclusion firewall
  - one-target-per-run rule
  - admitted-evidence-only rule
  - snippet-only-is-not-evidence rule
  - no hidden scratchpad reliance
  - forensic ledger required for lock
  - trace required for lock
  - no registry truth outside registry phase
```

### Phase-Specific Rules Called

```yaml
phase4_specific_runtime_rules:
  - legal/governance source family gate
  - hosted governance admission rule
  - artifact-family absence split
  - deterministic prepass before model pass
  - reference-first map rule
  - macro-unit-only indexing rule
  - closed taxonomy rule
  - absence basis rule
```

### Context Retrieval Rule

If a field needs source content, retrieve only the exact admitted legal/governance artifact and only the macro unit needed for navigation/classification. Do not pull product, feature, commercial, docs/API, data, or registry sources into Phase 4 context.

---

## TAXONOMY

### Artifact Families

```yaml
artifact_families:
  CONTRACT_TERMS: Contract/platform terms governing access or use.
  PRIVACY_DATA: Privacy, data processing, cookies, subprocessors, data requests, retention.
  AI_GOVERNANCE: AI-specific terms, AI policy, model use, agentic controls, HITL, impact/risk assessment.
  SECURITY_TRUST: Security, trust, vulnerability, status, reliability artifacts.
  USE_SAFETY: Acceptable use, content safety, community and misuse rules.
  IP_CONTENT: IP, output ownership, copyright, DMCA, open-source notices.
  COMMERCIAL_LEGAL: Billing, cancellation, SLA, support, refund, order-form terms.
  REGULATORY_DISCLOSURE: Legal notice, public notice, transparency/government/legal request reports.
  HOSTED_GOVERNANCE: Externally hosted legal/governance artifact admitted as company-governed.
  UNKNOWN_LEGAL_GOVERNANCE: Legal/governance candidate that cannot be safely classified.
```

### Artifact Classes

```yaml
artifact_classes:
  TERMS_OF_SERVICE: CONTRACT_TERMS
  CUSTOMER_TERMS: CONTRACT_TERMS
  EULA: CONTRACT_TERMS
  ORDER_FORM_TERMS: CONTRACT_TERMS
  PRIVACY_POLICY: PRIVACY_DATA
  COOKIE_POLICY: PRIVACY_DATA
  DATA_PROCESSING_AGREEMENT: PRIVACY_DATA
  SUBPROCESSOR_LIST: PRIVACY_DATA
  DATA_REQUEST_PAGE: PRIVACY_DATA
  DATA_RETENTION_POLICY: PRIVACY_DATA
  AI_TERMS_POLICY: AI_GOVERNANCE
  AGENTIC_ADDENDUM: AI_GOVERNANCE
  HITL_POLICY: AI_GOVERNANCE
  AI_IMPACT_ASSESSMENT: AI_GOVERNANCE
  ACCEPTABLE_USE_POLICY: USE_SAFETY
  CONTENT_POLICY: USE_SAFETY
  COMMUNITY_GUIDELINES: USE_SAFETY
  IP_POLICY: IP_CONTENT
  DMCA_COPYRIGHT_POLICY: IP_CONTENT
  OPEN_SOURCE_NOTICES: IP_CONTENT
  SECURITY_POLICY: SECURITY_TRUST
  TRUST_CENTER: SECURITY_TRUST
  VULNERABILITY_DISCLOSURE: SECURITY_TRUST
  STATUS_PAGE: SECURITY_TRUST
  SLA_SUPPORT_TERMS: COMMERCIAL_LEGAL
  BILLING_CANCELLATION_TERMS: COMMERCIAL_LEGAL
  LEGAL_NOTICE_IMPRESSUM: REGULATORY_DISCLOSURE
  NOTICE_PAGE: REGULATORY_DISCLOSURE
  TRANSPARENCY_REPORT: REGULATORY_DISCLOSURE
  HOSTED_LEGAL_ARTIFACT: HOSTED_GOVERNANCE
  UNKNOWN_LEGAL_ARTIFACT: UNKNOWN_LEGAL_GOVERNANCE
```

No generic `LEGAL_DOC` or `LEGAL_DOC_GENERIC` class is allowed.

### Artifact Statuses

```yaml
artifact_statuses:
  FOUND_ADMITTED: artifact exists in admitted legal/governance evidence.
  FOUND_HOSTED_ADMITTED: externally hosted artifact admitted as company-governed.
  DUPLICATE_SUPPRESSED: duplicate suppressed by upstream or deterministic dedupe.
  DOCUMENTED_ABSENT_AFTER_SEARCH: Stage 1 searched/probed and did not find artifact class.
  UNKNOWN_NOT_SEARCHED: no reliable search/probe basis.
  ACCESS_FAILED: candidate artifact existed but access/fetch failed.
  DEFERRED: candidate artifact intentionally deferred upstream.
  NOT_APPLICABLE_CONTEXTUAL: artifact class not contextually expected; use sparingly and only with basis.
```

### Document Unit Types

```yaml
document_unit_types:
  TITLE: visible document title.
  NOTICE: notice, disclaimer, warning, AI notice, privacy notice, legal warning, review-ready notice, update notice.
  PREAMBLE: introductory overview or hierarchy block.
  DEFINITIONS: definitions section.
  SCOPE: scope/application/who-this-applies-to section.
  SECTION: top-level or major named section only.
  TABLE: table or matrix.
  SCHEDULE: schedule/service description/order details.
  ANNEX: annex or annexure.
  APPENDIX: appendix.
  EXHIBIT: exhibit.
  FAQ_CONTROL: FAQ block containing governance/control language.
  CONTACT_CHANNEL: legal/privacy/security/support contact route.
  VERSION_DATE: effective date, last updated, version, revision date.
  CROSS_REFERENCE: link/reference to another artifact.
  OTHER_MACRO_UNIT: material macro unit that does not fit above; use sparingly.
```

`CLAUSE` is retired from Phase 4.

### Control-Language Types

```yaml
control_language_types:
  FORMATION_ACCEPTANCE: acceptance, account creation, clickwrap, authority to bind.
  SERVICE_DEFINITION: service/product definition, schedule, beta/preview feature definitions.
  AI_DISCLOSURE: AI use or AI-interaction disclosure.
  PROBABILISTIC_OUTPUT: AI probabilistic/variable/wrong-output language.
  HALLUCINATION_ACCURACY_DISCLAIMER: accuracy/factual reliability disclaimer for output.
  HITL_HUMAN_REVIEW: human review, approval, verification, validation requirement.
  NO_PROFESSIONAL_ADVICE: not legal/medical/financial/tax/professional advice.
  OUTPUT_OWNERSHIP: output ownership, assignment, license, use rights.
  INPUT_CUSTOMER_DATA: input/customer/user data ownership or license.
  MODEL_TRAINING_USE: training, fine-tuning, model improvement, no-training terms.
  RAG_VECTOR_STORAGE: RAG, embeddings, vector store, model weights separation.
  RETENTION_DELETION: retention, deletion, erasure, backups, storage duration.
  DATA_SUBJECT_RIGHTS: access, deletion, correction, opt-out, portability, DSR rights.
  SUBPROCESSORS_VENDORS: subprocessors, vendors, model providers, service providers.
  CROSS_BORDER_TRANSFER: SCCs, international transfer, region/storage language.
  SECURITY_MEASURES: encryption, access controls, monitoring, SOC/ISO/security controls.
  BREACH_INCIDENT_NOTICE: breach notification, incident response.
  ACCEPTABLE_USE_RESTRICTIONS: prohibited uses, conditional uses, abuse restrictions.
  SYNTHETIC_MEDIA_DEEPFAKE: synthetic media/deepfake restrictions or labeling.
  MINORS_CHILD_SAFETY: minors, age thresholds, child safety, parental consent.
  AUTOMATED_DECISIONING: automated decisions, consequential decisions, human intervention.
  BIOMETRIC_SENSITIVE_DATA: biometric/sensitive/special-category data rules.
  AGENT_PERMISSION_SCOPE: agent permissions, read/write/transact/delete scope.
  AGENT_ACTION_LOGGING: agent logs, action records, audit trail.
  CIRCUIT_BREAKER_KILL_SWITCH: spend caps, kill switch, emergency stop, rate limits.
  LIABILITY_CAP: liability cap, damages limitation.
  WARRANTY_DISCLAIMER: AS-IS, warranty disclaimer, no guarantee.
  INDEMNITY: indemnity obligations.
  GOVERNING_LAW_DISPUTE: governing law, arbitration, venue, dispute process.
  PAYMENT_RENEWAL_CANCELLATION: payment, refund, auto-renewal, cancellation.
  SLA_AVAILABILITY_TTFT: uptime, service credits, time-to-first-token, upstream AI exclusions.
  VULNERABILITY_DISCLOSURE: vulnerability disclosure, bug bounty, security reporting.
  LEGAL_PRIVACY_SECURITY_CONTACT: legal/privacy/security notice contact.
```

### Exclusion Rules

```yaml
not_legal_governance_artifact:
  - marketing page saying secure
  - blog post about privacy trends
  - pricing page without binding payment/cancellation language
  - API docs without developer terms, API policy, AUP, rate limits, or legal usage restrictions
  - footer link label only before fetch/admission
  - third-party article/review/news/directory page
  - certification logo alone
  - product page with AI assistant language
  - contact us page unless designated as legal/privacy/security request channel
```

---

## BATCHING_AND_ROUTING_PROTOCOL

```yaml
P4_BATCH_01_SOURCE_GATE_AND_PREPASS:
  execution_blocks: [P4.B1_INPUT_PRECHECK, P4.B2_LEGAL_GOVERNANCE_SOURCE_GATE, P4.B3_DETERMINISTIC_PREPASS]
  field_rows: [FD4.001-FD4.017]

P4_BATCH_02_ARTIFACT_INVENTORY:
  execution_blocks: [P4.B4_ARTIFACT_CLASSIFICATION]
  field_rows: [FD4.018-FD4.035]

P4_BATCH_03_FAMILY_AND_UNIT_INDEX:
  execution_blocks: [P4.B5_ARTIFACT_FAMILY_MAP, P4.B6_MACRO_DOCUMENT_UNIT_INDEX]
  field_rows: [FD4.036-FD4.060]

P4_BATCH_04_CONTROL_REFERENCES_AND_ABSENCE:
  execution_blocks: [P4.B7_CONTROL_REFERENCE_MAP, P4.B8_ARTIFACT_ABSENCE_MAP]
  field_rows: [FD4.061-FD4.083]

P4_BATCH_05_CROSS_REFERENCES_AND_COVERAGE:
  execution_blocks: [P4.B9_CROSS_DOCUMENT_REFERENCE_MAP, P4.B10_SOURCE_COVERAGE]
  field_rows: [FD4.084-FD4.098]

P4_BATCH_06_ROUTING_EVIDENCE_LIMITATIONS:
  execution_blocks: [P4.B11_VAULT_ROUTING, P4.B12_EVIDENCE_REFERENCE_MAP, P4.B13_LIMITATIONS_QUALITY, P4.B14_FINAL_EMISSION]
  field_rows: [FD4.099-FD4.120]
```

---

## LIVE_FORENSIC_LEDGER_PROTOCOL

```json
{
  "phase_id": "P4_LEGAL_CARTOGRAPHY_INDEX",
  "ledger_status": "DRAFT | LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE",
  "ledger_events": [
    {
      "event_id": "P4E001",
      "event_type": "",
      "timestamp_or_sequence": "",
      "field_id": "",
      "field_path": "",
      "source_ref": "",
      "artifact_ref": "",
      "unit_ref": "",
      "control_ref_id": "",
      "location_ref": {},
      "basis_type": "deterministic | hybrid_model_confirmed | upstream_stage1_status | n/a",
      "basis": "",
      "confidence": "high | medium | low | unknown | n/a",
      "notes": ""
    }
  ],
  "coverage_matrix": {
    "legal_governance_sources_received": [],
    "legal_governance_sources_admitted": [],
    "non_legal_sources_blocked": [],
    "hosted_governance_sources_admitted": [],
    "dedupe_events": [],
    "artifact_ids_assigned": [],
    "artifact_classes_assigned": [],
    "macro_units_extracted": [],
    "notice_units_extracted": [],
    "control_refs_emitted": [],
    "control_candidates_excluded": [],
    "artifact_absence_records": [],
    "cross_document_refs": [],
    "limitations": []
  }
}
```

Allowed event types:

```yaml
allowed_event_types:
  - P4_INPUT_RECEIVED
  - P4_INPUT_MISSING
  - P4_SOURCE_GATE_PASSED
  - P4_NON_LEGAL_SOURCE_BLOCKED
  - P4_HOSTED_GOVERNANCE_ADMITTED
  - P4_DETERMINISTIC_TARGET_REF_COPY
  - P4_DETERMINISTIC_PREPASS_COMPLETED
  - P4_PREPASS_MISSING
  - P4_ARTIFACT_ID_ASSIGNED
  - P4_ARTIFACT_CLASSIFIED
  - P4_ARTIFACT_STATUS_ASSIGNED
  - P4_DEDUPE_CANONICAL_SELECTED
  - P4_DUPLICATE_SUPPRESSED
  - P4_MACRO_UNIT_EXTRACTED
  - P4_NOTICE_UNIT_EXTRACTED
  - P4_CONTROL_REF_EMITTED
  - P4_CONTROL_CANDIDATE_EXCLUDED
  - P4_ABSENCE_RECORD_EMITTED
  - P4_CROSS_REFERENCE_EMITTED
  - P4_SOURCE_COVERAGE_RECORDED
  - P4_ROUTING_CANDIDATE_EMITTED
  - P4_EVIDENCE_REF_RECORDED
  - P4_LIMITATION_RECORDED
  - P4_GATE_PASSED
  - P4_GATE_FAILED
  - P4_REPAIR_REQUIRED
  - P4_CONTROLLED_FAILURE
  - P4_LOCKED
```

---

## DERIVATION_LOGIC_PROTOCOL

Every FD4 row follows:

```text
FIELD_SIGNAL_N
DERIVE_IF
VALUE_RULE
CONFIDENCE_RULE
EXCLUDE_IF
FALLBACK_IF
LEDGER_RULE
```

Confidence always means confidence in classification/reference/navigation accuracy, not legal sufficiency.

---

## FIELD_DERIVATION_POWER_TABLE

### FD4.001–FD4.008 — Object Contract, Target Ref, and Source Gate

```yaml
FD4.001:
  field_path: legal_cartography_index
  purpose: Canonical Phase 4 object.
  derive_if: Phase 4 invoked.
  value_rule: Emit target_ref, deterministic_prepass_manifest, artifact_inventory, artifact_family_map, document_unit_index, control_language_reference_map, artifact_absence_map, cross_document_reference_map, legal_governance_source_coverage, vault_review_routing_candidates, evidence_reference_map, limitations.
  exclude_if: no final report narrative, registry evaluation, legal review, feature extraction, data provenance.
  fallback_if: missing object blocks lock.
  ledger_rule: P4_OBJECT_INITIALIZED.

FD4.002:
  field_path: legal_cartography_index.target_ref
  purpose: Deterministic metadata container only.
  derive_if: target_profile metadata exists.
  value_rule: Copy only brand_name, legal_name, domain.
  exclude_if: no source-text review for identity.
  fallback_if: empty/N/A fields.
  ledger_rule: P4_DETERMINISTIC_TARGET_REF_COPY.

FD4.003:
  field_path: legal_cartography_index.target_ref.brand_name
  derive_if: target_profile.identity.brand_name exists.
  value_rule: exact copy.
  fallback_if: "N/A".

FD4.004:
  field_path: legal_cartography_index.target_ref.legal_name
  derive_if: target_profile.identity.legal_name exists.
  value_rule: exact copy.
  fallback_if: "N/A".

FD4.005:
  field_path: legal_cartography_index.target_ref.domain
  derive_if: target_profile.identity.domain exists.
  value_rule: exact copy.
  fallback_if: "N/A".

FD4.006:
  field_path: legal_cartography_index.legal_governance_source_gate
  purpose: Hard gate admitting only legal/governance family evidence.
  field_signals:
    - source family is legal_governance
    - source is hosted_governance and Stage 1 admitted it as company-governed
    - source is legal/governance absence/dedupe/access_failed/deferred record
  derive_if: at least one field signal true.
  value_rule: admit only allowed sources into Phase 4.
  confidence_rule: deterministic from Stage 1 status.
  exclude_if: product/homepage/docs/API/pricing/commercial/feature/data/registry evidence.
  fallback_if: if no allowed sources, controlled failure or empty index with limitation.
  ledger_rule: record every admitted and excluded source.

FD4.007:
  field_path: legal_cartography_index.excluded_non_legal_sources[]
  purpose: Deterministic record of blocked non-legal/governance inputs.
  derive_if: upstream handoff attempted to include forbidden source.
  value_rule: record source_ref, source_family, exclusion_reason only; no text.
  confidence_rule: deterministic.
  fallback_if: [].
  ledger_rule: P4_NON_LEGAL_SOURCE_BLOCKED.

FD4.008:
  field_path: legal_cartography_index.legal_governance_input_status
  allowed_values: [READY, EMPTY_NO_LEGAL_GOVERNANCE_SOURCES, ONLY_ABSENCE_RECORDS, ACCESS_FAILED_ONLY, CONTROLLED_FAILURE]
  derive_if: always.
  value_rule: assign one status based on admitted sources/absence/access records.
  confidence_rule: deterministic from Stage 1 records.
  exclude_if: no non-legal source may upgrade status.
  fallback_if: CONTROLLED_FAILURE.
```

### FD4.009–FD4.017 — Deterministic Prepass Manifest

```yaml
FD4.009:
  field_path: legal_cartography_index.deterministic_prepass_manifest
  required_shape:
    source_filter_result: {}
    dedupe_result: {}
    artifact_id_assignment_result: {}
    artifact_preclassification_result: {}
    macro_unit_extraction_result: {}
    notice_detection_result: {}
    control_candidate_tagging_result: {}
    prepass_limitations: []
  derive_if: always.
  value_rule: deterministic prepass manifest must exist before model confirmation.
  exclude_if: model must not bypass prepass.
  fallback_if: trace PREPASS_MISSING.

FD4.010:
  field_path: deterministic_prepass_manifest.source_filter_result
  derive_if: always.
  value_rule: count admitted/excluded/hosted/absence/access/deferred sources by status.
  confidence_rule: deterministic.

FD4.011:
  field_path: deterministic_prepass_manifest.dedupe_result
  derive_if: legal/governance package contains more than one candidate.
  value_rule: canonical refs and suppressed duplicate refs only.
  confidence_rule: high URL/hash/canonical match; medium title/path; low ambiguous.
  exclude_if: do not merge different artifact classes just because wording overlaps.

FD4.012:
  field_path: deterministic_prepass_manifest.artifact_id_assignment_result
  derive_if: every canonical artifact candidate.
  value_rule: source_ref -> A### mapping.
  confidence_rule: deterministic.

FD4.013:
  field_path: deterministic_prepass_manifest.artifact_preclassification_result
  derive_if: every canonical artifact candidate.
  value_rule: URL/title/path/metadata/content marker preclass candidate and confidence.
  fallback_if: UNKNOWN_LEGAL_ARTIFACT.

FD4.014:
  field_path: deterministic_prepass_manifest.macro_unit_extraction_result
  derive_if: every admitted artifact with clean_text.
  value_rule: macro units only with char ranges.
  exclude_if: paragraph-level or micro-unit extraction.
  fallback_if: OTHER_MACRO_UNIT covering full artifact.

FD4.015:
  field_path: deterministic_prepass_manifest.notice_detection_result
  derive_if: standalone notice/warning/disclaimer/legal notice/review-ready/AI/privacy/update notice visible.
  value_rule: NOTICE candidates with char ranges.
  exclude_if: do not treat every disclaimer sentence as NOTICE.
  fallback_if: [].

FD4.016:
  field_path: deterministic_prepass_manifest.control_candidate_tagging_result
  derive_if: deterministic keyword/heading/artifact-class map suggests control_language_type.
  value_rule: candidate controls by unit_ref and location only.
  exclude_if: no sufficiency conclusion and no text payload.
  fallback_if: [].

FD4.017:
  field_path: deterministic_prepass_manifest.prepass_limitations[]
  derive_if: deterministic step incomplete or ambiguous.
  value_rule: concise parsing/coverage limitations only.
  exclude_if: no legal/compliance conclusions.
  fallback_if: [].
```

### FD4.018–FD4.035 — Artifact Inventory

```yaml
FD4.018:
  field_path: legal_cartography_index.artifact_inventory[]
  required_item_shape:
    artifact_id: A001
    artifact_class: TERMS_OF_SERVICE
    artifact_family: CONTRACT_TERMS
    artifact_status: FOUND_ADMITTED
    source_ref: SRC_LEGAL_001
    source_url: ""
    canonical_url: ""
    hosted_governance_flag: false
    title_label: ""
    version_or_effective_date_ref: U003 | N/A
    jurisdiction_or_governing_law_ref: U014 | N/A
    artifact_scope_ref: U004 | N/A
    linked_product_or_service_ref: U005 | N/A
    dedupe_status: canonical | duplicate_suppressed | not_deduped
    classification_confidence: high | medium | low | unknown
    classification_basis_ref: ""
    downstream_use_limit: ""
  derive_if: every canonical legal/governance artifact.
  value_rule: one item per canonical artifact; refs only.
  fallback_if: [].

FD4.019:
  field_path: artifact_inventory[].artifact_id
  value_rule: A001, A002, A003 in deterministic source order.
  fallback_if: missing ID blocks lock.

FD4.020:
  field_path: artifact_inventory[].artifact_class
  allowed_values: [TERMS_OF_SERVICE, CUSTOMER_TERMS, EULA, ORDER_FORM_TERMS, PRIVACY_POLICY, COOKIE_POLICY, DATA_PROCESSING_AGREEMENT, SUBPROCESSOR_LIST, DATA_REQUEST_PAGE, DATA_RETENTION_POLICY, AI_TERMS_POLICY, AGENTIC_ADDENDUM, HITL_POLICY, AI_IMPACT_ASSESSMENT, ACCEPTABLE_USE_POLICY, CONTENT_POLICY, COMMUNITY_GUIDELINES, IP_POLICY, DMCA_COPYRIGHT_POLICY, OPEN_SOURCE_NOTICES, SECURITY_POLICY, TRUST_CENTER, VULNERABILITY_DISCLOSURE, STATUS_PAGE, SLA_SUPPORT_TERMS, BILLING_CANCELLATION_TERMS, LEGAL_NOTICE_IMPRESSUM, NOTICE_PAGE, TRANSPARENCY_REPORT, HOSTED_LEGAL_ARTIFACT, UNKNOWN_LEGAL_ARTIFACT]
  value_rule: choose narrowest supported artifact class.
  fallback_if: UNKNOWN_LEGAL_ARTIFACT.

FD4.021:
  field_path: artifact_inventory[].artifact_family
  allowed_values: [CONTRACT_TERMS, PRIVACY_DATA, AI_GOVERNANCE, SECURITY_TRUST, USE_SAFETY, IP_CONTENT, COMMERCIAL_LEGAL, REGULATORY_DISCLOSURE, HOSTED_GOVERNANCE, UNKNOWN_LEGAL_GOVERNANCE]
  value_rule: deterministic class-to-family mapping unless hosted governance overlay required.
  fallback_if: UNKNOWN_LEGAL_GOVERNANCE.

FD4.022:
  field_path: artifact_inventory[].artifact_status
  allowed_values: [FOUND_ADMITTED, FOUND_HOSTED_ADMITTED, DUPLICATE_SUPPRESSED, DOCUMENTED_ABSENT_AFTER_SEARCH, UNKNOWN_NOT_SEARCHED, ACCESS_FAILED, DEFERRED, NOT_APPLICABLE_CONTEXTUAL]
  value_rule: copy from Stage 1/dedupe/coverage status.
  exclude_if: model must not invent absence.
  fallback_if: UNKNOWN_NOT_SEARCHED.

FD4.023:
  field_path: artifact_inventory[].source_ref
  value_rule: admitted source_ref.
  fallback_if: missing source_ref blocks FOUND status.

FD4.024:
  field_path: artifact_inventory[].source_url
  value_rule: copy URL metadata only.

FD4.025:
  field_path: artifact_inventory[].canonical_url
  value_rule: canonical URL if known, else source_url.

FD4.026:
  field_path: artifact_inventory[].hosted_governance_flag
  value_rule: true only if Stage 1 admitted hosted governance status.

FD4.027:
  field_path: artifact_inventory[].title_label
  value_rule: short visible title/navigation label, max 120 chars.
  exclude_if: no body text or summary.
  fallback_if: artifact_class label.

FD4.028:
  field_path: artifact_inventory[].version_or_effective_date_ref
  value_rule: unit_ref for visible date/version unit only.
  fallback_if: N/A.

FD4.029:
  field_path: artifact_inventory[].jurisdiction_or_governing_law_ref
  value_rule: unit_ref only when visible.
  exclude_if: no enforceability/jurisdiction conclusion.
  fallback_if: N/A.

FD4.030:
  field_path: artifact_inventory[].artifact_scope_ref
  value_rule: unit_ref for scope/application unit only.
  fallback_if: N/A.

FD4.031:
  field_path: artifact_inventory[].linked_product_or_service_ref
  value_rule: unit_ref only if legal/governance artifact itself names service/product/module/schedule.
  exclude_if: do not use product-page evidence.
  fallback_if: N/A.

FD4.032:
  field_path: artifact_inventory[].dedupe_status
  allowed_values: [canonical, duplicate_suppressed, not_deduped]
  value_rule: deterministic dedupe prepass result.
  fallback_if: not_deduped.

FD4.033:
  field_path: artifact_inventory[].classification_confidence
  allowed_values: [high, medium, low, unknown]
  value_rule: high explicit title/url/content; medium supported but ambiguous; low uncertain; unknown only for UNKNOWN_LEGAL_ARTIFACT.

FD4.034:
  field_path: artifact_inventory[].classification_basis_ref
  value_rule: reference prepass result/unit/source support only; no quote/text.
  fallback_if: PREPASS_UNKNOWN.

FD4.035:
  field_path: artifact_inventory[].downstream_use_limit
  value_rule: "Phase 4 artifact classification is a navigation/indexing signal only. It does not determine legal sufficiency, enforceability, compliance status, risk level, or registry row truth."
```

### FD4.036–FD4.044 — Artifact Family Map

```yaml
FD4.036:
  field_path: legal_cartography_index.artifact_family_map[]
  required_item_shape:
    family_code: PRIVACY_DATA
    artifact_refs: []
    artifact_classes_seen: []
    source_refs: []
    status_summary:
      found: 0
      documented_absent_after_search: 0
      access_failed: 0
      unknown_not_searched: 0
    family_navigation_priority: high | medium | low
    confidence: high | medium | low | unknown
    downstream_use_limit: ""
  derive_if: every family with found/absence/access/deferred signal.
  value_rule: aggregate refs and counts only.
  exclude_if: no legal meaning summary.

FD4.037:
  field_path: artifact_family_map[].family_code
  allowed_values: [CONTRACT_TERMS, PRIVACY_DATA, AI_GOVERNANCE, SECURITY_TRUST, USE_SAFETY, IP_CONTENT, COMMERCIAL_LEGAL, REGULATORY_DISCLOSURE, HOSTED_GOVERNANCE, UNKNOWN_LEGAL_GOVERNANCE]

FD4.038:
  field_path: artifact_family_map[].artifact_refs[]
  value_rule: list artifact_ids in family.

FD4.039:
  field_path: artifact_family_map[].artifact_classes_seen[]
  value_rule: dedupe artifact classes.

FD4.040:
  field_path: artifact_family_map[].source_refs[]
  value_rule: dedupe admitted legal/governance source_refs.

FD4.041:
  field_path: artifact_family_map[].status_summary
  value_rule: counts only.

FD4.042:
  field_path: artifact_family_map[].family_navigation_priority
  allowed_values: [high, medium, low]
  value_rule: navigation priority only; high for major artifacts or downstream-critical control refs; medium useful context; low peripheral/unknown.
  exclude_if: not legal risk.

FD4.043:
  field_path: artifact_family_map[].confidence
  value_rule: aggregate confidence from artifact classifications/statuses.

FD4.044:
  field_path: artifact_family_map[].downstream_use_limit
  value_rule: "Family map is for navigation only. It does not establish legal coverage, sufficiency, compliance, or risk."
```

### FD4.045–FD4.060 — Document Unit Index

```yaml
FD4.045:
  field_path: legal_cartography_index.document_unit_index[]
  required_item_shape:
    unit_id: U001
    artifact_ref: A001
    unit_type: SECTION
    heading_label: ""
    unit_family_tags: []
    control_language_type_candidates: []
    source_ref: SRC_LEGAL_001
    location_ref:
      source_ref: SRC_LEGAL_001
      char_start: 0
      char_end: 0
    macro_unit_level: major_section
    parent_unit_ref: N/A
    child_unit_refs: []
    cross_reference_refs: []
    unit_extraction_method: deterministic_heading
    confidence: high | medium | low | unknown
    downstream_use_limit: ""
  derive_if: every selected macro unit.
  value_rule: macro units only; no clause-level sprawl.
  fallback_if: one OTHER_MACRO_UNIT per artifact if structure absent.

FD4.046:
  field_path: document_unit_index[].unit_id
  value_rule: U001, U002, U003 in artifact/source order.
  fallback_if: missing unit_id blocks lock.

FD4.047:
  field_path: document_unit_index[].artifact_ref
  value_rule: parent artifact_id.
  fallback_if: missing artifact_ref blocks lock.

FD4.048:
  field_path: document_unit_index[].unit_type
  allowed_values: [TITLE, NOTICE, PREAMBLE, DEFINITIONS, SCOPE, SECTION, TABLE, SCHEDULE, ANNEX, APPENDIX, EXHIBIT, FAQ_CONTROL, CONTACT_CHANNEL, VERSION_DATE, CROSS_REFERENCE, OTHER_MACRO_UNIT]
  value_rule: choose narrowest supported unit_type.
  exclude_if: CLAUSE retired from Phase 4.
  fallback_if: OTHER_MACRO_UNIT.

FD4.049:
  field_path: document_unit_index[].heading_label
  value_rule: short navigation label, max 120 chars.
  exclude_if: no body text, quote, or summary.
  fallback_if: unit_type.

FD4.050:
  field_path: document_unit_index[].unit_family_tags[]
  value_rule: relevant artifact_family codes for navigation.
  fallback_if: parent artifact_family.

FD4.051:
  field_path: document_unit_index[].control_language_type_candidates[]
  value_rule: candidate control_language_type codes only.
  exclude_if: no sufficiency conclusion.
  fallback_if: [].

FD4.052:
  field_path: document_unit_index[].source_ref
  value_rule: parent artifact source_ref.
  fallback_if: missing source_ref blocks lock.

FD4.053:
  field_path: document_unit_index[].location_ref
  value_rule: source_ref + char_start + char_end only.
  exclude_if: no text payload.
  fallback_if: whole artifact range if no unit range possible.

FD4.054:
  field_path: document_unit_index[].macro_unit_level
  allowed_values: [document_title, notice_block, top_level_section, major_section, table, schedule, annex, appendix, exhibit, contact_block, version_block, cross_reference_block, full_artifact_fallback]
  value_rule: navigation granularity only.

FD4.055:
  field_path: document_unit_index[].parent_unit_ref
  value_rule: parent unit ID if macro nesting is useful; else N/A.

FD4.056:
  field_path: document_unit_index[].child_unit_refs[]
  value_rule: macro child refs only.

FD4.057:
  field_path: document_unit_index[].cross_reference_refs[]
  value_rule: link to cross_document_reference_map IDs.
  fallback_if: [].

FD4.058:
  field_path: document_unit_index[].unit_extraction_method
  allowed_values: [deterministic_heading, deterministic_html, deterministic_regex, deterministic_table, deterministic_notice, deterministic_contact, hybrid_model_confirmed, fallback_full_artifact]

FD4.059:
  field_path: document_unit_index[].confidence
  allowed_values: [high, medium, low, unknown]
  value_rule: confidence in unit identification/location only.

FD4.060:
  field_path: document_unit_index[].downstream_use_limit
  value_rule: "Document unit is a navigation reference only. It does not extract, summarize, evaluate, or validate legal language."
```

### FD4.061–FD4.074 — Control Language Reference Map

```yaml
FD4.061:
  field_path: legal_cartography_index.control_language_reference_map[]
  required_item_shape:
    control_ref_id: CL001
    control_language_type: HALLUCINATION_ACCURACY_DISCLAIMER
    artifact_refs: []
    unit_refs: []
    source_refs: []
    location_refs: []
    detected_by: deterministic_keyword_confirmed
    control_family_tags: []
    requires_downstream_review: true
    confidence: high | medium | low | unknown
    excluded_control_candidates: []
    control_reference_limit: ""
    control_map_quality: usable
  derive_if: macro unit contains visible candidate control language.
  value_rule: emit reference locations only; no text.
  exclude_if: no sufficiency/enforceability/compliance/risk/registry conclusion.

FD4.062:
  field_path: control_language_reference_map[].control_ref_id
  value_rule: CL001, CL002, CL003 in artifact/unit order.
  fallback_if: missing ID blocks lock.

FD4.063:
  field_path: control_language_reference_map[].control_language_type
  allowed_values: [FORMATION_ACCEPTANCE, SERVICE_DEFINITION, AI_DISCLOSURE, PROBABILISTIC_OUTPUT, HALLUCINATION_ACCURACY_DISCLAIMER, HITL_HUMAN_REVIEW, NO_PROFESSIONAL_ADVICE, OUTPUT_OWNERSHIP, INPUT_CUSTOMER_DATA, MODEL_TRAINING_USE, RAG_VECTOR_STORAGE, RETENTION_DELETION, DATA_SUBJECT_RIGHTS, SUBPROCESSORS_VENDORS, CROSS_BORDER_TRANSFER, SECURITY_MEASURES, BREACH_INCIDENT_NOTICE, ACCEPTABLE_USE_RESTRICTIONS, SYNTHETIC_MEDIA_DEEPFAKE, MINORS_CHILD_SAFETY, AUTOMATED_DECISIONING, BIOMETRIC_SENSITIVE_DATA, AGENT_PERMISSION_SCOPE, AGENT_ACTION_LOGGING, CIRCUIT_BREAKER_KILL_SWITCH, LIABILITY_CAP, WARRANTY_DISCLAIMER, INDEMNITY, GOVERNING_LAW_DISPUTE, PAYMENT_RENEWAL_CANCELLATION, SLA_AVAILABILITY_TTFT, VULNERABILITY_DISCLOSURE, LEGAL_PRIVACY_SECURITY_CONTACT]
  value_rule: closed-vocabulary control type only.
  fallback_if: do not emit if no type fits.

FD4.064:
  field_path: control_language_reference_map[].artifact_refs[]
  value_rule: artifact IDs where candidate appears.

FD4.065:
  field_path: control_language_reference_map[].unit_refs[]
  value_rule: macro unit IDs where candidate appears.

FD4.066:
  field_path: control_language_reference_map[].source_refs[]
  value_rule: admitted source refs only.

FD4.067:
  field_path: control_language_reference_map[].location_refs[]
  required_item_shape:
    source_ref: SRC_LEGAL_001
    artifact_ref: A001
    unit_ref: U001
    char_start: 0
    char_end: 0
  value_rule: reference coordinates only.
  exclude_if: no copied text.

FD4.068:
  field_path: control_language_reference_map[].detected_by
  allowed_values: [deterministic_heading, deterministic_keyword_confirmed, deterministic_artifact_class_rule, hybrid_model_confirmed, model_ambiguous]

FD4.069:
  field_path: control_language_reference_map[].control_family_tags[]
  value_rule: map control type to artifact_family codes; fallback to parent artifact family.

FD4.070:
  field_path: control_language_reference_map[].requires_downstream_review
  value_rule: true by default for substantive control refs; false only for pure navigational metadata.
  exclude_if: does not mean legal review is required.

FD4.071:
  field_path: control_language_reference_map[].confidence
  value_rule: high exact heading/keywords/expected artifact class; medium broader context; low ambiguous; unknown generally omit.

FD4.072:
  field_path: control_language_reference_map[].excluded_control_candidates[]
  required_item_shape:
    candidate_label: ""
    artifact_ref: A001
    unit_ref: U001
    excluded_reason: MARKETING_ONLY | GENERIC_SECURITY_CLAIM | NOT_CONTROL_LANGUAGE | WRONG_ARTIFACT_CONTEXT | MICRO_CLAUSE_OVERLOAD | OTHER
  derive_if: material over-trigger risk exists.
  value_rule: blocked candidate refs only.
  fallback_if: [].

FD4.073:
  field_path: control_language_reference_map[].control_reference_limit
  value_rule: "Control-language reference is a location signal only. It does not determine sufficiency, enforceability, compliance status, risk level, or registry row truth."

FD4.074:
  field_path: control_language_reference_map[].control_map_quality
  allowed_values: [strong, usable, thin, ambiguous, none]
  value_rule: quality of reference map only.
```

### FD4.075–FD4.083 — Artifact Absence Map

```yaml
FD4.075:
  field_path: legal_cartography_index.artifact_absence_map[]
  required_item_shape:
    expected_artifact_class: DATA_PROCESSING_AGREEMENT
    expected_artifact_family: PRIVACY_DATA
    absence_status: DOCUMENTED_ABSENT_AFTER_SEARCH
    search_basis_refs: []
    related_access_failed_refs: []
    absence_confidence: high | medium | low | unknown
    absence_boundary_statement: ""
    downstream_treatment: navigation_absence_only
  derive_if: expected artifact family coverage record exists.
  value_rule: use Stage 1 absence/access/deferred/search records only.
  exclude_if: model must not infer absence.

FD4.076:
  field_path: artifact_absence_map[].expected_artifact_class
  value_rule: artifact class taxonomy value.

FD4.077:
  field_path: artifact_absence_map[].expected_artifact_family
  value_rule: class-to-family mapping.

FD4.078:
  field_path: artifact_absence_map[].absence_status
  allowed_values: [DOCUMENTED_ABSENT_AFTER_SEARCH, UNKNOWN_NOT_SEARCHED, ACCESS_FAILED, DEFERRED, NOT_APPLICABLE_CONTEXTUAL]
  value_rule: copy from Stage 1 coverage status.

FD4.079:
  field_path: artifact_absence_map[].search_basis_refs[]
  value_rule: Stage 1 probe/search refs only.
  exclude_if: no invented search basis.

FD4.080:
  field_path: artifact_absence_map[].related_access_failed_refs[]
  value_rule: legal/governance source refs that failed access for this artifact class.
  fallback_if: [].

FD4.081:
  field_path: artifact_absence_map[].absence_confidence
  value_rule: high targeted artifact-class search; medium family search; low weak/partial search; unknown unknown_not_searched.
  exclude_if: confidence is only about search coverage.

FD4.082:
  field_path: artifact_absence_map[].absence_boundary_statement
  value_rule: "Artifact absence means not visible in the reviewed public legal/governance footprint. It does not mean the artifact is legally required, legally absent in fact, non-compliant, or risky."

FD4.083:
  field_path: artifact_absence_map[].downstream_treatment
  allowed_values: [navigation_absence_only, access_failed_do_not_infer, unknown_do_not_infer, deferred_do_not_infer, contextual_not_expected]
```

### FD4.084–FD4.091 — Cross-Document Reference Map

```yaml
FD4.084:
  field_path: legal_cartography_index.cross_document_reference_map[]
  required_item_shape:
    cross_ref_id: XR001
    from_artifact_ref: A001
    from_unit_ref: U001
    to_artifact_ref: A004 | UNKNOWN_TARGET
    to_url_or_label_ref: ""
    reference_type: links_to | incorporates_by_reference | hierarchy_conflict_reference | schedule_reference | addendum_reference | policy_reference | contact_reference | unknown
    confidence: high | medium | low | unknown
  derive_if: legal/governance artifact references another policy, addendum, schedule, DPA, AUP, privacy policy, SLA, trust center, subprocessor page, request page, or notice/contact route.
  value_rule: references only.
  exclude_if: no legal interpretation of hierarchy or conflict.

FD4.085:
  field_path: cross_document_reference_map[].cross_ref_id
  value_rule: XR001, XR002, XR003.

FD4.086:
  field_path: cross_document_reference_map[].from_artifact_ref
  value_rule: artifact containing the reference.

FD4.087:
  field_path: cross_document_reference_map[].from_unit_ref
  value_rule: macro unit containing the reference.

FD4.088:
  field_path: cross_document_reference_map[].to_artifact_ref
  value_rule: target artifact ID if matched; else UNKNOWN_TARGET.

FD4.089:
  field_path: cross_document_reference_map[].to_url_or_label_ref
  value_rule: URL or short label only.

FD4.090:
  field_path: cross_document_reference_map[].reference_type
  allowed_values: [links_to, incorporates_by_reference, hierarchy_conflict_reference, schedule_reference, addendum_reference, policy_reference, contact_reference, unknown]
  exclude_if: do not determine legal priority.

FD4.091:
  field_path: cross_document_reference_map[].confidence
  value_rule: high URL resolves to artifact; medium visible label matches artifact; low ambiguous.
```

### FD4.092–FD4.098 — Legal/Governance Source Coverage

```yaml
FD4.092:
  field_path: legal_cartography_index.legal_governance_source_coverage
  required_shape:
    admitted_legal_governance_source_count: 0
    hosted_governance_source_count: 0
    artifact_class_coverage_summary: []
    source_family_purity_check: PASS | FAIL_NON_LEGAL_SOURCE_PRESENT | WARNING_EXCLUDED_NON_LEGAL_SOURCE_ATTEMPTED
    coverage_limitations: []
    coverage_confidence: high | medium | low | unknown
  derive_if: always.

FD4.093:
  field_path: legal_governance_source_coverage.admitted_legal_governance_source_count
  value_rule: count admitted legal_governance sources.

FD4.094:
  field_path: legal_governance_source_coverage.hosted_governance_source_count
  value_rule: count admitted hosted governance sources.

FD4.095:
  field_path: legal_governance_source_coverage.artifact_class_coverage_summary[]
  value_rule: class/status/count summary only.

FD4.096:
  field_path: legal_governance_source_coverage.source_family_purity_check
  value_rule: PASS only if Phase 4 context contains legal/governance material only; WARNING if excluded non-legal source attempted; FAIL if non-legal evidence entered model context.

FD4.097:
  field_path: legal_governance_source_coverage.coverage_limitations[]
  value_rule: source/access/search/coverage limitations only.

FD4.098:
  field_path: legal_governance_source_coverage.coverage_confidence
  value_rule: high complete enough map; medium useful but incomplete; low sparse/access-limited; unknown no usable legal/governance evidence.
```

### FD4.099–FD4.106 — Vault Review Routing Candidates

```yaml
FD4.099:
  field_path: legal_cartography_index.vault_review_routing_candidates
  required_shape:
    artifact_review_candidates: []
    control_reference_review_candidates: []
    absence_review_candidates: []
    confirmation_questions: []
    candidate_confidence: high | medium | low | unknown
    candidate_boundary_statement: ""
    downstream_use_limit: ""
  derive_if: always.
  value_rule: routing candidates from existing Phase 4 refs only.
  exclude_if: no legal advice, compliance labels, or registry truth.

FD4.100:
  field_path: vault_review_routing_candidates.artifact_review_candidates[]
  required_item_shape:
    candidate_id: VRC_A001
    artifact_ref: A001
    artifact_class: TERMS_OF_SERVICE
    routing_reason: major_artifact_found | unknown_artifact_class | access_failed_artifact | hosted_governance_artifact | cross_referenced_artifact
    priority: high | medium | low
    confidence: high | medium | low | unknown

FD4.101:
  field_path: vault_review_routing_candidates.control_reference_review_candidates[]
  required_item_shape:
    candidate_id: VRC_C001
    control_ref_id: CL001
    control_language_type: HALLUCINATION_ACCURACY_DISCLAIMER
    artifact_refs: []
    unit_refs: []
    routing_reason: control_reference_visible | control_reference_ambiguous | high_signal_ai_governance_reference | data_processing_reference | security_reference | agentic_reference
    priority: high | medium | low
    confidence: high | medium | low | unknown

FD4.102:
  field_path: vault_review_routing_candidates.absence_review_candidates[]
  required_item_shape:
    candidate_id: VRC_AB001
    expected_artifact_class: DATA_PROCESSING_AGREEMENT
    absence_status: DOCUMENTED_ABSENT_AFTER_SEARCH
    search_basis_refs: []
    routing_reason: artifact_not_visible_after_search
    priority: high | medium | low
    confidence: high | medium | low | unknown
  exclude_if: absence candidate is not legal gap.

FD4.103:
  field_path: vault_review_routing_candidates.confirmation_questions[]
  derive_if: unknown artifact class, ambiguous control ref, access failure, absence record, or hosted artifact uncertainty.
  value_rule: practical artifact/navigation questions only.
  good_examples:
    - Confirm whether the publicly linked DPA is the current customer DPA.
    - Confirm whether the trust center is company-controlled or vendor-hosted.
    - Confirm whether the Terms link to a separate AI policy not visible in the reviewed public footprint.
  bad_examples:
    - Confirm whether this is compliant.
    - Confirm whether the liability cap is enforceable.
    - Confirm whether registry row X is triggered.

FD4.104:
  field_path: vault_review_routing_candidates.candidate_confidence
  value_rule: aggregate confidence from candidate refs.

FD4.105:
  field_path: vault_review_routing_candidates.candidate_boundary_statement
  value_rule: "Vault review routing candidates are navigation/intake helpers only. They do not provide legal advice, compliance conclusions, sufficiency findings, or registry row truth."

FD4.106:
  field_path: vault_review_routing_candidates.downstream_use_limit
  value_rule: "Downstream phases may use these candidates to locate artifacts and ask confirmation questions. They must independently evaluate any legal, data, or registry issue within their own phase boundaries."
```

### FD4.107–FD4.114 — Evidence Reference Map

```yaml
FD4.107:
  field_path: legal_cartography_index.evidence_reference_map
  required_shape:
    field_reference_support: []
    artifact_reference_support: []
    unit_reference_support: []
    control_reference_support: []
    absence_reference_support: []
    unresolved_reference_questions: []
    evidence_boundary_statement: ""
  derive_if: always.

FD4.108:
  field_path: evidence_reference_map.field_reference_support[]
  required_item_shape:
    field_path: ""
    source_refs: []
    artifact_refs: []
    unit_refs: []
    basis_type: deterministic | hybrid_model_confirmed | upstream_stage1_status
    confidence: high | medium | low | unknown

FD4.109:
  field_path: evidence_reference_map.artifact_reference_support[]
  required_item_shape:
    artifact_ref: A001
    source_ref: SRC_LEGAL_001
    source_url: ""
    classification_basis_ref: ""
    confidence: high | medium | low | unknown

FD4.110:
  field_path: evidence_reference_map.unit_reference_support[]
  required_item_shape:
    unit_ref: U001
    artifact_ref: A001
    source_ref: SRC_LEGAL_001
    location_ref: {}
    extraction_method: ""
    confidence: high | medium | low | unknown

FD4.111:
  field_path: evidence_reference_map.control_reference_support[]
  required_item_shape:
    control_ref_id: CL001
    artifact_refs: []
    unit_refs: []
    source_refs: []
    location_refs: []
    confidence: high | medium | low | unknown

FD4.112:
  field_path: evidence_reference_map.absence_reference_support[]
  required_item_shape:
    expected_artifact_class: ""
    absence_status: ""
    search_basis_refs: []
    confidence: high | medium | low | unknown

FD4.113:
  field_path: evidence_reference_map.unresolved_reference_questions[]
  value_rule: reference/navigation questions only.

FD4.114:
  field_path: evidence_reference_map.evidence_boundary_statement
  value_rule: "Phase 4 evidence references identify where legal/governance artifacts and macro units appear in the reviewed public footprint. They do not extract clause text, assess legal sufficiency, determine compliance, or evaluate registry conditions."
```

### FD4.115–FD4.120 — Limitations and Quality

```yaml
FD4.115:
  field_path: legal_cartography_index.limitations[]
  derive_if: source incomplete, access failed, unknown_not_searched, weak headings, ambiguous hosted governance, ambiguous artifact class, sparse package.
  value_rule: concise public-footprint/navigation limitations only.
  good_examples:
    - Only one admitted legal/governance artifact was available for indexing.
    - Several expected artifact classes were unknown_not_searched in upstream coverage.
    - Some macro units were extracted from plain text because structured headings were unavailable.
  bad_examples:
    - The company lacks required legal protection.
    - The Privacy Policy is non-compliant.
    - The Terms are unenforceable.
  fallback_if: [].

FD4.116:
  field_path: legal_cartography_trace.phase4_quality
  required_shape:
    artifact_inventory_quality: strong | usable | thin | failed
    macro_unit_index_quality: strong | usable | thin | failed
    control_reference_quality: strong | usable | thin | none
    source_family_purity: pass | fail
    deterministic_prepass_status: completed | partial | missing
    overall_phase4_confidence: high | medium | low | unknown

FD4.117:
  field_path: legal_cartography_trace.phase4_quality.artifact_inventory_quality
  value_rule: strong major artifacts high confidence; usable some ambiguity; thin sparse/unknown/access-failed; failed none.

FD4.118:
  field_path: legal_cartography_trace.phase4_quality.macro_unit_index_quality
  value_rule: strong clear macro headings/ranges; usable enough for navigation; thin fallback ranges; failed no usable unit map.

FD4.119:
  field_path: legal_cartography_trace.phase4_quality.control_reference_quality
  value_rule: strong clear refs across major artifacts; usable enough refs; thin few/ambiguous; none no control refs.

FD4.120:
  field_path: legal_cartography_trace.phase4_quality.overall_phase4_confidence
  value_rule: high strong/usable artifact+unit map and source purity pass; medium usable but incomplete; low thin/access-limited; unknown no usable source or prepass missing.
```

---

## EXECUTION_PROGRAM

### P4.B1_INPUT_PRECHECK
1. Confirm required inputs exist.
2. Confirm `source_discovery_handoff` includes source-family/status metadata.
3. Confirm legal/governance evidence package exists or absence/access/deferred records exist.
4. Initialize ledger and trace.
5. If required inputs are missing, emit controlled failure.

### P4.B2_LEGAL_GOVERNANCE_SOURCE_GATE
1. Admit only legal_governance and admitted hosted_governance sources.
2. Admit legal/governance absence/access/deferred/dedupe records.
3. Exclude every non-legal/governance source before model context.
4. Record source purity result.

### P4.B3_DETERMINISTIC_PREPASS
1. Deduplicate artifacts.
2. Assign artifact IDs.
3. Assign artifact statuses from Stage 1.
4. Preclassify artifacts from URL/title/path/metadata/content markers.
5. Extract macro document units and char ranges.
6. Detect NOTICE units.
7. Extract cross-document references.
8. Extract contact channels.
9. Build candidate control-language tags.
10. Build prepass limitations.

### P4.B4_ARTIFACT_CLASSIFICATION
1. Confirm artifact classes using closed taxonomy.
2. Resolve ambiguous preclass candidates only within legal/governance source context.
3. Emit artifact_inventory.
4. Do not assess legal quality.

### P4.B5_ARTIFACT_FAMILY_MAP
1. Aggregate artifacts by family.
2. Aggregate status counts.
3. Assign navigation priority only.

### P4.B6_MACRO_DOCUMENT_UNIT_INDEX
1. Emit macro units only.
2. Include NOTICE units where visible.
3. Attach source_ref, artifact_ref, unit_ref, and char ranges.
4. Do not include text payload.

### P4.B7_CONTROL_REFERENCE_MAP
1. Convert candidate control tags into ref-only map items.
2. Confirm ambiguous candidates when necessary.
3. Exclude noisy/non-control candidates.
4. Do not determine sufficiency or compliance.

### P4.B8_ARTIFACT_ABSENCE_MAP
1. Use Stage 1 absence/access/deferred/unknown_not_searched records only.
2. Emit absence boundaries.
3. Do not convert absence into a legal gap.

### P4.B9_CROSS_DOCUMENT_REFERENCE_MAP
1. Map references between legal/governance artifacts.
2. Match targets to artifact IDs where possible.
3. Do not interpret hierarchy or conflict legally.

### P4.B10_SOURCE_COVERAGE
1. Count admitted legal/governance and hosted governance sources.
2. Summarize artifact-class coverage by status.
3. Record source family purity.
4. Add coverage limitations.

### P4.B11_VAULT_ROUTING
1. Create routing candidates from existing refs only.
2. Add practical confirmation questions.
3. No legal/compliance/registry questions.

### P4.B12_EVIDENCE_REFERENCE_MAP
1. Attach field, artifact, unit, control, and absence support refs.
2. Add unresolved reference questions.
3. Add evidence boundary statement.

### P4.B13_LIMITATIONS_QUALITY
1. Add public-footprint/navigation limitations.
2. Assess artifact inventory quality, macro unit quality, control reference quality, source purity, prepass status, and overall confidence.

### P4.B14_FINAL_EMISSION
1. Validate object schema.
2. Validate legal/governance-only gate.
3. Validate reference-first gate.
4. Validate terminal gates.
5. Emit JSON only.

---

## TRACE_LEDGER_AND_HANDOFF_SCHEMA

Emit exactly this top-level shape:

```json
{
  "legal_cartography_forensic_ledger": {
    "phase_id": "P4_LEGAL_CARTOGRAPHY_INDEX",
    "ledger_status": "DRAFT | LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE",
    "ledger_events": [],
    "coverage_matrix": {
      "legal_governance_sources_received": [],
      "legal_governance_sources_admitted": [],
      "non_legal_sources_blocked": [],
      "hosted_governance_sources_admitted": [],
      "dedupe_events": [],
      "artifact_ids_assigned": [],
      "artifact_classes_assigned": [],
      "macro_units_extracted": [],
      "notice_units_extracted": [],
      "control_refs_emitted": [],
      "control_candidates_excluded": [],
      "artifact_absence_records": [],
      "cross_document_refs": [],
      "limitations": []
    }
  },
  "legal_cartography_trace": {
    "phase_id": "P4_LEGAL_CARTOGRAPHY_INDEX",
    "input_status": "OK | MISSING_REQUIRED_INPUT | CONTROLLED_FAILURE",
    "execution_batches": [],
    "field_rows_applied": [],
    "deterministic_copy_fields": [],
    "source_gate": {
      "legal_governance_only": "PASS | FAIL",
      "non_legal_sources_blocked_count": 0,
      "hosted_governance_admission_checked": "PASS | FAIL | N/A"
    },
    "deterministic_prepass_status": "completed | partial | missing",
    "forbidden_scope_checks": {
      "non_legal_source_entered_context": "PASS | FAIL",
      "long_text_or_quote_payload": "PASS | FAIL",
      "micro_unit_overindexing": "PASS | FAIL",
      "legal_review_or_sufficiency_conclusion": "PASS | FAIL",
      "registry_evaluation": "PASS | FAIL",
      "data_provenance_analysis": "PASS | FAIL",
      "feature_extraction": "PASS | FAIL",
      "closed_taxonomy": "PASS | FAIL"
    },
    "phase4_quality": {
      "artifact_inventory_quality": "strong | usable | thin | failed",
      "macro_unit_index_quality": "strong | usable | thin | failed",
      "control_reference_quality": "strong | usable | thin | none",
      "source_family_purity": "pass | fail",
      "deterministic_prepass_status": "completed | partial | missing",
      "overall_phase4_confidence": "high | medium | low | unknown"
    },
    "lock_status": "LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE"
  },
  "legal_cartography_index": {
    "target_ref": {
      "brand_name": "",
      "legal_name": "",
      "domain": ""
    },
    "deterministic_prepass_manifest": {},
    "artifact_inventory": [],
    "artifact_family_map": [],
    "document_unit_index": [],
    "control_language_reference_map": [],
    "artifact_absence_map": [],
    "cross_document_reference_map": [],
    "legal_governance_source_coverage": {},
    "vault_review_routing_candidates": {},
    "evidence_reference_map": {},
    "limitations": []
  }
}
```

---

## TERMINAL_GATE

```yaml
G4.001_OBJECT_SCHEMA_GATE:
  pass_if: output contains exactly legal_cartography_forensic_ledger, legal_cartography_trace, legal_cartography_index

G4.002_LEGAL_GOVERNANCE_ONLY_GATE:
  pass_if: no non-legal/governance evidence enters Phase 4 model context

G4.003_REFERENCE_FIRST_GATE:
  pass_if: mappings contain refs/location ranges only; no long text, quotes, or clause summaries

G4.004_MACRO_UNIT_GATE:
  pass_if: document units are macro-level and no micro-clause indexing appears

G4.005_NOTICE_UNIT_GATE:
  pass_if: standalone notices/disclaimers/warnings are captured as NOTICE units where visible

G4.006_DETERMINISTIC_PREPASS_GATE:
  pass_if: source filtering, dedupe, artifact IDs, statuses, heading extraction, char ranges, notices, cross-references, contact channels, absence map, and candidate control tagging are completed or explicitly marked partial/missing with limitation

G4.007_CLOSED_TAXONOMY_GATE:
  pass_if: all class/family/status/unit/control values use closed vocabularies

G4.008_ABSENCE_BASIS_GATE:
  pass_if: artifact absence only comes from Stage 1 search/probe/access/deferred/unknown records

G4.009_NO_LEGAL_REVIEW_GATE:
  pass_if: no sufficiency, enforceability, compliance, risk, or legal conclusion appears

G4.010_NO_REGISTRY_GATE:
  pass_if: no threat IDs, row statuses, TRUE/FALSE conditions, exposure ratings, or registry conclusions appear

G4.011_NO_DATA_PROVENANCE_GATE:
  pass_if: no controller/processor determination, data-flow mapping, retention sufficiency, transfer analysis, or subprocessor evaluation appears

G4.012_EVIDENCE_REFERENCE_GATE:
  pass_if: every substantive field is supported by source_ref, artifact_ref, unit_ref, location_ref, deterministic basis, or upstream Stage 1 status

G4.013_LEDGER_COMPLETENESS_GATE:
  pass_if: ledger records source gate, exclusions, dedupe, artifact classification, unit extraction, notice detection, control refs, absence basis, cross-references, limitations, and lock status
```

If any terminal gate fails, do not output `LOCKED`.

---

## FINAL_OUTPUT_INSTRUCTION

When executing Phase 4, output valid JSON only. No markdown. No commentary. No explanatory text outside JSON.
