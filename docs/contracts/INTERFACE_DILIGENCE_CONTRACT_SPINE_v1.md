# THE INTERFACE — DILIGENCE ENGINE CONTRACT SPINE v1

**Status:** Canonical integration source of truth for the Diligence Engine.

**Authority:** This spine is the top-level Diligence integration contract under the Lex Nova HQ project instructions. It is supported by `VAULT_JS_CANONICAL_MAP_v1.md`, `NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md`, `DILIGENCE_RUNTIME_WIRING_PLAN_v1.md`, and the active Diligence v2 prompt index. Historical GPT/Groq runtime documents are reference material only unless this spine expressly adopts a rule from them.

**Purpose:** Every node — Source Collector, Gemini stages, deterministic backend assembler, validators, renderer, and persistence layer — is built to this document so the parts interlock and cannot drift.

---

## 0. DECISION LEDGER (locked)

| ID | Decision |
|---|---|
| DEC-001 | Provider-agnostic engine with **Gemini as primary** and Groq as optional fallback/reference. Orchestration is client-driven: the browser sequences stages, each Gemini call is a server-side Pages Function, and Firestore holds run state once persistence is implemented. |
| DEC-002 | Scrape transport = **client-side Jina** (`https://r.jina.ai/`) for public source collection. |
| DEC-003 | Canonical prompt source material came from GPT Diligence Runtime v1; the active prompt chain is now the seven-stage v2 chain under `docs/prompts/diligence-v2/`. |
| DEC-004 | Runtime doctrine is split into surgical prompts with injected evidence. Model stages do not browse, fetch, search, or use prior memory as evidence. |
| DEC-005 | Canonical contract = this spine + Vault canonical map + current schemas. Stale schemas/prompts/docs are regenerated to match. |
| DEC-006 | Source Collector is followed by an LLM-assisted **Evidence Refiner** before Target/Feature extraction. |
| DEC-007 | `vault_prefill_suggestions` are **backend-derived** from the literal Vault map. Model stages emit only `vault_confirmation_questions[]`. |
| DEC-008 | Report = structured `report_data`; React renders. Filters are view-only and must not delete payload data. |
| DEC-009 | No cap on findings, features, controlled rows, insufficient-evidence rows, or technical audit rows. Highlights are presentation only, not suppression. |
| DEC-010 | Node 5 / Stage 06 is compiler-only. Node 5B is deterministic backend-only. The model must not emit `assembly_handoff`, `handoff_envelope`, or `vault_prefill_suggestions`. |
| DEC-011 | Canonical `source_mode` values are exactly `url`, `text`, and `url_plus_text`. `manual_urls` is an input form under `target_input.manual_urls[]`, not a fourth source mode. |
| DEC-012 | Search/Gemini grounding may assist discovery only. Admitted evidence must come from Jina/admitted first-party material, hosted governance material meeting the admission rule, or user-provided public text. |

**Defect fixes folded in:** HER_001 is baked into the Stage 04 registry evaluation prompt as a fixed rule; `source_mode` is unified to `url | text | url_plus_text`; `hunter_engine_rules.runtime.json` is dropped; `registry_key.runtime.json` is the controlled-vocabulary source; Stage 06 validates against `compilerOutput.schema.json`, not `diligenceReport.schema.json`.

---

## 1. PIPELINE DAG + NODE OWNERSHIP

```text
[ User: URL(s) and/or pasted public text ]
   │
   ▼
0.   SOURCE COLLECTOR              owner: CLIENT (browser)        no model key — Jina r.jina.ai
        → raw_footprint + scrape_meta
   │
   ▼
0.5  EVIDENCE REFINER              owner: PAGES FN · Gemini       key server-only
        → source_bundle
   │
   ▼
1.   TARGET + FEATURE MAP          owner: PAGES FN · Gemini
        → target_feature_profile
   │
   ▼
2.   LEGAL STACK + REDLINE         owner: PAGES FN · Gemini
        → legal_stack_review
   │
   ▼
3.   REGISTRY LEDGER               owner: PAGES FN · Gemini, batched
        → registry_batch_meta + registry_evaluation_ledger[] + batch_warnings[]
   │
   ▼
MERGE VALIDATOR                    owner: BACKEND / ORCHESTRATOR
        → merged full registry_evaluation_ledger[]
   │
   ▼
4.   OPERATOR CHALLENGE            owner: PAGES FN · Gemini, merged ledger only
        → operator_challenge_gate{} + corrected_ledger_entries[]
   │
   ▼
CORRECTION MERGE VALIDATOR         owner: BACKEND / ORCHESTRATOR
        → post-challenge registry_evaluation_ledger[]
   │
   ▼
5.   FINAL COMPILER                owner: PAGES FN · Gemini
        → compiler_output
   │
   ▼
5B.  DETERMINISTIC BACKEND ASSEMBLER owner: BACKEND only, no model
        → vault_prefill_suggestions{} + assembly_handoff{} + handoff_envelope{} + Firestore writes
   │
   ├──► OUTPUT #1  React renderer ← compiler_output.report_data + findings arrays
   └──► OUTPUT #2  Assembly engine ← handoff_envelope + assembly_handoff
```

**Key boundary:** only Node 0 runs in the browser without a model key. Every Gemini call from Node 0.5 through Node 5 runs through a server-side Pages Function. Node 5B performs no Gemini/Groq/LLM call.

---

## 2. CANONICAL NAMING

| Concept | Canonical | Retired / legacy |
|---|---|---|
| Source material admitted for model use | `source_bundle` with `source_review`, `artifact_inventory[]`, `evidence_buffer[]`, `limitations[]` | `sources_read[]` |
| Company/product identity | `target_profile` + `primary_product` | `company_profile` + `product_profile` |
| Feature classification | `product_feature_map[]` | `classification` |
| Legal stack output | `legal_stack_review` | loose document summary |
| Registry row evaluation | `registry_evaluation_ledger[]` | `triggered_findings` as raw ledger |
| Triggered report findings | `findings[]` | capped/top-N findings |
| Controlled rows | `controlled_rows[]` | dropped non-findings |
| Insufficient rows | `insufficient_evidence_rows[]` | hidden uncertainty |
| Stage 06 compiler output | `compiler_output` | final handoff payload |
| Final post-Node-5B object | final diligence report / handoff object | Stage 06 output |
| Source mode enum | `url | text | url_plus_text` | `manual_urls` as source mode |
| Vault structure | `baseline / architecture / archetypes / compliance` | `product_identity / ai_architecture / data_output / commercial_controls / meta` |

---

## 3. PER-NODE I/O CONTRACTS

### Node 0 — Source Collector (client, Jina)

- **IN:** `{ run_id, source_mode, target_input:{ primary_url, manual_urls[], pasted_text_present, submitted_at } }`
- **OUT:** `{ raw_footprint, scrape_meta:{ pages_attempted, pages_read, urls[], zone_map } }`
- **Source mode:**
  - `url` when the user submits one URL or multiple manual URLs without pasted text.
  - `text` when the user supplies only pasted public text.
  - `url_plus_text` when URL inputs and pasted public text are both supplied.
- **Logic:** single URL may auto-spider through Jina; multiple manual URLs fetch exactly those URLs. Manual URLs remain in `target_input.manual_urls[]`; they do not become a separate `source_mode`.

### Node 0.5 — Evidence Refiner (Gemini)

- **IN:** `{ run_id, source_mode, raw_footprint, scrape_meta }`
- **OUT:** `source_bundle`
- **Schema:** `data/schemas/sourceBundle.schema.json`
- **Role:** turns raw footprint into classified evidence material and limitations.
- **Evidence firewall:** discovery/search/grounding candidates are not evidence. Only admitted first-party / hosted-governance-qualified / user-provided public material can enter `evidence_buffer[]`.

### Node 1 — Target + Feature Map (Gemini)

- **IN:** `source_bundle + registry_key controlled vocabularies`
- **OUT:** `target_feature_profile`
- **Schema:** `data/schemas/targetFeatureProfile.schema.json`
- **Role:** identifies target profile, primary product, features, archetypes, surfaces, and limitations from admitted evidence only.
- **Forbidden:** legal-stack review, registry evaluation, Vault prefill, final findings.

### Node 2 — Legal Stack + Redline (Gemini)

- **IN:** `source_bundle + target_feature_profile`
- **OUT:** `legal_stack_review`
- **Schema:** `data/schemas/legalStackReview.schema.json`
- **Role:** assesses visible public legal/governance surfaces against the feature profile.
- **Legal stack:** exactly ToS, Privacy Policy, DPA, AUP, SLA.
- **Boundary:** public-footprint diligence only; no legal advice and no conclusion that a private document does not exist.

### Node 3 — Registry Ledger (Gemini, batched)

- **IN per batch:** `source_bundle + target_feature_profile + legal_stack_review + registry_rows[] + registry_key`
- **OUT per batch:** `registry_batch_meta + registry_evaluation_ledger[] + batch_warnings[]`
- **Schema:** `data/schemas/registryLedger.schema.json`
- **Rule:** every supplied registry row in the batch must be evaluated exactly once.
- **No hardcoded registry total:** batch output count equals supplied batch length. Full-run count is determined by the loaded registry runtime.
- **HER_001:** EXCLUDE_IF defaults false and can become true only on explicit admitted first-party evidence of the exact neutralizing control.

### Merge Validator — Registry Ledger

- Concatenates Stage 3 batch ledgers into the full merged `registry_evaluation_ledger[]`.
- Validates:
  - full ledger count equals the loaded registry runtime count;
  - no missing `threat_id`;
  - no duplicate `threat_id`;
  - every loaded row evaluated once;
  - batch warnings preserved.

### Node 4 — Operator Challenge (Gemini)

- **IN:** merged full `registry_evaluation_ledger[] + source_bundle + target_feature_profile + legal_stack_review`
- **OUT:** `operator_challenge_gate + corrected_ledger_entries[]`
- **Schema:** `data/schemas/operatorChallenge.schema.json`
- **Result enum:** `PASS | PASS_WITH_WARNINGS | REOPENED | FAIL_RETRY_REQUIRED`
- **Rule:** requires explicit merged-ledger proof unless `test_run` is true.
- **Boundary:** does not re-evaluate the registry from scratch and does not invent missing Hunter logic.

### Correction Merge Validator

- If Stage 4 returns `REOPENED`, backend/orchestrator replaces matching ledger entries by `threat_id`.
- Revalidates count, uniqueness, and status totals.
- If correction cannot be safely merged, runtime must stop before Stage 5.

### Node 5 — Final Compiler (Gemini)

- **IN:** post-challenge `registry_evaluation_ledger[] + operator_challenge_gate + source_bundle + target_feature_profile + legal_stack_review + registry payload fields`
- **OUT:** compiler-only output:

```text
diligence_run
source_bundle_summary
target_profile
primary_product
product_feature_map
legal_stack
document_stack_redline
threat_registry_summary
feature_to_threat_matrix
findings
controlled_rows
insufficient_evidence_rows
assembly_route
report_data
technical_audit_log
threat_findings
vault_confirmation_questions
disclaimer
```

- **Schema:** `data/schemas/compilerOutput.schema.json`
- **Forbidden:** `vault_prefill_suggestions`, `assembly_handoff`, `handoff_envelope`, Firestore writes, HTML, legal advice.
- **No-cap invariant:**
  - `findings.length === count(TRIGGERED)`
  - `controlled_rows.length === count(CONTROLLED)`
  - `insufficient_evidence_rows.length === count(INSUFFICIENT_EVIDENCE)`
  - `technical_audit_log` accounts for every ledger row.

### Node 5B — Deterministic Backend Assembler

- **IN:** validated Stage 06 compiler output.
- **OUT:**

```text
vault_prefill_suggestions{}
assembly_handoff{}
handoff_envelope{}
Firestore writes
```

- **Governing contract:** `docs/contracts/NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md`
- **Vault authority:** `docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md`
- **Rule:** no Gemini, no Groq, no LLM, no invented Vault field names, no private architecture guesses.

---

## 4. OUTPUT OBJECT BOUNDARIES

### 4.1 Stage 06 compiler output

Stage 06 validates against `data/schemas/compilerOutput.schema.json`.

It contains report/compiler material only and deliberately excludes backend-owned handoff fields.

### 4.2 Final post-Node-5B object

The final persisted/reportable post-Node-5B object may include:

```text
compiler_output slices
vault_prefill_suggestions
assembly_handoff
handoff_envelope
persistence metadata
```

It validates against `data/schemas/diligenceReport.schema.json` or a successor final-report schema once implemented.

### 4.3 Mandatory disclaimer

Every report and payload must preserve this exact disclaimer:

> Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.

---

## 5. OUTPUT PROJECTIONS

### OUTPUT #1 — Diligence Report Renderer

Consumer: React renderer.

Reads:

```text
report_data
findings[]
controlled_rows[]
insufficient_evidence_rows[]
technical_audit_log[]
```

Part I — Executive Report:

1. Cover & Reliance.
2. Scope & Methodology.
3. Subject Profile.
4. Risk Posture Summary.
5. Material Highlights.
6. Triggered Findings Schedule.
7. Document Stack Verdict.
8. Recommended Route.

Part II — Full Forensic Record:

1. Source Review.
2. Artifact Inventory.
3. Product Feature Map.
4. Feature-to-Threat Matrix.
5. Document Stack Redline.
6. Full Triggered Findings.
7. Controlled Rows.
8. Insufficient Evidence Rows.
9. Assembly Route.
10. Technical Audit Log.

Filters are renderer-only and must not mutate or suppress arrays.

### OUTPUT #2 — Assembly Handoff

Consumer: Assembly engine.

Produced only by Node 5B:

| Piece | Fields | Persistence target |
|---|---|---|
| `handoff_envelope` | `handoff_id`, `run_id`, `source_engine:"diligence"`, `target_engine:"assembly"`, `payload_type:"assembly_handoff_payload"`, `status`, timestamps, `payload_ref`, `summary`, `warnings[]` | `interface_handoffs/{handoff_id}` |
| `assembly_handoff` | `handoff_meta`, `target_profile`, `feature_map`, `threat_findings`, `document_stack_status`, `vault_prefill_suggestions`, `vault_confirmation_questions`, `assembly_route_recommendation` | `interface_handoff_payloads/{handoff_id}` |

---

## 6. ASSEMBLY GLUE — ARCHETYPE / SURFACE / ARCHITECTURE → VAULT FLAG → DOCUMENT ROUTE

Node 5B derives `vault_prefill_suggestions` deterministically from detected archetypes, surfaces, legal-stack evidence, compiler output, and Vault map rules.

Each suggestion must carry:

```text
value
basis
confidence
source_finding_ids[]
```

If a value is not proven from admitted public evidence, Node 5B must not guess. It must preserve or create a confirmation dependency through `vault_confirmation_questions[]`.

### Archetype → Vault flag → route

| Archetype | Vault flag | Document route |
|---|---|---|
| DOE | `archetypes.is_doer` | TOS agent/action controls + DOC_AGT |
| ORC | `archetypes.is_orchestrator` | Agent orchestration controls |
| CRT | `archetypes.is_creator` | Output license / generated-content controls |
| RDR | `archetypes.is_reader` | Scraping / reading / ingestion controls |
| CMP | `archetypes.conversational_ui` | Chat companion / conversational UI controls |
| TRN | `archetypes.sens_bio` where biometric/audio translation is implicated | Biometric/audio pass-through controls |
| JDG | `archetypes.is_judge`, `archetypes.is_judge_hr`, `archetypes.is_judge_legal` | Decision-support / high-risk review controls |
| OPT | `archetypes.is_optimizer`, `archetypes.sens_fin` where financial optimization is implicated | Optimization / financial-risk controls |
| SHD | `archetypes.is_shield` | Security false-positive / false-negative / logs controls |
| MOV | `archetypes.is_mover` | Physical-world action/liability controls |
| UNI | `archetypes.is_generalist` | Baseline AI-output / hallucination / reliance controls |

### Surface → Vault compliance flag → route

| Surface | Vault field | Route |
|---|---|---|
| PII | `compliance.processes_pii` | DOC_DPA + DOC_PP |
| EU cue detected | `compliance.eu_users` | EU transfer/privacy route |
| CA cue detected | `compliance.ca_users` | California privacy route |
| Sensitive health | `compliance.sens_health` | sensitive data / health route |
| Sensitive financial | `compliance.sens_fin` | financial-risk route |
| Employment | `compliance.sens_employment` | employment decision-support route |
| Minors | `compliance.minors` | minors / child safety route |
| Distress | `compliance.distress` | distress / vulnerable-user route |

### Architecture → Vault architecture field → route

| Detected | Vault field | Route |
|---|---|---|
| RAG / stateless | `architecture.memory` | DPA and training/no-retention treatment |
| Fine-tuning | `architecture.memory` | opt-in/fine-tuning treatment |
| Self-hosted model | `architecture.models` | self-hosted model route |
| Third-party model | `architecture.models` + `architecture.sub_processors.*` | subprocessor disclosure route |
| Cloud hosting | `architecture.cloud_host` | hosting/subprocessor route |
| Vector database | `architecture.vector_db` | RAG/vector persistence route |
| Agentic limits | `archetypes.agent_limits.*` | agent caps / spend limits / retry limits route |

---

## 7. SCHEMA BOUNDARIES

| Schema | Owner / use |
|---|---|
| `sourceBundle.schema.json` | Stage 01 / Node 0.5 output. |
| `targetFeatureProfile.schema.json` | Stage 02 / Node 1 output. |
| `legalStackReview.schema.json` | Stage 03 / Node 2 output. |
| `registryLedger.schema.json` | Stage 04 / Node 3 batch output. |
| `operatorChallenge.schema.json` | Stage 05 / Node 4 output. |
| `compilerOutput.schema.json` | Stage 06 / Node 5 compiler-only output. |
| `diligenceReport.schema.json` | Final post-Node-5B report/handoff object or successor final report schema. |
| `assemblyOutput.schema.json` | Assembly handoff payload boundary. |
| `vault.schema.json` | Deterministic Vault payload boundary. |
| `handoffEnvelope.schema.json` | Handoff envelope boundary. |
| `diligenceRunState.schema.json` | Run-state persistence boundary. |
| `schemaManifest.schema.json` | Schema manifest boundary. |
| `deliveryState.schema.json` / `maintenanceRun.schema.json` | Downstream layers; leave for Delivery/Maintenance build. |

---

## 8. PER-STAGE VALIDATION GATES

- **Node 0.5 / Stage 01:** source bundle validates; evidence items include source URL/hash/excerpt/admission status; discovery-only candidates do not enter evidence buffer.
- **Node 1 / Stage 02:** target profile and primary product exist; product features are evidence-backed; archetype/surface vocabularies come from registry key.
- **Node 2 / Stage 03:** legal stack has exactly ToS, Privacy Policy, DPA, AUP, SLA; absent documents use public-footprint absence language.
- **Node 3 / Stage 04:** batch output count equals supplied batch length; every input `threat_id` returned once; valid final statuses and condition bases.
- **Merge validator:** full merged ledger count equals loaded registry runtime count; no missing or duplicate `threat_id`.
- **Node 4 / Stage 05:** merged-ledger proof exists unless test run; corrected rows match existing `threat_id`s; no invented Hunter logic.
- **Correction merge validator:** post-challenge ledger revalidates count, uniqueness, and status totals.
- **Node 5 / Stage 06:** compiler output validates against `compilerOutput.schema.json`; no `vault_prefill_suggestions`, `assembly_handoff`, or `handoff_envelope`.
- **Node 5B:** Vault prefill validates against `vault.schema.json`; handoff payload validates against `assemblyOutput.schema.json`; envelope validates against `handoffEnvelope.schema.json` and `createHandoffEnvelope` contract.

---

## 9. DEFECT FIXES REGISTER

| Defect | Fix |
|---|---|
| `hunter_engine_rules.runtime.json` referenced but absent; HER_001 nowhere in data | Bake HER_001 into Stage 04 prompt as a fixed rule; no dynamic file reference. |
| Source-mode drift | Canonical enum is `url | text | url_plus_text`; multiple manual URLs are `target_input.manual_urls[]`. |
| Model asked to emit HTML | Model emits structured `report_data`; React renders. |
| Model asked to build Vault prefill | Node 5B derives Vault prefill; model emits only confirmation questions. |
| Stage 06 schema collapsed with final report schema | Stage 06 validates against `compilerOutput.schema.json`; final post-Node-5B object uses `diligenceReport.schema.json` or successor. |
| Groq sandbox runtime treated as required active artifact | It is reference-only migration material; Gemini-primary v2 chain is active. |
| Vocabulary drift | `registry_key.runtime.json` controls archetypes, surfaces, subcats, lanes, pain tiers, pain depth, velocity, and statuses. |

---

## 10. PHASE CONTROLS

| Phase | Current meaning |
|---|---|
| Phase 0A | Initial contract spine and Vault canonical map. |
| Phase 1 | Core schema regeneration. |
| Phase 2 | Diligence v2 prompt rebuild. |
| Phase 2D | Prompt index, compiler schema, Node 5B contract, runtime wiring plan. |
| Phase 2E-0 | Repo hygiene audit and cleanup before implementation. |
| Phase 2E-1 | Schema loader and JSON validator utilities. |
| Later runtime phases | Source Collector, Pages Function stage runners, registry batching/merge, Operator Challenge, compiler, Node 5B assembler, renderer, persistence. |

Search and grounding are `DISCOVERY_ONLY`. They may discover candidate first-party material, but they are not evidence. Jina/admitted first-party material is the evidence base. Raw scrape full text is active-run only unless later persistence is explicitly enabled.

Every admitted evidence item stored into final report/compiler payloads must preserve available `source_hash`, `source_url`, `zone`, `artifact_class`, `extracted_excerpt`, limitations, status, and admission status.

Node 5B is deterministic backend/no-model. It derives Vault prefill and Assembly handoff compatibility under `VAULT_JS_CANONICAL_MAP_v1.md` and `NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md`.

Firestore persistence targets are defined, but implementation is deferred until the relevant runtime phase.

Legal Architecture disclaimer: Diligence output is a public-footprint artifact. It is not legal advice, does not establish compliance, and must be reviewed by qualified counsel before reliance.

*End of Contract Spine v1. Stage prompts, Source Collector, orchestrator/validators, renderer, and Node 5B are built to this document.*
