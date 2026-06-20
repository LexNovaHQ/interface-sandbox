# Stage 6 Canonical Flow

## Status

This document is the controlling doctrine for the Stage 6 rebuild. It governs Stage 6A, Stage 6B, Stage 6C, and the Stage 6 to Stage 7 handoff.

If any legacy Stage 6 implementation, prompt, adapter, connector, packet builder, normalizer, validator, audit workflow, or e2e script conflicts with this document, this document wins.

## Supreme Rule

Every Stage 6 stage/substage must preserve the primary evidence lane.

For Stage 6A and Stage 6B, the primary evidence is the legal/governance full lossless source family.

For Stage 6C, the primary integration inputs are:

1. Stage 5 product-observed feature/data behavior from the final target_feature_profile / product feature records.
2. Stage 6B legal/governance-derived data provenance findings.
3. Stage 6A legal cartography.

Metadata, indexes, upstream profiles, URLs, titles, refs, and candidate lists are reference or navigation only. They are never primary evidence.

## Common Rule for Every Stage/Substage

Every Stage 6 stage/substage must have all of the following:

1. Full lossless source custody or exact verbatim source windows activated.
2. Detailed dictionary and field derivation logic.
3. Detailed runtime and prompt.
4. Validation that requests reinvestigation or expanded windows before declaring a row unresolved.
5. Full upstream and downstream contract consistency.

Validation status must use controlled outcomes:

- PASS
- REINVESTIGATE_REQUIRED
- UNRESOLVED_AFTER_REINVESTIGATION
- CONTRACT_VIOLATION

Source custody failures are contract violations. Missing or weak field support should trigger reinvestigation first.

## Forbidden Evidence Patterns

The following are forbidden across Stage 6:

- Normalizing legal/governance lossless source text.
- Compacting legal/governance source whitespace.
- Capping source-level text with first-N-character windows.
- Replacing legal source with metadata.
- Replacing legal source with source refs or index refs.
- Treating target_profile as primary evidence.
- Treating target_feature_profile as primary evidence for Stage 6B.
- Seeding Stage 6B canonical rows from Stage 5 data provenance.
- Using `no_new_data_flow_rows: true` in Stage 6B.
- Dropping Stage 6B model findings because they were not seeded by Stage 5.
- Allowing Stage 6B to emit the final integrated `data_provenance_profile`.
- Allowing Stage 6C to invent new legal findings.
- Allowing Stage 6C to invent new product facts.
- Allowing Stage 7 to evaluate registry exposure without legal/governance primary evidence and legal cartography.

## Stage 6A — Legal Cartography

### Primary Source

Legal/governance full lossless source family.

### Reference Inputs

- target_profile
- target_feature_profile
- metadata sidecar
- navigation sidecar

These references are not evidence substitutes.

### Job

Stage 6A maps legal/governance documents, legal units, clauses, controls, obligations, disclaimers, and governance architecture.

### Output

Stage 6A emits:

- legal_cartography
- legal_document_inventory
- legal_unit_map
- legal_control_map
- legal_source_window_ledger
- source_custody_manifest
- validation
- forensic_log

### Legal-Unit Rule

Stage 6A must create legal-unit-specific verbatim windows.

A legal-unit window must include:

```json
{
  "legal_unit_id": "LUNIT_001",
  "source_id": "SRC_PRIVACY_001",
  "source_url": "https://example.com/privacy",
  "source_title": "Privacy Policy",
  "heading_text": "Information We Collect",
  "char_start": 4200,
  "char_end": 6100,
  "verbatim_text": "EXACT TEXT FROM clean_text_lossless",
  "source_sha256": "...",
  "unit_type": "data_collection_clause",
  "created_by_stage": "6A"
}
```

The legal-unit window must be an exact substring of the source's `clean_text_lossless`.

No source-level first-N-character window is allowed.

If a legal unit is too broad, split it.

If a legal unit is too narrow, expand it.

Do not cap it.

## Stage 6A Validation and Reinvestigation

Stage 6A must ask for reinvestigation when:

- Legal unit classification is weak.
- Important privacy/data/security/AI/provider/retention/transfer language appears unclassified.
- Legal unit boundaries are too broad or too narrow.
- Document type is uncertain.

Allowed reinvestigation actions:

- Expand legal-unit window.
- Split long legal unit into smaller legal units.
- Rerun classification for affected legal units only.

Contract violations:

- Missing legal/governance lossless source.
- Missing `clean_text_lossless`.
- Non-verbatim legal-unit window.
- Missing source hash.
- Missing source offsets.

## Stage 6A to Stage 6B Handoff

Stage 6B receives:

### Primary

- legal/governance full lossless source family

### Secondary / Reference

- Stage 6A legal_cartography
- legal_document_inventory
- legal_unit_map
- legal_control_map
- legal_source_window_ledger
- target_profile
- target_feature_profile
- metadata sidecar
- navigation sidecar

The 6A to 6B handoff is invalid if Stage 6B receives only legal_cartography without the continuing legal/governance source custody lane.

Stage 6B may use 6A legal cartography to know where to look. It may not treat legal cartography as the only evidence.

## Stage 6B — Legal/Governance Data Provenance Extraction

### Primary Source

Legal/governance full lossless source family.

### Secondary / Reference Inputs

- target_profile
- target_feature_profile
- legal_cartography

These inputs may help label, route, and align context. They may not seed the Stage 6B row spine.

### Job

Stage 6B extracts what the legal/governance documents say about data.

It must inspect and extract, when evidenced:

- data collected
- data processed
- AI/model provider treatment
- prompt/input/output treatment
- embeddings
- RAG
- fine-tuning/training
- retention/deletion
- subprocessors
- international transfers
- security/breach
- controller/processor role
- automated decisioning
- sensitive/minor data
- rights/notice/consent

### Output

Stage 6B emits:

- legal_governance_data_provenance_profile
- legal_data_findings
- source_window_ledger
- validation
- forensic_log

Stage 6B does not emit the final integrated `data_provenance_profile`.

### Mandatory Stage 6B Independence Rule

Stage 6B may never require Stage 5 data_provenance rows to produce legal/governance data provenance findings.

Stage 6B may use Stage 5/target_feature_profile only for reference labels and alignment hints.

Stage 6B must produce legal/governance-derived data provenance records whenever legal/governance sources contain data-processing, privacy, AI model, retention, transfer, subprocessor, security, rights, or similar data language.

Forbidden in Stage 6B:

- `source_basis: stage5_feature_ref`
- `source_basis: stage5_data_provenance_seed`
- `no_new_data_flow_rows: true`
- normalizer dropping rows not present in Stage 5 seed

## Stage 6B Validation and Reinvestigation

Stage 6B must ask for reinvestigation when:

- legal units contain data/privacy/security/AI/provider/retention/transfer terms but no finding was produced
- a finding lacks specificity
- a finding has weak source basis
- AI/model treatment was not examined where AI/provider language exists
- retention/deletion rights language exists but output remains `NOT_EVIDENCED`

Allowed reinvestigation actions:

- Select affected legal units.
- Create expanded verbatim windows.
- Rerun Stage 6B extraction for affected legal units only.
- Merge new legal findings into Stage 6B output without deleting source-supported rows.

## Stage 6B to Stage 6C Handoff

Stage 6C receives:

- legal_governance_data_provenance_profile
- legal_data_findings
- legal finding source_window_refs
- legal_cartography
- source custody manifest

The 6B to 6C handoff is invalid if legal data findings lack legal_unit_refs or source_window_refs.

## Stage 6C — Product + Legal/Governance Data Provenance Integration

### Primary Inputs

- Stage 5 final target_feature_profile / product-observed feature data behavior
- Stage 6B legal_governance_data_provenance_profile
- Stage 6A legal_cartography

### Job

Stage 6C integrates product-observed behavior with legal/governance declared data practices.

### Output

Stage 6C emits:

- data_provenance_profile
- integrated_data_flows
- unmatched_product_observed_flows
- unmatched_legal_governance_controls
- conflicts
- limitations
- validation
- forensic_log

### Controlled Alignment Statuses

- MATCHED_PRODUCT_AND_LEGAL_DATA_FLOW
- PRODUCT_OBSERVED_BUT_LEGAL_SOURCE_SILENT
- LEGAL_GOVERNANCE_CONTROL_WITHOUT_PRODUCT_FLOW
- CONFLICT_PRODUCT_VS_LEGAL_DISCLOSURE
- INSUFFICIENT_EVIDENCE_TO_ALIGN
- OUT_OF_SCOPE_FOR_DATA_PROVENANCE

### Stage 6C Restrictions

Stage 6C may create integration rows. It may not create new legal findings or new product feature facts.

If 6C finds that the legal or product side is missing, it must mark the alignment status accordingly. It must not invent missing facts.

## Stage 6C Validation and Reinvestigation

Stage 6C must ask for reinvestigation when:

- product feature has data touchpoint but no legal comparison was attempted
- legal data finding has no integration disposition
- matched row has weak semantic alignment
- conflict row lacks both product and legal evidence
- unmatched row may be caused by label mismatch

Allowed reinvestigation actions:

- Rerun alignment for the affected product/legal candidate pair.
- Ask the Stage 6C semantic aligner to compare specific product and legal windows.
- Revise only integration status/reason.
- Do not create new product or legal source facts.

## Stage 6C to Stage 7 Handoff

Stage 7 must receive:

### Primary

- legal/governance full lossless source family
- legal_cartography

### Secondary / Reference

- target_profile
- target_feature_profile
- data_provenance_profile
- source custody ledgers

The Stage 6C to Stage 7 handoff is invalid if Stage 7 receives only `data_provenance_profile` without legal/governance lossless source and legal_cartography.

## Full Stage 6 Handoff Map

Stage 3 to Stage 6:

- legal/governance full lossless source
- metadata/navigation sidecars
- profile references

Stage 6A to Stage 6B:

- legal/governance full lossless source continues
- legal_cartography
- legal-unit source-window ledger
- target/profile references

Stage 6B to Stage 6C:

- legal_governance_data_provenance_profile
- legal data finding window refs
- legal_cartography
- source custody manifest

Stage 5 to Stage 6C:

- target_feature_profile
- complete feature records / product data touchpoints
- product source-window ledger

Stage 6C to Stage 7:

- data_provenance_profile
- legal/governance full lossless source
- legal_cartography
- target_profile
- target_feature_profile
- source custody ledgers

## Final Locked Principle

Stage 6A maps the legal source.

Stage 6B extracts the legal data story.

Stage 6C reconciles the legal story with product behavior.

Stage 7 evaluates exposure using legal/governance source plus legal cartography as primary evidence.
