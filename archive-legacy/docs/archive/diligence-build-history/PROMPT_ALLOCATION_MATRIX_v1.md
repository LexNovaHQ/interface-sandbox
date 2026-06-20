# PROMPT ALLOCATION MATRIX v1

## 0. Status

- Phase: 2A.5
- Purpose: surgical allocation matrix only
- GPT Runtime source: `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md`
- Runtime Migration Map source: `docs/prompts/diligence-v2/RUNTIME_MIGRATION_MAP_v1.md`
- No final prompt files created
- No runtime/schema/UI changes

## 1. Allocation Thesis

The GPT Diligence Runtime v1 is not being rewritten. It is being allocated. Each runtime unit is assigned to one of seven future surgical prompt files or to a non-prompt owner such as Source Collector, React Renderer, Schema Validation, Runtime Orchestrator, or Node 5B Backend Assembler.

This matrix prevents Codex from compressing the monolith into generic prompt prose. Phase 2B must build one prompt at a time from the relevant allocation packet, the Runtime Migration Map, and the regenerated schema for that stage. Codex is to be used as a careful file writer/checker, not as an independent prompt architect that invents new prompt doctrine.

Phase 2B prompts must be drafted from `PROMPT_SOURCE_EXTRACTION_PACKETS_v1.md`. The Allocation Matrix controls routing and boundaries; the Extraction Packets control preserved wording and source blocks. They must not paste the entire migration map, full contract spine, or full schema text into every prompt.

Forbidden leakage checks are contextual. Negative instructions like "do not browse" or "do not emit HTML" are allowed; failures occur only when prompts instruct the model to perform the forbidden behavior.

Prompt source priority rule for each staged prompt:

1. Use the migrated GPT Runtime rule from the Runtime Migration Map.
2. Apply the relevant regenerated schema.
3. Apply the shared preamble.
4. Do not import old Groq prompt wording unless it matches the map.

## 2. Destination Overview

| Destination | Role | Runtime sources feeding it | Output/schema owner | What must not enter |
|---|---|---|---|---|
| 00_SHARED_SYSTEM_PREAMBLE | Shared identity, evidence, safety, no-invention, no-browse, no-HTML, no-Vault-field firewall. | Module I; Module II public-only/one-company assumptions; Module XII no-truncation/disclaimer. | Shared text, no standalone schema. | Stage-specific outputs, full migration map, full schemas, browsing instructions. |
| 01_EVIDENCE_REFINER | Convert Source Collector output into `source_bundle`: source review, evidence buffer, artifact inventory, limitations. | Module I evidence firewall; Module II evidence buffer lock; Module VI artifact inventory/hunt semantics. | `sourceBundle.schema.json` / `source_bundle`. | Registry statuses, legal-risk conclusions, findings, report prose, Vault fields. |
| 02_TARGET_FEATURE_PROFILE | Extract target profile, primary product, product features, archetypes, surfaces, scratchpad. | Module III vocabulary; Module VII target/profile; Module VIII feature map. | `targetFeatureProfile.schema.json` / `target_feature_profile`. | `legal_stack`, registry final statuses, findings, `report_data`, Vault prefill. |
| 03_LEGAL_STACK_REVIEW | Review exactly five legal documents and redline public document gaps. | Module IX; Module I legal/evidence firewall; Module VI artifact inventory. | `legalStackReview.schema.json` / `legal_stack_review`. | Fresh search, registry statuses, final findings, HTML, Vault prefill. |
| 04_REGISTRY_LEDGER_EVALUATION | Evaluate every supplied registry batch row with Hunter Logic Gate and five-state status. | Module V; Module X Sections A-D/G-H; Module III vocab; prior stage outputs. | `registryLedger.schema.json` / `registry_evaluation_ledger`. | Hardcoded 98, report prose, top-N risks, skipped rows, HTML, Vault prefill. |
| 05_OPERATOR_CHALLENGE | Challenge merged ledger for false negatives, overbroad exclusions, insufficient evidence, high-risk gaps. | Module V Section G; Module X Sections B/E/H. | `operatorChallenge.schema.json` / `operator_challenge_gate`. | New evidence, browsing, report writing, Vault prefill, schema changes. |
| 06_FINAL_COMPILER | Compile triggered findings, controlled rows, insufficient rows, report data, audit log, assembly route, questions. | Module XI; Module XII JSON/audit/disclaimer after patch; Module X staging. | `diligenceReport.schema.json` / `diligence_compiler_output`. | HTML, `vault_prefill_suggestions`, model-finalized handoff, stale sales/prospect fields. |
| Phase 3 Source Collector | Fetch, crawl, dedupe, hash, zone, and classify deterministic source transport. | Module VI source discovery/search/retry/failure mechanics. | Source Collector spec/code, not Phase 2B prompt. | Gemini prompt browsing/searching/fetching. |
| Runtime Orchestrator | Sequence stages, lock outputs, split/merge batches, route validation failures. | Module II sequence; Module IV active memory; Module V count; Module X/XI gates. | Runtime code later, not this phase. | Prompt self-orchestration or Firestore writes. |
| Schema Validation Layer | Enforce JSON schemas, counts, enums, forbidden keys, no truncation. | Module IV field contract; Module IX/X/XI/XII validation checks. | `data/schemas/*.json` plus validators. | Prompt-only validation as sole enforcement. |
| React Renderer | Render HTML/report UI, filters, schedules, full forensic record. | Module XII HTML/report display concepts; Module XI no-cap arrays. | React UI later. | Model-generated HTML or prompt-side filters. |
| Node 5B Backend Assembler | Derive Vault prefill and Assembly handoff deterministically. | Module XI Assembly/Vault logic; Module IV handoff fields; Vault Canonical Map. | Vault/Assembly schemas and backend assembler. | Model-generated Vault prefill or invented fields. |
| Retired | Remove obsolete prompt-native behaviors. | Model browsing, snippets as evidence, HTML terminal output, old Vault fields, sales/signal/prospect fields. | None. | Any re-import into Phase 2B prompts. |

## 3. Monolith Section Index

| Section ID | Exact runtime heading / synthetic heading | Parent module | Approximate role | Used in matrix? yes/no | Notes |
|---|---|---|---|---|---|
| M01-A1 | SECTION A. SYSTEM IDENTITY & ROLE BOUNDARY - Public Identity | Module I | Public identity and internal engine role. | yes | Also carries The Interface tagline and Hunter boundary. |
| M01-A2 | SECTION A. SYSTEM IDENTITY & ROLE BOUNDARY - Role Boundary | Module I | Excludes Sales Scanner/Admin/Architect/Copywriter/Spear roles. | yes | Shared preamble only. |
| M01-A3 | SECTION A. SYSTEM IDENTITY & ROLE BOUNDARY - Legal / Advice Firewall | Module I | No legal advice/opinions/certification. | yes | Shared and compiler disclaimer language. |
| M01-A4 | Allowed/Forbidden Legal Language | Module I | Controls safe legal phrasing. | yes | Preserve as language firewall. |
| M01-A5 | Mandatory Disclaimer | Module I | Required public demo/no legal advice disclaimer. | yes | Patch from HTML-only to payload/rendering. |
| M01-B1 | SECTION B. THE 4-PART TERMINAL SEQUENCE | Module I | Old audit/challenge/JSON/HTML terminal order. | yes | Retire order, preserve staged audit discipline. |
| M01-C1 | SECTION C. INPUT PROTOCOL & ONE-COMPANY RULE - Valid Inputs | Module I | URL/text/both public inputs. | yes | Patch source enum and orchestrator validation. |
| M01-C2 | Zero Signal Context | Module I | Deprecates Signal routing. | yes | Retire signal fields. |
| M01-C3 | One-Company Rule | Module I | Single target per run. | yes | Runtime Orchestrator. |
| M01-C4 | Public-Only Rule | Module I | No private documents/logins/secrets. | yes | Shared preamble and Source Collector. |
| M01-D1 | FIRST-PARTY & PASTED TEXT ONLY | Module I | Evidence source firewall. | yes | Evidence Refiner and all reasoning prompts. |
| M01-D2 | QUALIFYING HOSTED GOVERNANCE EXCEPTION | Module I | Treats hosted legal/governance artifacts as first-party if controlled. | yes | Source Collector + Refiner. |
| M01-D3 | THE KILL LIST | Module I | Excludes third-party summaries/databases/prior memory. | yes | Shared and Evidence Refiner. |
| M01-D4 | THE ABSENCE MANDATE & PUBLIC-FOOTPRINT STANDARD | Module I | Absence is evidence after active review. | yes | Evidence, Legal Stack, Registry, Challenge. |
| M01-D5 | ZERO-INFERENCE PROTOCOL | Module I | No assumptions from industry/category/memory. | yes | All prompts. |
| M01-E1 | GOVERNING SOURCES | Module I | Old knowledge-file hierarchy. | yes | Patch authority to Contract Spine/schema/map. |
| M01-E2 | DYNAMIC REGISTRY ITERATION & FULL-LEDGER SUPREMACY | Module I | Dynamic count and visible ledger. | yes | Registry + validation. |
| M01-E3 | THE 5-STATE EVALUATION MATRIX | Module I | TRIGGERED/CONTROLLED/NOT_TRIGGERED/NOT_APPLICABLE/INSUFFICIENT. | yes | Registry. |
| M01-E4 | UNIVERSAL EXCLUDE_IF RULE (HER_001) | Module I | Explicit controls defeat rows; default false. | yes | Registry prompt. |
| M02-A1 | SECTION A. THE RUNTIME IGNITION SWITCH & CHRONOLOGICAL PHASES | Module II | Separates ingestion and evaluation. | yes | Runtime Orchestrator. |
| M02-A2 | Input Schema Acceptance | Module II | Old input JSON. | yes | Patch source modes and schema shape. |
| M02-A3 | Source Mode Branching | Module II | URL/text/url_plus_text behavior. | yes | Source Collector + Refiner. |
| M02-A4 | Anti-Simulation Guard | Module II | No simulated scans or prior knowledge. | yes | Shared and all prompts. |
| M02-B1 | PHASE 1: EVIDENCE INGESTION PROTOCOL (THE HUNT) | Module II | Preferred public paths and safety boundaries. | yes | Source Collector. |
| M02-B2 | Evidence Buffer Entry Schema | Module II | Source ID/type/method/artifact/text/scope/basis. | yes | Evidence Refiner. |
| M02-B3 | Cascading Retry Protocol | Module II | Retry/index/brand/snippet cascade. | yes | Patch: code; snippets discovery-only. |
| M02-B4 | Graceful Halt Protocol | Module II | BLOCKED_BY_FIREWALL/TOOL_EXECUTION_FAILURE. | yes | Runtime Orchestrator and limitations. |
| M02-C1 | PHASE 1.5: THE ARTIFACT INVENTORY CHECKPOINT | Module II | Pre-evaluation artifact inventory. | yes | Evidence Refiner. |
| M02-C2 | Core Legal Scope | Module II | ToS, Privacy Policy, DPA, AUP, SLA. | yes | Evidence Refiner + Legal Stack. |
| M02-C3 | Minimum Artifact Threshold | Module II | Proceed/abort threshold and warnings. | yes | Orchestrator + Refiner limitations. |
| M02-D1 | STEP-TO-PHASE RESOLUTION MAP | Module II | Old downstream sequence. | yes | Patch to staged DAG. |
| M03-A1 | SECTION A. ARCHETYPE VOCABULARY | Module III | UNI/DOE/JDG/CMP/CRT/RDR/ORC/TRN/SHD/OPT/MOV definitions. | yes | Target/Feature and Registry. |
| M03-A2 | COGNITIVE FIREWALLS (MISFIRE GUARDS) | Module III | Archetype guardrails. | yes | Target/Feature. |
| M03-B1 | SECTION B. SURFACE VOCABULARY & ENVIRONMENTAL TOKENS | Module III | Ten surface tokens. | yes | Target/Feature and Registry. |
| M03-B2 | Multiplicity Token Layer | Module III | Multiple surface tokens per feature. | yes | Target/Feature. |
| M03-C1 | SECTION C. THE JURISDICTIONAL RELEVANCE VECTOR | Module III | US/EU/IN authority cues. | yes | Target/Feature + Registry. |
| M03-D1 | SECTION D. PAIN & SEVERITY METRIC CALIBRATION | Module III | Pain tier/category/depth mapping. | yes | Final Compiler. |
| M04-A1 | SECTION A. THE INVENTORY MANDATE | Module IV | Field inventory as reference, not extraction. | yes | Schema Validation/Orchestrator. |
| M04-B1 | SECTION B. THE 4-PART TERMINAL DELIVERY OBJECTS | Module IV | Old terminal containers. | yes | Retire/Patch. |
| M04-C1 | SECTION C. INTERNAL STATE VARIABLES (ACTIVE MEMORY) | Module IV | Retained variables. | yes | Runtime Orchestrator. |
| M04-D1 | SECTION D. DYNAMIC FIELD DEFINITIONS | Module IV | target_profile/product_feature/legal/finding fields. | yes | Stage schemas. |
| M04-E1 | SECTION E. EVIDENCE & CITATION FIELD DEFINITIONS | Module IV | Evidence/citation field rules. | yes | Evidence, Registry, Compiler. |
| M04-F1 | SECTION F. REFERENCE & TRACEABILITY RULES | Module IV | Feature/threat/source traceability. | yes | Registry + Compiler + validation. |
| M04-G1 | SECTION G. ASSEMBLY HANDOFF PAYLOAD | Module IV | Old Vault translation contract. | yes | Node 5B. |
| M05-A1 | SECTION A. THE DYNAMIC ITERATION MANDATE & ACCESS GUARANTEE | Module V | Active registry count and no row skipping. | yes | Registry + validation. |
| M05-B1 | SECTION B. THE EVALUATION SEQUENCE (THE 12-STEP GATE) | Module V | Hunter Logic Gate sequence. | yes | Registry. |
| M05-C1 | SECTION C. HUNTER_TRIGGER PARSING SYNTAX | Module V | Trigger syntax parsing. | yes | Registry. |
| M05-D1 | SECTION D. THE 5-STATE CLASSIFICATION SEMANTICS | Module V | Status meaning. | yes | Registry. |
| M05-E1 | SECTION E. THE EXCLUDE_IF BURDEN OF PROOF (RULE: HER_001) | Module V | Explicit control proof burden. | yes | Registry. |
| M05-F1 | SECTION F. REGISTRY EVALUATION LEDGER | Module V | Ledger row structure and audit. | yes | Registry. |
| M05-G1 | SECTION G. OPERATOR CHALLENGE GATE | Module V | Full-ledger challenge. | yes | Operator Challenge. |
| M06-A1 | SECTION A. INPUT PROTOCOL (THE PRIMARY PATH) | Module VI | URL/text/url_plus_text and ingestion ignition. | yes | Source Collector/Orchestrator. |
| M06-A2 | Source Mode Branching | Module VI | Text disables search; URL uses native web/search. | yes | Patch to Jina/manual_urls. |
| M06-A3 | One-Company Rule / Abort Conditions | Module VI | Single company and graceful halt prerequisites. | yes | Orchestrator. |
| M06-B1 | SECTION B. THIRD-PARTY LEGAL / GOVERNANCE HOSTING EXCEPTION | Module VI | Hosted governance admission. | yes | Source Collector + Refiner. |
| M06-C1 | SECTION C. THE SEARCH MANDATE | Module VI | Seven primary searches and first-party filter. | yes | Source Collector. |
| M06-D1 | SECTION D. SEMANTIC HUNTING - SEARCH-BASED | Module VI | Zone/topic query discovery. | yes | Source Collector. |
| M06-E1 | SECTION E. THE CASCADING RETRY PROTOCOL | Module VI | Four-level retry and absence basis. | yes | Source Collector/Orchestrator. |
| M06-F1 | SECTION F. THE GRACEFUL HALT PROTOCOL (HARDENED) | Module VI | Halt conditions and non-triggers. | yes | Orchestrator + limitations. |
| M06-G1 | SECTION G. MINIMUM ARTIFACT THRESHOLD | Module VI | Proceed under sparse but adequate footprint. | yes | Orchestrator + Refiner. |
| M07-A1 | SECTION A. TARGET PROFILE METADATA EXTRACTION | Module VII | Company/entity/website/HQ/location extraction. | yes | Target/Feature. |
| M07-A2 | Company Name / Legal Entity Source Priority | Module VII | Terms/DPA/Privacy/footer hierarchy. | yes | Target/Feature. |
| M07-B1 | SECTION B. THE PRIMARY CLAIM (THE PROMISE) | Module VII | Public promise/claim extraction. | yes | Target/Feature. |
| M07-C1 | SECTION C. THE PRIMARY PRODUCT OBJECT CONSTRAINTS | Module VII | Six-field primary product. | yes | Target/Feature. |
| M07-D1 | SECTION D. THE PRIOR KNOWLEDGE AND THIRD-PARTY FIREWALL | Module VII | No memory/third-party profile contamination. | yes | Target/Feature. |
| M07-E1 | SECTION E. GOVERNANCE SURFACE ISOLATION | Module VII | Separate product facts from governance/legal facts. | yes | Target/Feature + Legal Stack. |
| M07-F1 | SECTION F. PHASE 2 VALIDATION PROTOCOL | Module VII | Completeness checks. | yes | Schema Validation. |
| M08-A1 | SECTION A. THE MULTIPLICITY MANDATE & UNBOUNDED MAPPING | Module VIII | No cap; multiple features/archetypes. | yes | Target/Feature. |
| M08-B1 | SECTION B. COGNITIVE FIREWALLS (THE ARCHETYPE GUARDS) | Module VIII | Feature-level archetype guardrails. | yes | Target/Feature. |
| M08-C1 | SECTION C. FEATURE MAP CONSTRUCTION & SCHEMAS | Module VIII | product_feature_map schema and evidence. | yes | Target/Feature. |
| M08-C2 | CORE / SECONDARY Feature Role | Module VIII | Role assignment. | yes | Target/Feature. |
| M08-C3 | Evidence Absolute Constraint | Module VIII | Every feature needs first-party evidence. | yes | Target/Feature. |
| M08-D1 | SECTION D. PHASE 3 VALIDATION SCRATCHPAD | Module VIII | Feature-map validation notes. | yes | Target/Feature + validation. |
| M09-A1 | SECTION A. EXECUTION MANDATE | Module IX | Legal stack after product_feature_map lock. | yes | Legal Stack/Orchestrator. |
| M09-B1 | SECTION B. DOCUMENT ASSESSMENT PROTOCOL & SCHEMAS | Module IX | Five document objects and status. | yes | Legal Stack. |
| M09-C1 | SECTION C. COVERS EXTRACTION RULES | Module IX | What docs visibly cover. | yes | Legal Stack. |
| M09-D1 | SECTION D. MISSES EXTRACTION RULES (FALSE BELIEF FORMULA) | Module IX | Founder false-belief contrast. | yes | Legal Stack. |
| M09-E1 | SECTION E. CLAIM / DOCUMENT MISMATCH NOTES | Module IX | Mismatch categories/redline. | yes | Legal Stack. |
| M09-F1 | SECTION F. ASSESSMENT SCRATCHPAD TEMPLATE | Module IX | Per-document assessment blocks. | yes | Legal Stack. |
| M09-G1 | SECTION G. TERMINAL VALIDATION | Module IX | Exactly five entries before registry. | yes | Schema Validation/Orchestrator. |
| M10-A1 | SECTION A. THE FORENSIC LEDGER | Module X | Every registry row and ledger object. | yes | Registry. |
| M10-B1 | SECTION B. THE LETHALITY MANDATE | Module X | Anti-lazy undercount checks. | yes | Operator Challenge. |
| M10-C1 | SECTION C. THE PROOF MANDATE & THE BURDEN OF PROOF | Module X | Quote/absence/exclusion proof. | yes | Registry. |
| M10-D1 | SECTION D. FEATURE REFERENCE RESOLUTION | Module X | Link threats to feature IDs. | yes | Registry + Compiler. |
| M10-E1 | SECTION E. OPERATOR CHALLENGE GATE | Module X | Challenge JSON and reopen logic. | yes | Operator Challenge. |
| M10-F1 | SECTION F. STAGING FOR THE FINDINGS COMPILER | Module X | Pass triggered/controlled/insufficient to compiler. | yes | Compiler. |
| M10-G1 | SECTION G. THE PRIOR KNOWLEDGE & THIRD-PARTY FIREWALL | Module X | No third-party/prior knowledge in registry. | yes | Registry. |
| M10-H1 | SECTION H. TERMINAL VALIDATION BEFORE MODULE XII | Module X | Validate ledger/challenge before compiler. | yes | Orchestrator/Validation. |
| M11-A1 | SECTION A. THE FINDINGS FILTER | Module XI | Filter post-challenge statuses for compilation. | yes | Compiler. |
| M11-B1 | SECTION B. THE HYDRATED FINDINGS COMPILER | Module XI | 19-field finding object. | yes | Compiler. |
| M11-C1 | SECTION C. PAIN CATEGORY DERIVATION | Module XI | T1-T5 category mapping. | yes | Compiler. |
| M11-D1 | SECTION D. EVIDENCE SUB-OBJECT DERIVATION | Module XI | source_url/artifact/proof/evidence_mode. | yes | Compiler. |
| M11-E1 | SECTION E. TRIGGER EVALUATION SUB-OBJECT DERIVATION | Module XI | passed/failed/trigger/exclude fields. | yes | Compiler. |
| M11-F1 | SECTION F. THE ASSEMBLY HANDOFF PAYLOAD | Module XI | Old model Vault translation. | yes | Node 5B + Compiler questions. |
| M11-G1 | SECTION G. THE GLOBAL SYNTHESIS CHECK | Module XI | Audit consistency. | yes | Compiler + validation. |
| M11-H1 | SECTION H. THE PRIOR KNOWLEDGE & EXTERNAL DATABASE FIREWALL | Module XI | No external contamination in final payload. | yes | Compiler. |
| M11-I1 | SECTION I. TERMINAL VALIDATION | Module XI | Findings and handoff validation. | yes | Validation + Node 5B. |
| M12-A1 | SECTION A. THE NO-TRUNCATION MANDATE | Module XII | No omitted arrays/objects. | yes | Compiler + React + validation. |
| M12-B1 | SECTION B. TERMINAL OUTPUT ORDER | Module XII | Old HTML/JSON/audit/handoff/disclaimer sequence. | yes | Retired/Orchestrator. |
| M12-C1 | SECTION C. OUTPUT 1: HTML DUE DILIGENCE REPORT | Module XII | Old report content and layout. | yes | React Renderer + Compiler report_data. |
| M12-D1 | SECTION D. OUTPUT 2: MACHINE JSON PAYLOAD | Module XII | Old final JSON root keys. | yes | Compiler patched to schema. |
| M12-E1 | SECTION E. OUTPUT 3: TECHNICAL AUDIT LOG & WARNINGS | Module XII | Audit log and limitations. | yes | Compiler + Refiner. |
| M12-F1 | SECTION F. OUTPUT 4 & 5: ASSEMBLY HANDOFF & DISCLAIMER | Module XII | Old handoff/disclaimer. | yes | Node 5B + Compiler disclaimer. |
| M12-G1 | SECTION G. FINAL VALIDATION CHECKLIST | Module XII | End-to-end checklist. | yes | Validation/Orchestrator. |

## 4. Master Monolith-to-Destination Matrix

| Section ID | Runtime unit | Old function | Key rule text / logic to preserve | Preservation precision | Status | Destination(s) | Required patch | Forbidden leakage | Phase 2B instruction |
|---|---|---|---|---|---|---|---|---|---|
| M01-A1 | Public identity | Names The Interface and Diligence Engine. | Preserve identity/role language and Hunter boundary. | NEAR_VERBATIM | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE | Remove monolith terminal role. | Sales scanner/Admin/Architect voice. | Put in shared preamble only. |
| M01-A2 | Role boundary | Blocks non-diligence functions. | Engine extracts/classifies/evaluates; does not sell, write cold emails, or assemble Spear. | NEAR_VERBATIM | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE | Add no prompt may act as Assembly/renderer. | Sales/prospect/output copywriting. | Include concise role exclusions. |
| M01-A3 | Legal advice firewall | Blocks legal advice/opinion/certification. | No legal advice, compliance conclusion, liability conclusion, enforceability conclusion. | VERBATIM | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE, 06_FINAL_COMPILER | Route disclaimer to JSON/React. | "illegal", "non-compliant", "liable" as conclusions. | Shared preamble carries firewall. |
| M01-A4 | Allowed/forbidden legal language | Safe legal phrase list. | Use "not visible", "not publicly verifiable", "requires qualified legal review". | VERBATIM | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE, 06_FINAL_COMPILER | Keep stage neutral. | Certification/legal conclusion language. | Include as language block. |
| M01-A5 | Mandatory disclaimer | Requires public demo disclaimer. | Exact public demo/no legal advice string survives as report payload. | NEAR_VERBATIM | PATCH | 06_FINAL_COMPILER, React Renderer | Not HTML-only; compiler emits `disclaimer`. | Hidden or altered disclaimer. | Compiler includes schema `disclaimer`. |
| M01-B1 | 4-part terminal sequence | Old single-prompt output order. | Audit-before-final discipline survives. | LOGIC_ONLY | RETIRE | Runtime Orchestrator, Schema Validation Layer | Staged JSON outputs replace terminal blocks. | Fenced audit/json/html terminal order. | Do not include terminal sequence in prompts. |
| M01-C1 | Valid inputs | URL/text/both. | Public URL or pasted public material only. | NEAR_VERBATIM | PATCH | Phase 3 Source Collector, Runtime Orchestrator | Add `manual_urls`; schema controls input. | Old enum only. | Mention input is prevalidated. |
| M01-C2 | Zero Signal Context | Deprecated Signal routing. | Do not use Signal Context. | VERBATIM | RETIRE | 00_SHARED_SYSTEM_PREAMBLE, Retired | Forbid legacy signal fields. | `signal_context`, sales scanner. | Shared preamble forbids signal context. |
| M01-C3 | One-company rule | Single target. | If multiple targets, orchestrator must require one target. | LOGIC_ONLY | MOVE_TO_CODE | Runtime Orchestrator | Code validates ambiguity. | Prompt selecting multiple companies. | Shared prompt assumes one validated target. |
| M01-C4 | Public-only rule | No private/confidential docs. | Do not ask for secrets, credentials, private MSAs. | NEAR_VERBATIM | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE, Phase 3 Source Collector | Source Collector handles warnings. | Private data ingestion. | Include public-only boundary. |
| M01-D1 | First-party/pasted-only evidence | Source firewall. | Only target domain, qualifying hosted governance, or user-pasted public material. | VERBATIM | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE, 01_EVIDENCE_REFINER, 04_REGISTRY_LEDGER_EVALUATION | Tie to admitted `source_bundle`. | Third-party summaries/prior memory. | Every reasoning prompt references admitted evidence only. |
| M01-D2 | Hosted governance exception | Qualifies hosted artifacts. | Linked/company-controlled/company-specific governance artifact qualifies. | NEAR_VERBATIM | PRESERVE | Phase 3 Source Collector, 01_EVIDENCE_REFINER | Collector/refiner classify basis. | Citing host brand as authority. | Refiner explains `first_party_basis`. |
| M01-D3 | Kill list | Excludes third-party databases/summaries. | Crunchbase, PitchBook, press, reviews, investor descriptions, prior memory excluded. | VERBATIM | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE, 01_EVIDENCE_REFINER | Search candidates may be rejected. | Using third-party as evidence. | Shared and Refiner forbid. |
| M01-D4 | Absence mandate | Public absence can be evidence. | Absence triggers only after active review/search/classification. | NEAR_VERBATIM | PRESERVE | 01_EVIDENCE_REFINER, 03_LEGAL_STACK_REVIEW, 04_REGISTRY_LEDGER_EVALUATION, 05_OPERATOR_CHALLENGE | Absence basis comes from Source Collector/Refiner. | Private possible controls defeating absence. | Preserve basis requirement. |
| M01-D5 | Zero-inference protocol | No hallucinated helpfulness. | If not in admitted evidence, it does not exist for scan purposes. | VERBATIM | PRESERVE | all prompts | Apply to current stage inputs. | Industry assumptions. | Include in shared preamble. |
| M01-E1 | Governing sources | Old knowledge file hierarchy. | Logic hierarchy concept survives. | LOGIC_ONLY | PATCH | 00_SHARED_SYSTEM_PREAMBLE | Replace with Contract Spine, Vault Map, schemas, migration map. | Old Groq/file hierarchy as authority. | State current authority hierarchy only. |
| M01-E2 | Dynamic registry/full ledger | Count active rows; visible ledger. | Every active row must produce exactly one evaluation. | NEAR_VERBATIM | PATCH | 04_REGISTRY_LEDGER_EVALUATION, Schema Validation Layer | Dynamic count supplied; no hardcoded 98. | Summary substitute. | Registry prompt must be batch-safe. |
| M01-E3 | Five-state matrix | Defines final statuses. | Preserve all five statuses. | VERBATIM | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION | Compiler later splits status arrays. | Status drift. | Stage 04 owns final_status. |
| M01-E4 | HER_001 | EXCLUDE_IF hard non-trigger. | Default false unless explicit first-party control proves it. | VERBATIM | PATCH | 04_REGISTRY_LEDGER_EVALUATION | Bake into prompt, not file load. | Benefit-of-doubt controls. | Include HER_001 block. |
| M02-A1 | Ignition/phase separation | Ingestion before evaluation. | No evaluation until evidence buffer locked. | LOGIC_ONLY | MOVE_TO_CODE | Runtime Orchestrator | Stage order and validation enforce. | Prompt self-lock fiction. | Later prompts require prior outputs. |
| M02-A2 | Input schema | Old run/source input. | Run metadata and source mode retained. | LOGIC_ONLY | PATCH | Phase 3 Source Collector, Schema Validation Layer | Add `manual_urls`; schema `target_input`. | Old source enum. | Do not paste old input schema. |
| M02-A3 | Source mode branching | URL/text/url_plus_text. | Text disables crawling; URL modes collect public footprint. | LOGIC_ONLY | PATCH | Phase 3 Source Collector, 01_EVIDENCE_REFINER | Jina/manual URLs; no Gemini browsing. | Prompt browse/search. | Refiner consumes source bundle. |
| M02-A4 | Anti-simulation | No simulated scan. | Prior knowledge quarantined. | NEAR_VERBATIM | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE, all prompts | Tie to admitted inputs. | Pretrained target knowledge. | Include no simulation rule. |
| M02-B1 | Preferred directories/safety | Crawl public legal/product paths. | Public governance/product surfaces are source targets. | LOGIC_ONLY | MOVE_TO_CODE | Phase 3 Source Collector | Jina executes; prompts do not fetch. | Browse/fetch instructions in prompts. | Source Collector spec only. |
| M02-B2 | Evidence Buffer schema | Tracks source metadata. | source_id, source_url, source_type, method, artifact, scope, basis. | NEAR_VERBATIM | PATCH | 01_EVIDENCE_REFINER | Align to `sourceBundle.schema.json` and final excerpt/hash fields. | Raw full scrape persistence. | Refiner emits source bundle fields. |
| M02-B3 | Cascading retry | Retry/pivot/snippet cascade. | Retry/absence proof goal survives. | LOGIC_ONLY | MOVE_TO_CODE | Phase 3 Source Collector, Runtime Orchestrator | Snippets discovery-only. | Snippets as admitted evidence. | Keep out of Gemini prompts. |
| M02-B4 | Graceful halt | Abort states and warnings. | Do not fabricate; limitations explain blockers. | LOGIC_ONLY | PATCH | Runtime Orchestrator, 01_EVIDENCE_REFINER | Structured limitations/status. | Model-generated abort terminal blocks. | Refiner can emit limitations only. |
| M02-C1 | Artifact inventory checkpoint | Inventory before evaluation. | Every required surface gets status/source/summary/absence basis. | NEAR_VERBATIM | PATCH | 01_EVIDENCE_REFINER | Align to source schema. | Threat conclusions in inventory. | Refiner output is locked substrate. |
| M02-C2 | Core legal scope | Five core docs. | ToS, Privacy Policy, DPA, AUP, SLA feed legal stack. | VERBATIM | PRESERVE | 01_EVIDENCE_REFINER, 03_LEGAL_STACK_REVIEW | Missing docs still represented. | Expanding legal_stack to governance surfaces. | Legal prompt outputs exactly five. |
| M02-C3 | Minimum threshold | Sparse footprint proceed logic. | Proceed with warnings if threshold met. | LOGIC_ONLY | MOVE_TO_CODE | Runtime Orchestrator, 01_EVIDENCE_REFINER | Limitations carry sparse footprint. | Prompt aborting without validation. | Refiner labels, orchestrator gates. |
| M02-D1 | Step-to-phase map | Old phase routing. | Sequential dependencies survive. | LOGIC_ONLY | PATCH | Runtime Orchestrator | New 0/0.5/1/2/3/4/5/5B DAG. | Old module numbering as stage filenames. | Use new prompt order. |
| M03-A1 | Archetype vocabulary | Closed product archetypes. | UNI/DOE/JDG/CMP/CRT/RDR/ORC/TRN/SHD/OPT/MOV. | NEAR_VERBATIM | PRESERVE | 02_TARGET_FEATURE_PROFILE, 04_REGISTRY_LEDGER_EVALUATION | Pull from registry key where supplied. | Legacy INT codes. | Include concise definitions/guards. |
| M03-A2 | Misfire guards | Prevent archetype drift. | Mechanical reality beats marketing claims. | NEAR_VERBATIM | PRESERVE | 02_TARGET_FEATURE_PROFILE | Stage-specific only. | Claim-only classification. | Include guard table. |
| M03-B1 | Surface vocabulary | Closed environmental tokens. | Consumer, Enterprise, PII, Employment, Sensitive, Financial, Content, Safety, Infrastructure, Minors. | NEAR_VERBATIM | PRESERVE | 02_TARGET_FEATURE_PROFILE, 04_REGISTRY_LEDGER_EVALUATION | Align to schema/registry key. | Invented surfaces. | Emit `surface_tokens[]`. |
| M03-B2 | Multiplicity tokens | Multiple surfaces. | Pipe/multi-token logic survives as arrays. | LOGIC_ONLY | PATCH | 02_TARGET_FEATURE_PROFILE | Use array fields. | Single surface collapse. | Allow multiple tokens. |
| M03-C1 | Jurisdiction vector | US/EU/IN cues. | Activate authority based on evidence cues. | NEAR_VERBATIM | PRESERVE | 02_TARGET_FEATURE_PROFILE, 04_REGISTRY_LEDGER_EVALUATION, 06_FINAL_COMPILER | Avoid legal conclusions. | Compliance certification. | Preserve authority relevance. |
| M03-D1 | Pain calibration | Tier/category/depth. | Do not overwrite tier; derive category/depth. | NEAR_VERBATIM | PRESERVE | 06_FINAL_COMPILER | Use registry payload. | Invented severity. | Compiler includes mapping. |
| M04-A1 | Inventory mandate | Field inventory reference. | Field flow awareness. | LOGIC_ONLY | PATCH | Schema Validation Layer, Runtime Orchestrator | Use regenerated schemas as current source. | Old field table as schema. | Do not copy old schemas. |
| M04-B1 | Terminal objects | Audit/challenge/JSON/HTML. | Machine/audit/report separation. | LOGIC_ONLY | RETIRE | Runtime Orchestrator, React Renderer | Staged JSON outputs. | Terminal blocks. | No prompt emits multi-block terminal output. |
| M04-C1 | Active memory | Retained variables. | Stage outputs are not re-derived. | LOGIC_ONLY | MOVE_TO_CODE | Runtime Orchestrator | Persist/pass prior outputs. | Prompt relying on hidden memory. | Inputs list required prior artifacts. |
| M04-D1 | Dynamic field definitions | Payload field map. | Target, feature, legal, finding concepts survive. | LOGIC_ONLY | PATCH | 02, 03, 04, 06, Schema Validation | Regenerated schemas control exact fields. | Stale field names. | Use schema summaries only. |
| M04-E1 | Evidence/citation fields | Source proof fields. | Every finding/feature needs citation or absence proof. | NEAR_VERBATIM | PATCH | 01, 02, 04, 06 | Add final excerpt/hash/provenance boundary. | Unsourced findings. | Preserve source refs. |
| M04-F1 | Traceability | Link feature/threat/source. | Feature refs and source refs must resolve. | NEAR_VERBATIM | PATCH | 04_REGISTRY_LEDGER_EVALUATION, 06_FINAL_COMPILER, Schema Validation | Backend validates IDs. | Dangling refs. | Include ID resolution rules. |
| M04-G1 | Assembly handoff fields | Old model handoff payload. | Routing concept survives. | LOGIC_ONLY | MOVE_TO_NODE_5B | Node 5B Backend Assembler | Vault Map exact fields. | Model prefill. | Compiler emits only questions/route. |
| M05-A1 | Dynamic iteration/access | Active row count. | Evaluate every active row exactly once. | NEAR_VERBATIM | PATCH | 04_REGISTRY_LEDGER_EVALUATION, Schema Validation | Backend injects batch/count. | Hardcoded 98. | Batch prompt returns every input row. |
| M05-B1 | 12-step gate | Hunter Logic Gate. | Gate sequence, trigger/exclude, evidence/feature refs. | NEAR_VERBATIM | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION | Batched schema output. | Top-N risk summary. | Preserve as operating core. |
| M05-C1 | Hunter_Trigger parsing | Trigger syntax. | Parse conditions specifically and record basis. | NEAR_VERBATIM | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION | Schema `conditions[]`. | Generic condition not met. | Include parsing rules. |
| M05-D1 | Five-state semantics | Status definitions. | Exactly one status per row. | VERBATIM | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION | Compiler split later. | Mixed final findings. | Use enum. |
| M05-E1 | EXCLUDE_IF burden | HER_001 proof rule. | Default false; explicit written proof only. | VERBATIM | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION, 05_OPERATOR_CHALLENGE | Bake rule text. | Inferred exclusions. | Include burden block. |
| M05-F1 | Registry ledger | Internal audit rows. | Entry per registry row, with reasoning/evidence. | NEAR_VERBATIM | PATCH | 04_REGISTRY_LEDGER_EVALUATION | Output schema wrapper. | Plain summary. | Batch-safe ledger. |
| M05-G1 | Operator Challenge | Challenge after ledger. | PASS/REOPENED with corrected rows. | NEAR_VERBATIM | PATCH | 05_OPERATOR_CHALLENGE | Separate stage over merged ledger. | Compiler doing challenge silently. | Build dedicated prompt. |
| M06-A1 | Primary path input | Ignition and source mode. | Public source intake. | LOGIC_ONLY | MOVE_TO_CODE | Phase 3 Source Collector, Runtime Orchestrator | Four source modes. | Model browsing. | Prompt receives source bundle. |
| M06-A2 | Native browsing branch | Model search/fetch. | Evidence-gathering goal survives. | LOGIC_ONLY | MOVE_TO_CODE | Phase 3 Source Collector | Jina executes. | Any prompt tells model to browse. | Forbid in all prompts. |
| M06-A3 | Abort prerequisites | Tool invocation before halt. | Do not falsely abort. | LOGIC_ONLY | MOVE_TO_CODE | Runtime Orchestrator | Deterministic fetch status. | Model self-certifying tool failure. | Orchestrator handles. |
| M06-B1 | Hosted governance exception | Third-party legal host qualification. | Conditions 1-3 survive. | NEAR_VERBATIM | PATCH | Phase 3 Source Collector, 01_EVIDENCE_REFINER | Code/refiner share basis. | Discarding qualified host artifact. | Refiner notes basis. |
| M06-C1 | Search mandate | Search queries and first-party admission. | Discovery target classes survive. | LOGIC_ONLY | MOVE_TO_CODE | Phase 3 Source Collector | Search output discovery-only. | Search snippets evidence. | Keep out of prompts. |
| M06-D1 | Semantic hunt | Zone/topic discovery. | Source zones feed evidence scope. | LOGIC_ONLY | MOVE_TO_CODE | Phase 3 Source Collector | Jina zone map. | Prompt query lists as commands. | Source Collector spec. |
| M06-E1 | Cascading retry | Absence proof cascade. | Absence basis must be specific. | LOGIC_ONLY | MOVE_TO_CODE | Phase 3 Source Collector, 01_EVIDENCE_REFINER | Refiner consumes status/basis. | Snippet admission. | Refiner uses provided basis. |
| M06-F1 | Graceful halt | Hard abort states. | Do not fabricate; proceed if threshold met. | LOGIC_ONLY | PATCH | Runtime Orchestrator, 01_EVIDENCE_REFINER | Limitations structured. | Terminal abort blocks. | Prompt may emit limitations only. |
| M06-G1 | Minimum threshold | Sparse footprint warnings. | `MIN_THRESHOLD_PROCEED` logic. | LOGIC_ONLY | MOVE_TO_CODE | Runtime Orchestrator | Code gates. | Model halting prematurely. | Refiner labels sparse state. |
| M07-A1 | Target metadata | Company/profile fields. | Extract only from admitted evidence. | NEAR_VERBATIM | PATCH | 02_TARGET_FEATURE_PROFILE | Align schema. | `company_profile` legacy. | Emit `target_profile`. |
| M07-A2 | Source priority hierarchy | Company name/legal entity source order. | Terms/DPA/Privacy/footer hierarchy. | NEAR_VERBATIM | PRESERVE | 02_TARGET_FEATURE_PROFILE | Use where evidence exists; unknown otherwise. | Guessing legal entity. | Include hierarchy. |
| M07-B1 | Primary claim | Product promise. | Preserve direct public claim/verbatim basis. | NEAR_VERBATIM | PRESERVE | 02_TARGET_FEATURE_PROFILE | Evidence quote/source required. | Paraphrase without source. | Include claim extraction. |
| M07-C1 | Primary product object | Six product fields. | product_name, user, function, mechanism, agent_actor, agent_brand_name. | NEAR_VERBATIM | PATCH | 02_TARGET_FEATURE_PROFILE | Align schema `primary_product`. | Generic AI platform filler. | Include coffee-test. |
| M07-D1 | Prior knowledge firewall | No target memory. | Evidence only. | VERBATIM | PRESERVE | 02_TARGET_FEATURE_PROFILE | Shared rule. | Known-company facts. | Repeat in Stage 02. |
| M07-E1 | Governance surface isolation | Separate product and governance facts. | Product/profile should not become legal-stack conclusions. | LOGIC_ONLY | PRESERVE | 02_TARGET_FEATURE_PROFILE, 03_LEGAL_STACK_REVIEW | Stage boundaries. | Stage 02 outputting legal_stack. | Explicitly forbid. |
| M07-F1 | Phase 2 validation | Target/product completeness. | Complete target/profile output. | LOGIC_ONLY | MOVE_TO_SCHEMA_VALIDATION | Schema Validation Layer | Schema controls. | Terminal checkpoint. | Stage 02 acceptance gate. |
| M08-A1 | Multiplicity/no cap | Unbounded feature mapping. | All evidence-backed features; multiple archetypes/surfaces allowed. | NEAR_VERBATIM | PRESERVE | 02_TARGET_FEATURE_PROFILE | Arrays not pipe strings. | Top-N features. | Include no-cap rule. |
| M08-B1 | Archetype guards | Feature classification guards. | Guards survive as classification rules. | NEAR_VERBATIM | PRESERVE | 02_TARGET_FEATURE_PROFILE | Keep concise, stage-specific. | Marketing-claim misfires. | Include guard table. |
| M08-C1 | Feature map schema | product_feature_map construction. | Feature IDs, names, role, description, archetypes, surfaces, evidence. | NEAR_VERBATIM | PATCH | 02_TARGET_FEATURE_PROFILE | Align schema fields. | Linked threat IDs as final findings. | Emit target feature schema only. |
| M08-C2 | CORE/SECONDARY | Feature role. | Strictly CORE or SECONDARY. | VERBATIM | PRESERVE | 02_TARGET_FEATURE_PROFILE | Use enum. | Free-form role labels. | Include role rules. |
| M08-C3 | Evidence absolute | Feature proof. | First-party/qualifying evidence required for every feature. | VERBATIM | PRESERVE | 02_TARGET_FEATURE_PROFILE | Source bundle only. | Unsourced product claims. | Required evidence fields. |
| M08-D1 | Feature validation scratchpad | Classification audit. | Keep candidate reasoning and validation. | LOGIC_ONLY | PATCH | 02_TARGET_FEATURE_PROFILE, Schema Validation Layer | Use `raw_feature_candidates` and scratchpad schema. | Hidden scratchpad as final report. | Stage 02 emits schema scratchpad. |
| M09-A1 | Legal execution mandate | Legal review after feature map. | Must not proceed to registry until legal stack complete. | LOGIC_ONLY | PATCH | 03_LEGAL_STACK_REVIEW, Runtime Orchestrator | Stage order. | Fresh search. | Legal prompt consumes prior outputs. |
| M09-B1 | Document assessment | Exactly five docs. | ToS, Privacy Policy, DPA, AUP, SLA with exists/status/source/covers/misses. | NEAR_VERBATIM | PATCH | 03_LEGAL_STACK_REVIEW | Schema exact fields. | Extra governance docs as core legal entries. | Emit exactly five. |
| M09-C1 | Covers | Visible coverage extraction. | Covers only what artifact states. | NEAR_VERBATIM | PRESERVE | 03_LEGAL_STACK_REVIEW | `covers` null if absent. | Standard clause assumptions. | Include covers rules. |
| M09-D1 | False Belief Formula | Misses extraction. | Founder-belief vs actual-document-coverage contrast. | NEAR_VERBATIM | PATCH | 03_LEGAL_STACK_REVIEW | Output through misses/redline/assessment. | Final threat conclusion, Vault prefill, report prose. | Preserve formula block. |
| M09-E1 | Mismatch notes | Claim/document mismatch. | QUOTE_VS_QUOTE, CLAIM_VS_ABSENCE, STACK_VS_REALITY style redlines. | NEAR_VERBATIM | PATCH | 03_LEGAL_STACK_REVIEW | Schema redline output. | HTML redline only. | Structured redline. |
| M09-F1 | Assessment scratchpad | Per-doc audit blocks. | Evidence status/source/absence/false belief. | LOGIC_ONLY | PATCH | 03_LEGAL_STACK_REVIEW | `legal_stack_assessment`. | Hidden terminal scratchpad. | Emit assessment array. |
| M09-G1 | Legal terminal validation | Five entries before registry. | Legal stack length exactly five. | LOGIC_ONLY | MOVE_TO_SCHEMA_VALIDATION | Schema Validation Layer, Runtime Orchestrator | Validator enforces. | Terminal checkpoint text. | Acceptance gate only. |
| M10-A1 | Forensic ledger | Every row evaluated. | No summary substitute; visible ledger. | NEAR_VERBATIM | PATCH | 04_REGISTRY_LEDGER_EVALUATION | Batch output wrapper. | Skipped rows/top-N. | One output row per input row. |
| M10-B1 | Lethality mandate | Anti-laziness. | Low triggered count under high-risk cues requires recheck. | NEAR_VERBATIM | PATCH | 05_OPERATOR_CHALLENGE | `high_risk_checks`. | Severity theatrics in final prose. | Challenge prompt owns it. |
| M10-C1 | Proof mandate | Quote/absence/exclusion proof. | Public implementation proof may be needed; clause alone may be insufficient. | NEAR_VERBATIM | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION | Evidence refs from source bundle. | Unsourced trigger/exclusion. | Registry prompt includes proof standards. |
| M10-D1 | Feature refs | Resolve feature references. | Threats link to exact feature IDs. | NEAR_VERBATIM | PATCH | 04_REGISTRY_LEDGER_EVALUATION, 06_FINAL_COMPILER | Backend validates refs. | Generic product refs. | Include feature ref rules. |
| M10-E1 | Operator Challenge | Mandatory challenge JSON/reopen. | PASS or REOPENED; correct rows before compiler. | NEAR_VERBATIM | PATCH | 05_OPERATOR_CHALLENGE | Separate stage. | New evidence invention. | Build dedicated Stage 05. |
| M10-F1 | Compiler staging | Pass relevant statuses. | TRIGGERED, CONTROLLED, INSUFFICIENT_EVIDENCE survive. | LOGIC_ONLY | PATCH | 06_FINAL_COMPILER | Split arrays. | All three in `findings[]`. | Compiler maps statuses separately. |
| M10-G1 | Registry firewall | No third-party/prior evidence. | Only first-party evidence satisfies trigger/exclude. | VERBATIM | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION | Shared rule. | Press/investor sources. | Include evidence-only rule. |
| M10-H1 | Pre-compiler validation | Ledger/challenge complete. | Counts match and challenge PASS/REOPENED corrected. | LOGIC_ONLY | MOVE_TO_SCHEMA_VALIDATION | Runtime Orchestrator, Schema Validation Layer | Backend gates compiler. | Compiler before challenge. | Stage 06 inputs post-challenge only. |
| M11-A1 | Findings filter | Compile post-challenge statuses. | Only after Operator Challenge. | LOGIC_ONLY | PATCH | 06_FINAL_COMPILER | `findings[]` TRIGGERED only; other arrays split. | Combined `findings[]`. | Compiler status split. |
| M11-B1 | Hydrated compiler | 19-field findings. | No skinny `true_gaps`; fully hydrated finding fields. | NEAR_VERBATIM | PATCH | 06_FINAL_COMPILER | Align `diligenceReport.schema.json`. | `true_gaps`, skinny findings. | Preserve hydration detail. |
| M11-C1 | Pain category | T1-T5 mapping. | Deterministic category derivation. | VERBATIM | PRESERVE | 06_FINAL_COMPILER | Use registry tier. | Invented categories. | Include mapping. |
| M11-D1 | Evidence sub-object | Evidence proof fields. | source_url, artifact_type, proof_citation, evidence_mode. | NEAR_VERBATIM | PATCH | 06_FINAL_COMPILER | Add schema/provenance limits. | Raw full scrape. | Use admitted refs/excerpts. |
| M11-E1 | Trigger evaluation | Boolean trace. | conditions_passed/failed, trigger_if_result, exclude_if_result/basis. | NEAR_VERBATIM | PRESERVE | 06_FINAL_COMPILER | Copy from ledger. | Recomputing statuses. | Compiler preserves trace. |
| M11-F1 | Assembly handoff | Old model Vault prefill. | Confirmation-question boundary survives. | LOGIC_ONLY | MOVE_TO_NODE_5B | Node 5B Backend Assembler, 06_FINAL_COMPILER | Model emits questions only. | `vault_prefill_suggestions`. | Forbid prefill in compiler. |
| M11-G1 | Global synthesis | Audit consistency. | Counts, challenge, prior knowledge, legal stack summary. | LOGIC_ONLY | PATCH | 06_FINAL_COMPILER, Schema Validation Layer | Structured `technical_audit_log`. | Plain terminal block. | Compiler emits audit object. |
| M11-H1 | Final firewall | No external data in final payload. | Wipe/rebuild contaminated fields. | NEAR_VERBATIM | PRESERVE | 06_FINAL_COMPILER | Evidence refs only. | Prior model memory. | Include no external knowledge. |
| M11-I1 | Terminal validation | Findings/handoff check. | No truncation and field completeness. | LOGIC_ONLY | PATCH | Schema Validation Layer, 06_FINAL_COMPILER, Node 5B | Split validation owners. | Model validating Node 5B prefill. | Compiler validates own output only. |
| M12-A1 | No-truncation | No ellipses/samples. | If N findings/features, emit N objects. | NEAR_VERBATIM | PRESERVE | 06_FINAL_COMPILER, React Renderer, Schema Validation Layer | Counts checked by validation; filters view-only. | Top-N-only output. | Compiler no-cap rule. |
| M12-B1 | Terminal order | HTML/JSON/audit/handoff/disclaimer order. | Output separation idea only. | RETIRED | RETIRE | Retired, Runtime Orchestrator | Stage order replaces terminal order. | Ordered terminal blocks. | Do not include. |
| M12-C1 | HTML report | Raw HTML report. | Report content categories survive. | LOGIC_ONLY | MOVE_TO_REACT | React Renderer, 06_FINAL_COMPILER | Compiler emits `report_data`; React renders. | HTML output. | Forbid HTML in compiler. |
| M12-D1 | Machine JSON | Old exact schema. | Machine-readable output survives. | LOGIC_ONLY | PATCH | 06_FINAL_COMPILER, Schema Validation Layer | Current schema controls. | Old 12-key JSON if stale. | Use schema summary. |
| M12-E1 | Technical audit/warnings | Audit and limitations. | Keep limitations and audit mechanics. | NEAR_VERBATIM | PATCH | 01_EVIDENCE_REFINER, 06_FINAL_COMPILER | Structured objects. | Plain terminal audit. | Emit schema audit fields. |
| M12-F1 | Assembly handoff/disclaimer | Copy-paste handoff and final disclaimer. | Disclaimer survives; handoff moves. | LOGIC_ONLY | MOVE_TO_NODE_5B | Node 5B Backend Assembler, 06_FINAL_COMPILER | Compiler emits route/questions/disclaimer. | Model handoff finalization. | Forbid prefill/handoff payload. |
| M12-G1 | Final checklist | End-to-end gates. | Target, evidence, legal stack, registry count, no legal advice, no truncation. | LOGIC_ONLY | MOVE_TO_SCHEMA_VALIDATION | Runtime Orchestrator, Schema Validation Layer | Validators enforce. | Prompt-only checklist as enforcement. | Convert to acceptance gates. |

## 5. Prompt-Centric Allocation Packets

### 5.1 00_SHARED_SYSTEM_PREAMBLE

- Stage job: provide the common identity and safety substrate for all Gemini prompts.
- Runtime sections feeding it: M01-A1 through M01-A5, M01-C2, M01-C4, M01-D1 through M01-D5, M02-A4, M12-A1.
- Rules to preserve verbatim / near-verbatim: The Interface / Diligence Engine identity; not law firm/no legal advice/no certification; public-footprint limitation; admitted-evidence-only rule; absence mandate; zero-inference protocol; kill list; no top-N truncation.
- Rules to patch: no browsing by model; no invented sources; no invented Vault fields; no HTML; JSON discipline where relevant; disclaimer routing through compiler/renderer.
- Rules to exclude: stage-specific schemas, full contract spine, full migration map, full runtime source, Source Collector execution details.
- Schema/output contract: none; preamble is imported into stages.
- Shared preamble dependencies: current authority hierarchy and prompt source-priority rule.
- Acceptance gates: contains legal/evidence/no-invention/no-browse/no-HTML/no-Vault-preload language; does not contain final prompt outputs.
- Forbidden leakage: sales/prospect fields, legal advice/certification language, browsing/search/fetch commands, HTML instructions.
- Phase 2B construction notes: write once, then keep each stage prompt concise by referencing only the needed shared blocks.

### 5.2 01_EVIDENCE_REFINER

- Stage job: transform `raw_zoned_footprint`, scrape metadata, pasted public material, and discovery candidates into `source_bundle`.
- Runtime sections feeding it: M01-D1 through M01-D5, M02-B2, M02-C1 through M02-C3, M06-B1, M06-E1, M06-F1.
- Rules to preserve verbatim / near-verbatim: first-party evidence rule; hosted governance exception; artifact inventory before evaluation; absence basis; public-only limitation.
- Rules to patch: raw full scrape is active-run only; final source bundle uses extracted excerpts, source hashes, source URLs, zones, artifact classes, limitations, statuses, admission status; search/grounding candidates are DISCOVERY_ONLY until admitted.
- Rules to exclude: TRIGGERED, CONTROLLED, NOT_APPLICABLE threat status, registry evaluation, final legal findings, legal conclusions, Vault fields, report prose, model browsing/searching.
- Schema/output contract: `source_bundle` using `sourceBundle.schema.json`; must include `run_id`, `source_mode`, `target_input`, `source_review`, `discovery_candidates`, `artifact_inventory`, `evidence_buffer`, `limitations`.
- Shared preamble dependencies: evidence-only, no prior memory, no legal advice, no browsing.
- Acceptance gates: no registry status terms as conclusions; every admitted source has first-party basis; every absent artifact has absence basis or limitation.
- Forbidden leakage: snippets as evidence, third-party summaries as evidence, legal-risk conclusions.
- Phase 2B construction notes: use source schema summary, not full schema text.

### 5.3 02_TARGET_FEATURE_PROFILE

- Stage job: produce target profile, primary product, product feature map, raw candidates, and scratchpad.
- Runtime sections feeding it: M03-A1 through M03-C1, M07-A1 through M07-F1, M08-A1 through M08-D1.
- Rules to preserve verbatim / near-verbatim: company identity hierarchy; primary claim source rule; coffee-test standard; archetype/surface mapping; no-cap feature mapping; CORE/SECONDARY logic; evidence absolute constraint.
- Rules to patch: product features output as schema arrays; prior knowledge firewall references admitted evidence buffer; no linked threat IDs beyond empty/default unless schema expects placeholders.
- Rules to exclude: `legal_stack`, registry `final_status`, findings, Vault prefill, `report_data`, legal conclusions.
- Schema/output contract: `target_feature_profile` using `targetFeatureProfile.schema.json`; must include `target_profile`, `primary_product`, `product_feature_map`, `raw_feature_candidates`, `feature_map_scratchpad`, `limitations`.
- Shared preamble dependencies: zero-inference, evidence-only, no legal advice.
- Acceptance gates: every feature has evidence quote/source; archetype and surface values are from controlled vocabulary; no cap on evidence-backed features.
- Forbidden leakage: generic product blob, legal stack, registry rows, report prose.
- Phase 2B construction notes: include archetype guards in stage-specific form; do not paste entire Module III if not needed.

### 5.4 03_LEGAL_STACK_REVIEW

- Stage job: assess exactly five core legal documents and produce public-footprint redlines.
- Runtime sections feeding it: M02-C2, M09-A1 through M09-G1, plus M01-A3/M01-D4.
- Rules to preserve verbatim / near-verbatim: exactly five documents: ToS, Privacy Policy, DPA, AUP, SLA; artifact_inventory-only rule; covers/misses split; False Belief Formula; document_stack_redline; mismatch types; legal_stack_assessment; public-footprint caveats.
- Rules to patch: terminal validation becomes schema validation; fresh search is prohibited; legal conclusions remain forbidden.
- Rules to exclude: fresh search/browse, registry threat `final_status`, final findings, Vault prefill, HTML report.
- Schema/output contract: `legal_stack_review` using `legalStackReview.schema.json`; must include `legal_stack`, `document_stack_redline`, `document_stack_synthesis`, `legal_stack_assessment`, `limitations`.
- Shared preamble dependencies: legal firewall, evidence-only, absence mandate.
- Acceptance gates: exactly five document types, absent docs represented with appropriate status, misses use False Belief Formula.
- Forbidden leakage: legal advice/certification, registry findings, Vault fields.
- Phase 2B construction notes: preserve False Belief Formula near-verbatim.

### 5.5 04_REGISTRY_LEDGER_EVALUATION

- Stage job: evaluate every active registry row in the supplied batch against admitted evidence and prior stage outputs.
- Runtime sections feeding it: M01-E2 through M01-E4, M03-A1 through M03-C1, M05-A1 through M05-F1, M10-A1, M10-C1, M10-D1, M10-G1.
- Rules to preserve verbatim / near-verbatim: every active registry row; dynamic `registry_count_loaded`; Hunter Logic Gate; Hunter_Trigger parsing; EXCLUDE_IF burden; HER_001; five-state matrix; condition-level ledger; evidence_ref; feature_refs; no summary substitute; batch-safe output.
- Rules to patch: registry rows are injected as `registry_batch[]`, not loaded by model; HER_001 is baked into prompt; active count is dynamic.
- Rules to exclude: hardcoded 98, top-N risks only, skipped registry rows, report prose, HTML, Vault prefill, sales/prospect fields.
- Schema/output contract: `registry_evaluation_ledger` or `registry_batch_evaluation` using `registryLedger.schema.json`; must include `registry_batch_meta`, `registry_evaluation_ledger`, `batch_warnings`.
- Shared preamble dependencies: evidence-only, absence mandate, no legal conclusions.
- Acceptance gates: returned rows equal input batch rows; one final status per row; no duplicate or missing threat IDs within batch.
- Forbidden leakage: report prose, compiler fields, source hunting.
- Phase 2B construction notes: this is the most doctrine-heavy prompt; preserve gate logic near-verbatim but keep schema text summarized.

### 5.6 05_OPERATOR_CHALLENGE

- Stage job: adversarially review the merged full ledger and return PASS or corrections.
- Runtime sections feeding it: M05-G1, M10-B1, M10-E1, M10-H1.
- Rules to preserve verbatim / near-verbatim: false negative reopening; overbroad exclusion challenge; insufficient evidence challenge; high-risk checks; universal threat checks; feature reference checks; no new evidence invention; corrected_ledger_entries.
- Rules to patch: separate stage over merged ledger; backend applies corrected entries and revalidates counts.
- Rules to exclude: new browsing/search, new source invention, report writing, Vault prefill, HTML, changing schemas.
- Schema/output contract: `operator_challenge_gate` using `operatorChallenge.schema.json`; must include `operator_challenge_gate`, `corrected_ledger_entries`.
- Shared preamble dependencies: evidence-only, no browsing, no invention.
- Acceptance gates: if REOPENED, every correction references existing threat_id and admitted evidence/absence basis.
- Forbidden leakage: final findings, compiler prose, new evidence.
- Phase 2B construction notes: do not blend this into compiler.

### 5.7 06_FINAL_COMPILER

- Stage job: compile final structured diligence output from post-challenge ledger and prior stage outputs.
- Runtime sections feeding it: M03-D1, M10-F1, M11-A1 through M11-I1, M12-A1, M12-D1, M12-E1, M12-F1.
- Rules to preserve verbatim / near-verbatim: hydrated findings; no skinny `true_gaps`; pain derivation; evidence object; trigger_evaluation; global synthesis/audit; prior knowledge firewall; no truncation; disclaimer.
- Rules to patch: `findings[]` from TRIGGERED only; `controlled_rows[]`; `insufficient_evidence_rows[]`; threat_registry_summary; feature_to_threat_matrix; `report_data`; executive report 5A Material Findings Highlights; executive report 5B compact Triggered Findings Schedule; full forensic record; `technical_audit_log`; `assembly_route`; `vault_confirmation_questions`.
- Rules to exclude: HTML output, `vault_prefill_suggestions`, invented Vault fields, model Assembly handoff finalization, top-N-only findings, sales/prospect fields.
- Schema/output contract: `diligence_compiler_output` using `diligenceReport.schema.json`; required top-level fields are summarized in Section 10.
- Shared preamble dependencies: legal firewall, evidence-only, no truncation, no HTML, no Vault field invention.
- Acceptance gates: counts match post-challenge ledger statuses; no HTML; no prefill; no stale fields.
- Forbidden leakage: model-generated Vault prefill, HTML, `true_gaps`, `sales_viability`, `signal_context`, `ghost_protection_profile`, `prospect_meta`.
- Phase 2B construction notes: compiler prepares data for React and Node 5B; it does not render or assemble final Vault payload.

## 6. Non-Prompt Allocation Packets

### 6.1 Phase 3 Source Collector

Runtime units: M02-B1, M02-B3, M02-B4, M06-A1 through M06-G1. Owns URL fetch, Jina transport, link discovery, manual_urls mode, dedupe, crawl cap, first-party URL admission, hosted governance exception enforcement where deterministic, raw text active-run preservation, source_hash generation, and artifact status where deterministic.

Prompt implication: no Gemini prompt may browse/search/fetch URLs. Evidence Refiner receives Source Collector output.

### 6.2 Runtime Orchestrator

Runtime units: M01-C3, M02-A1, M02-C3, M02-D1, M04-C1, M10-H1, M12-G1. Owns stage sequencing, evidence buffer lock, batch splitting, batch merging, retry/failure routing, and stage validation order.

Prompt implication: prompts receive validated inputs and emit one stage wrapper.

### 6.3 Schema Validation Layer

Runtime units: M04-A1, M07-F1, M09-G1, M10-H1, M11-I1, M12-G1. Owns JSON schema validation, row count validation, legal_stack length validation, status enum validation, forbidden key checks, no hardcoded 98, and no-truncation count checks.

Prompt implication: prompts include acceptance gates but do not become the only enforcement mechanism.

### 6.4 React Renderer

Runtime units: M12-A1, M12-C1. Owns HTML report generation, Executive Report rendering, Full Forensic Record rendering, triggered schedule table, filters as view-only behavior, and clear filters restoring the full base payload.

Prompt implication: compiler emits `report_data`; no prompt emits HTML.

### 6.5 Node 5B Backend Assembler

Runtime units: M04-G1, M11-F1, M12-F1. Owns Vault prefill derivation, Vault Canonical Map field control, Assembly handoff envelope, prefill traceability, confirmation question consumption, and no invented fields.

Prompt implication: compiler emits `vault_confirmation_questions[]`, not `vault_prefill_suggestions`.

### 6.6 Retired

Retired runtime behavior: model browsing/search, search snippets as evidence, model HTML emission, monolithic terminal output order, model-generated Vault prefill, stale Vault fields, stale sales/prospect fields, and hardcoded registry count.

Prompt implication: Phase 2B must grep for and remove these leaks before accepting any prompt.

## 7. Split-Section Rules

| Runtime section | Destination A | Destination B | Destination C | Split rule |
|---|---|---|---|---|
| Module VI Ingestion/Hunt | Phase 3 Source Collector | 01_EVIDENCE_REFINER | Runtime Orchestrator | Fetch/search/retry/dedupe/hash moves to Source Collector; evidence classification/inventory moves to Refiner; halt/threshold routing moves to Orchestrator. |
| Module X Forensic Logic | 04_REGISTRY_LEDGER_EVALUATION | 05_OPERATOR_CHALLENGE | Schema Validation Layer | Row evaluation/proof/feature refs go to Registry; undercount/reopen logic goes to Challenge; count/status/ID validation goes to validators. |
| Module XI Compiler/Assembly | 06_FINAL_COMPILER | Node 5B Backend Assembler | Schema Validation Layer | Findings/report_data/audit/questions go to Compiler; Vault prefill/handoff envelope goes to Node 5B; counts and forbidden keys go to validation. |
| Module XII Terminal Emission | 06_FINAL_COMPILER | React Renderer | Retired | Machine JSON/audit/disclaimer data goes to Compiler; visual report goes to React; terminal order and model HTML are retired. |
| Module I Evidence Firewall | 00_SHARED_SYSTEM_PREAMBLE | 01_EVIDENCE_REFINER | 04_REGISTRY_LEDGER_EVALUATION | General firewall in preamble; admission/classification in Refiner; row proof burden in Registry. |
| Module IV Field Inventory | Schema Validation Layer | Runtime Orchestrator | 06_FINAL_COMPILER | Schema shapes control outputs; orchestrator passes stage artifacts; compiler hydrates final report fields only. |

## 8. Patch Instruction Register

| Patch ID | Old runtime behavior | New architecture rule | Exact Phase 2B instruction |
|---|---|---|---|
| P-001 | Model browsing/search. | Source Collector/Jina owns fetch. | No prompt may ask the model to browse, search, fetch, crawl, click, or inspect URLs. |
| P-002 | Search snippets as Evidence Buffer. | Search/grounding is DISCOVERY_ONLY. | Treat search snippets/candidates as non-evidence unless Source Collector admits a fetched source. |
| P-003 | Source modes omit `manual_urls`. | Source modes are `url`, `manual_urls`, `text`, `url_plus_text`. | Use the four-value enum wherever source mode appears. |
| P-004 | Raw full scrape may flow into final output. | Full raw scrape is active-run only. | Prompt outputs use excerpts, source_hash, URL, zone, artifact_class, status, admission_status, limitations. |
| P-005 | Model emits HTML. | React renders from `report_data`. | Compiler prompt must emit structured report data and forbid HTML. |
| P-006 | Terminal output order. | Runtime Orchestrator sequences stages. | Do not include old HTML/JSON/audit/handoff terminal ordering in prompts. |
| P-007 | Model Vault prefill. | Node 5B derives prefill. | Compiler may emit `vault_confirmation_questions[]`, never `vault_prefill_suggestions`. |
| P-008 | Vault fields from old runtime. | Vault Canonical Map controls. | Forbid `meta`, `human_review`, wrong group placement, and invented Vault fields. |
| P-009 | Findings mix statuses. | Final report splits statuses. | `findings[]` = TRIGGERED only; CONTROLLED and INSUFFICIENT_EVIDENCE go to separate arrays. |
| P-010 | Registry count fixed/current 98. | Active loaded row count is dynamic. | Never hardcode 98; use supplied `registry_count_loaded`. |
| P-011 | HITL/human_review as Vault field. | Diagnostic only, not Vault field. | Allow diagnostic wording only if evidence-backed; never emit `human_review` in Vault payload. |
| P-012 | HER_001 loaded from old rules file. | HER_001 baked into Stage 04 prompt. | Include HER_001 rule text in Registry prompt as fixed operating rule. |
| P-013 | Prompt bloat. | Prompts are surgical. | Do not paste entire migration map/contract spine/runtime into every prompt. |
| P-014 | Full schemas in prompt text. | Schema summaries and wrapper keys only. | Include output wrapper, required top-level fields, and stage acceptance gates; leave full schema in `data/schemas`. |

## 9. Forbidden Leakage Register

| Forbidden leakage | Why forbidden | Applies to prompts | Replacement |
|---|---|---|---|
| model browse/search/fetch URLs | Source Collector owns transport. | all | Source Collector input/output. |
| search snippets as evidence | Discovery-only under spine. | 01, 04, 06 | Admitted evidence with provenance. |
| HTML output | React renders. | 06, all | `report_data`. |
| `vault_prefill_suggestions` by model | Node 5B derives. | 06, all | `vault_confirmation_questions[]`. |
| `meta` Vault group | Vault map forbids. | 06, Node 5B notes | No replacement. |
| `human_review` Vault field | Vault map forbids. | 06, Node 5B notes | Diagnostic-only wording. |
| `architecture.integrations` | Wrong group. | 06, Node 5B notes | `baseline.integrations`. |
| `architecture.output_ownership` | Wrong group. | 06, Node 5B notes | `baseline.output_ownership`. |
| `architecture.agent_limits` | Wrong group. | 06, Node 5B notes | `archetypes.agent_limits`. |
| hardcoded 98 | Active count is dynamic. | 04, 05, 06 | Supplied `registry_count_loaded`. |
| top-N-only findings | No-cap invariant. | 02, 04, 06 | Full arrays plus React filters. |
| `sales_viability` | Legacy sales scanner field. | all | None. |
| `signal_context` | Deprecated signal routing. | all | Source bundle and target profile. |
| `ghost_protection_profile` | Legacy field. | all | None. |
| `true_gaps` | Skinny legacy finding schema. | 06 | Hydrated findings plus split rows. |
| `prospect_meta` | Legacy prospect/sales field. | all | `target_profile` where evidence-backed. |
| legal advice/certification language | Legal firewall. | all | Public-footprint caveats and qualified-review language. |

## 10. Schema Alignment Table

| Prompt | Output wrapper key | Schema file | Must include | Must not include |
|---|---|---|---|---|
| 01_EVIDENCE_REFINER | `source_bundle` | `sourceBundle.schema.json` | `run_id`, `source_mode`, `target_input`, `source_review`, `discovery_candidates`, `artifact_inventory`, `evidence_buffer`, `limitations`. | Threat statuses, legal conclusions, Vault fields, report prose. |
| 02_TARGET_FEATURE_PROFILE | `target_feature_profile` | `targetFeatureProfile.schema.json` | `target_profile`, `primary_product`, `product_feature_map`, `raw_feature_candidates`, `feature_map_scratchpad`, `limitations`. | `legal_stack`, final_status, findings, `report_data`, Vault prefill. |
| 03_LEGAL_STACK_REVIEW | `legal_stack_review` | `legalStackReview.schema.json` | `legal_stack`, `document_stack_redline`, `document_stack_synthesis`, `legal_stack_assessment`, `limitations`. | Registry statuses, findings, HTML, Vault prefill. |
| 04_REGISTRY_LEDGER_EVALUATION | `registry_evaluation_ledger` / `registry_batch_evaluation` | `registryLedger.schema.json` | `registry_batch_meta`, `registry_evaluation_ledger`, `batch_warnings`; one row per input registry row. | Report prose, HTML, fixed 98, Vault prefill, sales/prospect fields. |
| 05_OPERATOR_CHALLENGE | `operator_challenge_gate` + `corrected_ledger_entries` | `operatorChallenge.schema.json` | `operator_challenge_gate`, `corrected_ledger_entries`; PASS/REOPENED and correction basis. | New evidence, browsing, final findings, HTML, Vault prefill. |
| 06_FINAL_COMPILER | `diligence_compiler_output` | `diligenceReport.schema.json` | `diligence_run`, `source_bundle_summary`, `target_profile`, `primary_product`, `product_feature_map`, `legal_stack`, `document_stack_redline`, `threat_registry_summary`, `feature_to_threat_matrix`, `findings`, `controlled_rows`, `insufficient_evidence_rows`, `report_data`, `technical_audit_log`, `assembly_route`, `assembly_handoff`, `handoff_envelope`, `disclaimer`. | HTML, `vault_prefill_suggestions`, stale sales/prospect fields, invented Vault fields. |

## 11. Phase 2B Build Order

Prompts must be built one at a time:

| Order | Prompt / task | Source allocation packet | Required checks | Forbidden leakage grep terms | Acceptance gate |
|---:|---|---|---|---|---|
| 1 | 00_SHARED_SYSTEM_PREAMBLE | 5.1 | Legal/evidence/no-browse/no-HTML/no-Vault rules present. | `browse`, `fetch URL`, `HTML report`, `vault_prefill_suggestions` | Safe shared block, no output wrapper. |
| 2 | 01_EVIDENCE_REFINER | 5.2 | Wrapper and required top-level fields; no threat statuses. | `TRIGGERED`, `CONTROLLED`, `NOT_APPLICABLE`, `legal risk`, `vault_` | Emits source bundle only. |
| 3 | 02_TARGET_FEATURE_PROFILE | 5.3 | Target/profile/product/feature fields; evidence per feature. | `legal_stack`, `final_status`, `findings`, `report_data`, `vault_prefill` | Emits target feature profile only. |
| 4 | 03_LEGAL_STACK_REVIEW | 5.4 | Exactly five document types; False Belief Formula preserved. | `final_status`, `TRIGGERED`, `HTML`, `vault_prefill` | Emits legal stack review only. |
| 5 | 04_REGISTRY_LEDGER_EVALUATION | 5.5 | Every input row, five-state enum, HER_001, no fixed count. | `98`, `top risks`, `HTML`, `vault_prefill`, `sales_viability` | Batch-safe ledger output. |
| 6 | 05_OPERATOR_CHALLENGE | 5.6 | PASS/REOPENED, corrected IDs, no new evidence. | `browse`, `search`, `report_data`, `vault_prefill`, `HTML` | Challenge output only. |
| 7 | 06_FINAL_COMPILER | 5.7 | Status split, report_data, no HTML/pre-fill, no truncation. | `html`, `vault_prefill_suggestions`, `true_gaps`, `sales_`, `prospect_` | Diligence compiler output validates. |
| 8 | README / prompt index | Sections 2, 10, 11 | Prompt order and schemas documented. | old Groq authority language | Index references v2 prompts only. |
| 9 | Prompt QA drift audit | Sections 8, 9, 13 | Grep forbidden leakage and schema wrappers. | all forbidden register terms | Audit passes before Phase 2B closes. |

## 12. Prompt Surgery Packet Template

### Stage

[Stage number and destination name]

### File

[Exact prompt file path]

### Stage job

[One concise sentence describing the stage output and boundary]

### Runtime sections used

[List Section IDs and exact runtime headings]

### Verbatim / near-verbatim blocks to preserve

[List only the runtime blocks whose wording or structure must survive]

### Patches applied

[List patch IDs from Section 8 and short explanation]

### Schema output contract

[Wrapper key, schema file, required top-level fields summary]

### Forbidden leakage

[Stage-specific leakage terms from Section 9]

### Acceptance gates

[Concrete checks that must pass before the prompt is accepted]

### Final prompt text to write

[Phase 2B writes actual prompt text here; Phase 2A.5 leaves this blank/template-only]

## 13. Phase 2B Acceptance Gates

- Evidence Refiner must not mention TRIGGERED/CONTROLLED/legal risk conclusions.
- Target Feature must not output legal_stack.
- Legal Stack must output exactly five document types.
- Registry prompt must preserve Hunter Logic Gate and every-row mandate.
- Operator Challenge must not invent new evidence.
- Compiler must not emit HTML.
- Compiler must not emit `vault_prefill_suggestions`.
- No prompt may ask model to browse/search/fetch URLs.
- No prompt may treat search snippets as admitted evidence.
- No prompt may hardcode registry count 98.
- No prompt may emit stale sales/prospect fields.
- No prompt may invent Vault fields.
- No prompt may paste the entire contract spine/schema/migration map.
- No prompt may use old Groq prompt wording unless it matches the allocation matrix and migration map.
- No prompt may use legal advice/certification language.
- No prompt may suppress base arrays through top-N filtering.

## 14. Verification

Files inspected:

- `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md`
- `docs/prompts/diligence-v2/RUNTIME_MIGRATION_MAP_v1.md`
- `docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md`
- `docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md`
- `docs/contracts/SCHEMA_REGENERATION_PLAN_v1.md`
- `data/schemas/sourceBundle.schema.json`
- `data/schemas/targetFeatureProfile.schema.json`
- `data/schemas/legalStackReview.schema.json`
- `data/schemas/registryLedger.schema.json`
- `data/schemas/operatorChallenge.schema.json`
- `data/schemas/diligenceReport.schema.json`
- `data/schemas/vault.schema.json`
- `data/schemas/assemblyOutput.schema.json`
- `data/schemas/diligenceRunState.schema.json`
- `data/schemas/handoffEnvelope.schema.json`
- `data/schemas/schemaManifest.schema.json`
- `src/lib/schemas.js`

Files changed:

- `docs/prompts/diligence-v2/PROMPT_ALLOCATION_MATRIX_v1.md`

Confirmations:

- No final prompts created.
- No schema files changed.
- No runtime/UI files changed.
- No provider/Firebase/Cloudflare files changed.
- No Gemini calls added.
- No Jina scraper code added.
- No Firestore writes added.
- No dependencies added.
