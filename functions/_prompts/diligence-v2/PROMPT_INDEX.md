# Diligence v2 Prompt Chain Index

## Status

This index governs the Diligence Engine prompt chain under:

```text
functions/_prompts/diligence-v2/
```

The v2 chain uses Gemini-primary runtime prompts and deterministic backend assembly.

## Governing documents

Read these before editing any stage prompt:

```text
docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md
docs/contracts/DILIGENCE_CANON_FIELD_DICTIONARY_v1.md
docs/contracts/STAGE4_STAGE5_CANON_FIELD_DICTIONARY_v1.md
docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md
docs/contracts/NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md
data/runtime/registry_key.runtime.json
data/runtime/registry.runtime.json
```

The controlling active dictionary is:

```text
docs/contracts/DILIGENCE_CANON_FIELD_DICTIONARY_v1.md
```

The older Stage 4/5 dictionary is retained as migration history and compatibility fallback. If any older prompt/doc/schema conflicts with the active Diligence Canon Field Dictionary, the active dictionary controls.

## Locked stage canon

```text
Stage 4 = target_profile_v2
Stage 5 = feature_profile_v2
Stage 5 canonical features = feature_inventory[]
Stage 6 = legal_stack_review wrapper containing legal_stack_review_v2
Stage 6 role = Legal Stack + Data Provenance Navigation Layer
product_feature_map[] = legacy compatibility only
primary_product = legacy language only
```

## Runtime dictionary slicing

The runtime prompt loader must append only the relevant dictionary blocks:

```text
company_profile              -> UNIVERSAL + STAGE4
target_feature_profile       -> UNIVERSAL + STAGE5
legal_stack_review           -> UNIVERSAL + STAGE6
registry_ledger_evaluation   -> UNIVERSAL + STAGE7_NAVIGATION
```

Do not append the full dictionary to every prompt.

## Pipeline ownership

```text
0.   Source Collector                                      client / browser / source runtime
0.5  Evidence Refiner                                      Gemini / runtime API
4.   Canonical Target Profile                              Gemini / runtime API
5.   Product Function / Feature Inventory                  Gemini / runtime API
6.   Legal Stack + Data Provenance Navigation Layer        Gemini / runtime API
7.   Registry Ledger                                       Gemini / runtime API, batched
8.   Operator Challenge                                    Gemini / runtime API, merged ledger only
9.   Final Compiler                                        Gemini / runtime API
5B.  Deterministic Backend Assembler                       backend only, no model
```

Only collection runs without a model key. Every Gemini stage runs server-side.

## Prompt files

| Stage | File | Job | Primary output |
|---|---|---|---|
| 00 | `00_SHARED_SYSTEM_PREAMBLE.prompt.md` | Shared doctrine, source firewall, no-legal-advice boundary, JSON output discipline | Injected system preamble |
| 01 | `01_EVIDENCE_REFINER.prompt.md` | Convert collected public material into admitted evidence | `source_bundle` |
| 02A | `02_COMPANY_PROFILE.prompt.md` | Canonical identity, jurisdiction, market, baseline Vault candidates | `company_profile` wrapper containing `target_profile_v2` |
| 02B | `02_TARGET_FEATURE_PROFILE.prompt.md` | Atomic feature/function inventory, data provenance, archetype/surface provenance | `target_feature_profile` wrapper containing `feature_profile_v2` |
| 03 | `03_LEGAL_STACK_REVIEW.prompt.md` | Legal document cartography + data provenance navigation layer | `legal_stack_review` wrapper containing `legal_stack_review_v2` |
| 04 | `04_REGISTRY_LEDGER_EVALUATION.prompt.md` | Evaluate supplied registry rows under Hunter Logic Gate | `registry_evaluation_ledger[]`, `batch_warnings[]` |
| 05 | `05_OPERATOR_CHALLENGE.prompt.md` | Challenge merged ledger for false negatives and bad exclusions | `operator_challenge_gate`, `corrected_ledger_entries[]` |
| 06 | `06_FINAL_COMPILER.prompt.md` | Compile post-challenge ledger into compiler output | `compiler_output` |

## Stage 00 — Shared System Preamble

Purpose:

```text
Give every Gemini stage the same source firewall, public-footprint discipline, no-legal-advice boundary, and JSON-only output discipline.
```

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
- preserve artifact inventory and limitations
- do not browse/search/fetch
```

## Stage 02A — Canonical Target Profile

Input:

```text
source_bundle + target metadata
```

Output:

```text
company_profile wrapper containing target_profile_v2
```

Core rules:

```text
- output target_profile_v2, not company_profile_v1
- own identity, jurisdiction, entity type, market, product baseline, data touchpoints, Vault baseline candidates
- use all admitted docs only for identity/profile/contact/baseline extraction
- do not do feature mapping, legal-stack adequacy, registry evaluation, or Vault handoff
```

## Stage 02B — Product Function / Feature Inventory

Input:

```text
source_bundle + target_profile_v2 + registry_key vocabulary
```

Output:

```text
target_feature_profile wrapper containing feature_profile_v2
```

Core rules:

```text
- atomic feature/function is the unit
- feature_inventory[] is canonical
- product_feature_map[] must be empty in model output
- multiple CORE features are allowed
- every feature has feature-level data_provenance[]
- every archetype_code has matching archetype_provenance[]
- every surface_token has matching surface_provenance[]
- use registry key vocabulary, not threat rows/Hunter Trigger
- do not rewrite Stage 4 identity
- do not emit legal-stack review, registry statuses, Vault prefill, or handoff fields
```

## Stage 03 — Legal Stack + Data Provenance Navigation Layer

Input:

```text
source_bundle + target_profile_v2 + feature_profile_v2
```

Output:

```text
legal_stack_review wrapper containing legal_stack_review_v2
```

Canonical zones:

```text
6A legal_document_cartography
6B data_provenance_profile
stage7_navigation_index
```

Core rules:

```text
- Stage 6 is a navigation/indexing layer for Stage 7
- 6A maps legal/control documents, sections, headings, annexures, schedules, relationships, controls, mismatches, and limitations
- 6B maps one row per data flow using machine-readable data/privacy/control signals
- canonical 6A and 6B are quote-free
- use refs/IDs/source locators, not prose quotes
- do not emit candidate control gaps
- do not emit Hunter Trigger decisions
- do not emit registry final_status values
- do not emit DPDP/GDPR/CCPA compliance verdicts
- do not emit Vault prefill or handoff fields
```

## Stage 04 — Registry Ledger Evaluation

Input:

```text
source_bundle + target_profile_v2 + feature_profile_v2 + legal_stack_review + registry_rows[] + registry_key
```

Output:

```text
registry_batch_meta
registry_evaluation_ledger[]
batch_warnings[]
```

Core rules:

```text
- evaluate every supplied row in the invocation
- ledger length equals supplied batch row count
- backend later merges batches into the full ledger
- batch_warnings[] are strings only
- UNI rows are never skipped merely because of archetype mismatch
- final status is deterministic from gate/trigger/exclude logic
- Stage 6 maps are navigation handles only
- Stage 7 still reads the underlying source/document text line-by-line before applying Hunter Trigger logic
```

Forbidden Stage 7 shortcut:

```text
Stage 6 says not_visible -> automatically TRIGGERED
Stage 6 says visible -> automatically CONTROLLED
Stage 6 data profile has personal_data_visible -> automatically PRV threat triggered
Stage 6 legal stack has DPA visible -> automatically PRV threat controlled
```

## Stage 05 — Operator Challenge

Input:

```text
merged registry_evaluation_ledger[] + source_bundle + target_profile_v2 + feature_profile_v2 + legal_stack_review
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
- reopens only rows safely correctable from supplied material
```

## Stage 06 — Final Compiler

Input:

```text
post-challenge registry_evaluation_ledger[]
+ operator_challenge_gate
+ source_bundle
+ target_profile_v2
+ feature_profile_v2
+ legal_stack_review
+ registry row payload fields
```

Output:

```text
diligence_run
source_bundle_summary
target_profile_v2
feature_profile_v2
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
- compiler emits vault_confirmation_questions[] only
- compiler does not emit vault_prefill_suggestions, assembly_handoff, or handoff_envelope
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
| Stage 02A | `data/schemas/companyProfile.schema.json` |
| Stage 02B | `data/schemas/targetFeatureProfile.schema.json` |
| Stage 03 | `data/schemas/legalStackReview.schema.json` |
| Stage 04 | `data/schemas/registryLedger.schema.json` |
| Stage 05 | `data/schemas/operatorChallenge.schema.json` |
| Stage 06 | `data/schemas/compilerOutput.schema.json` |
| Final post-Node-5B object | `data/schemas/diligenceReport.schema.json` or successor final report schema |

## Mandatory disclaimer

Every report and payload must preserve this exact disclaimer:

```text
Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.
```

End of Diligence v2 Prompt Chain Index.
