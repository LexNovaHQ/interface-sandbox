# MODULE X — TARGET DATA PROVENANCE PROFILE
## Runtime-Synced / Data-Control Extraction Upgrade

## M10.S0 — Phase Call Card and Phase-Local Lock Gate

<phase_call_card>
phase_id: M10_DATA_PROVENANCE
module_id: M10
module_name: TARGET_DATA_PROVENANCE_PROFILE
active_phase_only: true
active_agent: agent_4_data_privacy
canonical_material_output: target_data_provenance_profile
canonical_forensic_output: target_data_provenance_profile_forensics

module_design_lock:
  M10 is a public-footprint Privacy Readiness / Data Provenance Profile module.
  It converts locked upstream source-route custody, target context, feature/activity mechanics, and legal/governance navigation into a compact 34-field data-control profile.
  It does not decide legal applicability, compliance, lawful-basis sufficiency, transfer legality, security adequacy, liability, registry exposure, or legal risk.
  It is the data/privacy/control substrate for M11 exposure routing only.

governing_imports:
  - 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md
  - AGENT4_RUNTIME_BINDING_PACKET.yaml
  - 00_TERMINAL_RECEIPT_RULES_INTEGRATED.md
  - 00_VALIDATOR_RULES_INTEGRATED.md
  - AGENT4_BACKEND_OUTPUT_CONTRACT.md
  - FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
  - FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml
  - 01_M6_SOURCE_DISCOVERY_RUNTIME_SYNC_PATCHED.md
  - M7_TARGET_PROFILE_INTEGRATED_AGENT3_LOCKED_PATCHED_SPLIT_OUTPUTS.md
  - M8_FEATURE_PROFILE_INTEGRATED_AGENT3_LOCKED_STRUCTURE_PRESERVED_PHASED_SPLIT_OUTPUTS.md
  - 04_M9_LEGAL_CARTOGRAPHY_RUNTIME_SYNC_PATCHED.md

runtime_binding_expectation:
  active_agent_id: agent_4_data_privacy
  active_agent_name: Interface Data Privacy Agent
  active_phase_scope: M10_DATA_PROVENANCE

execution_rule:
  Execute M10 only.
  Read only locked upstream artifacts approved for Agent 4.
  Build `target_data_provenance_profile` first.
  Build `target_data_provenance_profile_forensics` only after `target_data_provenance_profile` has been completed, validated, and saved as the M10 material artifact by the backend runner.
  Build the Data-Control Source Extraction Capsule before DAP field application.
  Apply the Anti-Unknown Protocol to every material data/privacy/control/readiness signal.
  Apply only selected DAP material-selector rows mapped to the locked 34-field M10 output.
  Use `law_regulatory_readiness_matrix` as a compact readiness matrix, not as a legal conclusion matrix.
  Do not use `data_provenance_profile` alias.
  Do not mutate `source_discovery_handoff`, `target_profile`, `target_feature_profile`, or `legal_cartography_index`.
  Do not perform M6, M7, M8, M9, M11, M12, M13, or M14 work.
  Do not emit registry rows, threat IDs, exposure findings, operator challenge, final output handoff, report prose, or terminal report output.
  Do not call legacy `validate_phase`; use the backend M10 material validator at Phase B1 and the backend M10 forensic validator at Phase D.

internal_stage_order:
  - PHASE A / M10-A: Data-Control Source Extraction From Agent 1/2/3 Backend Artifacts
  - PHASE B / M10-B: Material Target Data Provenance Profile Derivation
  - PHASE B1 / M10-B1: Material Target Data Provenance Profile Validator + Save Gate
  - PHASE C / M10-C: Target Data Provenance Profile Forensics Derivation
  - PHASE D / M10-D: Target Data Provenance Profile Forensics Validator + Save Gate

phase_boundary_map:
  PHASE_A_SOURCE_EXTRACTION: M10.S3 + M10.S6 source-universe gate
  PHASE_B_PROFILE_DERIVATION: M10.S4 + M10.S5 + M10.S7 + M10.S8 + M10.S9 + M10.S10 + M10.S11 + M10.S12 + M10.S13 + M10.S14
  PHASE_B1_PROFILE_VALIDATION_SAVE_GATE: M10.S17 material-profile gates + M10.S18A
  PHASE_C_FORENSIC_DERIVATION: M10.S15 + M10.S16
  PHASE_D_FORENSIC_VALIDATION_SAVE_GATE: M10.S17 forensic gates + M10.S18B
  sequence_rule: Phase A must pass before Phase B; Phase B must complete all 34 material fields before Phase B1; Phase B1 must validate and mark `target_data_provenance_profile` save-ready before Phase C; Phase C may begin only after `target_data_provenance_profile` is saved; Phase D must validate and save `target_data_provenance_profile_forensics` before M11.

phase_terminal_sequence:
  In backend execution, return strict JSON only.
  Do not emit `<phase_output>` blocks.
  Do not emit checkpoint prose.
  Do not emit terminal receipt text.
  Do not emit audit logs, operator challenge gates, report prose, markdown, or same-chat next-agent instructions.
  M10 has two separate backend terminal events, not one combined response.
  Phase B1 terminal event returns exactly one top-level key: `target_data_provenance_profile`.
  The backend runner must validate and save `target_data_provenance_profile` as an artifact before Phase C starts.
  Phase D terminal event returns exactly one top-level key: `target_data_provenance_profile_forensics`.
  The backend runner must validate and save `target_data_provenance_profile_forensics` before M11.
  A response that contains both `target_data_provenance_profile` and `target_data_provenance_profile_forensics` in the same backend call is invalid unless the operator has explicitly invoked a non-production debug bundling mode.

phase_local_gate:
  Before handoff, verify:
    - active runtime binding resolves to Agent 4 / M10 only.
    - upstream artifacts exist or controlled failure/limitation is recorded.
    - no live source discovery, browsing, crawling, search, refresh, or unapproved URL expansion occurred.
    - Data-Control Source Extraction Capsule was completed before DAP field application.
    - only M6-approved/admitted routes, supplied public material, and locked upstream objects were used.
    - patched M8 activity paths were used: `activity_reference`, `product_service_wrapper`, `activity_feature_name`, `mechanics_proof`, `data_content_object_touched`, `archetype_codes`, `surface_context_tokens`, `surface_proof_and_routing_limits`.
    - DAP registry authority is loaded as derivation authority, not a visible output schema.
    - exactly the locked 34 M10 top-level fields are present in `target_data_provenance_profile`.
    - `target_data_provenance_profile_forensics` is separate and emitted only after the main profile has been validated and saved as a backend artifact.
    - every material signal resolves through the Anti-Unknown Protocol.
    - every unresolved, weak, access-failed, not-visible, not-searched, visible-processing-no-control, or conflicting signal creates or references a missing-proof request unless `NOT_APPLICABLE`.
    - `law_regulatory_readiness_matrix` uses the locked nested row schema.
    - readiness labels are review categories only, not legal applicability or compliance conclusions.
    - every selected DAP row has a Module V or forensic workpad outcome.
    - no old multi-map branches, aliases, profile metadata, source/provenance material, trace, debug, registry rows, final handoff, or report branches appear inside the material profile.

  allowed_gate_outcomes:
    - PASS
    - REPAIR_REQUIRED
    - REINVESTIGATE_REQUIRED
    - PASS_WITH_LIMITATION
    - CONTROLLED_FAILURE

allowed_inputs:
  - source_discovery_handoff
  - source_discovery_handoff.bucket_family_index.data_privacy_security_control_urls.families where present
  - primary M10 lossless bucket set:
    - lossless_family__D1_SECURITY_TRUST
    - lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER
    - lossless_family__D3_DATA_GOVERNANCE_CONTROLS
    - lossless_family__D4_DOCS_API_DATA_FLOW
    - lossless_family__D5_AI_SAFETY_TRANSPARENCY
  - legal_cartography_index
  - target_profile
  - target_profile_forensics
  - target_feature_profile
  - target_feature_profile_forensics
  - FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml DAP.* authority
  - FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml forensic authority
  - M6-approved data/privacy/security/control/legal/product/docs/API routes and admitted public material
  - upstream limitations from M6, M7, M8, M9, and M8 forensics

required_machine_output_by_phase:
  PHASE_B1_MATERIAL_SAVE_EVENT:
    - target_data_provenance_profile
  PHASE_D_FORENSIC_SAVE_EVENT:
    - target_data_provenance_profile_forensics

forbidden_outputs:
  - data_provenance_profile alias
  - target_exposure_profile
  - operator_challenge_gate
  - final_output_handoff
  - REGISTRY_ROW lines
  - threat IDs
  - exposure statuses
  - legal/compliance conclusions
  - profile_meta inside target_data_provenance_profile
  - provenance_executive_map
  - principal_subject_customer_affected_party_map
  - party_role_map
  - object_data_asset_category_map
  - activity_level_flow_map
  - purpose_basis_authorization_readiness_map
  - consent_notice_authorization_user_control_chain
  - processor_subprocessor_vendor_partner_chain
  - transfer_location_custody_map
  - retention_deletion_return_portability_map
  - security_access_governance_controls_map
  - domain_specific_lifecycle_map
  - sensitive_high_risk_context_map
  - missing_proof_and_diligence_request_list
  - provenance_limitations

validator_action:
  action_name: backend_validate_and_save_M10_DATA_PROVENANCE
  phase: M10_DATA_PROVENANCE
  pass_condition: Phase B1 emits and saves target_data_provenance_profile first with exactly 34 locked fields; only after backend save may Phase C/D emit and save target_data_provenance_profile_forensics; Data-Control Source Extraction Capsule locked + selected DAP row coverage recorded + Anti-Unknown and missing-proof routing complete + readiness matrix controlled
  fail_behavior: repair M10 only; do not advance to M11

repair_policy:
  - If local gate returns REPAIR_REQUIRED, repair M10 only and rerun the local gate.
  - If local gate returns REINVESTIGATE_REQUIRED, emit a scoped reinvestigation request limited to M6-approved routes/materials, locked upstream objects, M9 navigation refs, and documented absence/access records.
  - If necessary data/privacy/security/control route is absent from M6, return to M6/Agent 1 repair instead of searching or inventing.
  - Do not recompute unrelated upstream objects.

stop_condition:
  Stop local M10 phase only; return control to the backend runner. The backend runner may advance to M11 only after `target_data_provenance_profile` and `target_data_provenance_profile_forensics` are saved and M10 returns a safe pass/control outcome.
</phase_call_card>

`M10.S0.C1` This phase call card is the first executable block for Module X when extracted into a standalone Agent 4 phase prompt.

`M10.S0.C2` In monolith execution, this call card functions as a Module-local lock gate and terminal-projection contract. It does not authorize standalone `<phase_output>` blocks, same-chat receipts, compatibility wrappers, or combined material+forensic backend packets in production execution.

`M10.S0.C3` The Module may not advance, hand off, or be treated as locked until its phase-local gate has returned `PASS`, `PASS_WITH_LIMITATION`, or `CONTROLLED_FAILURE`.

`M10.S0.C4` `REPAIR_REQUIRED` and `REINVESTIGATE_REQUIRED` are stop states.

---

## M10.S1 — Function, Boundary, and Hard Rules

### M10.S1A — Function

`M10.S1A.C1` Module X converts locked upstream source custody, target context, activity mechanics, and legal/governance navigation into the canonical compact `target_data_provenance_profile` object.

`M10.S1A.C2` Module X performs public-footprint privacy readiness and data provenance visibility analysis only.

`M10.S1A.C3` Module X answers five questions:

| Question | M10 treatment |
|---|---|
| What data/control signals are visible? | Map visible signals into the 34-field material profile. |
| What feature-level data touchpoints are supported? | Use M8 activity mechanics and M6-approved product/docs/API evidence. |
| What notices, rights, vendors, transfers, retention, security, training, memory, logging, and tracking controls are visible? | Extract from M6-approved data/privacy/security/control/legal/docs evidence. |
| Which readiness areas appear supported, weak, unavailable, or not searched from public material? | Use controlled readiness rows only. |
| What evidence is missing for diligence/local counsel/operator review? | Route to `missing_proof_and_diligence_requests`. |

`M10.S1A.C4` Module X emits `target_data_provenance_profile` in the Phase B1 material save event first. Only after the backend has saved that material artifact may Module X emit `target_data_provenance_profile_forensics` in the Phase D forensic save event.

`M10.S1A.C5` Module X working memory is governed by Module V through `data_provenance_ledger`.

`M10.S1A.C6` Module X is the data/privacy/control substrate for Module XI registry evaluation, but it does not evaluate registry rows.

### M10.S1B — Mandatory Duties

| Duty | Rule |
|---|---|
| Consume upstream artifacts | MUST consume `source_discovery_handoff`, `legal_cartography_index`, saved `target_profile`, saved `target_profile_forensics`, saved `target_feature_profile`, and saved `target_feature_profile_forensics`. |
| Apply DAP authority | MUST apply selected `DAP.*` rows from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`. |
| Build extraction capsule | MUST build the Data-Control Source Extraction Capsule before DAP application. |
| Use approved evidence only | MUST use only M6-approved/admitted routes/materials, locked upstream objects, and M9 navigation refs. |
| Apply Anti-Unknown | MUST resolve every material signal through controlled status vocabulary. |
| Create missing-proof requests | MUST create or reference missing-proof rows for unresolved/weak/access-failed/not-visible/conflicting signals unless not applicable. |
| Preserve readiness boundary | MUST treat GDPR/DPDP/CCPA/COPPA/EU AI Act/sectoral labels as review categories only. |
| Preserve explicit negative controls | MUST treat express no-training/no-sale/no-sharing/delete/export/opt-out/retention-limit wording as visible controls where supported. |
| Preserve upstream limitations | MUST carry forward limitations from M6, M7, M8, and M9. |
| Save separation | MUST save `target_data_provenance_profile` at Phase B1 before deriving or saving `target_data_provenance_profile_forensics` at Phase D. |

### M10.S1C — Forbidden Acts

| Forbidden act | Reason |
|---|---|
| Live searching, browsing, crawling, probing, refreshing, re-parsing, or adding sources | M10 is downstream; M6 controls source universe. |
| Using unapproved URLs, search snippets, candidate leads, rejected/quarantined/deferred material | Breaks custody. |
| Inferring hidden implementation facts | Public-footprint visibility only. |
| Inventing data categories, purposes, vendors, retention terms, transfer terms, rights mechanisms, training controls, memory controls, logging controls, or security controls | Unsupported inference. |
| Treating a missing public signal as proof the control does not exist in practice | Public absence is not real-world absence. |
| Deciding legal applicability, compliance, lawful basis sufficiency, consent validity, transfer legality, security adequacy, liability, or legal risk | Legal firewall. |
| Assigning threat IDs, registry rows, trigger outcomes, exposure status, control status, risk level, or registry conclusions | M11 boundary. |
| Mutating upstream artifacts | Single-writer custody. |
| Emitting old multi-map branches or alias roots | Output contract breach. |

---

## M10.S2 — Input Custody Protocol

### M10.S2A — Required Inputs

| Required input | Required use |
|---|---|
| `source_discovery_handoff` | Source route universe, bucket routing, approved routes/materials, execution limitations, absence/access records, downstream routing. |
| `source_discovery_handoff.bucket_family_index.data_privacy_security_control_urls.families` where present | Primary M10 data/privacy/security/control route-family universe and source-custody index. If the exact family path is absent but equivalent D-family route custody exists in the active M6 handoff, use that equivalent D-family custody path and ledger the path variation. |
| `lossless_family__D1_SECURITY_TRUST` | Primary M10 lossless source bucket for security, trust, compliance, SOC/ISO, data-security, and incident/security-control evidence. |
| `lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER` | Primary M10 lossless source bucket for subprocessors, privacy center, DPA/data-protection, GDPR/privacy governance, vendor/subprocessor, and customer terms evidence. |
| `lossless_family__D3_DATA_GOVERNANCE_CONTROLS` | Primary M10 lossless source bucket for data governance, retention, deletion, rights, consent, policy controls, and privacy-control evidence. |
| `lossless_family__D4_DOCS_API_DATA_FLOW` | Primary M10 lossless source bucket for docs/API data flow, inputs/outputs, API payloads, logging, telemetry, embeddings, model-provider, and technical data-control evidence. |
| `lossless_family__D5_AI_SAFETY_TRANSPARENCY` | Primary M10 lossless source bucket for AI safety, transparency, model-use, training/fine-tuning, model-improvement, automated-decision, and AI-control evidence. |
| `target_profile` | Target identity, business context, wrapper context, and upstream limitations only. |
| `target_profile_forensics` | M7 source-custody, field-derivation, reinvestigation, and limitation proof where relevant to M10 context. |
| `target_feature_profile` | Activity mechanics, data/content/object touched, archetypes, surfaces, and routing limitations only. |
| `target_feature_profile_forensics` | M8 activity-source coverage, selected PA derivation, mechanics proof, archetype/surface proof, targeted re-extraction, and limitations where relevant to M10. |
| `legal_cartography_index` | Privacy/DPA/security/subprocessor/legal-governance navigation refs only; no legal conclusions. |
| `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` | Governing `DAP.*` derivation authority. |
| `FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml` | Forensic/proof artifact structure. |
| Module V ledger | Upstream custody, limitation, repair, and selected-row memory. |

### M10.S2B — Patched M8 Path Consumption Rule

Module X must consume the patched M8 activity card only.

| M10 data need | Correct M8 path | Forbidden old path |
|---|---|---|
| Activity reference | `activity_reference` | `activity_id` |
| Product/wrapper context | `product_service_wrapper` | `product_context` |
| Activity name | `activity_feature_name` | `activity_name` |
| Mechanics | `mechanics_proof` | `mechanics` |
| Data/object touched | `data_content_object_touched` | implied from feature name |
| Archetypes | `archetype_codes[]` | old routing branch |
| Surface/context tokens | `surface_context_tokens[]` | `surface_tokens[]` |
| Routing limits | `surface_proof_and_routing_limits` | `routing_basis` alone |

`M10.S2B.C1` If the patched M8 fields are missing, return `REPAIR_REQUIRED` to Agent 3 / M8 rather than using retired paths.

### M10.S2C — Route / Material Access Matrix

| Route / material family | Access status | Permitted M10 use |
|---|---|---|
| Primary M10 lossless D-buckets: `lossless_family__D1_SECURITY_TRUST` through `lossless_family__D5_AI_SAFETY_TRANSPARENCY` | Primary | canonical lossless evidence bucket set for M10 data/privacy/security/control/AI transparency extraction and field derivation. |
| Data/privacy/security/control routes from M6 | Primary | notices, rights, controls, vendors, transfers, retention, training, logging, tracking, security, governance. |
| Product/docs/API routes from M6 | Primary where data/control-relevant | feature data touchpoints, input/output, API payloads, telemetry, logging, model-provider chain, embeddings, outputs. |
| Legal/governance routes from M6/M9 | Permitted by relevance | privacy policy, DPA, cookie policy, subprocessor page, AI policy, security/trust docs, customer terms, not legal analysis. |
| Target profile routes | Context only | target identity/business/wrapper context and limitations. |
| M7 target-profile forensics | Proof/limitation context | source custody, field limitations, reinvestigation outcomes, and cross-route warnings relevant to data-control interpretation. |
| M8 activity profile | Routing substrate | mechanics, data object touched, archetype/surface context only. |
| M8 feature-profile forensics | Proof/limitation context | activity-source coverage, mechanics evidence, archetype/surface derivation rows, omitted candidates, and limitation context. |
| Non-routed/absence/access records | Limitation only | absence, access failure, insufficient text, not-searched, gated, parser failure. |
| Rejected/quarantined/snippet-only material | Forbidden as evidence | may appear only as limitation context if already recorded by M6. |

### M10.S2D — Input Failure Handling

| Condition | Required handling |
|---|---|
| `source_discovery_handoff` missing | `CONTROLLED_FAILURE` unless formal upstream failure route exists. |
| `target_profile` missing | `CONTROLLED_FAILURE` or route to Agent 3 / M7 repair if required. |
| `target_profile_forensics` missing | `CONTROLLED_FAILURE` or route to Agent 3 / M7 repair because M10 cannot safely consume M7 limitations/custody without it. |
| `target_feature_profile` missing | `CONTROLLED_FAILURE` unless limited execution with no activity-level claims is truthful and expressly allowed by operator. |
| `target_feature_profile_forensics` missing | `CONTROLLED_FAILURE` or route to Agent 3 / M8 repair because M10 cannot safely consume M8 proof/limitations without it. |
| `legal_cartography_index` missing | `LOCKED_WITH_LIMITATIONS` only if non-legal data evidence can still support profile; otherwise repair. |
| M6 data/privacy/control routes absent | Use approved cross-route evidence if data/control-relevant; otherwise limitation or M6 repair. |
| Expected source was searched and signal not found | `NOT_VISIBLE_AFTER_TARGETED_SEARCH` plus missing-proof request where material. |
| Expected source was not searched | `UNKNOWN_NOT_SEARCHED` plus missing-proof request where material. |
| Source attempted but access/text failed | `ACCESS_FAILED` plus missing-proof request. |
| Public material is document-only | Profile must state document-only limitation. |

---

## M10.S3 — PHASE A: Data-Control Source Extraction Capsule

`M10.S3.C1` M10-A exists to prevent schema-shaped privacy hallucination. It forces route-grounded extraction before DAP field application.

`M10.S3.C2` The extraction capsule is internal working material. It is not the material profile and must not be emitted as a standalone material object.

`M10.S3.C3` The extraction capsule must be summarized only inside `target_data_provenance_profile_forensics` after the material profile is complete.

### M10.S3A — Extraction Parent Matrix

| Extraction parent | Source basis | Required extraction focus | Fields supported |
|---|---|---|---|
| Source coverage extraction | live `source_discovery_handoff.bucket_family_index`, primary M10 lossless D-buckets, loaded lossless family artifacts, artifact `sources[]`, limitation branches, and M9 navigation refs | What was reviewed, missing, gated, broken, access-failed, not searched, or document-only | `assessment_scope`, `source_coverage`, `limitations` |
| Activity data-touchpoint extraction | M8 activities + M6 product/docs/API evidence | actor/user, input, object touched, system action, output, recipient/destination, human access | `collection_sources_and_activity_data_flows`, `processing_operations_lifecycle`, `data_categories` |
| People/role/object extraction | M8 surfaces + privacy/product/docs evidence | affected people, customer users, admins, employees, minors, role candidates, object categories | `individuals_and_relationships`, `role_relationship_readiness`, `data_categories`, `sensitive_special_category_signals`, `children_minors_signal` |
| Notice/authorization/control extraction | privacy policy, terms, DPA, trust center, customer terms | notice route, purpose, consent/authorization, customer instruction, controls, rights/grievance routes | `privacy_notice_visibility`, `purpose_use_signals`, `lawful_basis_consent_authorization_readiness`, `consent_withdrawal_controls`, `rights_request_routes` |
| Governance/contact/DPA extraction | privacy policy, DPA, customer terms, security/trust, help/legal contacts | privacy contact, DPO/grievance, accountability, customer terms, DPA availability | `privacy_governance_contact_accountability_signals`, `contractual_dpa_customer_terms_readiness` |
| Vendor/subprocessor/sharing extraction | subprocessor page, DPA, privacy policy, trust/security pages, product integration docs | vendors, subprocessors, partners, roles, functions, change notice, objection, third-party sharing/sale/no-sale/no-sharing | `vendor_subprocessor_partner_inventory`, `processor_subprocessor_governance_controls`, `third_party_disclosure_sharing_controls` |
| Transfer/location/custody extraction | DPA, subprocessors, privacy/security/trust docs, hosting/residency statements | processing/storage location, transfer direction, destination, residency/localization/safeguards | `cross_border_transfer_location_custody` |
| Retention/deletion/export extraction | privacy policy, DPA, customer terms, docs/help/account routes | retention period, deletion trigger, backup/log retention, post-termination, return/export/portability | `retention_deletion_return_export_controls` |
| Security/incident extraction | security/trust docs, DPA, privacy/security policy, docs | security controls, access model, human access, audit/logging, incident/breach route | `security_access_controls`, `breach_incident_readiness` |
| Tracking/marketing extraction | cookie policy, privacy notice, consent banner if captured, marketing/analytics statements | cookies, analytics, ads, marketing, opt-out, consent route | `cookies_tracking_marketing_controls` |
| AI model/provider/training extraction | AI policy, product/docs/API, privacy policy, DPA, customer terms, subprocessors | model provider, AI vendor, hosted model, training, fine-tuning, model improvement, customer-content use | `ai_model_provider_processing_chain`, `ai_training_finetuning_model_improvement_controls` |
| Embeddings/memory/logging extraction | docs/API/product/security/privacy/DPA evidence | embeddings, vector store, memory, semantic cache, prompt logs, output logs, telemetry, debug/abuse logs, retention/deletion | `embeddings_vector_memory_controls`, `prompt_output_logging_telemetry_controls`, `generated_output_and_derived_data_treatment` |
| Automated decision/sensitive/minor extraction | M8 archetypes/surfaces + product/privacy/docs evidence | scoring, ranking, profiling, eligibility, human review, minors, sensitive categories | `automated_decision_profiling_human_review_signal`, `sensitive_special_category_signals`, `children_minors_signal` |
| Readiness evidence extraction | all extraction parents | readiness support, weak controls, missing controls, counsel review prompts | `law_regulatory_readiness_matrix`, `privacy_accountability_documentation_signals`, `missing_proof_and_diligence_requests` |

### M10.S3B — Route Coverage Row

For every M10-approved route/material family, the capsule must record a coverage row with these human-readable fields:

| Coverage field | Required rule |
|---|---|
| Route or material reference | Must resolve to M6-approved route/material or locked upstream object path. |
| Route/material family | Use the M10 access matrix family. |
| Source status | `EXTRACTED`, `EXTRACTED_WITH_LIMITATION`, `DUPLICATE_CANONICALIZED`, `NON_PUBLIC_OR_GATED`, `BROKEN_OR_404`, `ACCESS_FAILED`, `OUT_OF_SCOPE_FOR_M10_WITH_REASON`, or `RETURN_TO_M6_REPAIR`. |
| Extraction parents reviewed | List relevant extraction parents from `M10.S3A`. |
| Field families supported | List affected M10 fields. |
| Anti-Unknown impact | State whether reviewed, not visible, weak, access failed, conflict, or not applicable. |
| Missing-proof impact | State whether request row is required. |

### M10.S3C — Extraction Quality Gate

M10-A passes only if:

| Gate | Pass condition |
|---|---|
| Approved route coverage | Every M10-approved data/control-relevant route/material has a coverage row or formal limitation. |
| Parent coverage | Every extraction parent has extracted material or explicit no-support/access/limitation reason. |
| Field relevance | Extracted material is tied to at least one M10 field family. |
| No route-label inference | Route title or URL alone is not field evidence. |
| No source expansion | No source outside M6-approved/admitted universe is used. |
| Weak signal handling | Weak/missing/conflicting signals are routed to Anti-Unknown and missing-proof. |

`M10.S3C.C1` Only after this gate passes may the module mark PHASE A complete. In backend execution, do not emit checkpoint prose; record the checkpoint in validator/workpad state only.

### M10.S3D — Live Source Inventory Contract

`M10.S3D.C1` M10 must use the live backend source structure only. Deprecated source branches such as `bucket_handoff`, `discovered_route_inventory`, `route_execution_ledger`, `source_coverage_gates`, and root-level `missing_limited_primary_sources` are invalid as required inputs.

`M10.S3D.C2` The primary M10 lossless bucket set is mandatory input where available: `lossless_family__D1_SECURITY_TRUST`, `lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER`, `lossless_family__D3_DATA_GOVERNANCE_CONTROLS`, `lossless_family__D4_DOCS_API_DATA_FLOW`, and `lossless_family__D5_AI_SAFETY_TRANSPARENCY`. These are the primary data-control evidence buckets for Phase A extraction.

`M10.S3D.C3` M10-approved data-control evidence may come only from loaded source families and artifact rows authorized by `source_discovery_handoff.bucket_family_index`, including the primary D-buckets, legal/governance routes, and product/docs/API routes where data-control relevant.

`M10.S3D.C4` Every source ID used in M10 forensics must be paired with the exact `source_url` or `source_urls` copied from the loaded upstream source object.

---

## M10.S4 — Anti-Unknown Protocol

### M10.S4A — Locked Status Ladder

| Status | Use only when |
|---|---|
| `VISIBLE_CONTROL_PRESENT` | Exact admitted evidence shows a relevant data/control/notice/right/security/vendor/retention/training/opt-out/no-use/no-sale/no-sharing/no-training/deletion/export/control signal. |
| `NOT_VISIBLE_AFTER_TARGETED_SEARCH` | Expected route/material was reviewed through M6-approved evidence or absence records, but no relevant signal was visible. |
| `VISIBLE_DATA_PROCESSING_NO_CONTROL_FOUND` | Data processing is visible, but corresponding notice/control/right/security/vendor/retention/training signal is not visible in searched material. |
| `VISIBLE_BUT_CONTROL_WEAK_OR_UNCLEAR` | Wording exists but is vague, incomplete, ambiguous, generic, non-committal, or not mapped to the relevant feature/signal. |
| `ACCESS_FAILED` | Relevant route/source was attempted but inaccessible or text-insufficient. |
| `UNKNOWN_NOT_SEARCHED` | Relevant expected route was genuinely not searched, unavailable to M6, or lacks any admissible basis. |
| `CONFLICTING_SIGNALS` | Two or more admitted evidence sources materially conflict on the same signal. |
| `NOT_APPLICABLE` | Signal is outside target/feature/source scope and no visible processing basis exists. |

### M10.S4B — Anti-Unknown Rules

| Rule | Lock |
|---|---|
| Raw unknown is forbidden | Do not use raw `UNKNOWN`, blank, unclear, or unsupported placeholders. |
| Reviewed but absent | Use `NOT_VISIBLE_AFTER_TARGETED_SEARCH`, not `UNKNOWN_NOT_SEARCHED`. |
| Processing visible but control absent | Use `VISIBLE_DATA_PROCESSING_NO_CONTROL_FOUND`. |
| Control wording weak | Use `VISIBLE_BUT_CONTROL_WEAK_OR_UNCLEAR`. |
| Source inaccessible | Use `ACCESS_FAILED`. |
| Explicit negative control visible | Treat as `VISIBLE_CONTROL_PRESENT` when evidence says no-training/no-sale/no-sharing/delete/export/opt-out/restrict-use/retention limit. |
| Gap routing | Every unresolved/weak/access-failed/not-visible/not-searched/conflicting signal must create or reference missing-proof unless `NOT_APPLICABLE`. |
| Legal firewall | Status is not a legal finding. |
| Controlled UNKNOWN exception | `UNKNOWN_NOT_SEARCHED` is the only permitted UNKNOWN-form status and only where the relevant expected route was genuinely not searched, unavailable to M6, or lacks any admissible basis. Raw `UNKNOWN` remains forbidden. |

---

## M10.S5 — DAP Material Selector and 34-Field Derivation Matrix

`M10.S5.C1` Module X owns only `target_data_provenance_profile` and `target_data_provenance_profile_forensics`.

`M10.S5.C2` Material field authority comes from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`.

`M10.S5.C3` DAP registry authority is a derivation authority, not the visible material output schema.

`M10.S5.C4` Do not execute all 138 DAP rows as visible fields. Execute only selected DAP rows mapped to the 34 locked fields.

`M10.S5.C5` For every selected `DAP.*` row, apply `Mode`, `Source_Basis`, `Conditions`, `Trigger_Outcome`, `Exclude_Fallback`, and `Forbidden_Inference`.

`M10.S5.C6` Every populated M10 field must cite applicable `DAP.* Field_ID` in Module V ledger and `target_data_provenance_profile_forensics`.

`M10.S5.C7` `M10.T2A` is the selected material execution map for Phase B. Each material field written in M10.S6 through M10.S14 must map back to this table and the governing `DAP.*` Field_ID(s).

### M10.T2A — Locked 34-Field Material Selector

| Category | Output field | Registry rows to use | Execution owner | Rule |
|---|---|---|---|---|
| Scope and coverage | `assessment_scope` | `DAP.EXEC.*`, `DAP.LIM.*` | M10.S6 | Define whether assessment is full website, URL-only, document-only, public-material-only, or limited. |
| Scope and coverage | `source_coverage` | `DAP.EXEC.*`, `DAP.LIM.001`, `DAP.LIM.002`, source coverage records | M10.S6 | List reviewed source classes and coverage limits. |
| People / roles / objects | `individuals_and_relationships` | `DAP.PARTY.*`, `DAP.ROLE.004`, `DAP.SENS.*` | M10.S7 | Identify people/party groups and their relationship to target/customer/activity. |
| People / roles / objects | `role_relationship_readiness` | `DAP.ROLE.*`, `DAP.READY.003`, `DAP.AUTH.004`, `DAP.AUTH.008` | M10.S7 | Capture role candidates as readiness signals only. No legal role conclusion. |
| People / roles / objects | `data_categories` | `DAP.OBJ.*`, `DAP.FLOW.003`, `DAP.FLOW.006`, `DAP.DOM.002` | M10.S7 | Map visible data/object categories. |
| People / roles / objects | `generated_output_and_derived_data_treatment` | `DAP.OBJ.006`, `DAP.OBJ.007`, `DAP.FLOW.005`, `DAP.FLOW.006`, `DAP.RET.*`, `DAP.REQ.*` | M10.S7 | Capture generated outputs, transformations, derived data, summaries, classifications, transcripts, embeddings, or unclear treatment. |
| People / roles / objects | `sensitive_special_category_signals` | `DAP.OBJ.003`, `DAP.SENS.002`–`DAP.SENS.007`, `DAP.DOM.*` | M10.S11 | Record sensitive/special/high-risk signals only where visibly supported. |
| People / roles / objects | `children_minors_signal` | `DAP.SENS.001`, `DAP.PARTY.*`, `DAP.REQ.*` | M10.S11 | Record child/minor/student/youth signal or absence/uncertainty through Anti-Unknown. |
| Lifecycle | `collection_sources_and_activity_data_flows` | `DAP.FLOW.*`, `DAP.OBJ.*`, `DAP.PARTY.004`, M8 compact activity card | M10.S8 | Link M8 activities to collection source, entry point, input, touchpoint, output, recipient/destination, human access, and object touched. |
| Lifecycle | `processing_operations_lifecycle` | `DAP.FLOW.*`, `DAP.OBJ.*`, `DAP.AUTH.*`, `DAP.RET.*`, `DAP.LOC.*`, `DAP.VEND.*` | M10.S8 | Map visible collect/receive/ingest/transform/analyze/generate/store/share/transfer/retain/delete/export/return lifecycle. |
| Lifecycle | `purpose_use_signals` | `DAP.AUTH.001`, `DAP.AUTH.002`, `DAP.AUTH.003`, `DAP.DOM.001`, `DAP.DOM.005` | M10.S8 | Capture visible purpose/use statements. |
| Notice / rights / governance | `privacy_notice_visibility` | `DAP.CTRL.001`, `DAP.CTRL.002`, `DAP.AUTH.*`, `DAP.READY.004` | M10.S9 | Record public privacy notice/equivalent route visibility and strength. |
| Notice / rights / governance | `lawful_basis_consent_authorization_readiness` | `DAP.AUTH.004`, `DAP.AUTH.005`, `DAP.AUTH.006`, `DAP.AUTH.007`, `DAP.AUTH.008`, `DAP.READY.004` | M10.S9 | Capture authorization/legal-basis/customer-instruction candidate language as readiness only. |
| Notice / rights / governance | `consent_withdrawal_controls` | `DAP.CTRL.003`, `DAP.CTRL.004`, `DAP.CTRL.005`, `DAP.CTRL.006`, `DAP.CTRL.009` | M10.S9 | Capture consent, scope, withdrawal/revocation, opt-out, authorization, and user/customer control routes. |
| Notice / rights / governance | `rights_request_routes` | `DAP.PARTY.006`, `DAP.RET.003`, `DAP.RET.004`, `DAP.CTRL.006`, `DAP.READY.005`, `DAP.REQ.*` | M10.S9 | Capture access, correction, deletion, portability/export, objection/restriction equivalents, dispute/grievance routes. |
| Notice / rights / governance | `privacy_governance_contact_accountability_signals` | `DAP.PARTY.006`, `DAP.CTRL.*`, `DAP.SEC.005`, `DAP.READY.005`, `DAP.READY.007`, `DAP.REQ.*` | M10.S9 | Capture privacy contact, DPO/grievance/contact route, accountability/governance, incident contact. |
| Notice / rights / governance | `contractual_dpa_customer_terms_readiness` | `DAP.ROLE.*`, `DAP.AUTH.004`, `DAP.CTRL.*`, `DAP.VEND.*`, `DAP.LOC.*`, `DAP.READY.*`, `DAP.REQ.*` | M10.S9 | Capture DPA/customer terms/customer instruction/subprocessor/transfer/audit/help routes. |
| Vendors / transfers / retention / security | `vendor_subprocessor_partner_inventory` | `DAP.VEND.*`, `DAP.ROLE.003`, `DAP.ROLE.005`, `DAP.READY.006`, `DAP.REQ.*` | M10.S10 | Capture visible vendors, subprocessors, partners, onward processors, functions, inventory visibility. |
| Vendors / transfers / retention / security | `processor_subprocessor_governance_controls` | `DAP.VEND.*`, `DAP.ROLE.*`, `DAP.CTRL.*`, `DAP.AUTH.004`, `DAP.READY.006`, `DAP.SEC.*`, `DAP.REQ.*` | M10.S10 | Capture DPA terms, instruction boundary, subprocessor list, change notice, objection, audit/help/security terms. |
| Vendors / transfers / retention / security | `third_party_disclosure_sharing_controls` | `DAP.VEND.*`, `DAP.CTRL.*`, `DAP.AUTH.*`, `DAP.LOC.*`, `DAP.REQ.*` | M10.S10 | Capture disclosure/sharing/sale/no-sale/no-sharing/affiliates/ads/analytics/integrations separately from processor chain. |
| Vendors / transfers / retention / security | `cross_border_transfer_location_custody` | `DAP.LOC.*`, `DAP.VEND.*`, `DAP.READY.008`, `DAP.REQ.*` | M10.S10 | Capture processing/storage location, transfer direction, residency/localization/safeguard statements. No transfer legality conclusion. |
| Vendors / transfers / retention / security | `retention_deletion_return_export_controls` | `DAP.RET.*`, `DAP.CTRL.006`, `DAP.READY.005`, `DAP.REQ.*` | M10.S10 | Capture retention periods, deletion triggers, backup/log retention, post-termination handling, return/export. |
| Vendors / transfers / retention / security | `security_access_controls` | `DAP.SEC.001`, `DAP.SEC.002`, `DAP.SEC.003`, `DAP.SEC.004`, `DAP.SEC.006`, `DAP.SEC.007`, `DAP.SEC.008` | M10.S10 | Capture security/access/audit/logging/human-access controls. No adequacy conclusion. |
| Vendors / transfers / retention / security | `breach_incident_readiness` | `DAP.SEC.005`, `DAP.READY.007`, `DAP.REQ.*` | M10.S10 | Capture breach/incident route or absence/weakness as readiness only. |
| AI / tracking / memory / logging / decisioning | `cookies_tracking_marketing_controls` | `DAP.CTRL.*`, `DAP.AUTH.*`, `DAP.DOM.*`, `DAP.REQ.*` | M10.S11 | Capture cookies, tracking, analytics, ads, marketing notice, consent, opt-out, or not-visible status. |
| AI / tracking / memory / logging / decisioning | `ai_model_provider_processing_chain` | `DAP.DOM.004`, `DAP.VEND.*`, `DAP.FLOW.007`, `DAP.LOC.*`, `DAP.SEC.*`, `DAP.REQ.*` | M10.S11 | Capture visible model provider, API/model vendor, hosted model, processing destination, custody/location, missing proof. |
| AI / tracking / memory / logging / decisioning | `ai_training_finetuning_model_improvement_controls` | `DAP.DOM.001`, `DAP.DOM.005`, `DAP.AUTH.*`, `DAP.CTRL.*`, `DAP.RET.*`, `DAP.REQ.*` | M10.S11 | Capture no-training, training, fine-tuning, model improvement, customer-content use, opt-out, use limitation, absence/weakness. |
| AI / tracking / memory / logging / decisioning | `embeddings_vector_memory_controls` | `DAP.OBJ.006`, `DAP.OBJ.007`, `DAP.FLOW.005`, `DAP.RET.*`, `DAP.SEC.*`, `DAP.DOM.*`, `DAP.REQ.*` | M10.S11 | Capture embeddings, vector stores, memory, semantic cache, derived representation, retention/deletion/security controls. |
| AI / tracking / memory / logging / decisioning | `prompt_output_logging_telemetry_controls` | `DAP.FLOW.*`, `DAP.RET.005`, `DAP.SEC.004`, `DAP.AUTH.*`, `DAP.CTRL.*`, `DAP.REQ.*` | M10.S11 | Capture prompt/output logs, telemetry, analytics, debugging, abuse monitoring, audit logging, retention/deletion. |
| AI / tracking / memory / logging / decisioning | `automated_decision_profiling_human_review_signal` | `DAP.FLOW.*`, `DAP.DOM.*`, `DAP.SENS.*`, `DAP.READY.*`, M8 archetypes/surfaces | M10.S11 | Capture scoring, ranking, profiling, eligibility, consequential recommendation, automated decision, human review. No legal conclusion. |
| Accountability / readiness | `privacy_accountability_documentation_signals` | `DAP.READY.*`, `DAP.REQ.*`, `DAP.SEC.*`, `DAP.CTRL.*`, `DAP.DOM.*` | M10.S12 | Capture DPIA/PIA, ROPA/records, privacy-by-design, AI impact assessment, audit/certification/trust artifacts, governance documentation, or absence/access limits. |
| Accountability / readiness | `law_regulatory_readiness_matrix` | `DAP.READY.001`–`DAP.READY.012`, plus related DAP families | M10.S12 | Produce compact readiness rows using locked nested row schema. No applicability/compliance/violation/liability conclusions. |
| Missing proof / limitations | `missing_proof_and_diligence_requests` | `DAP.REQ.*`, all weak/missing/fallback rows | M10.S13 | Convert gaps into evidence requests with owner/priority/downstream effect where visible. |
| Missing proof / limitations | `limitations` | `DAP.LIM.*`, upstream limitations, Anti-Unknown unresolved states | M10.S14 | Capture footprint/document/gated/access-failed/weak/not-searched limitations and downstream effect. |

---

## M10.S6 — PHASE B: Execution Step 1: Input Custody and Source Universe Gate

`M10.S6.PHASE_RULE` This section opens PHASE B. It may run only after PHASE A Data-Control Source Extraction Capsule has passed. M10.S6 through M10.S14 are Phase B material-profile parent/field derivation sections.

### Consumes

`M10.S6.C1` Consume `source_discovery_handoff`.

`M10.S6.C2` Consume `target_profile`.

`M10.S6.C3` Consume `target_feature_profile`.

`M10.S6.C4` Consume `legal_cartography_index`.

`M10.S6.C5` Consume DAP registry and forensic registry references.

### Applies

`M10.S6.C6` Verify active Agent 4 / M10 runtime scope.

`M10.S6.C7` Build the M10-approved data-control route/material universe from M6-approved route families and admitted public material only.

`M10.S6.C8` Load the 34-field selector in `M10.T2A`.

### Writes

`M10.S6.C9` Initialize only `assessment_scope` and `source_coverage` as material fields.

`M10.S6.C10` Do not initialize or emit `target_data_provenance_profile_forensics` in Phase B. Forensics begin only after Phase B1 validates and saves the material profile.

`M10.S6.C11` Write Module V ledger rows: `data_input_custody_check`, `data_source_universe_initialization`, `data_source_gate_review`, and `data_dap_selector_initialization`.

### Forbidden

`M10.S6.C12` Do not derive substantive data/control fields before extraction capsule lock.

`M10.S6.C13` Do not initialize `profile_meta` or any metadata branch inside `target_data_provenance_profile`.

---

## M10.S7 — PHASE B: Execution Step 2: People, Roles, Objects, and Derived Data

### Consumes

`M10.S7.C1` Consume Data-Control Source Extraction Capsule parents for people/role/object extraction.

`M10.S7.C2` Consume M8 activity mechanics and surface context as routing inputs only.

### Applies

`M10.S7.C3` Apply `DAP.PARTY.*`, `DAP.ROLE.*`, `DAP.OBJ.*`, relevant `DAP.FLOW.*`, `DAP.DOM.*`, `DAP.SENS.*`, and `DAP.REQ.*` rows.

### Writes

| Field | Required handling |
|---|---|
| `individuals_and_relationships` | Identify people/party groups and relationships to target/customer/activity. |
| `role_relationship_readiness` | Candidate roles only; no legal role conclusion. |
| `data_categories` | Visible object/data categories only. |
| `generated_output_and_derived_data_treatment` | Generated outputs, transformations, derived data, embeddings, transcripts, scores, logs where visible. |
| `sensitive_special_category_signals` | Sensitive/special/high-risk only where visibly supported. |
| `children_minors_signal` | Child/minor/student/youth status through Anti-Unknown. |

### Ledger

`M10.S7.C4` Write Module V ledger rows: `party_role_derivation`, `object_asset_category_derivation`, `generated_output_derived_data_derivation`, `sensitive_high_risk_context_derivation`, and `anti_unknown_protocol_check`.

### Forbidden

`M10.S7.C5` Do not infer data categories or sensitive/minor status from product category, market, sector, or model memory.

---

## M10.S8 — PHASE B: Execution Step 3: Activity Data Flow and Lifecycle Application

### Consumes

`M10.S8.C1` Consume M8 `activities[]` using patched paths in `M10.S2B`.

`M10.S8.C2` Consume M6-approved product/docs/API/data-control evidence relevant to activity data touchpoints.

### Applies

`M10.S8.C3` Apply `DAP.FLOW.*`, `DAP.OBJ.*`, `DAP.AUTH.*`, `DAP.RET.*`, `DAP.LOC.*`, `DAP.VEND.*`, and relevant `DAP.DOM.*` rows.

### Writes

| Field | Required handling |
|---|---|
| `collection_sources_and_activity_data_flows` | Link activity to collection source, entry point, input, processing touchpoint, output, recipient/destination, human access, and object touched. |
| `processing_operations_lifecycle` | Map visible lifecycle steps only. |
| `purpose_use_signals` | Capture visible use/purpose statements. |

### Ledger

`M10.S8.C4` Write Module V ledger rows: `activity_level_flow_derivation`, `collection_source_flow_derivation`, `processing_lifecycle_derivation`, and `purpose_authorization_derivation`.

### Forbidden

`M10.S8.C5` Do not infer personal data processing merely from “AI”, “automation”, “API”, or feature name.

---

## M10.S9 — PHASE B: Execution Step 4: Notice, Authorization, Rights, Governance, and Contractual Readiness

### Consumes

`M10.S9.C1` Consume notice/control/governance extraction parents.

`M10.S9.C2` Consume privacy, DPA, customer terms, legal/governance, docs/API, and trust evidence only where M6-approved/admitted.

### Applies

`M10.S9.C3` Apply `DAP.AUTH.*`, `DAP.CTRL.*`, `DAP.PARTY.006`, `DAP.RET.003`, `DAP.RET.004`, `DAP.READY.*`, `DAP.REQ.*`, and relevant role/vendor/location rows.

### Writes

| Field | Required handling |
|---|---|
| `privacy_notice_visibility` | Public notice route and wording strength/absence/access status. |
| `lawful_basis_consent_authorization_readiness` | Candidate authorization/consent/instruction/legal-basis wording as readiness only. |
| `consent_withdrawal_controls` | Consent, scope, withdrawal, opt-out, user/customer control. |
| `rights_request_routes` | Access, correction, deletion, portability/export, objection/restriction, dispute/grievance routes. |
| `privacy_governance_contact_accountability_signals` | Privacy contact, DPO/grievance/contact, accountability, incident contact. |
| `contractual_dpa_customer_terms_readiness` | DPA/customer terms/customer instruction/subprocessor/transfer/audit/help route visibility. |

### Ledger

`M10.S9.C4` Write Module V ledger rows: `control_chain_derivation`, `rights_route_derivation`, `privacy_governance_contact_derivation`, `contractual_dpa_customer_terms_derivation`, and `anti_unknown_protocol_check`.

### Forbidden

`M10.S9.C5` Do not decide lawful basis sufficiency, consent validity, DPA enforceability, customer-term sufficiency, or legal applicability.

---

## M10.S10 — PHASE B: Execution Step 5: Vendors, Sharing, Transfer, Retention, Security, and Incident Readiness

### Consumes

`M10.S10.C1` Consume vendor/subprocessor, transfer/location, retention/deletion, security/access, and incident extraction parents.

### Applies

`M10.S10.C2` Apply `DAP.VEND.*`, `DAP.ROLE.*`, `DAP.LOC.*`, `DAP.RET.*`, `DAP.CTRL.*`, `DAP.AUTH.*`, `DAP.SEC.*`, `DAP.READY.*`, and `DAP.REQ.*` rows.

### Writes

| Field | Required handling |
|---|---|
| `vendor_subprocessor_partner_inventory` | Visible external parties/functions/roles/inventory chain. |
| `processor_subprocessor_governance_controls` | DPA/instruction/subprocessor/change notice/objection/audit/help/security terms. |
| `third_party_disclosure_sharing_controls` | Sharing/sale/no-sale/no-sharing/affiliates/ads/integrations/independent third-party controls. |
| `cross_border_transfer_location_custody` | Processing/storage location, transfer direction, residency/localization/safeguard statements. |
| `retention_deletion_return_export_controls` | Retention, deletion, backup/log retention, post-termination, return/export. |
| `security_access_controls` | Security, access, audit, logging, human access. |
| `breach_incident_readiness` | Incident/breach route or absence/weakness. |

### Ledger

`M10.S10.C3` Write Module V ledger rows: `vendor_partner_inventory_derivation`, `processor_subprocessor_governance_derivation`, `third_party_disclosure_sharing_derivation`, `transfer_location_custody_derivation`, `retention_return_portability_derivation`, `security_access_governance_derivation`, and `breach_incident_readiness_derivation`.

### Forbidden

`M10.S10.C4` Do not decide controller/processor legal role, transfer legality, adequacy, or security adequacy.

---

## M10.S11 — PHASE B: Execution Step 6: AI-Specific Data Processing, Memory, Logging, Tracking, and Decisioning

### Consumes

`M10.S11.C1` Consume AI/model-provider/training, embeddings/memory/logging, tracking/marketing, and automated decisioning extraction parents.

`M10.S11.C2` Consume M8 archetype and surface values only as routing inputs.

### Applies

`M10.S11.C3` Apply `DAP.DOM.*`, `DAP.FLOW.*`, `DAP.OBJ.*`, `DAP.AUTH.*`, `DAP.CTRL.*`, `DAP.VEND.*`, `DAP.LOC.*`, `DAP.RET.*`, `DAP.SEC.*`, `DAP.SENS.*`, `DAP.READY.*`, and `DAP.REQ.*` rows.

### Writes

| Field | Required handling |
|---|---|
| `cookies_tracking_marketing_controls` | Cookies, tracking, analytics, ads, marketing controls. |
| `ai_model_provider_processing_chain` | Model provider/vendor, hosted model, API/model processing destination, custody/location. |
| `ai_training_finetuning_model_improvement_controls` | Training, no-training, fine-tuning, model improvement, customer-content use, opt-out/use limits. |
| `embeddings_vector_memory_controls` | Embeddings, vector stores, memory, semantic cache, retention/deletion/security controls. |
| `prompt_output_logging_telemetry_controls` | Prompt/output logs, telemetry, debugging, abuse monitoring, audit logging, retention/deletion. |
| `automated_decision_profiling_human_review_signal` | Scoring, ranking, profiling, eligibility, consequential recommendation, automated decision, human review. |

### Ledger

`M10.S11.C4` Write Module V ledger rows: `cookies_tracking_marketing_derivation`, `ai_model_provider_processing_chain_derivation`, `ai_training_model_use_derivation`, `embeddings_vector_memory_derivation`, `prompt_output_logging_telemetry_derivation`, and `automated_decision_profiling_derivation`.

### Forbidden

`M10.S11.C5` Do not infer model training, embeddings, memory, prompt logging, or telemetry from AI product existence alone.

`M10.S11.C6` Do not infer automated decisioning or human review without visible evidence.

---

## M10.S12 — PHASE B: Execution Step 7: Accountability and Law / Regulatory Readiness Matrix Assembly

### Consumes

`M10.S12.C1` Consume all populated M10 fields, Anti-Unknown outcomes, missing-proof candidates, and readiness-relevant extraction parents.

### Applies

`M10.S12.C2` Apply `DAP.READY.001` through `DAP.READY.012`, plus related `DAP.AUTH.*`, `DAP.CTRL.*`, `DAP.VEND.*`, `DAP.LOC.*`, `DAP.RET.*`, `DAP.SEC.*`, `DAP.SENS.*`, `DAP.DOM.*`, and `DAP.REQ.*` rows.

### Writes

| Field | Required handling |
|---|---|
| `privacy_accountability_documentation_signals` | DPIA/PIA, ROPA/records, privacy-by-design, AI impact assessment, audit/certification/trust artifacts, governance documentation, or absence/access limits. |
| `law_regulatory_readiness_matrix` | Compact readiness rows using locked nested schema. |

### M10.T3 — Law / Regulatory Readiness Matrix Row Schema

| Nested field | Required rule |
|---|---|
| `readiness_area` | Review area being checked. |
| `jurisdiction_or_framework` | GDPR, DPDP, CCPA/CPRA, COPPA, EU AI Act, sectoral privacy/security, or general privacy readiness as review label only. |
| `readiness_question` | Must be a question for reviewer/local counsel, not a conclusion. |
| `triggering_profile_signals` | M10/M8 signals that made the row relevant. |
| `public_evidence_status` | What the public footprint shows or fails to show. |
| `visible_supporting_controls` | Visible controls, notices, routes, commitments, safeguards, opt-outs, DPA terms. |
| `missing_or_weak_controls` | Missing, weak, access-failed, vague, conflicting, or not-searched controls. |
| `anti_unknown_status` | Must use the locked Anti-Unknown status vocabulary. |
| `missing_proof_request_refs` | Must point to missing-proof requests where a gap exists. |
| `source_refs` | Must resolve to M6-approved evidence, documented absence/access records, or authorized upstream object paths. |
| `counsel_review_note` | What local counsel/operator must verify. |
| `downstream_use_limit` | Must state readiness only; no legal/compliance/liability/registry conclusion. |

### M10.T4 — Required Readiness Areas

| Readiness area | Required DAP authority |
|---|---|
| `privacy_notice_readiness` | `DAP.READY.004`, `DAP.CTRL.001`, `DAP.CTRL.002`, `DAP.AUTH.*` |
| `role_relationship_readiness` | `DAP.READY.003`, `DAP.ROLE.*`, `DAP.AUTH.004`, `DAP.AUTH.008` |
| `lawful_basis_authorization_readiness` | `DAP.READY.004`, `DAP.AUTH.*`, `DAP.CTRL.*` |
| `consent_withdrawal_readiness` | `DAP.CTRL.003`–`DAP.CTRL.006`, `DAP.READY.004` |
| `rights_grievance_dispute_readiness` | `DAP.READY.005`, `DAP.PARTY.006`, `DAP.RET.003`, `DAP.RET.004`, `DAP.CTRL.006` |
| `children_minors_readiness` | `DAP.SENS.001`, `DAP.PARTY.*`, `DAP.REQ.*` |
| `sensitive_special_category_readiness` | `DAP.SENS.002`–`DAP.SENS.007`, `DAP.OBJ.003`, `DAP.DOM.*` |
| `vendor_subprocessor_readiness` | `DAP.READY.006`, `DAP.VEND.*`, `DAP.ROLE.*` |
| `cross_border_transfer_readiness` | `DAP.READY.008`, `DAP.LOC.*`, `DAP.VEND.*` |
| `retention_deletion_export_readiness` | `DAP.RET.*`, `DAP.READY.005`, `DAP.REQ.*` |
| `security_access_readiness` | `DAP.READY.007`, `DAP.SEC.*` |
| `breach_incident_readiness` | `DAP.SEC.005`, `DAP.READY.007` |
| `cookies_tracking_marketing_readiness` | `DAP.CTRL.*`, `DAP.AUTH.*`, `DAP.DOM.*` |
| `ai_training_model_use_readiness` | `DAP.DOM.*`, `DAP.AUTH.*`, `DAP.CTRL.*`, `DAP.REQ.*` |
| `automated_decision_human_review_readiness` | `DAP.FLOW.*`, `DAP.DOM.*`, `DAP.SENS.*`, `DAP.READY.*`, M8 archetype/surface signals |
| `accountability_documentation_readiness` | `DAP.READY.*`, `DAP.SEC.*`, `DAP.CTRL.*`, `DAP.REQ.*` |

### Ledger

`M10.S12.C3` Write Module V ledger rows: `law_regulatory_readiness_derivation`, `privacy_accountability_documentation_derivation`, `readiness_matrix_row_derivation`, and `anti_unknown_protocol_check`.

### Forbidden

`M10.S12.C4` Do not state that GDPR, DPDP, CCPA, COPPA, EU AI Act, or any law applies.

`M10.S12.C5` Do not state compliance, non-compliance, violation, adequacy, lawfulness, liability, or legal risk.

---

## M10.S13 — PHASE B: Execution Step 8: Missing Proof and Diligence Requests

### Consumes

`M10.S13.C1` Consume all M10 fields, Anti-Unknown statuses, readiness rows, and extraction limitations.

### Applies

`M10.S13.C2` Apply `DAP.REQ.*` rows.

### Writes

`M10.S13.C3` Write `missing_proof_and_diligence_requests` only.

Each request must include these human-readable fields:

| Request field | Required rule |
|---|---|
| Missing proof item | What evidence/control is missing or weak. |
| Affected flow/readiness area | Which M10 field/readiness row is affected. |
| Why it matters | Public-footprint diligence reason, not legal conclusion. |
| Requested evidence | Document, route, policy, DPA, subprocessor list, retention schedule, AI-use policy, logging policy, etc. |
| Target owner where visible | Target/team/role only if public evidence supports it. |
| Priority | High / medium / low based on downstream effect. |
| Downstream effect | How the gap affects M11 or counsel review. |

### Ledger

`M10.S13.C4` Write Module V ledger rows: `missing_proof_request_derivation`, `diligence_request_route_derivation`, and `anti_unknown_protocol_check`.

### Forbidden

`M10.S13.C5` Do not leave unresolved material states without request route unless `NOT_APPLICABLE`.

---

## M10.S14 — PHASE B: Execution Step 9: Limitations and Evidence Custody

### Consumes

`M10.S14.C1` Consume upstream limitations, local extraction limits, Anti-Unknown outcomes, and field application results.

### Applies

`M10.S14.C2` Apply `DAP.LIM.*` and evidence-basis obligations attached to selected DAP rows.

### Writes

`M10.S14.C3` Write `limitations` only inside the material profile.

`M10.S14.C4` Write evidence/custody details only to Module V ledger and `target_data_provenance_profile_forensics`.

### Ledger

`M10.S14.C5` Write Module V ledger rows: `data_evidence_mapping`, `data_limitation_carry_forward`, `data_quality_check`, and `data_lock_gate_check`.

### Forbidden

`M10.S14.C6` Do not cite unsupported source refs.

`M10.S14.C7` Do not erase upstream limitations.

`M10.S14.C8` Do not inflate quality because the output is complete-looking.

---

## M10.S15 — PHASE C: Data Provenance Forensics Derivation

`M10.S15.C1` `target_data_provenance_profile_forensics` is a separate saved proof artifact. It is not part of `target_data_provenance_profile`.

`M10.S15.C2` Forensics must be built only after `target_data_provenance_profile` has passed Phase B1 and has been saved as a backend artifact. Phase C is forbidden until the saved material artifact exists.

### M10.T5 — Forensics Families

| Forensic family | Purpose |
|---|---|
| `data_control_source_coverage_ledger` | Prove which M6-approved data/control/legal/product/docs/API routes/materials were reviewed. |
| `data_control_extraction_capsule_summary` | Summarize extracted evidence by extraction parent. |
| `selected_dap_field_derivation_ledger` | One row per selected DAP field outcome. |
| `anti_unknown_resolution_ledger` | Status assignment for weak/missing/unclear/conflicting/access-failed signals. |
| `readiness_matrix_derivation_ledger` | Proof for law/regulatory readiness rows. |
| `missing_proof_request_ledger` | Missing-proof linkage and downstream effect. |
| `cross_route_use_ledger` | Any M6-approved cross-route evidence used. |
| `validation_quality_control_result` | Final validator outcome. |
| `runtime_trace_m10_only` | Agent/module-only trace, no private reasoning. |
| `forensic_boundary` | Confirms no legal conclusion and no registry evaluation. |

`M10.S15.C3` Forensics must not contain chain-of-thought, hidden scratchpad, secrets, API keys, legal conclusions, compliance conclusions, registry findings, or exposure findings.

### M10.S15A — Forensic Row-Count and Coverage Gates

Forensic ledgers must be row-complete, not summary-only. Minimum coverage gates:

- `data_control_source_coverage_ledger[]` must contain one row per reviewed M10-approved data/control/legal/product/docs/API route or material source, plus explicit limitation rows for absent, gated, broken, access-failed, not-searched, or out-of-scope source families.
- `selected_dap_field_derivation_ledger[]` must contain at least one row for each of the 34 material fields in `M10.T2A`.
- `anti_unknown_resolution_ledger[]` must contain one row for every material field or readiness row using an Anti-Unknown status other than a fully visible control.
- `readiness_matrix_derivation_ledger[]` must contain one row for every `law_regulatory_readiness_matrix[]` row.
- `missing_proof_request_ledger[]` must cover every unresolved, weak, access-failed, not-visible, not-searched, visible-processing-no-control, or conflicting signal unless the signal is `NOT_APPLICABLE`.
- `cross_route_use_ledger[]` must contain one row for every cross-route or non-primary source used for a M10 field.
- `validation_quality_control_result{}` must report 34-field count, forensic row counts, Anti-Unknown coverage, missing-proof coverage, forbidden-alias checks, source URL resolution checks, legal-firewall checks, registry-firewall checks, and unresolved limitations.

Any forensic branch that merely summarizes findings without row-level proof is inadequate and must be repaired in Phase D.

---

## M10.S16 — Working Ledger

`M10.S16.C1` Module X ledger is governed by Module V.

### Required Module X ledger row types

| Ledger row type | Purpose |
|---|---|
| `fd_row_application_workpad` | One final row for every selected DAP material-selector row. |
| `fd_row_reinvestigation` | Scoped reinvestigation within approved evidence only. |
| `fd_row_fallback_or_exclusion` | Controlled fallback/exclusion/limitation outcome. |
| `data_input_custody_check` | Upstream artifact custody. |
| `data_source_universe_initialization` | M10-approved source universe. |
| `data_source_gate_review` | Source coverage and limitation status. |
| `data_control_extraction_capsule` | Extraction parent completion. |
| `anti_unknown_protocol_check` | Controlled status resolution. |
| `party_role_derivation` | People/role rows. |
| `object_asset_category_derivation` | Data/object rows. |
| `generated_output_derived_data_derivation` | Output/derived data rows. |
| `activity_level_flow_derivation` | M8 activity flow rows. |
| `collection_source_flow_derivation` | Source/input/entry point rows. |
| `processing_lifecycle_derivation` | Lifecycle rows. |
| `purpose_authorization_derivation` | Purpose/authorization rows. |
| `control_chain_derivation` | Notice/consent/control rows. |
| `rights_route_derivation` | Rights/grievance rows. |
| `privacy_governance_contact_derivation` | Contact/accountability rows. |
| `contractual_dpa_customer_terms_derivation` | DPA/customer terms rows. |
| `vendor_partner_inventory_derivation` | Vendor/subprocessor rows. |
| `processor_subprocessor_governance_derivation` | Processor governance rows. |
| `third_party_disclosure_sharing_derivation` | Sharing/disclosure rows. |
| `transfer_location_custody_derivation` | Transfer/location rows. |
| `retention_return_portability_derivation` | Retention/deletion/export rows. |
| `security_access_governance_derivation` | Security/access rows. |
| `breach_incident_readiness_derivation` | Incident rows. |
| `cookies_tracking_marketing_derivation` | Cookie/tracking rows. |
| `ai_model_provider_processing_chain_derivation` | Model-provider chain rows. |
| `ai_training_model_use_derivation` | Training/fine-tuning/model improvement rows. |
| `embeddings_vector_memory_derivation` | Embedding/vector/memory rows. |
| `prompt_output_logging_telemetry_derivation` | Prompt/output/logging/telemetry rows. |
| `automated_decision_profiling_derivation` | Decision/profiling/human review rows. |
| `law_regulatory_readiness_derivation` | Readiness matrix rows. |
| `privacy_accountability_documentation_derivation` | Accountability/documentation rows. |
| `missing_proof_request_derivation` | Missing proof rows. |
| `diligence_request_route_derivation` | Request routing rows. |
| `data_evidence_mapping` | Evidence/custody basis. |
| `data_limitation_carry_forward` | Upstream/local limitations. |
| `data_quality_check` | Quality and completeness. |
| `target_data_provenance_profile_forensics_build` | Forensic artifact build. |
| `data_provenance_lock_check` | Final lock gate. |

`M10.S16.C2` No separate scratchpad object is authorized inside the material profile.

`M10.S16.C3` Module V `data_provenance_ledger` is the sole Module X workpad.

`M10.S16.C4` Module V ledger rows must persist through final assembly.

---

## M10.S17 — PHASE B1 / PHASE D: Validator and Save Gates

### M10.S17A — Defect Classification

| Defect | Classification |
|---|---|
| Missing required upstream artifact without controlled route | `CRITICAL_BLOCKER` |
| Unapproved evidence use or new source collection | `CRITICAL_BLOCKER` |
| Invented data/control/training/vendor/retention/security signal | `CRITICAL_BLOCKER` |
| Legal/compliance/applicability/adequacy/liability conclusion leakage | `CRITICAL_BLOCKER` |
| Registry row/threat/exposure leakage | `CRITICAL_BLOCKER` |
| Old multi-map branch or alias output | `CRITICAL_BLOCKER` |
| Missing Data-Control Source Extraction Capsule | `REPAIRABLE_FAILURE` |
| Missing Anti-Unknown status | `REPAIRABLE_FAILURE` |
| Missing missing-proof request for unresolved material signal | `REPAIRABLE_FAILURE` |
| Missing DAP workpad outcome | `REPAIRABLE_FAILURE` |
| Sparse but truthful evidence with request routes | `PASS_WITH_LIMITATION` |
| Non-material display issue | `FORENSIC_LEDGER_ONLY` if truth/custody unaffected |

### M10.S17B — Lock Conditions

Lock only if all conditions pass:

| Gate | Required pass condition |
|---|---|
| Runtime gate | Agent 4 / M10 only. |
| Input gate | Required upstream artifacts exist or controlled limitation/failure is recorded. |
| Source gate | Only M6-approved/admitted evidence and locked upstream paths used. |
| Extraction gate | Data-Control Source Extraction Capsule completed before field application. |
| M8 path gate | Patched M8 activity fields used; retired paths rejected. |
| Shape gate | Exactly 34 top-level fields in material profile. |
| Material save gate | Phase B1 validates and saves `target_data_provenance_profile` before any forensic derivation begins. |
| Forensics gate | Separate `target_data_provenance_profile_forensics` emitted only after saved material profile exists. |
| Forensic row-count gate | M10.S15A row-count and coverage gates pass or are repaired/controlled. |
| DAP gate | Every selected DAP row has workpad outcome. |
| Anti-Unknown gate | Every material signal has controlled status. |
| Missing-proof gate | Every unresolved signal links to request unless not applicable. |
| Readiness gate | Readiness matrix uses locked nested row schema. |
| Legal firewall | No legal applicability/compliance/violation/liability/security adequacy/transfer legality/lawful-basis sufficiency conclusion. |
| Registry firewall | No threat IDs, registry rows, exposure findings, risk levels, or control statuses. |
| Output boundary | No aliases, old branches, metadata, trace, debug, report, or final handoff inside material profile. |

`M10.S17B.C1` If all gates pass, set phase-local lock state to `LOCKED`.

`M10.S17B.C2` If usable with limitations, set phase-local lock state to `LOCKED_WITH_LIMITATIONS`.

`M10.S17B.C3` If unsafe or unusable, set phase-local lock state to `CONTROLLED_FAILURE` or `REPAIR_REQUIRED` as appropriate.

### M10.S17C — PHASE B1 Material Repair / Targeted Reinvestigation Behavior

Repair in M10 means targeted field-specific, signal-specific, readiness-row-specific, missing-proof-specific, or source-custody reinvestigation first; not immediate hard blocking.

If a material M10 field, Anti-Unknown status, DAP application row, readiness matrix row, missing-proof request, limitation, or source-coverage item is inadequate, unsupported, weak, thin, vague, conflicting, or wrong:

1. do not proceed to Phase C;
2. run targeted item-specific reinvestigation inside the existing Agent 1 / Agent 3 / Agent 4 approved source universe, including the primary M10 lossless D-buckets, M6-approved data/privacy/security/control/legal/product/docs/API routes, locked upstream artifacts, M9 navigation refs, and documented absence/access records;
3. re-derive the affected field or readiness row using the governing selected `DAP.*` row conditions, the Data-Control Source Extraction Capsule, and the Anti-Unknown Protocol;
4. if the field or signal can be supported, correct the material value or readiness row;
5. if the field or signal remains unsupported after reinvestigation, emit the correct controlled Anti-Unknown status, missing-proof request, and limitation/warning in `target_data_provenance_profile`;
6. record the reinvestigation, controlled status, missing-proof route, and limitation in Module V ledger and `target_data_provenance_profile_forensics`;
7. re-run Phase B1 after the repair.

Do not hard-block the entire M10 phase for ordinary public-footprint thinness after targeted reinvestigation. Save the material profile with controlled limitations where downstream M11 use remains truthful and safe.

Only route back to Agent 1 / M6 source repair when the source universe itself, the primary M10 lossless bucket set, or required approved data/privacy/security/control route custody is missing, corrupted, inaccessible, or contradictory in a way M10 cannot repair from loaded artifacts.

Allowed Phase B1 outcomes:

- `PASS`
- `PASS_WITH_WARNING`
- `PASS_WITH_LIMITATION`
- `CONTROLLED_FAILURE`
- `REINVESTIGATION_COMPLETED_WITH_LIMITATION`
- `SOURCE_REPAIR_REQUIRED` only for upstream source-universe defects

Any earlier `REPAIR_REQUIRED` or `REINVESTIGATE_REQUIRED` wording in this module is interpreted as an internal stop-and-repair workflow state, not a handoff-eligible final phase outcome. It does not authorize advancement to M11.

### M10.S17D — PHASE D Forensic Repair / Targeted Reinvestigation Behavior

If Phase D finds an inadequate forensic row, missing forensic family, summary-only forensic branch, missing 34-field DAP coverage, missing Anti-Unknown ledger coverage, missing readiness-matrix proof, missing missing-proof linkage, source-ID/source-URL mismatch, legal-firewall leak, registry-firewall leak, or material/forensic contradiction:

1. do not proceed to M11;
2. repair the specific forensic row, forensic family, source-custody reference, DAP linkage, Anti-Unknown resolution row, readiness-matrix derivation row, missing-proof request ledger row, or validation/QC row;
3. if the defect is forensic-only, do not re-emit or mutate `target_data_provenance_profile`;
4. if the defect exposes an underlying material-field, readiness-row, missing-proof, limitation, or Anti-Unknown error, return to targeted reinvestigation for that specific item;
5. update the material profile only if reinvestigation changes the supported value, status, missing-proof request, readiness row, or limitation;
6. rerun Phase B1 if the material profile changes;
7. rebuild the affected forensic rows from the saved material artifact and Module V ledger;
8. rerun Phase D after forensic repair.

After reinvestigation, if the issue remains unresolved because public evidence is insufficient, mark the issue as a controlled warning/limitation, preserve the correct Anti-Unknown status, ledger the missing proof, and save the forensic output only when the limitation is controlled and row-level proof is complete.

Only route back to Agent 1 / M6 source repair when the source universe itself, the primary M10 lossless bucket set, or required approved data/privacy/security/control route custody is missing, corrupted, inaccessible, or contradictory in a way M10 cannot repair from loaded artifacts.

Allowed Phase D outcomes:

- `PASS`
- `PASS_WITH_WARNING`
- `PASS_WITH_LIMITATION`
- `CONTROLLED_FAILURE`
- `REINVESTIGATION_COMPLETED_WITH_LIMITATION`
- `SOURCE_REPAIR_REQUIRED` only for upstream source-universe defects

Any earlier `REPAIR_REQUIRED` or `REINVESTIGATE_REQUIRED` wording in this module is interpreted as an internal stop-and-repair workflow state, not a handoff-eligible final phase outcome. It does not authorize advancement to M11.

---

## M10.S18 — Split Backend Output Contracts

M10 has two output artifacts, but they are saved in separate backend phases. M10 must not return a combined two-artifact object in production backend execution.

### M10.S18A — PHASE B1 Material Output Contract

After Phase B material derivation and Phase B1 validation pass, return exactly this top-level JSON shape and stop:

```json
{
  "target_data_provenance_profile": {}
}
```

The `target_data_provenance_profile` object is the clean material Privacy Readiness / Data Provenance Profile. It must contain exactly these 34 top-level fields and no others:

| Order | Category | Required field |
|---:|---|---|
| 1 | Scope and coverage | `assessment_scope` |
| 2 | Scope and coverage | `source_coverage` |
| 3 | People / roles / objects | `individuals_and_relationships` |
| 4 | People / roles / objects | `role_relationship_readiness` |
| 5 | People / roles / objects | `data_categories` |
| 6 | People / roles / objects | `generated_output_and_derived_data_treatment` |
| 7 | People / roles / objects | `sensitive_special_category_signals` |
| 8 | People / roles / objects | `children_minors_signal` |
| 9 | Lifecycle | `collection_sources_and_activity_data_flows` |
| 10 | Lifecycle | `processing_operations_lifecycle` |
| 11 | Lifecycle | `purpose_use_signals` |
| 12 | Notice / rights / governance | `privacy_notice_visibility` |
| 13 | Notice / rights / governance | `lawful_basis_consent_authorization_readiness` |
| 14 | Notice / rights / governance | `consent_withdrawal_controls` |
| 15 | Notice / rights / governance | `rights_request_routes` |
| 16 | Notice / rights / governance | `privacy_governance_contact_accountability_signals` |
| 17 | Notice / rights / governance | `contractual_dpa_customer_terms_readiness` |
| 18 | Vendors / transfers / retention / security | `vendor_subprocessor_partner_inventory` |
| 19 | Vendors / transfers / retention / security | `processor_subprocessor_governance_controls` |
| 20 | Vendors / transfers / retention / security | `third_party_disclosure_sharing_controls` |
| 21 | Vendors / transfers / retention / security | `cross_border_transfer_location_custody` |
| 22 | Vendors / transfers / retention / security | `retention_deletion_return_export_controls` |
| 23 | Vendors / transfers / retention / security | `security_access_controls` |
| 24 | Vendors / transfers / retention / security | `breach_incident_readiness` |
| 25 | AI / tracking / memory / logging / decisioning | `cookies_tracking_marketing_controls` |
| 26 | AI / tracking / memory / logging / decisioning | `ai_model_provider_processing_chain` |
| 27 | AI / tracking / memory / logging / decisioning | `ai_training_finetuning_model_improvement_controls` |
| 28 | AI / tracking / memory / logging / decisioning | `embeddings_vector_memory_controls` |
| 29 | AI / tracking / memory / logging / decisioning | `prompt_output_logging_telemetry_controls` |
| 30 | AI / tracking / memory / logging / decisioning | `automated_decision_profiling_human_review_signal` |
| 31 | Accountability / readiness | `privacy_accountability_documentation_signals` |
| 32 | Accountability / readiness | `law_regulatory_readiness_matrix` |
| 33 | Missing proof / limitations | `missing_proof_and_diligence_requests` |
| 34 | Missing proof / limitations | `limitations` |

`M10.S18A.C1` `law_regulatory_readiness_matrix` must use the nested fields in `M10.T3`.

`M10.S18A.C2` The following are forbidden inside `target_data_provenance_profile`: `profile_meta`, `lock_status`, `trace`, `debug`, `source_refs` as standalone top-level object, `data_provenance_profile`, `target_data_provenance_profile_forensics`, old multi-map branches, legal conclusions, registry conclusions, report prose, final handoff, and compatibility wrappers.

`M10.S18A.C3` Scalar fields must be compact readiness statements and must include or be governed by an Anti-Unknown status. Array fields may contain compact strings or compact objects, but every material entry must preserve visibility status, basis summary, and missing-proof route where applicable.

`M10.S18A.C4` Main profile may include controlled visibility status in field values. Detailed evidence, DAP field IDs, source refs, confidence, extraction capsule, and validation proof belong in Module V ledger and `target_data_provenance_profile_forensics`, not as top-level material branches.

Do not emit `target_data_provenance_profile_forensics`, `target_exposure_profile`, `operator_challenge_gate`, `final_output_handoff`, renderer payload, report prose, terminal receipt, phase wrapper, or compatibility wrapper in the Phase B1 material output.

The backend runner must save this artifact before Phase C begins.

### M10.S18B — PHASE D Forensic Output Contract

After the saved `target_data_provenance_profile` artifact exists, Phase C forensic derivation and Phase D validation may run. After Phase D passes, return exactly this top-level JSON shape:

```json
{
  "target_data_provenance_profile_forensics": {
    "data_control_source_coverage_ledger": [],
    "data_control_extraction_capsule_summary": [],
    "selected_dap_field_derivation_ledger": [],
    "anti_unknown_resolution_ledger": [],
    "readiness_matrix_derivation_ledger": [],
    "missing_proof_request_ledger": [],
    "cross_route_use_ledger": [],
    "validation_quality_control_result": {},
    "runtime_trace_m10_only": {},
    "forensic_boundary": {}
  }
}
```

The `target_data_provenance_profile_forensics` object must contain the forensic families in `M10.T5` and the row-count/coverage gates in `M10.S15A`.

Do not re-emit `target_data_provenance_profile`, `target_exposure_profile`, `operator_challenge_gate`, `final_output_handoff`, renderer payload, report prose, terminal receipt, phase wrapper, or compatibility wrapper in the Phase D forensic output.

The backend runner must save this artifact before M11 begins.

### M10.S18C — Combined Output Prohibition

The following production backend output shape is forbidden:

```json
{
  "target_data_provenance_profile": {},
  "target_data_provenance_profile_forensics": {}
}
```

That shape incorrectly mixes the Phase B1 material artifact and the Phase D forensic artifact into one response. It may be shown only as documentation that M10 ultimately owns two artifacts, not as an executable backend response.

## M10.S19 — Backend Save / Handoff Rule

| Order | Action |
|---:|---|
| 1 | Complete Data-Control Source Extraction Capsule internally. |
| 2 | Build `target_data_provenance_profile` through Phase B. |
| 3 | Validate `target_data_provenance_profile` through Phase B1 material validator. |
| 4 | Emit and save only `target_data_provenance_profile` as the Phase B1 material artifact. |
| 5 | Confirm saved `target_data_provenance_profile` exists in the backend / Drive artifact vault. |
| 6 | Build `target_data_provenance_profile_forensics` through Phase C from the saved material artifact and the Module V workpad. |
| 7 | Validate `target_data_provenance_profile_forensics` through Phase D forensic validator. |
| 8 | Emit and save only `target_data_provenance_profile_forensics` as the Phase D forensic artifact. |
| 9 | Lock M10 only after both artifacts are saved in order. |
| 10 | Backend runner may advance to M11 only after M10 lock. |

`M10.S19.C1` Backend execution must not emit same-chat next-agent commands, terminal receipts, checkpoint prose, markdown, or report prose.

`M10.S19.C2` M11 may begin only after both M10 artifacts are saved and M10 lock state is `LOCKED` or `LOCKED_WITH_LIMITATIONS`.

`M10.S19.C3` Manual same-chat mode, if deliberately invoked by the operator, may use a compact receipt controlled by terminal rules. That manual receipt is not the production backend output contract.
