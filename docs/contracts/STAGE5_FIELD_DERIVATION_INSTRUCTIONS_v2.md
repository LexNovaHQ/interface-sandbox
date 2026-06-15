# STAGE5_FIELD_DERIVATION_INSTRUCTIONS_v2

## Status

Locked design artifact for Stage 5 hybrid rebuild. This file does not yet modify runtime behavior by itself. The next implementation step must wire this instruction block into the active `target_feature_profile` prompt path and enforce matching guardrails/repair behavior.

## Authority

This instruction block sits under the Diligence Canon Field Dictionary and Registry Key. It operationalizes Stage 5 field derivation. It does not replace Stage 7 registry evaluation and it must not introduce registry threat-row reasoning into Stage 5.

Stage 5 owns:

```text
feature_profile_v2
feature_inventory[]
data_provenance_map[]
regulated_surface_map[]
architecture_hints[]
commercial_scan
vault_feature_candidates
evidence.field_evidence_refs[]
limitations[]
```

Stage 5 must not own:

```text
registry threat IDs
Hunter Trigger evaluation
final exposure findings
legal document cartography
Vault handoff
Stage 9 report findings
```

---

# 1. Baseline derivation logic from Sarvam AI public diligence

This baseline exists to make the derivation rules concrete. It is not a hardcoded Sarvam rule. It is a calibration case showing how a public AI platform should be decomposed.

## 1.1 Product areas are not automatically features

Sarvam public labels such as `Samvaad`, `Arya`, `Studio`, `Akshar`, `Edge`, `Models`, and `Integrations` are product areas, platform areas, or source-page labels unless the evidence shows that the label itself is the atomic customer-facing function.

A product area may contain several atomic features. The model must decompose product areas into atomic functions.

| Public label | Candidate bucket | Reason |
|---|---|---|
| Samvaad | PRODUCT_AREA | Conversational AI agent product area. It contains voice, WhatsApp, web, enterprise integrations, context, analytics, and action/workflow signals. |
| Arya | PRODUCT_AREA | Enterprise AI agent platform/product area. It contains compliance review, contract review, onboarding, loan processing, candidate screening, patient records, workflow state, tools, audit trail, and deployment controls. |
| Studio | PRODUCT_AREA | Content transformation/workspace area. It may contain dubbing, translation, speech, voice/synthetic media, and generated content features. |
| Akshar | PRODUCT_AREA | Document digitisation product area. Atomic feature is document digitisation/OCR/extraction. |
| Edge | PRODUCT_AREA or ARCHITECTURE_SIGNAL | On-device/deployment area unless decomposed into actual speech/translation/TTS functions. |
| Models | ARCHITECTURE_SIGNAL or MODEL_PLATFORM_SIGNAL | Model catalogue/platform clue, not an atomic feature unless the product sells general assistant/model invocation as the function. |
| Integrations | DELIVERY_CHANNEL_SIGNAL or ARCHITECTURE_SIGNAL | Connector/integration context, not an atomic feature unless a separately sold workflow/connectivity product is visible. |

## 1.2 Expected atomic feature decomposition for Sarvam-type target

For a Sarvam-like target, final `feature_inventory[]` should be closer to atomic functions such as:

| Atomic feature | Likely product area(s) | Likely role | Likely archetypes | Likely surfaces |
|---|---|---|---|---|
| Text-to-Speech / Speech Synthesis | API, Studio, Edge | CORE | CRT, TRN | Content&IP; Sensitive/Biometric only where voice identity/cloning/speaker evidence supports it |
| Speech-to-Text / Transcription | API, Edge, Samvaad | CORE | TRN, RDR | PII, Content&IP, Sensitive/Biometric where voice/biometric/speaker or sensitive audio evidence supports it |
| Translation | API, Studio, Edge | CORE | CRT and/or RDR; TRN only where audio/speech transformation is visible | Content&IP, Enterprise-Private |
| Document Digitisation / OCR / Extraction | Akshar, API | CORE | RDR | PII, Content&IP, Enterprise-Private |
| Dubbing / Synthetic Audio Content | Studio, API | CORE or SECONDARY depending commercial independence | CRT, TRN | Content&IP, Sensitive/Biometric where voice cloning/voice samples are visible |
| Voice Conversational Agent | Samvaad | CORE | TRN, CRT, DOE where it pushes outcomes/actions, ORC where it coordinates channels/tools/systems | Enterprise-Private, PII, Content&IP, Financial where payment/core-banking/loan/collection evidence supports it |
| Enterprise Workflow Agent | Arya | CORE | DOE, ORC, RDR, JDG only where consequential decisions/scoring/review about people/access are visible | Enterprise-Private, PII, Employment, Financial, Content&IP depending use case evidence |
| On-device inference/deployment | Edge | SECONDARY or ARCHITECTURE_SIGNAL | Usually not an archetype by itself; classify underlying atomic speech/translation/TTS features | Infrastructure; Enterprise-Private; possible Sensitive/Biometric depending linked feature |
| Model/API platform | Models/API | SECONDARY or ARCHITECTURE_SIGNAL | UNI only if evidence proves a general-purpose AI assistant/tool function; ORC only if dynamic model/tool routing is visible | Infrastructure |

The above table is a calibration baseline. The model must still derive values from admitted evidence only.

---

# 2. Candidate manifest v2

The deterministic Stage 5 layer must build a high-recall compact candidate manifest. It must not declare final feature truth.

## 2.1 Candidate buckets

Every deterministic candidate must be assigned one initial candidate bucket:

```text
PRODUCT_AREA
ATOMIC_FEATURE_CANDIDATE
DELIVERY_CHANNEL_SIGNAL
DATA_SIGNAL
ARCHITECTURE_SIGNAL
COMMERCIAL_OUTCOME_SIGNAL
LEGAL_CONTROL_SIGNAL
DUPLICATE_OR_ALIAS
INSUFFICIENT_FEATURE_EVIDENCE
```

Only `ATOMIC_FEATURE_CANDIDATE` may become a final `feature_inventory[]` row. Product areas and signals are context for decomposition and field derivation.

## 2.2 Candidate manifest shape

```json
{
  "candidate_manifest_version": "stage5_candidate_manifest_v2",
  "candidate_summary": {
    "source_count": 0,
    "candidate_count": 0,
    "product_area_count": 0,
    "atomic_feature_candidate_count": 0,
    "signal_candidate_count": 0
  },
  "product_area_candidates": [],
  "atomic_feature_candidates": [],
  "delivery_channel_candidates": [],
  "data_signal_candidates": [],
  "architecture_signal_candidates": [],
  "commercial_outcome_candidates": [],
  "legal_control_signal_candidates": [],
  "duplicate_or_alias_candidates": [],
  "insufficient_feature_evidence_candidates": []
}
```

## 2.3 Candidate item minimum shape

```json
{
  "candidate_id": "C001",
  "candidate_bucket": "PRODUCT_AREA | ATOMIC_FEATURE_CANDIDATE | DELIVERY_CHANNEL_SIGNAL | DATA_SIGNAL | ARCHITECTURE_SIGNAL | COMMERCIAL_OUTCOME_SIGNAL | LEGAL_CONTROL_SIGNAL | DUPLICATE_OR_ALIAS | INSUFFICIENT_FEATURE_EVIDENCE",
  "candidate_name": "",
  "source_id": "",
  "source_url": "",
  "source_family": "product | docs_developer | commercial | legal | governance | unknown",
  "source_title": "",
  "evidence_refs": [],
  "deterministic_signals": [],
  "possible_product_area": "",
  "possible_atomic_feature": "",
  "possible_archetypes": [],
  "possible_surfaces": [],
  "candidate_confidence": "high | medium | low | unknown"
}
```

---

# 3. Product-area to atomic-feature decomposition

The model's first Stage 5 task is not final schema filling. It must classify and decompose candidates.

For every product-area candidate, answer:

```text
1. Is this public label a product area/platform/source label rather than an atomic feature?
2. Which atomic feature candidates are inside or associated with this product area?
3. Which signals are only delivery/data/architecture/commercial context?
4. Which candidates are aliases or duplicates?
5. Which candidates have insufficient feature evidence and must not enter feature_inventory[]?
```

Final `feature_inventory[]` must contain only atomic commercial/product functions, not product areas, page labels, or pure architecture signals.

---

# 4. No-zero-archetype and no-zero-surface final-feature rule

A final emitted atomic feature may not have zero archetypes.

```text
feature_inventory[n].archetype_codes.length >= 1
feature_inventory[n].archetype_provenance.length >= 1
```

A final emitted atomic feature may not have zero surfaces.

```text
feature_inventory[n].surface_tokens.length >= 1
feature_inventory[n].surface_provenance.length >= 1
```

If no archetype or no surface safely applies, the candidate must not remain in `feature_inventory[]`. It must be moved to `unresolved_feature_candidates[]` or a non-feature candidate bucket.

`UNI` is not an uncertainty fallback. Use `UNI` only where the admitted evidence supports a general-purpose AI assistant/tool or universal AI-output/reliance behavior. If the model is unsure, do not assign `UNI`; mark unresolved.

---

# 5. Field-by-field derivation instructions

## 5.1 `feature_inventory[]`

For every final atomic feature row, derive fields as follows.

| Field | Derivation rule | Deterministic/model split | Failure handling |
|---|---|---|---|
| `feature_id` | Assign stable sequential IDs after final atomic feature ordering: `F001`, `F002`, etc. | Deterministic. | Required. |
| `feature_name` | Short atomic function name describing capability, not product label. Use noun/function phrase: `Speech-to-Text Transcription`, not `Samvaad`. | Deterministic candidate suggests; model normalizes. | If only a product label exists, do not emit as feature. |
| `feature_role` | `CORE` if independently marketed/sold/API-exposed/customer-value function. `SECONDARY` if dependency, deployment variant, enabler, or support capability. No arbitrary one-core cap. | Model resolves from commercial independence; deterministic can seed from product/API page. | If unclear and not independently useful, use `SECONDARY` only where dependency is clear; otherwise unresolved. |
| `commercial_function` | State the business/customer outcome the feature serves, from product/use-case evidence. | Model synthesis from admitted evidence. | Use conservative text; do not invent ROI/use case. |
| `business_label_or_product_area` | Public product/app/API/model label associated with the feature. | Deterministic from source title/URL/nav/product label; model resolves multiple labels. | Use `not visible in admitted evidence` only if feature has no public label. |
| `feature_description` | Mechanical input/action/output sentence. | Model. | Must avoid marketing adjectives. |
| `actor_or_user` | User/caller/admin/customer/developer who uses or receives the feature. | Deterministic hints from docs/product pages; model normalizes. | `unknown` if not visible. |
| `input_data[]` | List evidence-backed inputs consumed: text, audio, uploaded_file, document, image, API payload, customer data, etc. | Mostly deterministic from terms and candidates; model confirms. | Empty only if truly not visible; still include unknown data provenance. |
| `system_action` | Verb phrase for system operation: transcribes, translates, synthesizes, extracts, routes, recommends, executes, scores, monitors, stores, logs. | Model from evidence. | Required for emitted feature. |
| `output_or_result` | Output/result type: transcript, audio, translated text, structured data, generated content, action outcome, decision/recommendation, dashboard insight. | Model from evidence. | Required for emitted feature. |
| `autonomy_level` | `none` for passive transformation; `draft` for generated draft; `recommend` for recommendations/scores; `execute` for actions/tool calls/workflows; `unknown` if not visible. | Model with deterministic action cues. | Do not use `execute` merely because API exists. |
| `human_review_signal` | `required`, `optional`, `not_visible`, or `unknown`; derive from workflow/policy/UI/docs, including explicit human review claims. | Model; deterministic legal-policy extractor may seed. | Do not infer HITL from “enterprise” or “audit trail” alone. |
| `external_action_signal` | `true` if evidence shows feature sends, books, pays, updates, pushes outcomes, triggers workflows, writes to external systems, or calls tools/APIs beyond producing output. `false` if evidence shows only generation/transformation. `unknown` if unclear. | Model with deterministic action/integration cues. | API availability alone is not external action. |
| `delivery_channels.app/api/web` | Set true where admitted evidence shows app, dashboard, Studio, UI, API docs, SDK, REST, web agent, browser/playground, or web channel. | Mostly deterministic. | Do not leave all unknown where API/docs/UI evidence exists. |
| `data_provenance[]` | At least one entry per feature; preserve unknown subfields rather than deleting. | Deterministic data-category extraction + model context. | Required. |
| `archetype_codes[]` | One or more locked registry archetype codes matching feature behavior. | Model classification against registry key and negative controls. | Must be >=1 for final feature; otherwise move to unresolved. |
| `archetype_labels[]` | Labels from registry key for selected codes. | Deterministic map. | Must match selected codes. |
| `archetype_provenance[]` | One provenance row per selected archetype. | Model writes matched behavior; deterministic supplies evidence refs/source URL. | No provenance = remove code or reinvestigate. |
| `surface_tokens[]` | One or more locked surface tokens matching feature data/context. | Model classification against registry key and negative controls. | Must be >=1 for final feature; otherwise move to unresolved. |
| `surface_provenance[]` | One provenance row per selected surface token. | Model writes matched context; deterministic supplies evidence refs/source URL. | No provenance = remove token or reinvestigate. |
| `confidence` | `high` direct specific evidence, `medium` supported interpretation, `low` weak signal, `unknown` not visible. | Model finalizes from evidence strength. | Do not use high for inferred classifications. |
| `feature_source_url` | Primary admitted source URL proving feature existence. | Deterministic from evidence refs. | Required for final feature. |
| `evidence_refs[]` | Evidence refs proving feature existence and material fields. | Deterministic. | Required for final feature. |
| `linked_threat_ids[]` | Always empty in Stage 5 unless explicitly supplied by external mapping. | Deterministic. | Stage 5 must not infer threat IDs. |

## 5.2 `data_provenance[]` and `data_provenance_map[]`

Every final feature must contain at least one data provenance entry. Top-level `data_provenance_map[]` is a deterministic flattened view of feature-level provenance.

| Field | Derivation rule |
|---|---|
| `data_origin` | Choose from `user_provided`, `customer_provided`, `third_party_source`, `public_web`, `system_generated`, `unknown`. Use product/docs/privacy language. |
| `data_subject` | Choose from `user`, `customer`, `employee`, `consumer`, `developer`, `child`, `business_entity`, `unknown`. Use feature context and privacy/product language. |
| `data_category` | Choose from schema enum only. Map audio/voice to `audio`, uploaded PDFs/images to `uploaded_file`/`document`/`image`, generated text/audio to `generated_output`, API requests to `api_payload`, account/contact/payment/logs as stated. |
| `processing_context` | Describe processing tied to the feature action, not generic privacy boilerplate. |
| `storage_or_retention_signal` | Use explicit privacy/trust/docs retention/storage evidence. If feature exists but retention is not disclosed, say `not visible in admitted evidence`. |
| `training_or_finetuning_signal` | Use explicit policy/model-improvement/fine-tuning/training evidence. If not visible, say so. |
| `source_url` | Primary source for data claim; use feature source when only input/action is known and legal-policy source when retention/training is known. |
| `evidence_refs[]` | Required; use source/chunk refs. |
| `confidence` | Based on specificity. |

## 5.3 Archetype classification

Allowed archetype codes:

```text
UNI DOE JDG CMP CRT RDR ORC TRN SHD OPT MOV
```

| Code | Apply when | Do not apply when |
|---|---|---|
| `UNI` | Evidence shows general-purpose AI assistant/tool or universal AI-output/reliance behavior. | Do not use as uncertainty fallback. |
| `DOE` | Feature takes autonomous actions in the world or on user/customer systems without per-action approval: sends, books, updates, pushes outcomes, triggers workflows, calls tools/APIs. | API availability or generated output alone. |
| `JDG` | Feature outputs consequential decision/score/ranking/review about humans or access to opportunities/services, e.g. hiring, credit, healthcare, insurance, eligibility. | Generic analytics, dashboards, or document processing without consequential decisioning. |
| `CMP` | Ongoing emotional/relational companion is primary function. | Chat/conversational UI alone. |
| `CRT` | Feature generates new copyrightable or synthetic output: text, code, audio, video, image, translation, dubbing, synthetic speech, generated content. | Hosting models without visible generation. |
| `RDR` | Feature ingests third-party/customer/user-provided source material as functional input: documents, PDFs, files, transcripts, external records, RAG/source reading. | A prompt alone. |
| `ORC` | Feature dynamically routes across multiple models, agents, tools, APIs, subprocessors, workflow steps, or agent frameworks. | One model API or simple integration mention. |
| `TRN` | Feature processes or transforms audio/voice/biometric signals as input or output, including speech-to-text, text-to-speech, voice agents, dubbing, voice cloning. | Raw audio mention without processing/transformation. |
| `SHD` | Feature defends, monitors, detects, or protects security systems. | General audit logs/security controls. |
| `OPT` | Feature performs high-stakes optimization that directly moves money or controls critical operations. | Generic workflow prioritization. |
| `MOV` | Feature governs a physical system or physical-world actuation. | Digital data movement. |

For every selected archetype, create `archetype_provenance[]` with:

```text
archetype_code
registry_key_detection_logic
matched_feature_behavior
source_url
evidence_refs[]
confidence
```

## 5.4 Surface classification

Allowed surface tokens:

```text
Consumer-Public
Enterprise-Private
PII
Employment
Sensitive/Biometric
Financial
Content&IP
Safety&Physical
Infrastructure
Minors
```

| Surface | Apply when | Do not apply when |
|---|---|---|
| `Consumer-Public` | Public/consumer-facing product or user flow. | Public website alone. |
| `Enterprise-Private` | B2B, enterprise, government, private deployment, internal workflow, customer systems, or enterprise contracts. | Enterprise marketing alone without product context is weak but may be medium if tied to feature. |
| `PII` | Feature handles identifiers, contact/account/user/customer/employee/consumer data. | Generic privacy policy alone unless linked to feature processing. |
| `Employment` | Feature touches hiring, HR, workforce, candidate screening, employee data. | Employment boilerplate. |
| `Sensitive/Biometric` | Feature processes sensitive/special-category/biometric/voice cloning/voiceprint/health data. Audio alone is usually TRN; use this surface when voice biometric, consent, cloning, health, or special-category evidence exists. |
| `Financial` | Feature touches payments, credit, banking, insurance, collections, money movement, financial data/decisions. | Payment terms alone. |
| `Content&IP` | Feature generates, ingests, stores, transforms, or outputs copyrightable/user/customer content, documents, media, code, transcripts. | Marketing copy alone. |
| `Safety&Physical` | Feature can affect physical safety, emergency, medical, physical-world harm, or physical systems. | Generic safety disclaimer. |
| `Infrastructure` | Feature is API/platform/developer/system infrastructure, model serving, deployment, cloud/on-prem, integrations, logs, enterprise infrastructure. | API docs alone may support delivery; use surface where product dependence/infrastructure operation is material. |
| `Minors` | Feature is directed at or accessible to minors/children. | Minors prohibition alone. |

For every selected surface, create `surface_provenance[]` with:

```text
surface_token
registry_key_surface_meaning
matched_data_or_context
source_url
evidence_refs[]
confidence
```

## 5.5 `architecture_hints[]`

Only emit explicit public architecture clues. Do not guess private architecture.

| Hint type | Derive from | Examples |
|---|---|---|
| `memory` | state, memory, context, RAG, retrieval, long-horizon workflow, conversation history. | `state`, `memory`, `context`, `retrieval`, `checkpoint`. |
| `model_provider` | named model provider or model-choice/vender-switch evidence. | OpenAI, Anthropic, Google, Sarvam model, bring-your-own-model, any provider. |
| `cloud_host` | deployment/hosting page or trust/security language. | SaaS, private cloud, VPC, on-prem, air-gapped. |
| `vector_db` | explicit vector database/retrieval store evidence. | Pinecone, Weaviate, Milvus, vector database, embeddings store. |
| `subprocessor` | public subprocessor/DPA/trust/privacy recipient language. | DPA, subprocessors, service providers. |
| `integration` | external systems/tools/connectors. | CRM, core banking, payment systems, APIs, WhatsApp, Slack, webhooks. |
| `unknown` | Avoid if possible; prefer no entry unless the schema requires an entry. | Do not emit empty unknown hints. |

`hint_value` must be useful. If the value is `unknown`, usually omit the hint and add a limitation instead.

## 5.6 `commercial_scan`

`commercial_scan` is the completeness ledger for Stage 5 source accounting.

Rules:

```text
1. Every admitted Stage 5 source must have one source_coverage[] row.
2. Every visible commercial outcome/function must appear in distinct_commercial_outcomes_seen[].
3. Every CORE feature must be mapped in mapped_core_feature_ids[].
4. If an outcome/product label lacks enough mechanics to become an atomic feature, put it in unmapped_outcomes_due_to_insufficient_detail[].
5. completeness_status = COMPLETE only when all Stage 5 sources/outcomes are accounted for and no unmapped outcome remains.
```

## 5.7 `vault_feature_candidates`

This is a non-final Stage 10 helper object. It must be derived from feature inventory/provenance only.

```text
baseline: products, delivery channels, integrations if feature-derived.
archetypes: boolean/candidate flags derived from archetype_codes/provenance.
compliance: PII, sensitive, employment, minors, financial, regions where feature/surface evidence supports it.
```

Do not generate final Vault handoff here.

## 5.8 `evidence.field_evidence_refs[]`

Generate deterministic field-level evidence handles for material feature claims.

Each row must include:

```text
field_path
evidence_refs[]
basis
confidence
```

This should cover at minimum:

```text
/feature_inventory/{i}/feature_name
/feature_inventory/{i}/feature_role
/feature_inventory/{i}/business_label_or_product_area
/feature_inventory/{i}/system_action
/feature_inventory/{i}/output_or_result
/feature_inventory/{i}/delivery_channels
/feature_inventory/{i}/archetype_codes
/feature_inventory/{i}/surface_tokens
/feature_inventory/{i}/data_provenance
/commercial_scan/source_coverage/{i}
```

---

# 6. Stage5R reinvestigation policy

Stage 5 guardrails must not silently pass weak entries. They also must not create infinite loops.

Locked policy:

```json
{
  "max_reinvestigation_passes": 1,
  "max_total_model_passes": 2,
  "max_failed_candidates_per_reinvestigation": 15,
  "max_reinvestigation_input_chars": 60000,
  "max_reinvestigation_output_tokens": 12000,
  "no_recursive_repair": true
}
```

Primary pass failure conditions that trigger Stage5R:

```text
- final feature has zero archetype_codes
- final feature has zero surface_tokens
- feature_source_url is empty
- evidence_refs[] is empty
- archetype code without provenance
- surface token without provenance
- product_area emitted directly as feature without decomposition
- delivery_channels all unknown where API/app/web evidence exists
- external_action_signal unknown where action/integration evidence exists
- data_provenance entry exists only as generic unknown despite feature-specific input evidence
```

Stage5R input must include only failed feature/candidate packets, their evidence refs/snippets, candidate bucket, product area context, and the required field questions. It must not reread the full evidence bundle.

After Stage5R, unresolved candidates must move to `unresolved_feature_candidates[]` or `limitations[]`; they must not remain as final `feature_inventory[]` rows with empty archetype/surface fields.

---

# 7. Degraded fallback handoff to Stage 7

If Stage 5 remains unresolved after the single reinvestigation pass, runtime may continue only in explicit degraded mode.

Stage 5 should expose quality metadata for Stage 7 planning:

```json
{
  "classification_quality": {
    "status": "PASS | DEGRADED",
    "reinvestigation_attempted": true,
    "reinvestigation_pass_count": 1,
    "unresolved_candidate_count": 0,
    "fallback_routing_required": false
  },
  "unresolved_feature_candidates": []
}
```

Stage 7 must not treat unresolved/empty triggers as normal `INT_NOT_TRIGGERED`. If `fallback_routing_required = true`, Stage 7 planner must run the controlled unresolved-feature fallback rows rather than silently marking all relevant INT rows NOT_APPLICABLE.

---

# 8. Token budget discipline

Model tokens should be spent on:

```text
product-area to atomic-feature decomposition
CORE/SECONDARY role judgment
archetype and surface classification with negative controls
ambiguous data provenance context
field-level explanations/provenance text
reinvestigation of failed feature rows
```

Model tokens should not be spent on:

```text
sequential IDs
source URL copying
evidence ref copying
archetype label mapping
surface meaning copying
flattening data_provenance_map[]
flattening regulated_surface_map[]
copying source_coverage rows
copying delivery channel booleans where deterministic evidence exists
```

Target after Batch 2 token optimization:

```text
Sarvam-like target Stage 5 real model token use < 80k
```

Batch 1 prioritizes correctness over token reduction.

---

# 9. Non-negotiable Stage 5 output quality rules

```text
1. Final feature_inventory[] contains only atomic features.
2. Product areas must not be emitted as final features unless the product itself is the atomic capability.
3. Every final atomic feature has >=1 archetype code.
4. Every final atomic feature has >=1 surface token.
5. Every selected archetype has provenance.
6. Every selected surface has provenance.
7. UNI is not an uncertainty fallback.
8. feature_source_url and evidence_refs[] are required for every final feature.
9. product_feature_map[] remains [] as legacy compatibility alias.
10. linked_threat_ids[] remains [] unless explicit external mapping is supplied.
11. Weak/failed rows are reinvestigated once, then moved out of feature_inventory[] if unresolved.
12. Stage 7 receives explicit degraded/fallback metadata instead of being poisoned by empty triggers.
```
