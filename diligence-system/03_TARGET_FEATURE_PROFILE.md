# 03_TARGET_FEATURE_PROFILE.md

# THE INTERFACE — PHASE 3 TARGET FEATURE PROFILE PROMPT

## PHASE_CALL_CARD

```yaml
phase_id: P3_TARGET_FEATURE_PROFILE
phase_name: Target Feature Profile
mode: prompt_live
purpose: >
  Build the canonical target_feature_profile object by decomposing Phase 2 product wrappers
  into evidence-backed atomic feature/functions. Phase 3 identifies feature mechanics,
  behavior archetype provenance, surface provenance, feature-signal aggregation,
  architecture hints, commercial outcome context, vault candidates, evidence support,
  and limitations.
primary_output_object: target_feature_profile
required_top_level_output_keys:
  - feature_profile_forensic_ledger
  - feature_function_trace
  - target_feature_profile
phase_boundary: >
  Phase 3 is a feature/function extraction and classification-provenance phase. It is not
  legal cartography, full data provenance, registry row evaluation, compliance assessment,
  or legal advice.
atomic_unit: feature/function
```

---

## HARD_RULES

### HR3.001 — Atomic Feature Boundary
A product, platform, module, solution, pricing tier, package, slogan, commercial claim, or page title is not automatically a feature. A `feature_inventory[]` item requires visible functional behavior.

### HR3.002 — Primary Evidence Controls Feature Origination
A feature may enter `feature_inventory[]` only when primary product evidence supports its existence and mechanics, unless the API-first promotion exception or degraded root fallback is explicitly satisfied and ledgered.

### HR3.003 — Secondary Evidence Is Enrichment By Default
Secondary evidence may clarify inputs, outputs, delivery channels, API mechanics, integrations, architecture hints, commercial outcomes, and confidence. It must not create standalone feature items by default.

### HR3.004 — System Action and Output Are Lock-Critical
Every emitted feature must have a supported `system_action` and `output_or_result`. If either is missing, route the candidate to `unresolved_feature_candidates[]`.

### HR3.005 — Multi-Archetype, Multi-Surface
One feature may match multiple behavior archetypes and multiple surface tokens. Each match must independently satisfy the locked detection test and evidence requirement.

### HR3.006 — No Universal Registry Rows in Phase 3
Universal registry rows are not feature-derived. Phase 3 does not emit universal row routing. That is deterministic planner work downstream.

### HR3.007 — No Registry Evaluation
Do not emit threat IDs, row statuses, row truth values, condition TRUE/FALSE results, exposure scores, risk levels, or registry conclusions.

### HR3.008 — No Full Data Provenance
Phase 3 may record feature input/action/output and surface context. It must not perform full data-flow mapping, processor/controller analysis, retention analysis, transfer analysis, subprocessor mapping, or privacy compliance review.

### HR3.009 — No Legal or Compliance Conclusions
Allowed language:
- "visible from admitted evidence"
- "not visible in reviewed public footprint"
- "candidate signal only"
- "requires downstream review"
- "requires confirmation"

Forbidden language:
- compliant / non-compliant
- illegal / lawful / unlawful
- liable / liability confirmed
- high-risk AI applies
- GDPR applies
- DPA required
- registry row triggered

### HR3.010 — Evidence Trace Required
Every substantive Phase 3 field must have evidence refs or deterministic derivation basis in `target_feature_profile.evidence`.

### HR3.011 — Definitions Must Be Inline
The archetype definitions, surface definitions, detection tests, exclusion tests, and examples in this prompt are authoritative for this execution. Do not rely on memory or broad semantic similarity.

---

## INPUTS_AND_CONTEXT

```yaml
required_inputs:
  - runtime_slice:
      purpose: active governing rules required by Phase 3
  - runtime_index_slice:
      purpose: phase-specific rule call map
  - source_discovery_handoff:
      purpose: Phase 1 admitted/rejected/quarantined/source-routing result
  - source_discovery_forensic_ledger:
      purpose: upstream evidence custody and admission ledger
  - target_profile:
      purpose: Phase 2 canonical target/company profile and product wrapper baseline
  - feature_profile_package:
      purpose: Phase 1 admitted product evidence routed to Phase 3
  - full_text_artifact_access:
      purpose: selected full-text artifacts by evidence_ref/source_ref when required
```

If required input is missing, emit controlled failure in `feature_function_trace` and `feature_profile_forensic_ledger`. Do not improvise.

### Deterministic Input Fields
`target_profile_ref` is copied deterministically from Phase 2. The model does not derive or re-evaluate these fields.

```yaml
deterministic_copy_only:
  target_feature_profile.target_profile_ref.brand_name: target_profile.identity.brand_name
  target_feature_profile.target_profile_ref.legal_name: target_profile.identity.legal_name
  target_feature_profile.target_profile_ref.domain: target_profile.identity.domain
```

---

## EVIDENCE_HIERARCHY

### P3_PRIMARY_EVIDENCE

Primary evidence controls feature origination.

```yaml
primary_evidence_families:
  - product_platform
  - product_solution
  - product_descendant
```

A feature may originate from these families if they show visible functional behavior.

### P3_SECONDARY_EVIDENCE

Secondary evidence enriches, clarifies, or qualifies already-originated features.

```yaml
secondary_evidence_families:
  - docs_api_developer
  - commercial_product_outcome_pages
  - root_homepage_orientation
```

Secondary evidence may support:
- `input_data`
- `system_action`
- `output_or_result`
- `delivery_channels`
- `api_or_developer_surface_signal`
- `integration_signal`
- `autonomy_level`
- `external_action_signal`
- `architecture_hints[]`
- `commercial_scan`
- confidence adjustment

Secondary evidence must not support:
- wrapper-as-feature creation
- pricing-tier-as-feature creation
- marketing-label-as-feature creation
- speculative feature creation
- registry row evaluation

### API_FIRST_PROMOTION_EXCEPTION

`docs_api_developer` may be promoted from secondary to primary for a specific feature only when all conditions are true:

```yaml
conditions:
  - target product is visibly API-first, developer-first, model-first, or infrastructure-first
  - product/platform/solution evidence identifies the wrapper but lacks feature mechanics
  - docs/API evidence provides explicit endpoint, workflow, input, action, output, integration, SDK, or model behavior
  - promotion is scoped to one feature/function
  - promotion is logged in feature_profile_forensic_ledger
```

Required ledger fields:

```yaml
api_first_promotion_ledger_fields:
  - source_id
  - source_family
  - promoted_to_primary_for_feature_id
  - promotion_reason
  - supporting_evidence_refs
  - confidence_impact
```

### DEGRADED_ROOT_FALLBACK

Root/homepage orientation may support a degraded feature only when no primary product evidence is available, the homepage is admitted first-party evidence, the functional behavior is explicit, and the feature is low confidence. This fallback must be ledgered. It cannot exceed low confidence.

---

## INLINE_ARCHETYPE_DEFINITIONS

Archetype = what the feature does behaviorally. Archetype is not a legal conclusion and not a registry row result. Evaluate every feature against every non-universal behavior archetype independently. A single feature may match multiple archetypes.

| Code | Name | Detection Test | Hard Exclusion |
|---|---|---|---|
| `DOE` | The Doer | Feature takes autonomous external action on a user/customer's behalf without per-action human approval. | Do not match merely because text says agent, automation, workflow, or assistant. Requires external action plus autonomy. |
| `JDG` | The Judge | Feature outputs a score, decision, ranking, recommendation, eligibility, risk, classification, or assessment about a human that may affect access, treatment, opportunity, rights, price, employment, benefits, health, finance, education, or legal outcome. | Do not match generic analytics, dashboards, search, or summarization unless human-consequential scoring/decision context is visible. |
| `CMP` | The Companion | Feature forms or sustains ongoing emotional, relational, therapeutic, romantic, child-facing, or companion-like interaction as a primary function. | Do not match generic assistant/chatbot/support bot unless relationship/emotional/companion function is primary. |
| `CRT` | The Creator | Feature generates new synthetic, expressive, copyrightable, code, image, audio, video, text, design, or media output. | Do not match if feature merely retrieves, displays, stores, or searches existing content without generation/transformation. |
| `RDR` | The Reader | Feature ingests, reads, parses, retrieves, analyzes, summarizes, embeds, or processes third-party/customer/user data it does not own in order to function. | Do not match if no external/customer/user data ingestion is visible. |
| `ORC` | The Orchestrator | Feature dynamically routes, selects, coordinates, or chains requests across multiple models, subprocessors, agents, or model/tool execution paths. | Do not match because API, webhook, integration, static workflow automation, or a single external tool call exists. Requires dynamic multi-model/multi-subprocessor/model-tool orchestration. |
| `TRN` | The Translator | Feature processes audio, voice, speech, diarization, face, voiceprint, biometric, or audio/biometric-derived signals as input/output. | Do not match plain text translation, document OCR, generic image processing, image generation, PDF extraction, or generic multimodal input unless audio, voice, face, biometric, or audio/biometric-derived behavior is explicit. |
| `SHD` | The Shield | Feature monitors, detects, blocks, filters, investigates, scores, or responds to security, abuse, fraud, integrity, or system-threat signals for the purpose of defending or monitoring a system/service. | Do not match generic secure/trust/security claims, compliance dashboards, policy checklists, safety/quality filters, or brand-safety language without explicit system-defense or system-monitoring behavior. |
| `OPT` | The Optimizer | Feature optimizes pricing, allocation, trading, bidding, logistics, operations, financial outcome, resource distribution, or high-stakes business decision loops. | Do not match generic recommendations or analytics without optimization loop affecting money/resources/operations. |
| `MOV` | The Mover | Feature controls, directs, navigates, moves, activates, or influences physical systems, devices, robots, vehicles, sensors, IoT, infrastructure, or real-world machinery. | Do not match digital workflow automation unless physical-world control is visible. |

Archetype tightening controls:

```text
ORC is not generic integration. It requires dynamic multi-model, multi-subprocessor, agent, or model/tool orchestration.
TRN is not generic image/OCR/multimodal processing. It requires audio, voice, speech, face, voiceprint, biometric, or audio/biometric-derived signals.
SHD is not generic trust, safety, compliance, or quality language. It requires system-defense or system-monitoring behavior.
```

Forbidden shortcut examples:

```text
"agent" does not automatically mean DOE
"assistant" does not automatically mean CMP
"automation" does not automatically mean DOE
"analytics" does not automatically mean JDG
"secure" does not automatically mean SHD
"API" does not automatically mean ORC
"webhook" or "integration" does not automatically mean ORC
"image" or "OCR" does not automatically mean TRN
"speech" means TRN only when actual audio/voice/speech/biometric behavior is visible
```

---

## INLINE_SURFACE_DEFINITIONS

Surface = what data, audience, or operational context the feature touches. Surface is not jurisdiction, not a law, not an obligation, and not a registry conclusion. A single feature may match multiple surfaces.

| Surface Token | Phase 3 Meaning | Hard Exclusion |
|---|---|---|
| `Consumer-Public` | Feature is offered to, interacts with, or affects public consumers/end users outside a purely internal enterprise context. | Do not match merely because website is public. |
| `Enterprise-Private` | Feature is used in business, internal, B2B, enterprise, workspace, customer-organization, admin, or private operational context. | Do not match solely from technical language; needs business/private operational context. |
| `PII` | Feature visibly collects, processes, stores, generates, analyzes, or transmits identifiable personal information or account/user/contact data. | Do not infer personal data merely because users exist. |
| `Employment` | Feature touches hiring, recruiting, workforce, employees, contractors, HR, performance, productivity monitoring, resumes, candidate screening, or workplace decisions. | Do not match generic productivity or business workflow unless workforce/employment context is visible. |
| `Sensitive/Biometric` | Feature touches biometric, voiceprint, face, health, special-category, sensitive, intimate, protected, or high-sensitivity data. | Do not match audio/image alone unless evidence supports voice/face/biometric/sensitive context or high-sensitivity category. |
| `Financial` | Feature touches payments, credit, banking, insurance, pricing, trading, lending, billing, spend, procurement, or monetary transactions. | Do not match generic pricing page unless feature touches financial operation/transaction. |
| `Content&IP` | Feature generates, ingests, transforms, analyzes, stores, or distributes creative/content/code/media/documents/IP-bearing material. | Do not match generic text display unless feature materially handles content/IP-bearing material. |
| `Safety&Physical` | Feature affects health, safety, physical harm, emergency, wellbeing, infrastructure safety, critical services, vehicles, robotics, or physical-world consequence. | Do not match generic reliability, trust, or safe UX claims. |
| `Infrastructure` | Feature operates, secures, monitors, controls, automates, or materially affects critical, backbone, production, network, cloud, database, or operational infrastructure. | Do not match API delivery, SDK availability, developer docs, ordinary SaaS backend, normal database storage, generic cloud hosting, or generic integration by itself. Those belong in architecture_hints[] unless the feature materially affects infrastructure operation/security/control. |
| `Minors` | Feature is used by, targeted at, accessible to, or materially affects children, minors, students, youth, or child-facing products. | Do not match unless child/minor/student/youth context is visible. |

Surface tightening controls:

```text
Infrastructure is not ordinary SaaS infrastructure. API/backend/cloud/database evidence alone is not enough.
Infrastructure requires visible operation, security, monitoring, control, automation, or material effect on critical/backbone/production infrastructure.
```

Forbidden surface tokens:

```text
No country, region, statute, regulator, law, compliance framework, or legal standard may be used as a surface token.
```

---

## BATCHING_AND_ROUTING_PROTOCOL

No random batching. Batch by product wrapper/root cluster.

```yaml
P3_BATCH_01_PRECHECK_AND_DETERMINISTIC_CONTEXT:
  execution_blocks: [P3.B1_INPUT_PRECHECK, P3.B2_DETERMINISTIC_TARGET_REF_COPY]
  field_rows: [FD3.001-FD3.004]

P3_BATCH_02_WRAPPER_RECONCILIATION:
  execution_blocks: [P3.B3_PRODUCT_WRAPPER_RECONCILIATION]
  field_rows: [FD3.005-FD3.008]

P3_BATCH_03_FEATURE_EXTRACTION:
  execution_blocks: [P3.B4_ATOMIC_FEATURE_EXTRACTION]
  field_rows: [FD3.009-FD3.029]

P3_BATCH_04_ARCHETYPE_AND_SURFACE_PROVENANCE:
  execution_blocks: [P3.B5_ARCHETYPE_MAPPING, P3.B6_SURFACE_MAPPING]
  field_rows: [FD3.030-FD3.049]

P3_BATCH_05_SIGNAL_AND_ARCHITECTURE_AGGREGATION:
  execution_blocks: [P3.B7_FEATURE_SIGNAL_MAP, P3.B8_ARCHITECTURE_HINTS]
  field_rows: [FD3.050-FD3.063]

P3_BATCH_06_QUALITY_AND_UNRESOLVED:
  execution_blocks: [P3.B9_CLASSIFICATION_QUALITY, P3.B10_UNRESOLVED_CANDIDATES]
  field_rows: [FD3.064-FD3.070]

P3_BATCH_07_COMMERCIAL_VAULT_EVIDENCE_LIMITATIONS:
  execution_blocks: [P3.B11_COMMERCIAL_SCAN, P3.B12_VAULT_CANDIDATES, P3.B13_EVIDENCE_LIMITATIONS, P3.B14_FINAL_EMISSION]
  field_rows: [FD3.071-FD3.090]
```

---

## LIVE_FORENSIC_LEDGER_PROTOCOL

The ledger is a visible audit artifact. It is not hidden reasoning.

```json
{
  "phase_id": "P3_TARGET_FEATURE_PROFILE",
  "ledger_status": "DRAFT | LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE",
  "ledger_events": [
    {
      "event_id": "P3E001",
      "event_type": "",
      "timestamp_or_sequence": "",
      "field_id": "",
      "field_path": "",
      "feature_id": "",
      "source_family": "",
      "source_url": "",
      "evidence_refs": [],
      "primary_or_secondary": "primary | secondary | promoted | degraded | n/a",
      "basis": "",
      "confidence": "high | medium | low | unknown | n/a",
      "notes": ""
    }
  ],
  "coverage_matrix": {
    "product_wrappers_received": [],
    "product_wrappers_reviewed": [],
    "primary_sources_reviewed": [],
    "secondary_sources_reviewed": [],
    "features_emitted": [],
    "feature_candidates_unresolved": [],
    "api_first_promotions": [],
    "degraded_root_fallbacks": [],
    "archetype_matches": [],
    "surface_matches": [],
    "commercial_noise_blocked": [],
    "limitations": []
  }
}
```

Allowed event types:

```yaml
allowed_event_types:
  - P3_INPUT_RECEIVED
  - P3_INPUT_MISSING
  - P3_DETERMINISTIC_COPY
  - P3_WRAPPER_REVIEWED
  - P3_SOURCE_REVIEWED
  - P3_SOURCE_SKIPPED
  - P3_FEATURE_CANDIDATE_FOUND
  - P3_FEATURE_EMITTED
  - P3_FEATURE_OMITTED
  - P3_API_FIRST_PROMOTION_GRANTED
  - P3_API_FIRST_PROMOTION_DENIED
  - P3_DEGRADED_ROOT_FALLBACK_USED
  - P3_ARCHETYPE_MATCHED
  - P3_ARCHETYPE_NOT_MATCHED
  - P3_SURFACE_MATCHED
  - P3_SURFACE_EXCLUDED
  - P3_SIGNAL_MAP_AGGREGATED
  - P3_ARCHITECTURE_HINT_EMITTED
  - P3_COMMERCIAL_OUTCOME_RECORDED
  - P3_COMMERCIAL_NOISE_BLOCKED
  - P3_UNRESOLVED_CANDIDATE_RECORDED
  - P3_FIELD_EVIDENCE_RECORDED
  - P3_LIMITATION_RECORDED
  - P3_GATE_PASSED
  - P3_GATE_FAILED
  - P3_REPAIR_REQUIRED
  - P3_CONTROLLED_FAILURE
  - P3_LOCKED
```

---

## DERIVATION_LOGIC_PROTOCOL

Every FD3 row follows this logic pattern:

```text
FIELD_SIGNAL_N
DERIVE_IF
VALUE_RULE
CONFIDENCE_RULE
EXCLUDE_IF
FALLBACK_IF
LEDGER_RULE
```

Confidence ladder unless a row says otherwise:

```yaml
high: direct admitted evidence supports exact feature behavior/context
medium: admitted evidence supports behavior/context but some mechanics are partial
low: visible evidence exists but mechanics/context are thin
unknown: no reliable support; do not emit candidate unless field expressly allows unknown fallback
```

---

## FIELD_DERIVATION_POWER_TABLE

### FD3.001 — Target Feature Profile Object Contract

```yaml
field_path: target_feature_profile
allowed_type: object
derive_if: Phase 3 is invoked
value_rule: Emit target_profile_ref, feature_inventory, feature_signal_map, architecture_hints, classification_quality, unresolved_feature_candidates, commercial_scan, vault_feature_candidates, evidence, limitations.
exclude_if: Do not emit noncanonical wrappers, version markers, registry ledgers, or legal review objects.
fallback_if: Missing object blocks lock.
ledger_rule: Record schema initialization.
```

### FD3.002–FD3.004 — Deterministic Target Profile Reference

```yaml
FD3.002:
  field_path: target_feature_profile.target_profile_ref.brand_name
  allowed_type: string | "N/A"
  derive_if: deterministic runtime copy from target_profile.identity.brand_name
  value_rule: Copy exactly. Model must not re-derive.
  fallback_if: "N/A"

FD3.003:
  field_path: target_feature_profile.target_profile_ref.legal_name
  allowed_type: string | "N/A"
  derive_if: deterministic runtime copy from target_profile.identity.legal_name
  value_rule: Copy exactly. Model must not inspect legal/governance evidence.
  fallback_if: "N/A"

FD3.004:
  field_path: target_feature_profile.target_profile_ref.domain
  allowed_type: string | "N/A"
  derive_if: deterministic runtime copy from target_profile.identity.domain
  value_rule: Copy exactly.
  fallback_if: "N/A"
```

### FD3.005–FD3.008 — Feature Inventory Item Setup

```yaml
FD3.005:
  field_path: target_feature_profile.feature_inventory[]
  allowed_type: array[object]
  field_meaning: Canonical atomic feature/function inventory.
  evidence_pool: primary evidence only unless API_FIRST_PROMOTION_EXCEPTION or DEGRADED_ROOT_FALLBACK applies.
  field_signals:
    - primary product evidence describes visible functional behavior
    - candidate can be separated from wrapper into atomic function
    - candidate can populate feature_name, system_action, output_or_result, evidence refs
  derive_if: primary origin + atomic behavior + required mechanics OR explicit exception/fallback
  value_rule: One object per atomic feature/function. Deduplicate duplicates.
  exclude_if: products, modules, pricing plans, slogans, use cases, badges, legal clauses, generic claims.
  fallback_if: Route visible but insufficient candidates to unresolved_feature_candidates[].
  ledger_rule: Record origin, inclusion/omission, dedupe, exception/fallback.

FD3.006:
  field_path: target_feature_profile.feature_inventory[].feature_id
  allowed_type: string pattern F###
  derive_if: feature item emitted
  value_rule: Assign F001, F002, F003 in wrapper/root-cluster/source order.
  fallback_if: No features = []

FD3.007:
  field_path: target_feature_profile.feature_inventory[].parent_product_wrapper_ref
  allowed_type: string | "N/A"
  derive_if: feature appears under known Phase 2 product wrapper or Phase 1 root cluster
  value_rule: Use clearest wrapper/product area/root cluster reference.
  exclude_if: Do not invent wrapper names.
  fallback_if: "N/A" with limitation.

FD3.008:
  field_path: target_feature_profile.feature_inventory[].root_cluster_id
  allowed_type: string | "N/A"
  derive_if: primary evidence source belongs to Phase 1 root cluster
  value_rule: Copy exact root cluster ID. Do not create new IDs.
  fallback_if: "N/A"
```

### FD3.009–FD3.017 — Core Feature Mechanics

```yaml
FD3.009:
  field_path: target_feature_profile.feature_inventory[].feature_name
  allowed_type: string
  derive_if: primary evidence or API-first promoted docs support a functional name
  value_rule: Use concise functional name, not marketing label.
  good_examples: ["Speech-to-text transcription", "Document extraction", "AI chat response generation", "Code completion", "Workflow automation"]
  bad_examples: ["Enterprise Plan", "Trusted AI", "Transform your business"]
  exclude_if: wrapper name unless wrapper is singular atomic function
  fallback_if: no supported name = unresolved candidate

FD3.010:
  field_path: target_feature_profile.feature_inventory[].feature_role
  allowed_type: string | "N/A"
  derive_if: evidence describes what feature is used for
  value_rule: Plain role phrase, e.g. "converts spoken audio into text".
  exclude_if: no legal/risk/compliance role
  fallback_if: "N/A" if mechanics otherwise sufficient

FD3.011:
  field_path: target_feature_profile.feature_inventory[].commercial_function
  allowed_type: string | "N/A"
  derive_if: feature has visible user/customer outcome or commercial outcome enrichment
  value_rule: State business job without hype.
  exclude_if: commercial evidence cannot originate the feature.
  fallback_if: "N/A"

FD3.012:
  field_path: target_feature_profile.feature_inventory[].business_label_or_product_area
  allowed_type: string | "N/A"
  derive_if: feature appears under public section/module/product area
  value_rule: Use exact label as context only. Do not treat it as feature.
  fallback_if: "N/A"

FD3.013:
  field_path: target_feature_profile.feature_inventory[].feature_description
  allowed_type: string
  derive_if: primary evidence describes feature behavior
  value_rule: 1-2 sentence mechanical description.
  exclude_if: legal analysis, registry language, full data provenance.
  fallback_if: unsupported description = no feature item

FD3.014:
  field_path: target_feature_profile.feature_inventory[].actor_or_user
  allowed_type: string | "unknown"
  derive_if: evidence identifies or directly implies actor/user/developer/admin/system
  value_rule: Use factual actor phrase.
  exclude_if: do not infer from market type alone.
  fallback_if: "unknown"

FD3.015:
  field_path: target_feature_profile.feature_inventory[].input_data
  allowed_type: array[string]
  derive_if: evidence names input/payload/content/file/audio/text/document/code/message/etc.
  value_rule: List visible input categories only.
  exclude_if: do not infer personal/sensitive data unless explicit.
  fallback_if: [] if mechanics otherwise sufficient

FD3.016:
  field_path: target_feature_profile.feature_inventory[].system_action
  allowed_type: string
  derive_if: evidence states action such as generate, analyze, classify, transcribe, extract, summarize, route, recommend, automate, translate, search, detect, create, update, delete, call API, execute workflow
  value_rule: Use active behavior phrase aligned to archetype detection tests.
  exclude_if: no action = no feature
  fallback_if: unresolved candidate
  lock_critical: true

FD3.017:
  field_path: target_feature_profile.feature_inventory[].output_or_result
  allowed_type: string
  derive_if: evidence states generated output/result/response/action result
  value_rule: State factual output/result.
  exclude_if: do not infer legal/commercial outcome as technical output.
  fallback_if: no output/result = no feature
  lock_critical: true
```

### FD3.018–FD3.024 — Behavior, Delivery, and Capability Signals

```yaml
FD3.018:
  field_path: target_feature_profile.feature_inventory[].autonomy_level
  allowed_values: [manual_assist, human_triggered_ai, semi_autonomous, autonomous, unknown]
  derive_if: always for emitted feature
  value_rule:
    manual_assist: supports human work but no visible autonomous system action
    human_triggered_ai: human prompt/upload/API call triggers AI output
    semi_autonomous: configured workflow executes after trigger with bounded user control
    autonomous: acts without real-time human approval for each action
    unknown: autonomy not visible
  exclude_if: AI usage alone does not mean autonomous
  fallback_if: unknown

FD3.019:
  field_path: target_feature_profile.feature_inventory[].human_review_signal
  allowed_type: string | "N/A"
  derive_if: evidence says review, approve, edit, validate, moderate, confirm, supervise
  value_rule: Short visible human-control signal.
  exclude_if: do not infer because best practice would require it.
  fallback_if: "N/A"

FD3.020:
  field_path: target_feature_profile.feature_inventory[].external_action_signal
  allowed_type: string | "N/A"
  derive_if: evidence says send/update/delete/post/transact/write/execute/trigger outside model response
  value_rule: Factual external action signal.
  exclude_if: generic integration logo or “connects with” language alone.
  fallback_if: "N/A"

FD3.021:
  field_path: target_feature_profile.feature_inventory[].delivery_channels[]
  allowed_values: [web_app, mobile_app, api, sdk, browser_extension, plugin, integration, embedded_widget, chat_interface, unknown]
  derive_if: evidence shows visible delivery/access channel
  value_rule: List all visible channels.
  exclude_if: do not infer API because product is technical; do not infer app because login exists.
  fallback_if: [unknown]

FD3.022:
  field_path: target_feature_profile.feature_inventory[].api_or_developer_surface_signal
  allowed_type: string | "N/A"
  derive_if: docs/API or product evidence identifies endpoint, SDK, key, request/response, webhook, developer workflow
  value_rule: Short developer/API signal.
  exclude_if: docs/API enriches by default; origination requires promotion exception.
  fallback_if: "N/A"

FD3.023:
  field_path: target_feature_profile.feature_inventory[].integration_signal
  allowed_type: string | "N/A"
  derive_if: evidence names integration, connector, plugin, webhook, import/export, third-party system
  value_rule: Short integration signal.
  exclude_if: do not treat infrastructure vendor/model provider/subprocessor/customer as integration unless product-level integration claimed.
  fallback_if: "N/A"

FD3.024:
  field_path: target_feature_profile.feature_inventory[].ai_or_model_capability_signal
  allowed_type: string | "N/A"
  derive_if: evidence states LLM, generative AI, speech model, OCR, classifier, recommender, embedding, agent, translation, summarization, transcription, etc.
  value_rule: State visible capability using registry-key behavior vocabulary where supported.
  exclude_if: do not infer hidden model architecture or provider unless evidence states it.
  fallback_if: "N/A"
```

### FD3.025–FD3.029 — Feature Evidence and Origin

```yaml
FD3.025:
  field_path: target_feature_profile.feature_inventory[].primary_evidence_refs[]
  allowed_type: array[string]
  derive_if: feature has primary refs or API-first promoted refs
  value_rule: Minimal sufficient primary refs supporting feature existence and core mechanics.
  exclude_if: secondary-only refs unless promoted.
  fallback_if: no primary refs = no feature except explicit exception/fallback

FD3.026:
  field_path: target_feature_profile.feature_inventory[].secondary_evidence_refs[]
  allowed_type: array[string]
  derive_if: secondary evidence materially enriched the feature
  value_rule: Only refs used for enrichment.
  fallback_if: []

FD3.027:
  field_path: target_feature_profile.feature_inventory[].evidence_quote
  allowed_type: string | "N/A"
  derive_if: admitted evidence contains concise quote supporting feature existence/mechanics
  value_rule: Exact quote proving system_action/output/result where possible.
  exclude_if: snippets, model summaries, third-party claims.
  fallback_if: "N/A" if refs/char ranges support

FD3.028:
  field_path: target_feature_profile.feature_inventory[].confidence
  allowed_values: [high, medium, low, unknown]
  derive_if: always for emitted feature
  value_rule:
    high: primary evidence supports feature name/action/output and secondary confirms mechanics
    medium: primary evidence supports sufficient mechanics, secondary absent/partial
    low: real feature visible but mechanics thin
    unknown: do not emit; route unresolved
  exclude_if: no high confidence from secondary-only evidence

FD3.029:
  field_path: target_feature_profile.feature_inventory[].evidence_origin_class
  allowed_values: [PRIMARY_ORIGINATED, API_FIRST_PROMOTED, DEGRADED_ROOT_ORIENTATION_ONLY]
  derive_if: always for emitted feature
  value_rule:
    PRIMARY_ORIGINATED: originated from product_platform/product_solution/product_descendant
    API_FIRST_PROMOTED: originated through API-first promotion exception
    DEGRADED_ROOT_ORIENTATION_ONLY: retained through degraded homepage fallback
  exclude_if: not a feature importance label
  fallback_if: missing class blocks lock
```

### FD3.030–FD3.039 — Archetype Provenance

```yaml
FD3.030:
  field_path: target_feature_profile.feature_inventory[].archetype_provenance
  required_shape:
    candidate_archetypes: []
    not_matched_archetypes: []
    archetype_classification_basis: ""
    archetype_provenance_confidence: high | medium | low | unknown
  derive_if: feature exists
  value_rule: Evaluate each behavior archetype independently. Emit all matches. Do not include universal registry rows.

FD3.031:
  field_path: target_feature_profile.feature_inventory[].archetype_provenance.candidate_archetypes[].archetype_code
  allowed_values: [DOE, JDG, CMP, CRT, RDR, ORC, TRN, SHD, OPT, MOV]
  derive_if: feature behavior satisfies locked detection test with evidence
  value_rule: Emit one object per matched archetype. Multiple allowed.
  exclude_if: label-only matches, universal rows, registry threat IDs

FD3.032:
  field_path: target_feature_profile.feature_inventory[].archetype_provenance.candidate_archetypes[].archetype_name
  value_rule: Deterministic code-to-name mapping from inline archetype table.

FD3.033:
  field_path: target_feature_profile.feature_inventory[].archetype_provenance.candidate_archetypes[].registry_key_detection_test
  value_rule: Copy exact detection test from inline archetype definition.
  exclude_if: no vague basis like "AI feature".

FD3.034:
  field_path: target_feature_profile.feature_inventory[].archetype_provenance.candidate_archetypes[].matched_feature_behavior
  derive_if: system_action/output/input/autonomy/external action maps to detection test
  value_rule: Direct behavior match, e.g. "Feature generates text responses from user prompts."
  exclude_if: speculation or legal harm inference

FD3.035:
  field_path: target_feature_profile.feature_inventory[].archetype_provenance.candidate_archetypes[].evidence_refs[]
  derive_if: evidence proves behavior satisfying detection test
  value_rule: Minimal admitted refs.
  fallback_if: no refs = no candidate archetype

FD3.036:
  field_path: target_feature_profile.feature_inventory[].archetype_provenance.candidate_archetypes[].evidence_quote
  allowed_type: string | "N/A"
  value_rule: Exact quote proving behavior where available.

FD3.037:
  field_path: target_feature_profile.feature_inventory[].archetype_provenance.candidate_archetypes[].confidence
  allowed_values: [high, medium, low]
  value_rule:
    high: direct primary evidence proves detection-test behavior or explicit API-first promoted mechanics
    medium: primary evidence proves behavior but confirmation partial
    low: visible but thin mechanics
  exclude_if: unknown candidates are not emitted

FD3.038:
  field_path: target_feature_profile.feature_inventory[].archetype_provenance.candidate_archetypes[].exclusion_notes[]
  derive_if: likely overread or adjacent archetype confusion exists
  value_rule: Explain what the match does not mean.
  fallback_if: []

FD3.039:
  field_path: target_feature_profile.feature_inventory[].archetype_provenance.not_matched_archetypes[]
  required_item_shape:
    archetype_code: "DOE"
    reason: "No evidence of autonomous external action without per-action human approval."
  derive_if: non-match is material to prevent over-triggering
  value_rule: List material non-matches only, not all archetypes mechanically.
```

### FD3.040–FD3.049 — Surface Provenance

```yaml
FD3.040:
  field_path: target_feature_profile.feature_inventory[].surface_provenance
  required_shape:
    candidate_surfaces: []
    excluded_surfaces: []
    surface_classification_basis: ""
    surface_provenance_confidence: high | medium | low | unknown
  derive_if: feature exists
  value_rule: Evaluate all visible data/audience/context surfaces independently.

FD3.041:
  field_path: target_feature_profile.feature_inventory[].surface_provenance.candidate_surfaces[].surface_token
  allowed_values: [Consumer-Public, Enterprise-Private, PII, Employment, Sensitive/Biometric, Financial, Content&IP, Safety&Physical, Infrastructure, Minors]
  derive_if: evidence shows data/audience/operational context matching token
  value_rule: Emit one object per supported surface. Multiple allowed.
  exclude_if: law, jurisdiction, compliance, or registry labels

FD3.042:
  field_path: target_feature_profile.feature_inventory[].surface_provenance.candidate_surfaces[].surface_meaning
  value_rule: Copy meaning from inline surface table.

FD3.043:
  field_path: target_feature_profile.feature_inventory[].surface_provenance.candidate_surfaces[].matched_context
  derive_if: feature input/output/actor/market/product context maps to token
  value_rule: Direct context match.
  exclude_if: no statutory classification or risk conclusion

FD3.044:
  field_path: target_feature_profile.feature_inventory[].surface_provenance.candidate_surfaces[].evidence_refs[]
  derive_if: refs support data/audience/operational context
  value_rule: Minimal admitted refs.
  fallback_if: no refs = no surface unless deterministic copied context has refs

FD3.045:
  field_path: target_feature_profile.feature_inventory[].surface_provenance.candidate_surfaces[].evidence_quote
  allowed_type: string | "N/A"
  value_rule: Exact quote where available.

FD3.046:
  field_path: target_feature_profile.feature_inventory[].surface_provenance.candidate_surfaces[].confidence
  allowed_values: [high, medium, low]
  value_rule:
    high: direct evidence supports context
    medium: feature mechanics + profile context support context
    low: visible but partial
  exclude_if: unknown surfaces are not emitted

FD3.047:
  field_path: target_feature_profile.feature_inventory[].surface_provenance.excluded_surfaces[]
  required_item_shape:
    surface_token: "Employment"
    reason: "No hiring, HR, workforce, candidate, or employment decision context visible."
  derive_if: material over-trigger prevention needed
  value_rule: Material exclusions only, not all tokens mechanically.

FD3.048:
  field_path: target_feature_profile.feature_inventory[].surface_provenance.surface_classification_basis
  derive_if: always for feature
  value_rule: Public-footprint explanation without legal conclusion.

FD3.049:
  field_path: target_feature_profile.feature_inventory[].surface_provenance.surface_provenance_confidence
  allowed_values: [high, medium, low, unknown]
  derive_if: always for feature
  value_rule:
    high: all emitted surfaces directly supported
    medium: mechanics + context support surfaces
    low: context partial
    unknown: no supported surface visible
```

### FD3.050–FD3.057 — Feature Signal Map

```yaml
FD3.050:
  field_path: target_feature_profile.feature_signal_map[]
  field_meaning: Aggregates feature-level surface tokens and linked archetypes. This is not legal/regulatory mapping.
  required_item_shape:
    surface_token: "Consumer-Public | Enterprise-Private | PII | Employment | Sensitive/Biometric | Financial | Content&IP | Safety&Physical | Infrastructure | Minors"
    supporting_feature_ids: []
    linked_archetype_codes: []
    matched_context_summary: ""
    evidence_refs: []
    confidence: high | medium | low | unknown
    downstream_use_limit: ""
  derive_if: at least one feature has candidate surface
  value_rule: One item per distinct surface token already emitted at feature level.
  exclude_if: do not create new surfaces, archetypes, legal labels, or registry conclusions.

FD3.051:
  field_path: target_feature_profile.feature_signal_map[].surface_token
  value_rule: Copy exact surface token already emitted in FD3.041.

FD3.052:
  field_path: target_feature_profile.feature_signal_map[].supporting_feature_ids[]
  value_rule: List all feature IDs where token was emitted.

FD3.053:
  field_path: target_feature_profile.feature_signal_map[].linked_archetype_codes[]
  value_rule: Deduplicate archetype codes already emitted on supporting features. Do not add new codes.

FD3.054:
  field_path: target_feature_profile.feature_signal_map[].matched_context_summary
  value_rule: Summarize why surface appears across features without law/risk conclusion.

FD3.055:
  field_path: target_feature_profile.feature_signal_map[].evidence_refs[]
  value_rule: Deduplicate refs already attached to supporting feature-level surface candidates.

FD3.056:
  field_path: target_feature_profile.feature_signal_map[].confidence
  value_rule:
    high: all supporting feature surface matches high
    medium: high/medium mix without low dependency
    low: one or more required support matches low
    unknown: do not emit

FD3.057:
  field_path: target_feature_profile.feature_signal_map[].downstream_use_limit
  value_rule: "This is a Phase 3 surface aggregation signal only. It does not determine legal applicability, compliance status, or registry row truth. Downstream phases must independently evaluate legal/governance evidence and registry conditions."
```

### FD3.058–FD3.063 — Architecture Hints

```yaml
FD3.058:
  field_path: target_feature_profile.architecture_hints[]
  required_item_shape:
    hint_id: AH001
    hint_type: api_delivery | sdk_developer | webhook_integration | external_action | autonomous_action | human_review | model_provider | rag_vector_embedding | fine_tuning_training | logging_audit | security_monitoring | rate_limit_or_guardrail | data_storage | unknown
    hint_value: ""
    supporting_feature_ids: []
    evidence_refs: []
    evidence_quote: ""
    confidence: high | medium | low | unknown
    downstream_use_limit: ""
  derive_if: evidence describes visible technical/operational architecture relevant to feature behavior
  exclude_if: no legal/compliance/registry conclusions; no inferred architecture from product type alone

FD3.059:
  field_path: target_feature_profile.architecture_hints[].hint_id
  value_rule: Assign AH001, AH002, AH003 in feature/source order.

FD3.060:
  field_path: target_feature_profile.architecture_hints[].hint_type
  value_rule:
    api_delivery: API endpoint/call/key/request/response
    sdk_developer: SDK/toolkit/client library/developer workflow
    webhook_integration: webhook/connector/plugin/integration trigger
    external_action: send/update/delete/post/transact/write/execute outside model response
    autonomous_action: action without per-action human approval
    human_review: review/approve/edit/validate/moderate/confirm
    model_provider: named model provider visibly powers feature
    rag_vector_embedding: RAG/retrieval/vector database/embeddings/semantic search
    fine_tuning_training: fine-tuning/training on customer/user data/model training
    logging_audit: audit/action/event log/trace/history
    security_monitoring: detects/blocks/filters security/abuse/fraud/system threat
    rate_limit_or_guardrail: rate limit/spend cap/permission scope/circuit breaker/kill switch/quota/guardrail
    data_storage: stores/retains/saves/archives/syncs/persists data
    unknown: real visible hint but category unclear
  exclude_if: no RAG/training/provider/storage/autonomy inference without explicit evidence

FD3.061:
  field_path: target_feature_profile.architecture_hints[].hint_value
  value_rule: Short factual signal only.

FD3.062:
  field_path: target_feature_profile.architecture_hints[].supporting_feature_ids[]
  value_rule: List feature IDs tied to hint; [] allowed only for global product-level hint.

FD3.063:
  field_path: target_feature_profile.architecture_hints[].evidence_refs / evidence_quote / confidence / downstream_use_limit
  value_rule:
    evidence_refs: minimal admitted refs
    evidence_quote: short exact quote or "N/A"
    confidence: high explicit; medium strong partial; low weak visible; unknown means omit
    downstream_use_limit: "This is a Phase 3 architecture hint only. It does not determine legal obligations, data provenance, compliance status, or registry row truth."
```

### FD3.064–FD3.070 — Classification Quality and Unresolved Candidates

```yaml
FD3.064:
  field_path: target_feature_profile.classification_quality
  required_shape:
    feature_extraction_completeness: complete | partial | minimal | failed
    primary_evidence_coverage: complete | partial | minimal | none
    feature_mechanics_quality: strong | adequate | weak | insufficient
    archetype_surface_quality: strong | adequate | weak | not_applicable
    unresolved_candidate_count: 0
    primary_wrapper_coverage: []
    quality_warnings: []
    overall_phase3_confidence: high | medium | low | unknown
  derive_if: always

FD3.065:
  field_path: target_feature_profile.classification_quality.feature_extraction_completeness
  value_rule:
    complete: every primary wrapper reviewed and every visible candidate emitted or unresolved
    partial: most reviewed, some gaps/limits
    minimal: small number of usable mechanics
    failed: no reliable feature/function emitted

FD3.066:
  field_path: target_feature_profile.classification_quality.primary_evidence_coverage
  value_rule:
    complete: all relevant primary product sources reviewed
    partial: multiple primary sources reviewed but gaps remain
    minimal: one weak/limited primary source reviewed
    none: no primary source available/usable

FD3.067:
  field_path: target_feature_profile.classification_quality.feature_mechanics_quality
  value_rule:
    strong: most features have explicit input/action/output + strong evidence
    adequate: core mechanics sufficient but context partial
    weak: behavior exists but mechanics thin
    insufficient: mechanics do not support reliable inventory

FD3.068:
  field_path: target_feature_profile.classification_quality.archetype_surface_quality
  value_rule:
    strong: mappings evidence-backed, detection-test aligned, with material exclusions
    adequate: usable but some medium/low confidence
    weak: thin or many unresolved/exclusions
    not_applicable: no valid feature inventory

FD3.069:
  field_path: target_feature_profile.unresolved_feature_candidates[]
  required_item_shape:
    candidate_id: UF001
    candidate_label: ""
    parent_product_wrapper_ref: ""
    source_family: product_platform | product_solution | product_descendant | docs_api_developer | commercial | root_homepage | unknown
    source_url: ""
    evidence_refs: []
    evidence_quote: ""
    unresolved_reason_code: NO_PRIMARY_ORIGIN | WRAPPER_NOT_FEATURE | MARKETING_LABEL_ONLY | MISSING_SYSTEM_ACTION | MISSING_OUTPUT_RESULT | SECONDARY_ONLY | API_PROMOTION_FAILED | DUPLICATE_OR_MERGED | SOURCE_AMBIGUOUS | ACCESS_LIMITED | OTHER
    missing_mechanics: []
    recommended_action: reinvestigate_once | keep_unresolved | merge_with_existing_feature | discard_as_non_feature
    confidence: medium | low | unknown
  derive_if: visible candidate fails one or more feature inventory gates
  exclude_if: do not add every page heading/noise

FD3.070:
  field_path: target_feature_profile.classification_quality.overall_phase3_confidence
  value_rule:
    high: primary coverage complete/partial + mechanics strong + archetype/surface strong/adequate + unresolved not material
    medium: usable but not complete; unresolved manageable
    low: thin, primary minimal/partial, weak mechanics, or material unresolved
    unknown: extraction failed, no primary coverage, or mechanics insufficient
```

### FD3.071–FD3.078 — Commercial Scan

```yaml
FD3.071:
  field_path: target_feature_profile.commercial_scan
  required_shape:
    commercial_outcomes_seen: []
    outcome_to_feature_links: []
    unmapped_outcomes_due_to_insufficient_detail: []
    pricing_or_plan_signals: []
    commercial_noise_controls: []
    commercial_scan_confidence: high | medium | low | unknown
    downstream_use_limit: ""
  derive_if: always
  field_boundary: commercial scan is product-context only, not sales analysis or feature creation.

FD3.072:
  field_path: target_feature_profile.commercial_scan.commercial_outcomes_seen[]
  required_item_shape:
    outcome_id: CO001
    outcome_label: ""
    source_family: product_platform | product_solution | product_descendant | commercial | root_homepage | unknown
    source_url: ""
    evidence_refs: []
    evidence_quote: ""
    confidence: high | medium | low | unknown
  derive_if: evidence states product outcome/user benefit/workflow result tied to product context
  exclude_if: pure slogans, awards, testimonials, vague adjectives

FD3.073:
  field_path: target_feature_profile.commercial_scan.outcome_to_feature_links[]
  required_item_shape:
    outcome_id: CO001
    linked_feature_ids: []
    basis: ""
    evidence_refs: []
    confidence: high | medium | low
  derive_if: commercial outcome links safely to existing feature IDs
  exclude_if: do not create new features here

FD3.074:
  field_path: target_feature_profile.commercial_scan.unmapped_outcomes_due_to_insufficient_detail[]
  required_item_shape:
    outcome_id: CO001
    outcome_label: ""
    unmapped_reason_code: NO_FEATURE_MECHANICS | MARKETING_ONLY | PRICING_LABEL_ONLY | FEATURE_LINK_AMBIGUOUS | SECONDARY_ONLY | OTHER
    source_url: ""
    evidence_refs: []
    evidence_quote: ""
    recommended_action: keep_as_commercial_context | reinvestigate_once | discard_as_noise
  derive_if: outcome visible but not mechanically mappable

FD3.075:
  field_path: target_feature_profile.commercial_scan.pricing_or_plan_signals[]
  required_item_shape:
    signal_id: PS001
    signal_type: pricing_tier | usage_limit | enterprise_plan | api_pricing | seat_pricing | free_trial | contact_sales | waitlist | unknown
    signal_value: ""
    source_url: ""
    evidence_refs: []
    evidence_quote: ""
    linked_feature_ids: []
    confidence: high | medium | low
  derive_if: evidence describes access/plan/usage/API/seat/trial/sales packaging
  exclude_if: plan names are not features

FD3.076:
  field_path: target_feature_profile.commercial_scan.commercial_noise_controls[]
  required_item_shape:
    blocked_label: ""
    source_url: ""
    evidence_refs: []
    blocked_reason: MARKETING_SLOGAN | PRICING_PLAN | TESTIMONIAL | GENERIC_CLAIM | NO_FUNCTIONAL_BEHAVIOR | DUPLICATE | OTHER
  derive_if: commercial language could be wrongly promoted as a feature

FD3.077:
  field_path: target_feature_profile.commercial_scan.commercial_scan_confidence
  value_rule:
    high: outcomes clear and feature-linked
    medium: outcomes visible but partly unmapped
    low: commercial evidence weak/noisy
    unknown: no useful commercial evidence

FD3.078:
  field_path: target_feature_profile.commercial_scan.downstream_use_limit
  value_rule: "This commercial scan is product-context evidence only. It does not create feature inventory entries, legal conclusions, compliance conclusions, risk findings, or registry row truth."
```

### FD3.079–FD3.084 — Vault Feature Candidates

```yaml
FD3.079:
  field_path: target_feature_profile.vault_feature_candidates
  required_shape:
    feature_prefill_candidates: []
    archetype_surface_prefill_candidates: []
    architecture_prefill_candidates: []
    confirmation_questions: []
    vault_candidate_confidence: high | medium | low | unknown
  derive_if: always
  field_boundary: candidates are intake helpers only, not evidence, features, triggers, or conclusions.

FD3.080:
  field_path: target_feature_profile.vault_feature_candidates.feature_prefill_candidates[]
  required_item_shape:
    candidate_id: VFC001
    feature_id: F001
    prefill_label: ""
    prefill_value: ""
    basis: ""
    evidence_refs: []
    status: PREFILL_READY | CONFIRM | UNKNOWN
    confidence: high | medium | low | unknown
  derive_if: feature has high/medium supported fields useful for intake or ambiguous fields requiring confirmation

FD3.081:
  field_path: target_feature_profile.vault_feature_candidates.archetype_surface_prefill_candidates[]
  required_item_shape:
    candidate_id: VAS001
    feature_id: F001
    candidate_type: archetype | surface
    candidate_value: ""
    basis: ""
    evidence_refs: []
    status: PREFILL_READY | CONFIRM | UNKNOWN
    confidence: high | medium | low | unknown
    downstream_use_limit: ""
  value_rule: Copy already-derived archetype/surface only. Do not create new matches.

FD3.082:
  field_path: target_feature_profile.vault_feature_candidates.architecture_prefill_candidates[]
  required_item_shape:
    candidate_id: VAC001
    hint_id: AH001
    prefill_label: ""
    prefill_value: ""
    basis: ""
    evidence_refs: []
    status: PREFILL_READY | CONFIRM | UNKNOWN
    confidence: high | medium | low | unknown
  value_rule: Copy architecture hint as candidate only.

FD3.083:
  field_path: target_feature_profile.vault_feature_candidates.confirmation_questions[]
  derive_if: unresolved candidate or low/unknown field matters downstream
  value_rule: practical product/technical confirmation questions only.
  good_examples:
    - "Confirm whether the API can write to external systems or only read data."
    - "Confirm whether generated output is reviewed by a human before publication."
  bad_examples:
    - "Confirm whether GDPR applies."
    - "Confirm whether this is high-risk AI."

FD3.084:
  field_path: target_feature_profile.vault_feature_candidates.vault_candidate_confidence
  value_rule:
    high: mostly PREFILL_READY and evidence-backed
    medium: mixed PREFILL_READY/CONFIRM
    low: mostly CONFIRM/UNKNOWN
    unknown: no useful candidates
```

### FD3.085–FD3.090 — Evidence and Limitations

```yaml
FD3.085:
  field_path: target_feature_profile.evidence
  required_shape:
    field_evidence_refs: []
    feature_evidence_matrix: []
    unresolved_questions: []
    evidence_boundary_statement: ""
  derive_if: always
  fallback_if: missing evidence object blocks lock

FD3.086:
  field_path: target_feature_profile.evidence.field_evidence_refs[]
  required_item_shape:
    field_path: ""
    evidence_refs: []
    basis: ""
    confidence: high | medium | low | unknown
  derive_if: substantive field populated or deterministically derived
  value_rule: exact JSON path, minimal admitted refs, deterministic basis where applicable

FD3.087:
  field_path: target_feature_profile.evidence.feature_evidence_matrix[]
  required_item_shape:
    feature_id: F001
    evidence_origin_class: ""
    primary_evidence_refs: []
    secondary_evidence_refs: []
    mechanics_supported:
      feature_name: true
      system_action: true
      output_or_result: true
      input_data: true
    archetype_codes_supported: []
    surface_tokens_supported: []
    confidence: high | medium | low
  derive_if: feature item exists
  value_rule: one matrix item per feature

FD3.088:
  field_path: target_feature_profile.evidence.unresolved_questions[]
  derive_if: unresolved feature candidate, low/unknown field, partial primary coverage, exception/fallback uncertainty
  value_rule: answerable product/technical evidence questions only
  exclude_if: no legal/compliance/registry questions

FD3.089:
  field_path: target_feature_profile.evidence.evidence_boundary_statement
  derive_if: always
  value_rule: "Phase 3 evidence supports public feature/function extraction, archetype provenance, surface provenance, architecture hints, and commercial context only. It does not determine legal obligations, data provenance, compliance status, risk level, or registry row truth."
  fallback_if: missing statement blocks lock

FD3.090:
  field_path: target_feature_profile.limitations[]
  derive_if: primary evidence unavailable/partial/weak/access-failed; mechanics insufficient; mapping weak; exception/fallback used; unmapped commercial outcomes exist
  value_rule: concise public-footprint limitation statements
  good_examples:
    - "Some product outcomes were visible only in commercial copy and could not be mapped to atomic feature mechanics."
    - "Developer documentation clarified API mechanics, but primary product pages did not fully describe the same feature."
  exclude_if: no accusations, legal/risk/compliance conclusions, or registry comments
  fallback_if: []
```

---

## EXECUTION_PROGRAM

### P3.B1_INPUT_PRECHECK
1. Confirm required inputs exist.
2. Confirm Phase 2 `target_profile` exists.
3. Confirm Phase 1 admitted evidence package and artifact refs are available.
4. Initialize ledger and trace.
5. If missing required inputs, emit controlled failure.

### P3.B2_DETERMINISTIC_TARGET_REF_COPY
1. Copy `brand_name`, `legal_name`, and `domain` from Phase 2.
2. Do not re-derive.
3. Log deterministic copy events.

### P3.B3_PRODUCT_WRAPPER_RECONCILIATION
1. Read Phase 2 product wrappers.
2. Reconcile product wrappers with Phase 1 root clusters.
3. Create work units by wrapper/root cluster.
4. Record primary and secondary sources per work unit.

### P3.B4_ATOMIC_FEATURE_EXTRACTION
1. Review primary product evidence first.
2. Extract only atomic feature/functions with visible mechanics.
3. Use secondary evidence only for enrichment unless exception/fallback applies.
4. Apply required mechanics gates.
5. Emit features or unresolved candidates.

### P3.B5_ARCHETYPE_MAPPING
1. For each feature, evaluate all behavior archetypes independently.
2. Use inline detection tests only.
3. Emit all supported archetypes.
4. Record material non-matches to prevent over-triggering.
5. Do not emit registry row logic.

### P3.B6_SURFACE_MAPPING
1. For each feature, evaluate all surface tokens independently.
2. Use inline surface definitions only.
3. Emit all supported surfaces.
4. Record material surface exclusions.
5. Do not emit jurisdiction or legal labels.

### P3.B7_FEATURE_SIGNAL_MAP
1. Aggregate feature-level surfaces and linked archetypes.
2. Do not create new tokens or codes.
3. Emit downstream use limits.

### P3.B8_ARCHITECTURE_HINTS
1. Extract visible technical/operational hints.
2. Do not infer architecture from product type.
3. Do not produce data provenance or legal conclusions.

### P3.B9_CLASSIFICATION_QUALITY
1. Assess coverage, mechanics quality, mapping quality, unresolved count, warnings, and overall confidence.
2. Downgrade where evidence is secondary-heavy, weak, partial, or exception-based.

### P3.B10_UNRESOLVED_CANDIDATES
1. Preserve visible but unpromoted candidates.
2. Record failed gate and missing mechanics.
3. Recommend reinvestigate/keep unresolved/merge/discard.

### P3.B11_COMMERCIAL_SCAN
1. Capture commercial outcomes and pricing/package context.
2. Link outcomes only to existing feature IDs where supported.
3. Block marketing/pricing labels from feature creation.

### P3.B12_VAULT_CANDIDATES
1. Create intake/prefill/confirmation candidates from already-derived Phase 3 data.
2. Do not create new substantive findings.

### P3.B13_EVIDENCE_LIMITATIONS
1. Build field-level evidence support.
2. Build feature evidence matrix.
3. Add unresolved questions and limitations.
4. Add mandatory evidence boundary statement.

### P3.B14_FINAL_EMISSION
1. Validate schema.
2. Validate gates.
3. Set trace lock status.
4. Emit valid JSON only.

---

## TRACE_LEDGER_AND_HANDOFF_SCHEMA

Emit exactly this top-level shape:

```json
{
  "feature_profile_forensic_ledger": {
    "phase_id": "P3_TARGET_FEATURE_PROFILE",
    "ledger_status": "DRAFT | LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE",
    "ledger_events": [],
    "coverage_matrix": {
      "product_wrappers_received": [],
      "product_wrappers_reviewed": [],
      "primary_sources_reviewed": [],
      "secondary_sources_reviewed": [],
      "features_emitted": [],
      "feature_candidates_unresolved": [],
      "api_first_promotions": [],
      "degraded_root_fallbacks": [],
      "archetype_matches": [],
      "surface_matches": [],
      "commercial_noise_blocked": [],
      "limitations": []
    }
  },
  "feature_function_trace": {
    "phase_id": "P3_TARGET_FEATURE_PROFILE",
    "input_status": "OK | MISSING_REQUIRED_INPUT | CONTROLLED_FAILURE",
    "execution_batches": [],
    "field_rows_applied": [],
    "deterministic_copy_fields": [],
    "primary_evidence_families_reviewed": [],
    "secondary_evidence_families_reviewed": [],
    "exception_or_fallback_events": [],
    "forbidden_scope_checks": {
      "non_atomic_feature_creation": "PASS | FAIL",
      "secondary_feature_origination_without_exception": "PASS | FAIL",
      "registry_evaluation": "PASS | FAIL",
      "full_data_provenance": "PASS | FAIL",
      "legal_or_compliance_conclusion": "PASS | FAIL",
      "legacy_output_aliases": "PASS | FAIL",
      "unsupported_archetype_or_surface": "PASS | FAIL"
    },
    "lock_status": "LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE"
  },
  "target_feature_profile": {
    "target_profile_ref": {
      "brand_name": "",
      "legal_name": "",
      "domain": ""
    },
    "feature_inventory": [],
    "feature_signal_map": [],
    "architecture_hints": [],
    "classification_quality": {},
    "unresolved_feature_candidates": [],
    "commercial_scan": {},
    "vault_feature_candidates": {},
    "evidence": {},
    "limitations": []
  }
}
```

---

## TERMINAL_GATE

Phase 3 may lock only if all gates pass.

```yaml
G3.001_OBJECT_SCHEMA_GATE:
  pass_if: output contains exactly feature_profile_forensic_ledger, feature_function_trace, target_feature_profile

G3.002_NO_LEGACY_ALIAS_GATE:
  pass_if: no historical compatibility output objects, version labels, or retired trigger labels are emitted

G3.003_PRIMARY_EVIDENCE_ORIGINATION_GATE:
  pass_if: every feature item has primary evidence, API-first promotion, or degraded root fallback ledger event

G3.004_ATOMIC_FEATURE_GATE:
  pass_if: no product wrapper, slogan, pricing tier, page heading, or marketing label is emitted as a feature

G3.005_SYSTEM_ACTION_OUTPUT_GATE:
  pass_if: every emitted feature has system_action and output_or_result

G3.006_MULTI_ARCHETYPE_GATE:
  pass_if: every candidate archetype independently satisfies detection test and evidence support; multiple matches are preserved

G3.007_MULTI_SURFACE_GATE:
  pass_if: every candidate surface independently satisfies data/audience/context evidence support; multiple matches are preserved

G3.008_UNIVERSAL_ROW_EXCLUSION_GATE:
  pass_if: universal registry rows are not feature-derived

G3.009_NO_REGISTRY_EVALUATION_GATE:
  pass_if: no threat IDs, row statuses, truth values, exposure scores, or registry conclusions appear

G3.010_NO_FULL_DATA_PROVENANCE_GATE:
  pass_if: no data-flow/legal-role/retention/subprocessor/transfer analysis appears

G3.011_NO_LEGAL_COMPLIANCE_CONCLUSION_GATE:
  pass_if: no legal advice, compliance status, risk finding, or applicability conclusion appears

G3.012_COMMERCIAL_NOISE_GATE:
  pass_if: commercial pages contextualize outcomes only and do not create features

G3.013_UNRESOLVED_CANDIDATE_GATE:
  pass_if: visible but insufficient candidates are preserved or explicitly discarded with reason

G3.014_EVIDENCE_TRACE_GATE:
  pass_if: every substantive field has evidence refs or deterministic derivation basis

G3.015_LEDGER_COMPLETENESS_GATE:
  pass_if: ledger records wrapper review, source review, inclusion/omission, secondary use, exception/fallback, archetype/surface matches, exclusions, commercial blocking, limitations
```

If any gate fails, do not output `LOCKED`.

---

## FINAL_OUTPUT_INSTRUCTION

When executing Phase 3, output valid JSON only. No markdown. No commentary. No explanatory text outside JSON.
