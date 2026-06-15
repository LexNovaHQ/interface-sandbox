# STAGE6B_FIELD_DERIVATION_INSTRUCTIONS_v1

Status: LOCKED DESIGN ARTIFACT.  
Runtime wiring: NOT YET WIRED.  
Applies to: Stage 6B Data Provenance, legal/governance control overlay, and deterministic Target Data Provenance Profile merge.

This document is the governing instruction contract for Stage 6B. It separates Stage 5 product-observed data behavior from Stage 6B legal/governance-confirmed data controls, then defines how runtime should normalise both layers into an integrated Target Data Provenance Profile.

---

## 1. Stage 6B role

Stage 6B answers this question:

> Given the features and product-observed data behavior from Stage 5, what do the legal/governance sources say about notice, roles, rights, consent, retention, training, processors, transfer, security, accountability, and regime relevance?

Stage 6B may classify or confirm:

- data subject categories;
- data category and sensitivity signals;
- processing actions and purposes;
- provider, customer, processor, subprocessor, service-provider, or third-party role signals;
- privacy and AI notice signals;
- consent, contract, legal obligation, legitimate-interest, and withdrawal signals;
- data subject rights and grievance signals;
- processor, subprocessor, recipient and vendor-chain signals;
- transfer, residency and region signals;
- retention, deletion, training/fine-tuning and model-data controls;
- security, breach, audit, DPO/contact and accountability signals;
- regime relevance signals;
- legal-unit navigation references from Stage 6A.

Stage 6B does not discover product features, decide registry threats, write Stage 9 findings, or produce Vault handoff fields.

---

## 2. Source firewall

### 2.1 Stage 5 layer

Stage 5 uses product-family lossless evidence only. It produces the product-observed data layer:

- feature ID and feature name;
- product-observed data origin;
- product-observed data subject;
- product-observed data category;
- product-observed processing context;
- product-observed storage/training visibility, limited to product sources;
- product evidence refs.

Stage 5 may say `not_visible_in_product_sources` when legal/governance controls are not visible in product evidence.

### 2.2 Stage 6A layer

Stage 6A uses legal/governance evidence to build legal document cartography:

- legal document inventory;
- legal unit IDs;
- control-family classification;
- source locator index;
- feature-to-legal-unit navigation hints.

Stage 6B uses this as navigation, not as a substitute for data-flow classification.

### 2.3 Stage 6B layer

Stage 6B uses:

- legal/governance lossless sources;
- Stage 5 target feature profile as the feature/data-flow map;
- Stage 6A legal cartography as the legal-unit navigation map;
- Stage 4 target profile for entity and jurisdiction context.

Allowed lossless source families for Stage 6B:

- `legal_profile`;
- `governance_profile`.

Forbidden as Stage 6B legal-control proof:

- product-family lossless text;
- raw product pages;
- commercial marketing pages;
- product/API docs except where they were separately admitted as legal/governance sources by Stage 6A.

Product behavior enters Stage 6B only through Stage 5 structured fields.

---

## 3. Sarvam-style baseline calibration

This baseline is for derivation logic only. It must not become hardcoded target output.

### Privacy-policy baseline

A strong privacy policy can support:

- privacy notice visibility;
- data fiduciary/controller-like role visibility;
- contact/DPO/grievance visibility;
- categories such as account, contact, location, usage, device, network/IP, inputs, file uploads, outputs, camera, microphone, cookies, public sources and support data;
- sensitive data signals such as voice biometric or financial/payment data where stated;
- consent, contract, compliance/legal obligation, legitimate-use or similar basis signals where stated;
- rights such as access, correction, deletion, grievance, nomination, consent withdrawal, portability or regional rights where stated;
- training/fine-tuning opt-in or opt-out rules;
- automated-decision and human-review statements;
- voice cloning, synthetic media and provenance controls;
- retention/deletion periods and deletion channels;
- security controls, incident or breach notification language;
- cross-border transfer, safeguards, data localisation and residency language;
- minors/children restrictions;
- recipient or subprocessor categories.

### Terms/EULA baseline

Terms or EULA can support:

- customer/user ownership of inputs/content;
- limited provider license to use/copy/store/display content for service, support, abuse prevention, compliance or aggregated analytics;
- no identifiable-content training/fine-tuning without opt-in;
- content deletion after request or termination where stated;
- subprocessor notice and objection windows;
- output ownership and hallucination/accuracy disclaimers;
- customer consent obligations for identifiable persons, voice cloning, children, third-party rights and restricted content;
- confidentiality, DPA, data-processing, warranty, liability and dispute context.

### Trust/security baseline

Trust/security sources can support:

- data residency/localisation;
- encryption at rest and in transit;
- least privilege, access controls and tenant isolation;
- ephemeral storage or customer-managed keys;
- managed SaaS, single-tenant, on-premises or air-gapped deployment models;
- data reuse restrictions for custom models;
- certifications such as ISO/SOC;
- DPA, Responsible AI, BCP/DR, incident response and security-policy resources;
- incident response and customer notification commitments.

### Status-page baseline

Status pages support operational availability/SLA context. They are not usually privacy-control sources unless they contain incident or service-availability commitments.

---

## 4. Field responsibility split

| Field/block | Stage 5 contribution | Stage 6B contribution | Runtime merge rule |
|---|---|---|---|
| `feature_id` | Owns | Uses | Preserve Stage 5 ID |
| `feature_name` | Owns | Uses | Preserve Stage 5 name |
| `provenance_id` | Owns | Uses | Preserve and map to data flow |
| `data_origin` | Product-observed candidate | Qualify if legal/governance source states categories/origins | Keep Stage 5 value plus overlay |
| `data_subject` | Product-observed candidate | Confirm/qualify using privacy/legal categories | Normalise subject type |
| `data_category` | Product-observed candidate | Confirm/qualify using privacy/legal categories | Normalise to Stage 6 enum |
| `processing_context` | Product behavior | Legal/governance overlay only | Preserve product behavior |
| `storage_or_retention_signal` | Product-visible only | Owns legal/governance retention/deletion | Prefer 6B for final control signal |
| `training_or_finetuning_signal` | Product-visible only | Owns legal/governance training/fine-tuning control | Prefer 6B for final control signal |
| `privacy_notice_signal` | None | Owns | Derive from privacy/legal notice docs |
| `ai_notice_signal` | Product may suggest | Owns final | Confirm from legal/governance docs |
| legal-basis signals | None | Owns | Derive from privacy/terms/legal basis text |
| rights signals | None | Owns | Derive from privacy/rights/grievance text |
| processor chain | Architecture hints only | Owns final | Derive from DPA/subprocessor/sharing/trust text |
| transfer/location | None | Owns | Derive from privacy/trust/transfer text |
| security/accountability | Product-visible only if product docs say | Owns final | Derive from trust/security/privacy text |
| regime relevance | Product/data hints | Owns final controlled signal | Confirm with jurisdiction/data/legal docs |
| legal-unit refs | None | Owns via Stage 6A | Attach from legal cartography |
| integrated profile | None | None alone | Runtime deterministic merge owns |

---

## 5. Deterministic, model, and hybrid ownership

### Deterministic where explicit

Runtime should prefill these where explicit source or Stage 6A cartography supports them:

- `data_flow_id`, `feature_id`, `feature_name`, `provenance_id`;
- source refs and legal-unit refs;
- notice, rights, processor, location and security legal-unit refs;
- privacy notice visibility where a privacy policy exists;
- contact/DPO/grievance visibility where stated;
- access, correction, deletion, portability, grievance, withdrawal and nomination rights where stated;
- training opt-out, no-training-without-opt-in, or fine-tuning prohibition where stated;
- retention periods and deletion channels where stated;
- subprocessor or recipient categories where stated;
- transfer regions, safeguards, residency or localisation where stated;
- encryption, access control, audit logs, breach/incident notice and security certifications where stated;
- feature-to-data-flow index and data-signal index after merge.

### Model-owned reasoning

The model should decide or qualify:

- role allocation across provider/customer/processor/subprocessor;
- legal basis relevance per flow;
- conditional transfer basis;
- whether AI notice or automated-decision language applies to a specific feature/data flow;
- regime relevance where data type, jurisdiction and feature context interact;
- confidence and limitations;
- feature-specific legal-unit mapping where broad clauses govern multiple features;
- reconciliation of product-observed behavior with legal/governance controls.

### Hybrid fields

Deterministic prefill plus model confirmation should be used for:

- data category;
- data subject;
- processing actions and purpose;
- storage and fine-tuning signals;
- regime relevance and basis tags;
- recipient categories;
- regions visible;
- retention/deletion/training block;
- security/accountability block.

---

## 6. Unknown exception rule

`unknown` is exceptional. Use it only when the relevant source class is absent, access failed, Stage 6A navigation is missing, or the supplied legal/governance text genuinely does not answer the field.

Prefer:

- `visible` for direct legal/governance support;
- `partial` for incomplete or conditional support;
- `not_visible` when the relevant legal/governance source was searched and the signal is absent;
- `not_applicable` where the field does not apply;
- `conflicting` where sources conflict;
- `unknown` only for real source/context gaps.

When `unknown` is used on a high-signal field, the output should preserve or create a limitation explaining the gap.

---

## 7. Field derivation rules

### `data_subject`

Map customer/end-user text to `customer_user` or `end_user`; developer/API-user text to `developer_user`; employee/contractor text to `employee` or `contractor`; visitor/cookie text to `website_visitor`; business-contact text to `business_contact`; minor/child text to `child_or_minor`.

### `data_category`

Map prompts/queries to `prompt_input`; uploads/documents/images to `uploaded_file`; generated responses/translations/transcriptions/classifications to `generated_output`; account/profile/contact text to `account_data` or `contact_data`; usage/IP/device/logs to `usage_data`, `network_data`, `device_data`, or `action_log`; voice biometric to `biometric_data`; payment/billing to `payment_data` or `financial_data`; secrets/API keys to `credential_or_secret`.

### `processing`

Stage 5 supplies base product behavior. Stage 6B adds legal/governance control context. Use controlled actions such as collect, store, retrieve, generate, classify, transmit, log, monitor, delete, anonymize, aggregate and fine_tune. Purposes include service delivery, AI generation, analytics, security, billing, support, compliance, product improvement, model training and internal governance.

### `role_allocation`

Use data fiduciary/controller language, processor/DPA language, customer content-responsibility language, and subprocessor/vendor language. If role varies by contract, mark partial or unknown with limitation.

### `regime_relevance`

Tie signals to actual legal/governance evidence and feature/data context. DPDP may be supported by India/data fiduciary/data principal rights. GDPR/UK GDPR require EEA/UK/SCC/IDTA/GDPR rights or similar. CCPA/CPRA requires California notice/rights/categories. EU AI Act or high-risk AI should not be marked visible unless automated-decision/high-risk feature context supports it.

### `notice`

Privacy notice is visible when a privacy policy/legal notice applies. AI notice may be visible or partial where AI systems, probabilistic outputs, synthetic media, provenance metadata, human review, model limitations or responsible AI resources are disclosed. Subprocessor notice is visible or partial where subprocessors, DPA, recipients or vendor categories are disclosed.

### `consent_basis`

Consent is visible when consent is required for collection, permissions, sensitive data, voice cloning, minors, marketing, training opt-in or similar. Contract is visible or partial where processing is tied to service provision or Terms/EULA. Legal obligation is visible or partial where compliance/legal-obligation language appears. Withdrawal is visible where consent withdrawal or opt-out is described.

### `rights`

Map only rights stated in the legal/governance source: access, correction, deletion, portability, opt-out, withdrawal, grievance and nomination. Do not infer every right from the mere existence of a privacy policy.

### `processor_chain`

Use privacy sharing, ToS subprocessors, DPA/trust resources, subprocessor annexures and architecture hints. Map model, cloud, payment, analytics, support, security, workflow and storage providers using controlled recipient categories. If a DPA is available on request but the list is not fully public, use partial rather than unknown.

### `transfer_location`

Derive transfers, regions, safeguards, SCCs, adequacy, IDTA, contractual obligations, localisation and data residency from privacy/trust/transfer text. If a trust source states data is not moved across borders unless requested, use a conditional or not-visible/partial signal rather than unknown.

### `retention_deletion_ai`

Use privacy retention/deletion, ToS content-deletion clauses, training clauses, trust/custom-model clauses and feature context. Training opt-out and no-identifiable-training-without-opt-in should be visible where stated. Model-weight deletion should only be visible or partial where custom model weights or model deletion are addressed.

### `security_accountability`

Use trust/security/privacy controls. Encryption, access control, audit logs, breach notice, incident notification and DPO/contact should be visible or partial where legal/governance text supports them.

### `confidence`

High means direct legal/governance evidence plus legal-unit refs. Medium means direct evidence with some feature-flow interpretation. Low means indirect or partial mapping. Unknown means the source is unavailable or the field cannot be classified.

---

## 8. Integrated Target Data Provenance Profile merge and normalisation

The runtime must merge Stage 5 and Stage 6B deterministically. The model may classify overlay fields, but it must not author the final integrated object.

### 8.1 Conceptual integrated object

```json
{
  "target_data_provenance_profile_version": "target_data_provenance_profile_v1",
  "source_layers": {
    "product_observed_data_layer": {
      "source_stage": "stage5_target_feature_profile",
      "records": []
    },
    "legal_governance_control_layer": {
      "source_stage": "stage6b_data_provenance",
      "records": []
    }
  },
  "integrated_feature_data_flow_profile": [],
  "feature_to_legal_unit_navigation": [],
  "data_signal_index": [],
  "normalisation_log": [],
  "limitations": []
}
```

### 8.2 Merge key

Primary key:

```text
feature_id + provenance_id
```

Fallback key:

```text
feature_id + normalised data_category + normalised processing_context
```

Generate and preserve `data_flow_id` deterministically.

### 8.3 Merge order

1. Start with Stage 5 product-observed row.
2. Attach the Stage 6B row by `feature_id` and `provenance_id` / `data_flow_id`.
3. Preserve Stage 5 product behavior fields.
4. Overlay Stage 6B legal/governance controls into a separate control block.
5. Attach Stage 6A legal-unit refs and source locators.
6. Compute integrated signals.
7. Compute limitations and gaps.
8. Generate data signal index and feature-to-legal-unit navigation.

### 8.4 Product-observed fields are preserved

Do not overwrite Stage 5 feature ID, feature name, product source URL, product evidence refs, product-observed origin, product-observed processing context, input/output behavior, feature role, archetype or surface context. If legal/governance evidence qualifies the product observation, record the qualification in overlay, gaps or limitations.

### 8.5 Legal/governance overlay controls final control signal

For legal-control fields, Stage 6B controls the integrated signal:

- notice;
- legal basis;
- rights;
- retention/deletion;
- training/fine-tuning controls;
- processor/subprocessor chain;
- transfer/residency;
- security/accountability;
- regime relevance;
- legal-unit refs.

If Stage 5 says `not_visible_in_product_sources` and Stage 6B says `visible`, the integrated profile should record product scope and legal/governance confirmation separately, with integrated control status as visible.

### 8.6 Integrated status rules

| Product layer | Legal/governance layer | Integrated status |
|---|---|---|
| visible | visible | confirmed_visible |
| visible | partial | product_visible_legal_partial |
| visible | not_visible | product_visible_legal_absent_gap |
| visible | unknown | product_visible_legal_unknown_gap |
| not_visible_in_product_sources | visible | legal_control_visible_not_product_visible |
| unknown | visible | legal_control_visible_product_unknown |
| visible | conflicting | conflict_requires_review |
| absent | absent | not_visible_after_review |

If the schema cannot store these values directly, place them in `normalisation_log`, `limitations`, or metadata while preserving schema-valid controlled fields.

### 8.7 Legal-unit normalisation

Attach legal-unit refs by control family:

- privacy notice / data collection / data use -> privacy legal units;
- rights / grievance / consent withdrawal -> rights legal units;
- subprocessors / DPA / recipient categories -> data-processing legal units;
- transfer / residency -> transfer or localisation legal units;
- retention / deletion / training -> retention, deletion or training legal units;
- security / breach / accountability -> trust/security/breach legal units;
- automated decision / HITL / AI notice -> AI disclosure or automated-decision legal units.

If a row has visible legal controls but no legal-unit refs, add a quality issue and limitation.

### 8.8 Data signal index normalisation

`data_signal_index` must be derived from integrated rows. It should include personal data, sensitive data, children data, biometric/voice data, financial/payment data, training/fine-tuning, processor/subprocessor chain, cross-border transfer, deletion/retention, notice, consent/withdrawal, security/accountability and automated decision/HITL where supported.

Each signal should carry data-flow IDs, feature IDs, legal-unit IDs where available, source-layer basis and confidence.

### 8.9 Feature-to-legal-unit navigation

Produce deterministic navigation rows linking features, data-flow IDs, legal-unit IDs, control families and basis codes. This is for Stage 7 navigation only, not final legal advice.

### 8.10 Limitations

Add limitations where product-observed data behavior is visible but no legal/governance control is visible; legal controls cannot be mapped to feature/data-flow IDs; Stage 6A legal-unit refs are missing; legal/governance source family is absent or inaccessible; a high-signal legal/governance field remains unknown; or source firewall integrity is uncertain.

---

## 9. Minimum expected Stage 6B behavior

For a target with speech, voice, document, translation, model/API, workflow agent and enterprise integration features plus visible privacy, terms/EULA, trust and status sources, Stage 6B should normally produce visible or partial signals for:

- privacy notice;
- consent/legal basis;
- rights, deletion, grievance and withdrawal;
- training opt-out or fine-tuning limits;
- retention/deletion;
- processor/subprocessor/recipient chain;
- transfer/location/residency;
- security/accountability;
- regime basis tags;
- legal-unit refs for visible or partial controls.

A 6B output with all notice, rights, processor, transfer, retention/training and security fields as `unknown` is weak and should trigger semantic-quality repair or warning.

---

## 10. Stage 6B semantic packet requirements

The packet should contain:

- target profile summary;
- Stage 5 feature inventory and product-observed data provenance;
- Stage 6A legal document inventory and legal-unit locator index;
- legal/governance lossless source records only;
- deterministic policy/control prefill;
- data-flow seed rows;
- allowed vocabulary;
- source firewall metadata.

The packet should not contain product-family lossless source text.

---

## 11. Guardrail expectations

Critical failures:

- schema corruption;
- ref mutation;
- source firewall violation;
- missing seeded data-flow rows when Stage 5 provenance exists;
- product-family lossless source text used as Stage 6B legal-control proof.

Repairable/warning issues:

- all notice fields unknown despite privacy docs;
- all rights fields unknown despite rights docs;
- all retention/deletion/training fields unknown despite legal controls;
- all security fields unknown despite trust/security docs;
- all transfer/location fields unknown despite transfer/residency docs;
- subprocessor chain unknown despite DPA/subprocessor/sharing evidence;
- legal-unit refs empty despite Stage 6A units;
- legal/governance source windows empty despite admitted legal/governance sources;
- overuse of unknown where legal/governance evidence is visible.

---

## 12. Runtime implementation note

The runtime build after this design lock should:

1. Append this artifact to the Stage 6B semantic prompt.
2. Pass Stage 6A legal cartography into Stage 6B input.
3. Build Stage 6B packets using legal/governance lossless sources only.
4. Add deterministic legal/governance policy prefill.
5. Fix source-window matching and legal-unit navigation.
6. Add semantic quality expectations for unknown-heavy output.
7. Build deterministic Target Data Provenance Profile merge/normalisation.

Until wired, this document is the design contract, not active runtime behavior.
