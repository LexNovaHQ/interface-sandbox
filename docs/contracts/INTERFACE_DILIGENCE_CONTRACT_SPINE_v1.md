# THE INTERFACE — DILIGENCE ENGINE CONTRACT SPINE v1

**Status:** Canonical integration source of truth.
**Authority:** Sits under the Groq Sandbox Runtime doctrine (`docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md`) and the GPT Diligence Runtime v1 (canonical prompt source). Where field names conflict across the repo, **this spine controls** and stale artifacts are regenerated to match it.
**Purpose:** Every node (scraper, Gemini stages, deterministic backend, renderer) is built *to this document* so the parts interlock and cannot drift.

---

## 0. DECISION LEDGER (locked)

| ID | Decision |
|---|---|
| DEC-001 | Provider-agnostic engine; **Gemini Flash default**, Groq fallback. Orchestration **client-driven**: browser sequences stages, each Gemini call is a server-side Pages Function (key is server-only), Firestore holds run state. |
| DEC-002 | Scrape transport = **client-side Jina** (`https://r.jina.ai/`), ported from the harvester zone spider (Zone 1–4, dedupe, 8-page cap). |
| DEC-003 | Canonical prompt source = **GPT Diligence Runtime v1**. v7.2 forensic prompt = reference only. |
| DEC-004 | **Faithful 5-stage rebuild** from GPT Runtime v1 — cut on module boundaries, text verbatim, two patches only (browsing→injected evidence; 4-blocks→one JSON). |
| DEC-005 | Canonical contract = **doctrine + `vault.js`**. Regenerate `data/schemas/*.json` to match. Spine first, then prompts. |
| DEC-006 | Source Collector = **LLM-assisted** → adds an **Evidence Refiner** (Gemini) between scrape and Stage 1. |
| DEC-007 | `vault_prefill_suggestions` **backend-derived** from the vault.js routing table. Model emits only `vault_confirmation_questions`. |
| DEC-008 | Report = **two layers** (Exec Memo + full filterable record); model emits `report_data`; React renders; filters are view-only. |
| DEC-009 | DD report = **7+7 structure** (§5 below); **no cap** on findings/features at any layer. |

**Defect fixes folded in:** HER_001 baked into the Stage 3 prompt (phantom artifact — not a loadable file); `source_mode` enum unified to `url \| text \| url_plus_text`; the `hunter_engine_rules.runtime.json` reference dropped; `registry_key.runtime.json` confirmed as the controlled-vocabulary source; stale `data/schemas/*.json` regenerated.

---

## 1. PIPELINE DAG + NODE OWNERSHIP

```
[ User: URL(s) or pasted public text ]
   │
   ▼
0.   SOURCE COLLECTOR            owner: CLIENT (browser)        no key — Jina r.jina.ai
        → raw_footprint (zoned) + scrape_meta
   │
   ▼
0.5  EVIDENCE REFINER            owner: PAGES FN · Gemini       key server-only
        → source_review, evidence_buffer[], artifact_inventory[], limitations[]
   │
   ▼
1.   TARGET + FEATURE MAP        owner: PAGES FN · Gemini
        → target_profile, product_feature_map[], feature_map_scratchpad[]
   │
   ▼
2.   LEGAL STACK + REDLINE       owner: PAGES FN · Gemini
        → legal_stack[5], document_stack_redline[], document_stack_synthesis, legal_stack_assessment[]
   │
   ▼
3.   REGISTRY LEDGER             owner: PAGES FN · Gemini (×~4 batches, ~30 rows each)
        → registry_evaluation_ledger[98]   (merged from registry_batch_evaluation[])
   │
   ▼
4.   OPERATOR CHALLENGE          owner: PAGES FN · Gemini       (runs on full merged ledger)
        → operator_challenge_gate{}, corrected_ledger_entries[]   → backend re-merges + revalidates
   │
   ▼
5.   COMPILER                    owner: PAGES FN · Gemini
        → findings[], controlled_rows[], insufficient_evidence_rows[], threat_registry_summary,
          feature_to_threat_matrix, document_stack_redline, assembly_route, report_data{},
          technical_audit_log{}, threat_findings, vault_confirmation_questions[]
   │
   ▼
5b.  BACKEND ASSEMBLER           owner: DETERMINISTIC BACKEND   (no model)
        → vault_prefill_suggestions{}   (derived via the §6 table)
        → assembly_handoff{} → wrapped in handoff_envelope{}
        → Firestore writes (§7 collections)
   │
   ├──► OUTPUT #1  React renderer ← report_data + findings + controlled_rows + insufficient_evidence_rows + technical_audit_log
   └──► OUTPUT #2  Assembly engine ← handoff_envelope (label) + assembly_handoff (payload)
```

**Key boundary:** only Node 0 (Jina scrape) runs in the browser without a key. **Every Gemini call (0.5, 1–5) runs in a Pages Function** because the API key is server-only and must never carry a `VITE_` prefix. The client orchestrates the sequence and holds run state; Firestore persists each stage output.

---

## 2. CANONICAL NAMING (doctrine wins) — RENAME MAP

| Concept | CANONICAL (this spine) | Retired (stale `data/schemas`) |
|---|---|---|
| Company/product identity | `target_profile` | `company_profile` + `product_profile` |
| Feature classification | `product_feature_map[]` | `classification` |
| Triggered threats | `findings[]` | `triggered_findings` |
| Collected sources | `evidence_buffer[]` + `source_review` | `source_bundle` / `sources_read[]` |
| Source mode enum | `url \| text \| url_plus_text` | `url \| text` |
| Vault structure | `baseline / architecture / archetypes / compliance` | `product_identity / ai_architecture / data_output / commercial_controls` |

---

## 3. PER-NODE I/O CONTRACTS

### Node 0 — Source Collector (client, Jina)
- **IN:** `{ run_id, source_mode, target_url(s) | pasted_text, submitted_at }`
- **OUT:** `{ raw_footprint, scrape_meta:{ pages_attempted, pages_read, urls[], zone_map } }`
- **Logic (ported from harvester):** single URL → auto-spider (fetch root via `r.jina.ai`, parse markdown links, classify Zone 1 Mechanical / 2 Commercial / 3 Governance / 4 Context, exclude press/blog, dedupe, cap 8). Multiple URLs → manual override (fetch exactly those). Zone map seeds `evidence_scope` / `artifact_class` downstream.

### Node 0.5 — Evidence Refiner (Gemini)
- **IN:** `{ run_id, source_mode, raw_footprint, scrape_meta }`
- **OUT:** `{ source_review, evidence_buffer[], artifact_inventory[], limitations[] }`
- `evidence_buffer[]` item: `{ source_id, source_url, source_type, ingestion_method, artifact_type, evidence_text, evidence_scope, first_party_basis }`
- `artifact_inventory[]` item: `{ artifact_type, artifact_class, status, source_url, ingestion_method, evidence_summary, absence_basis, warning }`
- **Role:** turns raw zoned footprint into clean, classified first-party evidence. Enforces the firewall (first-party only, no third-party sources). Sets `limitations` warnings (sparse_footprint, no_governance_artifacts, etc.).

### Node 1 — Target + Feature Map (Gemini)  ◄ GPT Runtime Modules VII + VIII
- **IN:** `{ run_id, source_review, evidence_buffer[], artifact_inventory[], registry_key.archetypes, registry_key.surfaces }`
- **OUT:** `{ target_profile, product_feature_map[], feature_map_scratchpad[], limitations[] }`
- `target_profile`: `{ company_name, website, legal_entity, hq_jurisdiction, actual_processing_location, data_sovereignty_signature, primary_claim, primary_product:{ product_name, user, function, mechanism, agent_actor, agent_brand_name } }`
- `product_feature_map[]` item: `{ feature_id, feature_name, feature_role(CORE|SECONDARY), feature_description, archetype_codes[], archetype_labels[], surface_tokens[], evidence_quote, feature_source_url, linked_threat_ids[]=[] }`

### Node 2 — Legal Stack + Redline (Gemini)  ◄ GPT Runtime Module IX
- **IN:** `{ run_id, source_review, evidence_buffer[], artifact_inventory[], target_profile, product_feature_map[] }`
- **OUT:** `{ legal_stack[5], document_stack_redline[], document_stack_synthesis, legal_stack_assessment[], limitations[] }`
- `legal_stack[]` (exactly 5: ToS, Privacy Policy, DPA, AUP, SLA): `{ document_type, exists, document_url, covers, misses, evidence_status, linked_threat_ids[] }`
- `document_stack_redline[]`: `{ mismatch_id, type(QUOTE_VS_QUOTE|CLAIM_VS_ABSENCE|STACK_VS_REALITY), quote, source, feature_ref, claim_type, contradicts }`
- `misses` uses the **False Belief Formula**; absent docs → `exists:false, document_url:"N/A", covers:null`.

### Node 3 — Registry Ledger (Gemini, batched)  ◄ GPT Runtime Modules V + X
- **IN (per batch):** `{ run_id, registry_batch[], registry_count_loaded:98, registry_key, source_review, evidence_buffer[], artifact_inventory[], target_profile, product_feature_map[], legal_stack[], document_stack_redline[] }` — **HER_001 is baked into the prompt text, not loaded.**
- **OUT (per batch):** `{ registry_batch_evaluation[], batch_warnings[] }`
- Ledger entry: `{ entry_number, threat_id, threat_name, archetype_gate, surface_gate, authority_relevance, conditions[], trigger_if_result, exclude_if_result, final_status(5-state), feature_refs[], evidence_ref, reasoning_summary }`
- **Merge:** backend concatenates batches → `registry_evaluation_ledger[98]`. Validates: count = 98, no missing/dup threat_id, each evaluated once.

### Node 4 — Operator Challenge (Gemini)  ◄ GPT Runtime Module V.G + X.E (merged)
- **IN:** `{ run_id, registry_count_loaded:98, registry_evaluation_ledger[], source_review, artifact_inventory[], target_profile, product_feature_map[], legal_stack[], document_stack_redline[] }`
- **OUT:** `{ operator_challenge_gate{ completed, result(PASS|REOPENED), registry_count_loaded, registry_count_evaluated, reopened_rows[], high_risk_checks{}, notes[] }, corrected_ledger_entries[] }`
- If `REOPENED`: backend replaces matching ledger entries by threat_id and re-runs all count validations.

### Node 5 — Compiler (Gemini)  ◄ GPT Runtime Module XI (+ X.F staging)
- **IN:** `{ run_id, registry_rows[], registry_evaluation_ledger[] (post-correction), operator_challenge_gate{}, source_review, target_profile, product_feature_map[], legal_stack[], document_stack_redline[], document_stack_synthesis }`
- **OUT:** `{ findings[], controlled_rows[], insufficient_evidence_rows[], threat_registry_summary{}, feature_to_threat_matrix{}, document_stack_redline[], assembly_route{}, report_data{}, technical_audit_log{}, threat_findings[], vault_confirmation_questions[] }`
- **DEC-007:** the model does **NOT** produce `vault_prefill_suggestions`. It produces `vault_confirmation_questions` (gaps public footprint can't resolve). Prefill is built in Node 5b.
- `findings[]` item (hydrated, 19 fields): `{ finding_id, threat_id, threat_name, status:"TRIGGERED", pain_tier, pain_category, pain_depth, lane, archetype, surface_tokens[], subcat, authority{IN,EU,US}, linked_feature_ids[], evidence{ source_url, artifact_type, proof_citation, evidence_mode }, trigger_evaluation{ conditions_passed[], conditions_failed[], trigger_if_result, exclude_if_result, exclude_if_basis }, registry_payload{ legal_pain, fp_mechanism, fp_impact, lex_nova_fix }, redline_route[], document_routes[], vault_dependencies[] }`
- `report_data{}` keys (feed §5 report): `{ cover, exec_memo, source_review, feature_map, threat_summary, feature_to_threat_matrix, document_redline, registry_findings, assembly_route, technical_audit }`

### Node 5b — Backend Assembler (deterministic, no model)
- **IN:** `{ findings[], product_feature_map[], target_profile, legal_stack[], detected surface_tokens, vault_confirmation_questions[] }`
- **Derives** `vault_prefill_suggestions{ baseline, architecture, archetypes, compliance }` via the §6 table (exact `vault.js` shape).
- **Builds** `assembly_handoff{ handoff_meta, target_profile, feature_map, threat_findings, document_stack_status, vault_prefill_suggestions, vault_confirmation_questions, assembly_route_recommendation }`.
- **Wraps** in `handoff_envelope` via `createHandoffEnvelope({ runId, sourceEngine:"diligence", targetEngine:"assembly", payloadType:"assembly_handoff_payload", payloadRef, summary, warnings })`.
- **Writes:** `interface_handoffs/{handoff_id}` (envelope), `interface_handoff_payloads/{handoff_id}` (payload), `interface_runs/{run_id}/stage_outputs/{stage_n}`.

---

## 4. CANONICAL FINAL OBJECT

The single source-of-truth object is the doctrine §10.5 schema (`diligence_run, source_review, target_profile, product_feature_map, legal_stack, threat_registry_summary, feature_to_threat_matrix, document_stack_redline, findings, controlled_rows, insufficient_evidence_rows, assembly_route, technical_audit_log, assembly_handoff, handoff_envelope, report_data, disclaimer`). All node outputs above are slices of this object; the backend assembles them into it and persists it at `interface_runs/{run_id}`.

**Mandatory disclaimer (verbatim, on every report + payload):**
> Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.

---

## 5. OUTPUT PROJECTIONS

Both outputs are **views** of the §4 object. Stage 5 emits once; two consumers read two slices.

### OUTPUT #1 — DD REPORT (React, on-screen)  ← `report_data` + `findings` + `controlled_rows` + `insufficient_evidence_rows` + `technical_audit_log`

**PART I — EXECUTIVE REPORT** (narrative; highlights, never suppresses)
1. Cover & Reliance — target, domain, date, scope line, disclaimer ← static + `diligence_run`
2. Scope & Methodology — artifacts reviewed, method, limitations ← `source_review`, `limitations`
3. Subject Profile — company/entity/jurisdiction/sovereignty/primary product ← `target_profile`
4. Risk Posture Summary — counts by tier+category, severity distribution, verdict ← `threat_registry_summary`
5. Material Findings — sharpest triggered findings as Issue→Basis→Impact→Fix ← `findings[]` (highlighted subset, **not a cap**)
6. Document Stack Verdict — exists vs missing + "illusion of coverage" paragraph ← `legal_stack`, `document_stack_synthesis`
7. Recommended Route — high-level remediation path ← `assembly_route`

**PART II — FULL FORENSIC RECORD** (exhaustive; filters are view-only)
1. Source Review — every artifact (type/class/status/url/zone) ← `artifact_inventory`, `source_review`
2. Product Feature Map — every CORE+SECONDARY feature, full fields ← `product_feature_map`
3. Feature-to-Threat Matrix — which feature triggered which threat ← `feature_to_threat_matrix`
4. Document Stack Redline — all 5 docs (covers/misses) + every mismatch ← `legal_stack`, `document_stack_redline`
5. Full Registry Findings — **every** triggered finding (card anatomy below) + controlled + insufficient bands ← `findings[]`, `controlled_rows[]`, `insufficient_evidence_rows[]`
6. Assembly Route — full document/clause routing per finding ← `assembly_route`
7. Technical Audit Log — all 98 ledger rows, operator-challenge result, warnings ← `technical_audit_log`

**Finding card anatomy** (repeating unit, Part II §5):
```
THREAT NAME                          [T# · Pain Category] [Archetype] [Lane]
Issue       → registry_payload.fp_mechanism
Basis       → evidence.proof_citation | documented absence (evidence_mode)
              trigger_evaluation: conditions_passed/failed · trigger_if · exclude_if_basis
Authority   → authority.{IN|EU|US} (relevant pillars only)
Impact      → registry_payload.fp_impact + legal_pain · pain_depth
Linked to   → linked_feature_ids
Remediation → registry_payload.lex_nova_fix · document_routes · vault_dependencies
```

**Filters (Part II only):** pain tier · pain category · archetype · surface · status · lane/document-route · sort by severity/source/archetype · text search · collapse controlled/low-severity.

**NO-CAP INVARIANT (DEC-009) — enforced at three layers:**
1. **Prompt** — Stages 3/5 forbid top-N, sampling, "most important." `findings[]` = every TRIGGERED row; feature map capped only by evidence.
2. **Backend validation** — `findings.length === count(TRIGGERED)`; short arrays fail.
3. **Renderer** — full arrays always in memory; a filter hides DOM, never drops data; "clear filters" returns the complete record.

### OUTPUT #2 — ASSEMBLY HANDOFF (machine)  ← `handoff_envelope` (label) + `assembly_handoff` (payload)

| Piece | Fields | Firestore |
|---|---|---|
| `handoff_envelope` | `handoff_id, run_id, source_engine:"diligence", target_engine:"assembly", payload_type:"assembly_handoff_payload", status, created_at, updated_at, payload_ref, summary, warnings[]` | `interface_handoffs/{id}` |
| `assembly_handoff` | `handoff_meta, target_profile, feature_map, threat_findings, document_stack_status, vault_prefill_suggestions{baseline,architecture,archetypes,compliance}, vault_confirmation_questions[], assembly_route_recommendation` | `interface_handoff_payloads/{id}` |

---

## 6. ASSEMBLY GLUE — ARCHETYPE / SURFACE / ARCHITECTURE → VAULT FLAG → DOCUMENT ROUTE

Backend (Node 5b) derives `vault_prefill_suggestions` deterministically from detected archetypes/surfaces using this table (sourced from `vault.js` annotations). Each suggestion carries `{ value, basis, confidence, source_finding_ids[] }`.

**Archetype → `vault.archetypes` flag → route**

| Archetype | Vault flag | Document route |
|---|---|---|
| DOE | `is_doer` | TOS §2.7 + entire DOC_AGT |
| ORC | `is_orchestrator` | AGT §3.5 |
| CRT | `is_creator` | TOS §4.1, §6.2 (output license) |
| RDR | `is_reader` | TOS §4.1(e) (unauthorized-scraping waiver) |
| CMP | `conversational_ui` (+ companion) | TOS §3.4, AUP §3.5 |
| TRN | `sens_bio` | AUP §3.6 (biometric pass-through) |
| JDG | `is_judge` (+ `is_judge_hr`, `is_judge_legal`) | TOS §5.6, AUP §3.4, §3.3 |
| OPT | `is_optimizer` (+ `sens_fin`) | AUP §3.2 |
| SHD | `is_shield` | AGT §7.1 (immutable logs), false-negative cap |
| MOV | `is_mover` | TOS §2.4 (strict product-liability waiver) |
| UNI | `is_generalist` | baseline hallucination waivers |

**Surface → `vault.compliance` flag → route**

| Surface | Vault flag | Route |
|---|---|---|
| PII | `processes_pii` | DOC_DPA + DOC_PP |
| EU cue detected | `eu_users` | DPA §6.2–6.4, Schedule D (SCCs) |
| CA cue detected | `ca_users` | DPA §13.x (CCPA Service Provider) |
| Sensitive/Biometric | `sens_bio` / `sens_health` | AUP §3.6 / §3.1 |
| Employment | `sens_employment` | AUP §3.4 |
| Financial | `sens_fin` | AUP §3.2 |
| Minors | `minors` | AUP §3.5 (if companion or CA users) |
| Enterprise-Private | `enterprise` / `sla_type` | DOC_SLA |

**Architecture (from evidence) → `vault.architecture` → route**

| Detected | Vault field | Route |
|---|---|---|
| RAG / stateless | `memory:"rag"\|"stateless"` | DPA §4 RAG-only mandate |
| Fine-tuning | `memory:"finetuning"` | omit DPA §4, inject opt-in TOS §6.1(c) |
| Self-hosted model | `models:"selfhosted"` | TOS §1.2; omit §8.5/§8.7 |
| Third-party model | `models:"thirdparty"` | sub-processor disclosure DPA §5.2 |
| Agentic spend limits | `agent_limits{…}` | AGT §4.1/4.2/6.2/6.3 |

> Public footprint can only *suggest*. Anything not provable from evidence becomes a `vault_confirmation_question` for the founder (model provider, internal human-review, spend caps, output-ownership posture, etc.).

---

## 7. SCHEMAS TO REGENERATE

| File | Action |
|---|---|
| `data/schemas/sourceBundle.schema.json` | **Replace** → `evidenceBundle.schema.json`: `source_review` + `evidence_buffer[]` + `artifact_inventory[]`; `source_mode` enum += `url_plus_text`. |
| `data/schemas/diligenceReport.schema.json` | **Rewrite** to the §4 canonical object (target_profile, product_feature_map, legal_stack, findings, controlled_rows, insufficient_evidence_rows, threat_registry_summary, feature_to_threat_matrix, document_stack_redline, assembly_route, report_data, technical_audit_log). |
| `data/schemas/vault.schema.json` | **Rewrite** to match `vault.js`: `baseline / architecture / archetypes / compliance` with exact fields. |
| `data/schemas/assemblyHandoff.schema.json` | **New** — the `assembly_handoff` payload (the §5 #2 fields). |
| `handoff_envelope` | Already enforced by `src/wrapper/contracts/handoffEnvelope.js::validateHandoffEnvelope`. No new file. |
| `assemblyOutput / deliveryState / maintenanceRun` | Downstream layers — leave as-is for now; revisit at the Assembly/Delivery build. |
| `src/lib/schemas.js` | Paths unchanged; content of the targets changes. |

---

## 8. PER-STAGE VALIDATION GATES (backend-enforced)

- **0.5 Refiner:** evidence_buffer non-empty OR limitations explain why; every item has source_url + first_party_basis; no third-party hosts except qualifying-governance.
- **Stage 1:** target_profile has all keys; primary_product has all 6; every feature has evidence_quote + feature_source_url; archetype_codes/surface_tokens valid; linked_threat_ids empty.
- **Stage 2:** legal_stack length === 5, one of each type; if exists=false then document_url="N/A" and covers=null; feature_ref values valid.
- **Stage 3 (per batch):** returned count === batch length; every input threat_id returned once; no extra/dup; valid final_status; conditions array present with basis.
- **Stage 3 (merge):** ledger length === 98; no missing/dup threat_id.
- **Stage 4:** if REOPENED, corrected entries match existing threat_ids; counts revalidate to 98.
- **Stage 5:** `findings.length === count(TRIGGERED)`; `controlled_rows.length === count(CONTROLLED)`; `insufficient_evidence_rows.length === count(INSUFFICIENT_EVIDENCE)`; every finding.threat_id ∈ registry; **no legacy keys** (`sales_viability, signal_context, ghost_protection_profile, true_gaps, prospect_meta`); no truncated arrays.
- **5b Assembler:** envelope passes `validateHandoffEnvelope`; vault_prefill matches `vault.schema.json`; every prefill flag traces to ≥1 finding/feature.

---

## 9. DEFECT FIXES REGISTER

| Defect | Fix |
|---|---|
| `hunter_engine_rules.runtime.json` referenced but absent; HER_001 nowhere in data | **Bake HER_001 verbatim into the Stage 3 prompt** (fixed rule, not dynamic data). Drop the file reference from Stage 3 input. |
| `source_mode` enum mismatch (`url\|text` in schema vs `url\|text\|url_plus_text` in doctrine) | Unify to `url \| text \| url_plus_text` everywhere. |
| `data/schemas/*.json` field names conflict with doctrine output | Regenerate per §7. |
| `vault.schema.json` ≠ `vault.js` | Rewrite schema to match the live Vault. |
| Model asked to emit HTML + 4 fenced blocks | Model emits `report_data` (structured); React renders; orchestrator sequences. |
| Model asked to build vault prefill | Backend derives it (§6); model emits only confirmation questions. |
| Vocabulary source | `registry_key.runtime.json` (`archetypes/surfaces/subcats/lanes/pain_tiers/pain_depth/velocity/statuses`). |

---

## 10. PHASE 0A GOVERNING CONTROLS

| ID | Decision |
|---|---|
| DEC-013 | Phase 0A locks the Gemini-primary/provider-agnostic architecture. Groq remains fallback/historical only where relevant. Search/grounding is `DISCOVERY_ONLY` and is never admitted evidence. Node 5B is deterministic backend/no-model and must build against `docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md`. |

`source_mode` enum:
- `url`
- `manual_urls`
- `text`
- `url_plus_text`

Search and grounding are `DISCOVERY_ONLY`. They may discover candidate first-party material, but they are not evidence. Jina/admitted first-party material is the evidence base. Raw scrape full text is active-run only unless later persistence is explicitly enabled.

Every admitted evidence item stored into the final report payload carries `source_hash`, `source_url`, `zone`, `artifact_class`, `extracted_excerpt`, `limitations`, `status`, and `admission_status`.

Node 5B is deterministic backend/no-model. It derives Vault prefill and Assembly handoff compatibility under `docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md`, which is the governing sub-spine for Node 5B, `vault.schema.json`, Vault prefill validation, and Assembly handoff compatibility.

Firestore persistence targets are defined, but implementation is deferred until the relevant runtime phase.

Legal Architecture disclaimer: This output is a public-footprint diligence artifact. It is not legal advice, does not establish compliance, and must be reviewed by qualified counsel before reliance.

Build order:
- Phase 0A — Commit Contract Documents
- Phase 1 — Schema Regeneration
- Phase 2 — Prompt Rebuild
- Phase 3 — Source Collector
- Phase 4 — Evidence Refiner
- Phase 5 — Stage Functions
- Phase 6 — DD Renderer
- Phase 7 — Assembly Handoff

*End of Contract Spine v1. Stage prompts (DEC-004), Source Collector, orchestrator/validators, and renderer are all built to this document.*
