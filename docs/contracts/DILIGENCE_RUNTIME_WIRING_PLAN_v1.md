# DILIGENCE_RUNTIME_WIRING_PLAN_v1

## Status

Contract-level implementation map for wiring the Diligence v2 prompt chain into the Interface runtime.

This document is not implementation code.

It defines the execution order, runtime boundaries, validation gates, merge behavior, retry behavior, and backend handoff boundary that the implementation must follow.

## Governing documents

Build to these documents in this order:

```text
1. docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md
2. docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md
3. docs/contracts/NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md
4. functions/_prompts/diligence-v2/PROMPT_INDEX.md
5. data/schemas/compilerOutput.schema.json
6. data/runtime/registry_key.runtime.json
7. data/runtime/registry.runtime.json
```

If implementation convenience conflicts with the Contract Spine or Vault map, the contract wins.

## Non-negotiable runtime boundaries

```text
Node 0   Source Collector                    client/browser/Jina only
Node 0.5 Evidence Refiner                    Pages Function + Gemini
Node 1   Target + Feature Map                Pages Function + Gemini
Node 2   Legal Stack + Redline               Pages Function + Gemini
Node 3   Registry Ledger                     Pages Function + Gemini, batched
Node 4   Operator Challenge                  Pages Function + Gemini, merged ledger only
Node 5   Final Compiler                      Pages Function + Gemini
Node 5B  Deterministic Backend Assembler      backend only, no model
```

Hard boundary:

```text
Only Node 0 runs in the browser without a model key.
Every Gemini call runs server-side through a Pages Function.
Node 5B performs no Gemini/Groq/LLM call.
```

Forbidden runtime drift:

```text
- no VITE_ Gemini key
- no client-side model calls
- no model-generated vault_prefill_suggestions
- no model-generated assembly_handoff
- no model-generated handoff_envelope
- no prompt stage directly writes Firestore handoff records
- no React renderer mutates report arrays
```

## Source mode handling

Canonical `source_mode` values for the runtime are:

```text
url
text
url_plus_text
```

Multiple manual URLs are an input form, not a fourth canonical source mode.

Represent them as:

```json
{
  "source_mode": "url",
  "target_input": {
    "primary_url": "",
    "manual_urls": []
  }
}
```

If pasted public text is included alongside URL inputs, use:

```text
url_plus_text
```

If only pasted public text is supplied, use:

```text
text
```

Implementation note:

```text
Some prompt/schema drafts may still mention manual_urls as a source_mode enum. Runtime wiring must normalize to the Contract Spine enum before orchestrating the chain.
```

## High-level runtime sequence

```text
1. User submits URL(s) and/or pasted public text.
2. Client creates run_id and source input envelope.
3. Client runs Source Collector using Jina r.jina.ai.
4. Client stores raw run state locally and sends collected footprint to Node 0.5 Pages Function.
5. Node 0.5 returns source_bundle.
6. Client validates and persists Stage 0.5 output.
7. Client sends source_bundle to Node 1 Pages Function.
8. Node 1 returns target_feature_profile.
9. Client validates and persists Stage 1 output.
10. Client sends source_bundle + target_feature_profile to Node 2 Pages Function.
11. Node 2 returns legal_stack_review.
12. Client validates and persists Stage 2 output.
13. Client loads registry runtime and splits it into batches.
14. For each registry batch, client calls Node 3 Pages Function.
15. Backend/client merge layer concatenates registry batch ledgers.
16. Merge validator checks count, uniqueness, and row coverage.
17. Client sends full merged ledger to Node 4 Pages Function.
18. Node 4 returns operator_challenge_gate and corrected_ledger_entries.
19. Backend/client applies corrected entries by threat_id and revalidates ledger.
20. Client sends post-challenge ledger and prior stage outputs to Node 5 Pages Function.
21. Node 5 returns compiler_output.
22. Client validates compiler_output against compilerOutput.schema.json.
23. Backend Node 5B derives vault_prefill_suggestions, assembly_handoff, and handoff_envelope deterministically.
24. Backend writes final run records and handoff records to Firestore.
25. React renders report_data and forensic arrays without mutating them.
```

## Proposed Pages Functions

Create one server-side function per model-owned stage:

```text
functions/api/diligence-refine-evidence.js
functions/api/diligence-target-feature-profile.js
functions/api/diligence-legal-stack-review.js
functions/api/diligence-registry-ledger.js
functions/api/diligence-operator-challenge.js
functions/api/diligence-final-compiler.js
```

Do not create a model function for Node 5B.

Create deterministic backend modules for Node 5B:

```text
src/wrapper/diligence/node5b/deriveVaultPrefillSuggestions.js
src/wrapper/diligence/node5b/buildAssemblyHandoff.js
src/wrapper/diligence/node5b/createAssemblyHandoffEnvelope.js
src/wrapper/diligence/node5b/validateNode5BOutput.js
```

If Cloudflare Pages Functions cannot import from `src/` cleanly, mirror shared backend-safe modules under:

```text
functions/_shared/diligence/node5b/
```

But do not duplicate logic long-term. One canonical implementation must own Node 5B.

## Prompt loading plan

Pages Functions must load prompt text from:

```text
functions/_prompts/diligence-v2/00_SHARED_SYSTEM_PREAMBLE.prompt.md
functions/_prompts/diligence-v2/01_EVIDENCE_REFINER.prompt.md
functions/_prompts/diligence-v2/02_TARGET_FEATURE_PROFILE.prompt.md
functions/_prompts/diligence-v2/03_LEGAL_STACK_REVIEW.prompt.md
functions/_prompts/diligence-v2/04_REGISTRY_LEDGER_EVALUATION.prompt.md
functions/_prompts/diligence-v2/05_OPERATOR_CHALLENGE.prompt.md
functions/_prompts/diligence-v2/06_FINAL_COMPILER.prompt.md
```

Each model call must compose:

```text
shared preamble + stage prompt + JSON input payload
```

Do not inline prompt text into function code.

Do not duplicate prompt text across functions.

If bundling Pages Functions makes direct docs loading awkward, create a build-time prompt manifest:

```text
src/wrapper/diligence/prompts/promptManifest.js
```

The manifest must reference the committed prompt files and preserve exact content.

## Gemini provider plan

Use Gemini as primary model provider.

Runtime must use the server-side AI provider configuration already established for Gemini primary / Groq fallback.

Expected provider behavior:

```text
primary = Gemini Flash model configured in server environment
fallback = Groq only if explicitly enabled and contract-compatible
```

Rules:

```text
- no browser-visible model key
- no VITE_ model secret
- no provider-specific prompt drift
- no fallback output schema differences
- Gemini response must be parsed and validated before next stage
```

## Stage input/output contracts

### Node 0 — Source Collector

Input:

```json
{
  "run_id": "",
  "source_mode": "url",
  "target_input": {
    "primary_url": "",
    "manual_urls": [],
    "pasted_text_present": false,
    "submitted_at": ""
  },
  "pasted_text": ""
}
```

Output:

```text
raw_footprint
scrape_meta
zoned artifacts
limitations
```

Node 0 may preserve full raw scrape in active browser run state.

Final report payload should persist only:

```text
source_hash
source_url
zone
artifact_class
extracted_excerpt
limitations
```

unless full text persistence is intentionally enabled.

### Node 0.5 — Evidence Refiner

Input:

```text
run_id + source_mode + raw_footprint + scrape_meta + target_input
```

Output:

```text
source_bundle
```

Validator:

```text
sourceBundle.schema.json
```

Runtime gate:

```text
source_bundle.evidence_buffer[] non-empty OR limitations explain why.
No discovery-only material enters evidence_buffer[].
```

### Node 1 — Target Feature Profile

Input:

```text
source_bundle
registry_key archetypes/surfaces
```

Output:

```text
target_feature_profile
```

Validator:

```text
targetFeatureProfile.schema.json
```

Runtime gate:

```text
Every product_feature_map[] item has evidence_quote and feature_source_url.
Archetype and surface vocabulary must match registry_key.
linked_threat_ids[] should remain empty unless deterministic mapping is injected.
```

### Node 2 — Legal Stack Review

Input:

```text
source_bundle + target_feature_profile
```

Output:

```text
legal_stack_review
```

Validator:

```text
legalStackReview.schema.json
```

Runtime gate:

```text
legal_stack[] length === 5.
Document types are exactly ToS, Privacy Policy, DPA, AUP, SLA.
If exists=false, document_url="N/A" and covers=null.
```

### Node 3 — Registry Ledger

Input per batch:

```json
{
  "run_id": "",
  "batch_id": "REG-BATCH-001",
  "registry_rows": [],
  "registry_count_loaded": 30,
  "registry_total_count": 98,
  "registry_key": {},
  "source_bundle": {},
  "target_feature_profile": {},
  "legal_stack_review": {}
}
```

Output per batch:

```text
registry_batch_meta
registry_evaluation_ledger[]
batch_warnings[]
```

Validator:

```text
registryLedger.schema.json
```

Runtime gate per batch:

```text
registry_evaluation_ledger.length === registry_rows.length
one ledger entry per supplied row
batch_warnings[] strings only
no hardcoded 98
no row skipped because Status is Pending / Upcoming / Watch
```

Batch size recommendation:

```text
25 to 30 registry rows per call
```

Batch split must preserve registry order.

### Node 3 Merge

Merge is deterministic backend/client logic.

Input:

```text
registry batch outputs[]
full registry_rows[]
```

Output:

```text
merged registry_evaluation_ledger[]
```

Merge validation:

```text
merged_ledger.length === registry_total_count
no missing threat_id
no duplicate threat_id unless registry itself has duplicate and validator records warning
all supplied rows evaluated once
batch_warnings concatenated
```

Merged ledger metadata must include:

```json
{
  "is_merged_ledger": true,
  "batch_id": "FULL_RUN",
  "registry_total_count": 98,
  "registry_count_loaded": 98
}
```

This is required because Stage 05 refuses unmarked partial batch ledgers.

### Node 4 — Operator Challenge

Input:

```text
merged registry_evaluation_ledger[]
merged ledger metadata with is_merged_ledger=true
source_bundle
target_feature_profile
legal_stack_review
```

Output:

```text
operator_challenge_gate
corrected_ledger_entries[]
```

Validator:

```text
operatorChallenge.schema.json
```

Runtime gate:

```text
If result=FAIL_RETRY_REQUIRED, stop before compiler.
If result=REOPENED, apply corrected_ledger_entries[] by threat_id and revalidate ledger counts.
If result=PASS or PASS_WITH_WARNINGS, proceed to compiler.
```

Correction application:

```text
For each corrected entry:
  find existing ledger entry by threat_id.
  replace full entry.
  preserve count parity.
  record replacement in run audit.
```

If duplicate threat IDs exist, use entry_number disambiguation and raise warning/error according to Node 5B contract.

### Node 5 — Final Compiler

Input:

```text
post-challenge registry_evaluation_ledger[]
operator_challenge_gate
source_bundle
target_feature_profile
legal_stack_review
registry_rows[]
batch_warnings[]
```

Output:

```text
compiler_output
```

Validator:

```text
compilerOutput.schema.json
```

Runtime gate:

```text
findings.length === count(TRIGGERED)
controlled_rows.length === count(CONTROLLED)
insufficient_evidence_rows.length === count(INSUFFICIENT_EVIDENCE)
no vault_prefill_suggestions
no assembly_handoff
no handoff_envelope
disclaimer present verbatim
```

### Node 5B — Deterministic Backend Assembler

Input:

```text
compiler_output
Vault.js Canonical Map
handoff envelope validator
Node 5B contract
```

Output:

```text
vault_prefill_suggestions{}
assembly_handoff{}
handoff_envelope{}
Firestore writes
```

Validators:

```text
vault.schema.json
assemblyHandoff.schema.json if present
src/wrapper/contracts/handoffEnvelope.js::validateHandoffEnvelope
NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md acceptance checks
```

Runtime gate:

```text
No invented Vault fields.
No meta group.
No human_review field.
integrations under baseline only.
Every prefill traces to source_finding_ids[] or detected feature.
Unproven material fields remain vault_confirmation_questions[].
```

## Firestore persistence plan

Persist stage outputs under:

```text
interface_runs/{run_id}/stage_outputs/{stage_id}
```

Suggested stage IDs:

```text
source_collector
evidence_refiner
target_feature_profile
legal_stack_review
registry_batch_{n}
registry_merged_ledger
operator_challenge
final_compiler
node5b_assembler
```

Persist final handoff records only after Node 5B validation passes:

```text
interface_handoffs/{handoff_id}
interface_handoff_payloads/{handoff_id}
```

Do not write handoff records directly from Node 5 / compiler output.

## Run state model

The active runtime should maintain:

```json
{
  "run_id": "",
  "status": "initialized",
  "current_stage": "source_collector",
  "source_mode": "url",
  "target_input": {},
  "stage_outputs": {},
  "registry_batches": [],
  "merged_ledger_meta": {},
  "operator_challenge_result": "",
  "compiler_validation": {},
  "node5b_validation": {},
  "warnings": [],
  "errors": []
}
```

Recommended statuses:

```text
initialized
collecting_sources
refining_evidence
mapping_features
reviewing_legal_stack
evaluating_registry
merging_registry_batches
operator_challenge
compiling_report
assembling_handoff
completed
failed_retryable
failed_terminal
```

## Error handling and retries

Retryable failures:

```text
Gemini timeout
transient provider failure
JSON parse failure with recoverable raw response
schema validation failure caused by missing optional field
registry batch provider failure
```

Non-retryable / stop failures:

```text
no source input
no admitted evidence and no usable limitation path
registry runtime missing
registry_key missing
Operator Challenge FAIL_RETRY_REQUIRED
compiler output contains backend-owned fields
Node 5B invented Vault field
handoff envelope validation failure
```

Retry policy:

```text
Retry model stage once with same input and stricter repair instruction.
Never change facts between retries.
Never browse or collect new sources during repair retry.
If second validation fails, mark failed_retryable and surface operator error.
```

## JSON parsing discipline

Every Pages Function must:

```text
1. Call Gemini.
2. Extract JSON only.
3. Reject markdown fences/prose wrappers.
4. Parse JSON.
5. Validate against the stage schema.
6. Store raw model response for debugging only if safe and configured.
7. Store validated output as stage output.
```

Do not pass unvalidated model output to the next stage.

## Registry batching discipline

Batch generation rules:

```text
- preserve registry order
- include every supplied registry row
- do not filter by Status
- do not filter by Lane
- do not drop invalid legacy IDs
- include registry_total_count in every batch input
- include batch_id and batch_index
```

Batch IDs:

```text
REG-BATCH-001
REG-BATCH-002
REG-BATCH-003
REG-BATCH-004
```

Batch output must preserve entry numbers relative to global registry order where possible.

If Stage 04 emits local batch entry numbers, merge logic must normalize or preserve a `global_entry_number` field if schema allows.

Preferred implementation:

```text
Stage 04 input includes global row_position.
Stage 04 entry_number equals global row_position.
```

## Validator inventory

Required validators before runtime wiring is complete:

```text
validateSourceBundle
validateTargetFeatureProfile
validateLegalStackReview
validateRegistryLedgerBatch
validateMergedRegistryLedger
validateOperatorChallenge
validateCompilerOutput
validateNode5BAssemblerOutput
validateHandoffEnvelope
```

Validator locations can be:

```text
src/wrapper/diligence/validators/
functions/_shared/diligence/validators/
```

One canonical implementation must be selected before code wiring begins.

## Runtime file implementation map

Recommended new files for the implementation phase:

```text
src/wrapper/diligence/orchestrator/runDiligencePipeline.js
src/wrapper/diligence/orchestrator/runSourceCollector.js
src/wrapper/diligence/orchestrator/runGeminiStage.js
src/wrapper/diligence/orchestrator/runRegistryBatches.js
src/wrapper/diligence/orchestrator/mergeRegistryLedgers.js
src/wrapper/diligence/orchestrator/applyOperatorCorrections.js
src/wrapper/diligence/orchestrator/validateStageOutput.js
src/wrapper/diligence/orchestrator/persistStageOutput.js
```

Recommended shared server files:

```text
functions/_shared/diligence/loadPrompt.js
functions/_shared/diligence/callGemini.js
functions/_shared/diligence/parseJsonOnly.js
functions/_shared/diligence/stageSchemas.js
functions/_shared/diligence/registryRuntime.js
```

Recommended API functions:

```text
functions/api/diligence-refine-evidence.js
functions/api/diligence-target-feature-profile.js
functions/api/diligence-legal-stack-review.js
functions/api/diligence-registry-ledger.js
functions/api/diligence-operator-challenge.js
functions/api/diligence-final-compiler.js
```

Recommended UI integration files:

```text
src/wrapper/ui/DiligenceRunPanel.jsx
src/wrapper/ui/DiligenceProgressTimeline.jsx
src/wrapper/ui/DiligenceReportRenderer.jsx
src/wrapper/ui/DiligenceErrorPanel.jsx
```

Do not start UI polishing before orchestration and validation pass.

## Runtime acceptance tests

Minimum test scenarios:

### Test 1 — text-only minimal footprint

Input:

```text
source_mode=text
pasted public product/legal text only
```

Expected:

```text
Node 0 skipped or text-wrapped
Node 0.5 emits source_bundle with manual_text evidence
Stage chain completes or records limitations honestly
```

### Test 2 — URL with sparse governance

Input:

```text
single public URL
homepage/product pages visible
legal pages absent or thin
```

Expected:

```text
legal_stack has exactly five entries
DPA/AUP/SLA absent if absence basis exists
registry ledger evaluates all rows
compiler no-cap checks pass
```

### Test 3 — full registry batching

Input:

```text
registry.runtime.json current full row set
```

Expected:

```text
all batches complete
merged ledger count equals registry_total_count
Stage 05 accepts merged ledger only
no top-N output
```

### Test 4 — operator challenge correction

Input:

```text
mock ledger with one lazy NOT_TRIGGERED absence-based row
```

Expected:

```text
Stage 05 REOPENED
corrected_ledger_entries[] one-to-one with reopened_rows[]
merge replaces row
count preserved
```

### Test 5 — Node 5B Vault boundary

Input:

```text
compiler_output with findings and vault_confirmation_questions
```

Expected:

```text
Node 5B derives only literal Vault fields
no meta
no human_review
no architecture.integrations
unproven internals remain questions
handoff envelope validates
```

## Build order after this plan

Implement in this order:

```text
1. Stage schema loader + JSON validator utilities
2. Prompt loader + Gemini call wrapper
3. Source Collector normalization
4. Stage 0.5/1/2 API functions
5. Registry batching + Stage 3 API function
6. Merge validator
7. Stage 4 API function + correction merge
8. Stage 5 compiler API function + compiler schema validation
9. Node 5B deterministic assembler
10. Firestore persistence
11. React report renderer
12. End-to-end test harness
```

Do not jump to UI or renderer before stages and validators are stable.

## Stop conditions

Stop implementation and return to contract review if any of these appear:

```text
- a prompt output needs backend-owned fields to validate
- source_mode enum conflict resurfaces
- registry row count is hardcoded in code
- Stage 05 receives unmerged batch ledger
- Node 5 emits Vault prefill
- Node 5B cannot trace prefill to finding/feature basis
- handoff envelope validation fails
- renderer needs to mutate findings arrays to display report
```

## Final rule

The runtime is allowed to be slow and verbose in v1.

It is not allowed to be contract-loose.

Correctness order:

```text
1. source firewall
2. stage boundary integrity
3. no-cap registry coverage
4. schema validation
5. Node 5 / Node 5B separation
6. renderer usability
7. speed/cost optimization
```

*End of DILIGENCE_RUNTIME_WIRING_PLAN_v1.*
