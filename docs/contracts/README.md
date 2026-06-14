# Lex Nova Interface Contracts

This folder contains governing contracts for the Interface Sandbox and Diligence Engine.

## Current governing stack

Read in this order when implementing Diligence v2:

1. `INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md`
   - Canonical operating contract for the Diligence Engine.
   - Controls source admission, stage ownership, schema boundaries, prompt rebuild, renderer structure, validation gates, and handoff boundaries.

2. `FUNCTIONAL_ASSEMBLY_INTAKE_VAULT_v1.md`
   - Governing sub-spine for the post-Stage-9 / pre-Assembly functional intake form.
   - Controls `data/schemas/vault.schema.json`, functional question sections, expanded technical architecture, Assembly handoff intake, source trace, and the nested strict `vault_payload` boundary.
   - Supersedes `VAULT_JS_CANONICAL_MAP_v1.md` only for the user-facing intake form and Assembly instruction layer.

3. `VAULT_JS_CANONICAL_MAP_v1.md`
   - Governing sub-spine for the nested `vault_payload`, Vault prefill derivation, and the prefill-vs-confirmation honesty line.
   - Derived from literal `docs/reference/vault.js` payload.
   - Remains authoritative for exact legacy Vault field derivation unless superseded by `FUNCTIONAL_ASSEMBLY_INTAKE_VAULT_v1.md`.

4. `NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md`
   - Defines the deterministic backend bridge between Stage 06 compiler output and the Assembly engine.
   - Node 5B derives `vault_prefill_suggestions`, builds `assembly_handoff`, wraps it in `handoff_envelope`, and writes handoff records.
   - Node 5B must not call Gemini, Groq, or any LLM.

5. `DILIGENCE_RUNTIME_WIRING_PLAN_v1.md`
   - Contract-level implementation map for wiring the v2 chain into the runtime.
   - Controls execution order, Pages Function boundaries, validation gates, registry batching/merge, retry behavior, and Firestore persistence boundaries.

6. `REPO_HYGIENE_AUDIT_v2_GITHUB_MAIN.md`
   - GitHub-main repo hygiene audit.
   - Classifies active/reference/legacy files and records cleanup priorities.

## Supporting reference material

These are retained as source/reference material, not active runtime authority:

- `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md`
- `docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md`
- `docs/reference/vault.js`
- `functions/_prompts/diligence-v2/RUNTIME_MIGRATION_MAP_v1.md`
- `functions/_prompts/diligence-v2/PROMPT_ALLOCATION_MATRIX_v1.md`
- `functions/_prompts/diligence-v2/PROMPT_SOURCE_EXTRACTION_PACKETS_v1.md`
- `SCHEMA_REGENERATION_PLAN_v1.md`

If supporting reference material conflicts with the Contract Spine, Functional Assembly Intake Vault, Vault map, Node 5B contract, or runtime wiring plan, the current contract stack controls.

## Authority rule

If implementation files, old schemas, old prompts, runtime notes, or README language conflict with these contracts, the contracts control until amended.

For the functional Diligence-to-Assembly intake form, `FUNCTIONAL_ASSEMBLY_INTAKE_VAULT_v1.md` controls.

For nested Vault payload field names, group placement, and Node 5B derivation, `VAULT_JS_CANONICAL_MAP_v1.md` controls unless superseded by the Functional Assembly Intake Vault contract.

For Stage 06 / Node 5 compiler output, `data/schemas/compilerOutput.schema.json` controls.

For the final post-Node-5B report/handoff object, `data/schemas/diligenceReport.schema.json` or its successor final report schema controls.

## Current phase status

- Phase 0A committed the initial contract spine and Vault canonical map.
- Phase 1 regenerated core schema contracts.
- Phase 2 rebuilt the Diligence v2 prompt chain.
- Phase 2D added the prompt index, compiler output schema, Node 5B contract, and runtime wiring plan.
- Phase 2E-0 created the GitHub-main repo hygiene audit and began cleanup of stale documentation/status/schema pointers.
- Stage 9 v2 is the human-readable report compiler layer.
- The Vault schema is now the Functional Assembly Intake Vault between Diligence and Final Assembly.
- Runtime Stage 10 mapping must be rebuilt after field-level Diligence-to-Vault mapping is locked.

## Non-negotiables

- No AI provider key in React.
- No `VITE_GEMINI_API_KEY`.
- Gemini/Groq calls only through server-side Pages Functions.
- Groq is optional fallback/reference only unless a later contract changes that.
- Source discovery is not evidence.
- Google Search/Gemini grounding may be discovery-only; admitted first-party/Jina/user-provided public material is the evidence base.
- Canonical `source_mode` values are `url`, `text`, and `url_plus_text`.
- `manual_urls` is an input form under `target_input.manual_urls[]`, not a fourth `source_mode`.
- Vault prefill is backend-derived.
- The model must not invent Vault field names.
- Node 5 emits `vault_confirmation_questions[]` only.
- Node 5B deterministically derives `vault_prefill_suggestions`, `assembly_handoff`, and `handoff_envelope`.
- The functional intake form may contain Assembly instructions that are not valid `vault_payload` fields.
- Assembly instructions must not be forced into `vault_payload` unless a matching Vault path exists.
- The base diligence payload must not suppress findings, controlled rows, insufficient-evidence rows, evidence, limitations, or uncertainty.
