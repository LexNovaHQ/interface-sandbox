# Stage 4 + Stage 5 Canon Field Dictionary v1

## Status

This is the single canonical field-definition dictionary for Stage 4 `target_profile_v2` and Stage 5 `feature_profile_v2`.

The schema enforces structure. The prompt uses this dictionary to derive values. The runtime must not invent parallel definitions in another file.

## Universal derivation rules

| Rule | Requirement |
|---|---|
| Evidence first | Use only admitted source material in the current runtime input. Discovery-only URLs, snippets, prior knowledge, market assumptions, and model memory are not evidence. |
| Required field discipline | Required fields must always be present. Absence of public evidence is represented inside the field as `unknown`, `not visible in admitted evidence`, `UNKNOWN`, empty array, or an unresolved question, depending on the field. Do not omit required fields. |
| No hallucinated certainty | Do not convert silence into a positive fact. If evidence is absent, say it is absent. |
| Quote discipline | For positive factual claims, provide a short evidence quote from admitted source text and the source URL or evidence ref. |
| Absence discipline | For missing facts, use `not visible in admitted evidence` and `confidence = unknown`. Do not fabricate an evidence quote. Use the closest admitted source only when it proves the feature exists but does not disclose the specific sub-fact. |
| Confidence | `high` = direct and specific admitted evidence. `medium` = supported but needs interpretation. `low` = weak signal needing confirmation. `unknown` = not visible or not safely derivable. |
| Candidate status | `PREFILL_READY` = exact field supported by admitted evidence. `CONFIRM` = plausible but reviewer should verify. `UNKNOWN` = not visible or not safely derivable. |
| Stage boundary | Stage 4 owns identity/baseline. Stage 5 owns feature/function inventory, data provenance, archetype provenance, and surface provenance. Neither stage evaluates threat rows. |

## Stage 4 — `target_profile_v2`

### Top level

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `target_profile_version` | Object version marker. | Always set to `target_profile_v2`. | Model choice. | Must equal `target_profile_v2`. |
| `identity` | Canonical identity and legal-name group. | About/company/contact/terms/privacy/notices/trust pages. | Marketing category, founder country, domain suffix. | Fill all subfields; use empty strings/arrays and `unknown` confidence where absent. |
| `jurisdiction` | Registered/notice address plus governing law and venue signals. | Terms, privacy, contact, legal notices, footer, DPA. | Customer geography, domain suffix, language, timezone. | Fill visible parts only; absent clauses use empty string and `confidence = unknown`. |
| `business_model` | Commercial model and customer orientation. | Product pages, pricing/contact sales CTAs, docs, enterprise pages. | Legal entity type, investor language, generic AI category. | Use `unknown` or descriptive absence text. |
| `market_context` | Industry, geography, language, and regulated-sector hints. | Product pages, use-case pages, language pages, public sector pages. | Final risk surfaces, registry rows. | Empty arrays where not visible; confidence `unknown` if thin. |
| `product_baseline` | High-level offering and public product labels only. | Product pages, docs, API pages, homepage. | Detailed archetype classification or threat logic. | Empty arrays or `unknown` tri-state values. |
| `data_touchpoint_map` | Baseline privacy/data collection touchpoints visible before atomic feature mapping. | Privacy policy, terms, account/API forms, product/docs, contact forms. | Generic legal prohibitions alone. | If no visible touchpoint exists, return `[]` and explain in limitations/unresolved questions. |
| `vault_baseline_candidates` | Stage 4 candidate projection into baseline/compliance Vault fields. | Stage 4 evidence only. | Final Vault handoff, architecture guesses, registry threat rows. | Candidate objects must be present and use `UNKNOWN` where not visible. |
| `pipeline_assumptions` | Non-Vault notes for downstream stages. | Evidence limitations and downstream dependencies. | Final findings. | Use empty arrays if none. |
| `evidence` | Field-level evidence audit for material Stage 4 claims. | Admitted source refs and quotes. | Fabricated quotes or discovery-only URLs. | Use empty array only for truly no material claims; otherwise cite material fields. |
| `limitations` | Source-bounded Stage 4 limitations. | Missing/ambiguous evidence. | Speculation. | Use `[]` if none. |

### `identity`

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `identity.brand_name` | Public/display/product brand. | Homepage, header/footer, product pages. | Legal suffix guessing. | If not visible, use target submitted name or empty string with low/unknown confidence. |
| `identity.legal_name` | Legal/corporate/operator/controller name exactly as published. | Terms, privacy, legal notice, DPA, footer. | Brand name unless source says it is legal operator. Do not invent suffix. | Empty string if absent; note unresolved question. |
| `identity.trade_names` | Other published names/DBA/product trade names. | Terms, privacy, about, footer. | Similar unrelated brands. | `[]`. |
| `identity.website` | Canonical submitted or admitted website URL. | Runtime input/admitted pages. | Unverified sibling domains. | Empty string only if unavailable. |
| `identity.domain` | Normalized domain. | Website URL. | Social profiles or external docs. | Empty string if unavailable. |
| `identity.entity_type` | Legal form only, e.g. Private Limited, LLC, Inc., SAS. | Legal name suffix or explicit legal notice. | Business category such as SaaS, AI lab, platform. | Empty string if not visible. |
| `identity.entity_type_family` | Family of legal form: `india`, `us`, `eu_uk`, `other`, `unknown`. | Entity form and jurisdiction evidence. | Founder location or customer market. | `unknown`. |
| `identity.corporate_status_signal` | Published status signal, not a legal conclusion. | “company”, “private limited”, “incorporated”, registration notice if visible. | Good standing/compliance assumptions. | `not visible in admitted evidence`. |
| `identity.operator_or_controller_signal` | Who appears to operate/control the service. | Privacy controller/operator clauses, terms contracting party. | Brand assumption alone. | `not visible in admitted evidence`. |
| `identity.identity_confidence` | Confidence in identity extraction. | Specificity/consistency of evidence. | Optimism. | `unknown` if weak. |

### `jurisdiction`

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `jurisdiction.registered_or_notice_country` | Country from registered/contact/controller/notice address. | Privacy/terms/contact/footer/legal notice. | Domain suffix or customer geography. | Empty string. |
| `jurisdiction.registered_or_notice_state` | State/province/region from address. | Same as above. | Country-level inference. | Empty string. |
| `jurisdiction.city` | City from strongest address evidence. | Address/contact/legal notice. | Headquarters assumptions. | Empty string. |
| `jurisdiction.full_address` | Strongest full published address. | Contact, terms, privacy, legal notice. | Constructed address from fragments unless clearly same source. | Empty string. |
| `jurisdiction.governing_law_country` | Country whose law governs terms/contracts. | Governing-law clause. | Registered address alone. | Empty string. |
| `jurisdiction.governing_law_state` | State/region in governing-law clause. | Governing-law clause. | Registered address alone. | Empty string. |
| `jurisdiction.courts_or_venue` | Published forum/court/arbitration venue. | Dispute resolution/venue clause. | Registered address alone. | Empty string. |
| `jurisdiction.source_basis` | Short basis explaining which source establishes jurisdiction fields. | Source title/URL/quote summary. | Legal opinion. | `not visible in admitted evidence`. |
| `jurisdiction.confidence` | Confidence in jurisdiction extraction. | Directness and specificity of source. | Assumptions. | `unknown`. |

### `business_model`

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `business_model.business_category` | Commercial/product category. | Product/about pages. | Legal entity type. | Empty string. |
| `business_model.primary_customer_type` | Main visible customer/user class. | Enterprise/customer/developer/consumer language. | Investor assumptions. | `unknown`. |
| `business_model.market_type_candidate` | `b2b`, `b2c`, `hybrid`, or `unknown`. | Customer language, sales motion, docs audience. | Company size or tech category alone. | `unknown`. |
| `business_model.sales_motion` | Visible go-to-market motion. | Contact sales, API self-serve, demo CTA, pricing. | Assumptions from enterprise wording alone. | `not visible in admitted evidence`. |
| `business_model.revenue_model_signal` | Visible revenue/pricing model signal. | Pricing page, paid plan, API pricing, quote/demo. | Existence of product alone. | `not visible in admitted evidence`. |
| `business_model.enterprise_or_self_serve_signal` | Whether public evidence suggests enterprise, self-serve, or both. | Enterprise/contact/demo/docs/signup. | Brand maturity assumptions. | `unknown`. |
| `business_model.public_sector_signal` | Public sector/government/regulated public-service signal. | Public sector pages, government case studies. | India/government references unless customer-facing. | `not visible in admitted evidence`. |
| `business_model.business_model_confidence` | Confidence in model classification. | Evidence specificity. | Assumptions. | `unknown`. |

### `market_context`

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `market_context.industry` | Public industry/category. | Product/about/use-case pages. | Registry rows. | Empty string. |
| `market_context.target_geographies` | Target regions/countries explicitly served or marketed. | Geography/language/customer pages. | Incorporation location alone. | `[]`. |
| `market_context.target_languages` | Languages explicitly supported/targeted. | Product/model/docs pages. | Country inference alone. | `[]`. |
| `market_context.regulated_sector_hints` | Non-final hints of healthcare/finance/education/employment/etc. | Use-case/product pages. | Legal boilerplate prohibitions. | `[]`. |
| `market_context.market_context_confidence` | Confidence in market context. | Specificity of public evidence. | Assumptions. | `unknown`. |

### `product_baseline`

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `product_baseline.high_level_offering` | One concise statement of what the company publicly offers. | Homepage/product pages. | Detailed feature archetypes. | Empty string. |
| `product_baseline.primary_claim` | Main public value/positioning claim. | Homepage/hero/product page. | Legal claims or registry logic. | Empty string. |
| `product_baseline.products[]` | Public product/application/API/model labels with evidence. | Product/docs/model pages. | Inferred internal modules. | `[]`. |
| `product_baseline.delivery_app_candidate` | Whether app/UI delivery is visible. | App, dashboard, studio, console, web UI, CTA evidence. | Generic “platform” alone. | `unknown`. |
| `product_baseline.delivery_api_candidate` | Whether API/docs/developer delivery is visible. | API docs, developer pages, endpoints, SDKs. | Tech company assumption. | `unknown`. |
| `product_baseline.beta_or_preview_signal` | Visible beta/preview/early-access signal. | Product pages/docs. | Product novelty. | `not visible in admitted evidence`. |
| `product_baseline.integration_candidates[]` | Visible integrations/tool connectors. | Docs/product pages naming integrations. | Generic “integrates with your stack”. | `[]`. |

### `data_touchpoint_map[]`

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `touchpoint_id` | Stable ID like `DT001`. | Sequential assignment. | Model randomness beyond order. | Required if entry exists. |
| `actor` | Who provides/uses the touchpoint. | Source language. | Assumption. | `unknown`. |
| `data_subject` | Whose data is involved. | Privacy/product/docs. | User stereotype. | `unknown`. |
| `data_category` | Data type: account, contact, prompt, uploaded_file, generated_output, audio, text, document, image, video, code, api_payload, usage_log, payment, support, sensitive, unknown. | Source language. | Boilerplate prohibitions. | `unknown`. |
| `collection_or_processing_context` | How/why the touchpoint is processed. | Product/privacy/docs. | Legal conclusion. | `not visible in admitted evidence`. |
| `source_url` | Source URL proving the touchpoint. | Admitted source. | Discovery-only URL. | Empty only if no entry. |
| `evidence_quote` | Short quote proving the touchpoint. | Admitted text. | Fabrication. | Empty only if no entry. |
| `confidence` | Confidence. | Source specificity. | Assumptions. | `unknown`. |

### `vault_baseline_candidates`

All candidate leaf fields use the same object:

```json
{
  "value": "",
  "status": "PREFILL_READY | CONFIRM | UNKNOWN",
  "basis": "",
  "confidence": "high | medium | low | unknown",
  "evidence_refs": []
}
```

| Field group | Definition | Derive from | Absence handling |
|---|---|---|---|
| `baseline.company` | Legal company/name candidate; legal name beats brand. | `identity.legal_name`, then brand only if no legal name. | `UNKNOWN`. |
| `baseline.entity_type` | Legal form candidate. | `identity.entity_type`. | `UNKNOWN`. |
| `baseline.address` | Address candidate. | `jurisdiction.full_address`. | `UNKNOWN`. |
| `baseline.legal_email` | Legal/contact email candidate. | Terms/contact/legal notice. | `UNKNOWN`. |
| `baseline.privacy_email` | Privacy/DPO/contact email candidate. | Privacy policy. | `UNKNOWN`. |
| `baseline.products` | Public product list candidate. | `product_baseline.products`. | `UNKNOWN` or empty list. |
| `baseline.jurisdiction.country/state` | Jurisdiction candidates. | Registered/notice/governing law fields. | `UNKNOWN`. |
| `baseline.market` | B2B/B2C/hybrid market candidate. | `business_model.market_type_candidate`. | `UNKNOWN`. |
| `baseline.delivery.app/api` | App/API delivery candidates. | `product_baseline.delivery_*`. | `UNKNOWN`. |
| `baseline.revenue_model` | Revenue model candidate. | Explicit pricing/revenue signal only. | `UNKNOWN`. |
| `baseline.has_beta` | Beta/preview candidate. | `beta_or_preview_signal`. | `UNKNOWN`. |
| `baseline.integrations.*` | Specific integrations. | `integration_candidates`. | `UNKNOWN` or false with evidence. |
| `compliance.processes_pii` | Candidate that product/processes personal data. | Data touchpoints/privacy evidence. | `UNKNOWN`. |
| `compliance.eu_users` | Candidate EU users/region. | Target geography/privacy region language. | `UNKNOWN`. |
| `compliance.ca_users` | Candidate California users/region. | Privacy region language. | `UNKNOWN`. |
| `compliance.other_regions` | Other visible regulated/geographic regions. | Privacy/market evidence. | `UNKNOWN` or list. |

## Stage 5 — `feature_profile_v2`

### Top level

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `feature_profile_version` | Object version marker. | Always set to `feature_profile_v2`. | Model choice. | Must equal `feature_profile_v2`. |
| `target_profile_ref` | Read-only Stage 4 identity reference. | Stage 4 `target_profile_v2`. | Re-extraction from Stage 5 sources unless Stage 4 absent. | Use unknown strings and limitation if Stage 4 absent. |
| `feature_inventory[]` | Canonical atomic feature/function inventory. | Product/docs/API/model pages and admitted evidence. | Marketing labels without function detail. | Emit only evidence-supported features. |
| `product_feature_map[]` | Legacy compatibility alias. | Deterministic downstream alias only. | Model-authored second copy. | Set to `[]` in model output. |
| `data_provenance_map[]` | Strict flattened view of feature-level provenance. | Flatten `feature_inventory[].data_provenance[]` with IDs. | Lightweight company-level notes. | If no feature-level provenance exists, `[]` and limitation. |
| `regulated_surface_map[]` | Per-feature surface map with INT/EXT orientation. | Feature surface provenance. | Company-wide category. | `[]` if no surfaces. |
| `architecture_hints[]` | Explicit product/docs architecture hints only. | Product/docs/trust evidence. | Private architecture guessing. | `[]`. |
| `commercial_scan` | Scan of distinct commercial outcomes and mapping to CORE features. | First-party product/application/use-case pages. | Investor assumptions or menu labels without detail. | Empty arrays with limitation if thin. |
| `vault_feature_candidates` | Feature-derived baseline/archetype/compliance candidate projection. | Feature inventory and provenance. | Architecture or final Vault handoff. | Empty objects where unsupported. |
| `evidence` | Field-level evidence audit for material Stage 5 claims. | Evidence refs and bases. | Fabrication. | Use unresolved questions for missing facts. |
| `limitations` | Source-bounded Stage 5 limitations. | Missing/ambiguous evidence. | Speculation. | `[]` if none. |

### `target_profile_ref`

| Field | Definition | Derive from | Absence handling |
|---|---|---|---|
| `target_profile_version` | Stage 4 version marker. | Stage 4 profile. | `target_profile_v2` if Stage 4 absent but note limitation. |
| `brand_name` | Stage 4 brand name. | `identity.brand_name`. | Empty string. |
| `legal_name` | Stage 4 legal name. | `identity.legal_name`. | Empty string. |
| `domain` | Stage 4 domain. | `identity.domain`. | Empty string. |

### `feature_inventory[]`

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `feature_id` | Stable ID like `F001`. | Sequential feature order. | Product database IDs unless visible and stable. | Required. |
| `feature_name` | Short functional name. | Evidence-supported capability. | Brand slogan. | Required for emitted feature. |
| `feature_role` | `CORE` or `SECONDARY`. | Commercial independence. | Arbitrary one-core cap. | Required; if unclear use `SECONDARY` only where dependency is clear, otherwise do not emit. |
| `commercial_function` | Business outcome the feature serves. | Product/use-case evidence. | Generic AI value. | Required; use conservative text. |
| `business_label_or_product_area` | Public product/app/model/API label associated with the feature. | Source label. | Canonical behavior itself. | Use `not visible in admitted evidence` if unlabeled. |
| `feature_description` | Mechanical description of function. | Evidence-supported input/action/output. | Marketing adjectives. | Required. |
| `actor_or_user` | Who uses/calls/administers the feature. | Product/docs/API language. | Assumption. | `unknown`. |
| `input_data[]` | Inputs consumed by feature. | Docs/product evidence. | Generic AI input assumptions. | `[]` only if truly not visible; also add unknown data provenance. |
| `system_action` | What the system does to input. | Evidence. | Legal effect or risk conclusion. | Required. |
| `output_or_result` | Output/result produced. | Evidence. | Assumed business result. | Required. |
| `autonomy_level` | `none`, `draft`, `recommend`, `execute`, `unknown`. | Evidence of system behavior. | API existence alone. | `unknown`. |
| `human_review_signal` | `required`, `optional`, `not_visible`, `unknown`. | Docs/workflow/UI/evidence. | Assumption. | `not_visible` or `unknown`. |
| `external_action_signal` | Whether feature acts externally. | Product/docs evidence. | Output generation alone. | `unknown` if unclear. |
| `delivery_channels.app/api/web` | Visible delivery channels. | App/API/web/docs evidence. | “platform” alone. | `unknown`. |
| `data_provenance[]` | Feature-level data provenance. Must have at least one entry for each emitted feature. | Feature evidence, privacy/docs/API evidence. | Company-level generic notes alone. | Use unknown provenance entry if details are not visible. |
| `archetype_codes[]` | Registry-key archetype codes matching feature behavior. | Feature behavior + registry key definitions. | Threat rows/Hunter triggers. | `[]` if no code safely applies. |
| `archetype_labels[]` | Labels for codes. | Code-label dictionary. | Model invention. | Must match codes. |
| `archetype_provenance[]` | Evidence/basis for every archetype code. | Feature behavior evidence. | Company category. | No provenance = no code. |
| `surface_tokens[]` | Registry-key surface tokens matching feature data/context. | Data provenance and feature evidence. | Boilerplate prohibitions. | `[]` if no surface safely applies. |
| `surface_provenance[]` | Evidence/basis for every surface token. | Feature/data evidence. | Company-wide risk category. | No provenance = no token. |
| `confidence` | Confidence in feature classification. | Evidence strength. | Optimism. | `unknown` if weak. |
| `evidence_quote` | Quote proving the feature exists. | Admitted source text. | Fabrication. | No quote = do not emit feature. |
| `feature_source_url` | Source URL for feature quote. | Admitted source. | Discovery-only URL. | Required for emitted feature. |
| `evidence_refs[]` | Evidence source IDs/refs. | Evidence buffer/source IDs. | Fabricated refs. | Required; may include source URL if no ID. |
| `linked_threat_ids[]` | Threat IDs linked downstream. | Explicit threat mapping context only. | Stage 5 inference. | `[]`. |

### `data_provenance[]` and `data_provenance_map[]`

Each feature must contain at least one provenance entry. If public evidence does not disclose a sub-fact, preserve the entry and set the unknown sub-field rather than deleting the entry.

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `data_origin` | Source of data: user/customer/third party/public/system/unknown. | Feature/docs/privacy language. | Assumption from product category. | `unknown`. |
| `data_subject` | Whose data is involved. | Docs/privacy/product. | User stereotype. | `unknown`. |
| `data_category` | Data type: prompt, account, contact, uploaded_file, generated_output, audio, text, document, image, video, code, api_payload, payment, usage_log, support, sensitive, unknown. | Feature/docs/privacy language. | Boilerplate restrictions. | `unknown`. |
| `processing_context` | What processing occurs and why. | Feature description and docs. | Legal conclusion. | `not visible in admitted evidence`. |
| `storage_or_retention_signal` | Visible storage/retention/deletion signal. | Privacy/trust/docs. | Assumption that SaaS stores data. | `not visible in admitted evidence`. |
| `training_or_finetuning_signal` | Visible training/fine-tuning/model-improvement signal. | Privacy/AI/data-use docs. | Assumption from AI model use. | `not visible in admitted evidence`. |
| `source_url` | Source for the provenance claim. | Admitted evidence. | Discovery-only URL. | Use feature source URL if the feature evidence proves the input/action but not retention/training. |
| `evidence_quote` | Quote supporting positive provenance. | Admitted text. | Fabrication. | Use feature quote for input/action provenance; use `NOT_PUBLISHED_IN_ADMITTED_EVIDENCE` only for undisclosed retention/training sub-signals. |
| `confidence` | Confidence in provenance. | Evidence specificity. | Assumption. | `unknown` if not visible. |

Top-level `data_provenance_map[]` entries must add:

| Field | Definition |
|---|---|
| `provenance_id` | Stable ID like `DP001`. |
| `feature_id` | Feature ID that this provenance belongs to. |

### Archetype provenance

| Field | Definition | Absence handling |
|---|---|---|
| `archetype_code` | One of `UNI`, `DOE`, `JDG`, `CMP`, `CRT`, `RDR`, `ORC`, `TRN`, `SHD`, `OPT`, `MOV`. | Omit code if behavior not safely matched. |
| `registry_key_detection_logic` | Short dictionary basis for the selected archetype. | Required for each selected code. |
| `matched_feature_behavior` | Specific behavior in the feature that matches the archetype. | Required for each selected code. |
| `evidence_quote` | Quote proving matched behavior. | Required for positive archetype claim. |
| `source_url` | Source URL for quote. | Required for positive archetype claim. |
| `confidence` | Confidence. | `unknown` if weak; omit code if not enough. |

Archetype quick meanings:

| Code | Meaning | Negative control |
|---|---|---|
| `UNI` | Universal AI-output/reliance behavior. | Do not use as fallback for uncertainty. |
| `DOE` | Acts on user’s behalf without per-action approval. | API availability alone is not DOE. |
| `JDG` | Consequential judgment/score/ranking about humans. | Generic analytics is not JDG. |
| `CMP` | Emotional/relational companion. | Chat UI alone is not CMP. |
| `CRT` | Creates text/code/media/synthetic output. | Hosting models alone is not enough unless generation behavior is visible. |
| `RDR` | Reads/ingests third-party, external, public, or customer-provided source material as functional input. | A prompt alone is not RDR. |
| `ORC` | Dynamically routes across models/agents/tools/subprocessors. | One model API is not ORC. |
| `TRN` | Audio/voice/biometric signal processing or transformation. | Raw audio is not biometric unless identity/voiceprint/speaker recognition is visible. |
| `SHD` | Security defense/monitoring/protection. | General logging is not SHD. |
| `OPT` | High-stakes optimization moving money or controlling critical operations. | Generic workflow prioritization is not OPT. |
| `MOV` | Physical-world control/actuation. | Digital data movement is not MOV. |

### Surface provenance

| Field | Definition | Absence handling |
|---|---|---|
| `surface_token` | One allowed surface token. | Omit token if not safely matched. |
| `registry_key_surface_meaning` | Short dictionary meaning for the selected surface. | Required for each selected token. |
| `matched_data_or_context` | Specific data/context in feature matching the surface. | Required for each selected token. |
| `evidence_quote` | Quote proving surface. | Required for positive surface claim. |
| `source_url` | Source URL for quote. | Required for positive surface claim. |
| `confidence` | Confidence. | `unknown` if weak; omit surface if not enough. |

Surface quick meanings:

| Token | Meaning | Negative control |
|---|---|---|
| `Consumer-Public` | Public/consumer-facing user context. | Public website alone is not consumer-facing product. |
| `Enterprise-Private` | Enterprise/internal/private customer context. | Enterprise marketing alone is not PII. |
| `PII` | Personal data such as identifiers, account/contact/user data. | Generic privacy policy alone is not enough unless feature/process uses personal data. |
| `Employment` | Hiring, HR, workforce, employee/applicant context. | Employment boilerplate is not enough. |
| `Sensitive/Biometric` | Sensitive/special-category/biometric/voiceprint/health/etc. | Audio alone is not biometric. |
| `Financial` | Payments, credit, insurance, trading, financial decisions/data. | Payment terms alone are not enough. |
| `Content&IP` | User/customer content, generated content, uploaded documents, media, code, IP-bearing material. | Mere marketing copy is not enough. |
| `Safety&Physical` | Physical safety, emergency, medical, or physical-world harm context. | Safety disclaimers alone are not enough. |
| `Infrastructure` | Developer/API/system infrastructure dependency. | Any API docs alone may support delivery channel, but surface needs product dependence or infrastructure operation. |
| `Minors` | Children/minor users or child-directed processing. | Age restriction/prohibition alone is not enough. |

### `regulated_surface_map[]`

| Field | Definition | Derive from | Absence handling |
|---|---|---|---|
| `surface_id` | Stable ID like `RS001`. | Sequential. | Required if entry exists. |
| `feature_id` | Feature tied to surface. | `feature_inventory[].feature_id`. | Required if entry exists. |
| `surface_token` | Surface token. | `surface_tokens[]`. | Required if entry exists. |
| `int_ext_classification` | Whether surface is internal, external, both, unknown. | Feature flow evidence. | `unknown`. |
| `basis` | Short source-bounded reason. | Surface provenance. | Required if entry exists. |
| `confidence` | Confidence. | Evidence specificity. | `unknown`. |
| `evidence_refs[]` | Evidence refs. | Source IDs/URLs. | Required if entry exists. |

### `architecture_hints[]`

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `hint_id` | Stable ID like `AH001`. | Sequential. | N/A. | Required if entry exists. |
| `feature_id` | Related feature. | Feature ID. | Company-level architecture guess. | Required if entry exists. |
| `hint_type` | `memory`, `model_provider`, `cloud_host`, `vector_db`, `subprocessor`, `integration`, `unknown`. | Explicit product/docs/trust evidence. | Case law names or generic AI provider examples. | `unknown` if unclear. |
| `hint_value` | The visible provider/tool/architecture clue. | Source quote. | Inference. | Empty string if not useful; prefer no entry. |
| `disposition` | `prefill_candidate`, `confirmation_only`, or `ignore`. | Evidence quality. | Overconfidence. | `confirmation_only` when suggestive. |
| `source_url` | Source URL. | Admitted source. | Discovery-only URL. | Required if entry exists. |
| `evidence_quote` | Quote. | Admitted source. | Fabrication. | Required if entry exists. |
| `confidence` | Confidence. | Evidence specificity. | Assumption. | `unknown`. |

### `commercial_scan`

| Field | Definition | Derive from | Absence handling |
|---|---|---|---|
| `distinct_commercial_outcomes_seen[]` | Outcomes/products the target appears to sell. | Product/application/use-case pages. | Menu labels without function detail. | `[]` and limitation. |
| `mapped_core_feature_ids[]` | CORE feature IDs mapped from outcomes. | `feature_inventory[]`. | Secondary features. | `[]` if no CORE. |
| `unmapped_outcomes_due_to_insufficient_detail[]` | Visible outcomes with insufficient functional detail. | Public product labels without mechanics. | Speculation. | `[]`. |

### `vault_feature_candidates`

| Group | Definition | Derive from | Absence handling |
|---|---|---|---|
| `baseline` | Feature-derived baseline candidates such as products/delivery. | Feature inventory and delivery channels. | Identity/legal fields. | `{}`. |
| `archetypes` | Feature-derived archetype candidates. | Archetype provenance. | Threat row status. | `{}`. |
| `compliance` | Feature/surface/data-derived compliance candidates. | Data/surface provenance. | Legal boilerplate alone. | `{}`. |

### `evidence` and `limitations`

| Field | Definition | Derive from | Absence handling |
|---|---|---|---|
| `evidence.field_evidence_refs[]` | Material field evidence audit. | Feature/provenance refs. | Fabrication. | Use empty only if no material evidence. |
| `evidence.unresolved_questions[]` | Questions created by missing public evidence. | Missing fields/sub-facts. | Speculation. | `[]`. |
| `limitations[]` | Source-bounded caveats. | Missing/ambiguous evidence. | General disclaimers. | `[]`. |
