# THE INTERFACE — DILIGENCE RUNTIME GROQ v1.0

**Runtime surface:** Sandbox / backend execution  
**Model role:** bounded reasoning engine over admitted evidence and loaded registry rows  
**Base rule:** the engine returns **ALL TRIGGERED THREATS**. No base-level shortlisting, ranking, suppression, "top risks", sales prioritisation, or UI-driven filtering is allowed inside the runtime. UI/report renderer may sort/filter later, but base payload remains complete.

---

## 0. PURPOSE

This runtime converts the GPT Diligence Runtime into a Groq-compatible sandbox execution contract.

The GPT runtime is a prompt-native runtime. It assumes a model with native browsing, knowledge files, and chat-style terminal emission. The sandbox cannot use it directly without corrupting the architecture.

This Groq runtime preserves the doctrine but changes execution:

```text
GPT Runtime:
model browses + thinks + emits audit/json/html

Groq Sandbox Runtime:
backend collects sources
backend loads registry artifacts
Groq performs bounded staged reasoning
backend validates every stage
React/report renderer displays the result
```

---

## 1. PUBLIC IDENTITY AND ROLE BOUNDARY

### 1.1 Public identity

```text
The Interface
Law × Technology · AI Governance · Privacy · Systems
```

### 1.2 Internal logic layer

```text
Diligence Engine
Hunter Logic Gate
```

### 1.3 Role boundary

The Groq model must not act as:

```text
Sales Scanner
Admin
Architect
Copywriter
Spear Engine
Legal advisor
Compliance certifier
Document assembly engine
CRM engine
Regulatory Horizon Scanner
```

The Groq model may only:

```text
extract
classify
evaluate
compile structured diligence payloads
```

### 1.4 Legal/advice firewall

Allowed language:

```text
not visible in reviewed public footprint
not publicly verifiable
no public artifact found
review-ready route
requires qualified legal review
```

Forbidden language:

```text
illegal
non-compliant
liable
confirmed violation
unenforceable
does not exist
```

Mandatory global disclaimer:

```text
Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.
```

---

## 2. SANDBOX EXECUTION PRINCIPLES

### 2.1 No native browsing inside Groq

Groq receives already-collected evidence. It does not browse, scrape, search, fetch, click, retry, or inspect URLs independently.

The GPT runtime's phrase:

```text
native web/search tool
```

is translated in sandbox to:

```text
Sandbox Source Collector
```

The Source Collector is backend-owned.

### 2.2 Runtime artifacts are backend-loaded

The GPT runtime's "Knowledge Files" become backend runtime artifacts:

```text
data/runtime/registry.runtime.json
data/runtime/registry_key.runtime.json
data/runtime/hunter_engine_rules.runtime.json
docs/reference/vault.js
```

The backend loads, validates, and passes required slices to Groq stage calls.

### 2.3 Execution order vs display order

Internal execution order:

```text
1. Source Collector
2. Target/profile/feature extraction
3. Legal stack assessment
4. Registry ledger evaluation
5. Operator challenge
6. Compiler / assembly handoff
7. Report data response
```

Display order:

```text
1. HTML due diligence report
2. Full threat findings
3. Expandable source review
4. Expandable technical audit log
5. Assembly handoff payload
```

### 2.4 No base-level findings filter

The runtime must not decide what is "important enough" to include.

Base payload rule:

```text
findings[] = every registry row with final_status = TRIGGERED
```

The runtime must not limit findings by:

```text
Pain_Tier
Pain_Category
top N
commercial viability
sales value
severity threshold
document route
UI convenience
token saving
```

Controlled and insufficient rows are not hidden. They remain in the full registry ledger and may be separately summarized, but the "threat findings" array contains **all triggered threats**.

### 2.5 Backend validation is mandatory

The model must not be trusted on completion claims. Backend must validate:

```text
registry_count_loaded === registry_evaluation_ledger.length
no missing Threat_ID
no duplicate Threat_ID
every active Threat_ID evaluated exactly once
every ledger entry has valid 5-state final_status
every finding.threat_id maps to a TRIGGERED ledger row
findings.length === count(TRIGGERED ledger rows)
legal_stack.length === 5
all feature refs are valid or GLOBAL/MULTI/UNKNOWN
no forbidden legacy fields emitted
```

---

## 3. INPUTS AND GLOBAL DATA CONTRACTS

### 3.1 Diligence run input

```json
{
  "run_id": "run_...",
  "source_mode": "url | text | url_plus_text",
  "target_url": "https://example.ai",
  "submitted_at": "ISO-8601"
}
```

### 3.2 Source Collector output

The Source Collector produces this before any Groq call:

```json
{
  "source_review": {
    "source_mode": "url | text | url_plus_text",
    "target_url": "",
    "pages_attempted": 0,
    "pages_read": 0,
    "queries_executed": 0,
    "evidence_buffer_size_tokens": 0
  },
  "evidence_buffer": [
    {
      "source_id": "src_001",
      "source_url": "",
      "source_type": "TARGET_DOMAIN | QUALIFYING_HOSTED_GOVERNANCE | PASTED_PUBLIC_MATERIAL",
      "ingestion_method": "WEB | SEARCH_SNIPPET | DIRECT_FETCH | PASTED_TEXT | PUBLIC_PDF_MANUAL_EXTRACTION",
      "artifact_type": "Homepage | Product Page | Pricing Page | ToS | Privacy Policy | DPA | AUP | SLA | Trust Center | Security Page | Subprocessor Page | Legal Center | AI Policy | Documentation | Developer Docs | API Docs | Signup Flow | Footer | Cookie Banner | Other",
      "evidence_text": "",
      "evidence_scope": "PRODUCT | LEGAL | GOVERNANCE | SECURITY | TRUST | COMPANY | SIGNUP | FOOTPRINT_WIDE",
      "first_party_basis": ""
    }
  ],
  "artifact_inventory": [
    {
      "artifact_type": "ToS | Privacy Policy | DPA | AUP | SLA | Trust Center | Security Page | Subprocessor Page | Legal Center | AI Policy | Documentation | Developer Docs | API Docs | Product Page | Pricing Page | Homepage | Signup Flow | Footer | Cookie Banner | Other",
      "artifact_class": "CORE_LEGAL | GOVERNANCE_SURFACE | PRODUCT_SURFACE | COMPANY_SURFACE | SIGNUP_SURFACE | FOOTPRINT_WIDE",
      "status": "INGESTED | ABSENT | ACCESS_FAILED | INSUFFICIENT_TEXT",
      "source_url": "",
      "ingestion_method": "WEB | SEARCH_SNIPPET | DIRECT_FETCH | PASTED_TEXT | PUBLIC_PDF_MANUAL_EXTRACTION | NONE",
      "evidence_summary": "",
      "absence_basis": "",
      "warning": ""
    }
  ],
  "limitations": []
}
```

### 3.3 Registry runtime input

The backend loads:

```json
{
  "registry_rows": [],
  "registry_key": {},
  "hunter_engine_rules": {}
}
```

Required registry row fields:

```text
Threat_ID
Threat_Name
Lane
Archetype
Surface
Authority_IN
Authority_EU
Authority_US
Velocity
Pain_Tier
Pain_Depth
Status
Effective_Date
Legal_Pain
FP_Mechanism
FP_Impact
Lex_Nova_Fix
Hunter_Trigger
Provenance
```

### 3.4 Final response object

The backend eventually returns:

```json
{
  "diligence_run": {},
  "source_review": {},
  "target_profile": {},
  "product_feature_map": [],
  "legal_stack": [],
  "threat_registry_summary": {},
  "feature_to_threat_matrix": {},
  "document_stack_redline": [],
  "findings": [],
  "controlled_rows": [],
  "insufficient_evidence_rows": [],
  "technical_audit_log": {},
  "assembly_handoff": {},
  "handoff_envelope": {},
  "report_data": {},
  "disclaimer": "Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use."
}
```

---

## 4. GROQ CALL ARCHITECTURE

### 4.1 Recommended model config

```json
{
  "primary_model": "openai/gpt-oss-120b",
  "fallback_model": "llama-3.3-70b-versatile",
  "temperature": 0,
  "top_p": 1,
  "stream": false
}
```

### 4.2 Groq call stages

```text
Stage 1: Target Profile + Feature Map
Stage 2: Legal Stack + Document Redline
Stage 3: Registry Ledger Evaluation
Stage 4: Operator Challenge
Stage 5: Compiler + Assembly Handoff
```

Source Collector and Report Renderer are not Groq responsibilities.

---

## 5. UNIVERSAL GROQ SYSTEM PROMPT

Use this system prompt for every Groq stage.

```text
You are The Interface Diligence Engine.

You are not a web browser. You do not search, fetch, click, crawl, or use external knowledge.

You operate only on the JSON input provided to this stage:
- admitted Evidence Buffer
- Artifact Inventory
- loaded registry rows when supplied
- registry key/rules when supplied
- retained outputs from prior stages

You must not rely on prior model memory, third-party summaries, press coverage, investor databases, or assumptions.

You are a deterministic public-footprint diligence and Boolean Logic Gate.
You do not provide legal advice.
You do not issue compliance conclusions, enforceability conclusions, liability conclusions, or legal opinions.

Allowed phrasing:
- not visible in reviewed public footprint
- not publicly verifiable
- no public artifact found
- review-ready route
- requires qualified legal review

Forbidden phrasing:
- illegal
- non-compliant
- liable
- confirmed violation
- unenforceable
- does not exist

Return valid JSON only.
Do not wrap output in markdown.
Do not include prose outside JSON.
Do not omit required fields.
Do not truncate arrays.
Do not use ellipses.
```

---

## 6. STAGE 1 — TARGET PROFILE + FEATURE MAP

### 6.1 Purpose

Extract:

```text
target_profile{}
product_feature_map[]
feature_map_scratchpad[]
limitations[]
```

### 6.2 Input

```json
{
  "run_id": "",
  "source_review": {},
  "evidence_buffer": [],
  "artifact_inventory": [],
  "registry_key": {
    "archetypes": [],
    "surfaces": []
  }
}
```

### 6.3 Prompt

```text
Stage: TARGET_PROFILE_AND_FEATURE_MAP.

Use only the admitted evidence_buffer and artifact_inventory.

Extract target_profile exactly:
- company_name
- website
- legal_entity
- hq_jurisdiction
- actual_processing_location
- data_sovereignty_signature
- primary_claim
- primary_product

primary_product must contain:
- product_name
- user
- function
- mechanism
- agent_actor
- agent_brand_name

Missing string values must be "N/A".

Then decompose the product into feature-level product_feature_map[].

Feature map rules:
- Generate only features supported by first-party admitted evidence.
- Every feature must have evidence_quote and feature_source_url.
- No evidence means no feature.
- Use v3.0 archetype codes only:
  UNI, DOE, JDG, CMP, CRT, RDR, ORC, TRN, SHD, OPT, MOV.
- Apply archetype guards strictly.
- Surface tokens must come only from the allowed v3.0 surface vocabulary.
- Do not add archetypes or surfaces from industry assumptions.
- Do not use third-party knowledge.
- Multiple CORE features are allowed.
- No cap is imposed except evidence support.
- linked_threat_ids must be [] at this stage.

Return JSON only.
```

### 6.4 Output schema

```json
{
  "target_profile": {
    "company_name": "",
    "website": "",
    "legal_entity": "",
    "hq_jurisdiction": "",
    "actual_processing_location": "",
    "data_sovereignty_signature": "",
    "primary_claim": "",
    "primary_product": {
      "product_name": "",
      "user": "",
      "function": "",
      "mechanism": "",
      "agent_actor": "",
      "agent_brand_name": ""
    }
  },
  "product_feature_map": [
    {
      "feature_id": "feat_001",
      "feature_name": "",
      "feature_role": "CORE | SECONDARY",
      "feature_description": "",
      "archetype_codes": [],
      "archetype_labels": [],
      "surface_tokens": [],
      "evidence_quote": "",
      "feature_source_url": "",
      "linked_threat_ids": []
    }
  ],
  "feature_map_scratchpad": [
    {
      "feature_id": "",
      "role": "",
      "name": "",
      "archetypes": [],
      "surfaces": [],
      "evidence": "",
      "source": "",
      "reasoning": ""
    }
  ],
  "limitations": []
}
```

### 6.5 Backend validation

```text
target_profile has all required keys
primary_product has all 6 keys
every feature has evidence_quote
every feature has feature_source_url
all archetype_codes valid
all surface_tokens valid
linked_threat_ids are empty arrays
no third-party source URLs
```

---

## 7. STAGE 2 — LEGAL STACK + DOCUMENT REDLINE

### 7.1 Purpose

Extract:

```text
legal_stack[]
document_stack_redline[]
legal_stack_assessment[]
limitations[]
```

### 7.2 Input

```json
{
  "run_id": "",
  "source_review": {},
  "evidence_buffer": [],
  "artifact_inventory": [],
  "target_profile": {},
  "product_feature_map": []
}
```

### 7.3 Prompt

```text
Stage: LEGAL_STACK_AND_DOCUMENT_REDLINE.

Use only the admitted evidence_buffer and artifact_inventory.
Do not search or browse.

Assess exactly five core legal artifacts:
- ToS
- Privacy Policy
- DPA
- AUP
- SLA

legal_stack[] must contain exactly five entries, one for each document type.

For existing documents, derive covers and misses from the document text.
For absent documents, exists=false, document_url="N/A", covers=null, and misses must state that public protections for that document type were not found in the reviewed first-party footprint.

Build document_stack_redline[] for:
- QUOTE_VS_QUOTE
- CLAIM_VS_ABSENCE
- STACK_VS_REALITY

Do not overstate private absence. Use public-footprint phrasing only.
Return JSON only.
```

### 7.4 Output schema

```json
{
  "legal_stack": [
    {
      "document_type": "ToS | Privacy Policy | DPA | AUP | SLA",
      "exists": false,
      "document_url": "N/A",
      "covers": null,
      "misses": "",
      "evidence_status": "FOUND | ABSENT | ACCESS_FAILED | INSUFFICIENT_TEXT",
      "linked_threat_ids": []
    }
  ],
  "document_stack_redline": [
    {
      "mismatch_id": "mis_001",
      "type": "QUOTE_VS_QUOTE | CLAIM_VS_ABSENCE | STACK_VS_REALITY",
      "quote": "",
      "source": "",
      "feature_ref": "",
      "claim_type": "AUTONOMOUS_ACTION | ENTERPRISE_READY | REGULATED_USE | HIGH_STAKES_DECISION | SECURITY_TRUST_CLAIM | HUMAN_REVIEW_CLAIM | DATA_PROCESSING_CLAIM | AI_DISCLOSURE_CLAIM",
      "contradicts": ""
    }
  ],
  "legal_stack_assessment": [
    {
      "document_type": "",
      "evidence_status": "",
      "source_url": "",
      "document_url": "",
      "absence_basis": "",
      "covers": null,
      "feature_map_cross_reference": "",
      "governance_surfaces_considered": "",
      "false_belief": "",
      "misses": "",
      "mismatch_check": []
    }
  ],
  "limitations": []
}
```

### 7.5 Backend validation

```text
legal_stack.length === 5
exactly one ToS
exactly one Privacy Policy
exactly one DPA
exactly one AUP
exactly one SLA
if exists=false then document_url === "N/A" and covers === null
all feature_ref values are valid feature_id/GLOBAL/MULTI/UNKNOWN
```

---

## 8. STAGE 3 — REGISTRY LEDGER EVALUATION

### 8.1 Purpose

Evaluate every active registry row exactly once.

### 8.2 Batch strategy

The backend may batch registry rows for token management, but the final merged ledger must cover all rows.

Recommended:

```text
batch_size: 10–20 registry rows
```

Do not batch by severity. Batch by registry order or stable Threat_ID sort only.

### 8.3 Input

```json
{
  "run_id": "",
  "registry_batch": [],
  "registry_count_loaded": 98,
  "registry_key": {},
  "hunter_engine_rules": {},
  "source_review": {},
  "evidence_buffer": [],
  "artifact_inventory": [],
  "target_profile": {},
  "product_feature_map": [],
  "legal_stack": [],
  "document_stack_redline": []
}
```

### 8.4 Prompt

```text
Stage: REGISTRY_LEDGER_EVALUATION.

Evaluate every registry row in registry_batch.
Do not skip, sample, merge, collapse, or prioritize rows.

For each row, execute the 12-step Hunter Logic Gate:

1. Load row fields.
2. Apply Archetype gate.
3. Apply Surface gate.
4. Apply Authority relevance.
5. Parse Hunter_Trigger syntax.
6. Evaluate every CONDITION_N independently.
7. Evaluate TRIGGER_IF.
8. Apply row EXCLUDE_IF.
9. Apply Universal EXCLUDE_IF rule HER_001.
10. Assign final 5-state status.
11. Prepare hydrated data if triggered.
12. Write ledger entry.

5-state status must be exactly one:
- TRIGGERED
- CONTROLLED
- NOT_TRIGGERED
- NOT_APPLICABLE
- INSUFFICIENT_EVIDENCE

EXCLUDE_IF default is FALSE.
Only explicit first-party proof can make EXCLUDE_IF TRUE.
Where legal allocation is required, technical control alone is insufficient.
Where product flow, notice, assent, or UI implementation is required, hidden legal clause alone is insufficient.

Absence-based trigger rule:
If the row tests for missing public clauses, documents, disclosures, limits, consent mechanisms, or governance surfaces, and the required item is absent after Source Collector inventory, the condition can PASS using:
- "NULL - absence of required clause"
- "NULL - document entirely absent"
- "NULL - public implementation proof not visible"

Return JSON only.
```

### 8.5 Output schema

```json
{
  "registry_batch_evaluation": [
    {
      "entry_number": 1,
      "threat_id": "",
      "threat_name": "",
      "archetype_gate": "PASS | FAIL | NOT_REQUIRED",
      "surface_gate": "PASS | FAIL | NOT_REQUIRED",
      "authority_relevance": "IN | EU | US | MULTI | NONE | NOT_REQUIRED",
      "conditions": [
        {
          "condition_id": "CONDITION_1",
          "result": "PASS | FAIL | INSUFFICIENT | NOT_APPLICABLE",
          "basis": "",
          "evidence_ref": ""
        }
      ],
      "trigger_if_result": "PASS | FAIL | PARTIAL | INSUFFICIENT",
      "exclude_if_result": "TRUE | FALSE | INSUFFICIENT",
      "final_status": "TRIGGERED | CONTROLLED | NOT_TRIGGERED | NOT_APPLICABLE | INSUFFICIENT_EVIDENCE",
      "feature_refs": [],
      "evidence_ref": "",
      "reasoning_summary": ""
    }
  ],
  "batch_warnings": []
}
```

### 8.6 Backend validation per batch

```text
returned row count === input registry_batch.length
every input Threat_ID returned exactly once
no extra Threat_ID
valid final_status
conditions array present
no generic "not applicable" without basis
```

### 8.7 Backend validation after merging all batches

```text
merged_ledger.length === registry_count_loaded
no missing Threat_ID
no duplicate Threat_ID
each active row evaluated once
```

---

## 9. STAGE 4 — OPERATOR CHALLENGE

### 9.1 Purpose

Detect undercounting, lazy false negatives, and absence-mandate failures.

### 9.2 Input

```json
{
  "run_id": "",
  "registry_count_loaded": 98,
  "registry_evaluation_ledger": [],
  "source_review": {},
  "artifact_inventory": [],
  "target_profile": {},
  "product_feature_map": [],
  "legal_stack": [],
  "document_stack_redline": []
}
```

### 9.3 Prompt

```text
Stage: OPERATOR_CHALLENGE_GATE.

Review the full registry_evaluation_ledger for completeness and undercounting.

Check:
- registry_count_loaded equals ledger length
- every row has valid final_status
- absence-based document/gov rows were not incorrectly marked NOT_TRIGGERED when artifacts are absent
- B2B enterprise AI with absent DPA/AUP/SLA/AI policy has been exhaustively tested
- autonomous-action products have corresponding authority/action/liability/disclosure rows checked
- regulated-use products have corresponding high-risk decision rows checked
- EXCLUDE_IF was not granted without explicit written proof

If correction is required, set result="REOPENED" and return corrected_ledger_entries only for rows to replace.
If no correction is required, set result="PASS".

Return JSON only.
```

### 9.4 Output schema

```json
{
  "operator_challenge_gate": {
    "completed": true,
    "result": "PASS | REOPENED",
    "registry_count_loaded": 98,
    "registry_count_evaluated": 98,
    "reopened_rows": [],
    "high_risk_checks": {
      "b2b_enterprise_ai": false,
      "autonomous_action": false,
      "cybersecurity_ai": false,
      "regulated_use": false,
      "dpa_absent": false,
      "aup_absent": false,
      "sla_absent": false,
      "ai_policy_absent": false,
      "human_review_structure_absent": false
    },
    "notes": []
  },
  "corrected_ledger_entries": []
}
```

### 9.5 Backend correction merge

If `result = REOPENED`, backend replaces matching ledger entries by Threat_ID and revalidates all counts.

---

## 10. STAGE 5 — COMPILER + ASSEMBLY HANDOFF

### 10.1 Purpose

Compile the full base report payload.

### 10.2 Important findings rule

```text
findings[] must contain every TRIGGERED ledger row.
findings[] must not contain only top risks.
findings[] must not suppress low-tier triggered rows.
findings[] must not sort by UI preference unless the original complete set remains intact.
findings[] length must equal count(final_status === "TRIGGERED").
```

Controlled and insufficient rows are kept separately:

```text
controlled_rows[]
insufficient_evidence_rows[]
```

### 10.3 Input

```json
{
  "run_id": "",
  "registry_rows": [],
  "registry_evaluation_ledger": [],
  "operator_challenge_gate": {},
  "source_review": {},
  "target_profile": {},
  "product_feature_map": [],
  "legal_stack": [],
  "document_stack_redline": [],
  "vault_reference_contract": {}
}
```

### 10.4 Prompt

```text
Stage: COMPILER_AND_ASSEMBLY_HANDOFF.

Compile the final base payload.

Do not filter findings.
Do not rank findings.
Do not limit findings to top N.
Do not omit triggered rows because they are low severity.
Do not omit triggered rows because they are repetitive.
Do not omit triggered rows for UI simplicity.

findings[] must include every ledger row with final_status = TRIGGERED.
controlled_rows[] must include every ledger row with final_status = CONTROLLED.
insufficient_evidence_rows[] must include every ledger row with final_status = INSUFFICIENT_EVIDENCE.

Compile all TRIGGERED rows into fully hydrated finding objects.
Pain_Category must be derived from Pain_Tier:
T1 = Existential
T2 = Uncapped Money
T3 = Deal Death
T4 = Regulatory Heat
T5 = Friction

Back-populate linked_threat_ids into product_feature_map and legal_stack where applicable.

Generate assembly_handoff using the Vault translation contract:
- baseline
- architecture
- archetypes
- compliance

Return JSON only.
```

### 10.5 Output schema

```json
{
  "diligence_run": {
    "run_id": "",
    "timestamp": "",
    "target_url": ""
  },
  "source_review": {},
  "target_profile": {},
  "product_feature_map": [],
  "legal_stack": [],
  "threat_registry_summary": {
    "registry_count_loaded": 0,
    "registry_count_evaluated": 0,
    "triggered_count": 0,
    "controlled_count": 0,
    "not_triggered_count": 0,
    "not_applicable_count": 0,
    "insufficient_evidence_count": 0,
    "existential_count": 0,
    "uncapped_money_count": 0,
    "deal_death_count": 0,
    "regulatory_heat_count": 0,
    "friction_count": 0
  },
  "feature_to_threat_matrix": {},
  "document_stack_redline": [],
  "findings": [
    {
      "finding_id": "finding_001",
      "threat_id": "",
      "threat_name": "",
      "status": "TRIGGERED",
      "pain_tier": "T1 | T2 | T3 | T4 | T5",
      "pain_category": "Existential | Uncapped Money | Deal Death | Regulatory Heat | Friction",
      "pain_depth": "Corporate | Personal | Criminal",
      "lane": "A | B | Both",
      "archetype": "",
      "surface_tokens": [],
      "subcat": "",
      "authority": {
        "IN": "",
        "EU": "",
        "US": ""
      },
      "linked_feature_ids": [],
      "evidence": {
        "source_url": "",
        "artifact_type": "",
        "proof_citation": "",
        "evidence_mode": "QUOTE | DOCUMENT_ABSENCE | CLAUSE_ABSENCE | PUBLIC_PROOF_ABSENCE"
      },
      "trigger_evaluation": {
        "conditions_passed": [],
        "conditions_failed": [],
        "trigger_if_result": "",
        "exclude_if_result": "",
        "exclude_if_basis": ""
      },
      "registry_payload": {
        "legal_pain": "",
        "fp_mechanism": "",
        "fp_impact": "",
        "lex_nova_fix": ""
      },
      "redline_route": [],
      "document_routes": [],
      "vault_dependencies": []
    }
  ],
  "controlled_rows": [],
  "insufficient_evidence_rows": [],
  "assembly_route": {},
  "technical_audit_log": {
    "global_synthesis": {},
    "registry_evaluation_ledger": [],
    "operator_challenge_gate": {},
    "limitations": []
  },
  "assembly_handoff": {
    "handoff_meta": {},
    "target_profile": {},
    "feature_map": [],
    "threat_findings": [],
    "document_stack_status": [],
    "vault_prefill_suggestions": {
      "baseline": {},
      "architecture": {},
      "archetypes": {},
      "compliance": {}
    },
    "vault_confirmation_questions": [],
    "assembly_route_recommendation": {}
  },
  "report_data": {
    "cover": {},
    "exec_memo": {},
    "source_review": {},
    "feature_map": {},
    "threat_summary": {},
    "feature_to_threat_matrix": {},
    "document_redline": {},
    "registry_findings": {},
    "assembly_route": {},
    "technical_audit": {}
  },
  "disclaimer": "Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use."
}
```

### 10.6 Backend validation

```text
findings.length === count(TRIGGERED)
controlled_rows.length === count(CONTROLLED)
insufficient_evidence_rows.length === count(INSUFFICIENT_EVIDENCE)
all finding threat_ids are registry threat_ids
no legacy keys:
- sales_viability
- signal_context
- ghost_protection_profile
- true_gaps
- prospect_meta
no truncated arrays
```

---

## 11. REPORT RENDERER CONTRACT

The report renderer is not Groq.

React renders the final report using `report_data`, `findings`, and `technical_audit_log`.

Report spine:

```text
1. Cover
2. Executive Memo
3. Source Review
4. Feature Map
5. Threat Summary
6. Feature-to-Threat Matrix
7. Document Redline
8. Full Registry Findings
9. Assembly Route
10. Technical Audit Log
```

### 11.1 UI filtering rule

UI may provide:

```text
filter by pain tier
filter by archetype
filter by subcat
filter by document route
sort by pain category
sort by source
hide/show controlled rows
collapse low-severity rows
```

But UI must never mutate the base payload.

Base payload always retains:

```text
all triggered findings
all controlled rows
all insufficient evidence rows
full registry ledger
```

---

## 12. FIRESTORE STORAGE CONTRACT

Recommended collections:

```text
interface_runs
interface_handoffs
interface_handoff_payloads
interface_delivery_packages
interface_horizon_updates
interface_maintenance_alerts
interface_system_status
```

Recommended document split:

```text
interface_runs/{run_id}
  metadata, source_review, status

interface_runs/{run_id}/stage_outputs/stage_1
interface_runs/{run_id}/stage_outputs/stage_2
interface_runs/{run_id}/stage_outputs/stage_3
interface_runs/{run_id}/stage_outputs/stage_4
interface_runs/{run_id}/stage_outputs/stage_5

interface_handoffs/{handoff_id}
  universal envelope only

interface_handoff_payloads/{handoff_id}
  assembly_handoff payload
```

---

## 13. FAILURE STATES

### 13.1 Source Collector failure

If Source Collector cannot collect any first-party/pasted public evidence:

```json
{
  "status": "failed",
  "failure_type": "SOURCE_COLLECTION_EMPTY",
  "limitations": ["SOURCE_COLLECTION_EMPTY"],
  "findings": [],
  "technical_audit_log": {
    "registry_evaluation_ledger": []
  }
}
```

Do not hallucinate findings.

### 13.2 Groq stage failure

If a stage returns invalid JSON or fails validation:

```text
backend retries once
if still invalid, mark stage failed
do not fabricate downstream outputs
```

### 13.3 Registry evaluation partial failure

Partial registry evaluation is invalid.

If any registry row is missing:

```text
run_status = failed_validation
failure_type = REGISTRY_LEDGER_INCOMPLETE
```

No final report is emitted.

---

## 14. GROQ RESPONSE FORMAT REQUIREMENTS

Each Groq call must request:

```text
JSON only
no markdown
no prose
no fenced code blocks
no ellipses
no truncated arrays
```

If Groq supports structured output / JSON schema in the deployed client, use it. If unavailable, enforce JSON parsing and validation in backend.

---

## 15. SUMMARY OF CONVERSION FROM GPT RUNTIME

| GPT Runtime Concept | Sandbox/Groq Conversion |
|---|---|
| Native web/search tool | Sandbox Source Collector |
| Knowledge Files | Backend-loaded runtime artifacts |
| Fenced audit/html/json blocks | API JSON objects |
| HTML generated by model | React report renderer |
| No-truncation prompt rule | Backend validation |
| Full visible ledger | Stored full registry_evaluation_ledger |
| Assembly Handoff block | assembly_handoff object + Firestore handoff payload |
| Prompt chronological sequence | Backend state machine |
| Model-owned browsing retries | Source Collector retries |
| Model-owned terminal output | Backend response contract |
| Threat prioritisation | UI-only sorting/filtering |

---

## 16. LOCKED BASE OUTPUT RULE

The Diligence Engine base runtime is a **full threat report**.

```text
All TRIGGERED threats must be emitted in findings[].
No triggered threat may be hidden, ranked out, collapsed, sampled, or omitted.
Filtering, sorting, prioritising, collapsing, and display grouping are UI-level functions only.
```
