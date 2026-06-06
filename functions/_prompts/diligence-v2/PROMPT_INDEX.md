# Diligence v2 Prompt Chain Index

## Status

This index governs the seven-stage Diligence Engine prompt chain under:

```text
functions/_prompts/diligence-v2/
```

The v2 chain replaces the older Groq-stage prompt index for the Gemini-primary Interface Diligence Engine.

## Governing documents

Read these before editing any stage prompt:

```text
docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md
docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md
docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md
docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md
data/runtime/registry_key.runtime.json
data/runtime/registry.runtime.json
```

If a prompt conflicts with the Contract Spine or Vault.js Canonical Map, the contract controls.

## Pipeline ownership

```text
0.   Source Collector                    client / browser / Jina
0.5  Evidence Refiner                    Gemini / Pages Function
1.   Target + Feature Map                Gemini / Pages Function
2.   Legal Stack + Redline               Gemini / Pages Function
3.   Registry Ledger                     Gemini / Pages Function, batched
4.   Operator Challenge                  Gemini / Pages Function, merged ledger only
5.   Final Compiler                      Gemini / Pages Function
5B.  Deterministic Backend Assembler      backend only, no model
```

Only Node 0 runs in the browser without a model key. Every Gemini stage runs server-side through Pages Functions.

## Prompt files

| Stage | File | Job | Primary output |
|---|---|---|---|
| 00 | `00_SHARED_SYSTEM_PREAMBLE.prompt.md` | Shared doctrine, source firewall, legal-advice boundary, output discipline | Injected system preamble |
| 01 | `01_EVIDENCE_REFINER.prompt.md` | Convert collected public material into admitted evidence | `source_bundle` |
| 02 | `02_TARGET_FEATURE_PROFILE.prompt.md` | Identify target, product, features, archetypes, and surfaces | `target_feature_profile` |
| 03 | `03_LEGAL_STACK_REVIEW.prompt.md` | Review visible public legal/governance stack against product behavior | `legal_stack_review` |
| 04 | `04_REGISTRY_LEDGER_EVALUATION.prompt.md` | Evaluate every supplied registry row under Hunter Logic Gate | `registry_evaluation_ledger[]`, `batch_warnings[]` |
| 05 | `05_OPERATOR_CHALLENGE.prompt.md` | Challenge the completed merged ledger for false negatives and bad exclusions | `operator_challenge_gate`, `corrected_ledger_entries[]` |
| 06 | `06_FINAL_COMPILER.prompt.md` | Compile post-challenge ledger into report/compiler output | `compiler_output` |

## Stage 00 — Shared System Preamble

Purpose:

```text
Give every Gemini stage the same source firewall, public-footprint discipline, no-legal-advice boundary, and JSON-only output discipline.
```

Must not output final stage data directly.

## Stage 01 — Evidence Refiner

Input:

```text
raw_zoned_footprint / collected source material
```

Output:

```text
source_bundle
```

Core rules:

```text
- admit only first-party, target-controlled, hosted-governance-qualified, or user-provided public material
- keep discovery-only material out of evidence_buffer[]
- record artifact inventory and limitations
- do not browse/search/fetch
```

## Stage 02 — Target Feature Profile

Input:

```text
source_bundle
```

Output:

```text
target_feature_profile
```

Core rules:

```text
- extract target_profile and primary_product from admitted evidence only
- map product_feature_map[] with evidence quotes and source URLs
- use registry-locked archetype vocabulary
- TRN = The Translator, not Trainer
- MOV = physical-world mover, not digital/data movement
- no legal-stack review
- no registry evaluation
- no Vault output
```

## Stage 03 — Legal Stack Review

Input:

```text
source_bundle + target_feature_profile
```

Output:

```text
legal_stack_review
```

Core rules:

```text
- legal_stack[] must contain exactly ToS, Privacy Policy, DPA, AUP, SLA
- absent docs use public-footprint absence language
- use False Belief Formula without making legal conclusions
- no registry status assignment
- no legal advice
```

## Stage 04 — Registry Ledger Evaluation

Input:

```text
source_bundle + target_feature_profile + legal_stack_review + registry_rows[] + registry_key
```

Output:

```text
registry_batch_meta
registry_evaluation_ledger[]
batch_warnings[]
```

Core rules:

```text
- evaluate every supplied row in the current invocation
- no hardcoded 98
- when batched, ledger length equals supplied batch row count
- backend later merges batches into the full ledger
- batch_warnings[] are strings only
- EXCLUDE_IF defaults false under HER_001
- do not skip Pending / Watch / Upcoming rows if supplied
- Lane is a scope signal, not a skip permission
```

## Stage 05 — Operator Challenge

Input:

```text
merged registry_evaluation_ledger[] + source_bundle + target_feature_profile + legal_stack_review
```

Output:

```text
operator_challenge_gate
corrected_ledger_entries[]
```

Core rules:

```text
- requires explicit merged-ledger proof unless test_run is true
- does not re-run registry evaluation from scratch
- reopens only rows that can be safely corrected from supplied material
- does not invent missing Hunter logic
- if safe correction is impossible, return FAIL_RETRY_REQUIRED
```

## Stage 06 — Final Compiler

Input:

```text
post-challenge registry_evaluation_ledger[]
+ operator_challenge_gate
+ source_bundle / target_feature_profile / legal_stack_review
+ registry row payload fields
```

Output:

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

Core rules:

```text
- findings[] = every TRIGGERED row
- controlled_rows[] = every CONTROLLED row
- insufficient_evidence_rows[] = every INSUFFICIENT_EVIDENCE row
- no top-N, no sampling, no truncation
- report_data is structured JSON; React renders it
- model emits vault_confirmation_questions[] only
- model does not emit vault_prefill_suggestions, assembly_handoff, or handoff_envelope
```

## Node 5B — Deterministic Backend Assembler

Node 5B is not a Gemini prompt.

It derives:

```text
vault_prefill_suggestions{}
assembly_handoff{}
handoff_envelope{}
Firestore writes
```

from:

```text
compiler_output
Vault.js Canonical Map
handoff envelope validator
backend routing rules
```

Node 5B must enforce the literal Vault shape:

```text
baseline
architecture
archetypes
compliance
status
submittedAt
```

No `meta` group. No `human_review` Vault field. `integrations` belongs under `baseline`, not `architecture`.

## Schema boundaries

| Output | Schema |
|---|---|
| Stage 01 | `data/schemas/sourceBundle.schema.json` |
| Stage 02 | `data/schemas/targetFeatureProfile.schema.json` |
| Stage 03 | `data/schemas/legalStackReview.schema.json` |
| Stage 04 | `data/schemas/registryLedger.schema.json` |
| Stage 05 | `data/schemas/operatorChallenge.schema.json` |
| Stage 06 | `data/schemas/compilerOutput.schema.json` |
| Final post-Node-5B object | `data/schemas/diligenceReport.schema.json` or successor final report schema |

`diligenceReport.schema.json` may include post-Node-5B fields. Stage 06 must validate against `compilerOutput.schema.json`, not against a schema that requires backend-owned handoff fields.

## Non-negotiable no-cap invariant

```text
findings.length === count(TRIGGERED)
controlled_rows.length === count(CONTROLLED)
insufficient_evidence_rows.length === count(INSUFFICIENT_EVIDENCE)
technical_audit_log covers every ledger row
```

The executive report may highlight material findings, but full arrays are never capped.

## Mandatory disclaimer

Every report and payload must preserve this exact disclaimer:

```text
Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.
```

## Forbidden legacy keys

No v2 prompt output may contain:

```text
sales_viability
signal_context
ghost_protection_profile
true_gaps
prospect_meta
```

## Forbidden Vault drift

No v2 model prompt may emit:

```text
vault_prefill_suggestions
meta
human_review
architecture.integrations
architecture.output_ownership
architecture.agent_limits
product_identity
ai_architecture
data_output
commercial_controls
```

## Change discipline

Do not edit a stage prompt without checking:

```text
1. Contract Spine
2. Vault.js Canonical Map
3. Relevant live schema
4. Registry key/runtime if the stage touches archetypes, surfaces, lanes, statuses, or threat IDs
5. The previous and next stage boundaries
```

End of Diligence v2 Prompt Chain Index.
