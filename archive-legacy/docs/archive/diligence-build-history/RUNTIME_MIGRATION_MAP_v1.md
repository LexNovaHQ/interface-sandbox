# RUNTIME MIGRATION MAP v1

## 0. Status

- Phase: 2A
- Purpose: runtime migration map only
- No prompt files created
- No runtime code changed
- No schemas changed
- GPT Runtime source used: `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md`
- GPT Runtime source of record: `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md`
- Related Groq/runtime and prompt references were inventoried below.
- Governing docs checked:
  - `docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md`
  - `docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md`
  - `docs/contracts/SCHEMA_REGENERATION_PLAN_v1.md`
  - `data/schemas/*.json`
  - `src/lib/schemas.js`

## 1. Executive Migration Thesis

The GPT Diligence Runtime v1 is a monolithic forensic diligence operating system. It combines source hunting, artifact inventory, target extraction, archetype mapping, legal-stack review, registry evaluation, operator challenge, final finding hydration, HTML rendering, terminal audit emission, and Vault/Assembly handoff into one prompt-native execution loop.

The new engine is a staged Gemini/Jina diligence compiler. It is not a rewrite, summary, simplification, or lossy extraction of the old runtime. The migration goal is to preserve the old runtime's reasoning logic while patching execution architecture, schemas, rendering, and Vault handoff boundaries to the Contract Spine.

The old runtime remains canonical for forensic reasoning: evidence firewall, public-footprint limitation, absence mandate, zero-inference protocol, artifact inventory discipline, target/profile extraction logic, archetype and surface logic, False Belief Formula, Hunter Logic Gate, Hunter_Trigger parsing, EXCLUDE_IF burden, HER_001, Operator Challenge Gate, and no-truncation discipline. It is not canonical for browsing by the model, search snippets as admitted evidence, HTML emission, terminal output order, model-generated Vault prefill, stale schema names, stale Vault fields, Groq-only assumptions, or fixed registry counts.

| Old monolith responsibility | New owner |
|---|---|
| browsing/source hunt | Phase 3 Source Collector |
| evidence cleanup | 01 Evidence Refiner |
| target/profile extraction | 02 Target Feature Profile |
| legal stack review | 03 Legal Stack Review |
| registry evaluation | 04 Registry Ledger |
| challenge gate | 05 Operator Challenge |
| final findings/report data | 06 Final Compiler |
| HTML rendering | React Renderer |
| Vault prefill | Node 5B Backend Assembler |

## 2. Runtime Source Inventory

| Source file / pasted source | Exists? | Role | Canonical for reasoning? yes/no | Conflicts with spine? yes/no | Use in Phase 2B |
|---|---:|---|---|---|---|
| `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md` | yes | GPT Diligence Runtime v1 source of record; twelve-module monolith used for this map. | yes | yes | Primary reasoning source. Use for rules, not execution architecture. |
| `docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md` | yes | Existing Groq sandbox conversion of the GPT runtime. | reference only | yes | Use as prior conversion aid, but Contract Spine supersedes Groq/provider assumptions and stale prompt file naming. |
| `docs/prompts/diligence/PROMPT_INDEX.md` | yes | Existing Groq prompt index and validation notes. | no | yes | Inventory only. Do not copy old four-stage layout into Phase 2B. |
| `docs/prompts/diligence/01_Target_Feature_Extraction.prompt.md` | yes | Existing Target/Feature stage prompt. | partial reference | yes | Mine for already-preserved target/feature rules, then rebuild under new v2 naming/schema. |
| `docs/prompts/diligence/02_Legal_Stack_Review.prompt.md` | yes | Existing Legal Stack prompt with False Belief Formula. | partial reference | yes | Mine for False Belief and five-doc discipline, then rebuild. |
| `docs/prompts/diligence/03_Registry_Evaluation.prompt.md` | yes | Existing Registry Evaluation prompt with Hunter Logic Gate. | partial reference | yes | Mine for Hunter mechanics, HER_001, and every-row discipline, then patch to dynamic count and v2 schema. |
| `docs/prompts/diligence/04_Final_Compiler_And_Handoff.prompt.md` | yes | Existing compiler plus Assembly handoff prompt. | partial reference | yes | Use as conflict source; remove model Vault prefill from Phase 2B compiler. |
| `data/runtime/registry.runtime.json` | yes | Active threat row runtime artifact. | yes for row data | no | Runtime input to Stage 04; active row count must be computed dynamically. |
| `data/runtime/registry_key.runtime.json` | yes | Controlled vocabulary artifact for archetypes/surfaces/statuses. | yes for vocabulary | no | Stage 02/04 vocabulary source. |
| `data/runtime/runtime_status.json` | yes | Runtime metadata/status artifact. | no | no | Inventory only unless orchestrator later consumes it. |
| `docs/reference/vault.js` | yes | Literal Vault payload reference used by Vault Canonical Map. | no for prompt reasoning | no | Node 5B/Vault map source only; prompts must not infer Vault fields from memory. |

## 3. Governing Document Cross-Check

| Governing document | What it controls | GPT Runtime areas checked against it | Conflicts found | Resolution rule |
|---|---|---|---|---|
| `INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md` | Diligence Engine architecture, node ownership, stage I/O, React/Node 5B split, provider boundaries, source handling, report shape. | Module I terminal sequence; Module II ignition/source modes; Module VI hunt; Modules VII-XI stage mapping; Module XII output order/HTML/JSON. | Model browsing, search snippets, HTML output, four/five terminal blocks, model Vault prefill, hardcoded 98 references, source enum drift. | Spine controls architecture. Preserve GPT reasoning but patch execution to Jina Source Collector, Gemini stages, schema validation, React renderer, and Node 5B. |
| `VAULT_JS_CANONICAL_MAP_v1.md` | Vault field names, group placement, Node 5B derivation, prefill vs confirmation boundary, fan-out rules. | Module IV field inventory; Module XI Assembly/Vault translation; Module XII Assembly handoff. | Old model-generated `vault_prefill_suggestions`, possible stale groups/fields, `human_review`, `meta`, `architecture.integrations`, `architecture.output_ownership`, `architecture.agent_limits`, `is_companion` literal field risk. | Vault map controls. Model may emit `vault_confirmation_questions`; Node 5B derives exact prefill. |
| Regenerated schemas in `data/schemas/*.json` | Final output wrappers, required fields, enums, no-cap payload shapes, source admission metadata, Vault shape. | Module II source input; Module IV field contract; Module X ledger fields; Module XI compiler object; Module XII machine JSON. | Runtime mixed statuses in `findings[]`; raw text persistence; old JSON shape; terminal block schema; legacy keys. | Schema files control wrapper keys and required top-level fields. Prompt outputs must validate or be rejected. |
| `SCHEMA_REGENERATION_PLAN_v1.md` | Supporting audit history, stale field audit, rewrite plan, dynamic count, old-schema conflict list. | Module IV stale fields; Module XI `true_gaps`/findings; Module XII JSON; Vault groups; source mode. | Confirms old docs contain hardcoded 98 and legacy fields; confirms no raw full-text persistence in final report. | Use as audit support only. If it conflicts with current regenerated schemas or Spine, current schema/Spine wins. |
| `src/lib/schemas.js` | Public schema path registry and canonical logical names. | Phase 2B schema alignment map and output wrapper naming. | None in paths; confirms canonical keys. | Prompt wrapper names must match `CANONICAL_SCHEMA_PATHS`. |

## 4. Module-by-Module Migration Ledger

| Runtime unit | Function in old runtime | Key rules / logic to preserve | Migration status | New destination | Required patches | Forbidden leakage | Phase 2B prompt impact |
|---|---|---|---|---|---|---|---|
| Module I - identity / role boundary | Defines The Interface public identity and Diligence Engine internal role. | Not Sales Scanner, Admin, Architect, Copywriter, Spear Engine, or legal advisor. | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE | Keep identity but remove monolith terminal phrasing. | Old sales/scanner/admin language as output fields. | Shared preamble sets identity for all stages. |
| Module I - legal advice firewall | Keeps output as public-footprint diligence, not legal advice. | Allowed phrases: not visible, not publicly verifiable, no public artifact found, review-ready route, requires qualified legal review. | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE, 06_FINAL_COMPILER, React Renderer | Disclaimer goes into payload and React view; not HTML generated by model. | Compliance conclusions, liability conclusions, illegal/non-compliant unless quoted. | Every prompt includes legal-language firewall. |
| Module I - terminal sequence | Forces audit, challenge, JSON, HTML order in one run. | Think before finalizing; audit before synthesis. | PATCH | Runtime Orchestrator, Schema Validation Layer | Replace terminal sequence with staged calls and per-stage validation. | Four/five fenced terminal blocks and HTML-first/HTML-last contradictions. | Prompts emit one JSON wrapper each. |
| Module I - evidence rules | Restricts evidence to first-party and pasted public material. | First-party/pasted only; hosted governance exception; kill list. | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE, 01_EVIDENCE_REFINER, 04_REGISTRY_LEDGER_EVALUATION | Search candidates are discovery only; Jina/admission controls decide evidence. | Crunchbase, PitchBook, TechCrunch, review sites, investor descriptions, prior memory. | Evidence Refiner and Registry prompts must reject non-admitted evidence. |
| Module I - absence mandate | Treats public absence as evidence after active search/review. | Missing governance language can trigger structural gap; failure to look is not absence. | PRESERVE | 01_EVIDENCE_REFINER, 03_LEGAL_STACK_REVIEW, 04_REGISTRY_LEDGER_EVALUATION, 05_OPERATOR_CHALLENGE | Absence basis comes from Source Collector/Refiner inventory, not model browsing. | Speculative private controls defeating public absence. | Prompts require `absence_basis` and artifact status before absence conclusions. |
| Module I - zero-inference protocol | Prohibits hallucinated helpfulness and industry assumptions. | If not in admitted evidence, it does not exist for scan purposes. | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE, all Gemini prompts | Tie to `evidence_buffer[]` and schema validation. | Prior model memory, assumptions, generic product category inference. | Every prompt has no-invention/no-prior-knowledge rule. |
| Module I - five-state matrix | Defines TRIGGERED, CONTROLLED, NOT_TRIGGERED, NOT_APPLICABLE, INSUFFICIENT_EVIDENCE. | Every row receives exactly one status. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION, Schema Validation Layer | Compiler splits statuses into separate arrays. | Mixed-status `findings[]` as final report base. | Registry prompt owns row status; compiler hydrates split arrays. |
| Module I - HER_001 | Universal EXCLUDE_IF non-trigger rule. | Default EXCLUDE_IF false; controls must be explicit and specific. | PATCH | 04_REGISTRY_LEDGER_EVALUATION | Bake into prompt; no missing `hunter_engine_rules` load. | Runtime dependency on absent hunter rules file. | Stage 04 includes HER_001 verbatim as fixed rule. |
| Module I - dynamic registry count | Requires REGISTRY_COUNT from active rows. | Summary/count is not a visible ledger substitute. | PATCH | 04_REGISTRY_LEDGER_EVALUATION, Runtime Orchestrator, Schema Validation Layer | Use active loaded row count; do not hardcode 98. | Fixed count as prompt invariant. | Prompt says `registry_count_loaded` is supplied by backend. |
| Module I - final disclaimer | Requires public demo/no legal advice disclaimer. | Exact disclaimer survives. | PATCH | 06_FINAL_COMPILER, React Renderer | Store as `disclaimer`; React renders it. | Mandatory HTML-only disclaimer location. | Compiler emits disclaimer string in JSON only. |
| Module II - input contract | Accepts run id, source mode, URL/text, submitted timestamp. | One run, public source input, no simulation. | PATCH | Phase 3 Source Collector, Runtime Orchestrator, Schema Validation Layer | Add `manual_urls`; schema controls `target_input`. | Old enum missing `manual_urls`. | Preamble references only admitted source bundle, not raw user input. |
| Module II - source modes | Branches URL, text, URL plus text. | Text mode disables search; URL mode collects public footprint; combined mode appends pasted public material. | PATCH | Phase 3 Source Collector, 01_EVIDENCE_REFINER | Source Collector executes fetches; prompts do not browse. | Model-native browsing branches. | Evidence Refiner consumes `source_mode`, `raw_footprint`, `scrape_meta`. |
| Module II - evidence buffer lock | Separates ingestion from evaluation. | No evaluation until evidence buffer and artifact inventory are locked. | PRESERVE | Runtime Orchestrator, 01_EVIDENCE_REFINER, Schema Validation Layer | Lock is stage boundary and validation gate. | Prompt pretending to self-lock after browsing. | Stage 02+ require source bundle as input. |
| Module II - one-company rule | Prevents multi-target runs. | Process one clear target; otherwise abort/ask. | MOVE_TO_CODE | Phase 3 Source Collector, Runtime Orchestrator | Orchestrator validates target ambiguity before stage prompts. | Gemini trying to select among multiple companies silently. | Shared prompt may restate single-target assumption. |
| Module II - runtime sequence | Routes ingestion to target/profile, feature, legal, registry, challenge, compiler, emission. | Stage order matters. | PATCH | Runtime Orchestrator | Translate old phase names to new Node 0-5B order. | Old Module X/XI naming inconsistency as prompt filenames. | Destination map below controls Phase 2B order. |
| Module II - downstream stage order | Defines no skipping. | Later logic depends on retained prior outputs. | PRESERVE | Runtime Orchestrator, Schema Validation Layer | Backend passes prior stage artifacts explicitly. | Model re-deriving retained variables from scratch. | Each prompt lists required prior-stage inputs. |
| Module III - archetype vocabulary | Defines UNI, DOE, JDG, CMP, CRT, RDR, ORC, TRN, SHD, OPT, MOV. | Closed vocabulary and definitions. | PRESERVE | 02_TARGET_FEATURE_PROFILE, 04_REGISTRY_LEDGER_EVALUATION | Source from `registry_key.runtime.json` where provided. | Legacy numeric INT.01-INT.10 codes. | Stage 02 classifies features; Stage 04 checks gates. |
| Module III - archetype misfire guards | Prevents classification drift. | DOE/JDG/CMP/CRT/RDR/ORC/TRN/SHD/OPT/MOV guards. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Keep as feature classification guardrails. | Marketing claims overriding mechanical behavior. | Stage 02 prompt must include guard matrix. |
| Module III - surface vocabulary | Defines ten environmental tokens. | Multi-token surface strings allowed. | PRESERVE | 02_TARGET_FEATURE_PROFILE, 04_REGISTRY_LEDGER_EVALUATION, Node 5B Backend Assembler | Align token enum with registry key/schema. | Free-form invented surface labels. | Stage 02 emits `surface_tokens[]`; Node 5B maps relevant surfaces. |
| Module III - jurisdiction vector | Maps authority to US/EU/IN relevance. | Use evidence cues, not vague geography. | PRESERVE | 02_TARGET_FEATURE_PROFILE, 04_REGISTRY_LEDGER_EVALUATION, 06_FINAL_COMPILER | Schema uses authority object in findings. | Legal conclusions about jurisdictional compliance. | Stage 02 extracts cues; Stage 04/06 preserves authority relevance. |
| Module III - pain tier/category/depth mapping | Derives category/depth from registry tier and exposure. | Do not overwrite `Pain_Tier`; derive category and depth deterministically. | PRESERVE | 06_FINAL_COMPILER | Use registry payload for tier; compiler derives display category/depth. | Invented severity unrelated to registry. | Compiler prompt includes mapping and no override rule. |
| Module IV - inventory mandate | Defines field flow, not extraction logic. | Track generated-in and consumed-by relationships. | PATCH | Schema Validation Layer, Runtime Orchestrator | Replace old field table with regenerated schema wrappers. | Treating old field inventory as current schema. | Phase 2B uses schemas, not old table, for wrappers. |
| Module IV - terminal delivery objects | Defines audit, challenge, JSON, HTML containers. | Need auditability and machine payload. | PATCH | Runtime Orchestrator, React Renderer, Schema Validation Layer | One JSON wrapper per stage; React renders report. | Fenced terminal delivery contract. | No prompt emits HTML or multiple terminal blocks. |
| Module IV - active memory variables | Lists run/source/artifact/target/feature/legal/ledger/findings/handoff objects. | Preserve data dependencies across stages. | PATCH | Runtime Orchestrator, Schema Validation Layer | Stage outputs are persisted/passed, not held in prompt memory. | Active-memory-only assumptions. | Prompt inputs explicitly include prior artifacts. |
| Module IV - target profile fields | Defines company, website, legal entity, HQ, processing location, primary claim/product fields. | Preserve target/profile extraction fields. | PATCH | 02_TARGET_FEATURE_PROFILE | Align with `targetFeatureProfile.schema.json`. | `company_profile`/`product_profile` legacy split. | Stage 02 emits `target_profile` and `primary_product`. |
| Module IV - feature map fields | Defines product feature objects, archetypes, surfaces, evidence. | Feature-level evidence, CORE/SECONDARY, no cap. | PATCH | 02_TARGET_FEATURE_PROFILE | Align with schema: evidence quote/source URL, raw candidates/scratchpad as allowed. | `classification` as single summary. | Stage 02 emits full `product_feature_map[]`. |
| Module IV - legal stack fields | Defines legal_stack and document_stack_redline. | Five document stack and misses/covers. | PATCH | 03_LEGAL_STACK_REVIEW | Align to schema required fields and evidence statuses. | Old HTML redline-only output. | Stage 03 emits structured legal review wrapper. |
| Module IV - finding fields | Defines hydrated finding shape. | Full finding hydration; no skinny `true_gaps`. | PATCH | 06_FINAL_COMPILER | `findings[]` only TRIGGERED; controlled/insufficient split out. | Combined final `findings[]` for all statuses. | Compiler prompt hydrates TRIGGERED findings only and status rows separately. |
| Module IV - evidence object | Captures source URL, artifact type, proof. | Every finding needs proof or documented absence. | PATCH | 04_REGISTRY_LEDGER_EVALUATION, 06_FINAL_COMPILER | Use hash/excerpt/zone/artifact_class/status/admission metadata in final payload. | Full raw scrape as final report evidence. | Compiler builds evidence refs from admitted source bundle. |
| Module IV - terminal output field rules | Keeps audit and outputs complete. | No truncation, complete arrays. | PATCH | Schema Validation Layer, React Renderer | Completeness enforced by validators and renderer memory, not terminal blocks. | Markdown/fenced output format instructions. | Prompts include no-cap and JSON-only rules. |
| Module IV - stale Vault/Assembly fields | Old runtime references Vault/Assembly handoff fields. | Keep routing concept. | MOVE_TO_NODE_5B | Node 5B Backend Assembler | Exact Vault map controls fields. | Model-invented/stale Vault groups. | Compiler emits only confirmation questions plus assembly route data. |
| Module V - active registry count rule | Loads registry and computes count. | Every active row evaluated once. | PATCH | 04_REGISTRY_LEDGER_EVALUATION, Runtime Orchestrator | Backend supplies batch and dynamic count. | Hardcoded 98. | Stage 04 prompt forbids fixed counts. |
| Module V - every-row evaluation | Demands full ledger, not summary. | One visible evaluation per row. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION, Schema Validation Layer | Ledger visibility becomes structured output. | Summary substitute. | Stage 04 outputs `registry_evaluation_ledger[]`. |
| Module V - Hunter Logic Gate | Applies archetype/surface/trigger/exclude logic. | Gate sequence survives. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION | Fit to batched Gemini calls. | Compiler deciding trigger status after the fact. | Stage 04 owns trigger decisions. |
| Module V - Hunter_Trigger parsing | Parses trigger syntax per registry row. | Conditions must be evaluated specifically. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION | Conditions array records basis. | Generic "condition not met". | Stage 04 includes parsing steps. |
| Module V - EXCLUDE_IF burden | Requires explicit control evidence. | Default false; only written proof flips controlled. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION, 05_OPERATOR_CHALLENGE | Enforce through HER_001 in prompt and validation. | Benefit-of-doubt exclusions. | Stage 04 and 05 audit exclusion basis. |
| Module V - condition-level ledger | Records conditions passed/failed. | No collapsing multiple conditions. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION | Schema `conditions[]` with basis. | Single vague reasoning sentence. | Stage 04 output must include condition-level detail. |
| Module V - five-state final_status | Assigns exactly one status. | TRIGGERED/CONTROLLED/NOT_TRIGGERED/NOT_APPLICABLE/INSUFFICIENT_EVIDENCE. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION, Schema Validation Layer | Compiler split arrays by status. | Legacy status names or omitted statuses. | Stage 04 enum must match schema. |
| Module V - HER_001 loading | References universal rule source. | Exclusion logic. | PATCH | 04_REGISTRY_LEDGER_EVALUATION | Bake into prompt; no runtime file dependency. | `hunter_engine_rules.runtime.json` requirement. | Stage 04 includes fixed HER_001 text. |
| Module V - Operator Challenge dependency | Requires challenge before compiler. | Ledger must be challenged and corrected. | PRESERVE | 05_OPERATOR_CHALLENGE, Runtime Orchestrator | Separate Stage 05 prompt over merged ledger. | Compiler running without challenge. | Stage 06 accepts post-challenge ledger only. |
| Module VI - source discovery | Hunts public footprint surfaces. | Terms/privacy/DPA/security/trust/subprocessors/docs/pricing/product/API paths. | MOVE_TO_CODE | Phase 3 Source Collector | Jina fetch and link spider own this. | Gemini browsing/search commands. | Evidence Refiner sees collected material only. |
| Module VI - browsing/search mandate | Directs model to use web/search tools. | Discovery goal survives. | PATCH + MOVE_TO_CODE | Phase 3 Source Collector | Search/grounding discovery only; admitted evidence requires collector/refiner admission. | Model-native browsing. | No prompt may ask model to browse. |
| Module VI - first-party filter | Excludes third-party summaries. | Target domain and qualifying governance only. | PRESERVE | Phase 3 Source Collector, 01_EVIDENCE_REFINER | Collector normalizes domains; Refiner classifies basis. | Press/investor/review sources as evidence. | Refiner prompt rejects non-qualifying sources. |
| Module VI - hosted governance exception | Allows linked company-specific hosted legal artifacts. | Link/control, company-specific text, governance artifact. | PRESERVE | Phase 3 Source Collector, 01_EVIDENCE_REFINER | Collector captures link path; Refiner labels source type. | Citing host brand instead of artifact type. | Refiner artifact inventory uses governance artifact type. |
| Module VI - artifact classes | Classifies core legal, governance, security, product, pricing, docs, signup. | Artifact taxonomy drives legal stack/absence. | PATCH | 01_EVIDENCE_REFINER, Schema Validation Layer | Align `artifact_class`/`artifact_type` with source schema. | Old unstructured text-only source list. | Refiner outputs `artifact_inventory[]`. |
| Module VI - artifact inventory | Builds inventory before evaluation. | Status/source/ingestion/evidence summary/absence basis. | PATCH | 01_EVIDENCE_REFINER | Use schema fields including status and admission metadata. | Inventory after threat conclusions. | Refiner locks inventory for later prompts. |
| Module VI - absence basis | Documents active search/review path for absent artifacts. | Absence only after active review/classification. | PATCH | 01_EVIDENCE_REFINER, 03_LEGAL_STACK_REVIEW | Absence basis from collector/refiner, not model search. | Failure to fetch treated as absence without basis. | Later prompts depend on `absence_basis`. |
| Module VI - minimum artifact threshold | Allows sparse-footprint warnings/halting. | Thin source warnings and safe abort. | MOVE_TO_CODE | Runtime Orchestrator, Phase 3 Source Collector | Orchestrator decides continue/abort with limitations. | Model self-aborting after fabricated search attempts. | Refiner may emit limitations; orchestrator gates. |
| Module VI - direct fetch failure handling | Retries/pivots/halt states. | Transparent access-failure classification. | MOVE_TO_CODE | Phase 3 Source Collector | Jina/fetch errors become structured statuses. | Snippet scraping as admitted evidence. | Evidence Refiner classifies `ACCESS_FAILED`/limited evidence. |
| Module VI - pasted/manual extraction | Ingests pasted public material/PDF manual extraction. | Pasted public material can be evidence with source type. | PATCH | Phase 3 Source Collector, 01_EVIDENCE_REFINER | Add `manual_urls` source mode and structured target_input. | Private/confidential content assumptions. | Refiner labels `PASTED_PUBLIC_MATERIAL`. |
| Module VII - company name hierarchy | Extracts target identity from URL/evidence. | Prefer explicit legal/product references over memory. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Schema target_profile controls fields. | Prior knowledge identity fill. | Stage 02 includes hierarchy. |
| Module VII - website/legal entity extraction | Finds website and legal entity. | Use admitted evidence only. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Unknowns stay unknown/limited. | Guessing legal entity from brand. | Stage 02 emits evidence-backed fields. |
| Module VII - HQ jurisdiction | Extracts HQ/local law cues. | Evidence-cued jurisdiction only. | PRESERVE | 02_TARGET_FEATURE_PROFILE, 04_REGISTRY_LEDGER_EVALUATION | Map to authority relevance later. | Legal opinion on governing law. | Stage 02 outputs jurisdiction fields. |
| Module VII - actual processing location | Identifies processing/data location if visible. | Separate declared HQ from processing location. | PRESERVE | 02_TARGET_FEATURE_PROFILE, Node 5B Backend Assembler | Confirmation question if internal/unknown. | Guessing cloud region. | Stage 02 flags visible processing location only. |
| Module VII - data sovereignty signature | Summarizes data location/control posture. | Evidence-backed sovereignty cues. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Make caveated if absent. | Overclaiming compliance. | Stage 02 includes field with limitations. |
| Module VII - primary claim | Captures public product claim. | Use direct claim from evidence. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Store citation/quote through feature fields. | Marketing paraphrase without source. | Stage 02 extracts claim. |
| Module VII - primary product six fields | Product name, user, function, mechanism, agent actor, agent brand name. | Coffee-test clarity. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Align with target schema. | Generic "AI platform" filler. | Stage 02 output must satisfy six fields. |
| Module VII - coffee-test standard | Forces plain explanation of product behavior. | A stranger can understand what product does. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Keep as output quality gate. | Abstract category labels replacing product mechanics. | Stage 02 validation note. |
| Module VII - prior knowledge firewall | Bars model memory about company. | Only admitted evidence. | PRESERVE | 00_SHARED_SYSTEM_PREAMBLE, 02_TARGET_FEATURE_PROFILE | Repeat across stages. | Known-company memory. | Stage 02 no-prior-knowledge rule. |
| Module VIII - multiplicity mandate | Allows multiple archetypes/surfaces per feature. | Do not force single classification. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Schema arrays. | One-label classification. | Stage 02 emits arrays. |
| Module VIII - no-cap rule | Captures all product features. | No top-N, no compression. | PRESERVE | 02_TARGET_FEATURE_PROFILE, 06_FINAL_COMPILER, React Renderer | Renderer filters view only. | Shortlisting. | Stage 02 and 06 include no-cap rule. |
| Module VIII - lowered threshold | Catches plausible product mechanics from evidence. | Classify feature if public footprint supports it. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Still evidence-bound. | Speculative features. | Stage 02 uses candidate/scratchpad discipline. |
| Module VIII - archetype guards | Applies Module III guards to features. | Mechanical reality over claims. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Use registry key vocab. | Claim-only misfires. | Stage 02 includes guard table. |
| Module VIII - compound rule | Multi-feature/multi-token products get compound mapping. | Feature-level granularity. | PRESERVE | 02_TARGET_FEATURE_PROFILE, 04_REGISTRY_LEDGER_EVALUATION | Keep features linked to threats later. | Collapsing product into single profile. | Stage 02 emits distinct feature IDs. |
| Module VIII - evidence absolute constraint | Every feature needs evidence quote/source. | No feature without admitted proof. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Schema validation enforces quote/source URL. | Product features from memory or inference. | Stage 02 required fields. |
| Module VIII - commercial scan | Captures market/delivery/commercial cues. | B2B/B2C/API/app/beta/public claims. | PATCH | 02_TARGET_FEATURE_PROFILE, Node 5B Backend Assembler | Commercial unknowns often become confirmation questions. | Vault prefill for unproven commercial internals. | Stage 02 extracts visible cues only. |
| Module VIII - feature map scratchpad | Records candidate reasoning before final map. | Transparent feature classification reasoning. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Align with `feature_map_scratchpad`. | Scratchpad as final report prose. | Stage 02 emits schema scratchpad if required. |
| Module VIII - CORE vs SECONDARY | Assigns feature role. | CORE if central to commercial product, SECONDARY if support/ancillary. | PRESERVE | 02_TARGET_FEATURE_PROFILE | Schema enum. | Free-form importance labels. | Stage 02 uses exact role enum. |
| Module IX - five-document requirement | Reviews ToS, Privacy Policy, DPA, AUP, SLA. | Exactly five legal_stack entries. | PRESERVE | 03_LEGAL_STACK_REVIEW, Schema Validation Layer | Missing docs still get entries. | Omitting absent docs. | Stage 03 must emit exactly five. |
| Module IX - artifact_inventory-only rule | Uses locked inventory, no new search. | Legal review consumes source bundle only. | PRESERVE | 03_LEGAL_STACK_REVIEW | No browsing. | Stage 03 search/fetch instructions. | Stage 03 inputs include inventory/evidence. |
| Module IX - covers extraction | Lists what each document visibly covers. | Evidence-backed covers only. | PRESERVE | 03_LEGAL_STACK_REVIEW | Covers null when absent. | Guessing standard clauses. | Stage 03 emits covers arrays/notes. |
| Module IX - misses field | Names concrete uncovered gaps. | Specific gap tied to product behavior. | PRESERVE | 03_LEGAL_STACK_REVIEW | Use False Belief Formula. | Vague "doesn't cover all risks". | Stage 03 misses quality gate. |
| Module IX - False Belief Formula | Produces precise redline language. | "[Document] does not cover [gap]..." logic. | PRESERVE | 03_LEGAL_STACK_REVIEW, 06_FINAL_COMPILER | Keep as legal-stack reasoning, not legal advice. | Compliance conclusion language. | Stage 03 includes formula. |
| Module IX - document_stack_redline | Captures claim/document mismatches. | QUOTE_VS_QUOTE, CLAIM_VS_ABSENCE, STACK_VS_REALITY. | PRESERVE | 03_LEGAL_STACK_REVIEW, 06_FINAL_COMPILER | Align to schema. | HTML-only redline. | Stage 03 emits structured redline. |
| Module IX - mismatch types | Names concrete mismatch categories. | Feature/document contradiction and absence. | PRESERVE | 03_LEGAL_STACK_REVIEW | Use schema enum if present. | Free-form mismatch sprawl. | Stage 03 prompt lists types. |
| Module IX - legal_stack_assessment scratchpad | Builds assessment blocks per doc. | Evidence status, source URL, absence basis, false belief. | PRESERVE | 03_LEGAL_STACK_REVIEW | Output as structured assessment if schema allows. | Hidden reasoning only. | Stage 03 emits assessment array. |
| Module IX - terminal validation | Blocks advance unless five entries complete. | Completeness gate. | MOVE_TO_SCHEMA_VALIDATION | Schema Validation Layer, Runtime Orchestrator | Validator enforces length and document types. | Terminal checkpoint lines. | Stage 03 prompt mentions acceptance gate, not terminal text. |
| Module X - every registry row | Requires evaluation of all active registry entries. | No skipped rows. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION | Batched with backend merge. | Sampling/top risks. | Stage 04 batch prompt returns every input row. |
| Module X - visible ledger requirement | Full ledger visible in audit. | Every row has entry/reasoning. | PATCH | 04_REGISTRY_LEDGER_EVALUATION, 06_FINAL_COMPILER, React Renderer | Technical audit log/report_data carry ledger summary/full record. | Plain-text only ledger. | Stage 04 structured ledger; Stage 06 compiles audit. |
| Module X - no summary substitute | Summary cannot replace row evaluations. | Completion statement insufficient. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION, Schema Validation Layer | Count/no-dup validation. | "All rows evaluated" without rows. | Stage 04 backend gate. |
| Module X - 5-state matrix | Applies status enum. | Same as Module V. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION | Split arrays downstream. | Legacy statuses. | Stage 04 exact enum. |
| Module X - anti-loophole rule | Prevents wrong NOT_APPLICABLE/NOT_TRIGGERED avoidance. | Matching archetype cannot be NA without explicit mismatch/threshold/exclusion. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION, 05_OPERATOR_CHALLENGE | Challenge reopens undercounts. | Lazy false negatives. | Stage 04/05 include undercount checks. |
| Module X - lethality mandate | Forces hard scrutiny when high-risk footprint and low triggers. | Recheck low triggered count under high-risk signals. | PRESERVE | 05_OPERATOR_CHALLENGE | Encapsulate in high_risk_checks. | Severity theater in final prose. | Stage 05 challenge prompt owns this. |
| Module X - guilty-by-absence rule | Absence-based rows can trigger from missing public controls. | Public footprint standard. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION, 05_OPERATOR_CHALLENGE | Requires `absence_basis`. | Private possible controls defeating trigger. | Stage 04 uses documented absence. |
| Module X - public consent-flow proof rule | Distinguishes clause assertion from public implementation proof. | Legal clause alone may not prove consent flow. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION | Evidence object records implementation proof/absence. | Treating ToS text as UI proof. | Stage 04 includes proof standard. |
| Module X - quote rule | Requires proof citations. | Quote or documented absence basis. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION, 06_FINAL_COMPILER | Final report stores excerpts, not raw full source. | Unsourced findings. | Stage 06 evidence subobject. |
| Module X - exclusion burden | HER_001 proof burden. | Explicit written control only. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION, 05_OPERATOR_CHALLENGE | Same as Module V. | Inferred controls. | Stage 04 exact exclusion basis. |
| Module X - feature reference resolution | Links rows to product features. | Feature refs must resolve to feature IDs. | PRESERVE | 04_REGISTRY_LEDGER_EVALUATION, 06_FINAL_COMPILER | Backend can validate refs. | Unlinked generic findings. | Stage 04/06 require feature refs. |
| Module X - Operator Challenge Gate | Mandatory self-correction. | PASS or REOPENED with corrected rows. | PRESERVE | 05_OPERATOR_CHALLENGE | Separate stage over merged ledger; backend re-merges corrections. | Challenge buried in compiler prose. | Stage 05 prompt file required in Phase 2B. |
| Module X - compiler staging | Passes TRIGGERED/CONTROLLED/INSUFFICIENT to compiler. | Important statuses survive. | PATCH | 06_FINAL_COMPILER | Findings split by status. | All three status types inside final `findings[]`. | Compiler prompt maps status arrays. |
| Module XI - hydrated findings | Creates full finding objects. | 19-field hydrated TRIGGERED findings. | PATCH | 06_FINAL_COMPILER | `findings[]` = TRIGGERED only; fields align with schema. | `true_gaps[]`, skinny findings. | Stage 06 hydration rules. |
| Module XI - no skinny true_gaps | Retires old skinny gap schema. | Full forensic record. | PRESERVE | 06_FINAL_COMPILER, Schema Validation Layer | Also forbid stale `true_gaps` key. | `true_gaps[]`. | Compiler prompt explicitly forbids it. |
| Module XI - pain derivation | Maps pain tier to category/depth. | Deterministic severity mapping. | PRESERVE | 06_FINAL_COMPILER | Use registry tier and evidence. | Invented severity. | Stage 06 includes mapping. |
| Module XI - evidence object | Derives source URL/artifact/proof/evidence mode. | Proof citation or documented absence. | PATCH | 06_FINAL_COMPILER | Include final evidence metadata per schemas. | Raw full scrape storage in final report. | Stage 06 evidence subobject. |
| Module XI - trigger_evaluation | Carries passed/failed conditions and exclude basis. | Preserve boolean logic trace. | PRESERVE | 06_FINAL_COMPILER | Copy from ledger, do not recompute. | Compiler changing statuses. | Stage 06 consumes post-challenge ledger. |
| Module XI - global synthesis check | Confirms counts, evidence, challenge, handoff readiness. | Pre-final consistency audit. | PATCH | 06_FINAL_COMPILER, Schema Validation Layer | Structured `technical_audit_log`, not terminal block. | Plain-text global synthesis as required terminal sequence. | Compiler emits audit object. |
| Module XI - prior knowledge firewall | Blocks external contamination in final outputs. | Wipe/rebuild if contaminated. | PRESERVE | 06_FINAL_COMPILER | Evidence refs only from admitted source bundle. | Press/investor/prior memory. | Stage 06 includes no external knowledge. |
| Module XI - no truncation | Emits every finding/feature/row. | No ellipses, no top-N. | PRESERVE | 06_FINAL_COMPILER, React Renderer, Schema Validation Layer | Validation checks lengths against ledger statuses. | Ellipses or "sample". | Compiler prompt includes no-truncation. |
| Module XI - controlled/insufficient handling | Old compiler filtered three statuses together. | Controlled and insufficient must not disappear. | PATCH | 06_FINAL_COMPILER | `controlled_rows[]` and `insufficient_evidence_rows[]`. | CONTROLLED/INSUFFICIENT inside `findings[]`. | Stage 06 split arrays. |
| Module XI - assembly route | Recommends remediation/document route. | Route logic based on findings. | PATCH | 06_FINAL_COMPILER, Node 5B Backend Assembler | Compiler emits assembly route; Node 5B builds handoff envelope. | Copy-paste handoff terminal payload. | Stage 06 route output only. |
| Module XI - Vault confirmation questions | Captures unknowns requiring founder confirmation. | Unknown internal/commercial facts become questions. | PATCH | 06_FINAL_COMPILER, Node 5B Backend Assembler | Model may emit questions only, no final prefill. | Fabricated prefill values. | Stage 06 emits `vault_confirmation_questions[]`. |
| Module XI - old Vault prefill logic | Model builds prefill suggestions. | Detection-to-routing concept survives. | MOVE_TO_NODE_5B | Node 5B Backend Assembler | Deterministic backend uses Vault Canonical Map. | Model-generated `vault_prefill_suggestions`. | Compiler prompt forbids prefill. |
| Module XII - HTML output | Emits law-firm-style HTML report. | Report sections and forensic completeness. | MOVE_TO_REACT | React Renderer, 06_FINAL_COMPILER | Compiler emits `report_data`; React renders 7+7 report. | Model-generated HTML. | Compiler prompt forbids HTML. |
| Module XII - machine JSON output | Emits final machine payload. | Structured diligence output. | PATCH | 06_FINAL_COMPILER, Schema Validation Layer | Use `diligence_compiler_output` schema. | Old exact JSON skeleton if stale. | Compiler outputs schema wrapper only. |
| Module XII - technical audit log | Captures internal mechanics, limitations, ledger/challenge. | Auditability survives. | PATCH | 06_FINAL_COMPILER, React Renderer | Structured `technical_audit_log{}` and full arrays. | Plain-text terminal audit as required output order. | Compiler emits audit object. |
| Module XII - assembly handoff | Prints handoff payload after JSON. | Handoff concept survives. | MOVE_TO_NODE_5B | Node 5B Backend Assembler | Node builds payload/envelope; compiler emits route/questions only. | Copy-paste Vault prefill block. | Compiler prompt forbids handoff construction if deterministic. |
| Module XII - final disclaimer | Prints disclaimer. | Exact disclaimer. | PATCH | 06_FINAL_COMPILER, React Renderer | Store and render through payload. | HTML-only disclaimer. | Compiler emits `disclaimer`. |
| Module XII - no-truncation validation | Final checklist for complete arrays. | No cap/no truncation. | PRESERVE | 06_FINAL_COMPILER, Schema Validation Layer, React Renderer | Validator checks counts; renderer filters only. | Truncated arrays. | Compiler acceptance gates include counts. |
| Module XII - terminal order | Requires fixed output sequence. | Separation of audit/machine/report concerns. | RETIRE | Runtime Orchestrator, React Renderer | Stage order and consumers replace terminal order. | Any prompt requiring terminal emission order. | Phase 2B prompts are JSON-only. |

## 5. Preserve Register

| Rule name | Original runtime location | Why it matters | Destination prompt/stage | Exact preservation note |
|---|---|---|---|---|
| Legal architecture / no legal advice firewall | Module I Section A | Prevents compliance/legal advice overclaiming. | 00 Shared, 06 Compiler, React | Preserve allowed/forbidden language and exact disclaimer. |
| Admitted evidence only | Module I Section D; Module X Section G | Keeps outputs grounded. | 00 Shared, 01 Refiner, 04 Registry, 06 Compiler | No stage may use non-admitted source material. |
| Absence mandate | Module I Section D; Module X | Makes public-governance absence evaluable. | 01 Refiner, 03 Legal, 04 Registry, 05 Challenge | Absence can trigger only after documented review/absence basis. |
| Zero-inference protocol | Module I Section D | Prevents product/compliance hallucination. | All prompts | If not in evidence buffer, treat as unavailable. |
| First-party source discipline | Module I Section D; Module VI | Excludes third-party summaries. | Source Collector, 01 Refiner | Only target domain, pasted public material, or qualifying hosted governance. |
| Hosted governance exception | Module I Section D; Module VI | Allows Termly/Vanta/etc. artifacts when company-controlled. | Source Collector, 01 Refiner | Cite artifact type, not host brand. |
| Artifact inventory discipline | Module VI Section C | Establishes evidence/absence substrate. | 01 Refiner | Every required surface gets status, source, ingestion method, summary, absence basis. |
| Target identification hierarchy | Module VII | Prevents wrong-company and memory-driven extraction. | 02 Target Feature | Extract company/entity/product only from admitted evidence. |
| Coffee-test standard | Module VII | Keeps product profile concrete. | 02 Target Feature | Product description must be understandable and mechanical. |
| Archetype guards | Module III; Module VIII | Prevents classification drift. | 02 Target Feature | Include misfire guards for all archetypes. |
| Surface vocabulary | Module III Section B | Enables registry and Vault mapping. | 02 Target Feature, 04 Registry, Node 5B | Use closed tokens and allow multiplicity. |
| No-cap feature mapping | Module VIII; Module XII | Prevents base-payload suppression. | 02 Target Feature, 06 Compiler, React | Emit all evidence-backed features; filters are view-only. |
| False Belief Formula | Module IX Section D | Produces sharp legal-stack redlines. | 03 Legal Stack Review | Preserve formula as non-advice public-footprint redline. |
| Hunter Logic Gate | Module V; Module X | Core registry reasoning engine. | 04 Registry Ledger | Preserve full gate over every row. |
| Hunter_Trigger parsing | Module V; Module X | Makes registry conditions auditable. | 04 Registry Ledger | Parse conditions individually; record basis. |
| EXCLUDE_IF burden | Module V; Module X | Prevents benefit-of-doubt controls. | 04 Registry Ledger, 05 Challenge | Default false unless explicit control evidence exists. |
| HER_001 | Module I/V/X | Hard non-trigger/exclusion logic. | 04 Registry Ledger | Bake into Stage 04; do not load missing file. |
| Operator Challenge Gate | Module X Section E | Reopens undercount/lazy false negatives. | 05 Operator Challenge | Separate stage after merged ledger, before compiler. |
| No-truncation rule | Module XI/XII | Ensures complete forensic record. | 06 Compiler, Schema Validation, React | No ellipses, no samples, no top-N. |

## 6. Patch Register

| Old runtime rule | Problem under new spine | Patch | Destination | Phase 2B instruction |
|---|---|---|---|---|
| Model performs native browsing/search. | Gemini stages receive admitted evidence; Jina Source Collector owns fetching. | PATCH + MOVE_TO_CODE. | Phase 3 Source Collector, 01 Evidence Refiner. | No prompt may tell the model to browse, search, fetch, crawl, click, or scrape. |
| Search snippets may become Evidence Buffer text. | Search/grounding is DISCOVERY_ONLY and never admitted evidence. | PATCH. | Source Collector, 01 Refiner. | Prompts may mention discovery candidates only as rejected/pending until admitted. |
| `source_mode = url | text | url_plus_text`. | Current schema/spine adds `manual_urls`. | PATCH. | Source Collector, Schema Validation. | Use `url | manual_urls | text | url_plus_text` everywhere input mode appears. |
| Raw scrape/evidence text travels into final output. | Full raw scrape is active-run only; final stores hash/excerpt/provenance/limitations/status. | PATCH. | Source Collector, 01 Refiner, 06 Compiler. | Prompt evidence objects use excerpts/refs, not full raw scrape persistence. |
| Model emits HTML report. | React renderer owns report UI. | MOVE_TO_REACT. | React Renderer. | Compiler emits `report_data`, never HTML. |
| Monolithic terminal output order. | Staged orchestrator and validators sequence work. | RETIRE order; preserve no-truncation. | Runtime Orchestrator. | Each prompt emits one JSON wrapper; no terminal-order instructions. |
| Model emits `vault_prefill_suggestions`. | Node 5B derives prefill deterministically. | MOVE_TO_NODE_5B / PATCH. | Node 5B, 06 Compiler. | Compiler may emit `vault_confirmation_questions[]` only. |
| Runtime may include stale Vault fields. | Vault Canonical Map controls exact groups/fields. | PATCH / RETIRE. | Node 5B, Schema Validation. | Forbid `meta`, `human_review`, wrong group placement, invented fields. |
| Findings mixed statuses together. | New final object splits status arrays. | PATCH. | 06 Compiler. | `findings[]` TRIGGERED only; controlled and insufficient are separate arrays. |
| Registry count may be fixed at 98. | Active loaded registry row count controls. | PATCH. | Runtime Orchestrator, 04 Registry, Validation. | Never hardcode 98; use supplied count. |
| Human review/HITL appears as diagnostic or Vault field. | `human_review` is not a Vault field. | PATCH. | 06 Compiler, Node 5B. | Allow diagnostic phrasing like `human_review_structure_absent`; prohibit Vault leakage. |
| HER_001 loaded from runtime/rules. | Missing/phantom artifact under new spine. | PRESERVE logic, PATCH loading. | 04 Registry. | Bake HER_001 into Stage 04 prompt. |

## 7. Move-to-Code Register

| Old runtime source | Why it moves to code | Future phase owner | Prompt implication |
|---|---|---|---|
| Module VI Jina/web/source fetch loop | Network execution is deterministic/orchestrated, not prompt reasoning. | Phase 3 Source Collector | Prompts receive collected source bundle only. |
| Link crawling and preferred directory discovery | Needs URL parsing, dedupe, caps, and fetch status. | Phase 3 Source Collector | Evidence Refiner classifies output, does not crawl. |
| URL dedupe and first-party URL normalization | Deterministic URL logic belongs outside model. | Phase 3 Source Collector | Prompts trust normalized candidate/admitted sources. |
| Raw source hashing | Requires reproducible hash computation. | Phase 3 Source Collector / backend | Prompts cite `source_hash` supplied in input. |
| Crawl caps and retry/failure handling | Operational safety and performance control. | Phase 3 Source Collector | Prompts consume limitations/status. |
| Artifact status assignment where deterministic | Fetch success/failure and URL zones are mechanical. | Source Collector + 01 Refiner | Prompt only handles semantic classification where needed. |
| Registry batch merge validation | Needs exact missing/duplicate threat_id validation. | Runtime Orchestrator / backend validator | Stage 04 returns batch rows; backend merges. |
| Row count validation | Active row count is runtime data. | Runtime Orchestrator / Schema Validation | Prompt receives `registry_count_loaded`; does not compute fixed count. |
| JSON schema validation | Mechanical conformance check. | Schema Validation Layer | Prompts are written to schemas; validators reject drift. |
| One-company ambiguity guard | Input-level routing and abort handling. | Runtime Orchestrator | Shared prompt assumes a validated single target. |
| Firestore stage persistence | State management. | Runtime Orchestrator / backend | Prompts do not write Firestore. |

## 8. Move-to-React Register

| Old runtime source | React responsibility | What compiler must emit instead |
|---|---|---|
| Module XII HTML report generation | Render DD report UI from structured payload. | `report_data{}` plus complete arrays and disclaimer. |
| Module XII law-firm-style visual layout | Executive/full report layout, typography, tables, filters. | Structured cover, exec memo, source review, feature map, threat summary, redline, route, audit data. |
| Module XII filtering/sorting/display | View-only filtering by tier/category/archetype/surface/status/lane/text. | Full base arrays with no suppression. |
| Module XII visual schedule/table display | Tables/cards for source review, findings, controlled rows, insufficient rows. | Full `findings[]`, `controlled_rows[]`, `insufficient_evidence_rows[]`, `technical_audit_log`. |
| Module XII "clear filters" behavior | Restore complete base payload after view filters. | No prompt-side filtering or prioritization. |
| Module IX/X redline and ledger presentation | Interactive legal stack and full forensic record display. | Structured `legal_stack`, `document_stack_redline`, `feature_to_threat_matrix`. |

## 9. Move-to-Node-5B Register

| Old runtime source | Node 5B responsibility | Vault Canonical Map constraint | What compiler may emit instead |
|---|---|---|---|
| Module XI `vault_prefill_suggestions` | Derive deterministic prefill from target/profile/features/findings. | Only `baseline`, `architecture`, `archetypes`, `compliance`, `status`, `submittedAt`. | `vault_confirmation_questions[]`, detected archetypes/surfaces, assembly route data. |
| Module XI exact Vault field routing | Route fields to exact group placement. | `integrations` and `output_ownership` under baseline; `agent_limits` under archetypes. | Evidence-backed signals only. |
| Module XI document route derivation where deterministic | Build assembly handoff route and compatibility envelope. | Prefill values carry basis/confidence/source_finding_ids. | `assembly_route{}` and finding document routes. |
| Module XII Assembly handoff envelope | Build `assembly_handoff` and `handoff_envelope`. | No invented fields; envelope schema controls metadata. | Compiler supplies route recommendation and questions. |
| Module XI prefill traceability | Attach source finding/feature basis to every prefill. | Every prefill traces to >=1 finding/feature. | Linked feature IDs, finding IDs, evidence refs. |
| Module XI confirmation question consumption | Convert unestablished material fields into founder questions. | Unknown internals/commercial facts become questions, not guesses. | `vault_confirmation_questions[]`. |

## 10. Retire Register

| Old runtime source | Why retired | Replacement if any |
|---|---|---|
| Model direct browsing/search execution | Violates staged Gemini/Jina architecture and key/source boundaries. | Phase 3 Source Collector using Jina and deterministic admission flow. |
| Search snippets as evidence | Search/grounding is DISCOVERY_ONLY. | Candidate discovery only; admitted evidence after Source Collector/Refiner. |
| Model HTML output | React renders report. | `report_data{}` and complete arrays. |
| Monolithic terminal output order | Orchestrator sequences stages; schemas validate each output. | Stage JSON wrappers plus React/Node 5B consumers. |
| Model-invented Vault fields | Vault Canonical Map controls exact shape. | Node 5B deterministic prefill. |
| Stale schema names | Regenerated schema files and `src/lib/schemas.js` control names. | Canonical wrapper keys in Section 13. |
| Hardcoded registry count | Active registry row count can change. | Dynamic `registry_count_loaded`. |
| Sales scanner fields | Outside Diligence Engine role. | None; forbid. |
| Prospect/signal fields | Signal context deprecated. | None; source bundle and target profile replace. |
| `true_gaps[]` skinny schema | Loses forensic detail and controlled/insufficient split. | Hydrated `findings[]`, `controlled_rows[]`, `insufficient_evidence_rows[]`. |
| `human_review` as Vault field | Vault map forbids it. | Diagnostic-only wording or route effect. |

## 11. Conflict Register

| Conflict ID | GPT Runtime says | Governing doc/schema says | Severity | Resolution | Phase 2B enforcement |
|---|---|---|---|---|---|
| C-001 | `source_mode` is `url | text | url_plus_text`. | Source schemas and Phase 0A controls include `manual_urls`. | High | Patch all input references. | Shared/source prompts use four-value enum. |
| C-002 | Model browses/searches. | Source Collector/Jina admits evidence; Gemini stages reason only. | Critical | Move execution to code. | "Do not browse" in every prompt. |
| C-003 | Search snippets can be ingested. | Search/grounding is DISCOVERY_ONLY. | Critical | Discovery candidate only, never evidence. | Evidence Refiner labels snippets non-admitted unless later fetched/admitted. |
| C-004 | Model emits HTML. | React renders from `report_data`. | Critical | Move rendering to React. | Compiler forbids HTML. |
| C-005 | Model builds Vault prefill. | Node 5B derives prefill from Vault Canonical Map. | Critical | Move prefill to backend. | Compiler forbids `vault_prefill_suggestions`. |
| C-006 | Runtime may reference stale Vault fields/groups. | Vault Map exact groups and field placement. | Critical | Retire stale fields and validate. | Node 5B/validation only. |
| C-007 | Old compiler filters TRIGGERED/CONTROLLED/INSUFFICIENT together. | Final schema splits arrays. | High | Patch compiler output. | Stage 06 status split. |
| C-008 | Terminal order governs output. | Orchestrator stage order and schemas govern execution. | Medium | Retire terminal order; preserve no-truncation. | JSON-only prompt outputs. |
| C-009 | Runtime/spine references current 98 row artifact. | Dynamic active registry count required. | High | Treat 98 as stale artifact metadata, not invariant. | Stage 04 says supplied dynamic count. |
| C-010 | Human review/HITL may appear in diagnostics/Vault. | `human_review` is forbidden Vault field. | High | Permit diagnostic only; forbid Vault key. | Compiler/Node 5B acceptance gates. |
| C-011 | Raw evidence text may appear in final report. | Final payload stores excerpt/hash/provenance/status, raw scrape active-run only. | High | Patch evidence handling. | Evidence/Compiler prompts avoid raw full-text persistence. |
| C-012 | Groq-only prompt artifacts exist. | Gemini-primary/provider-agnostic architecture. | Medium | Treat Groq docs as reference only. | New v2 prompts named per task, not copied. |

## 12. Destination Prompt Map

### 00_SHARED_SYSTEM_PREAMBLE.prompt.md

- Runtime units used: Module I identity/role boundary, legal firewall, evidence rules, absence mandate, zero-inference protocol; Module II one-company/public-only assumptions; Module III closed vocabulary note; Module XI/XII no-truncation.
- Rules preserved: The Interface identity; Diligence Engine/Hunter boundary; legal-language firewall; admitted evidence only; no prior memory; public-footprint standard; no-cap discipline.
- Rules patched: Terminal sequence becomes staged JSON-only execution; browsing becomes forbidden for Gemini prompts; `source_mode` includes `manual_urls`.
- Rules forbidden: Sales Scanner/Spear/prospect/signal context; legal advice; browsing/fetching; HTML output; Vault prefill; invented fields.
- Output impact: No substantive output wrapper; shared block must be embedded in later prompts.

### 01_EVIDENCE_REFINER.prompt.md

- Runtime units used: Module I evidence firewall and hosted governance exception; Module II evidence buffer lock; Module VI artifact inventory, artifact classes, absence basis, pasted/manual extraction.
- Rules preserved: First-party/pasted-only evidence; qualifying hosted governance; kill list; artifact inventory before evaluation; absence after review only.
- Rules patched: It refines Source Collector/Jina `raw_footprint`; it does not browse or search. Search/grounding candidates remain DISCOVERY_ONLY until admitted. Raw scrape full text stays active-run material.
- Rules forbidden: TRIGGERED/CONTROLLED/legal risk conclusions; registry evaluation; legal-stack conclusions; source discovery execution.
- Output impact: Emits `source_bundle` conforming to `sourceBundle.schema.json`.

### 02_TARGET_FEATURE_PROFILE.prompt.md

- Runtime units used: Module III archetype/surface/jurisdiction vocabulary; Module VII target identification and primary product; Module VIII archetype mapping/feature map.
- Rules preserved: Target hierarchy, legal entity/HQ/processing location, data sovereignty signature, primary claim, six-field primary product, coffee-test standard, feature multiplicity, CORE/SECONDARY, archetype guards, evidence quote/source for each feature.
- Rules patched: Uses admitted `source_bundle`; no source hunting; output aligns to `targetFeatureProfile.schema.json`.
- Rules forbidden: Legal-stack output, registry status, findings, Vault prefill, unsupported product features.
- Output impact: Emits `target_feature_profile`.

### 03_LEGAL_STACK_REVIEW.prompt.md

- Runtime units used: Module IX five-document requirement, artifact-inventory-only rule, covers, misses, False Belief Formula, mismatch types, redline, legal_stack_assessment.
- Rules preserved: Exactly five documents; absent docs remain entries; covers/misses grounded in artifact inventory; False Belief Formula.
- Rules patched: Terminal validation becomes schema validation; no browsing; output aligns to `legalStackReview.schema.json`.
- Rules forbidden: Registry conclusions, TRIGGERED statuses, legal advice/compliance conclusions, HTML redline.
- Output impact: Emits `legal_stack_review`.

### 04_REGISTRY_LEDGER_EVALUATION.prompt.md

- Runtime units used: Module I five-state matrix/HER_001; Module V registry protocol; Module X forensic logic gate; Module III vocabulary; Module VI absence basis; Module VIII feature refs; Module IX document redlines.
- Rules preserved: Every active row; Hunter Logic Gate; Hunter_Trigger parsing; condition-level ledger; EXCLUDE_IF burden; HER_001; public consent-flow proof; no summary substitute.
- Rules patched: Batched Gemini stage over supplied `registry_batch[]`; dynamic `registry_count_loaded`; HER_001 baked into prompt; search/browse forbidden.
- Rules forbidden: Fixed count 98; final report prose; compiling findings; new evidence; HTML; Vault fields.
- Output impact: Emits `registry_evaluation_ledger` batch wrapper conforming to `registryLedger.schema.json`.

### 05_OPERATOR_CHALLENGE.prompt.md

- Runtime units used: Module V Operator dependency; Module X Operator Challenge Gate, lethality mandate, high-risk checks, reopen/correct behavior.
- Rules preserved: Mandatory challenge after full merged ledger; PASS/REOPENED; undercount recheck; corrected rows only where needed.
- Rules patched: Separate prompt over merged ledger; backend applies corrections and revalidates counts.
- Rules forbidden: New evidence invention, browsing, compiling final findings, changing rows without evidence basis.
- Output impact: Emits `operator_challenge_gate` conforming to `operatorChallenge.schema.json`.

### 06_FINAL_COMPILER.prompt.md

- Runtime units used: Module XI hydrated findings, pain derivation, evidence object, trigger_evaluation, global synthesis, prior-knowledge firewall, no truncation, assembly route, confirmation questions; Module XII machine JSON, audit log, disclaimer.
- Rules preserved: Fully hydrated findings; no skinny `true_gaps`; pain mapping; evidence proof/absence; trigger evaluation trace; no truncation; disclaimer.
- Rules patched: `findings[]` includes TRIGGERED only; CONTROLLED and INSUFFICIENT_EVIDENCE go to separate arrays; `report_data` replaces HTML; `vault_confirmation_questions[]` replaces model prefill; technical audit is structured.
- Rules forbidden: HTML, `vault_prefill_suggestions`, Assembly handoff construction when deterministic, stale fields, fixed registry count, source browsing, search snippets as evidence.
- Output impact: Emits `diligence_compiler_output` conforming to `diligenceReport.schema.json`.

## 13. Schema Alignment Map

| Prompt | Output wrapper key | Schema file | Required top-level fields | Runtime fields patched | Forbidden fields |
|---|---|---|---|---|---|
| 01 Evidence Refiner | `source_bundle` | `sourceBundle.schema.json` | `run_id`, `source_mode`, `target_input`, `source_review`, `discovery_candidates`, `artifact_inventory`, `evidence_buffer`, `limitations` | `source_mode` adds `manual_urls`; raw scrape becomes admitted excerpts/hash/provenance. | Raw full scrape persistence, admitted search snippets, third-party summaries. |
| 02 Target Feature Profile | `target_feature_profile` | `targetFeatureProfile.schema.json` | `target_profile`, `primary_product`, `product_feature_map`, `raw_feature_candidates`, `feature_map_scratchpad`, `limitations` | `company_profile`/`classification` becomes target/product feature map. | Legal stack, findings, Vault fields. |
| 03 Legal Stack Review | `legal_stack_review` | `legalStackReview.schema.json` | `legal_stack`, `document_stack_redline`, `document_stack_synthesis`, `legal_stack_assessment`, `limitations` | Terminal scratchpad becomes structured assessment. | Registry statuses, HTML, legal conclusions. |
| 04 Registry Ledger | `registry_evaluation_ledger` | `registryLedger.schema.json` | `registry_batch_meta`, `registry_evaluation_ledger`, `batch_warnings` | Dynamic count and batch metadata; HER_001 baked in. | Fixed 98, final findings, report prose. |
| 05 Operator Challenge | `operator_challenge_gate` | `operatorChallenge.schema.json` | `operator_challenge_gate`, `corrected_ledger_entries` | Separate challenge output over merged ledger. | New evidence, compiler fields. |
| 06 Final Compiler | `diligence_compiler_output` | `diligenceReport.schema.json` | `diligence_run`, `source_bundle_summary`, `target_profile`, `primary_product`, `product_feature_map`, `legal_stack`, `document_stack_redline`, `threat_registry_summary`, `feature_to_threat_matrix`, `findings`, `controlled_rows`, `insufficient_evidence_rows`, `report_data`, `technical_audit_log`, `assembly_route`, `assembly_handoff`, `handoff_envelope`, `disclaimer` | HTML becomes `report_data`; combined findings split; prefill removed from model. | HTML, `vault_prefill_suggestions`, `true_gaps`, `sales_viability`, `signal_context`, `ghost_protection_profile`, `prospect_meta`. |

## 14. Vault Migration Notes

GPT Runtime Vault/Assembly logic is not copied directly. The runtime's useful concept is that diligence findings and product behavior route downstream document assembly and intake. The old prompt-native implementation, where the model builds final `vault_prefill_suggestions`, is superseded.

`docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md` controls Vault field names, group placement, prefill eligibility, Node 5B derivation, and confirmation boundaries. The model cannot emit final `vault_prefill_suggestions`. The model may emit `vault_confirmation_questions[]` for public-footprint gaps that matter to routing.

Vault group constraints:

- Allowed top-level groups: `baseline`, `architecture`, `archetypes`, `compliance`, plus `status` and `submittedAt`.
- `integrations` belongs under `baseline`.
- `output_ownership` belongs under `baseline`.
- `agent_limits` belongs under `archetypes`.
- No `meta` group.
- No `human_review` Vault field.
- HITL/human review may remain an operator diagnostic only, for example `human_review_structure_absent`, when tied to evidence and not emitted as a Vault payload key.
- No literal `is_companion` field unless the Vault map later adds it. Companion currently routes through `conversational_ui` plus derived route logic.

## 15. Source Collector Migration Notes

Module VI becomes a split responsibility. Source discovery, URL crawling, Jina fetches, retry handling, link dedupe, first-party normalization, manual URL execution, raw source hashing, crawl caps, and fetch failure statuses belong to the Phase 3 Source Collector. The Source Collector replaces native model browsing.

The Evidence Refiner prompt receives Source Collector output and preserves the semantic parts of Module VI: first-party discipline, hosted governance exception, artifact type/class assignment, artifact inventory, admission status, limitations, and absence basis. `manual_urls` is added as a source mode and should mean the collector fetches exactly the supplied public URLs rather than auto-spidering.

Search/grounding remains DISCOVERY_ONLY. It can identify candidate URLs, but snippets or search result text are not admitted evidence. Final payload evidence must carry admitted source metadata: source hash, source URL, zone, artifact class, extracted excerpt, limitations, status, and admission status. Full raw scrape text is active-run material only unless a later persistence phase explicitly changes that rule.

## 16. React Renderer Migration Notes

Module XII's report instructions move to React. The compiler must preserve report substance as `report_data`, not HTML. React owns the Executive Report and Full Forensic Record display, including source review, feature map, threat matrix, legal redline, registry findings, assembly route, and technical audit.

Executive Report 5A/5B is one section inside Part I Executive Report: 5A = Material Findings Highlights. 5B = compact Triggered Findings Schedule. It is not a separate report layer. The two report layers are Part I Executive Report and Part II Full Forensic Record. The full forensic record preserves no-cap arrays in memory. Filters are view-only; they may hide or sort DOM rows, but they must not mutate or reduce the base payload. Clear filters restores the complete payload.

## 17. Node 5B Migration Notes

Node 5B is deterministic backend/no-model. It derives Assembly/Vault handoff from the canonical map, the post-compiler diligence payload, and confirmation questions. It builds `vault_prefill_suggestions`, `assembly_handoff`, and `handoff_envelope`, then later phases may persist Firestore records.

The confirmation boundary is strict. Public footprint can prefill product behavior and visible routing facts; internal architecture, commercial facts, spend caps, model deployment details, and unverified operational controls become `vault_confirmation_questions[]`. Every prefill must trace to a feature/finding/source basis. No invented fields are allowed.

Firestore persistence targets are defined/deferred by the spine. Phase 2A does not create persistence code, Firebase writes, Gemini calls, Source Collector code, or Node 5B implementation.

## 18. Phase 2B Prompt Build Instructions

Phase 2B prompts must extract stage-specific operating instructions from this map. They must not paste the entire migration map, full contract spine, or full schema text into every prompt.

Prompt source priority rule for each staged prompt:

1. Use the migrated GPT Runtime rule from the Runtime Migration Map.
2. Apply the relevant regenerated schema.
3. Apply the shared preamble.
4. Do not import old Groq prompt wording unless it matches the map.

For `00_SHARED_SYSTEM_PREAMBLE.prompt.md`: use Module I identity, legal firewall, evidence firewall, absence mandate, zero-inference protocol, role boundary, and no-truncation discipline. Governing schema: none. Required shared blocks: identity, no legal advice, admitted evidence only, no browsing, no prior memory, public-footprint standard, JSON-only stage discipline. Forbidden content: HTML, Vault prefill, source hunting, sales/prospect language. Acceptance gate: safe to paste atop every stage prompt without changing output wrapper.

For `01_EVIDENCE_REFINER.prompt.md`: use Module VI artifact inventory and Module I evidence rules. Governing schema: `sourceBundle.schema.json`. Required shared blocks: evidence firewall, hosted governance exception, discovery-only search, raw scrape persistence boundary. Stage-specific rules: classify sources, build inventory, record limitations/absence basis, admit/reject evidence. Output wrapper: `source_bundle`. Forbidden content: TRIGGERED/CONTROLLED conclusions, legal risk findings, browsing instructions. Acceptance gate: schema fields complete and no legal/registry conclusions.

For `02_TARGET_FEATURE_PROFILE.prompt.md`: use Modules III, VII, VIII. Governing schema: `targetFeatureProfile.schema.json`. Required shared blocks: no inference, archetype vocabulary, surface vocabulary, archetype guards. Stage-specific rules: target hierarchy, primary product six fields, coffee test, CORE/SECONDARY, all evidence-backed features. Output wrapper: `target_feature_profile`. Forbidden content: legal_stack, registry statuses, Vault prefill. Acceptance gate: every feature has evidence quote/source and valid vocab.

For `03_LEGAL_STACK_REVIEW.prompt.md`: use Module IX. Governing schema: `legalStackReview.schema.json`. Required shared blocks: evidence-only, no legal advice, False Belief Formula. Stage-specific rules: exactly five docs; covers/misses; absent doc handling; mismatch types; document_stack_synthesis. Output wrapper: `legal_stack_review`. Forbidden content: registry evaluation, findings, HTML. Acceptance gate: exactly five document types with absent docs represented.

For `04_REGISTRY_LEDGER_EVALUATION.prompt.md`: use Modules V and X plus relevant Module III vocab. Governing schema: `registryLedger.schema.json`. Required shared blocks: Hunter Logic Gate, five-state matrix, HER_001, absence mandate, condition-level ledger, feature refs. Stage-specific rules: evaluate each input row once; parse Hunter_Trigger; apply EXCLUDE_IF burden; use dynamic count. Output wrapper: `registry_evaluation_ledger`. Forbidden content: report prose, compiler fields, HTML, fixed 98, new evidence. Acceptance gate: returned row count equals batch input count and every row has a final_status.

For `05_OPERATOR_CHALLENGE.prompt.md`: use Module X Section E and related Module V challenge dependency. Governing schema: `operatorChallenge.schema.json`. Required shared blocks: no new evidence, evidence-only correction, undercount/lethality check. Stage-specific rules: PASS or REOPENED; high_risk_checks; corrected entries by threat_id only. Output wrapper: `operator_challenge_gate`. Forbidden content: final findings, report_data, Vault fields. Acceptance gate: if reopened, corrections match existing threat IDs and explain basis.

For `06_FINAL_COMPILER.prompt.md`: use Module XI and patched Module XII. Governing schema: `diligenceReport.schema.json`. Required shared blocks: no truncation, no skinny gaps, evidence object, trigger evaluation trace, legal firewall, no HTML, no Vault prefill. Stage-specific rules: hydrate all TRIGGERED findings; split CONTROLLED and INSUFFICIENT_EVIDENCE; build `report_data`, `technical_audit_log`, `assembly_route`, `vault_confirmation_questions`, disclaimer. Output wrapper: `diligence_compiler_output`. Forbidden content: HTML, `vault_prefill_suggestions`, final Assembly handoff prefill, stale fields. Acceptance gate: counts match post-challenge ledger statuses.

## 19. Acceptance Gates for Phase 2B

- Evidence Refiner prompt must not mention TRIGGERED/CONTROLLED/legal risk conclusions.
- Target Feature prompt must not output legal_stack.
- Legal Stack prompt must output exactly five document types.
- Registry prompt must preserve Hunter Logic Gate and every-row mandate.
- Operator Challenge prompt must not invent new evidence.
- Compiler prompt must not emit HTML.
- Compiler prompt must not emit `vault_prefill_suggestions`.
- No prompt may ask the model to browse.
- No prompt may use search snippets as admitted evidence.
- No prompt may hardcode registry count 98.
- No prompt may emit stale sales/prospect fields.
- No prompt may invent Vault fields.
- Every prompt must use admitted evidence only and reject prior model memory.
- Every schema-producing prompt must name exactly one output wrapper.
- Compiler must split `findings[]`, `controlled_rows[]`, and `insufficient_evidence_rows[]`.
- React-only rendering responsibilities must not leak back into prompt text.

## 20. Phase 2A Verification

Files inspected:

- `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md`
- `docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md`
- `docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md`
- `docs/contracts/SCHEMA_REGENERATION_PLAN_v1.md`
- `src/lib/schemas.js`
- `docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md`
- `docs/prompts/diligence/PROMPT_INDEX.md`
- `docs/prompts/diligence/01_Target_Feature_Extraction.prompt.md`
- `docs/prompts/diligence/02_Legal_Stack_Review.prompt.md`
- `docs/prompts/diligence/03_Registry_Evaluation.prompt.md`
- `docs/prompts/diligence/04_Final_Compiler_And_Handoff.prompt.md`
- `data/runtime/registry.runtime.json`
- `data/runtime/registry_key.runtime.json`
- `data/runtime/runtime_status.json`
- `data/schemas/sourceBundle.schema.json`
- `data/schemas/diligenceReport.schema.json`
- `data/schemas/vault.schema.json`
- `data/schemas/assemblyOutput.schema.json`
- `data/schemas/targetFeatureProfile.schema.json`
- `data/schemas/legalStackReview.schema.json`
- `data/schemas/registryLedger.schema.json`
- `data/schemas/operatorChallenge.schema.json`
- `data/schemas/diligenceRunState.schema.json`
- `data/schemas/handoffEnvelope.schema.json`
- `data/schemas/schemaManifest.schema.json`

Governing docs checked:

- Contract Spine checked.
- Vault Canonical Map checked.
- Schema Regeneration Plan checked.

Schemas checked:

- All requested Diligence/Vault/Assembly/source/run/handoff/manifest schemas exist and were checked for required top-level fields.

GPT Runtime source used:

- Repo source of record at `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md`.

Files changed:

- `docs/prompts/diligence-v2/RUNTIME_MIGRATION_MAP_v1.md`

Confirmations:

- No final prompt files created.
- No schemas changed.
- No runtime code changed.
- No React UI changed.
- No Firebase config changed.
- No Cloudflare/provider files changed.
- No Gemini calls added.
- No Jina scraper code added.
- No Firestore writes added.
- No Source Collector code added.
