# PROMPT SOURCE EXTRACTION PACKETS v1

## 0. Status

- Phase: 2A.6
- Purpose: source extraction packets only
- GPT Runtime source: `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md`
- Allocation Matrix source: `docs/prompts/diligence-v2/PROMPT_ALLOCATION_MATRIX_v1.md`
- No final prompt files created
- No runtime/schema/UI changes

## 1. Extraction Thesis

The allocation matrix routes runtime sections. This file extracts the actual prompt source blocks that Phase 2B must use when drafting the seven surgical prompts. Phase 2B must draft prompts from these packets, not directly from the monolith or allocation matrix.

The purpose is to prevent compression, paraphrase drift, softened legal boundaries, weakened evidence rules, vague Hunter logic, or accidental re-import of obsolete monolith behavior. Codex remains a file writer/checker. It should not independently redesign prompt doctrine or substitute generic wording for the runtime's sharper operating rules.

## 2. Common Extraction Rules

- Preserve reasoning logic, not obsolete architecture.
- Use exact or near-verbatim language for the legal firewall, evidence firewall, absence mandate, False Belief Formula, Hunter Logic Gate, EXCLUDE_IF/HER_001, Operator Challenge, and no-truncation.
- Patch old browsing into the Source Collector/Jina boundary.
- Patch model HTML into the `report_data`/React boundary.
- Patch model Vault prefill into the Node 5B boundary.
- Patch old schemas into regenerated schema wrapper keys.
- Do not paste full schemas or the full migration map into final prompts.
- Final prompts use schema summaries only: wrapper key, required top-level fields, and acceptance gates.
- Where source wording is too long, preserve the operating structure NEAR_VERBATIM and state the architecture patch directly.

## 3. Shared Patch Register for All Packets

| Patch ID | Applies where | Old runtime wording/behavior | Phase 2B patch |
|---|---|---|---|
| P-001 | all prompts, especially 01 | Model browses/searches/fetches/crawls. | No prompt browsing; Source Collector/Jina only. |
| P-002 | 01, 04, 06 | Search snippets can enter Evidence Buffer. | Search/grounding candidates are DISCOVERY_ONLY unless admitted by Source Collector/Refiner. |
| P-003 | 01 and shared input notes | `source_mode` is `url | text | url_plus_text`. | Use `url | manual_urls | text | url_plus_text`. |
| P-004 | 01, 04, 06 | Raw full scrape text can become final evidence payload. | Raw full scrape is active-run only; final output uses excerpts, hash, URL, zone, artifact_class, status, admission/provenance. |
| P-005 | 06 | Model emits HTML report. | Compiler emits `report_data`; React renders. |
| P-006 | all | Terminal output order controls execution. | Terminal order retired; orchestrator stages and validators control execution. |
| P-007 | 06 | Model emits `vault_prefill_suggestions`. | Node 5B derives prefill; compiler emits `vault_confirmation_questions[]`. |
| P-008 | 06 / Node 5B notes | Old/stale Vault fields. | Vault Canonical Map controls exact fields and group placement. |
| P-009 | 06 | Compiler mixes TRIGGERED, CONTROLLED, and INSUFFICIENT_EVIDENCE into `findings[]`. | `findings[]` = TRIGGERED only; `controlled_rows[]` = CONTROLLED; `insufficient_evidence_rows[]` = INSUFFICIENT_EVIDENCE. |
| P-010 | 04, 05, 06 | Registry count may be fixed/current 98. | Registry count is dynamic and supplied as `registry_count_loaded`. |
| P-011 | 06 / Node 5B notes | HITL/human_review may appear as Vault field. | Human review/HITL is diagnostic only, never a Vault field. |
| P-012 | 04 | HER_001 loaded from old rules file. | HER_001 is baked into Stage 04 prompt as fixed rule text. |
| P-013 | QA for all prompts | Forbidden leakage checked by crude raw grep. | Use contextual leakage checks, not crude raw grep. |
| P-014 | Phase 2B drafting | Draft from allocation matrix directly. | Draft from extraction packets; allocation matrix controls routing/boundaries. |

## 4. Contextual Forbidden Leakage Check Rule

Forbidden leakage checks must be contextual.

- The word "browse" is allowed only in negative instructions such as "do not browse" or "no browsing by model." It fails only if the prompt tells the model to browse, search, fetch, crawl, click, inspect URLs, or retrieve pages as an action.
- "HTML" is allowed only in negative instructions such as "do not emit HTML." It fails if the prompt asks the model to create HTML.
- "TRIGGERED" may appear in Evidence Refiner only as a forbidden-output warning. It fails if Evidence Refiner is instructed to classify threats.
- "`vault_prefill_suggestions`" may appear only as a forbidden-output warning. It fails if the compiler is instructed to emit it.
- "98" fails only if used as registry count or schema constraint. Historical mention in docs is not enough.
- "search snippets" may appear only as rejected or DISCOVERY_ONLY candidates. It fails if snippets are admitted as evidence.

## 5. Packet 00 - Shared System Preamble

### 5.1 Stage job

Common identity, legal firewall, evidence firewall, anti-invention, no-browse, no-HTML, no-Vault-field doctrine for all prompts.

### 5.2 Runtime sections used

M01-A1, M01-A2, M01-A3, M01-A4, M01-A5, M01-C2, M01-C4, M01-D1, M01-D2, M01-D3, M01-D4, M01-D5, M01-E1 patched, M02-A4, M12-A1.

### 5.3 Extracted blocks to preserve

| Source section ID | Preservation level | Extracted source block / extracted rule | Phase 2B patch note |
|---|---|---|---|
| M01-A1 | NEAR_VERBATIM | "You are The Interface... Internal Logic Layer: You operate strictly as a deterministic Diligence Engine and Boolean Logic Gate (internally referred to as the Hunter Logic Gate)." | Keep identity, but remove monolith terminal-output assumptions. |
| M01-A2 | NEAR_VERBATIM | Role boundary: do not act as Sales Scanner, Admin, Architect, or Copywriter; do not write cold emails, sales strategy, or old Spear Report; strictly public-footprint diligence and document-routing system. | Add that prompts do not render reports, assemble Vault prefill, or execute source collection. |
| M01-A3 | VERBATIM | "You are a forensic machine, not a legal advisor. You do not provide legal advice, legal opinions, compliance conclusions, liability conclusions, enforceability conclusions, or lawyer-client services." | Preserve in shared preamble and compiler. |
| M01-A4 | VERBATIM | Allowed language: "not visible in reviewed public footprint", "not publicly verifiable", "no public artifact found", "review-ready route", "requires qualified legal review". Forbidden language: "illegal", "non-compliant", "liable", "does not exist", "unenforceable", "confirmed violation" unless verbatim quoting external source. | Phrase as public-footprint/legal-architecture language firewall. |
| M01-A5 | NEAR_VERBATIM | Mandatory disclaimer: "Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use." | Patch from "final HTML report" to `disclaimer` field and React rendering. |
| M01-C2 | VERBATIM | "Zero Signal Context... All prior Signal-based routing is deprecated." | Forbid `signal_context` and sales/prospect routing in all prompts. |
| M01-C4 | NEAR_VERBATIM | Public-only rule: do not ask for private documents, MSA drafts, confidential contracts, credentials, or logins. | Source Collector/orchestrator handles input warnings; prompts assume public/admitted material. |
| M01-D1 | VERBATIM | "FIRST-PARTY & PASTED TEXT ONLY": restricted to target company's own domain or explicitly user-pasted public material. | Patch to "admitted source bundle only"; no model fetching. |
| M01-D2 | NEAR_VERBATIM | Hosted governance exception requires: linked from target footprint or company-controlled; company-specific text; recognized governance artifact. Citation by artifact type, never host brand. | Source Collector/Refiner classify; all later prompts trust admitted basis. |
| M01-D3 | VERBATIM | Kill list: do not reference, retrieve, or consider Crunchbase, PitchBook, TechCrunch, press summaries, investor descriptions, review sites, unverified third-party summaries, or prior model memory. | Retain as evidence exclusion, not as browsing command. |
| M01-D4 | VERBATIM | Absence mandate: absence of required language is evidence of structural governance gap; public-footprint defensibility, not courtroom certainty; do not defeat absence because mechanism might exist privately; absence only after active search/review/classification. | Later prompts require `absence_basis`; Source Collector/Refiner provide search/review status. |
| M01-D5 | VERBATIM | Zero-inference: do not infer capabilities, compliance, or missing features from industry standards, category, or speculation; if not explicitly stated in admitted evidence buffer, it does not exist for the scan. | Apply to all stage inputs. |
| M01-E2 | NEAR_VERBATIM | Dynamic registry/full-ledger principle: compute active row count and visible ledger; summary/count statement is not substitute. | Shared doctrine only; Stage 04 owns implementation. |
| M12-A1 | NEAR_VERBATIM | No-truncation: no emitted array, object, or text block may be truncated; do not stop after 5; no `...`; filtration happens in UI, not prompt. | Use as no-cap/no-top-N rule; React filters view only. |

### 5.4 Deleted/retired wording

- HTML-only disclaimer wording.
- Old four/five-part terminal sequence.
- Old knowledge-file authority hierarchy (`REGISTRY_KEY_v3_0.md`, `HUNTER_ENGINE_RULES`, `vault.js`) as prompt authority.
- Old Groq/provider-specific phrasing if present.
- Any prompt-native browsing/search/fetch language.
- Any model-generated Vault prefill instruction.

### 5.5 Phase 2B instruction

Build `00_SHARED_SYSTEM_PREAMBLE.prompt.md` from the extracted identity, legal firewall, evidence firewall, absence mandate, zero-inference, no-browse, no-HTML, no-Vault-prefill, and no-truncation blocks. Keep it concise and reusable; do not paste the full monolith or schema text.

### 5.6 Acceptance gates

- Contains The Interface / Diligence Engine identity.
- Contains no legal advice/certification firewall and allowed/forbidden language.
- Contains admitted-evidence-only, kill list, absence mandate, zero-inference.
- Contains no model browsing and no HTML/Vault prefill boundaries.
- Contains no final prompt output wrapper.

## 6. Packet 01 - Evidence Refiner

### 6.1 Stage job

Convert Source Collector output / `raw_zoned_footprint` into `source_bundle`. No legal reasoning.

### 6.2 Runtime sections used

M01-D1 through M01-D5, M02-B2, M02-C1 through M02-C3, M06-B1, M06-E1, M06-F1, M06-G1.

### 6.3 Extracted blocks to preserve

| Source section ID | Preservation level | Extracted source block / extracted rule | Phase 2B patch note |
|---|---|---|---|
| M02-B2 | NEAR_VERBATIM | Evidence Buffer entry discipline: every admitted piece tracks `source_id`, `source_url`, `source_type`, `ingestion_method`, `artifact_type`, evidence text/excerpt, `evidence_scope`, and `first_party_basis`. | Replace raw `evidence_text` persistence with extracted excerpt/hash/provenance in final source bundle. |
| M02-C1 | NEAR_VERBATIM | Artifact inventory checkpoint: immediately after evidence collection and before threat logic, compile `artifact_inventory[]`. Every required surface has artifact type/class, status, source URL, ingestion method, summary, absence basis, and warning. | Evidence Refiner emits inventory; it does not evaluate registry threats. |
| M01-D1 | VERBATIM | First-party/pasted-only rule: target domain or explicitly user-pasted public material only. | Apply to admitted source classification. |
| M01-D2/M06-B1 | NEAR_VERBATIM | Hosted governance exception: linked/company-controlled, company-specific, recognized governance artifact. | Refiner may classify hosted artifacts admitted by Source Collector; later prompts cite artifact type. |
| M01-D4/M06-E1 | NEAR_VERBATIM | Absence basis: absence is evidence only after relevant artifact, clause, or governance surface has been actively searched, ingested, reviewed, or classified as absent. | Absence basis must be structured; failure to fetch is not absence unless status explains it. |
| M06-F1 | LOGIC_ONLY | Graceful halt/limitations: do not fabricate data; use limitations for sparse or blocked footprints. | Runtime Orchestrator handles abort/proceed; Refiner emits limitations. |
| M06-G1 | LOGIC_ONLY | Minimum threshold: proceed with warnings if homepage/product content or enough governance artifacts exist; use `MIN_THRESHOLD_PROCEED` where thin. | Prompt classifies warning; does not decide full run flow alone. |
| M02-A3/M06-A2 | LOGIC_ONLY | Pasted/manual extraction boundary: pasted public material is ingested directly; URL modes are fetched before prompt. | Add `manual_urls`; Source Collector fetches, Refiner normalizes. |
| Contract patch | LOGIC_ONLY | Raw text vs excerpt/hash boundary: full raw scrape is active-run material. | Refiner final output uses excerpts, hashes, source URL, zone, artifact class, limitations, status, admission status. |

### 6.4 Architecture patches

- No model browsing.
- No search snippets as evidence.
- Source modes include `manual_urls`.
- Jina/Source Collector performs fetch before this prompt.
- Evidence Refiner classifies and normalizes admitted material only.

### 6.5 Schema boundary

Wrapper: `source_bundle`

Schema: `sourceBundle.schema.json`

Required top-level fields summary: `run_id`, `source_mode`, `target_input`, `source_review`, `discovery_candidates`, `artifact_inventory`, `evidence_buffer`, `limitations`.

### 6.6 Forbidden leakage

- TRIGGERED / CONTROLLED / NOT_APPLICABLE as threat classifications.
- Legal risk conclusions.
- Registry evaluation.
- Findings.
- Vault fields.
- Report prose.
- Model browsing/searching.

### 6.7 Acceptance gates

- Emits source bundle only.
- Every admitted evidence item has first-party basis.
- Discovery candidates stay separate from admitted evidence.
- Absent artifacts carry absence basis or limitation.
- No threat/legal findings appear except as forbidden-output warnings.

## 7. Packet 02 - Target Feature Profile

### 7.1 Stage job

Extract `target_profile`, `primary_product`, `product_feature_map`, `raw_feature_candidates`, `feature_map_scratchpad`, and `limitations`.

### 7.2 Runtime sections used

M03-A1 through M03-C1, M07-A1 through M07-F1, M08-A1 through M08-D1.

### 7.3 Extracted blocks to preserve

| Source section ID | Preservation level | Extracted source block / extracted rule | Phase 2B patch note |
|---|---|---|---|
| M07-A2 | NEAR_VERBATIM | Company/legal entity hierarchy: prefer Terms preamble/corporate identification, DPA parties block, Privacy Policy header/company row, landing page footer. | Unknowns stay unknown; no prior knowledge fill. |
| M07-A1 | NEAR_VERBATIM | Website/legal entity/HQ extraction from admitted evidence. | Output through `target_profile`. |
| M03-C1/M07-A1 | LOGIC_ONLY | HQ jurisdiction and authority cues: use regional cues in evidence such as corporate address, EU data center choice, GDPR/DPDP references. | No legal conclusions. |
| M07-A1 | LOGIC_ONLY | Actual processing location/data sovereignty signature: separate declared HQ from visible processing/data location. | If internal/unknown, emit limitation; Node 5B may ask confirmation later. |
| M07-B1 | NEAR_VERBATIM | Primary claim: extract the public promise from the target footprint, not from memory. | Use evidence quote/source. |
| M07-C1 | NEAR_VERBATIM | Primary product six fields: product name, user, function, mechanism, agent actor, agent brand name. | Emit as `primary_product`; maintain coffee-test clarity. |
| M07-C1 | NEAR_VERBATIM | Coffee-test standard: product description must explain what the product actually does mechanically, not just "AI platform." | Include as quality gate. |
| M07-D1 | VERBATIM | Prior knowledge firewall: no prior model memory, third-party press, investor databases, or unverified context. | Repeat in Stage 02. |
| M07-E1 | LOGIC_ONLY | Governance surface isolation: product/profile extraction must not become legal-stack conclusions. | Explicitly forbid `legal_stack`. |
| M03-A1 | NEAR_VERBATIM | Archetype vocabulary: UNI, DOE, JDG, CMP, CRT, RDR, ORC, TRN, SHD, OPT, MOV definitions. | Use compact definitions and registry key if injected. |
| M03-A2/M08-B1 | NEAR_VERBATIM | Archetype guards: mechanical reality over marketing; e.g., enabling an agent is not being the agent, single model call is not ORC, raw transcription is not biometric capture. | Preserve guard logic, not every illustrative phrase if prompt bloat risk. |
| M03-B1 | NEAR_VERBATIM | Surface vocabulary: Consumer-Public, Enterprise-Private, PII, Employment, Sensitive/Biometric, Financial, Content&IP, Safety&Physical, Infrastructure, Minors. | Emit as controlled tokens. |
| M08-A1 | NEAR_VERBATIM | Multiplicity/no-cap: features may take multiple archetypes/surfaces; do not cap or top-N product features. | Output arrays. |
| M08-C2 | VERBATIM | CORE vs SECONDARY: feature role must be strictly `"CORE"` or `"SECONDARY"`. | Use schema enum. |
| M08-C3 | VERBATIM | Evidence absolute constraint: feature source URL must be first-party or qualifying hosted documentation; if unavailable, feature entry is invalid and must not be emitted. | Every feature needs quote/source. |
| M08-D1 | LOGIC_ONLY | Feature map scratchpad: preserve classification reasoning and candidate validation. | Use `raw_feature_candidates` and `feature_map_scratchpad`. |

### 7.4 Schema boundary

Wrapper: `target_feature_profile`

Schema: `targetFeatureProfile.schema.json`

Required top-level fields summary: `target_profile`, `primary_product`, `product_feature_map`, `raw_feature_candidates`, `feature_map_scratchpad`, `limitations`.

### 7.5 Forbidden leakage

- `legal_stack`
- Registry `final_status`
- Findings
- `report_data`
- Vault prefill
- Legal conclusions

### 7.6 Acceptance gates

- Every feature has evidence quote/source.
- Product output is feature-level, not company-blob-level.
- Primary product has six fields.
- Archetype and surface values are controlled vocabulary.
- No legal stack, registry statuses, or report data.

## 8. Packet 03 - Legal Stack Review

### 8.1 Stage job

Assess exactly five public legal documents and produce public-footprint redline/mismatch output.

### 8.2 Runtime sections used

M02-C2, M09-A1 through M09-G1, plus M01-A3, M01-D4, M01-D5.

### 8.3 Extracted blocks to preserve

| Source section ID | Preservation level | Extracted source block / extracted rule | Phase 2B patch note |
|---|---|---|---|
| M02-C2/M09-B1 | VERBATIM | Exactly five core document types feed legal stack: ToS, Privacy Policy, DPA, AUP, SLA. | Missing docs still get entries; governance surfaces may support but not expand five core entries. |
| M09-A1 | NEAR_VERBATIM | Artifact-inventory-only rule: use existing Evidence Buffer and `artifact_inventory[]`; do not execute new search queries. | Stage 03 consumes source bundle only. |
| M09-C1 | NEAR_VERBATIM | Covers extraction: list what the document visibly covers, grounded in artifact text; if absent, coverage is null/not found. | Output through `legal_stack[].covers`. |
| M09-D1 | NEAR_VERBATIM | Misses extraction must name what a founder could think is covered that is not. Vague misses are invalid. | Output through `misses`, redline, assessment. |
| M09-D1 | NEAR_VERBATIM | False Belief Formula: "[Document] does not cover [specific gap] - a founder reading it would think [false belief], but [product behavior] creates [uncovered governance exposure]." | Preserve founder-belief vs actual-document-coverage contrast; do not turn into legal conclusion. |
| M09-E1 | NEAR_VERBATIM | Document redline/mismatch types: compare claims, quotes, absences, and product reality; identify mismatch rather than final liability. | Output through `document_stack_redline[]`. |
| M09-F1 | LOGIC_ONLY | Legal stack assessment scratchpad: per-document status, source URL, absence basis, covers, misses, false belief, mismatch notes. | Emit as `legal_stack_assessment[]`. |
| M09-G1 | LOGIC_ONLY | Terminal validation: legal_stack must contain exactly five entries before registry. | Move to schema/orchestrator acceptance gate. |
| M01-D4/M01-D5 | VERBATIM | Public-footprint caveats: absence matters only after review; no inference from private documents or industry assumptions. | Maintain no legal advice boundary. |

### 8.4 Schema boundary

Wrapper: `legal_stack_review`

Schema: `legalStackReview.schema.json`

Required top-level fields summary: `legal_stack`, `document_stack_redline`, `document_stack_synthesis`, `legal_stack_assessment`, `limitations`.

### 8.5 Forbidden leakage

- Fresh search/browse.
- Registry threat `final_status`.
- Final findings.
- Vault prefill.
- HTML report.
- Legal advice/certification.

### 8.6 Acceptance gates

- Exactly five document types.
- Missing docs represented with status and absence basis.
- Covers/misses are evidence-bound.
- False Belief Formula remains near-verbatim.
- No registry statuses, findings, HTML, or Vault prefill.

## 9. Packet 04 - Registry Ledger Evaluation

### 9.1 Stage job

Evaluate every supplied registry batch row using Hunter Logic Gate and emit registry ledger rows.

### 9.2 Runtime sections used

M01-E2, M01-E3, M01-E4, M03-A1 through M03-C1, M05-A1 through M05-F1, M10-A1, M10-C1, M10-D1, M10-G1.

### 9.3 Extracted blocks to preserve

| Source section ID | Preservation level | Extracted source block / extracted rule | Phase 2B patch note |
|---|---|---|---|
| M01-E2/M05-A1 | NEAR_VERBATIM | Dynamic registry count and every-row rule: compute active row count; summary/count statement is not substitute; every active row must produce one visible evaluation. | Use injected `registry_count_loaded`; no hardcoded 98. |
| M05-A1 | NEAR_VERBATIM | No partial registry state: do not skip rows, collapse rows, or evaluate only likely rows. | Batch output must return one row per input row. |
| M05-B1 | NEAR_VERBATIM | Hunter Logic Gate as row-by-row sequence: load row, test archetype gate, test surface gate, evaluate authority relevance, parse Hunter_Trigger, evaluate conditions, evaluate TRIGGER_IF, apply row EXCLUDE_IF, apply universal EXCLUDE_IF/HER_001, assign final status, record evidence/feature refs, write ledger reasoning. | Registry rows are injected as `registry_batch`; do not load knowledge files. |
| M05-C1 | NEAR_VERBATIM | Hunter_Trigger parsing syntax: `CONDITION_1 ... | CONDITION_2 ... | TRIGGER_IF ... | EXCLUDE_IF ...`; every entry has at least one condition, exactly one TRIGGER_IF, exactly one EXCLUDE_IF; evaluate AND/OR/AT_LEAST_1_OF explicitly. | Store condition-level output in schema. |
| M05-D1/M01-E3 | VERBATIM | Five states: TRIGGERED, CONTROLLED, NOT_TRIGGERED, NOT_APPLICABLE, INSUFFICIENT_EVIDENCE, each with distinct semantics. | Compiler later splits statuses; Stage 04 only assigns row statuses. |
| M05-E1/M01-E4 | VERBATIM | EXCLUDE_IF/HER_001: default all EXCLUDE_IF evaluations to FALSE; only switch TRUE if explicit written proof in Evidence Buffer shows the specific neutralizing control exists; do not give benefit of doubt; lack of proof leaves EXCLUDE_IF FALSE. | Bake HER_001 into prompt. |
| M05-F1/M10-A1 | NEAR_VERBATIM | Condition-level ledger: each row includes conditions, trigger_if_result, exclude_if_result, final_status, feature_refs, evidence_ref, reasoning_summary. | Align to `registryLedger.schema.json`. |
| M10-C1 | NEAR_VERBATIM | Proof mandate: if required language/artifact is not found in reviewed public first-party or qualifying hosted governance footprint, absence-based condition evaluates TRUE; use "NULL - absence of required clause" or "NULL - document entirely absent" style proof. | Requires absence_basis from source/legal stack. |
| M10-C1 | NEAR_VERBATIM | Public consent-flow proof rule: distinguish contract text asserting mechanism from public implementation proof showing the mechanism; legal clause alone may be insufficient for product-flow threats. | Keep in Registry prompt. |
| M10-D1 | NEAR_VERBATIM | Feature_refs: use exact `feature_id`, `GLOBAL`, `MULTI`, or `UNKNOWN` only after rechecking product_feature_map; do not invent feature refs. | Backend can validate references. |
| M10-G1 | VERBATIM | Third-party/prior firewall: third-party summaries, investor descriptions, press coverage, database text, and prior model knowledge may not satisfy any Trigger or EXCLUDE_IF logic. | Applies to every ledger row. |

### 9.4 Architecture patches

- Registry rows are injected as `registry_batch`.
- Do not load knowledge files.
- Use dynamic `registry_count_loaded`; no hardcoded 98.
- Output must be batch-safe.
- No summary substitute.

### 9.5 Schema boundary

Wrapper: `registry_evaluation_ledger` or `registry_batch_evaluation`

Schema: `registryLedger.schema.json`

Required top-level fields summary: `registry_batch_meta`, `registry_evaluation_ledger`, `batch_warnings`.

### 9.6 Forbidden leakage

- Top-N risks only.
- Skipped rows.
- Report prose.
- HTML.
- Vault prefill.
- Sales/prospect fields.
- Legal advice.

### 9.7 Acceptance gates

- One output row per input registry row.
- Five-state status only.
- HER_001 present as fixed rule.
- Every row has condition-level reasoning, evidence_ref, and feature_refs.
- No fixed 98, no summary-only output.

## 10. Packet 05 - Operator Challenge

### 10.1 Stage job

Adversarially review merged ledger; reopen missed/weak rows; return challenge result and corrections.

### 10.2 Runtime sections used

M05-G1, M10-B1, M10-E1, M10-H1.

### 10.3 Extracted blocks to preserve

| Source section ID | Preservation level | Extracted source block / extracted rule | Phase 2B patch note |
|---|---|---|---|
| M05-G1/M10-E1 | NEAR_VERBATIM | Operator Challenge Gate is mandatory; runs immediately after full registry ledger and before compiler; purpose is verifying every active registry row was applied against the full footprint, not merely counted. | Separate Stage 05 prompt over merged ledger. |
| M10-E1 | NEAR_VERBATIM | Output result includes completed, PASS/REOPENED, registry counts, reopened_rows, high_risk_checks, notes, and corrected ledger entries when reopened. | Align to `operatorChallenge.schema.json`; no terminal log block. |
| M10-E1 | NEAR_VERBATIM | False negative reopening: reopen `NOT_TRIGGERED` rows where reason was "not observed", "not visible", or "document not found" if row is absence-based under public-footprint standard. | Corrections reference existing threat IDs only. |
| M10-B1 | NEAR_VERBATIM | Lethality mandate/undercount challenge: do not undercount triggered gaps by giving benefit of doubt; low trigger count under high-risk footprint requires visible lethality recheck via `high_risk_checks`. | Challenge prompt owns high-risk check logic. |
| M05-E1/M10-C1 | NEAR_VERBATIM | Overbroad exclusion challenge: EXCLUDE_IF can defeat row only with explicit written proof of specific neutralizing control. | If correction changes exclusion, cite basis. |
| M10-E1 | LOGIC_ONLY | Insufficient evidence challenge and universal threat checks: check whether sparse evidence was misused to avoid absence-based triggers. | No new evidence; use ledger/source inputs. |
| M10-D1 | LOGIC_ONLY | Feature reference checks: ensure feature refs resolve to product_feature_map or proper GLOBAL/MULTI/UNKNOWN. | Return corrected_ledger_entries only. |
| M10-H1 | LOGIC_ONLY | Validation before compiler: ledger counts, condition-level reasoning, EXCLUDE_IF default, challenge PASS or reopened/corrected. | Orchestrator/validation gate. |

### 10.4 Schema boundary

Wrapper: `operator_challenge_gate` + `corrected_ledger_entries`

Schema: `operatorChallenge.schema.json`

Required top-level fields summary: `operator_challenge_gate`, `corrected_ledger_entries`.

### 10.5 Forbidden leakage

- New browsing/search.
- New source invention.
- Report writing.
- Vault prefill.
- HTML.
- Changing schemas.

### 10.6 Acceptance gates

- PASS or REOPENED.
- If REOPENED, corrections reference existing threat IDs.
- No new evidence introduced.
- High-risk checks are present.
- Compiler cannot run until challenge output is complete.

## 11. Packet 06 - Final Compiler

### 11.1 Stage job

Compile final `diligence_compiler_output` from post-challenge ledger and prior stage outputs.

### 11.2 Runtime sections used

M03-D1, M10-F1, M11-A1 through M11-I1, M12-A1, M12-D1, M12-E1, M12-F1.

### 11.3 Extracted blocks to preserve

| Source section ID | Preservation level | Extracted source block / extracted rule | Phase 2B patch note |
|---|---|---|---|
| M11-A1/M10-F1 | LOGIC_ONLY | Findings filter: compile only after Operator Challenge and locked counts; old runtime included TRIGGERED, CONTROLLED, INSUFFICIENT_EVIDENCE in findings. | Patch split: `findings[]` TRIGGERED only, controlled/insufficient separate. |
| M11-B1 | NEAR_VERBATIM | Hydrated findings compiler: old skinny `true_gaps[]` is forbidden; every finding must carry threat_id/name/status, pain fields, lane, archetype, surfaces, authority, linked_feature_ids, evidence, trigger_evaluation, registry_payload, routes, Vault dependencies. | Align fields to `diligenceReport.schema.json`; preserve hydration. |
| M11-B1 | NEAR_VERBATIM | No skinny true_gaps: final findings must be fully hydrated, not nine-field summaries. | Forbid `true_gaps`. |
| M03-D1/M11-C1 | VERBATIM | Pain category derivation: T1 = Existential, T2 = Uncapped Money, T3 = Deal Death, T4 = Regulatory Heat, T5 = Friction; do not invent categories or alter pain_tier. | Compiler derives display category from registry tier. |
| M11-D1 | NEAR_VERBATIM | Evidence sub-object: source_url, artifact_type, proof_citation, evidence_mode; modes include QUOTE, DOCUMENT_ABSENCE, CLAUSE_ABSENCE, PUBLIC_PROOF_ABSENCE. | Use admitted evidence refs/excerpts; no raw full scrape. |
| M11-E1 | NEAR_VERBATIM | trigger_evaluation: conditions_passed, conditions_failed, trigger_if_result, exclude_if_result, exclude_if_basis. | Copy from post-challenge ledger; do not recompute. |
| M11-G1 | LOGIC_ONLY | Global synthesis check: registry entries evaluated, findings counts, tier counts, legal_stack doc counts, redline count, prior knowledge used = NO, Operator Challenge PASS/REOPENED. | Emit structured `technical_audit_log`, not terminal block. |
| M11-H1 | VERBATIM | Prior knowledge firewall: prior model memory, press, investor directories, external context may not populate Module XII output fields; contaminated fields invalid and must be rebuilt from first-party Evidence Buffer. | Apply to all compiler fields. |
| M12-A1/M11-I1 | NEAR_VERBATIM | No-truncation: no `...`, no stopping after 5; if 30 findings then 30 fully hydrated JSON objects; if 4 product features then all 4 emitted. | Counts validated against ledger/status arrays; React filters only. |
| M12-E1 | LOGIC_ONLY | Technical audit log/warnings: limitations such as sparse_footprint, no_governance artifacts, MIN_THRESHOLD_PROCEED, blocked/failure states. | Refiner emits source limitations; compiler includes relevant audit summary. |
| M12-F1/M01-A5 | NEAR_VERBATIM | Disclaimer must terminate/appear in final output as public demo/no legal advice. | Emit `disclaimer` field, not HTML terminal text. |
| M11-F1 | LOGIC_ONLY | Assembly route intelligence: old runtime maps findings into assembly route and Vault dependencies. | Compiler may emit `assembly_route` and `vault_confirmation_questions`; Node 5B does prefill/handoff. |
| M11-F1 | RETIRED | Old Vault prefill logic: model populates `vault_prefill_suggestions{}` across baseline, architecture, archetypes, compliance. | Retire as prompt behavior; Node 5B owns deterministic prefill. |

### 11.4 Architecture patches

- `findings[]` = TRIGGERED only.
- `controlled_rows[]` = CONTROLLED.
- `insufficient_evidence_rows[]` = INSUFFICIENT_EVIDENCE.
- Compiler emits `report_data`, not HTML.
- Compiler emits `vault_confirmation_questions`, not `vault_prefill_suggestions`.
- Node 5B handles Vault prefill and final Assembly handoff.
- React handles rendering.

### 11.5 Schema boundary

Wrapper: `diligence_compiler_output`

Schema: `diligenceReport.schema.json`

Required top-level fields summary: `diligence_run`, `source_bundle_summary`, `target_profile`, `primary_product`, `product_feature_map`, `legal_stack`, `document_stack_redline`, `threat_registry_summary`, `feature_to_threat_matrix`, `findings`, `controlled_rows`, `insufficient_evidence_rows`, `report_data`, `technical_audit_log`, `assembly_route`, `assembly_handoff`, `handoff_envelope`, `disclaimer`.

### 11.6 Forbidden leakage

- HTML output.
- `vault_prefill_suggestions`.
- Invented Vault fields.
- Model-finalized Assembly handoff.
- Top-N-only findings.
- `true_gaps`.
- `sales_viability`.
- `signal_context`.
- `ghost_protection_profile`.
- `prospect_meta`.

### 11.7 Acceptance gates

- No HTML.
- No `vault_prefill_suggestions`.
- No stale sales/prospect fields.
- `findings[]`, `controlled_rows[]`, `insufficient_evidence_rows[]` match post-challenge ledger counts.
- No truncation or ellipses.
- `report_data` present.
- `vault_confirmation_questions[]` may exist, but prefill is absent.

## 12. Retired Source Blocks

| Source section ID | Retired behavior | Why retired | Replacement owner |
|---|---|---|---|
| M02-B1, M06-C1, M06-D1 | Model browsing/search/fetch/crawl. | Gemini prompts reason over admitted evidence; Source Collector owns transport. | Phase 3 Source Collector. |
| M02-B3, M06-E1 | Search snippets as evidence. | Search/grounding is DISCOVERY_ONLY. | Source Collector/Refiner admission flow. |
| M01-B1, M12-B1 | Monolithic terminal output order. | Runtime is staged and schema-validated. | Runtime Orchestrator. |
| M12-C1 | Model HTML output. | React renders from `report_data`. | React Renderer. |
| M11-F1, M12-F1 | Model-generated Vault prefill. | Node 5B derives deterministic Vault prefill. | Node 5B Backend Assembler. |
| M04-G1, M11-F1 | Stale Vault fields and old group placement. | Vault Canonical Map controls exact fields. | Node 5B + Schema Validation. |
| M01-E1 | Old knowledge-file authority hierarchy. | Current Contract Spine/Vault Map/schemas/migration map control. | Shared preamble current authority note. |
| Old Groq prompt docs | Provider-specific assumptions. | Gemini/provider-agnostic architecture controls. | Contract Spine. |
| M01-C2, M12-D1 | Old sales/prospect/signal fields. | Deprecated and forbidden. | None. |
| M05-A1 references to current row counts | Hardcoded registry count if present. | Active loaded row count is dynamic. | Runtime Orchestrator + Validation. |

## 13. Phase 2B Usage Instructions

- Phase 2B must build one prompt at a time.
- For each prompt, create a Prompt Surgery Packet from this extraction file.
- Do not ask Codex to write all prompts in one pass.
- Codex must copy approved prompt text into the target file and run checks.
- The extraction packets control preserved wording.
- The allocation matrix controls routing and forbidden boundaries.
- The schemas control output shape.
- The Runtime Migration Map controls architecture patches when a runtime source block conflicts with the spine.

## 14. Phase 2B Contextual Check List

| Prompt | Required source packets | Required preserved blocks | Required schema wrapper | Contextual forbidden leakage checks | Acceptance gate |
|---|---|---|---|---|---|
| 00_SHARED_SYSTEM_PREAMBLE | Packet 00 | Identity, legal firewall, evidence firewall, absence, zero-inference, no-truncation. | none | "browse", "HTML", "vault_prefill" allowed only as negative boundary. | Shared block only; no stage output. |
| 01_EVIDENCE_REFINER | Packet 01 + common patches | Evidence Buffer discipline, artifact inventory, hosted governance, absence basis. | `source_bundle` | `TRIGGERED`/`CONTROLLED` only as forbidden warnings; no model fetch action. | Source bundle only. |
| 02_TARGET_FEATURE_PROFILE | Packet 02 | Target hierarchy, product six fields, archetype guards, surface vocab, no-cap feature map. | `target_feature_profile` | No legal_stack/final_status/findings/report_data/Vault prefill as outputs. | Every feature has evidence. |
| 03_LEGAL_STACK_REVIEW | Packet 03 | Exactly five docs, artifact-inventory-only, False Belief Formula, redline. | `legal_stack_review` | "browse" only negative; no registry final_status/finding output. | Five document types exactly. |
| 04_REGISTRY_LEDGER_EVALUATION | Packet 04 | Hunter Logic Gate, Hunter_Trigger parsing, five states, EXCLUDE_IF/HER_001. | `registry_evaluation_ledger` | "98" fails only as fixed count; no report prose/top-N. | One row per input row. |
| 05_OPERATOR_CHALLENGE | Packet 05 | Mandatory challenge, false-negative reopening, lethality/high-risk checks. | `operator_challenge_gate` | No new browsing/source invention/report writing. | PASS or REOPENED with valid corrections. |
| 06_FINAL_COMPILER | Packet 06 | Hydrated findings, pain derivation, evidence object, trigger evaluation, audit, no-truncation. | `diligence_compiler_output` | HTML/vault_prefill only as forbidden warnings; no stale fields. | Split arrays, no HTML, no prefill. |

## 15. Verification

Files inspected:

- `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md`
- `docs/prompts/diligence-v2/RUNTIME_MIGRATION_MAP_v1.md`
- `docs/prompts/diligence-v2/PROMPT_ALLOCATION_MATRIX_v1.md`
- `docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md`
- `docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md`
- `docs/contracts/SCHEMA_REGENERATION_PLAN_v1.md`
- `data/schemas/assemblyOutput.schema.json`
- `data/schemas/diligenceRunState.schema.json`
- `data/schemas/handoffEnvelope.schema.json`
- `data/schemas/sourceBundle.schema.json`
- `data/schemas/targetFeatureProfile.schema.json`
- `data/schemas/legalStackReview.schema.json`
- `data/schemas/registryLedger.schema.json`
- `data/schemas/operatorChallenge.schema.json`
- `data/schemas/diligenceReport.schema.json`
- `data/schemas/schemaManifest.schema.json`
- `data/schemas/vault.schema.json`
- `src/lib/schemas.js`

Files changed:

- `docs/prompts/diligence-v2/PROMPT_SOURCE_EXTRACTION_PACKETS_v1.md`
- `docs/prompts/diligence-v2/PROMPT_ALLOCATION_MATRIX_v1.md` (optional limited amendment only)

Confirmations:

- No final prompt files created.
- No schemas changed.
- No runtime/UI/provider files changed.
- No Gemini/Jina/Firebase/Firestore work done.
