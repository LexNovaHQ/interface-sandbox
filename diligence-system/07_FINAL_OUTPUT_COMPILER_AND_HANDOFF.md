# 07_FINAL_OUTPUT_COMPILER_AND_HANDOFF.md

## PHASE CALL CARD

```text
phase_id: P7_FINAL_OUTPUT_COMPILER_AND_HANDOFF
phase_name: Final Output Compiler and Handoff
phase_type: compiler_handoff
primary_output: final_output_handoff
required_top_level_output_keys:
  - final_output_forensic_ledger
  - final_compiler_trace
  - final_output_handoff
```

Phase 07 compiles the locked upstream profiles into one final handoff object with three separated branches:

```text
1. integrated_json_report
2. screen_report_payload
3. vault_assembler_handoff
```

Phase 07 is a compiler, not an evaluator.

It must not perform new diligence, reopen source discovery, reopen feature analysis, reopen legal cartography, reopen data provenance, reopen registry evaluation, rewrite upstream profiles, generate raw HTML, or produce legal advice.

---

## GOVERNING RUNTIME REFERENCES

Phase 07 must apply the governing runtime rules from:

```text
00_RUNTIME_SPINE.md
01_SOURCE_DISCOVERY_EVIDENCE_BOX.md
02_TARGET_PROFILE.md
03_TARGET_FEATURE_PROFILE.md
04_LEGAL_CARTOGRAPHY_INDEX.md
05_TARGET_DATA_PROVENANCE_PROFILE.md
06_EXPOSURE_PROFILE_REGISTRY_LEDGER.md
REGISTRY_KEY_v3_0.md
AI_THREAT_REGISTRY
```

Phase 07 must preserve the legal/advice firewall:

```text
Allowed: visible signal, visible control, partial or unclear signal, not visible in reviewed public materials, source route could not be accessed, needs qualified review, candidate review route, assembly consideration, public-footprint limitation.

Forbidden: legal advice, compliance verdict, liability conclusion, enforceability conclusion, confirmed violation, clause mandate, legal remediation instruction, risk score, or any equivalent final legal judgment.
```

---

## INPUT CONTRACT

Phase 07 consumes the locked outputs from Phases 01–06.

Required profile inputs:

```text
target_profile
target_feature_profile
legal_cartography_index
target_data_provenance_profile
target_exposure_profile
```

Required supporting inputs:

```text
source evidence refs
source family maps
evidence boxes and source indexes
absence records
access-failed records
prior phase limitations
prior phase forensic ledgers
Phase 06 full registry ledger
Phase 06 operator challenge result
Phase 06 terminal gate result
```

If a required core profile is missing, Phase 07 must emit `CONTROLLED_FAILURE` rather than inventing or reconstructing missing analysis.

---

## OUTPUT CONTRACT

Phase 07 must emit exactly this root object:

```json
{
  "final_output_forensic_ledger": {},
  "final_compiler_trace": {},
  "final_output_handoff": {
    "run_meta": {},
    "input_manifest": {},
    "normalization_dictionary": {},
    "integrated_json_report": {},
    "screen_report_payload": {},
    "vault_assembler_handoff": {},
    "final_quality_control": {},
    "limitations": [],
    "handoff_lock": {}
  }
}
```

### Branch order

Phase 07 must build branches in this order:

```text
1. Build integrated_json_report.
2. Build screen_report_payload from integrated_json_report + normalization_dictionary.
3. Build vault_assembler_handoff from integrated_json_report + screen_report_payload + normalization_dictionary.
4. Run final cross-branch quality control.
5. Emit final_output_handoff.
```

### Separation rule

```text
Branch 1 preserves canon.
Branch 2 normalizes for screen display.
Branch 3 translates into functional assembly intake.
No branch may mutate another branch.
No branch may create new substantive findings.
```

---

## HARD RULES

1. Phase 07 is a final compiler, not an analysis phase.
2. Do not create new facts, findings, registry rows, data processing facts, legal controls, features, or exposure statuses.
3. Do not mutate upstream profile fields.
4. Branch 1 must stay canonical and must not use normalization.
5. Branch 2 may use display labels and `EXP-001` style display identifiers.
6. Branch 3 may produce safe functional assembly intake suggestions and confirmation questions only.
7. Renderer output is downstream. Phase 07 must not emit raw HTML.
8. Vault/assembler handoff must require confirmation before reliance.
9. Do not use retired labels, noncanonical object aliases, or prior branding in the prompt output.
10. Do not use counsel-specific routing terms. Use `qualified_review` only.
11. Do not use legal verdict language.
12. Do not hide limitations, absence records, access failures, or unresolved review routes.
13. The full registry ledger remains preserved in Branch 1 and Branch 2 appendix material.
14. Main visible report sections use display exposure IDs such as `EXP-001`, not raw registry IDs as primary labels.

### Final Output Forensic Ledger

`final_output_forensic_ledger` is the visible audit ledger for Phase 07 compilation. It is not hidden reasoning and must not contain private chain-of-thought.

It records:

```json
{
  "phase_id": "P7_FINAL_OUTPUT_COMPILER_AND_HANDOFF",
  "ledger_status": "DRAFT | LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE",
  "ledger_events": [],
  "coverage_matrix": {
    "required_profiles_received": [],
    "profiles_prepared": [],
    "cross_profile_indexes_built": [],
    "normalization_events": [],
    "display_id_events": [],
    "vault_handoff_events": [],
    "quality_control_gates": [],
    "repair_events": [],
    "controlled_failure_events": []
  }
}

Allowed event types:

P7_INPUT_RECEIVED
P7_INPUT_MISSING
P7_PROFILE_PREPARED
P7_PROFILE_LINKED
P7_CROSS_PROFILE_INDEX_BUILT
P7_CANONICAL_REF_INDEX_BUILT
P7_BRANCH1_BUILT
P7_NORMALIZATION_APPLIED
P7_DISPLAY_ID_ASSIGNED
P7_BRANCH2_BUILT
P7_VAULT_GROUP_BUILT
P7_CONFIRMATION_QUESTION_CREATED
P7_BRANCH3_BUILT
P7_LIMITATION_CARRIED_FORWARD
P7_QC_GATE_PASSED
P7_QC_GATE_FAILED
P7_REPAIR_REQUIRED
P7_CONTROLLED_FAILURE
P7_LOCKED

Rules:

1. The ledger records compiler events only.
2. The ledger must not create new facts, findings, statuses, recommendations, or legal conclusions.
3. The ledger must trace every branch-build and gate result.
4. Final lock requires the ledger to be present and locked.

---

## NORMALIZATION DICTIONARY — ND7.001–ND7.016

The normalization dictionary governs Branch 2 and Branch 3. Branch 1 does not apply normalization.

### ND7.001 — Dictionary governance

Each dictionary entry should preserve:

```json
{
  "canonical_value": "",
  "screen_label": "",
  "screen_definition": "",
  "vault_label": "",
  "allowed_contexts": [],
  "forbidden_rewrite": [],
  "source_of_truth": ""
}
```

### ND7.002 — Forbidden normalization map

Forbidden output language includes:

```text
violation
non-compliant
illegal
liable
unenforceable
breach
confirmed breach
gap proven
fix required
clause must be added
safe
risk score
```

Allowed replacement concepts:

```text
visible signal
visible control
partial or unclear signal
not visible in reviewed public materials
source route could not be accessed
needs qualified review
candidate review route
assembly consideration
public-footprint limitation
```

### ND7.003 — Phase/profile label map

| Canonical | Screen label |
|---|---|
| `target_profile` | Target overview |
| `target_feature_profile` | Product and activity profile |
| `legal_cartography_index` | Legal / governance document map |
| `target_data_provenance_profile` | Data use and control profile |
| `target_exposure_profile` | Exposure signal profile |
| `registry_ledger` | Registry evaluation ledger |
| `forensic_ledger` | Technical trace |
| `evidence_box` | Reviewed source record |

### ND7.004 — Source family label map

| Canonical | Screen label |
|---|---|
| `product` | Product / feature page |
| `legal_governance` | Legal / governance document |
| `security_trust` | Security / trust material |
| `docs_developer` | Developer / API documentation |
| `commercial` | Pricing / commercial material |
| `unknown` | Unclassified source |
| `access_failed` | Source route could not be accessed |
| `not_visible_after_targeted_search` | Not visible in reviewed public materials |

### ND7.005 — Registry archetype label map

| Code | Screen label | Short explanation |
|---|---|---|
| `UNI` | Universal AI governance issue | Applies across AI products. |
| `DOE` | Action-taking AI system | Takes actions on a user’s behalf. |
| `JDG` | Decision-support or assessment system | Scores, ranks, classifies, or gates access. |
| `CMP` | Companion or relational AI system | Builds ongoing emotional or advisory relationships. |
| `CRT` | Content generation system | Generates text, image, audio, video, code, or synthetic content. |
| `RDR` | Reader / ingestion system | Reads, ingests, retrieves, or analyzes third-party data. |
| `ORC` | Workflow orchestration system | Routes work across models, tools, vendors, or subprocessors. |
| `TRN` | Voice / biometric processing system | Processes speech, voice, face, biometric, or audio signals. |
| `SHD` | Security monitoring system | Defends, monitors, or responds to security events. |
| `OPT` | Optimization / money-moving system | Optimizes high-stakes operations, pricing, trading, or money movement. |
| `MOV` | Physical-world action system | Controls or affects physical systems, robotics, vehicles, or devices. |

### ND7.006 — Registry surface label map

| Canonical | Screen label |
|---|---|
| `Consumer-Public` | Consumer-facing or publicly accessible |
| `Enterprise-Private` | Enterprise / private deployment |
| `PII` | Personal data |
| `Employment` | Employment or workforce context |
| `Sensitive/Biometric` | Sensitive or biometric data |
| `Financial` | Financial, payments, trading, or money movement |
| `Content&IP` | Content and intellectual property |
| `Safety&Physical` | Safety-sensitive or physical-world context |
| `Infrastructure` | Infrastructure or system operations |
| `Minors` | Minors / under-18 users |

### ND7.007 — Registry subcategory label map

| Code | Screen label | Plain explanation |
|---|---|---|
| `CNS` | Consent and contract formation | User agreement, consent, or acceptance mechanics. |
| `LIA` | Responsibility and liability allocation | Responsibility, warranties, reliance, agency, caps, and disclaimers. |
| `HAL` | Output accuracy and hallucination | False, fabricated, defamatory, or misleading AI outputs. |
| `INF` | IP and content rights | Copyright, training data, generated content, RAG, safe harbor, deepfakes. |
| `PRV` | Privacy and data protection | Personal data, processors, retention, transfers, breach, user rights. |
| `BIO` | Biometric and identity data | Voiceprints, diarization, recognition, biometric consent. |
| `DEC` | Automated decisioning | Decisions, scoring, ranking, bias, human review, high-risk uses. |
| `HRM` | User harm and safety-sensitive use | Minors, health, mental health, companion risks, physical/user harm. |
| `FRD` | Misrepresentation and evidence integrity | AI washing, fabricated evidence, vendor claims, misleading representations. |
| `TRD` | Trading, pricing, and market conduct | Algorithmic trading, pricing, collusion, market manipulation. |

### ND7.008 — Evaluation status label map

| Canonical status | Screen label |
|---|---|
| `SUPPORTED_EXPOSURE_SIGNAL` | Visible exposure signal |
| `SUPPORTED_CONTROL_PRESENT` | Visible control language found |
| `PARTIAL_OR_WEAK_SIGNAL` | Partial or unclear public signal |
| `CONFLICTING_SIGNALS` | Conflicting public signals |
| `INSUFFICIENT_EVIDENCE` | Insufficient public evidence |
| `NOT_VISIBLE_AFTER_TARGETED_SEARCH` | Not visible in reviewed public materials |
| `ACCESS_FAILED` | Source route could not be accessed |
| `NOT_TRIGGERED` | Registry condition not triggered |
| `NOT_APPLICABLE_CONTEXTUAL` | Not applicable on current public context |
| `REQUIRES_QUALIFIED_REVIEW` | Needs qualified review |
| `CONTROLLED_FAILURE` | Could not safely evaluate |

### ND7.009 — Trigger status label map

Use mainly in appendices.

| Canonical status | Screen label |
|---|---|
| `UNI_ALWAYS_RUN` | Universal row evaluated |
| `REGISTRY_SIGNAL_TRIGGERED` | Condition triggered by public evidence |
| `REGISTRY_SIGNAL_NOT_TRIGGERED` | Condition not triggered by reviewed evidence |
| `CONDITIONAL_TRIGGERED` | Conditional prerequisite triggered |
| `CONDITIONAL_NOT_TRIGGERED` | Conditional prerequisite not triggered |
| `TRIGGER_INSUFFICIENT_EVIDENCE` | Not enough evidence to decide trigger |
| `TRIGGER_CONFLICTING_SIGNALS` | Conflicting trigger evidence |
| `TRIGGER_REQUIRES_REVIEW` | Trigger requires qualified review |
| `ACCESS_FAILED_TRIGGER_CHECK` | Trigger check blocked by access failure |

### ND7.010 — Evidence basis label map

| Canonical | Screen label |
|---|---|
| `DIRECT_QUOTE_REF` | Direct source reference |
| `ARTIFACT_SECTION_REF` | Document section reference |
| `FEATURE_PROFILE_REF` | Product feature reference |
| `DATA_PROFILE_REF` | Data profile reference |
| `LEGAL_CARTOGRAPHY_REF` | Legal / governance map reference |
| `ABSENCE_RECORD_REF` | Documented absence record |
| `ACCESS_FAILURE_REF` | Access failure record |
| `CONFLICT_RECORD_REF` | Conflicting source record |
| `NO_EVIDENCE_REQUIRED_NOT_TRIGGERED` | No evidence required because condition was not triggered |

### ND7.011 — Route disposition label map

| Canonical | Screen label |
|---|---|
| `USED_AS_PROVIDED` | Used suggested evidence route |
| `EXPANDED_WITHIN_LEGAL_CARTOGRAPHY` | Expanded review within legal / governance map |
| `EXPANDED_WITHIN_PRIMARY_LOSSLESS_EVIDENCE` | Expanded review within admitted source text |
| `REJECTED_AS_TOO_NARROW` | Suggested route was too narrow |
| `REJECTED_AS_WRONG_ROUTE` | Suggested route was not the right path |
| `INSUFFICIENT_ROUTE_BUT_MODEL_FOUND_PATH` | Initial route was insufficient; valid path found |
| `INSUFFICIENT_ROUTE_AND_NO_PATH_FOUND` | Initial route insufficient; no valid path found |
| `ACCESS_FAILED_ROUTE` | Route blocked by access failure |

### ND7.012 — Pain tier / impact label map

Phase 07 must translate registry tier values only. It must not recalculate them.

| Tier | Screen label | Vault label |
|---|---|---|
| `T1` | Critical business-continuity exposure | Highest-priority review route |
| `T2` | Open-ended financial exposure | High-priority financial exposure route |
| `T3` | Deal / enterprise-readiness blocker | Enterprise-readiness review route |
| `T4` | Regulatory or governance friction | Governance cleanup route |
| `T5` | Monitoring / cleanup item | Monitor / confirm route |

### ND7.013 — Review route label map

Use `qualified_review` as the umbrella review route.

| Internal route | Screen / Vault label |
|---|---|
| `qualified_review` | Qualified reviewer should verify |
| `contract_interpretation` | Contract interpretation review needed |
| `privacy_review` | Privacy / data protection review needed |
| `security_review` | Security controls review needed |
| `ai_governance_review` | AI governance review needed |
| `ip_review` | IP / content rights review needed |
| `employment_review` | Employment / workforce review needed |
| `minors_safety_review` | Minors / safety-sensitive review needed |
| `vendor_flowdown_review` | Vendor / subprocessor flow-down review needed |

### ND7.014 — Vault action label map

Use safe assembly-intake language only:

```text
candidate document family
review route
confirmation needed
visible signal suggests
public materials do not confirm
preserve existing control
verify before assembly
qualified reviewer should verify
```

Do not use:

```text
fix violation
inject clause
make compliant
solve liability
```

### ND7.015 — Appendix label map

| Appendix key | Display name |
|---|---|
| `forensic_ledger_appendix` | Technical trace appendix |
| `registry_ledger_appendix` | Full registry evaluation ledger |
| `evidence_appendix` | Reviewed evidence appendix |
| `limitations_appendix` | Limitations and source constraints |
| `operator_challenge_appendix` | Challenge and validation appendix |
| `vault_handoff_appendix` | Assembly handoff appendix |

### ND7.016 — Canonical technical display label map

Canonical values remain present, but human-exposed technical values should receive display labels.

| Canonical key/value type | Display label |
|---|---|
| `registry_row_id` | Registry row ID |
| `threat_id` | Threat ID |
| `evidence_ref` | Evidence reference |
| `source_ref` | Source reference |
| `artifact_ref` | Document / artifact reference |
| `unit_ref` | Section / unit reference |
| `phase_id` | Phase ID |
| `target_profile` | Target overview profile |
| `target_feature_profile` | Product and activity profile |
| `legal_cartography_index` | Legal / governance document map |
| `target_data_provenance_profile` | Data use and control profile |
| `target_exposure_profile` | Exposure signal profile |
| `registry_ledger` | Registry evaluation ledger |
| `registry_signal_trigger_status` | Trigger status |
| `evaluation_status` | Evaluation status |
| `evidence_basis_type` | Evidence basis |
| `terminal_lock_status` | Lock status |
| `operator_challenge_status` | Challenge status |
| `deterministic_route_disposition` | Evidence route disposition |

---

## BRANCH 1 — INTEGRATED JSON REPORT

Branch 1 is the canonical machine report.

### Branch 1 doctrine

```text
Branch 1 keeps canonical language only.
No normalization.
No display labels.
No screen-report phrasing.
No Vault action language.
No HTML.
No new findings.
No upstream mutation.
```

### Branch 1 two-step job

```text
Step 1 — Final Profile Preparation
Step 2 — Integrated JSON Compilation
```

### Step 1 — Final Profile Preparation

Prepare final copies of the five profiles by adding canonical cross-links, backlinks, alignment statuses, conflict flags, missing-link flags, and ref indexes.

Prepared profiles:

```text
target_profile_final
target_feature_profile_final
legal_cartography_index_final
target_data_provenance_profile_final
target_exposure_profile_final
```

Original profile facts remain untouched. Branch 1 may add canonical cross-links, backlinks, alignment status, conflict flags, missing-link flags, and ref indexes. Branch 1 may not change field meanings, statuses, findings, or evidence.

### Cross-profile alignment statuses

```text
CROSS_LINKED
PARTIALLY_LINKED
NO_LINK_VISIBLE
CONFLICTING_PROFILE_SIGNALS
SOURCE_ACCESS_BLOCKED
INSUFFICIENT_PROFILE_CONTEXT
NOT_APPLICABLE_CONTEXTUAL
```

### Step 2 — Integrated JSON Compilation

Branch 1 output:

```json
{
  "integrated_json_report": {
    "report_meta": {},
    "profile_manifest": {},
    "prepared_final_profiles": {
      "target_profile_final": {},
      "target_feature_profile_final": {},
      "legal_cartography_index_final": {},
      "target_data_provenance_profile_final": {},
      "target_exposure_profile_final": {}
    },
    "cross_profile_indexes": {
      "target_to_feature_index": [],
      "feature_to_data_index": [],
      "feature_to_legal_index": [],
      "feature_to_exposure_index": [],
      "data_to_legal_index": [],
      "data_to_exposure_index": [],
      "legal_to_exposure_index": [],
      "source_to_profile_index": [],
      "evidence_to_profile_index": [],
      "evidence_to_exposure_index": []
    },
    "canonical_ref_indexes": {
      "profile_ref_index": {},
      "feature_ref_index": {},
      "data_ref_index": {},
      "legal_artifact_ref_index": {},
      "legal_unit_ref_index": {},
      "control_ref_index": {},
      "registry_row_ref_index": {},
      "evidence_ref_index": {},
      "source_ref_index": {},
      "absence_ref_index": {},
      "access_failed_ref_index": {}
    },
    "canonical_summary": {
      "profile_completion_summary": {},
      "source_coverage_summary": {},
      "feature_summary": {},
      "data_provenance_summary": {},
      "legal_cartography_summary": {},
      "exposure_summary": {},
      "limitation_summary": {}
    },
    "machine_lock": {
      "assembly_status": "LOCKED",
      "all_profiles_present": true,
      "canonical_values_preserved": true,
      "cross_profile_indexes_built": true,
      "no_upstream_profile_mutation": true,
      "no_normalization_applied": true,
      "no_new_findings_created": true
    }
  }
}
```

---

## BRANCH 2 — SCREEN REPORT PAYLOAD

Branch 2 is the human-readable screen report payload. It is not raw HTML.

### Branch 2 doctrine

```text
Branch 2 uses ND7 normalization.
Branch 2 consumes Branch 1 prepared profiles and cross-profile indexes.
Branch 2 uses EXP-001 / EXP-002 / EXP-003 display IDs for visible exposure findings.
Main report sections do not show raw threat_id or registry_row_id as primary labels.
Canonical IDs remain in technical_refs, appendix, and machine branch.
Renderer is deterministic only.
```

### Branch 2 output spine

```json
{
  "screen_report_payload": {
    "report_shell": {},
    "display_id_index": {},
    "sections": {
      "matter_overview": {},
      "executive_summary": {},
      "target_profile": {},
      "product_activity_ip_profile": {},
      "data_risk_provenance_controls": {},
      "legal_document_control_review": {},
      "exposure_findings": {},
      "implications_remediation_path": {},
      "evidence_gaps_clarification_points": {},
      "methodology_limitations_review_notes": {},
      "forensic_ledger_appendix": {}
    },
    "platform_diligence_object": {},
    "renderer_contract": {}
  }
}
```

### B2.GLOBAL.001 — report_shell

Fields:

```text
report_title
target_display_name
target_domain
run_id
generated_at
evidence_cutoff
report_mode
qualified_review_notice
no_legal_advice_notice
renderer_version_hint
```

### B2.GLOBAL.002 — display_id_index

```json
{
  "display_id_index": {
    "exposure_display_ids": [],
    "source_display_ids": [],
    "evidence_display_ids": [],
    "document_display_ids": [],
    "feature_display_ids": []
  }
}
```

Each visible exposure display row must map back to canonical refs:

```json
{
  "display_exposure_id": "EXP-001",
  "normalized_threat_name": "",
  "canonical_refs": {
    "registry_row_id": "",
    "threat_id": "",
    "ledger_row_id": "",
    "evaluation_status": "",
    "evidence_refs": [],
    "source_refs": [],
    "artifact_refs": [],
    "unit_refs": []
  }
}
```

Only rows shown in the visible Exposure Findings section get EXP IDs. The full registry ledger remains in the appendix with canonical IDs.

### B2.SECTION.001 — matter_overview

Required blocks:

```text
matter_identity
review_scope
evidence_cutoff
reliance_disclaimer
qualified_review_required
public_footprint_limitation
```

### B2.SECTION.002 — executive_summary

Required blocks:

```text
executive_posture
target_snapshot
product_activity_snapshot
data_posture
legal_document_posture
exposure_posture
evidence_posture
qualified_review_priorities
```

No risk score. Use count/posture summaries only.

### B2.SECTION.003 — target_profile

Required blocks:

```text
identity
jurisdiction
business_model
market_context
product_baseline
data_touchpoint_summary
evidence_basis
limitations
```

Jurisdiction is visibility-only. Do not decide legal applicability.

### B2.SECTION.004 — product_activity_ip_profile

Required blocks:

```text
product_activity_thesis
feature_inventory_summary
feature_table
functional_profile
risk_surface_profile
ip_content_profile
architecture_profile
commercial_scan
evidence_basis
limitations
```

Display label for `risk_surface_profile` should be activity-safe: “Activity surface profile.”

### B2.SECTION.005 — data_risk_provenance_controls

Required blocks:

```text
data_risk_thesis
data_flow_summary
data_flow_table
control_review
data_gaps
evidence_basis
limitations
```

Visible title should be “Data Provenance & Controls.” Feature Profile data fields must be integrated through Branch 1 cross-links, not repeated as disconnected facts.

### B2.SECTION.006 — legal_document_control_review

Required blocks:

```text
legal_document_review_thesis
document_inventory_summary
document_inventory
legal_unit_index
document_relationships
control_signal_matrix
document_mismatch_signals
qualified_review_points
evidence_basis
limitations
```

No document-redline or clause-mandate language.

### B2.SECTION.007 — exposure_findings

Required blocks:

```text
exposure_category_groups
finding_rows
severity_summary
control_position_summary
evidence_basis_summary
appendix_crosswalk
```

Visible finding row shape:

```json
{
  "display_exposure_id": "EXP-001",
  "normalized_threat_name": "",
  "normalized_category": "",
  "display_status": "",
  "plain_english_summary": "",
  "related_activity": "",
  "visible_control_position": "",
  "evidence_preview": {
    "source_label": "",
    "document_label": "",
    "evidence_display_id": ""
  },
  "qualified_review_flag": false,
  "technical_refs": {
    "registry_row_id": "",
    "threat_id": "",
    "ledger_row_id": "",
    "evaluation_status": "",
    "evidence_refs": [],
    "source_refs": [],
    "artifact_refs": [],
    "unit_refs": []
  }
}
```

`technical_refs` are hidden in the main card by default. Renderer may expose them through details or appendix links.

### B2.SECTION.008 — implications_remediation_path

Required blocks:

```text
remediation_thesis
priority_actions
document_route
data_control_route
operational_control_route
qualified_review_queue
quick_wins
blocked_until_clarified
review_ready_handoff_bridge
```

Visible heading should be “Implications & Review Path.” Use safe route language only: candidate review route, confirmation needed, qualified reviewer should verify, assembly consideration, visible control to preserve / verify.

### B2.SECTION.009 — evidence_gaps_clarification_points

Required blocks:

```text
open_information_requests
missing_documents
missing_factual_confirmations
unclear_data_flows
unclear_provider_dependencies
evidence_limitations
consequence_if_unresolved
client_confirmation_questions
```

This is a clarification queue, not a negative finding dump.

### B2.SECTION.010 — methodology_limitations_review_notes

Required blocks:

```text
methodology
stage_roles
status_definitions
legal_limitations
evidence_limitations
registry_use_note
reviewer_notes
```

Display `registry_use_note` as “review framework note.” Include public-footprint boundary, no legal advice, no compliance verdict, no private system access, and qualified-review note.

### B2.SECTION.011 — forensic_ledger_appendix

Required blocks:

```text
appendix_notice
full_ledger_summary
full_registry_ledger
row_level_proof
condition_trigger_basis
evidence_references
operator_challenge_trace
batch_warnings
appendix_limitations
```

This is the only visible place where raw registry IDs can appear openly.

### Platform diligence object

Internal/supporting object only:

```json
{
  "platform_diligence_object": {
    "platform_product_architecture": {},
    "data_processing_user_information_flows": {},
    "automated_systems_output_reliance": {},
    "content_output_ip_position": {},
    "security_operational_controls": {},
    "third_party_provider_infrastructure_dependencies": {},
    "user_facing_claims_product_reliance": {},
    "communications_user_interaction_flows": {},
    "customer_contracting_reliance_position": {}
  }
}
```

### Renderer contract

```json
{
  "renderer_contract": {
    "renderer_may_render": true,
    "renderer_may_sort": true,
    "renderer_may_filter_for_view": true,
    "renderer_may_expand_collapse": true,
    "renderer_may_add_facts": false,
    "renderer_may_change_statuses": false,
    "renderer_may_change_display_ids": false,
    "renderer_may_hide_appendix_rows": false,
    "renderer_may_generate_legal_advice": false,
    "renderer_may_generate_new_recommendations": false
  }
}
```

---

## BRANCH 3 — FUNCTIONAL ASSEMBLY INTAKE VAULT HANDOFF

Branch 3 translates the final diligence output into a functional assembly intake.

### Branch 3 doctrine

```text
Branch 3 may suggest prefill values.
Branch 3 may ask confirmation questions.
Branch 3 may route unresolved items to qualified review.
Branch 3 may identify document-family relevance.
Branch 3 may not create legal advice.
Branch 3 may not say a clause must be added.
Branch 3 may not treat public-footprint findings as confirmed legal defects.
Branch 3 may not override the final profiles.
Branch 3 may not invent facts missing from the profiles.
```

### Branch 3 output spine

```json
{
  "vault_assembler_handoff": {
    "handoff_meta": {},
    "source_packet": {},
    "functional_intake_vault": {},
    "vault_payload": {
      "baseline": {},
      "architecture": {},
      "archetypes": {},
      "compliance": {}
    },
    "vault_prefill_suggestions": {
      "baseline": {},
      "architecture": {},
      "archetypes": {},
      "compliance": {}
    },
    "vault_confirmation_questions": [],
    "assembly_handoff_intake": {},
    "handoff_envelope": {},
    "persistence_plan": {},
    "warnings": [],
    "handoff_lock": {}
  }
}
```

### Locked Vault groups

```text
baseline
architecture
archetypes
compliance
```

No fifth Vault group.

### Source mapping

```text
target_profile_final → baseline / source_packet.target_profile
target_feature_profile_final → architecture / archetypes / source_packet.feature_map
legal_cartography_index_final → legal document status / assembly_handoff_intake / confirmation questions
target_data_provenance_profile_final → compliance / architecture / confirmation questions
target_exposure_profile_final → review routes / confirmation questions / assembly_handoff_intake
screen_report_payload.evidence_gaps_clarification_points → vault_confirmation_questions
screen_report_payload.implications_remediation_path → assembly_handoff_intake
platform_diligence_object → supporting assembly context
```

### Safe language

Use:

```text
qualified_review
qualified_review_required
qualified_review_queue
qualified_review_localisation
qualified_review_notes
qualified_review_issue_list
review_path
exposure_findings
final_handoff_quality_control_ledger
```

Do not use legal advice, clause mandate, compliance repair, or defect-certainty language.

---

## FIELD DERIVATION POWER TABLE — FD7.001–FD7.050

| FD ID | Canonical Field / Group | Owner | Derivation Logic | Output Placement / Guardrail |
|---|---|---|---|---|
| **FD7.001** | `phase_id` | Deterministic | Set exact value: `P7_FINAL_OUTPUT_COMPILER_AND_HANDOFF`. | `final_compiler_trace.phase_id`; blocks if altered. |
| **FD7.002** | `run_meta` | Deterministic | Copy run ID, target ref, generated timestamp, evidence cutoff, report mode, phase stack version. | `final_output_handoff.run_meta`; no marketing/legal language. |
| **FD7.003** | `input_manifest` | Deterministic | Confirm receipt of target, feature, legal cartography, data provenance, exposure profile, evidence refs, and limitations. | Controlled values: `READY`, `PARTIAL_INPUTS`, `REPAIR_REQUIRED`, `CONTROLLED_FAILURE`. |
| **FD7.004** | `input_profile_lock_status` | Deterministic | Check whether required upstream profiles are locked/usable. | Controlled failure if any core profile is missing. |
| **FD7.005** | `final_compiler_trace` | Deterministic | Record branch build order, cross-profile preparation trace, normalization trace, Vault handoff trace, QC trace, repairs/failures. | Trace only; no report prose. |
| **FD7.006** | `normalization_dictionary` | Deterministic copy | Embed locked ND7.001–ND7.016. | Branch 1 may not use it for canonical values. |
| **FD7.007** | `normalization_scope_rules` | Deterministic | Enforce: Branch 2 uses display labels; Branch 3 uses safe action/review labels; Branch 1 remains canon-only. | Blocks normalization leakage into Branch 1. |
| **FD7.008** | `forbidden_normalization_guard` | Deterministic | Block legal verdict / unsafe terms. | No compliant/non-compliant/liable/violation/fix language. |
| **FD7.009** | `display_label_policy` | Deterministic | Ensure human-visible technical values carry display labels where exposed. | Canonical IDs preserved in metadata/appendix. |
| **FD7.010** | `qualified_review_language_policy` | Deterministic | Use qualified-review wording only. | No separate counsel-specific review route. |
| **FD7.011** | `prepared_final_profiles` | Deterministic / compiler | Create final canonical copies of all five profiles with added cross-link metadata only. | No upstream mutation. |
| **FD7.012** | `target_profile_final` | Compiler | Copy target profile and add canonical backlinks to features, sources, data touchpoints, limitations. | No new target facts. |
| **FD7.013** | `target_feature_profile_final` | Compiler | Copy feature profile and add canonical links to data, legal, exposure refs. | Data fields linked to data profile; not duplicated as new facts. |
| **FD7.014** | `legal_cartography_index_final` | Compiler | Copy legal cartography and add links to data controls, exposure rows, source refs. | No legal interpretation rewrite. |
| **FD7.015** | `target_data_provenance_profile_final` | Compiler | Copy data profile and add feature/data/legal/exposure backlinks. | No new data processing facts. |
| **FD7.016** | `target_exposure_profile_final` | Compiler | Copy exposure profile and add cross-links to features/data/legal/evidence. | No new registry evaluation. |
| **FD7.017** | `cross_profile_alignment_statuses` | Compiler | Assign integration statuses. | Alignment only; not exposure evaluation. |
| **FD7.018** | `profile_conflict_and_missing_link_flags` | Compiler | Record profile-level conflicts, missing counterparts, or unresolved links. | No dispute resolution unless already resolved upstream. |
| **FD7.019** | `integrated_json_report` | Compiler | Build Branch 1 from prepared profiles, indexes, canonical refs, evidence indexes, summaries, and machine lock. | Canon-only branch. |
| **FD7.020** | `cross_profile_indexes` | Compiler | Build target→feature, feature→data, feature→legal, feature→exposure, data→legal, data→exposure, legal→exposure, source/evidence indexes. | Cross-link only; no new findings. |
| **FD7.021** | `canonical_ref_indexes` | Compiler | Build indexes for profile refs, feature refs, data refs, legal artifact/unit/control refs, registry rows, evidence/source/absence/access refs. | Canonical IDs preserved. |
| **FD7.022** | `canonical_summary` | Compiler | Compile canonical count/coverage/status summaries. | No humanized prose; no risk score. |
| **FD7.023** | `machine_lock` | Deterministic | Confirm all profiles present, canon preserved, cross-profile indexes built, no upstream mutation, no normalization, no new findings. | Branch 1 lock. |
| **FD7.024** | `evidence_and_limitation_indexes` | Compiler | Consolidate evidence, absence, access-failed, source coverage, and limitation indexes. | Used by all branches. |
| **FD7.025** | `branch1_no_normalization_gate` | Deterministic | Confirm Branch 1 contains no display labels, normalized names, EXP IDs, Vault action labels, or screen phrases. | Blocks if violated. |
| **FD7.026** | `screen_report_payload` | Compiler + ND7 | Build Branch 2 from Branch 1 and ND7. | No raw HTML. |
| **FD7.027** | `report_shell` | Compiler | Build report title, target display name, domain, run ID, generated date, evidence cutoff, report mode, qualified-review notice, no-legal-advice notice. | Display-safe. |
| **FD7.028** | `display_id_index` | Deterministic/compiler | Assign EXP IDs to visible exposure findings; assign source/evidence/document/feature display IDs where needed. | EXP IDs map to canonical refs. |
| **FD7.029** | `screen_sections` | Compiler | Build the 11 locked report sections. | Must match locked structure. |
| **FD7.030** | `exposure_findings_display_rows` | Compiler + ND7 | Build finding rows with display exposure ID, normalized threat name, normalized category/status, summary, evidence preview, hidden technical refs. | No raw registry ID as primary label. |
| **FD7.031** | `qualified_review_screen_queue` | Compiler + ND7 | Build qualified-review rows across executive summary, legal document review, implications path, gaps, methodology. | No counsel-specific route language. |
| **FD7.032** | `screen_evidence_and_gap_sections` | Compiler | Build evidence/gaps/clarification sections from Branch 1 evidence/absence/access indexes and Branch 2 section map. | No “missing = violation.” |
| **FD7.033** | `platform_diligence_object` | Compiler | Build internal/supporting platform diligence object across nine platform legal diligence elements. | Not a visible main report section. |
| **FD7.034** | `forensic_ledger_appendix` | Compiler | Build full technical appendix with all registry rows, canonical statuses, refs, route dispositions, challenge/QC trace. | Raw IDs allowed here. |
| **FD7.035** | `renderer_contract` | Deterministic | Emit renderer permissions. | Renderer has no substantive authority. |
| **FD7.036** | `vault_assembler_handoff` | Compiler | Build Branch 3 functional assembly intake handoff. | No legal advice or clause-mandate language. |
| **FD7.037** | `source_packet` | Compiler | Build clean source packet from prepared profiles, exposure findings, evidence gaps, review path, platform diligence object, and source trace. | No old-system field names. |
| **FD7.038** | `functional_intake_vault` | Compiler | Build functional intake vault with schema/version, sections, vault payload, suggestions, questions, handoff intake, source trace, status. | Functional assembly intake only. |
| **FD7.039** | `vault_payload` | Compiler | Populate four Vault groups: `baseline`, `architecture`, `archetypes`, `compliance`. | No fifth group. |
| **FD7.040** | `vault_prefill_suggestions` | Compiler | Suggest prefill values for baseline/architecture/archetypes/compliance from Branch 1/2. | Suggestions require confirmation. |
| **FD7.041** | `vault_confirmation_questions` | Compiler | Generate confirmation questions from missing/unclear/access-failed/review-required items. | Questions only; no legal advice. |
| **FD7.042** | `assembly_handoff_intake` | Compiler | Build document-family relevance, review route, unresolved item, and source limitation intake. | No “must add clause” or “fix violation.” |
| **FD7.043** | `handoff_envelope_and_persistence_plan` | Deterministic/compiler | Build handoff envelope and persistence plan for downstream storage/assembly. | No substantive findings. |
| **FD7.044** | `vault_handoff_lock` | Deterministic | Confirm Vault groups present, suggestions traceable, questions traceable, unresolved items flagged, confirmation required. | Branch 3 lock. |
| **FD7.045** | `final_quality_control` | Deterministic | Run final branch presence, separation, profile preservation, cross-profile index, normalization, display ID, Vault group, legal firewall, renderer, evidence trace gates. | Cross-branch validation only. |
| **FD7.046** | `branch_separation_gate` | Deterministic | Confirm Branch 1 canon-only, Branch 2 normalized screen-only, Branch 3 assembly-intake-only. | Blocks branch contamination. |
| **FD7.047** | `legal_firewall_gate` | Deterministic | Block legal advice, compliance verdicts, liability conclusions, enforceability findings, clause mandates, and unsafe remediation language. | Controlled failure if violated. |
| **FD7.048** | `final_limitations` | Compiler | Carry forward limitations from all phases and add Phase 07 compilation limitations only if created by compiler process. | No invented limitations. |
| **FD7.049** | `handoff_lock` | Deterministic | Emit `LOCKED`, `REPAIR_REQUIRED`, or `CONTROLLED_FAILURE` with branch lock statuses. | Cannot lock if any core branch fails. |
| **FD7.050** | `final_output_handoff` | Deterministic assembly | Emit complete final handoff object containing run_meta, input_manifest, ND7, three branches, QC, limitations, and lock. | Final JSON only. |

---

## EXECUTION BLOCKS — EB7.001–EB7.010

### EB7.001 — Runtime and input receipt

Confirm Phase 07 identity, load runtime rules, receive all required profile outputs, source refs, limitations, and forensic ledgers.

Output:

```text
final_compiler_trace
run_meta
input_manifest
```

### EB7.002 — Input lock and boundary validation

Validate that the five required profile outputs are present and usable. If a core profile is missing, emit controlled failure. If a supporting input is partial, record limitation and continue only if the final handoff remains safe.

### EB7.003 — Normalization dictionary loading

Load ND7.001–ND7.016. Enforce the rule that Branch 1 does not use normalization, Branch 2 uses display normalization, and Branch 3 uses safe action/review-route language.

### EB7.004 — Branch 1 final profile preparation

Prepare final canonical profile copies by adding cross-links, backlinks, alignment statuses, missing-link flags, conflict flags, and ref indexes. Do not mutate upstream facts.

### EB7.005 — Branch 1 integrated JSON report compilation

Compile prepared final profiles, cross-profile indexes, canonical ref indexes, evidence/absence/access indexes, canonical summaries, and machine lock.

### EB7.006 — Branch 2 screen report payload compilation

Build report shell, display ID index, eleven locked report sections, platform diligence object, and renderer contract from Branch 1 + ND7.

### EB7.007 — Branch 3 functional assembly intake compilation

Build source packet, functional intake vault, four Vault groups, prefill suggestions, confirmation questions, assembly handoff intake, envelope, persistence plan, warnings, and handoff lock from Branch 1 + Branch 2 + ND7.

### EB7.008 — Limitation carry-forward and unresolved item consolidation

Carry forward limitations from all phases. Consolidate unresolved items into evidence gaps, qualified-review queues, Vault confirmation questions, and handoff limitations.

### EB7.009 — Final cross-branch quality control

Run final branch presence, separation, profile preservation, cross-profile index, normalization, display ID, Vault group, legal firewall, renderer authority, evidence trace, and limitations gates.

### EB7.010 — Final output handoff emission

Emit final JSON only:

```json
{
  "final_output_forensic_ledger": {},
  "final_compiler_trace": {},
  "final_output_handoff": {
    "run_meta": {},
    "input_manifest": {},
    "normalization_dictionary": {},
    "integrated_json_report": {},
    "screen_report_payload": {},
    "vault_assembler_handoff": {},
    "final_quality_control": {},
    "limitations": [],
    "handoff_lock": {}
  }
}
```

---

## TERMINAL GATES — TG7.001–TG7.016

Terminal gates validate structure, branch separation, source discipline, schema discipline, and legal-firewall discipline. They do not create new findings.

### TG7.001 — Input Manifest Gate

Checks all required inputs are present.

Controlled failure if any core profile is missing:

```text
target_profile
target_feature_profile
legal_cartography_index
target_data_provenance_profile
target_exposure_profile
```

### TG7.002 — Upstream Lock Preservation Gate

Checks that Phase 07 did not alter upstream profile facts, statuses, evidence refs, registry rows, or limitations.

### TG7.003 — Branch Presence Gate

Checks that all three branches exist:

```text
integrated_json_report
screen_report_payload
vault_assembler_handoff
```

### TG7.004 — Branch Separation Gate

Checks:

```text
Branch 1 is canon-only.
Branch 2 is screen payload only.
Branch 3 is functional assembly intake only.
```

Fails if display labels leak into Branch 1, canonical-only fields are replaced in Branch 1, raw HTML appears in Branch 2, or legal advice appears in Branch 3.

### TG7.005 — Branch 1 Canon Gate

Checks Branch 1 contains no normalization, display labels, EXP IDs, Vault action labels, or screen report phrasing.

### TG7.006 — Cross-Profile Index Gate

Checks that core cross-profile indexes were built:

```text
target_to_feature_index
feature_to_data_index
feature_to_legal_index
feature_to_exposure_index
data_to_legal_index
data_to_exposure_index
legal_to_exposure_index
source_to_profile_index
evidence_to_profile_index
evidence_to_exposure_index
```

### TG7.007 — Canonical Ref Index Gate

Checks canonical ref indexes exist for profiles, features, data, legal artifacts, legal units, controls, registry rows, evidence, sources, absence, and access failures.

### TG7.008 — Normalization Scope Gate

Checks Branch 2 and Branch 3 use ND7 where needed, while Branch 1 remains canon-only.

### TG7.009 — Display ID Gate

Checks all visible exposure findings use `EXP-###` display IDs and map back to canonical registry/evidence refs.

Fails if raw registry IDs are used as primary labels in main report sections.

### TG7.010 — Report Section Gate

Checks Branch 2 includes the eleven locked sections:

```text
matter_overview
executive_summary
target_profile
product_activity_ip_profile
data_risk_provenance_controls
legal_document_control_review
exposure_findings
implications_remediation_path
evidence_gaps_clarification_points
methodology_limitations_review_notes
forensic_ledger_appendix
```

### TG7.011 — Renderer Authority Gate

Checks renderer contract denies authority to add facts, change statuses, change display IDs, hide appendix rows, generate legal advice, or generate new recommendations.

### TG7.012 — Vault Group Gate

Checks Branch 3 includes exactly four Vault groups:

```text
baseline
architecture
archetypes
compliance
```

No fifth group.

### TG7.013 — Vault Confirmation Gate

Checks prefill suggestions and assembly intake are traceable and require confirmation before downstream reliance.

### TG7.014 — Legal Firewall Gate

Blocks legal advice, compliance verdicts, liability conclusions, enforceability findings, clause mandates, defect-certainty language, and unsafe remediation language.

### TG7.015 — Limitation Carry-Forward Gate

Checks limitations, absence records, access failures, unresolved review routes, and source constraints are preserved across relevant branches.

### TG7.016 — Final JSON Lock Gate

Checks final root object parses and contains:

```text
final_output_forensic_ledger
final_compiler_trace
final_output_handoff.run_meta
final_output_handoff.input_manifest
final_output_handoff.normalization_dictionary
final_output_handoff.integrated_json_report
final_output_handoff.screen_report_payload
final_output_handoff.vault_assembler_handoff
final_output_handoff.final_quality_control
final_output_handoff.limitations
final_output_handoff.handoff_lock
```

Final lock statuses:

```text
LOCKED
REPAIR_REQUIRED
CONTROLLED_FAILURE
```

If any controlled failure reason is present, `handoff_lock_status` cannot be `LOCKED`.

---

## FINAL QUALITY CONTROL OBJECT

```json
{
  "final_quality_control": {
    "branch_presence_gate": "PASS",
    "branch_separation_gate": "PASS",
    "profile_preservation_gate": "PASS",
    "cross_profile_index_gate": "PASS",
    "canonical_ref_index_gate": "PASS",
    "normalization_scope_gate": "PASS",
    "display_id_gate": "PASS",
    "report_section_gate": "PASS",
    "vault_group_gate": "PASS",
    "vault_confirmation_gate": "PASS",
    "legal_firewall_gate": "PASS",
    "renderer_contract_gate": "PASS",
    "evidence_trace_gate": "PASS",
    "limitation_carry_forward_gate": "PASS",
    "final_json_lock_gate": "PASS",
    "quality_control_status": "PASS",
    "repair_required_flags": [],
    "controlled_failure_reasons": []
  }
}
```

---

## HANDOFF LOCK OBJECT

```json
{
  "handoff_lock": {
    "handoff_lock_status": "LOCKED",
    "locked_branches": {
      "integrated_json_report": true,
      "screen_report_payload": true,
      "vault_assembler_handoff": true
    },
    "no_upstream_mutation": true,
    "no_new_findings_created": true,
    "no_legal_advice_generated": true,
    "renderer_authority_limited": true,
    "vault_handoff_requires_confirmation": true,
    "repair_required_flags": [],
    "controlled_failure_reasons": []
  }
}
```

Allowed `handoff_lock_status` values:

```text
LOCKED
REPAIR_REQUIRED
CONTROLLED_FAILURE
```

---

## FINAL OUTPUT SCHEMA

Phase 07 must emit final JSON only.

```json
{
  "final_output_forensic_ledger": {
    "phase_id": "P7_FINAL_OUTPUT_COMPILER_AND_HANDOFF",
    "ledger_status": "LOCKED",
    "ledger_events": [],
    "coverage_matrix": {
      "required_profiles_received": [],
      "profiles_prepared": [],
      "cross_profile_indexes_built": [],
      "normalization_events": [],
      "display_id_events": [],
      "vault_handoff_events": [],
      "quality_control_gates": [],
      "repair_events": [],
      "controlled_failure_events": []
    }
  },
  "final_compiler_trace": {
    "phase_id": "P7_FINAL_OUTPUT_COMPILER_AND_HANDOFF",
    "compiler_version": "",
    "input_profile_receipt": {},
    "branch_build_order": [],
    "cross_profile_preparation_trace": [],
    "normalization_application_trace": [],
    "vault_handoff_trace": [],
    "quality_control_trace": [],
    "repair_trace": [],
    "controlled_failure_trace": []
  },
  "final_output_handoff": {
    "run_meta": {
      "run_id": "",
      "target_ref": {},
      "generated_at": "",
      "evidence_cutoff": "",
      "report_mode": "PUBLIC_FOOTPRINT_REVIEW",
      "output_type": "FINAL_OUTPUT_HANDOFF",
      "phase_stack_version": ""
    },
    "input_manifest": {
      "target_profile_received": true,
      "target_feature_profile_received": true,
      "legal_cartography_index_received": true,
      "target_data_provenance_profile_received": true,
      "target_exposure_profile_received": true,
      "source_evidence_refs_received": true,
      "limitations_received": true,
      "missing_inputs": [],
      "partial_inputs": [],
      "input_lock_status": "READY"
    },
    "normalization_dictionary": {},
    "integrated_json_report": {},
    "screen_report_payload": {},
    "vault_assembler_handoff": {},
    "final_quality_control": {},
    "limitations": [],
    "handoff_lock": {}
  }
}
```

