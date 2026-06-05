# NODE 5B DETERMINISTIC ASSEMBLER CONTRACT v1

**Status:** Canonical build contract for the deterministic backend assembler.

**Authority:** Sits under `INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md` and `VAULT_JS_CANONICAL_MAP_v1.md`.

**Purpose:** Define the non-model bridge between the Stage 06 compiler output and the Assembly engine. Node 5B derives Vault prefill, builds the assembly handoff payload, wraps it in the handoff envelope, validates both objects, and writes the handoff records. It must never call Gemini or ask a model to invent Vault values.

---

## 0. GOVERNING RULE

Node 5B is deterministic backend logic.

It does **not**:

- call Gemini;
- re-run diligence prompts;
- create new findings;
- change registry statuses;
- invent Vault fields;
- infer private architecture or commercial facts;
- create legal advice;
- render the report.

It receives the compiler output and applies fixed mapping rules from the Vault Canonical Map.

Core boundary:

```text
Node 5 / Stage 06 = compiler output + vault_confirmation_questions[]
Node 5B = vault_prefill_suggestions + assembly_handoff + handoff_envelope + Firestore writes
```

---

## 1. INPUT CONTRACT

Node 5B receives a validated Stage 06 compiler output matching `data/schemas/compilerOutput.schema.json`.

Required compiler-owned inputs:

```text
diligence_run
source_bundle_summary
target_profile
primary_product
product_feature_map[]
legal_stack[]
document_stack_redline[]
threat_registry_summary{}
feature_to_threat_matrix[]
findings[]
controlled_rows[]
insufficient_evidence_rows[]
assembly_route{}
report_data{}
technical_audit_log[]
threat_findings[]
vault_confirmation_questions[]
disclaimer
```

Node 5B may also read:

```text
VAULT_JS_CANONICAL_MAP_v1.md / compiled allowlist
vault.schema.json
assemblyOutput.schema.json
handoffEnvelope.js
runtime timestamp
Firestore document refs
```

Node 5B must reject or quarantine compiler outputs that contain backend-owned fields:

```text
vault_prefill_suggestions
assembly_handoff
handoff_envelope
handoff_meta
payload_ref
interface_handoffs
interface_handoff_payloads
```

---

## 2. OUTPUT CONTRACT

Node 5B produces two objects.

### 2.1 `assembly_handoff`

Shape:

```json
{
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
  "assembly_route_recommendation": {},
  "warnings": []
}
```

This object must validate against `data/schemas/assemblyOutput.schema.json`.

### 2.2 `handoff_envelope`

Created using `createHandoffEnvelope` from `src/wrapper/contracts/handoffEnvelope.js` with:

```json
{
  "runId": "<compiler_output.diligence_run.run_id>",
  "sourceEngine": "diligence",
  "targetEngine": "assembly",
  "payloadType": "assembly_handoff_payload",
  "payloadRef": "interface_handoff_payloads/<handoff_id>",
  "summary": "Assembly handoff for <target/company/product>",
  "warnings": []
}
```

Envelope must validate with `validateHandoffEnvelope`.

---

## 3. VAULT PREFILL SHAPE

Node 5B derives this exact object:

```json
{
  "baseline": {},
  "architecture": {},
  "archetypes": {},
  "compliance": {}
}
```

Each populated field must be:

```json
{
  "value": null,
  "basis": "",
  "confidence": "high",
  "source_finding_ids": []
}
```

Allowed confidence values:

```text
high
medium
low
```

No fifth group.

Forbidden groups and paths:

```text
meta
product_identity
ai_architecture
data_output
commercial_controls
human_review
architecture.integrations
architecture.output_ownership
architecture.agent_limits
```

`integrations` belongs under `baseline.integrations`, not `architecture`.

---

## 4. FIELD ALLOWLIST

Node 5B may only prefill fields appearing in the literal Vault map.

### 4.1 Baseline

```text
baseline.company
baseline.entity_type
baseline.address
baseline.legal_email
baseline.privacy_email
baseline.products
baseline.jurisdiction.country
baseline.jurisdiction.state
baseline.market
baseline.delivery.app
baseline.delivery.api
baseline.revenue_model
baseline.acv
baseline.has_beta
baseline.output_ownership
baseline.sla_type
baseline.integrations.slack
baseline.integrations.crm
baseline.integrations.stripe
baseline.integrations.github
baseline.integrations.webhooks
baseline.integrations.none
baseline.reliance_threshold
```

### 4.2 Architecture

```text
architecture.memory
architecture.models
architecture.sub_processors.openai
architecture.sub_processors.anthropic
architecture.sub_processors.google
architecture.sub_processors.cohere
architecture.sub_processors.mistral
architecture.sub_processors.other
architecture.sub_processors.url
architecture.cloud_host
architecture.vector_db
```

### 4.3 Archetypes

```text
archetypes.is_doer
archetypes.is_orchestrator
archetypes.agent_limits.session_cap
archetypes.agent_limits.period_cap
archetypes.agent_limits.retry_limit
archetypes.agent_limits.loop_threshold
archetypes.is_creator
archetypes.is_reader
archetypes.conversational_ui
archetypes.sens_bio
archetypes.is_judge
archetypes.is_judge_hr
archetypes.is_judge_legal
archetypes.is_optimizer
archetypes.sens_fin
archetypes.is_shield
archetypes.is_mover
archetypes.is_generalist
```

### 4.4 Compliance

```text
compliance.processes_pii
compliance.eu_users
compliance.ca_users
compliance.other_regions
compliance.sens_health
compliance.sens_fin
compliance.sens_employment
compliance.minors
compliance.distress
compliance.standard_adults
```

---

## 5. PREFILL VS CONFIRM BOUNDARY

Node 5B may prefill public-footprint-supported fields.

Node 5B must not guess internal, commercial, or private facts.

### 5.1 Prefill-eligible fields

Prefill if supported by compiler output, findings, feature map, or admitted source evidence:

```text
all archetypes.is_* behavior flags
compliance.* surface flags
baseline.company
baseline.products
baseline.jurisdiction.country
baseline.market
baseline.delivery.app
baseline.delivery.api
baseline.has_beta
architecture.sub_processors.* only if explicitly published
architecture.sub_processors.url only if explicitly published
architecture.memory only if explicitly stated as RAG/stateless/fine-tuning
architecture.models only if explicitly stated as self-hosted/third-party
```

### 5.2 Confirmation-required fields

Do not prefill unless explicitly established. Otherwise preserve or create confirmation questions:

```text
architecture.memory
architecture.models
architecture.cloud_host
architecture.vector_db
architecture.sub_processors.* when not published
archetypes.agent_limits.*
baseline.entity_type
baseline.address
baseline.legal_email
baseline.privacy_email
baseline.acv
baseline.revenue_model
baseline.output_ownership
baseline.sla_type
baseline.reliance_threshold
compliance.other_regions
compliance.distress
compliance.standard_adults
```

Rule of thumb:

```text
Public footprint can establish what the product appears to do and who it touches.
The founder must confirm how it is built, what it costs, and what it contractually commits to.
```

---

## 6. DETERMINISTIC DERIVATION RULES

Node 5B derives prefill from:

```text
compiler_output.findings[]
compiler_output.threat_findings[]
compiler_output.product_feature_map[]
compiler_output.target_profile
compiler_output.primary_product
compiler_output.legal_stack[]
compiler_output.assembly_route
compiler_output.vault_confirmation_questions[]
```

No model reasoning.

Use fixed mapping rules only.

---

## 7. ARCHETYPE → VAULT FLAG FAN-OUT

Apply these mappings exactly:

| Diligence archetype | Vault flag(s) | Route |
|---|---|---|
| UNI | `archetypes.is_generalist` | baseline hallucination waivers |
| DOE | `archetypes.is_doer` | TOS §2.7 + DOC_AGT |
| ORC | `archetypes.is_orchestrator` | AGT §3.5 |
| CRT | `archetypes.is_creator` | TOS §4.1, TOS §6.2 |
| RDR | `archetypes.is_reader` | TOS §4.1(e) |
| CMP | `archetypes.conversational_ui` | TOS §3.4, AUP §3.5 |
| TRN | `archetypes.sens_bio` | AUP §3.6 |
| JDG | `archetypes.is_judge`, `archetypes.is_judge_hr`, `archetypes.is_judge_legal` | TOS §5.6, AUP §3.4, AUP §3.3 |
| OPT | `archetypes.is_optimizer`, `archetypes.sens_fin` | AUP §3.2 |
| SHD | `archetypes.is_shield` | AGT §7.1 + false-negative cap |
| MOV | `archetypes.is_mover` | TOS §2.4 |

Fan-out rules:

```text
JDG sets all three judge flags.
OPT sets both optimizer and financial-sensitive flag.
CMP sets conversational_ui. If implementation later supports a derived is_companion route, it is derived from conversational_ui but is not a Vault payload field unless schema explicitly adds it.
```

Do not emit `human_review`.

Human review / HITL is an effect of Judge/high-risk routes, not a Vault field.

---

## 8. SURFACE → COMPLIANCE FLAG MAPPING

Apply these mappings only when the feature map, findings, or source evidence supports the surface.

| Surface / signal | Vault field | Value |
|---|---|---|
| PII | `compliance.processes_pii` | `"yes"` |
| No PII visible and reliable | `compliance.processes_pii` | `"no"` only if clearly established |
| EU users / EU targeting / EU transfer | `compliance.eu_users` | `true` |
| California users / CCPA signal | `compliance.ca_users` | `true` |
| Health / medical | `compliance.sens_health` | `true` |
| Financial | `compliance.sens_fin` | `true` |
| Employment / HR | `compliance.sens_employment` | `true` |
| Minors | `compliance.minors` | `true` |
| Distress / vulnerable users | `compliance.distress` | `true` if explicitly visible |

Do not set `compliance.processes_pii = "no"` merely because PII was not detected. Absence of evidence is not proof of no PII unless the product/source explicitly supports that conclusion.

---

## 9. BASELINE PREFILL RULES

### 9.1 `baseline.company`

Source:

```text
compiler_output.target_profile.company_name
```

Prefill when non-empty and not a placeholder.

### 9.2 `baseline.products`

Source:

```text
compiler_output.primary_product
compiler_output.product_feature_map[]
```

Build a compact product list / service description.

### 9.3 `baseline.jurisdiction.country` and `.state`

Source:

```text
target_profile.hq_jurisdiction
```

Prefill country if clearly extractable.
Prefill state only if clearly extractable.
Otherwise ask confirmation question.

### 9.4 `baseline.market`

Map B2B / B2C / hybrid from product positioning and user profile.

Do not infer consumer status merely from a public website.

### 9.5 `baseline.delivery.app` and `.api`

Set from product delivery evidence:

```text
app/gui/dashboard/interface → delivery.app = true
API/developer docs/webhooks/integration product → delivery.api = true
```

### 9.6 `baseline.has_beta`

Set only if beta, early access, preview, lab, waitlist, alpha, experimental, or equivalent is visible.

### 9.7 `baseline.integrations.*`

Set only if explicit integrations are visible.

Examples:

```text
Slack → baseline.integrations.slack
CRM / Salesforce / HubSpot → baseline.integrations.crm
Stripe / payments → baseline.integrations.stripe
GitHub → baseline.integrations.github
Webhooks/API events → baseline.integrations.webhooks
```

If none are visible, do not automatically set `baseline.integrations.none = true` unless the product explicitly says no integrations.

---

## 10. ARCHITECTURE PREFILL RULES

Architecture is usually internal.

Prefill only when explicit.

### 10.1 Model providers

If public evidence names:

```text
OpenAI / GPT → architecture.sub_processors.openai = true
Anthropic / Claude → architecture.sub_processors.anthropic = true
Google / Gemini / Vertex → architecture.sub_processors.google = true
Cohere → architecture.sub_processors.cohere = true
Mistral → architecture.sub_processors.mistral = true
Other named provider → architecture.sub_processors.other = "<name>"
```

### 10.2 Published subprocessor URL

If a public subprocessor page exists:

```text
architecture.sub_processors.url = "<url>"
```

### 10.3 Memory / model architecture

Only prefill `architecture.memory` or `architecture.models` if the source explicitly states:

```text
RAG
retrieval augmented generation
stateless processing
fine-tuning
self-hosted model
third-party model
```

Otherwise preserve or generate confirmation questions.

### 10.4 Cloud host and vector DB

Do not prefill unless explicitly published.

---

## 11. CONFIRMATION QUESTION TRANSFORM

Compiler output schema uses:

```json
{
  "field_path": "",
  "question": "",
  "why_it_matters": "",
  "source_finding_ids": [],
  "priority": "HIGH"
}
```

Assembly output schema currently expects:

```json
{
  "field_path": "",
  "question": "",
  "why_it_matters": "",
  "source_context": "",
  "required_for": ""
}
```

Node 5B must transform compiler questions into assembly questions:

```text
field_path      → field_path
question        → question
why_it_matters  → why_it_matters
source_context  → join(source_finding_ids) + priority, or explanatory source note
required_for    → route/document reason derived from why_it_matters, field_path, or assembly_route
```

Do not drop questions unless the backend has deterministically prefilled the field with high-confidence support.

If the compiler emits a confirmation question for an invalid Vault path, Node 5B must:

```text
reject that question from assembly_handoff
add a warning
not invent a replacement path unless there is a deterministic one-to-one correction
```

Deterministic one-to-one corrections allowed:

```text
architecture.integrations.* → baseline.integrations.*
```

Forbidden corrections:

```text
human_review → any field
meta.* → any field
product_identity.* → any field
ai_architecture.* → any field
```

Those must become warnings, not silent migrations.

---

## 12. PREFILL SUGGESTION BASIS RULES

Every prefill suggestion requires:

```text
value
basis
confidence
source_finding_ids[]
```

`basis` must be human-auditable.

Good basis examples:

```text
Derived from feature F001 with archetype DOE.
Derived from finding FIND-003 linked to Sensitive/Biometric surface.
Derived from target_profile.primary_product showing API delivery.
Derived from public subprocessor URL in source evidence.
```

Bad basis examples:

```text
Probably true.
Common for SaaS.
Assumed based on market.
Model guessed.
```

If no `source_finding_ids[]` exist but the support comes from feature map or target profile, use a stable reference where possible:

```text
feature:F001
target_profile
primary_product
legal_stack:DPA
```

If no stable source reference exists, do not prefill.

---

## 13. CONFIDENCE RULES

Use deterministic confidence only.

```text
high = directly supported by finding, feature, target profile, or explicit source evidence.
medium = supported by public product behavior but not a direct statement.
low = weak public signal; prefer confirmation unless route needs tentative suggestion.
```

Do not use confidence to smuggle guesses.

If the source is weak and the field is internal/commercial, ask confirmation instead of prefill.

---

## 14. ASSEMBLY HANDOFF BUILD RULES

Build `assembly_handoff` as follows.

### 14.1 `handoff_meta`

```json
{
  "run_id": "",
  "created_at": "",
  "source_engine": "diligence",
  "target_engine": "assembly",
  "compiler_schema": "compilerOutput.schema.json",
  "assembler_contract": "NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1"
}
```

### 14.2 `target_profile`

Copy from compiler output.

Do not mutate.

### 14.3 `feature_map`

Copy `product_feature_map[]` from compiler output.

Do not drop secondary features.

### 14.4 `threat_findings`

Copy `compiler_output.threat_findings[]`.

If missing, derive a minimal array from `findings[]` without inventing fields.

### 14.5 `document_stack_status`

Copy `legal_stack[]` and relevant document status from compiler output.

Do not invent private documents.

### 14.6 `vault_prefill_suggestions`

Derive via this contract.

### 14.7 `vault_confirmation_questions`

Transform compiler questions into assembly schema shape.

### 14.8 `assembly_route_recommendation`

Copy `compiler_output.assembly_route`.

Do not convert this into final documents.

### 14.9 `warnings`

Include warnings from validation, invalid fields, low-confidence non-prefill decisions, missing required inputs, or schema bridge issues.

---

## 15. HANDOFF ENVELOPE BUILD RULES

After `assembly_handoff` validates, persist it or prepare its Firestore payload ref.

Then create envelope using `createHandoffEnvelope`:

```js
createHandoffEnvelope({
  runId,
  sourceEngine: "diligence",
  targetEngine: "assembly",
  payloadType: "assembly_handoff_payload",
  payloadRef,
  summary,
  warnings
})
```

Required envelope values:

```text
source_engine = diligence
target_engine = assembly
payload_type = assembly_handoff_payload
status = draft
warnings = array
created_at / updated_at = ISO timestamps
```

Do not hand-code a conflicting envelope shape.

---

## 16. FIRESTORE WRITE CONTRACT

Node 5B writes only after validation passes.

Target collections:

```text
interface_handoffs/{handoff_id}
interface_handoff_payloads/{handoff_id}
interface_runs/{run_id}/stage_outputs/node_5b_backend_assembler
```

Recommended write order:

```text
1. Validate compiler output.
2. Derive vault_prefill_suggestions.
3. Build assembly_handoff.
4. Validate assembly_handoff.
5. Create handoff_envelope.
6. Validate handoff_envelope.
7. Write payload to interface_handoff_payloads/{handoff_id}.
8. Write envelope to interface_handoffs/{handoff_id} with payload_ref.
9. Write stage output summary under interface_runs/{run_id}/stage_outputs/node_5b_backend_assembler.
```

If any validation fails before writes, do not create partial handoff records.

If payload write succeeds but envelope write fails, mark recovery warning and retry envelope write with the same payload ref.

---

## 17. VALIDATION GATES

Node 5B must run these gates.

### 17.1 Compiler output gate

Validate against:

```text
data/schemas/compilerOutput.schema.json
```

Reject if:

```text
missing required compiler fields
contains backend-owned fields
contains invalid Vault field paths in confirmation questions
findings/control/insufficient counts mismatch ledger summary
missing disclaimer
```

### 17.2 Vault prefill gate

Validate:

```text
exact groups: baseline, architecture, archetypes, compliance
no meta group
no human_review field
no architecture.integrations
all fields in literal allowlist
every suggestion has value, basis, confidence, source_finding_ids[]
every suggestion has deterministic support
```

### 17.3 Fan-out gate

Validate:

```text
JDG → is_judge + is_judge_hr + is_judge_legal
OPT → is_optimizer + sens_fin
CMP → conversational_ui
TRN → sens_bio
UNI → is_generalist
```

### 17.4 Confirmation question gate

Validate:

```text
field_path exists in Vault allowlist
question is not empty
why_it_matters is not empty
assembly schema fields source_context and required_for are populated
invalid fields are warned and excluded
```

### 17.5 Assembly output gate

Validate against:

```text
data/schemas/assemblyOutput.schema.json
```

### 17.6 Envelope gate

Validate with:

```text
validateHandoffEnvelope(envelope)
```

---

## 18. WARNING CODES

Use warning strings in this format:

```text
W### | <code> | <message>
```

Recommended codes:

```text
INVALID_VAULT_PATH
FORBIDDEN_HUMAN_REVIEW_FIELD
FORBIDDEN_META_GROUP
MISPLACED_INTEGRATIONS_FIELD
LOW_CONFIDENCE_NO_PREFILL
CONFIRMATION_REQUIRED
MISSING_SOURCE_FINDING_ID
COMPILER_OUTPUT_INVALID
ASSEMBLY_OUTPUT_INVALID
HANDOFF_ENVELOPE_INVALID
FIRESTORE_WRITE_FAILED
SCHEMA_BRIDGE_TRANSFORM
```

Warnings do not authorize guessing.

---

## 19. HARD FORBIDDEN BEHAVIORS

Node 5B must not:

- call Gemini;
- call Groq;
- call any LLM;
- browse or search;
- scrape new sources;
- change `findings[]`;
- change ledger statuses;
- add triggered findings;
- remove controlled rows;
- remove insufficient evidence rows;
- infer private MSAs;
- infer internal policies;
- infer cloud host unless explicit;
- infer vector DB unless explicit;
- infer model provider unless explicit;
- emit `meta` group;
- emit `human_review`;
- emit `architecture.integrations`;
- emit `architecture.output_ownership`;
- emit `architecture.agent_limits`;
- write partial handoff records after validation failure;
- claim legal advice;
- certify compliance.

---

## 20. IMPLEMENTATION NOTES

Recommended implementation files later:

```text
src/wrapper/assembly/node5bAssembler.js
src/wrapper/assembly/vaultPrefillDeriver.js
src/wrapper/assembly/vaultFieldAllowlist.js
src/wrapper/assembly/assemblyHandoffBuilder.js
src/wrapper/assembly/assemblyHandoffValidator.js
```

Recommended pure functions:

```text
validateCompilerOutput(compilerOutput)
deriveVaultPrefillSuggestions(compilerOutput, vaultAllowlist)
normalizeVaultConfirmationQuestions(compilerOutput.vault_confirmation_questions)
buildAssemblyHandoff(compilerOutput, vaultPrefillSuggestions, normalizedQuestions)
createAndValidateAssemblyEnvelope(runId, payloadRef, summary, warnings)
```

Keep these functions deterministic and unit-testable.

---

## 21. ACCEPTANCE CHECKLIST

Node 5B is complete only when:

```text
compilerOutput validates before assembly
vault_prefill_suggestions contains only allowed fields
forbidden paths are rejected
fan-out rules are applied exactly
confirmation questions are transformed to assembly schema
assembly_handoff validates
handoff_envelope validates
Firestore refs are consistent
no model call exists in the path
all warnings are visible
```

---

## 22. CURRENT KNOWN SCHEMA BRIDGE

`compilerOutput.schema.json` and `assemblyOutput.schema.json` intentionally differ.

Compiler question shape:

```text
field_path
question
why_it_matters
source_finding_ids[]
priority
```

Assembly question shape:

```text
field_path
question
why_it_matters
source_context
required_for
```

Node 5B owns this transformation.

Do not change Stage 06 prompt to satisfy the assembly schema directly.

---

## 23. FINAL RULE

If Node 5B cannot prove a prefill from public-footprint output and fixed mapping rules, it must not prefill.

It must ask or preserve a confirmation question.

No silent guesses.

No model invention.

No Vault drift.
