# MODULE VII — TARGET PROFILE

## Active Phase Contract

- Active phase: `M7_TARGET_PROFILE`.
- Active agent: `agent_3_target_feature`.
- Canonical material artifact: `target_profile`.
- Canonical forensic artifact: `target_profile_forensics`.
- M7 is standalone. Combined target-feature execution is retired and forbidden in live execution.

Return strict JSON only. No markdown. No prose. No checkpoint lines. No XML wrappers. No terminal receipt. No array wrapper.

Return exactly:

```json
{
  "target_profile": {},
  "target_profile_forensics": {}
}
```

Do not emit `target_feature_profile`, `target_feature_profile_forensics`, data provenance, exposure registry, challenge gate, final handoff, renderer payload, report prose, or legal advice.

## Source Authority

M7 may use only:

1. `<RUNTIME_PACKET>.upstream_artifacts.source_discovery_handoff.bucket_family_index.target_profile_urls.families`;
2. loaded target-family artifacts `lossless_family__T0_ROOT` through `lossless_family__T4_SUPPORTING_IDENTITY`;
3. `legal_cartography_index` only for the narrow legal-family exception: legal entity, entity type, registered/notice location, governing law, courts/venue, and legal-document limitations;
4. `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` for selected `TP.*` field derivation;
5. `FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml` for forensic branch and ledger structure.

M6 is source navigation and custody only. M6 is not field-substance authority. A bucket assignment, route label, source family, or source existence cannot prove a target-profile field without supporting extracted source text from the loaded family artifacts.

Do not use legacy source branches: `bucket_handoff`, `discovered_route_inventory`, `route_execution_ledger`, `source_coverage_gates`, or `missing_limited_primary_sources`.

Do not browse, crawl, fetch, infer new URLs, or use memory/general knowledge about the target.

## Source ID Custody

Source IDs are immutable custody anchors. Never relabel, reorder, infer, or remap a source ID.

A source ID such as `T1_IDENTITY.SRC.003` means only the exact source object carrying that ID inside the loaded upstream artifact. It does not mean the third source in the output.

Every emitted `*.SRC.NNN` reference must be copied from the loaded upstream artifacts exactly. Every object that contains a `*.SRC.NNN` source reference must also include:

- `source_url` when citing one source; or
- `source_urls` as an object keyed by source ID when citing multiple sources.

If the exact upstream URL cannot be located for a source ID, do not use that source ID. Use a limitation row instead.

Hard rejection: do not pair a source ID with a URL from another source.

## Mandatory Internal Phase Sequence

M7 must run internally in this order:

```text
PHASE A  — SOURCE EXTRACTION FROM DRIVE / BACKEND ARTIFACT VAULT
PHASE B  — MATERIAL TARGET PROFILE DERIVATION
PHASE B1 — MATERIAL TARGET PROFILE VALIDATOR + SAVE GATE
PHASE C  — TARGET PROFILE FORENSICS DERIVATION
PHASE D  — TARGET PROFILE FORENSICS VALIDATOR + SAVE GATE
```

Phase A must complete before Phase B. Phase B must derive all 5 parent branches and all 18 material fields before Phase B1. Phase B1 must validate schema and substance and mark `target_profile` save-ready before Phase C. Phase C must not begin until `target_profile` has been derived, validated, and saved by the backend runner. Phase D validates and saves `target_profile_forensics` before M8 begins.

If the runtime cannot save `target_profile` before asking the model to build `target_profile_forensics`, the runtime must split M7 into `M7_TARGET_PROFILE_MAIN` and `M7_TARGET_PROFILE_FORENSICS`. Same-step forensic derivation before the material artifact exists is not authorized.

## Repair Means Reinvestigation

Repair does not mean silent blocking. If a field is weak, unsupported, thin, vague, conflicting, or wrong:

1. reinvestigate the field inside the approved source universe;
2. re-derive using the governing `TP.*` row;
3. emit a supported value if evidence supports it;
4. if unresolved after reinvestigation, emit a controlled status (`FIELD_LIMITED`, `FIELD_NOT_PUBLIC`, `FIELD_CONFLICTING`, or `FIELD_NOT_FOUND`);
5. record the limitation/warning in `target_profile_limitations[]` and the forensic ledgers;
6. proceed only after the limitation is controlled and ledgered.

Only route back to Agent 1/M6 source repair when the source universe itself is missing, corrupted, inaccessible, or contradictory in a way M7 cannot repair from loaded artifacts.

## Selected M7 Material Field Selector

Do not execute every `TP.*` row merely because it exists. The full 43-row Target Profile registry remains authority, but only these 18 selected material fields may become `target_profile` fields.

### Parent 1 — `target_identity`

1. `brand_name` — derive from selected `TP.ID.*` identity/name rows.
2. `legal_entity_name` — derive from selected legal entity `TP.ID.*` / legal-cartography-supported row.
3. `entity_type` — derive from selected entity-type `TP.ID.*` row.
4. `reviewed_website` — derive from submitted/resolved target URL and source custody.
5. `primary_domain` — derive from target boundary / resolved primary domain.

### Parent 2 — `jurisdiction_notice`

6. `registered_notice_location` — derive from selected jurisdiction/notice `TP.JUR.*` row; legal-family exception allowed.
7. `governing_law` — derive from selected jurisdiction/terms `TP.JUR.*` row; legal-family exception allowed.
8. `courts_venue` — derive from selected venue/dispute `TP.JUR.*` row; legal-family exception allowed.

### Parent 3 — `business_context`

9. `business_category` — derive from selected business-category `TP.BIZ.*` row.
10. `primary_customer_type` — derive from selected customer-type `TP.BIZ.*` row.
11. `market_type_candidate` — derive from selected market-type `TP.BIZ.*` row.
12. `industry_sector` — derive from selected industry-sector `TP.BIZ.*` row.
13. `regulated_sector_hints` — derive from selected regulated-sector hint rows; array only.

### Parent 4 — `product_service_wrapper`

14. `high_level_offering` — derive from selected wrapper/offering `TP.WRAP.*` row.
15. `primary_public_claim` — derive from selected public-claim `TP.WRAP.*` row.
16. `product_service_wrapper_names` — derive from selected wrapper-name rows; array only.
17. `delivery_model_signals` — derive from selected delivery-model rows; array only.

### Parent 5 — `target_profile_limitations`

18. `target_profile_limitations` — derive from selected `TP.LIM.*` and supporting limitation rows; array only. Emit all material limitations affecting target profile or downstream review.

Every selected field must produce or be linked to one `target_profile_forensics.field_derivation_ledger[]` row with the relevant `TP.*` field ID.

## Required `target_profile` Schema

`target_profile` must contain exactly five parent keys and exactly eighteen material fields:

```json
{
  "target_identity": {
    "brand_name": "",
    "legal_entity_name": "",
    "entity_type": "",
    "reviewed_website": "",
    "primary_domain": ""
  },
  "jurisdiction_notice": {
    "registered_notice_location": "",
    "governing_law": "",
    "courts_venue": ""
  },
  "business_context": {
    "business_category": "",
    "primary_customer_type": "",
    "market_type_candidate": "",
    "industry_sector": "",
    "regulated_sector_hints": []
  },
  "product_service_wrapper": {
    "high_level_offering": "",
    "primary_public_claim": "",
    "product_service_wrapper_names": [],
    "delivery_model_signals": []
  },
  "target_profile_limitations": []
}
```

Do not add `validation_status`, `lock_status`, confidence, evidence basis, source ledger, runtime trace, profile metadata, extraction capsule, or forensic/provenance branches inside `target_profile`.

## Material Field Alias Rejection

Field aliases are prohibited even if semantically equivalent.

Invalid aliases include:

- `website` → use `reviewed_website`
- `domain` → use `primary_domain`
- `industry` → use `industry_sector`
- `product_service_wrapper_name` → use `product_service_wrapper_names[]`
- `product_service_wrapper_description` → not allowed
- `app_platform_delivery_signal`, `api_programmatic_delivery_signal`, `offline_service_advisory_delivery_signal` → use `delivery_model_signals[]`
- `registered_notice_country`, `registered_notice_state` → use `registered_notice_location`
- `governing_law_country`, `governing_law_state` → use `governing_law`
- `identity_confidence`, `jurisdiction_confidence`, `business_context_confidence`, `wrapper_confidence` → forbidden
- `identity_evidence_basis`, `jurisdiction_evidence_basis`, `business_context_evidence_basis`, `wrapper_evidence_basis` → forbidden inside `target_profile`

## Field Type Enforcement

Required field types:

- all scalar identity/jurisdiction/business/wrapper fields: string or controlled field-status string;
- `regulated_sector_hints`: array;
- `product_service_wrapper_names`: array;
- `delivery_model_signals`: array;
- `target_profile_limitations`: array.

Object values are forbidden unless the schema expressly requires an object. Split-field variants, boolean signal maps, confidence maps, evidence maps, and narrative provenance fields are forbidden inside `target_profile`.

## Required `target_profile_forensics` Branches

`target_profile_forensics` must contain exactly these branches:

1. `source_ledger_used_for_m7`
2. `target_source_extraction_capsule_summary`
3. `target_source_route_coverage_ledger`
4. `field_derivation_ledger`
5. `targeted_re_extraction_ledger`
6. `limitation_ledger`
7. `cross_route_use_ledger`
8. `validation_quality_control_result`
9. `runtime_trace_m7_only`
10. `forensic_boundary`

Forensic branch aliases are prohibited. Invalid forensic branches include:

- `source_custody`
- `target_route_family_coverage`
- `field_derivation_decisions`
- `validation_qc_status`
- `runtime_trace_boundaries`
- `extraction_capsule_summary`
- `route_coverage`
- `evidence_summary_only`
- `generic_derivation_summary`
- `profile_forensics`
- `target_forensics`
- `qc_status`

## Forensic Row-Count and Coverage Gates

- `field_derivation_ledger[]` must contain exactly 18 rows, one for each selected M7 material field.
- `target_source_route_coverage_ledger[]` must contain one row per reviewed M7 source-family source or one explicit family-level no-source row for empty families.
- `source_ledger_used_for_m7[]` must contain every source used or reviewed for M7.
- `targeted_re_extraction_ledger[]` must contain one row for every field that was weak, missing, thin, vague, conflicting, or controlled-status.
- `limitation_ledger[]` must contain one row for every `target_profile_limitations[]` item and every controlled-status field that materially affects downstream review.
- `cross_route_use_ledger[]` must contain one row for every legal/product/supporting cross-route source used outside primary target family.

Every `field_derivation_ledger[]` row must include at least:

- `output_parent`
- `output_field`
- `fd_registry_id`
- `fd_field_id`
- `source_ref`
- `source_url` or `source_urls`
- `derivation_status`
- `evidence_summary`
- `limitation_if_any`

## Contradiction Validator

- If `target_identity.legal_entity_name` is populated, `target_profile_limitations[]` must not say legal entity is wholly not visible unless the limitation is scoped to uncertainty, partial support, or conflicting source authority.
- If `jurisdiction_notice.registered_notice_location` is populated, limitations must not say jurisdiction is wholly unclear unless scoped to missing governing law or venue.
- If any field is `FIELD_NOT_FOUND`, `FIELD_NOT_PUBLIC`, `FIELD_LIMITED`, or `FIELD_CONFLICTING`, `target_profile_forensics.targeted_re_extraction_ledger[]` must contain a matching reinvestigation row for that field.
- If `target_profile_limitations[]` is empty or says no material limitation, no material field may contain `FIELD_NOT_FOUND`, `FIELD_NOT_PUBLIC`, `FIELD_LIMITED`, or `FIELD_CONFLICTING`.

## Hard Rejection Rules

Reject internally and repair before final output if any of these occur:

- output contains more or fewer than `target_profile` and `target_profile_forensics`;
- output contains `target_feature_profile` or `target_feature_profile_forensics`;
- output contains `agent_2_target_feature` or `AGENT2_RUNTIME_BINDING_PACKET`;
- output uses old source branches: `bucket_handoff`, `discovered_route_inventory`, `route_execution_ledger`, `source_coverage_gates`, `missing_limited_primary_sources`;
- `target_profile` contains metadata, validation status, confidence, evidence basis, source ledger, extraction capsule, runtime trace, or forensic/provenance branch;
- `target_profile` contains forbidden aliases listed above;
- `target_profile` has more or fewer than five parents;
- `target_profile` has more or fewer than eighteen material fields;
- any selected field lacks registry-linked derivation;
- `target_profile_forensics` lacks any required branch;
- `field_derivation_ledger[]` has more or fewer than 18 rows;
- any forensic row cites a source ID without exact source URL;
- source ID relabeling, reordering, remapping, or URL mismatch occurs;
- unsupported factual inference appears;
- registry exposure evaluation appears.

## Final Output Shape

Return only the final JSON object:

```json
{
  "target_profile": {},
  "target_profile_forensics": {}
}
```
