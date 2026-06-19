# 05_TARGET_DATA_PROVENANCE_PROFILE.md

**Status:** LOCKED / PATCHED COMPRESSED VERSION  
**Phase:** 05 — Target Data Provenance Profile  
**Version:** v2.0-compressed-anti-unknown  
**Primary Output:** `target_data_provenance_profile`  
**Field Derivation Range:** `FD5.001–FD5.096`  
**Taxonomy:** `LAW_AWARE_PRIVACY_SIGNAL_TAXONOMY_LOCK_v1` embedded below.

---

## 0. Non-Negotiable Boundary

Phase 05 maps **feature-level data provenance and privacy-control visibility**. It does not determine GDPR, DPDP, CCPA/CPRA, COPPA, sectoral privacy, AI governance, or other legal compliance. Visibility statuses are evidence-routing signals for qualified review, not legal conclusions.

Allowed language:

```text
VISIBLE_CONTROL_PRESENT
VISIBLE_BUT_CONTROL_WEAK_OR_UNCLEAR
VISIBLE_DATA_PROCESSING_NO_CONTROL_FOUND
NOT_VISIBLE_AFTER_TARGETED_SEARCH
ACCESS_FAILED
UNKNOWN_NOT_SEARCHED
CONFLICTING_SIGNALS
NOT_APPLICABLE_CONTEXTUAL
```

Forbidden output language:

```text
compliant
non-compliant
violation
lawful
unlawful
legally required
legally sufficient
enforceable
unenforceable
liable
liability finding
risk score
registry TRUE/FALSE
```

---

## 1. Execution Split — Locked

Phase 05 uses a deterministic-first execution model. The model must not derive fields that can be derived deterministically. The model only resolves semantic ambiguity after deterministic candidate generation. All final statuses are validated deterministically.

| Execution mode | Target share | What it owns |
|---|---:|---|
| Deterministic | 75% | source gate, input manifest, refs, IDs, source-route status, candidate hits, explicit positive/negative detection, counts, evidence basis, missing rows, review routes, validators |
| Hybrid / model-confirmed | 20% | processing purpose nuance, feature-purpose linkage, role scope, dual-role, sensitive/sectoral context, automated decision context, agentic authority, conflict interpretation |
| Model-led | 5% | only genuine semantic ambiguity where deterministic candidates cannot resolve meaning |
| Legal verdict | 0% | never allowed |

Mode labels used in FD table:

```text
D  = fully deterministic
DF = deterministic-first candidate generation; model confirmation only if flagged
H  = hybrid deterministic + model confirmation
M  = model-led ambiguity resolution only
V  = deterministic validator/gate
```

---

## 2. Canonical Output Contract

```json
{
  "data_provenance_forensic_ledger": {},
  "data_provenance_trace": {},
  "target_data_provenance_profile": {
    "target_ref": {},
    "input_manifest": {},
    "deterministic_prepass_candidate_ledger": [],
    "anti_unknown_protocol_result": {},
    "feature_data_provenance": [],
    "processing_activity_map": [],
    "data_category_map": {},
    "role_responsibility_map": [],
    "recipient_vendor_map": [],
    "party_chain_summary": {},
    "transfer_map": {},
    "retention_deletion_map": {},
    "rights_request_map": {},
    "privacy_notice_map": {},
    "ai_data_control_map": {},
    "sensitive_data_map": [],
    "minor_data_map": {},
    "automated_decision_map": [],
    "security_control_map": {},
    "access_control_map": {},
    "tracking_technology_map": {},
    "technical_metadata_map": {},
    "agentic_data_map": {},
    "governance_assurance_map": {},
    "data_broker_signal": {},
    "sectoral_privacy_signal_map": {},
    "law_aware_signal_matrix": {
      "dpdp": {},
      "gdpr_uk_gdpr": {},
      "us_state_privacy": {},
      "us_children_privacy": {},
      "us_sectoral_privacy": {}
    },
    "privacy_signal_matrix": [],
    "missing_signal_fields": [],
    "review_route_map": [],
    "evidence": {},
    "limitations": [],
    "quality": {},
    "handoff": {}
  }
}
```

---

## 3. Source Gate

### 3.1 Allowed Phase 05 Source Classes

```text
target_feature_profile refs
legal_cartography_index refs
admitted privacy/legal/governance macro units relevant to privacy/data
admitted DPA / privacy policy / cookie policy / terms / AUP / AI policy / agentic addendum refs
admitted security/trust sources relevant to data/security controls
admitted docs/API/developer sources only where Stage 1 routed them as data-processing evidence
admitted subprocessor/vendor/trust artifacts
admitted data-request/privacy-center artifacts
upstream absence/access/deferred records
```

### 3.2 Forbidden Source Classes

```text
marketing-only product copy
pricing pages
blogs/changelogs unless admitted as data-processing evidence
third-party commentary
speculative source material
registry/exposure evidence
final report narrative
```

### 3.3 Source Admission Basis Enum

```yaml
source_admission_basis:
  - FEATURE_PROFILE_REF
  - LEGAL_CARTOGRAPHY_REF
  - PRIVACY_LEGAL_GOVERNANCE_SOURCE
  - DPA_SOURCE
  - PRIVACY_POLICY_SOURCE
  - COOKIE_POLICY_SOURCE
  - TERMS_OR_AUP_SOURCE
  - AI_POLICY_SOURCE
  - AGENTIC_ADDENDUM_SOURCE
  - SUBPROCESSOR_SOURCE
  - SECURITY_TRUST_SOURCE
  - DOCS_API_DATA_PROCESSING_SOURCE
  - DATA_REQUEST_SOURCE
  - UPSTREAM_ABSENCE_RECORD
  - ACCESS_FAILED_RECORD
```

---

## 4. Anti-Unknown Protocol — Locked

Known failure mode: deterministic matching produced too many `UNKNOWN` values because it acted as a field filler instead of a route-aware signal hunter. Phase 05 fixes this.

### 4.1 Status Ladder

Every signal must be evaluated in this order:

| Order | Status | Use only when |
|---:|---|---|
| 1 | `VISIBLE_CONTROL_PRESENT` | Signal/control is visibly present, including explicit negative controls such as “we do not train on customer data.” |
| 2 | `VISIBLE_BUT_CONTROL_WEAK_OR_UNCLEAR` | Relevant wording exists, but scope/timing/feature coverage is vague. |
| 3 | `VISIBLE_DATA_PROCESSING_NO_CONTROL_FOUND` | Data processing is visible but the related control is not visible in reviewed sources. |
| 4 | `CONFLICTING_SIGNALS` | Public artifacts contain inconsistent statements. |
| 5 | `NOT_VISIBLE_AFTER_TARGETED_SEARCH` | Expected source route was searched; signal was not found. |
| 6 | `ACCESS_FAILED` | Expected source/candidate existed but fetch/read failed. |
| 7 | `UNKNOWN_NOT_SEARCHED` | Expected source route was genuinely not searched or unavailable in handoff. |
| 8 | `NOT_APPLICABLE_CONTEXTUAL` | Feature/data context makes signal not expected. |

### 4.2 Hard Rules

```yaml
UNKNOWN_NOT_SEARCHED_ALLOWED_ONLY_IF:
  - expected source route was not searched
  - expected source route was unavailable in upstream handoff
  - upstream source package lacks search basis

IF_EXPECTED_ROUTE_SEARCHED_AND_SIGNAL_NOT_FOUND:
  status: NOT_VISIBLE_AFTER_TARGETED_SEARCH

IF_PROCESSING_VISIBLE_BUT_CONTROL_NOT_FOUND:
  status: VISIBLE_DATA_PROCESSING_NO_CONTROL_FOUND

IF_CONTROL_WORDING_EXISTS_BUT_SCOPE_VAGUE:
  status: VISIBLE_BUT_CONTROL_WEAK_OR_UNCLEAR

IF_SOURCE_FAILED:
  status: ACCESS_FAILED

IF_SOURCE_CONFLICTS_WITH_ANOTHER_SOURCE:
  status: CONFLICTING_SIGNALS

IF_FEATURE_DATA_CONTEXT_MAKES_SIGNAL_IRRELEVANT:
  status: NOT_APPLICABLE_CONTEXTUAL

EVERY_UNKNOWN_NOT_SEARCHED_MUST_INCLUDE:
  - expected_source_route
  - actual_search_or_review_basis
  - why_unknown
  - review_question
  - missing_signal_fields row
  - review_route_map row where possible
```

### 4.3 Expected Source Route Matrix

| Signal family | Expected source routes |
|---|---|
| Model training / fine-tuning | Privacy Policy; DPA; AI Terms/AI Policy; Terms |
| RAG / embeddings / vector deletion | Privacy Policy; DPA; AI Policy; Docs/API data-processing source |
| Subprocessors / model providers | DPA; Subprocessor List; Trust Center; Privacy Policy |
| Retention / deletion | Privacy Policy; DPA; Data Request Page; Account Settings docs |
| Rights requests | Privacy Policy; Data Request Page; Privacy Center; Contact Page |
| GPC / Do Not Sell / Share | Privacy Policy; Cookie Policy; Privacy Center |
| SCC / international transfer | DPA; Privacy Policy; Subprocessor List; Trust Center |
| Security safeguards | Security Policy; Trust Center; DPA; Security docs |
| Children / minors | Privacy Policy; Terms; AUP; Child-safety page |
| Agentic permission / kill switch | Agentic Addendum; Terms; Docs/API; Security/Trust |
| Automated decisioning / profiling | Privacy Policy; AI Policy; DPIA/Impact Assessment; Terms |
| Sensitive/sectoral data | Privacy Policy; DPA; AUP; Sector-specific policy; Feature docs |
| Cookies / trackers | Cookie Policy; Privacy Policy; Consent Banner/Preference Center |

### 4.4 Deterministic Candidate Ledger Shape

```json
{
  "signal_field": "model_training_or_finetuning_signal",
  "expected_source_routes": ["PRIVACY_POLICY", "DPA", "AI_TERMS_POLICY"],
  "searched_routes": ["PRIVACY_POLICY"],
  "candidate_hits": [
    {
      "match_type": "explicit_negative",
      "trigger": "not used to train",
      "source_ref": "SRC_LEGAL_002",
      "artifact_ref": "A002",
      "unit_ref": "U014",
      "location_ref": {}
    }
  ],
  "candidate_status": "VISIBLE_CONTROL_PRESENT",
  "needs_model_confirmation": false,
  "absence_basis": "N/A"
}
```

### 4.5 Explicit Positive / Explicit Negative Rule

Explicit negative controls are not missing signals. They are visible controls.

```yaml
EXAMPLE_MODEL_TRAINING_RULE:
  positive_triggers:
    - "use.*data.*train"
    - "use.*input.*model improvement"
    - "fine.?tun"
    - "train.*model"
    - "improve.*AI model"
  negative_triggers:
    - "do not use.*train"
    - "not used.*train"
    - "never use.*fine.?tun"
    - "no training"
    - "model weights.*not.*modified"
  negative_status: VISIBLE_CONTROL_PRESENT
  ambiguous_status: VISIBLE_BUT_CONTROL_WEAK_OR_UNCLEAR
```

---

## 5. Child Signal Schemas — Nested Under Maps

Do not expand child signals into separate FD rows. Child signals stay nested under their parent map.

### 5.1 Common Signal Object

```json
{
  "visibility_status": "",
  "signal_summary_label": "",
  "candidate_hits": [],
  "evidence_basis": {},
  "review_route_refs": [],
  "confidence": "high | medium | low | unknown",
  "limitations": []
}
```

### 5.2 Parent Map Child Signals

```yaml
feature_data_provenance_children:
  - data_interaction_type
  - personal_data_signal
  - data_subject_category
  - collection_source
  - input_data_categories
  - output_data_categories
  - feature_high_signal_flags
  - feature_privacy_signal_status_summary
  - feature_review_route_refs

processing_activity_map_children:
  - processing_action
  - processing_stage
  - processing_purpose_signal
  - purpose_to_feature_link
  - input_data_category_refs
  - output_data_category_refs
  - personal_data_relevance
  - ai_processing_context
  - storage_context
  - disclosure_context
  - rights_or_control_context
  - law_signal_tags

data_category_map_children:
  - input_categories
  - output_categories
  - technical_metadata_categories
  - sensitive_data_categories
  - sectoral_data_categories
  - confidential_content_categories
  - aggregated_deidentified_categories

role_responsibility_map_children:
  - visible_role_label
  - canonical_role_signal
  - role_scope
  - dual_role_signal
  - documented_instruction_signal
  - secondary_use_restriction_signal

recipient_vendor_map_children:
  - recipient_category
  - recipient_role_signal
  - ai_model_provider_signal
  - subprocessor_signal
  - disclosure_purpose_signal
  - cross_border_transfer_signal
  - transfer_mechanism_signal
  - service_provider_restriction_signal
  - sale_share_targeted_ads_signal
  - security_assurance_signal

transfer_map_children:
  - transfer_signal_status
  - cross_border_transfer_signal
  - transfer_origin_region_refs
  - transfer_destination_region_refs
  - transfer_recipient_refs
  - transfer_data_category_refs
  - transfer_processing_activity_refs
  - transfer_mechanism_signal
  - scc_signal
  - uk_idta_signal
  - adequacy_or_equivalent_signal
  - dpdp_cross_border_signal
  - us_state_transfer_or_disclosure_signal

retention_deletion_map_children:
  - retention_signal_status
  - retention_period_signal
  - storage_duration_signal
  - backup_retention_signal
  - log_retention_signal
  - embedding_vector_retention_signal
  - output_retention_signal
  - account_closure_retention_signal
  - deletion_erasure_signal
  - data_deletion_scope_signal
  - rag_separability_deletion_signal
  - model_weight_deletion_signal

rights_request_map_children:
  - rights_signal_status
  - rights_request_channels
  - access_or_know_signal
  - correction_rectification_signal
  - deletion_erasure_request_signal
  - portability_signal
  - opt_out_signal
  - consent_withdrawal_signal
  - appeal_signal
  - limit_sensitive_pi_signal
  - gpc_universal_opt_out_signal
  - do_not_sell_share_signal
  - automated_decision_rights_signal
  - minor_parental_request_signal
  - grievance_or_complaint_signal

privacy_notice_map_children:
  - privacy_notice_status
  - notice_at_collection_signal
  - privacy_policy_artifact_refs
  - notice_scope_signal
  - data_categories_disclosed_signal
  - purpose_disclosed_signal
  - recipient_disclosed_signal
  - retention_disclosed_signal
  - rights_disclosed_signal
  - contact_disclosed_signal
  - ai_processing_notice_signal
  - training_finetuning_notice_signal
  - children_minor_notice_signal
  - sensitive_data_notice_signal
  - cookie_tracking_notice_signal
  - ccpa_cpra_notice_signal
  - dpdp_notice_signal
  - gdpr_notice_signal

ai_data_control_map_children:
  - ai_processing_disclosure_signal
  - ai_model_provider_signal
  - prompt_input_handling_signal
  - output_handling_signal
  - embedding_vector_store_signal
  - rag_processing_signal
  - model_training_or_finetuning_signal
  - no_training_control_status
  - model_weight_separation_signal
  - prompt_confidentiality_signal
  - human_review_or_abuse_review_signal
  - ai_security_threat_control_signal

sensitive_minor_admt_children:
  - sensitive_data_map
  - minor_data_map
  - automated_decision_map
  - human_intervention_signal
  - explanation_or_appeal_signal
  - impact_assessment_or_bias_audit_signal

security_access_tracking_metadata_children:
  - security_control_map
  - access_control_map
  - tracking_technology_map
  - technical_metadata_map

agentic_governance_sectoral_children:
  - agentic_data_map
  - governance_assurance_map
  - data_broker_signal
  - sectoral_privacy_signal_map
```

---

## 6. Field Derivation Logic Power Table — FD5.001–FD5.096

| Field ID | Field Path | Mode | Derivation Purpose |
|---|---|---|---|
| `FD5.001` | `target_data_provenance_profile` | `D` | Canonical Phase 05 object. Initialize schema and required child containers. |
| `FD5.002` | `input_manifest` | `D` | Record target/feature/legal/source inputs and missing input flags. |
| `FD5.003` | `deterministic_prepass_candidate_ledger` | `D` | Route-aware signal-hunter output: searched routes, hits, negative hits, candidate status, model-confirmation flags. |
| `FD5.004` | `anti_unknown_protocol_result` | `D` | Apply the status ladder; prohibit lazy UNKNOWN_NOT_SEARCHED. |
| `FD5.005` | `target_ref` | `D` | Copy target metadata from Phase 02 without re-deriving identity. |
| `FD5.006` | `feature_profile_ref_and_scope_status` | `D` | Copy feature IDs from Phase 03 and determine feature scope readiness. |
| `FD5.007` | `legal_cartography_ref_mode` | `D` | Use Phase 04 artifact/unit/control refs as navigation only. |
| `FD5.008` | `admitted_data_source_refs[]` | `D` | Admit only Phase 05 source classes with admission basis. |
| `FD5.009` | `blocked_source_refs[]` | `D` | Record sources blocked by Phase 05 source gate. |
| `FD5.010` | `evidence_basis_contract` | `D` | Require refs/absence basis for every substantive signal. |
| `FD5.011` | `feature_data_provenance[]` | `D/H` | One row per Phase 03 feature; semantic confirmation only for ambiguous data behavior. |
| `FD5.012` | `feature_data_provenance[].data_interaction_type` | `DF/H` | Candidate from verbs/source families; model confirms ambiguous feature behavior. |
| `FD5.013` | `feature_data_provenance[].personal_data_signal` | `DF/H` | Personal/PI signal based on data categories and explicit privacy language. |
| `FD5.014` | `feature_data_provenance[].data_subject_category[]` | `DF/H` | Who the data relates to: user, customer end user, employee, child, consumer, etc. |
| `FD5.015` | `feature_data_provenance[].collection_source[]` | `DF` | Source of data entry: user input, upload, API, integration, cookie, auth, logs. |
| `FD5.016` | `feature_data_provenance[].input_data_categories[]` | `DF` | Controlled input data categories. |
| `FD5.017` | `feature_data_provenance[].output_data_categories[]` | `DF/H` | Controlled output categories; model confirms inference/profile/score ambiguity. |
| `FD5.018` | `feature_data_provenance[].feature_high_signal_flags` | `H` | AI, embedding, training, vendor, retention, rights, sensitive, minor, ADMT flags. |
| `FD5.019` | `feature_data_provenance[].feature_privacy_signal_status_summary` | `D` | Counts by visibility status per feature. |
| `FD5.020` | `feature_data_provenance[].feature_review_route_refs[]` | `D` | Refs for downstream reviewer inspection. |
| `FD5.021` | `processing_activity_map[]` | `DF/H` | Processing activity ledger: feature + action + data category + stage + purpose. |
| `FD5.022` | `processing_activity_map[].processing_action_and_stage` | `DF/H` | Action/stage candidates from verbs/API/docs; model confirms broad/ambiguous language. |
| `FD5.023` | `processing_activity_map[].processing_purpose_signal` | `H` | Purpose label and visibility status; no lawful-basis conclusion. |
| `FD5.024` | `processing_activity_map[].purpose_to_feature_link` | `H` | Direct/indirect/global/unclear feature-purpose linkage. |
| `FD5.025` | `processing_activity_map[].personal_data_relevance` | `DF/H` | Whether linked activity involves personal data/PI signal. |
| `FD5.026` | `processing_activity_map[].ai_processing_context` | `DF/H` | AI/model/embedding/RAG/training/no-training context. |
| `FD5.027` | `processing_activity_map[].storage_disclosure_rights_context` | `DF/H` | Storage, disclosure/vendor, and rights/control context. |
| `FD5.028` | `processing_activity_map[].law_signal_tags[]` | `D` | DPDP/GDPR/US tags as signal relevance only. |
| `FD5.029` | `data_category_map` | `DF` | Canonical input/output/metadata/sensitive/sectoral/confidential/deidentified groups. |
| `FD5.030` | `data_category_map.*[].data_category_item` | `DF/H` | Category ID, label, group, feature/activity/subject links, sensitivity tier. |
| `FD5.031` | `data_category_map.sensitive_sectoral_confidential_groups` | `DF/H` | Sensitive, sectoral, confidential, and deidentified grouping. |
| `FD5.032` | `data_category_quality` | `D` | Quality marker for data category coverage. |
| `FD5.033` | `role_responsibility_map[]` | `DF/H` | Visible role-allocation map; no legal role determination. |
| `FD5.034` | `role_responsibility_map[].visible_role_and_canonical_role_signal` | `DF/H` | Normalize visible role language: controller, processor, service provider, fiduciary, etc. |
| `FD5.035` | `role_responsibility_map[].role_scope` | `H` | Scope of role language across features/data/categories/activities. |
| `FD5.036` | `role_responsibility_map[].dual_role_signal` | `H` | Customer-data vs provider-operational-data dual-role signal. |
| `FD5.037` | `role_responsibility_map[].documented_instruction_signal` | `DF/H` | Whether processing is limited to instructions/contract/config/API/prompts. |
| `FD5.038` | `role_responsibility_map[].secondary_use_restriction_signal` | `DF/H` | Visible no-sale/no-share/no-marketing/no-training/no-combining restrictions. |
| `FD5.039` | `recipient_vendor_map[]` | `DF/H` | Vendor/recipient/subprocessor/model-provider map. |
| `FD5.040` | `recipient_vendor_map[].ai_model_provider_and_subprocessor_signal` | `DF/H` | AI model provider and subprocessor visibility. |
| `FD5.041` | `recipient_vendor_map[].data_processing_feature_refs` | `D` | DC/PA/feature refs linked to recipient/vendor rows. |
| `FD5.042` | `recipient_vendor_map[].transfer_adtech_security_signals` | `DF/H` | Transfer, service-provider, sale/share/adtech, security assurance signals. |
| `FD5.043` | `party_chain_summary` | `D/H` | Visible party chain and unknown chain segments. |
| `FD5.044` | `role_vendor_chain_quality` | `D` | Quality marker for role/vendor chain. |
| `FD5.045` | `transfer_map` | `DF/H` | Cross-border/recipient/region/transfer-mechanism visibility map. |
| `FD5.046` | `transfer_map.transfer_scope` | `DF/H` | Origin/destination/recipient/data/activity refs. |
| `FD5.047` | `transfer_map.transfer_mechanism_signals` | `DF` | SCC/IDTA/adequacy/BCR/contractual/consent/local-only mechanism signals. |
| `FD5.048` | `transfer_map.dpdp_and_us_disclosure_signals` | `DF/H` | DPDP cross-border and US disclosure/sale/share signal handling. |
| `FD5.049` | `transfer_map.review_routes_and_evidence` | `D` | Transfer evidence, absence basis, and review routes. |
| `FD5.050` | `retention_deletion_map` | `DF/H` | Retention, storage, deletion, backup, log, vector, output, account-closure map. |
| `FD5.051` | `retention_deletion_map.retention_storage_signals` | `DF` | Retention period, duration, backup/log/vector/output/account closure signals. |
| `FD5.052` | `retention_deletion_map.deletion_erasure_scope_signals` | `DF/H` | Deletion, erasure, RAG separability, model-weight deletion/training context. |
| `FD5.053` | `retention_deletion_map.refs_confidence_limitations` | `D` | Refs, confidence, law tags, limitations. |
| `FD5.054` | `retention_deletion_quality` | `D` | Quality marker for retention/deletion visibility. |
| `FD5.055` | `rights_request_map` | `DF` | Rights/control request container. |
| `FD5.056` | `rights_request_map.rights_request_channels[]` | `DF` | Email/form/portal/account settings/cookie/DPO/grievance/support channels. |
| `FD5.057` | `rights_request_map.access_correction_deletion_portability_signals` | `DF` | Access/know, correction/rectification, deletion/erasure, portability signals. |
| `FD5.058` | `rights_request_map.optout_withdrawal_appeal_signals` | `DF/H` | Opt-out, consent withdrawal, appeal signals. |
| `FD5.059` | `rights_request_map.gpc_sale_share_limit_spi_signals` | `DF` | GPC/UOOM, Do Not Sell/Share, limit sensitive PI signals. |
| `FD5.060` | `rights_request_map.minor_grievance_signals` | `DF/H` | Minor/parental request and grievance/complaint signals. |
| `FD5.061` | `privacy_notice_map` | `DF` | Privacy notice signal container. |
| `FD5.062` | `privacy_notice_map.scope_categories_purposes_signals` | `DF/H` | Notice scope, data categories, purposes. |
| `FD5.063` | `privacy_notice_map.recipient_retention_rights_contact_signals` | `DF` | Recipient, retention, rights, contact disclosure. |
| `FD5.064` | `privacy_notice_map.ai_training_minor_sensitive_cookie_signals` | `DF/H` | AI processing, training/fine-tuning, children/minor, sensitive, cookie notices. |
| `FD5.065` | `ai_data_control_map` | `DF/H` | AI-specific data architecture/control map. |
| `FD5.066` | `ai_data_control_map.processing_provider_prompt_output_signals` | `DF/H` | AI processing, model provider, prompt/input handling, output handling. |
| `FD5.067` | `ai_data_control_map.embedding_rag_training_weight_signals` | `DF/H` | Embedding/vector, RAG, training/fine-tuning, no-training, model-weight separation. |
| `FD5.068` | `ai_data_control_map.confidentiality_human_access_security_signals` | `DF/H` | Prompt confidentiality, human/abuse review access, AI security threats. |
| `FD5.069` | `sensitive_data_map[]` | `DF/H` | Sensitive/special/sectoral data rows. |
| `FD5.070` | `minor_data_map` | `DF/H` | Children/minor/age/parental consent/safety/COPPA/DPDP/GDPR child signals. |
| `FD5.071` | `automated_decision_map[]` | `H` | Automated decision/profiling/scoring/ranking/recommendation rows. |
| `FD5.072` | `automated_decision_map[].controls` | `H` | Human intervention, explanation/appeal, impact assessment/bias audit signals. |
| `FD5.073` | `sensitive_minor_admt_law_tags` | `D` | Law relevance tags only; no applicability conclusions. |
| `FD5.074` | `ai_sensitive_minor_admt_quality` | `D` | Quality marker for AI/sensitive/minor/ADMT maps. |
| `FD5.075` | `security_control_map` | `DF` | Security/privacy safeguard container. |
| `FD5.076` | `security_control_map.safeguard_signals` | `DF` | Security safeguards, encryption, logging, incident, breach, vulnerability, SOC/ISO/trust. |
| `FD5.077` | `security_control_map.deidentification_ai_security_signals` | `DF/H` | Deidentification/pseudonymization/anonymization and AI threat controls. |
| `FD5.078` | `access_control_map` | `DF` | Account/admin/user/human-access controls. |
| `FD5.079` | `access_control_map.account_credential_mfa_rbac_admin_signals` | `DF` | Account access, credentials/API keys, MFA, RBAC, admin controls, authorized users. |
| `FD5.080` | `access_control_map.human_support_abuse_revocation_signals` | `DF/H` | Human/vendor access, support access, abuse/safety review, revocation/offboarding. |
| `FD5.081` | `tracking_technology_map` | `DF` | Cookie/tracker/adtech/pixel/consent/preference/opt-out/GPC/sale-share map. |
| `FD5.082` | `technical_metadata_map` | `DF` | Device/network/log/IP/browser/session/API/model-call metadata. |
| `FD5.083` | `security_access_tracking_quality` | `D` | Quality marker for security/access/tracking/metadata. |
| `FD5.084` | `agentic_data_map` | `DF/H` | Agentic/autonomous action data map. |
| `FD5.085` | `agentic_data_map.permission_action_control_signals` | `DF/H` | Permission scope, external access, read/write/transact/delete, logs, kill switch, circuit breaker, override. |
| `FD5.086` | `governance_assurance_map` | `DF/H` | Governance, assessment, audit, policy, training, diligence, minimization, purpose, owner signals. |
| `FD5.087` | `data_broker_signal` | `DF/H` | Data broker/resale/aggregation signal as evidence route only. |
| `FD5.088` | `sectoral_privacy_signal_map` | `DF/H` | Health/financial/employment/education/biometric sectoral signals. |
| `FD5.089` | `law_aware_signal_matrix` | `D` | Matrix from locked taxonomy across DPDP/GDPR/US groups. |
| `FD5.090` | `privacy_signal_matrix[]` | `D` | Report-ready integrated privacy signal rows with feature-aware statuses. |
| `FD5.091` | `law_privacy_matrix_completeness_summary` | `D` | Counts and matrix quality. |
| `FD5.092` | `report_table_projection` | `D` | Final-report table payloads without compliance verdicts. |
| `FD5.093` | `missing_signal_fields[]` | `D` | Every missing/unclear/conflicting/access-failed/unknown signal becomes a row. |
| `FD5.094` | `review_route_map[]` | `D` | Reviewer navigation map for visible and missing signals. |
| `FD5.095` | `evidence_limitations_quality` | `D` | Evidence support, limitations, quality markers, coverage summary. |
| `FD5.096` | `forensic_ledger_terminal_gates_and_handoff` | `D` | Ledger, terminal gates, repair flags, lock status, downstream handoff. |

---

## 7. Detailed FD Rules — Compressed

### FD5.001 — `target_data_provenance_profile`

```yaml
MODE: D
PURPOSE: Canonical Phase 05 object. Initialize schema and required child containers.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.002 — `input_manifest`

```yaml
MODE: D
PURPOSE: Record target/feature/legal/source inputs and missing input flags.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.003 — `deterministic_prepass_candidate_ledger`

```yaml
MODE: D
PURPOSE: Route-aware signal-hunter output: searched routes, hits, negative hits, candidate status, model-confirmation flags.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.004 — `anti_unknown_protocol_result`

```yaml
MODE: D
PURPOSE: Apply the status ladder; prohibit lazy UNKNOWN_NOT_SEARCHED.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.005 — `target_ref`

```yaml
MODE: D
PURPOSE: Copy target metadata from Phase 02 without re-deriving identity.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.006 — `feature_profile_ref_and_scope_status`

```yaml
MODE: D
PURPOSE: Copy feature IDs from Phase 03 and determine feature scope readiness.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.007 — `legal_cartography_ref_mode`

```yaml
MODE: D
PURPOSE: Use Phase 04 artifact/unit/control refs as navigation only.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.008 — `admitted_data_source_refs[]`

```yaml
MODE: D
PURPOSE: Admit only Phase 05 source classes with admission basis.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.009 — `blocked_source_refs[]`

```yaml
MODE: D
PURPOSE: Record sources blocked by Phase 05 source gate.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.010 — `evidence_basis_contract`

```yaml
MODE: D
PURPOSE: Require refs/absence basis for every substantive signal.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.011 — `feature_data_provenance[]`

```yaml
MODE: D/H
PURPOSE: One row per Phase 03 feature; semantic confirmation only for ambiguous data behavior.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.012 — `feature_data_provenance[].data_interaction_type`

```yaml
MODE: DF/H
PURPOSE: Candidate from verbs/source families; model confirms ambiguous feature behavior.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.013 — `feature_data_provenance[].personal_data_signal`

```yaml
MODE: DF/H
PURPOSE: Personal/PI signal based on data categories and explicit privacy language.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.014 — `feature_data_provenance[].data_subject_category[]`

```yaml
MODE: DF/H
PURPOSE: Who the data relates to: user, customer end user, employee, child, consumer, etc.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.015 — `feature_data_provenance[].collection_source[]`

```yaml
MODE: DF
PURPOSE: Source of data entry: user input, upload, API, integration, cookie, auth, logs.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.016 — `feature_data_provenance[].input_data_categories[]`

```yaml
MODE: DF
PURPOSE: Controlled input data categories.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.017 — `feature_data_provenance[].output_data_categories[]`

```yaml
MODE: DF/H
PURPOSE: Controlled output categories; model confirms inference/profile/score ambiguity.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.018 — `feature_data_provenance[].feature_high_signal_flags`

```yaml
MODE: H
PURPOSE: AI, embedding, training, vendor, retention, rights, sensitive, minor, ADMT flags.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.019 — `feature_data_provenance[].feature_privacy_signal_status_summary`

```yaml
MODE: D
PURPOSE: Counts by visibility status per feature.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.020 — `feature_data_provenance[].feature_review_route_refs[]`

```yaml
MODE: D
PURPOSE: Refs for downstream reviewer inspection.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.021 — `processing_activity_map[]`

```yaml
MODE: DF/H
PURPOSE: Processing activity ledger: feature + action + data category + stage + purpose.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.022 — `processing_activity_map[].processing_action_and_stage`

```yaml
MODE: DF/H
PURPOSE: Action/stage candidates from verbs/API/docs; model confirms broad/ambiguous language.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.023 — `processing_activity_map[].processing_purpose_signal`

```yaml
MODE: H
PURPOSE: Purpose label and visibility status; no lawful-basis conclusion.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.024 — `processing_activity_map[].purpose_to_feature_link`

```yaml
MODE: H
PURPOSE: Direct/indirect/global/unclear feature-purpose linkage.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.025 — `processing_activity_map[].personal_data_relevance`

```yaml
MODE: DF/H
PURPOSE: Whether linked activity involves personal data/PI signal.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.026 — `processing_activity_map[].ai_processing_context`

```yaml
MODE: DF/H
PURPOSE: AI/model/embedding/RAG/training/no-training context.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.027 — `processing_activity_map[].storage_disclosure_rights_context`

```yaml
MODE: DF/H
PURPOSE: Storage, disclosure/vendor, and rights/control context.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.028 — `processing_activity_map[].law_signal_tags[]`

```yaml
MODE: D
PURPOSE: DPDP/GDPR/US tags as signal relevance only.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.029 — `data_category_map`

```yaml
MODE: DF
PURPOSE: Canonical input/output/metadata/sensitive/sectoral/confidential/deidentified groups.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.030 — `data_category_map.*[].data_category_item`

```yaml
MODE: DF/H
PURPOSE: Category ID, label, group, feature/activity/subject links, sensitivity tier.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.031 — `data_category_map.sensitive_sectoral_confidential_groups`

```yaml
MODE: DF/H
PURPOSE: Sensitive, sectoral, confidential, and deidentified grouping.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.032 — `data_category_quality`

```yaml
MODE: D
PURPOSE: Quality marker for data category coverage.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.033 — `role_responsibility_map[]`

```yaml
MODE: DF/H
PURPOSE: Visible role-allocation map; no legal role determination.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.034 — `role_responsibility_map[].visible_role_and_canonical_role_signal`

```yaml
MODE: DF/H
PURPOSE: Normalize visible role language: controller, processor, service provider, fiduciary, etc.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.035 — `role_responsibility_map[].role_scope`

```yaml
MODE: H
PURPOSE: Scope of role language across features/data/categories/activities.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.036 — `role_responsibility_map[].dual_role_signal`

```yaml
MODE: H
PURPOSE: Customer-data vs provider-operational-data dual-role signal.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.037 — `role_responsibility_map[].documented_instruction_signal`

```yaml
MODE: DF/H
PURPOSE: Whether processing is limited to instructions/contract/config/API/prompts.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.038 — `role_responsibility_map[].secondary_use_restriction_signal`

```yaml
MODE: DF/H
PURPOSE: Visible no-sale/no-share/no-marketing/no-training/no-combining restrictions.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.039 — `recipient_vendor_map[]`

```yaml
MODE: DF/H
PURPOSE: Vendor/recipient/subprocessor/model-provider map.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.040 — `recipient_vendor_map[].ai_model_provider_and_subprocessor_signal`

```yaml
MODE: DF/H
PURPOSE: AI model provider and subprocessor visibility.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.041 — `recipient_vendor_map[].data_processing_feature_refs`

```yaml
MODE: D
PURPOSE: DC/PA/feature refs linked to recipient/vendor rows.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.042 — `recipient_vendor_map[].transfer_adtech_security_signals`

```yaml
MODE: DF/H
PURPOSE: Transfer, service-provider, sale/share/adtech, security assurance signals.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.043 — `party_chain_summary`

```yaml
MODE: D/H
PURPOSE: Visible party chain and unknown chain segments.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.044 — `role_vendor_chain_quality`

```yaml
MODE: D
PURPOSE: Quality marker for role/vendor chain.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.045 — `transfer_map`

```yaml
MODE: DF/H
PURPOSE: Cross-border/recipient/region/transfer-mechanism visibility map.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.046 — `transfer_map.transfer_scope`

```yaml
MODE: DF/H
PURPOSE: Origin/destination/recipient/data/activity refs.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.047 — `transfer_map.transfer_mechanism_signals`

```yaml
MODE: DF
PURPOSE: SCC/IDTA/adequacy/BCR/contractual/consent/local-only mechanism signals.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.048 — `transfer_map.dpdp_and_us_disclosure_signals`

```yaml
MODE: DF/H
PURPOSE: DPDP cross-border and US disclosure/sale/share signal handling.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.049 — `transfer_map.review_routes_and_evidence`

```yaml
MODE: D
PURPOSE: Transfer evidence, absence basis, and review routes.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.050 — `retention_deletion_map`

```yaml
MODE: DF/H
PURPOSE: Retention, storage, deletion, backup, log, vector, output, account-closure map.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.051 — `retention_deletion_map.retention_storage_signals`

```yaml
MODE: DF
PURPOSE: Retention period, duration, backup/log/vector/output/account closure signals.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.052 — `retention_deletion_map.deletion_erasure_scope_signals`

```yaml
MODE: DF/H
PURPOSE: Deletion, erasure, RAG separability, model-weight deletion/training context.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.053 — `retention_deletion_map.refs_confidence_limitations`

```yaml
MODE: D
PURPOSE: Refs, confidence, law tags, limitations.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.054 — `retention_deletion_quality`

```yaml
MODE: D
PURPOSE: Quality marker for retention/deletion visibility.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.055 — `rights_request_map`

```yaml
MODE: DF
PURPOSE: Rights/control request container.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.056 — `rights_request_map.rights_request_channels[]`

```yaml
MODE: DF
PURPOSE: Email/form/portal/account settings/cookie/DPO/grievance/support channels.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.057 — `rights_request_map.access_correction_deletion_portability_signals`

```yaml
MODE: DF
PURPOSE: Access/know, correction/rectification, deletion/erasure, portability signals.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.058 — `rights_request_map.optout_withdrawal_appeal_signals`

```yaml
MODE: DF/H
PURPOSE: Opt-out, consent withdrawal, appeal signals.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.059 — `rights_request_map.gpc_sale_share_limit_spi_signals`

```yaml
MODE: DF
PURPOSE: GPC/UOOM, Do Not Sell/Share, limit sensitive PI signals.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.060 — `rights_request_map.minor_grievance_signals`

```yaml
MODE: DF/H
PURPOSE: Minor/parental request and grievance/complaint signals.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.061 — `privacy_notice_map`

```yaml
MODE: DF
PURPOSE: Privacy notice signal container.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.062 — `privacy_notice_map.scope_categories_purposes_signals`

```yaml
MODE: DF/H
PURPOSE: Notice scope, data categories, purposes.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.063 — `privacy_notice_map.recipient_retention_rights_contact_signals`

```yaml
MODE: DF
PURPOSE: Recipient, retention, rights, contact disclosure.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.064 — `privacy_notice_map.ai_training_minor_sensitive_cookie_signals`

```yaml
MODE: DF/H
PURPOSE: AI processing, training/fine-tuning, children/minor, sensitive, cookie notices.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.065 — `ai_data_control_map`

```yaml
MODE: DF/H
PURPOSE: AI-specific data architecture/control map.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.066 — `ai_data_control_map.processing_provider_prompt_output_signals`

```yaml
MODE: DF/H
PURPOSE: AI processing, model provider, prompt/input handling, output handling.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.067 — `ai_data_control_map.embedding_rag_training_weight_signals`

```yaml
MODE: DF/H
PURPOSE: Embedding/vector, RAG, training/fine-tuning, no-training, model-weight separation.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.068 — `ai_data_control_map.confidentiality_human_access_security_signals`

```yaml
MODE: DF/H
PURPOSE: Prompt confidentiality, human/abuse review access, AI security threats.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.069 — `sensitive_data_map[]`

```yaml
MODE: DF/H
PURPOSE: Sensitive/special/sectoral data rows.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.070 — `minor_data_map`

```yaml
MODE: DF/H
PURPOSE: Children/minor/age/parental consent/safety/COPPA/DPDP/GDPR child signals.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.071 — `automated_decision_map[]`

```yaml
MODE: H
PURPOSE: Automated decision/profiling/scoring/ranking/recommendation rows.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.072 — `automated_decision_map[].controls`

```yaml
MODE: H
PURPOSE: Human intervention, explanation/appeal, impact assessment/bias audit signals.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.073 — `sensitive_minor_admt_law_tags`

```yaml
MODE: D
PURPOSE: Law relevance tags only; no applicability conclusions.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.074 — `ai_sensitive_minor_admt_quality`

```yaml
MODE: D
PURPOSE: Quality marker for AI/sensitive/minor/ADMT maps.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.075 — `security_control_map`

```yaml
MODE: DF
PURPOSE: Security/privacy safeguard container.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.076 — `security_control_map.safeguard_signals`

```yaml
MODE: DF
PURPOSE: Security safeguards, encryption, logging, incident, breach, vulnerability, SOC/ISO/trust.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.077 — `security_control_map.deidentification_ai_security_signals`

```yaml
MODE: DF/H
PURPOSE: Deidentification/pseudonymization/anonymization and AI threat controls.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.078 — `access_control_map`

```yaml
MODE: DF
PURPOSE: Account/admin/user/human-access controls.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.079 — `access_control_map.account_credential_mfa_rbac_admin_signals`

```yaml
MODE: DF
PURPOSE: Account access, credentials/API keys, MFA, RBAC, admin controls, authorized users.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.080 — `access_control_map.human_support_abuse_revocation_signals`

```yaml
MODE: DF/H
PURPOSE: Human/vendor access, support access, abuse/safety review, revocation/offboarding.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.081 — `tracking_technology_map`

```yaml
MODE: DF
PURPOSE: Cookie/tracker/adtech/pixel/consent/preference/opt-out/GPC/sale-share map.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.082 — `technical_metadata_map`

```yaml
MODE: DF
PURPOSE: Device/network/log/IP/browser/session/API/model-call metadata.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.083 — `security_access_tracking_quality`

```yaml
MODE: D
PURPOSE: Quality marker for security/access/tracking/metadata.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.084 — `agentic_data_map`

```yaml
MODE: DF/H
PURPOSE: Agentic/autonomous action data map.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.085 — `agentic_data_map.permission_action_control_signals`

```yaml
MODE: DF/H
PURPOSE: Permission scope, external access, read/write/transact/delete, logs, kill switch, circuit breaker, override.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.086 — `governance_assurance_map`

```yaml
MODE: DF/H
PURPOSE: Governance, assessment, audit, policy, training, diligence, minimization, purpose, owner signals.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.087 — `data_broker_signal`

```yaml
MODE: DF/H
PURPOSE: Data broker/resale/aggregation signal as evidence route only.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.088 — `sectoral_privacy_signal_map`

```yaml
MODE: DF/H
PURPOSE: Health/financial/employment/education/biometric sectoral signals.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.089 — `law_aware_signal_matrix`

```yaml
MODE: D
PURPOSE: Matrix from locked taxonomy across DPDP/GDPR/US groups.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.090 — `privacy_signal_matrix[]`

```yaml
MODE: D
PURPOSE: Report-ready integrated privacy signal rows with feature-aware statuses.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.091 — `law_privacy_matrix_completeness_summary`

```yaml
MODE: D
PURPOSE: Counts and matrix quality.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.092 — `report_table_projection`

```yaml
MODE: D
PURPOSE: Final-report table payloads without compliance verdicts.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.093 — `missing_signal_fields[]`

```yaml
MODE: D
PURPOSE: Every missing/unclear/conflicting/access-failed/unknown signal becomes a row.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.094 — `review_route_map[]`

```yaml
MODE: D
PURPOSE: Reviewer navigation map for visible and missing signals.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.095 — `evidence_limitations_quality`

```yaml
MODE: D
PURPOSE: Evidence support, limitations, quality markers, coverage summary.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```

### FD5.096 — `forensic_ledger_terminal_gates_and_handoff`

```yaml
MODE: D
PURPOSE: Ledger, terminal gates, repair flags, lock status, downstream handoff.
DERIVE_IF: The relevant upstream references, deterministic candidates, or source-route basis exist.
VALUE_RULE: Use controlled values, reference-first evidence, and the Anti-Unknown Protocol. Preserve feature/data/source links.
CONFIDENCE_RULE: Confidence measures visibility and mapping reliability only, not legal correctness.
EXCLUDE_IF: Do not output legal applicability, compliance, liability, enforceability, risk score, or registry truth.
FALLBACK_IF: Apply status ladder; never default to UNKNOWN_NOT_SEARCHED without source-route proof.
LEDGER_RULE: Record field derivation, evidence/absence basis, and any repair flag.
```


---

## 8. Law-Aware Privacy Signal Taxonomy

# 05 — LAW_AWARE_PRIVACY_SIGNAL_TAXONOMY_LOCK

Status: LOCKED
Prompt Section Name: `LAW_AWARE_PRIVACY_SIGNAL_TAXONOMY`
Use: Mandatory Phase 05 taxonomy base and later report rendering source.
Boundary: This table supports data-provenance and privacy-control visibility mapping. It does not authorize compliance certification, legal advice, enforceability review, or registry/exposure conclusions.

## Canonical Visibility Status Enum

```yaml
visibility_status:
  - VISIBLE_CONTROL_PRESENT
  - VISIBLE_BUT_CONTROL_WEAK_OR_UNCLEAR
  - VISIBLE_DATA_PROCESSING_NO_CONTROL_FOUND
  - NOT_VISIBLE_AFTER_TARGETED_SEARCH
  - ACCESS_FAILED
  - UNKNOWN_NOT_SEARCHED
  - CONFLICTING_SIGNALS
  - NOT_APPLICABLE_CONTEXTUAL
```

## Mandatory Evidence Basis

```yaml
evidence_basis:
  - feature_ref
  - source_ref
  - artifact_ref
  - unit_ref
  - control_ref_id
  - quote_ref_or_location_ref
  - absence_basis
  - confidence
```

## Integrated DPDP–GDPR–US Signal Table

| Signal field | Connected laws | Integrated scope | Our canonical field mapping |
|---|---|---|---|
| Personal data / personal information presence | DPDP; GDPR/UK GDPR; CCPA/CPRA; Colorado CPA; other US state privacy laws | Whether the feature processes data relating to an identifiable individual, household, user, customer, employee, applicant, patient, student, consumer, or child. | `feature_data_provenance[].personal_data_signal` |
| Digital personal data signal | DPDP | Whether data is digital or digitized personal data processed by the service. | `law_aware_signal_matrix.dpdp.digital_personal_data_signal` |
| Personal information / household signal | CCPA/CPRA | Whether data relates to a California consumer or household, including identifiers, internet activity, geolocation, inferences, etc. | `law_aware_signal_matrix.us_state_privacy.personal_information_signal` |
| Data subject / data principal / consumer category | DPDP; GDPR; CCPA/CPRA; Colorado CPA | Who the data belongs to: direct user, customer end user, employee, job applicant, child, consumer, business contact, patient, student, household, visitor. | `feature_data_provenance[].data_subject_category` |
| Data source / collection origin | DPDP; GDPR Art. 13/14; CCPA/CPRA; Colorado CPA | Where data enters from: user input, customer upload, API, integration, browser/device, cookies, auth, model metadata, logs, import. | `feature_data_provenance[].collection_source` |
| Feature-linked input data | All privacy regimes; AI service docs | Feature-level input category: prompt, file, image, voice, transcript, CRM record, email, source code, HR record, payment info, health data, biometric signal. | `feature_data_provenance[].input_data_categories[]` |
| Feature-linked output data | GDPR; CCPA/CPRA; AI governance; consumer protection | Whether the feature generates output that may contain personal data, inference, profile, decision, recommendation, score, label, synthetic media, or user-facing response. | `feature_data_provenance[].output_data_categories[]` |
| Processing action | DPDP; GDPR Art. 4; US state privacy laws | What happens to data: collect, store, analyze, generate, infer, classify, rank, retrieve, disclose, share, sell, embed, transmit, delete, train, fine-tune. | `processing_activity_map[].processing_action` |
| Purpose signal | DPDP; GDPR; CCPA/CPRA; Colorado CPA | Why data is processed: service provision, AI inference, personalization, analytics, security, fraud, billing, support, marketing, model improvement, legal compliance. | `processing_activity_map[].purpose_signal` |
| Purpose-to-feature link | DPDP; GDPR accountability; CCPA/CPRA; Colorado CPA | Whether each processing purpose is tied to a specific feature rather than generic privacy-policy language. | `processing_activity_map[].feature_purpose_link` |
| Legal basis / lawful ground signal | GDPR Art. 6; DPDP consent/legitimate use; US consent/notice contexts | Whether public docs disclose a legal basis or processing ground. | `law_aware_signal_matrix[].lawful_basis_or_processing_ground_signal` |
| Consent signal | DPDP; GDPR; COPPA; CCPA child-sale opt-in; Colorado sensitive-data consent | Whether consent is visible as a basis/control and whether withdrawal/opt-out mechanics are visible. | `privacy_control_map[].consent_signal` |
| Consent withdrawal / opt-out signal | DPDP; GDPR; CCPA/CPRA; Colorado/UOOM | Whether users can withdraw consent, opt out of sale/share/targeted ads/profiling, or send universal opt-out/GPC-style signal. | `privacy_control_map[].withdrawal_or_opt_out_signal` |
| Notice at collection / privacy notice signal | DPDP; GDPR Art. 13/14; CCPA/CPRA; Colorado CPA | Whether docs tell users what is collected, why, categories, recipients, rights, retention, contact, and AI processing where relevant. | `privacy_notice_map.notice_at_collection_signal` |
| AI processing disclosure | GDPR transparency; DPDP notice; CCPA/CPRA; EU AI Act Art. 50 adjacent; FTC deception risk | Whether docs disclose AI/model processing, model-provider transmission, and AI interaction. | `ai_data_control_map.ai_processing_disclosure_signal` |
| Controller / processor / fiduciary role signal | GDPR; DPDP; CCPA/CPRA; Colorado CPA | Whether docs identify role allocation: controller, processor, business, service provider, fiduciary, sub-processor, independent controller. | `role_responsibility_map[].role_signal` |
| Dual-role processing signal | GDPR; CCPA/CPRA; DPDP | Whether provider acts as processor/service provider for customer data but controller/business/fiduciary for billing, security, fraud, analytics, legal obligations. | `role_responsibility_map[].dual_role_signal` |
| Documented instructions signal | GDPR Art. 28; DPDP processor governance; CCPA service-provider contracts; Colorado processor contracts | Whether processing is limited to customer instructions, contract terms, DPA, configuration, prompts, or API calls. | `processor_control_map.documented_instruction_signal` |
| Processor / service provider restriction signal | GDPR Art. 28; CCPA/CPRA; Colorado CPA | Whether docs restrict selling, sharing, marketing, combining, profiling, or secondary use of customer personal data. | `processor_control_map.secondary_use_restriction_signal` |
| Subprocessor / vendor / third-party recipient signal | GDPR Art. 28; SCCs; CCPA/CPRA; Colorado CPA; DPDP processors | Whether model providers, cloud vendors, analytics, auth, payment, security, hosting, or subprocessors are disclosed/cross-referenced. | `recipient_vendor_map[].recipient_category` |
| AI model provider signal | GDPR/DPDP processor chain; CCPA service provider; AI-specific docs | Whether docs identify or disclose third-party AI model providers or state model-provider involvement. | `recipient_vendor_map[].ai_model_provider_signal` |
| International transfer / cross-border signal | GDPR Chapter V/SCCs; UK IDTA; DPDP cross-border transfer; US state disclosures | Whether data may leave jurisdiction and whether transfer safeguards are visible. | `transfer_map.cross_border_transfer_signal` |
| SCC / transfer mechanism signal | GDPR; UK GDPR | Whether SCCs, UK IDTA, adequacy, TIA, or equivalent transfer mechanism is referenced. | `transfer_map.transfer_mechanism_signal` |
| Retention period / storage duration signal | DPDP; GDPR storage limitation; CCPA/CPRA; Colorado CPA | Whether docs disclose retention periods, criteria, backups, deletion timing, account-closure retention. | `retention_deletion_map.retention_signal` |
| Deletion / erasure / disposal signal | DPDP; GDPR Art. 17; CCPA delete; Colorado delete | Whether deletion is described for input, output, embeddings, logs, backups, account data. | `retention_deletion_map.deletion_signal` |
| RAG / vector store / embedding separability signal | GDPR erasure architecture; DPDP deletion; CCPA deletion; AI DPA architecture | Whether docs disclose external embeddings/vector records that are separable/deletable and not baked into model weights. | `ai_data_control_map.rag_vector_store_signal` |
| Fine-tuning / model-training use signal | GDPR; DPDP; CCPA/CPRA; Colorado; FTC | Whether data is used/not used/may be used for training, fine-tuning, RLHF, model improvement, or model weights. | `ai_data_control_map.model_training_or_finetuning_signal` |
| No-training / no-fine-tuning control | GDPR; DPDP; CCPA/CPRA; Colorado | Whether docs expressly state no training/fine-tuning on customer personal data or user inputs. | `ai_data_control_map.no_training_control_status` |
| Sensitive data / special-category signal | GDPR Art. 9; CCPA sensitive PI; Colorado sensitive data; DPDP; HIPAA/GLBA where applicable | Whether sensitive data is processed or prohibited. | `sensitive_data_map[].sensitive_data_signal` |
| Biometric data signal | GDPR special category; CCPA sensitive PI; Colorado sensitive data; BIPA/CUBI/Washington biometric laws | Whether feature processes face, fingerprint, voiceprint, biometric identifier/template, diarization, emotion, liveness, identity verification. | `sensitive_data_map[].biometric_signal` |
| Children / minors signal | DPDP children; GDPR child consent; COPPA; CCPA under-16; child privacy laws | Whether product is accessible to minors/children or processes child data; age gate/parental consent/minor safeguards. | `minor_data_map.children_or_minor_signal` |
| COPPA under-13 signal | COPPA | Whether product is child-directed or has actual knowledge of collecting personal information from children under 13. | `law_aware_signal_matrix.us_children_privacy.coppa_under_13_signal` |
| Data subject / consumer rights channel | DPDP; GDPR; CCPA/CPRA; Colorado CPA | Whether user can access, correct, delete, port, withdraw, opt out, limit, appeal, or contact privacy support. | `rights_request_map[].right_type_signal` |
| Access / know signal | GDPR access; CCPA know; Colorado access; DPDP access-style rights | Whether docs disclose access/know request methods and data categories. | `rights_request_map.access_or_know_signal` |
| Correction signal | GDPR rectification; CCPA correction; Colorado correction; DPDP correction | Whether docs disclose correction/rectification request method. | `rights_request_map.correction_signal` |
| Portability signal | GDPR portability; CCPA portability/know; Colorado portable format | Whether docs disclose portable export/download/transmit rights. | `rights_request_map.portability_signal` |
| Appeal signal | Colorado CPA; Virginia/Connecticut-style laws | Whether denied rights requests can be appealed. | `rights_request_map.appeal_signal` |
| GPC / universal opt-out signal | CCPA/CPRA; Colorado CPA; Connecticut-style laws | Whether docs disclose browser-level opt-out/GPC/UOOM handling. | `privacy_control_map.global_privacy_control_signal` |
| Sale / sharing / targeted advertising signal | CCPA/CPRA; Colorado CPA; US state privacy laws | Whether PI is sold/shared for cross-context behavioral advertising or processed for targeted advertising. | `privacy_control_map.sale_share_targeted_ads_signal` |
| Limit sensitive PI signal | CCPA/CPRA | Whether users can limit use/disclosure of sensitive personal information. | `privacy_control_map.limit_sensitive_pi_signal` |
| Automated decisioning / profiling signal | GDPR Art. 22; CCPA/CPRA ADMT regs; Colorado profiling/consequential decisions; DPDP adjacency | Whether feature makes/substantially assists consequential decisions. | `automated_decision_map[].automated_decisioning_signal` |
| Human intervention / HITL signal | GDPR Art. 22; Colorado AI adjacent; AI governance; DPDP accountability | Whether human review/intervention is visible for decisions, outputs, moderation, scoring, or agentic actions. | `automated_decision_map[].human_intervention_signal` |
| Risk / impact assessment signal | GDPR DPIA; Colorado AI; California risk/ADMT regs; AI governance docs | Whether DPIA, risk assessment, bias audit, impact assessment, or AI impact assessment is visible. | `governance_assurance_map.impact_assessment_signal` |
| Security safeguards signal | DPDP; GDPR Art. 32; CCPA reasonable security; Colorado; FTC Act | Whether encryption, access control, MFA, logging, monitoring, vulnerability disclosure, SOC/ISO, incident response are visible. | `security_control_map.security_safeguards_signal` |
| Breach notice signal | DPDP; GDPR; US state breach laws; CCPA private action context | Whether breach/incident notification process, timing, affected parties, authority notice, mitigation are visible. | `security_control_map.breach_notice_signal` |
| Audit log / processing log signal | GDPR accountability/records; Colorado AI adjacent; AI agent governance; DPA | Whether action logs, access logs, model-call logs, processing records, audit trails, or agent action logs are visible. | `governance_assurance_map.audit_log_signal` |
| Accountability owner / contact channel | DPDP grievance/contact; GDPR DPO/contact; CCPA methods; Colorado notice | Whether privacy/legal/security/DPO/grievance/contact method is visible. | `contact_channel_map.privacy_contact_signal` |
| Grievance / complaint mechanism | DPDP grievance; GDPR supervisory authority/contact; CCPA request methods; Colorado appeal/contact | Whether user can complain, escalate, appeal, contact DPO/privacy officer, or lodge authority complaint. | `contact_channel_map.grievance_or_complaint_signal` |
| Cookie / tracker signal | GDPR/ePrivacy; CCPA/CPRA sale/share; Colorado targeted advertising | Whether cookies, analytics, adtech, tracking pixels, SDKs, behavioral advertising, consent banner, cookie policy are visible. | `tracking_technology_map.cookie_tracker_signal` |
| Device / network / log data signal | GDPR; CCPA/CPRA; Colorado; DPDP | Whether IP, device info, browser, session, timestamps, error logs, referral URLs, token counts, latency, API logs are collected. | `technical_metadata_map.device_network_log_signal` |
| Payment / billing data signal | GDPR; CCPA/CPRA; DPDP; PCI/security | Whether billing address, payment processor, invoices, subscription data, financial account info are processed. | `data_category_map.payment_billing_signal` |
| Health data / PHI signal | HIPAA; FTC HBNR; state health privacy; GDPR special category; CCPA sensitive PI | Whether feature processes health, wellness, diagnosis, treatment, PHI, mental health, therapy, medical decision support. | `sectoral_privacy_signal_map.health_data_signal` |
| Financial / credit / insurance signal | GLBA; FCRA; state privacy; GDPR; CCPA/CPRA; Colorado consequential decisions | Whether feature processes creditworthiness, financial account, insurance eligibility, lending, fraud scoring, transaction data. | `sectoral_privacy_signal_map.financial_credit_signal` |
| Employment / worker data signal | GDPR; CCPA employment/personnel context; Colorado AI Act; NYC LL 144; employee privacy | Whether feature processes employee/applicant/performance/productivity/hiring/termination/task allocation data. | `sectoral_privacy_signal_map.employment_worker_signal` |
| Education / student data signal | FERPA/COPPA/state student privacy; GDPR; Colorado consequential decisions | Whether feature processes student records, grading, admissions, learning analytics, school/minor data. | `sectoral_privacy_signal_map.education_student_signal` |
| Data broker / resale signal | California Delete Act/CCPA data broker; Vermont/Texas data broker laws; CCPA sale/share | Whether company buys/sells/shares/aggregates personal data outside direct service relationship. | `privacy_control_map.data_broker_signal` |
| Anonymized / aggregated / de-identified data signal | GDPR; CCPA; DPDP anonymized outside-scope logic | Whether docs disclose aggregate/deidentified analytics and re-identification limits. | `data_category_map.aggregated_deidentified_signal` |
| Pseudonymization / de-identification control | GDPR; CCPA; DPDP safeguards | Whether de-identification/pseudonymization/anonymization is visible. | `security_control_map.deidentification_signal` |
| Data minimization / overcollection signal | GDPR; DPDP; Colorado; FTC | Whether categories appear tied to feature need or docs disclose minimization. | `privacy_control_map.data_minimization_signal` |
| Purpose limitation / secondary use signal | GDPR; DPDP; CCPA service-provider limits; Colorado | Whether docs restrict processing to stated purposes and disclose secondary uses. | `privacy_control_map.purpose_limitation_signal` |
| Onward disclosure / third-party sharing signal | GDPR recipients; DPDP processors; CCPA disclosure/sale/share; Colorado | Whether categories of third parties/recipients and purposes are visible. | `recipient_vendor_map.onward_disclosure_signal` |
| User-generated confidential data signal | GDPR/DPDP/US privacy where personal; confidentiality/NDA exposure | Whether users can upload client data, internal docs, confidential records, source code, contracts, private files. | `data_category_map.confidential_user_content_signal` |
| Prompt / input confidentiality signal | GDPR/DPDP/CCPA if personal data; FTC deception risk | Whether prompts/inputs are confidential, not used for training, restricted from human review, or covered by enterprise controls. | `ai_data_control_map.prompt_confidentiality_signal` |
| Human reviewer / vendor employee access signal | GDPR processor access; DPDP safeguards; CCPA service-provider; security obligations | Whether employees/contractors/vendor reviewers may access inputs/outputs/logs and controls. | `access_control_map.human_access_signal` |
| Access control / authentication signal | GDPR Art. 32; DPDP security; US reasonable security | Whether accounts, MFA, credentials, RBAC, API keys, auth providers, unauthorized access notice are visible. | `access_control_map.access_control_signal` |
| Agentic action data signal | UETA/electronic agent; GDPR/CCPA data logs; DPDP processing; Colorado AI adjacent | Whether autonomous agents read/write/transact/delete data, create logs, access third-party systems, or affect individuals. | `agentic_data_map.agentic_action_data_signal` |
| Permission scope / kill switch / circuit breaker signal | AI governance; agentic addendum; security/accountability; privacy where actions process personal data | Whether agent permissions, monetary limits, rate limits, kill switches, logs, override, rollback are visible. | `agentic_data_map.agent_control_signal` |
| Model inversion / prompt injection data-leakage control | GDPR/DPDP/security; FTC Act; CCPA reasonable security; AI security docs | Whether docs disclose/control prompt injection, model inversion, data extraction, abuse monitoring, input sanitization. | `security_control_map.ai_security_threat_control_signal` |
| Public-footprint absence basis | Runtime evidence law; all laws indirectly | Whether absence is based on targeted search, access failure, unknown search, or not applicable. | `missing_signal_fields[].absence_basis` |
| Compliance evidence status | All | Controlled visibility status for each signal. This is not a legal verdict. | `privacy_signal_matrix[].visibility_status` |
| Reviewer route / doc route | All | Which legal cartography refs/source refs a human reviewer should inspect to decide compliance. | `privacy_signal_matrix[].review_route_refs[]` |

## Canonical Output Spine To Carry This Taxonomy

```json
{
  "data_provenance_forensic_ledger": {},
  "data_provenance_trace": {},
  "target_data_provenance_profile": {
    "target_ref": {},
    "feature_data_provenance": [],
    "processing_activity_map": [],
    "data_category_map": {},
    "role_responsibility_map": [],
    "recipient_vendor_map": [],
    "transfer_map": {},
    "retention_deletion_map": {},
    "rights_request_map": {},
    "privacy_notice_map": {},
    "ai_data_control_map": {},
    "sensitive_data_map": [],
    "minor_data_map": {},
    "automated_decision_map": [],
    "security_control_map": {},
    "access_control_map": {},
    "tracking_technology_map": {},
    "agentic_data_map": {},
    "law_aware_signal_matrix": {
      "dpdp": {},
      "gdpr_uk_gdpr": {},
      "us_state_privacy": {},
      "us_children_privacy": {},
      "us_sectoral_privacy": {}
    },
    "privacy_signal_matrix": [],
    "missing_signal_fields": [],
    "review_route_map": [],
    "evidence": {},
    "limitations": []
  }
}
```


---

## 9. Terminal Gates — Separate From FD Rows

```yaml
G5.001_OBJECT_SCHEMA_GATE:
  pass_if:
    output contains exactly:
      - data_provenance_forensic_ledger
      - data_provenance_trace
      - target_data_provenance_profile

G5.002_SOURCE_GATE:
  pass_if:
    only admitted Phase 05 source classes are used
  fail_if:
    marketing-only, pricing, blog/changelog, third-party commentary, registry evidence, or final report narrative enters the phase without upstream data-processing admission

G5.003_DETERMINISTIC_PREPASS_GATE:
  pass_if:
    deterministic_prepass_candidate_ledger exists and records expected routes, searched routes, candidate hits, explicit negative hits, candidate statuses, and model-confirmation flags

G5.004_ANTI_UNKNOWN_GATE:
  pass_if:
    UNKNOWN_NOT_SEARCHED appears only with expected_source_route, actual_search_or_review_basis, why_unknown, review_question, missing_signal_fields row, and review_route_map row where possible

G5.005_FEATURE_ROW_GATE:
  pass_if:
    every Phase 03 feature has feature_data_provenance row unless feature profile unavailable

G5.006_REFERENCE_FIRST_GATE:
  pass_if:
    output stores refs/location refs, not long legal text or clause quotes

G5.007_VISIBILITY_STATUS_GATE:
  pass_if:
    every substantive privacy/data signal uses canonical visibility_status enum

G5.008_EVIDENCE_BASIS_GATE:
  pass_if:
    every substantive signal has evidence_basis or absence_basis

G5.009_ABSENCE_BASIS_GATE:
  pass_if:
    NOT_VISIBLE_AFTER_TARGETED_SEARCH, ACCESS_FAILED, UNKNOWN_NOT_SEARCHED, and NOT_APPLICABLE_CONTEXTUAL each carry valid basis

G5.010_LAW_AWARE_TAXONOMY_GATE:
  pass_if:
    LAW_AWARE_PRIVACY_SIGNAL_TAXONOMY_LOCK_v1 is represented in law_aware_signal_matrix and privacy_signal_matrix

G5.011_NO_COMPLIANCE_VERDICT_GATE:
  pass_if:
    output contains no compliance/legal/liability/risk/registry verdict language

G5.012_NO_LAW_APPLICABILITY_GATE:
  pass_if:
    law tags are signal relevance only and no law is declared applicable

G5.013_NO_REGISTRY_GATE:
  pass_if:
    no threat IDs, registry TRUE/FALSE, exposure statuses, pain tiers, velocity, or registry row truth appears

G5.014_NO_FINAL_REPORT_NARRATIVE_GATE:
  pass_if:
    output is structured data only, not client-facing report prose

G5.015_REVIEW_ROUTE_GATE:
  pass_if:
    visible/missing/unclear/conflicting/access-failed signals have review_route_map entries where possible

G5.016_REPORT_PROJECTION_GATE:
  pass_if:
    privacy_signal_matrix and missing_signal_fields include report-ready projections for downstream report use

G5.017_LEDGER_COMPLETENESS_GATE:
  pass_if:
    ledger records inputs, source gates, blocked sources, candidate ledger, anti-unknown result, feature rows, signal rows, missing rows, review routes, limitations, and terminal gates

G5.018_LOCK_GATE:
  pass_if:
    all mandatory gates pass
  fail_action:
    output lock_status = REPAIR_REQUIRED or CONTROLLED_FAILURE
```

---

## 10. Handoff Contract

Allowed downstream fields:

```yaml
handoff_allowed_fields:
  - feature_refs
  - data_category_refs
  - processing_activity_refs
  - role_map_refs
  - recipient_vendor_refs
  - legal_cartography_refs
  - law_signal_row_ids
  - privacy_signal_ids
  - missing_signal_ids
  - review_route_ids
  - evidence refs
  - limitations
  - quality markers
  - report_table_projection
  - report_gap_projection
```

Forbidden downstream claims:

```yaml
handoff_forbidden_fields:
  - compliance verdicts
  - law applicability conclusions
  - legal advice
  - risk scores
  - registry statuses
  - liability findings
  - enforceability conclusions
```

---

## 11. Lock Statement

```text
Phase 05 is locked only if schema, source gate, deterministic prepass, Anti-Unknown Protocol, taxonomy coverage, feature rows, signal matrix, missing signal map, review routes, evidence refs, forbidden-conclusion gates, and report projection gates pass.
```
