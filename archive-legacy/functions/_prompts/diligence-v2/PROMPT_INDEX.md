# Diligence v2 Prompt Chain Index

## Status

This index governs the active Diligence Engine prompt chain under:

```text
functions/_prompts/diligence-v2/
```

The v2 chain uses Gemini-primary runtime prompts and deterministic backend assembly.

## Governing documents

Read these before editing any stage prompt:

```text
docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md
docs/contracts/DILIGENCE_CANONICAL_SPINE_v1.md
docs/contracts/STAGE4_STAGE5_CANON_FIELD_DICTIONARY_v1.md
docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md
docs/contracts/NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md
data/runtime/registry_key.runtime.json
data/runtime/registry.runtime.json
```

The controlling active Stage 6 spine is:

```text
docs/contracts/DILIGENCE_CANONICAL_SPINE_v1.md
```

The controlling active dictionary for non-Stage-6 field slices is:

```text
docs/contracts/DILIGENCE_CANON_FIELD_DICTIONARY_v1.md
```

If any older prompt/doc/schema conflicts with the active Stage 6 spine for Stage 6, the Stage 6 spine controls.

## Locked stage canon

```text
Stage 4 = target_profile_v2
Stage 5 = feature_profile_v2
Stage 5 canonical features = feature_inventory[]
Stage 6 = stage6_review_v1
Stage 6A = Legal Document Cartography
Stage 6B = Data Provenance
Stage 6I = Integrated Stage 6 handoff to Stage 7
Stage 6 role = stage7_navigation_index
product_feature_map[] = legacy compatibility only
primary_product = legacy language only
```

## Runtime dictionary slicing

The runtime prompt loader must append only the relevant dictionary blocks:

```text
company_profile                    -> UNIVERSAL + STAGE4
target_feature_profile             -> UNIVERSAL + STAGE5
stage6a_legal_document_cartography -> DILIGENCE_CANONICAL_SPINE_v1
stage6b_data_provenance            -> DILIGENCE_CANONICAL_SPINE_v1
registry_ledger_evaluation         -> UNIVERSAL + STAGE7_NAVIGATION
```

Do not append the full dictionary to every prompt.

## Pipeline ownership

```text
0.   Source Collector                                      client / browser / source runtime
0.5  Evidence Refiner                                      Gemini / runtime API
4.   Canonical Target Profile                              Gemini / runtime API
5.   Product Function / Feature Inventory                  Gemini / runtime API
6A.  Legal Document Cartography                            deterministic macro legal units + bounded semantic classification
6B.  Data Provenance                                       deterministic data-flow spine + bounded semantic classification
6I.  Integrated Stage 6 handoff to Stage 7                 disabled until rebuilt against Stage 6 canon
7.   Registry Ledger                                       Gemini / runtime API, batched
8.   Operator Challenge                                    Gemini / runtime API, merged ledger only
9.   Final Compiler                                        Gemini / runtime API
5B.  Deterministic Backend Assembler                       backend only, no model
```

Only collection runs without a model key. Every Gemini stage runs server-side.

## Active prompt files

| Stage | File | Job | Primary output |
|---|---|---|---|
| 00 | `00_SHARED_SYSTEM_PREAMBLE.prompt.md` | Shared doctrine, source firewall, no-legal-advice boundary, JSON output discipline | Injected system preamble |
| 01 | `01_EVIDENCE_REFINER.prompt.md` | Convert collected public material into admitted evidence | `source_bundle` |
| 02A | `02_COMPANY_PROFILE.prompt.md` | Canonical identity, jurisdiction, market, baseline Vault candidates | `company_profile` wrapper containing `target_profile_v2` |
| 02B | `02_TARGET_FEATURE_PROFILE.prompt.md` | Atomic feature/function inventory, data provenance, archetype/surface provenance | `target_feature_profile` wrapper containing `feature_profile_v2` |
| 03A | `03A_LEGAL_CARTOGRAPHY.prompt.md` | Canonical Stage 6A semantic classification over deterministic macro legal-unit seeds | `stage6_review` containing `stage6_review_v1` |
| 03B | `03B_DATA_PROVENANCE.prompt.md` | Canonical Stage 6B semantic classification over deterministic data-flow seeds | `stage6_review` containing `stage6_review_v1` |
| 04 | `04_REGISTRY_LEDGER_EVALUATION.prompt.md` | Evaluate supplied registry rows under Hunter Logic Gate | `registry_evaluation_ledger[]`, `batch_warnings[]` |
| 05 | `05_OPERATOR_CHALLENGE.prompt.md` | Challenge merged ledger for false negatives and bad exclusions | `operator_challenge_gate`, `corrected_ledger_entries[]` |
| 06 | `06_FINAL_COMPILER.prompt.md` | Compile post-challenge ledger into compiler output | `compiler_output` |

No retired Stage 6 prompt file is active prompt-chain authority.

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
