# STAGE6A_FIELD_DERIVATION_INSTRUCTIONS_v1

Status: LOCKED DESIGN ARTIFACT — not yet wired into runtime prompt path.
Scope: Stage 6A Legal Document Cartography semantic classification.
Purpose: Convert verified legal/governance source diligence and existing repo vocabulary into field-by-field derivation rules so the Stage 6A model does not fill the schema with weak, generic, or omitted entries.

---

## 0. Authority and boundary

Stage 6A is the legal/governance document cartography layer. It maps admitted legal/governance documents into document inventory, legal-unit classifications, control signals, document relationships, mismatches, and feature-to-legal-unit navigation for Stage 7.

Stage 6A does **not**:

- discover product features;
- decide registry threat statuses;
- produce final exposure findings;
- render the Stage 9 report;
- create Vault/Assembly handoff fields;
- give legal advice or compliance verdicts;
- ingest product pages as legal documents unless the source admission layer has already proved an explicit legal/governance URL/title document.

The model must use only existing deterministic IDs supplied in the semantic packet. It must not invent document IDs, legal unit IDs, feature IDs, data-flow IDs, source refs, control IDs, threat IDs, or report fields.

---

## 1. Sarvam legal/governance baseline used to calibrate this instruction block

This baseline is not a Sarvam-specific prompt. It is the calibration example used to define general derivation logic.

### 1.1 Documents observed

- `Terms of Service` — legal_profile / core terms document.
- `End User License Agreement` — legal_profile / software license document.
- `Privacy Policy` — governance_profile / privacy and data processing document.
- `Trust Center` — governance_profile / security, compliance, operational controls, DPA/RAI resource index.
- `Status Page` — governance_profile / operational availability/status document.

### 1.2 Baseline document-to-control expectations

#### Terms of Service baseline

Expected Stage 6A legal-unit/control signals include:

- Service/account/eligibility administration → `service_description`, `commercial_terms`, `minor_access` when age/minor language exists.
- Usage restrictions/prohibited conduct → `acceptable_use`, `prohibited_use`, `sensitive_data`, `minor_access`, and content/voice/deepfake misuse controls where present.
- Model lifecycle/deprecation and support/SLA annexures → `sla_performance`, `commercial_terms` where the clause controls performance/notice/support obligations.
- User content license and data use → `data_use`, `training_or_finetuning`, `retention`, `deletion` where the clause addresses service operation, training opt-in/opt-out, retention or deletion.
- Output ownership and hallucination/inaccuracy disclaimers → `ip_ownership`, `hallucination_disclaimer`, `warranty_disclaimer`.
- Subprocessor notice → `subprocessor_disclosure`.
- Privacy/security clauses → `privacy_notice`, `security_safeguards`, `data_subject_rights` when the clause promises cooperation or privacy handling.
- Indemnity/liability/warranty/dispute → `liability_cap`, `warranty_disclaimer`, `dispute_terms`.
- DPA annexure → `data_processing_terms`, `subprocessor_disclosure`, `data_subject_rights`, `deletion`, `breach_notice`, `cross_border_transfer`.

#### EULA baseline

Expected Stage 6A legal-unit/control signals include:

- Software definition/license grant → `service_description`, `commercial_terms`, possibly `ip_ownership` for reserved rights.
- License restrictions → `acceptable_use`, `prohibited_use`, `sensitive_data`, `training_or_finetuning` when restrictions address model training/competing products, deepfakes, fraud, scraping, DPDPA or illegal use.
- Content/output ownership and training opt-in → `ip_ownership`, `training_or_finetuning`, `hallucination_disclaimer`.
- Warranty, indemnity, liability, governing law/conflict → `warranty_disclaimer`, `liability_cap`, `dispute_terms`, `commercial_terms`.

#### Privacy Policy baseline

Expected Stage 6A legal-unit/control signals include:

- Data Fiduciary / controller identity / contact → `privacy_notice`, `grievance_channel`, `data_subject_rights`.
- Commitments and certifications → `security_safeguards`, `privacy_notice`.
- Personal data / product usage data / automatic data / enhanced access → `data_collection`, `privacy_notice`, `sensitive_data` where voice biometric/financial/sensitive categories appear.
- Sources and sharing of data → `data_sharing`, `subprocessor_disclosure` when vendors/service providers/third parties are described.
- Legal basis, purpose limitation and consent → `data_use`, `consent_withdrawal`, `privacy_notice`.
- AI model training default opt-out / explicit opt-in → `training_or_finetuning`.
- Automated decision-making with human review → `automated_decision`, `hitl_mandate` when it says legal/similarly significant automated decisions are not made without human review.
- Voice cloning/synthetic media controls → `sensitive_data`, `ai_disclosure`, `agentic_controls`, `acceptable_use`, `prohibited_use` depending wording.
- Metadata/provenance for synthetic/generated/inferred content → `ai_disclosure`, `security_safeguards`, `agentic_controls` where applicable.
- Rights, consent withdrawal, retention, deletion, security → `data_subject_rights`, `consent_withdrawal`, `retention`, `deletion`, `security_safeguards`.

#### Trust Center baseline

Expected Stage 6A legal-unit/control signals include:

- Security posture/default controls → `security_safeguards`.
- Deployment models, tenant isolation, customer-managed keys, data residency → `security_safeguards`, `cross_border_transfer`, possibly `data_use`/`privacy_notice` where customer data handling is described.
- Certifications and reports → `security_safeguards`, `privacy_notice`, `commercial_terms` if audit/report access is conditioned under NDA.
- DPA and Responsible AI Framework resource references → `data_processing_terms`, `ai_disclosure`, `agentic_controls` if details are visible; otherwise relationship/resource availability only.
- Incident response controls → `breach_notice`, `security_safeguards` where notification/containment/triage commitments are visible.
- Access/network/data-protection/change-management controls → `security_safeguards`, `retention`, `deletion`, `privacy_notice` as supported.

#### Status Page baseline

Expected Stage 6A legal-unit/control signals include:

- Operational availability/status visibility → `sla_performance` only if the page gives availability/system-status metrics or commitments.
- Do not classify a generic status page as a TOS, DPA, privacy policy, or security policy.
- Use `status_page` document type and `service_description` or `sla_terms` section function depending packet vocabulary and content.

---

## 2. Field derivation rules: legal_unit_classification[]

Each row classifies an existing `legal_unit_id` from the semantic packet.

### 2.1 `legal_unit_id`

Use only an existing ID from `legal_unit_seed[]`. Never create or rewrite an ID.

### 2.2 `legal_unit_type`

Derive from the legal unit structure, not from topic alone.

- `main_section` — numbered/heading section in the body of a legal/governance document.
- `annexure` — annexure/addendum/appendix embedded in the source document.
- `schedule` — formal schedule or table attached to a contract/policy.
- `exhibit` — exhibit-style attached material.
- `linked_policy` — referenced document/resource that is distinct from the current source.
- `material_table` — table that materially defines retention, subprocessors, availability, pricing, data categories, controls, or similar governed content.
- `control_notice` — short notice/banner/status/control disclosure rather than a full policy section.
- `unknown` — only when structure is genuinely not classifiable from provided text/window.

Do not use `unknown` when the heading path clearly shows section/annexure/table structure.

### 2.3 `section_function`

Classify the function of the legal unit using the allowed vocabulary. Use the clause’s actual legal/control function, not its marketing tone.

Core mappings:

- Definitions → `definitions`.
- Description of service/software/API/product scope → `service_description`.
- AI system disclosure, probabilistic output, synthetic content disclosure, generated content labels → `ai_disclosure`.
- Privacy notice, data categories, purposes, rights, data fiduciary/controller identity → `privacy_notice`.
- DPA/processor/controller terms, processing instructions, audits, breach/deletion/transfer terms inside a DPA → `data_processing_terms` unless a more precise function is required.
- Subprocessor/vendor disclosure or notice process → `subprocessor_terms`.
- Permitted-use / user obligation rules → `acceptable_use_rules`.
- Restrictions / prohibited uses / deepfake / fraud / scraping / competing model training bans → `prohibited_use_rules`.
- Security posture, encryption, access controls, tenant isolation, certifications, incident controls → `security_terms`.
- Breach or incident notification → `breach_terms`.
- Retention schedule, deletion upon request/termination, anonymization → `retention_deletion_terms`.
- Access/correction/erasure/consent/grievance rights → `rights_request_terms`.
- Cross-border transfer, data residency, transfer safeguards → `cross_border_transfer_terms`.
- Liability caps, damages exclusions, indemnity limits → `liability_terms`.
- AS IS / warranty disclaimer / output accuracy disclaimer → `warranty_disclaimer`.
- Uptime, support, maintenance, status/availability metrics → `sla_terms`.
- Human review, autonomous action constraints, voice cloning controls, misuse filters, synthetic media provenance controls → `agentic_controls` when the clause controls AI behavior rather than just describing privacy.
- Payment, billing, renewal, termination, fees, support tiers, account/service tier controls → `commercial_terms`.
- Governing law, arbitration, jurisdiction, dispute escalation → `dispute_terms`.
- Input/output ownership, reserved rights, license grant/restrictions, feedback ownership → `ip_ownership_terms`.
- Minor/children access or children's personal information → `minor_access_terms`.
- Automated decision-making and human review for legal/similarly significant effects → `automated_decision_terms`.
- Sensitive data, voice biometric, financial transaction data, health/special category data → `sensitive_data_terms`.
- `other` only for real legal/control clauses that do not fit the vocabulary.
- `unknown` only when the provided text window is insufficient.

### 2.4 `control_families_detected`

This field lists control families directly supported by the legal unit.

Rules:

- Emit one or more control families when a legal unit visibly creates a policy/control/notice/obligation/disclaimer.
- It may be empty only for pure definitions, neutral recitals, generic headings, or sections whose control function cannot be determined from the packet.
- Do not mark `unknown` as a control family if a precise control family is supported.
- Do not infer controls from product knowledge alone. Tie controls to the legal/governance text.

Use these baseline mappings:

- `ai_disclosure` → AI system nature, generated/synthetic content indicators, provenance labels, probabilistic/inaccurate output disclosures.
- `hallucination_disclaimer` → output may be incorrect, incomplete, non-unique, hallucinated, not professional advice, user responsible to evaluate accuracy.
- `hitl_mandate` → explicit human review or human-in-the-loop requirement/recommendation for critical/legal/significant effects.
- `acceptable_use` → required/permitted user conduct.
- `prohibited_use` → bans on illegal use, scraping, deepfakes, impersonation, fraud, harassment, competing model training, unauthorized access, misuse.
- `privacy_notice` → data fiduciary/controller identity, privacy commitments, notice, processing purposes.
- `data_collection` → categories of personal/product/usage/automatic/device/location/microphone/camera/upload data collected.
- `data_use` → processing purposes, service operation, support, abuse prevention, improvement, analytics.
- `data_sharing` → vendors, service providers, affiliates, acquiring entities, third-party disclosures.
- `subprocessor_disclosure` → subprocessors/vendor notice/objection mechanism/DPA subprocessing.
- `model_provider_disclosure` → visible third-party AI/model provider involvement.
- `training_or_finetuning` → training/fine-tuning/default opt-out/explicit opt-in/competing model training restrictions.
- `retention` → retention period, audit log retention, account/log/content retention.
- `deletion` → deletion request, termination deletion, anonymization, withdrawal deletion.
- `data_subject_rights` → access, correction, erasure, sharing details, data principal rights.
- `consent_withdrawal` → withdrawal mechanisms/effect, opt-in/opt-out, consent manager.
- `grievance_channel` → legal/privacy/DPO/grievance contact or redress process.
- `security_safeguards` → encryption, access control, least privilege, MFA, RBAC, tenant isolation, audits, SOC2/ISO, WAF, mTLS, CMEK/BYOK, incident logging, production data segregation.
- `breach_notice` → breach/incident notification commitment, incident response plan, customer notification.
- `cross_border_transfer` → data residency, no cross-border transfer unless requested, transfer safeguards.
- `liability_cap` → monetary cap, damages exclusions.
- `warranty_disclaimer` → AS IS/no warranty/output no guarantee/no professional advice.
- `sla_performance` → uptime/service availability/support/maintenance/status performance.
- `agentic_controls` → controls around autonomous action, AI workflow control, synthetic media, voice cloning, filters, audit logs, provenance metadata.
- `commercial_terms` → billing, renewal, termination, support tiers, payment, usage limits.
- `dispute_terms` → governing law, arbitration, venue, escalation.
- `ip_ownership` → input ownership, output ownership, software ownership, reserved rights, feedback, license grant/restrictions.
- `minor_access` → age/minor/children personal data restrictions.
- `automated_decision` → legal/similarly significant automated decision-making and human review.
- `sensitive_data` → sensitive/biometric/voice/financial/health/minor data restrictions or notices.

### 2.5 `basis_codes`

Always include the strongest applicable basis codes:

- `direct_policy_signal` when the text directly states the control.
- `indirect_policy_signal` when the control is implied by reference/incorporation but not fully stated in the unit.
- `macro_heading_classification` when heading/path strongly classifies the section.
- `stage5_feature_ref` when feature relevance is used.
- `stage6_legal_unit_ref` when deriving from an existing legal unit.
- `source_bundle_record_ref` when tying classification to source metadata.
- `model_semantic_classification` when model reasoning is required beyond deterministic heading mapping.
- `absence_after_search` only for mismatch/control absence rows, not for positive visible rows.

Do not use `unknown` basis if any of the above applies.

### 2.6 `confidence`

- `high` — heading and text directly support the field.
- `medium` — text supports the field but requires interpretation or is broad/conditional.
- `low` — weak but plausible support; use sparingly and explain via basis codes/limitations.
- `unknown` — source window insufficient or inaccessible.

---

## 3. Field derivation rules: document_control_classification[]

Emit control rows when the model needs to add, refine, or feature-map controls beyond deterministic control seeds.

### 3.1 `legal_unit_id`

Use only an existing `legal_unit_id`.

### 3.2 `control_family`

Use only allowed control families. Choose the narrowest supported family. If a clause supports multiple controls, emit multiple rows rather than hiding them under `privacy_notice` or `security_safeguards`.

Example: a privacy section saying “we collect inputs, file uploads and outputs; we do not train unless opt-in; delete within 30 days” should yield at least:

- `data_collection`
- `training_or_finetuning`
- `deletion`

not just `privacy_notice`.

### 3.3 `control_signal`

Use this rubric:

- `visible` — the legal/governance text directly states the control, obligation, disclosure, limitation, right, or disclaimer.
- `partial` — the text mentions the control area but leaves material details incomplete, conditional, or not feature-specific.
- `absent_after_search` — a control is reasonably expected given Stage 5 features/surfaces or document type, but no supporting legal/governance unit exists in the admitted corpus.
- `unclear` — text exists but cannot be confidently classified as visible or partial.
- `not_applicable` — the control family does not apply to this legal unit or feature context.
- `unknown` — source/source window is insufficient or inaccessible; do not use as a lazy fallback.

### 3.4 `feature_refs`

Attach feature refs only when the legal unit applies to that feature or feature class.

Rules:

- Broad “Services”, “Software”, “Model APIs”, “Output”, “Input”, “Your Content” clauses may map to all relevant Stage 5 feature refs if the feature is within that service/software/API class.
- Privacy/data clauses map to features based on input/output/data category, e.g. voice/audio features to microphone/voice/biometric clauses; document features to file upload/document clauses; generation features to Output/content/provenance clauses.
- Product-specific clauses map only to matching features/product areas if source text supports specificity.
- Do not map a website-only clause to product features unless it explicitly covers the service/offering/product/API.
- If no feature refs exist or applicability cannot be determined, leave `feature_refs` empty and emit a limitation if material.

### 3.5 `data_flow_refs`

Use only existing data-flow IDs if provided by Stage 6B/input packet. Do not invent.

### 3.6 `basis_codes` and `confidence`

Same rubric as legal_unit_classification. Add `stage5_feature_ref` when feature refs are used.

---

## 4. Field derivation rules: document_relationship_classification[]

Emit relationships only when a legal/governance source creates a real document/legal-unit relationship.

### 4.1 Relationship types

- `incorporates_by_reference` — one document/section expressly makes another policy/document part of the agreement or required reading.
- `supplements` — additional terms apply alongside base terms without overriding them.
- `controls_on_conflict` — conflict clause says one document controls over another.
- `linked_from` — source visibly links to another legal/governance document. Use only for meaningful legal/governance links, not generic footer navigation.
- `defines_terms_for` — definitions/terms section defines terms used by another document/unit.
- `activates_when` — clause applies only when a condition/product/use case is triggered, e.g. Content Studio terms apply to voice generation/cloning/dubbing.
- `supersedes_for_subject_matter` — a specific addendum/document overrides another for a defined subject matter.
- `embedded_within` — DPA/SLA/annexure embedded within ToS/EULA.
- `unknown` — avoid unless relationship exists but type is truly unclear.

### 4.2 Relationship emission rules

- Do emit relationships for ToS ↔ Privacy Policy acknowledgements, EULA ↔ ToS/Privacy/DPA conflict/integration clauses, embedded DPA/SLA annexures, and Trust Center resource references where the resource has legal/governance consequence.
- Do not emit relationships for ordinary product/footer links unless they are legal/governance source relationships.
- Use existing document/legal-unit refs only.

---

## 5. Field derivation rules: document_mismatch_classification[]

Mismatch rows identify gaps/conflicts between Stage 5 feature/data/surface reality and visible legal/governance coverage.

### 5.1 When to emit mismatch rows

Emit when one of these occurs:

- Stage 5 has a feature/surface that would reasonably require or strongly expect a legal/governance control, and no admitted legal unit shows it.
- A legal unit covers a control only partially relative to the feature/data/surface.
- Two documents conflict on ownership, training, retention, deletion, liability, warranty, data sharing, subprocessing, transfers, or dispute terms.
- A public claim/control is asserted in governance material but the underlying legal unit/resource is unavailable, request-only, or source-unclear.
- A Trust Center resource says a DPA/RAI/IR policy exists but the text is request-only or not ingested; this is usually `source_unclear` or `source_absent`, not a compliance finding.

### 5.2 Mismatch signal rubric

- `expected_signal_absent` — expected control is not visible in admitted legal/governance sources.
- `expected_signal_partial` — control is visible but incomplete, conditional, non-specific, or not mapped to the feature/data/surface.
- `conflicting_signal` — two sources materially disagree.
- `source_absent` — expected document/resource is referenced but not accessible/ingested.
- `source_unclear` — source exists but scope/applicability is unclear.
- `unknown` — avoid except when mismatch exists but signal cannot be classified.

### 5.3 Expected vs actual refs

- `expected_ref` should point to the Stage 5 feature/data/surface/document expectation when possible.
- `actual_ref` should point to the legal unit/document/control that exists, or `null` if absent.
- Do not use prose explanations; use refs, control family, basis codes, confidence.

---

## 6. Field derivation rules: feature_legal_unit_classification[]

This index tells Stage 7 which legal units to inspect for each feature.

### 6.1 When to emit

Emit a row for a feature when at least one legal unit materially governs:

- input/content ownership;
- output ownership or hallucination disclaimers;
- model/API/software usage restrictions;
- voice/synthetic media controls;
- training/fine-tuning;
- privacy/data collection/use/sharing/retention/deletion;
- automated decision or HITL controls;
- security, DPA, breach, transfer or subprocessor controls;
- service availability/SLA/support for that feature;
- liability/warranty/dispute terms applying to that feature/service.

### 6.2 Mapping rules

- A broad ToS/EULA clause applying to “Services”, “Software”, “Model APIs”, “Output”, “Input”, “Your Content”, or “Offerings” may map to multiple features if feature refs are within that class.
- A feature-specific legal unit maps only to matching features.
- A privacy legal unit maps by data category and processing context, not by product name alone.
- A Trust Center control maps to features only where the control affects product/service operation, security, data residency, incident handling, AI safety, or DPA/RAI availability.
- Do not map legal units to features based only on footer links or unrelated product navigation.

### 6.3 `control_families`

List only the control families that connect the feature to those legal units. Do not dump all controls from the document.

---

## 7. Classification limitations

Use `classification_limitations[]` when a material legal/governance control cannot be fully derived from admitted sources.

Examples:

- DPA exists but is request-only / not ingested.
- SOC2/ISO certificates or reports are request-only / not ingested.
- Responsible AI framework exists but is request-only / not ingested.
- Privacy policy provides broad control but not feature-specific detail.
- Source window is insufficient to classify a legal unit.
- Stage 5 feature refs are degraded/unresolved.

Do not use limitations to hide missing work. If a row can be classified, classify it.

---

## 8. Anti-laziness rules

1. Do not use `unknown` when headings/text support a narrower section function or control family.
2. Do not collapse all privacy sections into `privacy_notice`; extract data collection, data use, sharing, training, retention, deletion, rights, consent, sensitive data, automated decision and security controls separately when visible.
3. Do not collapse all Trust Center material into `security_safeguards`; extract breach notice, retention/deletion, cross-border transfer/data residency, incident response, DPA/RAI resource availability and access/security controls when visible.
4. Do not omit feature-to-legal-unit mappings when broad service/software/API clauses clearly govern Stage 5 features.
5. Do not emit document relationships for generic footer links.
6. Do not create compliance verdicts, legal advice, recommendations, threat statuses, report prose, or Vault fields.
7. If a source is not legal/governance-admitted, it must not appear in Stage 6A legal cartography.

---

## 9. Minimum expected behavior on a Sarvam-like target

If the admitted legal/governance corpus includes a ToS, EULA, Privacy Policy, Trust Center, and Status Page, and Stage 5 has AI/speech/document/content/API features, Stage 6A should normally produce visible or partial controls for at least:

- `ai_disclosure`
- `hallucination_disclaimer`
- `acceptable_use`
- `prohibited_use`
- `privacy_notice`
- `data_collection`
- `data_use`
- `data_sharing`
- `subprocessor_disclosure` if present
- `training_or_finetuning`
- `retention`
- `deletion`
- `data_subject_rights`
- `consent_withdrawal`
- `grievance_channel` when contact/redress details exist
- `security_safeguards`
- `breach_notice` if incident/breach terms or IR commitments exist
- `cross_border_transfer` if residency/transfer language exists
- `liability_cap`
- `warranty_disclaimer`
- `sla_performance` if SLA/status/support/uptime terms exist
- `agentic_controls` where AI/voice/synthetic media controls exist
- `commercial_terms`
- `dispute_terms`
- `ip_ownership`
- `minor_access` if age/minor/children language exists
- `automated_decision` where legal/similarly significant automated decision language exists
- `sensitive_data` where voice biometric/financial/sensitive data is addressed

Absence of these controls should be explainable by source absence, document absence, Stage 5 feature absence, or explicit non-applicability — not by omission.

---

## 10. Future runtime wiring note

This artifact should be appended to the Stage 6A semantic classification prompt after the canonical Stage 6 vocabulary/spine reference and before output instructions. It should also be converted into guardrail expectations for:

- overuse of `unknown`;
- empty feature-to-legal-unit index when features and legal units exist;
- empty or thin document_control_signal_map where legal/governance units visibly contain controls;
- unreasoned absence of high-signal control families on ToS/EULA/Privacy/Trust documents;
- misuse of product/non-legal sources in legal cartography.
