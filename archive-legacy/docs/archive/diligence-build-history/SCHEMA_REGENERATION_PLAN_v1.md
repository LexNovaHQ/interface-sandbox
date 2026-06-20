# SCHEMA REGENERATION PLAN v1

## 0. Status

- Phase: 1A
- Purpose: audit and plan only
- No schema rewrites performed
- Governing docs:
  - INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md
  - VAULT_JS_CANONICAL_MAP_v1.md

## 1. Current Schema Inventory

| Current file | Exists? | Current apparent purpose | Canonical object under new spine | Action in Phase 1B | Risk level |
|---|---|---|---|---|---|
| data/schemas/assemblyOutput.schema.json | yes | Legacy Assembly output package with product_profile, document routing, draft preview, CRM delivery | assembly_handoff_payload | Rewrite | High |
| data/schemas/deliveryState.schema.json | yes | Downstream Delivery status object | delivery_state, downstream/outside Phase 1B | Keep unchanged in Phase 1B unless manifest dependency requires registry entry | Low |
| data/schemas/diligenceReport.schema.json | yes | Minimal report wrapper with company_profile, product_profile, classification, triggered_findings | diligence_compiler_output | Rewrite | High |
| data/schemas/maintenanceRun.schema.json | yes | Downstream Maintenance/Horizon update state | maintenance_run, downstream/outside Phase 1B | Keep unchanged in Phase 1B unless manifest dependency requires registry entry | Low |
| data/schemas/sourceBundle.schema.json | yes | Legacy source bundle with sources_read[] and source_summary | source_bundle | Rewrite | High |
| data/schemas/vault.schema.json | yes | Legacy Vault grouping product_identity, ai_architecture, data_output, commercial_controls | vault_payload | Rewrite from VAULT_JS_CANONICAL_MAP_v1.md exactly | Critical |

Current files missing from the Phase 1B target set:

- data/schemas/targetFeatureProfile.schema.json
- data/schemas/legalStackReview.schema.json
- data/schemas/registryLedger.schema.json
- data/schemas/operatorChallenge.schema.json
- data/schemas/diligenceRunState.schema.json
- data/schemas/handoffEnvelope.schema.json
- data/schemas/schemaManifest.schema.json

## 2. Schema Registry Audit

`src/lib/schemas.js` currently exports `SCHEMA_PATHS` only. It maps six camelCase names to public `/data/schemas/*.json` paths and has no validation helper, manifest, versioning, or canonical object metadata.

| Current export/key | Current path | Stale? | Canonical replacement key | Phase 1B action |
|---|---|---|---|---|
| sourceBundle | /data/schemas/sourceBundle.schema.json | yes | source_bundle | Keep file path, map canonical logical name to sourceBundle.schema.json |
| diligenceReport | /data/schemas/diligenceReport.schema.json | yes | diligence_compiler_output | Keep file path, map canonical logical name to diligenceReport.schema.json |
| vault | /data/schemas/vault.schema.json | yes | vault_payload | Keep file path, map canonical logical name to vault.schema.json |
| assemblyOutput | /data/schemas/assemblyOutput.schema.json | yes | assembly_handoff_payload | Keep file path, map canonical logical name to assemblyOutput.schema.json |
| deliveryState | /data/schemas/deliveryState.schema.json | no for downstream shell; outside Phase 1B | delivery_state | Preserve or mark downstream in schemaManifest |
| maintenanceRun | /data/schemas/maintenanceRun.schema.json | no for downstream shell; outside Phase 1B | maintenance_run | Preserve or mark downstream in schemaManifest |
| not present | not present | yes | target_feature_profile | Add targetFeatureProfile path |
| not present | not present | yes | legal_stack_review | Add legalStackReview path |
| not present | not present | yes | registry_evaluation_ledger | Add registryLedger path |
| not present | not present | yes | operator_challenge_gate | Add operatorChallenge path |
| not present | not present | yes | diligence_run_state | Add diligenceRunState path |
| not present | not present | yes | handoff_envelope | Add handoffEnvelope path |
| not present | not present | yes | schema_manifest | Add schemaManifest path |

## 3. Stale Field Audit

| Stale field / concept | Found in file(s) | Problem | Canonical replacement | Phase 1B action |
|---|---|---|---|---|
| company_profile | data/schemas/diligenceReport.schema.json; migration note in Contract Spine | Legacy company/product split conflicts with target_profile | target_profile | Remove from diligenceReport schema; replace with target_profile |
| product_profile | data/schemas/diligenceReport.schema.json; data/schemas/assemblyOutput.schema.json; migration note in Contract Spine | Legacy product object is underspecified and duplicates target/product feature slices | target_profile, primary_product, product_feature_map[] | Remove from diligenceReport and assemblyOutput schemas |
| classification | data/schemas/diligenceReport.schema.json; runtime/docs text | Too broad; hides feature-level evidence and controlled vocabulary | product_feature_map[] with archetype_codes[] and surface_tokens[] | Remove from diligenceReport schema |
| triggered_findings | data/schemas/diligenceReport.schema.json; migration note in Contract Spine | Suppresses controlled and insufficient-evidence rows | findings[], controlled_rows[], insufficient_evidence_rows[] | Replace and enforce no-cap invariant |
| sources_read | data/schemas/sourceBundle.schema.json; migration note in Contract Spine | Stores raw source text instead of admitted evidence/artifact view | source_review, artifact_inventory[], evidence_buffer[] | Replace with source_bundle canonical shape |
| source_bundle.sources_read | data/schemas/sourceBundle.schema.json | Same as sources_read; stale nested path | source_bundle.evidence_buffer[] and source_bundle.artifact_inventory[] | Remove in Phase 1B |
| assembly_ready | data/schemas/diligenceReport.schema.json | Boolean is too weak for handoff state | assembly_route, assembly_handoff, handoff_envelope | Remove from diligenceReport schema |
| product_identity | data/schemas/vault.schema.json; migration note in Contract Spine | Wrong Vault top-level group | baseline | Rewrite vault.schema.json |
| ai_architecture | data/schemas/vault.schema.json; migration note in Contract Spine | Wrong Vault top-level group and contains human_review | architecture plus archetypes/compliance as mapped | Rewrite vault.schema.json |
| data_output | data/schemas/vault.schema.json; migration note in Contract Spine | Wrong Vault top-level group | compliance and baseline fields per Vault map | Rewrite vault.schema.json |
| commercial_controls | data/schemas/vault.schema.json; migration note in Contract Spine | Wrong Vault top-level group | baseline | Rewrite vault.schema.json |
| meta | docs/runtime and prompt references; HTML meta tags; artifact metadata; Vault map forbids Vault meta | Not found as current data/schemas Vault group; risky in older runtime/prompt handoff_meta references | No meta group in vault_payload; handoff metadata belongs in assembly_handoff/handoff_envelope only | Ensure vault.schema.json forbids meta |
| human_review | data/schemas/vault.schema.json; older runtime docs; Vault map prohibitions | Vault Canonical Map says HITL/human_review is not a Vault field | Route effect from Judge/high-risk archetypes; no literal Vault field | Remove from vault.schema.json |
| architecture.integrations | not found | Explicitly forbidden placement; integrations currently absent from old Vault schema | baseline.integrations | Ensure vault.schema.json places integrations under baseline |
| architecture.output_ownership | not found | Explicitly forbidden placement; old schema has data_output.output_ownership_position | baseline.output_ownership | Ensure vault.schema.json places output_ownership under baseline |
| architecture.agent_limits | not found | Explicitly forbidden placement | archetypes.agent_limits | Ensure vault.schema.json places agent_limits under archetypes |
| sales_viability | older runtime docs; prompt docs; Contract Spine no-legacy list | Legacy key forbidden from Stage 5 output | no replacement; remove/forbid | Add diligenceReport schema negative constraint if practical |
| signal_context | older runtime docs; prompt docs; Contract Spine no-legacy list | Legacy key forbidden from Stage 5 output | no replacement; remove/forbid | Add diligenceReport schema negative constraint if practical |
| ghost_protection_profile | older runtime docs; prompt docs; Contract Spine no-legacy list | Legacy key forbidden from Stage 5 output | no replacement; remove/forbid | Add diligenceReport schema negative constraint if practical |
| true_gaps | older runtime docs; prompt docs; Contract Spine no-legacy list | Legacy key forbidden from Stage 5 output | no replacement; remove/forbid | Add diligenceReport schema negative constraint if practical |
| prospect_meta | older runtime docs; prompt docs; Contract Spine no-legacy list | Legacy key forbidden from Stage 5 output | no replacement; remove/forbid | Add diligenceReport schema negative constraint if practical |
| registry_count_loaded | older runtime docs, prompt docs, Contract Spine | Current docs hardcode 98 in places; Phase 1A target says active registry row count is dynamic | registry_count_loaded equal to registry_evaluation_ledger.length and active registry row count | Use dynamic count validation; do not hardcode 98 |
| hardcoded 98 | registry runtime docs, Contract Spine, README/runtime artifacts | Contract source currently references 98-row artifact, but Phase 1B target requires dynamic active row count | active registry row count from registry runtime | Avoid const 98 in schemas; use descriptions and validation notes |

## 4. Required Schema Rewrites

### data/schemas/sourceBundle.schema.json

- Canonical object: source_bundle
- Governing spine sections: Node 0, Node 0.5, Source admission controls, Source Bundle Requirements
- Required top-level fields: run_id, source_mode, submitted_at, source_review, artifact_inventory, evidence_buffer, limitations
- Required arrays: discovery_candidates, artifact_inventory[], evidence_buffer[], limitations[]
- Required enums: source_mode = url, manual_urls, text, url_plus_text; discovery_candidates.status = DISCOVERY_ONLY; admission_status values should distinguish admitted, rejected, limited, and pending/manual review
- Validation gates: evidence_buffer non-empty OR limitations explain why; every admitted evidence item has source_url, first_party_basis, source_hash, zone, artifact_class, extracted_excerpt, status, admission_status; search/grounding candidates cannot be treated as evidence until admitted
- Fields to remove: submitted_by_user if it is only raw source text, sources_read[], source_summary.total_chars as governing evidence proxy, raw full text persistence outside active-run scope
- Phase 1B notes: keep file name requested by task even though Contract Spine also mentions an evidenceBundle replacement; schema title should name `source_bundle`

### data/schemas/diligenceReport.schema.json

- Canonical object: diligence_compiler_output
- Governing spine sections: Canonical Final Object, Output Projections, Stage 5 validation, Diligence Report Requirements
- Required top-level fields: diligence_run, source_bundle_summary, target_profile, primary_product, product_feature_map, legal_stack, document_stack_redline, threat_registry_summary, feature_to_threat_matrix, findings, controlled_rows, insufficient_evidence_rows, report_data, technical_audit_log, assembly_route, assembly_handoff, handoff_envelope, disclaimer
- Required arrays: product_feature_map[], legal_stack[], document_stack_redline[], findings[], controlled_rows[], insufficient_evidence_rows[], technical_audit_log entries as needed
- Required enums: final_status values inherited from registry ledger; feature_role CORE/SECONDARY; document_type ToS/Privacy Policy/DPA/AUP/SLA; handoff/status enums from handoff envelope
- Validation gates: findings.length equals count(TRIGGERED); controlled_rows.length equals count(CONTROLLED); insufficient_evidence_rows.length equals count(INSUFFICIENT_EVIDENCE); no legacy keys; no truncated arrays; every finding.threat_id exists in registry
- Fields to remove: company_profile, product_profile, classification, triggered_findings, document_route_summary as sole route summary, assembly_ready
- Phase 1B notes: schema may reference new component schemas after creation; do not rely on current old prompt outputs

### data/schemas/vault.schema.json

- Canonical object: vault_payload
- Governing spine sections: Vault Canonical Map sections 1-5 and Phase 0A validation controls
- Required top-level fields: baseline, architecture, archetypes, compliance, status, submittedAt
- Required arrays: none required at top level unless literal Vault map fields require array-valued nested fields; use the canonical nested fields from the Vault map tables
- Required enums: status should include intake_received; nested field enums must follow Vault map field tables, including output_ownership full/limited/none and architecture memory/models values where enumerated
- Validation gates: no invented keys; exact group placement; integrations under baseline; no human_review; no meta; fan-out applied; every prefill traces to source; material unknown fields become vault_confirmation_questions outside vault_payload
- Fields to remove: product_identity, ai_architecture, data_output, commercial_controls, human_review, output_ownership_position
- Phase 1B notes: generate from VAULT_JS_CANONICAL_MAP_v1.md, not assumptions; add additionalProperties controls where practical

### data/schemas/assemblyOutput.schema.json

- Canonical object: assembly_handoff_payload
- Governing spine sections: Node 5B Assembler, Output #2 Assembly Handoff, Assembly Output Requirements
- Required top-level fields: assembly_handoff, vault_prefill_suggestions, vault_confirmation_questions, assembly_route_recommendation, warnings
- Required arrays: vault_confirmation_questions[], warnings[], threat_findings[] or assembly_handoff.threat_findings[] depending final nesting
- Required enums: source_engine/target_engine/status from handoff envelope where embedded; route/status enums as defined by Assembly contract
- Validation gates: vault_prefill_suggestions may contain only fields allowed by Vault Canonical Map; every prefill carries value, basis, confidence, source_finding_ids[]; envelope passes handoff validator when included
- Fields to remove: product_profile, active_document_stack as unstructured-only route, clause_routes, schedule_routes, variable_map, draft_preview, crm_delivery as current primary shape
- Phase 1B notes: keep downstream document routing as Assembly-owned; Phase 1B should only define handoff payload contract, not renderer/draft code

## 5. Required New Schemas

### data/schemas/targetFeatureProfile.schema.json

- Canonical object: target_feature_profile
- Purpose: Stage 1 target and product feature map output
- Producer: Gemini Stage 1 Pages Function in later phase
- Consumer: Stage 2, Stage 3, report compiler, Node 5B
- Top-level fields: run_id, target_profile, primary_product, product_feature_map, feature_map_scratchpad, limitations
- Key enums: feature_role CORE/SECONDARY; archetype_codes and surface_tokens from registry_key.runtime.json
- Validation gates: target_profile has required keys; primary_product has product_name, user, function, mechanism, agent_actor, agent_brand_name; each feature has evidence_quote and feature_source_url; linked_threat_ids starts empty
- Dependencies: source_bundle, registry key controlled vocabulary

### data/schemas/legalStackReview.schema.json

- Canonical object: legal_stack_review
- Purpose: Stage 2 legal document inventory and redline
- Producer: Gemini Stage 2 Pages Function in later phase
- Consumer: Stage 3, Stage 5 compiler, report renderer
- Top-level fields: run_id, legal_stack, document_stack_redline, document_stack_synthesis, legal_stack_assessment, limitations
- Key enums: document_type = ToS, Privacy Policy, DPA, AUP, SLA; evidence_status values for present/missing/partial/unknown
- Validation gates: legal_stack length exactly 5; one of each document type; if exists=false then document_url = "N/A" and covers = null; feature_ref values valid
- Dependencies: source_bundle, target_feature_profile

### data/schemas/registryLedger.schema.json

- Canonical object: registry_evaluation_ledger
- Purpose: Stage 3 complete registry row evaluation ledger
- Producer: Gemini Stage 3 batch functions plus backend merge in later phase
- Consumer: Operator challenge, compiler, technical audit log
- Top-level fields: run_id, registry_count_loaded, registry_count_evaluated, registry_evaluation_ledger, batch_meta, warnings
- Key enums: final_status = TRIGGERED, CONTROLLED, NOT_TRIGGERED, NOT_APPLICABLE, INSUFFICIENT_EVIDENCE
- Validation gates: every active registry row evaluated once; count is dynamic, not hardcoded 98; no missing/duplicate threat_id; conditions[] present with basis; feature_refs[] valid; evidence_ref present where status depends on evidence
- Dependencies: registry.runtime.json, registry_key.runtime.json, source_bundle, target_feature_profile, legal_stack_review

### data/schemas/operatorChallenge.schema.json

- Canonical object: operator_challenge_gate
- Purpose: Stage 4 full-ledger challenge and reopen/correction gate
- Producer: Gemini Stage 4 Pages Function plus backend correction merge in later phase
- Consumer: compiler and technical audit log
- Top-level fields: run_id, operator_challenge_gate, corrected_ledger_entries, warnings
- Key enums: result = PASS, REOPENED
- Validation gates: if REOPENED, corrected entries match existing threat_ids; registry_count_evaluated equals dynamic registry_count_loaded after correction; high_risk_checks present
- Dependencies: registryLedger schema, source_bundle, target_feature_profile, legal_stack_review

### data/schemas/diligenceRunState.schema.json

- Canonical object: diligence_run_state
- Purpose: Firestore run-state contract for stage orchestration
- Producer: later orchestrator/server functions
- Consumer: wrapper/runtime status, future stage functions, audit surfaces
- Top-level fields: run_id, source_mode, current_stage, stage_statuses, artifact_refs, warnings, created_at, updated_at
- Key enums: stage IDs for source_collector, evidence_refiner, target_feature_profile, legal_stack_review, registry_ledger, operator_challenge, compiler, node_5b; statuses pending/running/complete/failed/skipped
- Validation gates: timestamps ISO; stage transitions monotonic; artifact refs point to declared schema_manifest entries
- Dependencies: schemaManifest, handoffEnvelope where handoff exists

### data/schemas/handoffEnvelope.schema.json

- Canonical object: handoff_envelope
- Purpose: JSON schema equivalent of the existing JS handoff validator
- Producer: Node 5B and future engines
- Consumer: Assembly, Delivery, Horizon, Maintenance handoff readers
- Top-level fields: handoff_id, run_id, source_engine, target_engine, payload_type, status, created_at, updated_at, payload_ref, summary, warnings
- Key enums: source_engine and target_engine = wrapper, diligence, assembly, delivery, horizon, maintenance; status = draft, ready, pushed, received, failed; payload_type from current JS contract
- Validation gates: required IDs, valid engine IDs, valid payload type, valid status, ISO timestamps, warnings[] array
- Dependencies: src/wrapper/contracts/handoffEnvelope.js

### data/schemas/schemaManifest.schema.json

- Canonical object: schema_manifest
- Purpose: registry of schema logical names, paths, versions, ownership, and phase status
- Producer: Phase 1B schema rewrite
- Consumer: src/lib/schemas.js and future validation utilities
- Top-level fields: version, generated_at, schemas, governing_docs, phase_status
- Key enums: schema phase status active/deferred/downstream; schema owner diligence/assembly/delivery/maintenance/wrapper
- Validation gates: every SCHEMA_PATHS entry has manifest entry; every manifest path exists; canonical object names unique
- Dependencies: all schema files

## 6. Vault Schema Requirements

`vault.schema.json` must be generated from `VAULT_JS_CANONICAL_MAP_v1.md`, not assumptions.

Allowed top-level fields:

- baseline
- architecture
- archetypes
- compliance
- status
- submittedAt

Forbidden fields:

- meta
- human_review
- architecture.integrations
- architecture.output_ownership
- architecture.agent_limits

Correct group placement:

- integrations under baseline
- output_ownership under baseline
- agent_limits under archetypes
- HITL/human review is not a Vault field

One-input-sets-many rules:

- JDG -> is_judge + is_judge_hr + is_judge_legal
- OPT -> is_optimizer + sens_fin
- CMP -> conversational_ui + derived is_companion route, but do not emit is_companion as literal Vault field unless the Vault map later adds it

The literal shape is:

```js
vault_payload = {
  baseline: {},
  architecture: {},
  archetypes: {},
  compliance: {},
  status: "intake_received",
  submittedAt: "<ISO timestamp>"
}
```

## 7. Assembly Output Requirements

`assemblyOutput.schema.json` must allow:

- assembly_handoff
- vault_prefill_suggestions
- vault_confirmation_questions
- assembly_route_recommendation
- warnings

`vault_prefill_suggestions` may only contain fields allowed by the Vault Canonical Map. Each prefill entry should carry `{ value, basis, confidence, source_finding_ids[] }`. Material unknown fields become `vault_confirmation_questions[]`, not fabricated prefill values.

## 8. Diligence Report Requirements

`diligenceReport.schema.json` must support:

- diligence_run
- source_bundle_summary
- target_profile
- primary_product
- product_feature_map[]
- legal_stack[]
- document_stack_redline[]
- threat_registry_summary
- feature_to_threat_matrix
- findings[]
- controlled_rows[]
- insufficient_evidence_rows[]
- report_data
- technical_audit_log
- assembly_route
- assembly_handoff
- handoff_envelope
- disclaimer

No-cap invariant:

- findings.length must equal count(TRIGGERED)
- controlled_rows.length must equal count(CONTROLLED)
- insufficient_evidence_rows.length must equal count(INSUFFICIENT_EVIDENCE)

The schema should forbid or fail validation for legacy Stage 5 keys where JSON Schema can express this clearly, especially `sales_viability`, `signal_context`, `ghost_protection_profile`, `true_gaps`, and `prospect_meta`.

## 9. Source Bundle Requirements

`sourceBundle.schema.json` must support:

- source_mode enum: url, manual_urls, text, url_plus_text
- discovery_candidates as DISCOVERY_ONLY
- source_review
- artifact_inventory[]
- evidence_buffer[]
- limitations[]
- source_hash
- source_url
- zone
- artifact_class
- extracted_excerpt
- admission_status
- first_party_basis

Search/grounding output is not evidence until Source Collector admission.

Raw scrape full text is active-run only unless later persistence is explicitly enabled. Persisted final evidence should use admitted excerpts, hashes, provenance, limitations, and admission metadata.

## 10. Registry Ledger Requirements

`registryLedger.schema.json` must support:

- every active registry row evaluated once
- active registry row count is dynamic, not hardcoded 98
- final_status enum:
  - TRIGGERED
  - CONTROLLED
  - NOT_TRIGGERED
  - NOT_APPLICABLE
  - INSUFFICIENT_EVIDENCE
- conditions[]
- trigger_if_result
- exclude_if_result
- feature_refs[]
- evidence_ref
- reasoning_summary

The current Contract Spine and older runtime docs still mention 98 in multiple places because the current installed artifact has 98 rows. Phase 1B schemas should treat that as current artifact metadata, not as a hardcoded schema invariant.

## 11. Handoff Envelope Requirements

`src/wrapper/contracts/handoffEnvelope.js` already covers the core runtime checks:

- required `handoff_id` and `run_id`
- allowed `source_engine` and `target_engine`
- allowed `payload_type`
- allowed `status`
- ISO-like parseable `created_at` and `updated_at`
- `warnings` must be an array when present

The JS validator is useful but not enough as contract documentation because it is executable app code, has no JSON Schema `$id`, and is not discoverable in the schema registry. Phase 1B should create `data/schemas/handoffEnvelope.schema.json` as the documentation/schema contract and keep it aligned with the JS validator unless a later phase intentionally changes both.

## 12. Phase 1B Execution Plan

1. `data/schemas/vault.schema.json`
   - rewrite/create: rewrite
   - dependencies: VAULT_JS_CANONICAL_MAP_v1.md
   - validation notes: exact groups, no meta, no human_review, integrations/output_ownership/agent_limits placement

2. `data/schemas/sourceBundle.schema.json`
   - rewrite/create: rewrite
   - dependencies: Contract Spine Node 0/0.5 and Phase 0A source controls
   - validation notes: source_mode enum, DISCOVERY_ONLY candidates, admitted evidence metadata, no raw full-text persistence contract

3. `data/schemas/targetFeatureProfile.schema.json`
   - rewrite/create: create
   - dependencies: source_bundle, registry key vocabularies
   - validation notes: target_profile and primary_product required keys; feature evidence quote/source URL required

4. `data/schemas/legalStackReview.schema.json`
   - rewrite/create: create
   - dependencies: source_bundle, target_feature_profile
   - validation notes: exactly 5 legal_stack docs, one per document type, missing docs use document_url = "N/A"

5. `data/schemas/registryLedger.schema.json`
   - rewrite/create: create
   - dependencies: registry runtime, registry key, source_bundle, target_feature_profile, legal_stack_review
   - validation notes: every active row once; dynamic count; valid final_status enum; conditions[] with basis

6. `data/schemas/operatorChallenge.schema.json`
   - rewrite/create: create
   - dependencies: registryLedger
   - validation notes: PASS/REOPENED; corrected entries match existing threat_id; count revalidates

7. `data/schemas/diligenceReport.schema.json`
   - rewrite/create: rewrite
   - dependencies: all previous Diligence schemas plus handoff/assembly shapes
   - validation notes: no-cap invariant, no legacy keys, report_data and technical_audit_log present

8. `data/schemas/assemblyOutput.schema.json`
   - rewrite/create: rewrite
   - dependencies: vault.schema.json, diligenceReport, handoffEnvelope
   - validation notes: vault_prefill allowed keys only; confirmation questions for unknown material fields

9. `data/schemas/handoffEnvelope.schema.json`
   - rewrite/create: create
   - dependencies: src/wrapper/contracts/handoffEnvelope.js
   - validation notes: mirror JS validator enums and required fields

10. `data/schemas/diligenceRunState.schema.json`
    - rewrite/create: create
    - dependencies: schemaManifest and stage schema paths
    - validation notes: stage statuses, artifact refs, ISO timestamps

11. `data/schemas/schemaManifest.schema.json`
    - rewrite/create: create
    - dependencies: all schema files
    - validation notes: unique canonical object names, paths exist, phase status for downstream schemas

12. `src/lib/schemas.js`
    - rewrite/create: update
    - dependencies: schemaManifest and final file names
    - validation notes: map canonical logical names to schema file paths; preserve delivery/maintenance mappings as downstream where still needed

## 13. Risks / Open Questions

- Current `data/schemas/vault.schema.json` is structurally incompatible with the Vault Canonical Map.
- Current `data/schemas/diligenceReport.schema.json` is too small for the Contract Spine and omits controlled/insufficient evidence rows.
- Current `data/schemas/sourceBundle.schema.json` persists `sources_read[].text`; Phase 1B must separate active-run raw scrape text from persisted admitted evidence.
- Current `data/schemas/assemblyOutput.schema.json` models Assembly output/draft delivery, not Diligence-to-Assembly handoff payload.
- `src/lib/schemas.js` uses camelCase keys and no canonical object metadata; Phase 1B needs a canonical mapping and likely a manifest.
- No schema validation dependency or schema test script is present in `package.json`.
- `src/wrapper/contracts/handoffEnvelope.js` overlaps with the requested `handoffEnvelope.schema.json`; Phase 1B must keep both aligned.
- Older runtime/prompt docs still reference Groq-era execution and legacy keys. They were not modified in Phase 1A, but Phase 2 prompt work should reconcile them with the Phase 0A contracts.
- The Contract Spine and old runtime docs contain hardcoded `98` registry-row references. Phase 1B schemas should use dynamic active row count while noting the current runtime artifact has 98 rows.
- `data/schemas/deliveryState.schema.json` and `data/schemas/maintenanceRun.schema.json` exist but are not in the Phase 1B target rewrite list. Leave them unchanged unless schemaManifest needs to register them as downstream/deferred.

## 14. Phase 1A Verification

Files inspected:

- data/schemas/assemblyOutput.schema.json
- data/schemas/deliveryState.schema.json
- data/schemas/diligenceReport.schema.json
- data/schemas/maintenanceRun.schema.json
- data/schemas/sourceBundle.schema.json
- data/schemas/vault.schema.json
- src/lib/schemas.js
- src/wrapper/contracts/handoffEnvelope.js
- docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md
- docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md
- package.json

Files changed:

- docs/contracts/SCHEMA_REGENERATION_PLAN_v1.md

Confirmations:

- data/schemas unchanged in Phase 1A.
- src/lib/schemas.js unchanged in Phase 1A.
- No runtime files changed in Phase 1A.
- No React UI files changed in Phase 1A.
- No Firebase, Cloudflare, Gemini, Source Collector, prompt, or report renderer code created in Phase 1A.
