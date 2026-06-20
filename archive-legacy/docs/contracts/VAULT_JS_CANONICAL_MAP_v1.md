# VAULT.JS CANONICAL MAP v1

**Purpose:** This is the corrected, build-safe replacement for Contract Spine §11 (Assembly Glue) and §12 (Vault Payload Contract). It is derived **verbatim from the literal `docs/reference/vault.js` payload** (lines 881–978), not from assumption.

**Governing rule (DEC-007):** Node 5B (Backend Assembler) derives `vault_prefill_suggestions` deterministically into **this exact shape**. The model never invents Vault field names. Any field that public footprint cannot establish becomes a `vault_confirmation_question`, never a fabricated prefill.

**Three corrections this file makes to the spine as drafted:**
1. `integrations` is a **baseline** field, not architecture.
2. `human_review` / HITL is **not a Vault field** — it is an *effect* of selecting the Judge / high-risk archetypes (which inject AUP HITL clauses). Do not emit a `human_review` field.
3. There is **no `meta` group**. Vault has exactly four groups + two status fields.

---

## 1. THE LITERAL VAULT PAYLOAD (canonical target shape)

```
vault_payload = {
  baseline:     { ... },   // Module 1 — Baseline & Commercials
  architecture: { ... },   // Module 2 — Tech Stack & AI Memory
  archetypes:   { ... },   // Module 3 — Engine flag map
  compliance:   { ... },   // Module 4 — Compliance
  status:       "intake_received",
  submittedAt:  "<ISO timestamp>"
}
```

No fifth group. No `meta`.

### 1.1 `baseline` — Module 1

| Field | Type / values | Route annotation (verbatim) |
|---|---|---|
| `company` | string (default "Undisclosed Entity") | — |
| `entity_type` | string | — |
| `address` | string | — |
| `legal_email` | string | — |
| `privacy_email` | string | — |
| `products` | productList | populate(Service_Name_Description) → **TOS §1.14, Schedule A** |
| `jurisdiction.country` | string | populate(HQ_Location_and_Local_Law) → **TOS §7.5** |
| `jurisdiction.state` | string | populate(Jurisdiction) → **TOS §14** |
| `market` | `b2b \| b2c \| hybrid` | → **EXT.08/09** consumer protections |
| `delivery.app` | bool | direct GUI |
| `delivery.api` | bool | → **TOS §2.5, AGT §8.5** |
| `revenue_model` | string | — |
| `acv` | float | populate(Liability_Floor_Amount) → **TOS §9.1** |
| `has_beta` | bool | Free/Beta waiver → **TOS §2.6, Schedule B** |
| `output_ownership` | `full \| limited \| none` | populate(License_Scope) → **TOS §6.2** |
| `sla_type` | `no \| standard \| custom` | no→omit DOC_SLA; standard→inject SLA; custom→blank SLA |
| `integrations.slack` | bool | — |
| `integrations.crm` | bool | — |
| `integrations.stripe` | bool | — |
| `integrations.github` | bool | — |
| `integrations.webhooks` | bool | — |
| `integrations.none` | bool | → **Schedule A integrations, AGT §8.5** reinforcement |
| `reliance_threshold` | float (default 1000) | populate(Financial_Threshold) → **TOS §5.4** |

### 1.2 `architecture` — Module 2

| Field | Type / values | Route annotation (verbatim) |
|---|---|---|
| `memory` | `rag \| stateless \| finetuning` | rag/stateless → **DPA §4 RAG mandate**; finetuning → omit DPA §4, inject opt-in **TOS §6.1(c)** |
| `models` | `selfhosted \| thirdparty` | selfhosted → replace_with(selfhosted_def) **TOS §1.2**, omit **TOS §8.5/§8.7** |
| `sub_processors.openai` | bool | — |
| `sub_processors.anthropic` | bool | — |
| `sub_processors.google` | bool | — |
| `sub_processors.cohere` | bool | — |
| `sub_processors.mistral` | bool | — |
| `sub_processors.other` | string | — |
| `sub_processors.url` | string | populate(SubProcessor_Live_URL) → **DPA §5.2** |
| `cloud_host` | string | populate(SchedC_Cloud_Hosts) → **DPA Schedule C** |
| `vector_db` | string | populate(SchedC_Vector_DB) → **DPA Schedule C** |

### 1.3 `archetypes` — Module 3 (engine flag map)

| Field | Type | Route annotation (verbatim) |
|---|---|---|
| `is_doer` | bool | inject **TOS §2.7 + entire DOC_AGT** |
| `is_orchestrator` | bool | inject **AGT §3.5** |
| `agent_limits.session_cap` | string | populate(Session_Cap) → **AGT §4.1** |
| `agent_limits.period_cap` | string | populate(Period_Cap) → **AGT §4.2** |
| `agent_limits.retry_limit` | string | populate(Retry_Limit) → **AGT §6.2** |
| `agent_limits.loop_threshold` | string | populate(Loop_Threshold) → **AGT §6.3, Schedule C** |
| `is_creator` | bool | → **TOS §4.1, TOS §6.2** output license |
| `is_reader` | bool | → **TOS §4.1(e)** unauthorized-scraping waiver |
| `conversational_ui` | bool | → **TOS §3.4** |
| `sens_bio` | bool | → **AUP §3.6** biometric pass-through prohibition |
| `is_judge` | bool | → **TOS §5.6** |
| `is_judge_hr` | bool | → **AUP §3.4** mandatory bias-audit shift |
| `is_judge_legal` | bool | → **AUP §3.3** professional reliance disclaimer |
| `is_optimizer` | bool | → **AUP §3.2** |
| `sens_fin` | bool | → **AUP §3.2** financial surface |
| `is_shield` | bool | → **False-Negative liability cap, AGT §7.1** immutable logs |
| `is_mover` | bool | → **Strict product-liability waiver, TOS §2.4** |
| `is_generalist` | bool | → baseline hallucination waivers |

> Note: `is_companion` is referenced by the route logic (AUP §3.5) but in `vault.js` the companion selection sets `conversational_ui = true`. Treat `is_companion` as a derived sibling flag of `conversational_ui`, routed to **AUP §3.5**.

### 1.4 `compliance` — Module 4

| Field | Type / values | Route annotation (verbatim) |
|---|---|---|
| `processes_pii` | `yes \| no` | yes → **DOC_DPA + standard DOC_PP**; no → stripped PP |
| `eu_users` | bool | → **DPA §6.2/6.3/6.4, Schedule D (SCCs)** |
| `ca_users` | bool | → **DPA §13.x CCPA** Service Provider |
| `other_regions` | bool | — |
| `sens_health` | bool | → **AUP §3.1** |
| `sens_fin` | bool | → **AUP §3.2** |
| `sens_employment` | bool | → **AUP §3.4** |
| `minors` | bool | triggers **AUP §3.5** if `conversational_ui==true \|\| ca_users==true` |
| `distress` | bool | sets vulnerable_users=true → **TOS §5.5** |
| `standard_adults` | bool | — |

---

## 2. ONE-INPUT-SETS-MANY nuances (must be preserved by Node 5B)

`vault.js` fans certain single signals into multiple flags. The backend mapper must replicate this exactly:

| Detected signal | Sets these flags |
|---|---|
| **Judge / decision archetype (JDG)** | `is_judge` + `is_judge_hr` + `is_judge_legal` (all three) |
| **Optimizer archetype (OPT)** | `is_optimizer` + `sens_fin` |
| **Companion archetype (CMP)** | `conversational_ui` (+ derived `is_companion` → AUP §3.5) |

---

## 3. DETECTION → VAULT DERIVATION (the engine's job)

The Diligence Engine detects **archetype codes** and **surface tokens** from public footprint. Node 5B maps each detection to the literal flags above.

### 3.1 Archetype code → Vault flag(s) → route

| Diligence archetype | Vault flag(s) set | Route |
|---|---|---|
| UNI | `is_generalist` | baseline hallucination waivers |
| DOE | `is_doer` | TOS §2.7 + DOC_AGT |
| ORC | `is_orchestrator` | AGT §3.5 |
| CRT | `is_creator` | TOS §4.1, §6.2 |
| RDR | `is_reader` | TOS §4.1(e) |
| CMP | `conversational_ui` (+ `is_companion`) | TOS §3.4, AUP §3.5 |
| TRN | `sens_bio` | AUP §3.6 |
| JDG | `is_judge` + `is_judge_hr` + `is_judge_legal` | TOS §5.6, AUP §3.4, AUP §3.3 |
| OPT | `is_optimizer` + `sens_fin` (archetype) | AUP §3.2 |
| SHD | `is_shield` | AGT §7.1 + false-negative cap |
| MOV | `is_mover` | TOS §2.4 |

### 3.2 Surface token → Vault flag → route

| Surface | Vault group.field | Route |
|---|---|---|
| PII processing | `compliance.processes_pii = yes` | DOC_DPA + DOC_PP |
| EU users/targeting | `compliance.eu_users` | DPA §6.2–6.4, Schedule D (SCCs) |
| California users | `compliance.ca_users` | DPA §13.x CCPA |
| Health/medical | `compliance.sens_health` | AUP §3.1 |
| Financial | `compliance.sens_fin` | AUP §3.2 |
| Employment/HR | `compliance.sens_employment` | AUP §3.4 |
| Minors | `compliance.minors` | AUP §3.5 (if companion or ca_users) |
| Biometric | `archetypes.sens_bio` | AUP §3.6 |
| Vulnerable/distress | `compliance.distress` | TOS §5.5 |

### 3.3 Architecture signal → Vault field → route (low-confidence; often a confirmation question)

| Detectable signal | Vault field | Route |
|---|---|---|
| "Powered by GPT/Claude/Gemini" named | `architecture.sub_processors.{openai\|anthropic\|google}` | DPA §5.2 |
| Published sub-processor list URL | `architecture.sub_processors.url` | DPA §5.2 |
| RAG/retrieval described | `architecture.memory = "rag"` | DPA §4 |
| API product offered | `baseline.delivery.api` | TOS §2.5, AGT §8.5 |
| GUI/app product | `baseline.delivery.app` | direct GUI |
| B2B vs B2C positioning | `baseline.market` | EXT.08/09 |
| Beta/early-access labelling | `baseline.has_beta` | TOS §2.6, Schedule B |

---

## 4. PREFILL vs CONFIRMATION BOUNDARY (the honesty line)

Public footprint reveals **product behavior** (archetypes, surfaces) but rarely **internal architecture or commercial facts**. Node 5B prefills the first set with `{value, basis, confidence, source_finding_ids[]}`; the second set becomes `vault_confirmation_questions[]`. The model must not guess these.

| Field | Disposition |
|---|---|
| All `archetypes.is_*` flags | **PREFILL** (from detected archetypes) |
| `compliance.*` surface flags | **PREFILL** (from detected surfaces) |
| `baseline.company`, `products`, `jurisdiction.country`, `market`, `delivery.*`, `has_beta` | **PREFILL** (usually visible) |
| `architecture.sub_processors.*` (named providers / published list) | **PREFILL if explicitly published**, else CONFIRM |
| `architecture.memory` (rag/stateless/finetuning) | **CONFIRM** (internal) |
| `architecture.models` (selfhosted/thirdparty) | **CONFIRM** unless explicitly stated |
| `architecture.cloud_host`, `vector_db` | **CONFIRM** (internal) |
| `archetypes.agent_limits.*` (session/period/retry/loop caps) | **CONFIRM** (internal) |
| `baseline.entity_type`, `address`, `legal_email`, `privacy_email` | **CONFIRM** (legal intake) |
| `baseline.acv`, `revenue_model`, `output_ownership`, `sla_type`, `reliance_threshold` | **CONFIRM** (commercial) |
| `compliance.other_regions`, `distress`, `standard_adults` | **CONFIRM** (operational) |

**Rule of thumb:** the engine can fill the *shape* of the product (what it does, who it touches). The founder must confirm the *internals* (how it's built, what it costs, what it commits to).

---

## 5. NODE 5B DERIVATION CONTRACT

```
vault_prefill_suggestions = {
  baseline:     { <only PREFILL-eligible baseline fields>     : { value, basis, confidence, source_finding_ids[] } },
  architecture: { <only PREFILL-eligible architecture fields> : { value, basis, confidence, source_finding_ids[] } },
  archetypes:   { <derived is_* flags>                        : { value, basis, confidence, source_finding_ids[] } },
  compliance:   { <derived surface flags>                     : { value, basis, confidence, source_finding_ids[] } }
}

vault_confirmation_questions = [
  { field_path: "architecture.memory", question: "...", why_it_matters: "routes DPA §4 vs TOS §6.1(c)" },
  ...
]
```

Constraints enforced at the 5B validation gate:
1. Every key in `vault_prefill_suggestions` exists in the literal §1 schema. No invented keys.
2. Group placement matches §1 exactly (`integrations` under baseline, not architecture; no `human_review`; no `meta`).
3. The fan-out nuances in §2 are applied (judge→3 flags, optimizer→2, companion→2).
4. Every prefilled flag traces to ≥1 `source_finding_id` or detected feature.
5. Every CONFIRM-class field that is material to routing but unestablished appears in `vault_confirmation_questions[]`.

---

*End of Vault.js Canonical Map v1. This supersedes Contract Spine §11–§12. Build Node 5B and `vault.schema.json` to this file.*

## 6. PHASE 0A VALIDATION CONTROLS

integrations is a baseline field, not architecture. No meta group exists. `human_review` / HITL is not a Vault field.

Validation constraints, exact Phase 0A wording:
- no invented keys
- exact group placement
- integrations under baseline
- no human_review
- no meta
- fan-out applied
- every prefill traces to source
- material unknown fields become vault_confirmation_questions
