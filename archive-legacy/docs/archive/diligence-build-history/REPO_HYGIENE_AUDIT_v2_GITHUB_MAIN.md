# REPO_HYGIENE_AUDIT_v2_GITHUB_MAIN

## 1. Executive Verdict

Verdict: **dirty but manageable**.

This audit was performed against GitHub `main` only. The prior local-worktree audit is not authoritative because it was run against a stale Codex worktree and falsely reported active files as missing.

Current GitHub `main` **does contain** the modern v2 authority set:

```text
docs/contracts/NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md
docs/contracts/DILIGENCE_RUNTIME_WIRING_PLAN_v1.md
docs/prompts/diligence-v2/PROMPT_INDEX.md
docs/prompts/diligence-v2/00_SHARED_SYSTEM_PREAMBLE.prompt.md
docs/prompts/diligence-v2/01_EVIDENCE_REFINER.prompt.md
docs/prompts/diligence-v2/02_TARGET_FEATURE_PROFILE.prompt.md
docs/prompts/diligence-v2/03_LEGAL_STACK_REVIEW.prompt.md
docs/prompts/diligence-v2/04_REGISTRY_LEDGER_EVALUATION.prompt.md
docs/prompts/diligence-v2/05_OPERATOR_CHALLENGE.prompt.md
docs/prompts/diligence-v2/06_FINAL_COMPILER.prompt.md
data/schemas/compilerOutput.schema.json
```

The repo is **not blocked**, but runtime implementation should not begin until a short cleanup pass fixes stale docs/status/schema mappings.

Biggest risks:

| Risk | Severity | Evidence | Why it matters |
|---|---:|---|---|
| README still presents the old Groq prompt tree as active Diligence stage prompt templates | High | `README.md` still says templates are under `docs/prompts/diligence/` and subordinate to the Groq sandbox runtime. | New implementers may wire the old four-prompt Groq tree instead of the v2 Gemini prompt chain. |
| Runtime manifest and artifact-status UI still mark Groq sandbox runtime as required/installed | High | `runtime_artifacts_manifest.json` and `artifactStatus.js` mark `diligence_groq_sandbox_runtime` as required. | The UI/runtime surface overstates a legacy reference file as active required architecture. |
| `src/lib/schemas.js` maps `diligence_compiler_output` to `diligenceReport.schema.json`, not `compilerOutput.schema.json` | High | `src/lib/schemas.js` lacks `compilerOutput` and routes compiler output to final report schema. | Stage 06 validation will target the wrong schema and may reintroduce Node 5 / Node 5B collapse. |
| `compilerOutput.schema.json` and `sourceBundle.schema.json` still allow `manual_urls` as a `source_mode` enum | High | Wiring plan says `manual_urls` is an input form, not a canonical `source_mode`. | Runtime validation can lock in the wrong input contract. |
| Old `docs/prompts/diligence/` tree still exists and includes model-owned final compiler/handoff language | Medium/High | Old index says `04_Final_Compiler_And_Handoff.prompt.md` produces `assembly_handoff`. | Old prompt tree conflicts with Node 5B deterministic assembler boundary if reused. |
| Handoff JSON schema and JS validator status enums differ | Medium | JSON schema allows `created` and `queued`; JS validator only allows `draft`, `ready`, `pushed`, `received`, `failed`. | Future Node 5B envelope validation can pass in one validator and fail in another. |

Blunt recommendation: **do Phase 2E-0B cleanup before implementation**. Do not delete anything yet. Update README, manifest, artifact status, schema mapping, and source-mode enum drift first.

---

## 2. Audit Scope and Method

Audit source: GitHub default branch `main` for `LexNovaHQ/interface-sandbox`.

This audit did **not** use local Codex worktrees.

GitHub files inspected directly:

```text
README.md
.env.example
package.json
docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md
docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md
docs/contracts/NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md
docs/contracts/DILIGENCE_RUNTIME_WIRING_PLAN_v1.md
docs/contracts/README.md
docs/prompts/diligence-v2/PROMPT_INDEX.md
docs/prompts/diligence-v2/00_SHARED_SYSTEM_PREAMBLE.prompt.md
docs/prompts/diligence-v2/06_FINAL_COMPILER.prompt.md
docs/prompts/diligence/PROMPT_INDEX.md
data/runtime/runtime_artifacts_manifest.json
data/schemas/compilerOutput.schema.json
data/schemas/sourceBundle.schema.json
data/schemas/handoffEnvelope.schema.json
src/lib/schemas.js
src/wrapper/runtime/artifactStatus.js
src/wrapper/contracts/handoffEnvelope.js
```

Searches performed through GitHub connector:

```text
sales_viability signal_context ghost_protection_profile true_gaps prospect_meta
manual_urls source_mode
00_SHARED_SYSTEM_PREAMBLE 01_EVIDENCE_REFINER 06_FINAL_COMPILER
```

No files were deleted, moved, or renamed.

---

## 3. Current Active Architecture

The active runtime architecture is the Gemini-primary Diligence v2 chain.

Current v2 prompt index governs the seven-stage chain under `docs/prompts/diligence-v2/` and says it replaces the older Groq-stage prompt index.

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

The runtime wiring plan confirms:

```text
Only Node 0 runs in the browser without a model key.
Every Gemini call runs server-side through a Pages Function.
Node 5B performs no Gemini/Groq/LLM call.
```

The Node 5B contract confirms the hard boundary:

```text
Node 5 / Stage 06 = compiler output + vault_confirmation_questions[]
Node 5B = vault_prefill_suggestions + assembly_handoff + handoff_envelope + Firestore writes
```

The v2 index also locks schema boundaries:

```text
Stage 06 → data/schemas/compilerOutput.schema.json
Final post-Node-5B object → data/schemas/diligenceReport.schema.json or successor final report schema
```

This architecture is correct. The cleanup job is to make README/status/schema registry match it.

---

## 4. Active File Inventory

| Path | Classification | Current job | Risk if removed |
|---|---|---|---|
| `docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md` | ACTIVE / NEEDS_UPDATE | Core DAG and node ownership. | Critical: loses governing architecture. |
| `docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md` | ACTIVE | Literal Vault map and Node 5B field boundary. | Critical: Vault drift returns. |
| `docs/contracts/NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md` | ACTIVE | Deterministic assembler contract; no model calls; derives prefill/handoff/envelope. | Critical. |
| `docs/contracts/DILIGENCE_RUNTIME_WIRING_PLAN_v1.md` | ACTIVE | Execution order, validation gates, batching, merge, Node 5B boundary. | Critical. |
| `docs/prompts/diligence-v2/PROMPT_INDEX.md` | ACTIVE | v2 prompt-chain index and stage boundary map. | High. |
| `docs/prompts/diligence-v2/00_SHARED_SYSTEM_PREAMBLE.prompt.md` | ACTIVE | Shared preamble injected into every v2 model stage. | High. |
| `docs/prompts/diligence-v2/01_EVIDENCE_REFINER.prompt.md` | ACTIVE | Stage 01 evidence admission prompt. | High. |
| `docs/prompts/diligence-v2/02_TARGET_FEATURE_PROFILE.prompt.md` | ACTIVE | Stage 02 target/feature mapping prompt. | High. |
| `docs/prompts/diligence-v2/03_LEGAL_STACK_REVIEW.prompt.md` | ACTIVE | Stage 03 legal stack review prompt. | High. |
| `docs/prompts/diligence-v2/04_REGISTRY_LEDGER_EVALUATION.prompt.md` | ACTIVE | Stage 04 registry ledger prompt. | Critical. |
| `docs/prompts/diligence-v2/05_OPERATOR_CHALLENGE.prompt.md` | ACTIVE | Stage 05 operator challenge prompt. | Critical. |
| `docs/prompts/diligence-v2/06_FINAL_COMPILER.prompt.md` | ACTIVE | Stage 06 compiler-only prompt. | Critical. |
| `data/schemas/compilerOutput.schema.json` | ACTIVE / NEEDS_UPDATE | Stage 06 compiler-only schema. | Critical, but source-mode enum needs patch. |
| `data/schemas/diligenceReport.schema.json` | ACTIVE | Final post-Node-5B or final report schema. | Critical; do not use as Stage 06 validator. |
| `data/schemas/sourceBundle.schema.json` | ACTIVE / NEEDS_UPDATE | Stage 01/source bundle schema. | High; source-mode enum needs reconciliation. |
| `data/schemas/targetFeatureProfile.schema.json` | ACTIVE | Stage 02 schema. | High. |
| `data/schemas/legalStackReview.schema.json` | ACTIVE | Stage 03 schema. | High. |
| `data/schemas/registryLedger.schema.json` | ACTIVE | Stage 04 schema. | Critical. |
| `data/schemas/operatorChallenge.schema.json` | ACTIVE | Stage 05 schema. | Critical. |
| `data/schemas/assemblyOutput.schema.json` | ACTIVE | Node 5B/Assembly handoff schema. | Critical. |
| `data/schemas/vault.schema.json` | ACTIVE | Vault payload schema. | Critical. |
| `data/schemas/handoffEnvelope.schema.json` | ACTIVE / NEEDS_UPDATE | Handoff envelope schema. | Medium; enum mismatch with JS validator. |
| `data/runtime/registry.runtime.json` | ACTIVE | Current registry runtime artifact. | Critical. |
| `data/runtime/registry_key.runtime.json` | ACTIVE | Controlled vocabulary runtime. | Critical. |
| `data/runtime/runtime_artifacts_manifest.json` | ACTIVE / NEEDS_UPDATE | Artifact status manifest. | High; marks old Groq runtime required. |
| `src/lib/schemas.js` | ACTIVE / NEEDS_UPDATE | Schema path/canonical map. | High; compiler maps to wrong schema. |
| `src/wrapper/runtime/artifactStatus.js` | ACTIVE / NEEDS_UPDATE | Runtime artifact status displayed in UI. | High; marks old Groq runtime required. |
| `src/wrapper/contracts/handoffEnvelope.js` | ACTIVE / NEEDS_UPDATE | JS handoff envelope helper/validator. | Medium; enum mismatch with JSON schema. |
| `functions/api/system-status.js` | ACTIVE | Safe provider/config status endpoint. | Medium. |
| `functions/api/ai-smoke-test.js` | ACTIVE | Fixed Gemini smoke test only. | Medium. |
| `functions/_shared/aiProviderConfig.js` | ACTIVE | Server-side provider config/status. | Medium. |
| `src/wrapper/config/firebaseConfig.js` | ACTIVE | Client Firebase public config detection. | Medium. |
| `src/wrapper/bridge/firebaseBridge.js` | ACTIVE | Firebase/Firestore readiness bridge; no engine writes. | Medium. |
| `src/wrapper/ui/SystemStatusPanel.jsx` | ACTIVE | Runtime/system status UI. | Medium. |
| `README.md` | ACTIVE / NEEDS_UPDATE | Main project entrypoint. | High if stale. |
| `.env.example` | ACTIVE / NEEDS_UPDATE | Env template. | Medium; model/source capability values need review. |
| `package.json` | ACTIVE | Build/dev scripts and dependencies. | Critical. |

---

## 5. Reference-Only Inventory

| Path | Classification | Why retained | Cleanup note |
|---|---|---|---|
| `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md` | REFERENCE_ONLY | Canonical monolith source material used to reconstruct v2 prompts. | Do not delete until v2 implementation stabilizes. |
| `docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md` | REFERENCE_ONLY / ARCHIVE_CANDIDATE | Prior Groq sandbox doctrine, still referenced by README/manifest/v2 index as migration source. | Should stop being marked required; archive later. |
| `docs/reference/vault.js` | REFERENCE_ONLY / ACTIVE SOURCE | Literal source for Vault canonical map. | Keep until Node 5B is implemented and validated. |
| `docs/prompts/diligence-v2/RUNTIME_MIGRATION_MAP_v1.md` | REFERENCE_ONLY / ACTIVE BUILD SOURCE | Migration map from old runtime to v2. | Keep. |
| `docs/prompts/diligence-v2/PROMPT_ALLOCATION_MATRIX_v1.md` | REFERENCE_ONLY / ACTIVE BUILD SOURCE | Stage allocation source. | Keep. |
| `docs/prompts/diligence-v2/PROMPT_SOURCE_EXTRACTION_PACKETS_v1.md` | REFERENCE_ONLY / ACTIVE BUILD SOURCE | Source extraction packets used to build final prompts. | Keep. |
| `docs/contracts/SCHEMA_REGENERATION_PLAN_v1.md` | REFERENCE_ONLY | Historical schema regeneration/audit trail. | Archive only after schema utilities stabilize. |

---

## 6. Legacy / Redundant Prompt Inventory

Old prompt tree: `docs/prompts/diligence/`

| Path | Classification | Replaced by | Current risk | Recommended action |
|---|---|---|---|---|
| `docs/prompts/diligence/PROMPT_INDEX.md` | ARCHIVE_CANDIDATE / NEEDS_UPDATE | `docs/prompts/diligence-v2/PROMPT_INDEX.md` | Says old Groq prompt templates are operational and governed by Groq runtime. | Archive later; add README warning now. |
| `docs/prompts/diligence/01_Target_Feature_Extraction.prompt.md` | ARCHIVE_CANDIDATE | `02_TARGET_FEATURE_PROFILE.prompt.md` | Old output shape and Groq-era framing. | Preserve until archive phase. |
| `docs/prompts/diligence/02_Legal_Stack_Review.prompt.md` | ARCHIVE_CANDIDATE | `03_LEGAL_STACK_REVIEW.prompt.md` | Old stage shape. | Preserve until archive phase. |
| `docs/prompts/diligence/03_Registry_Evaluation.prompt.md` | ARCHIVE_CANDIDATE | `04_REGISTRY_LEDGER_EVALUATION.prompt.md` | Old registry schema assumptions. | Preserve until archive phase. |
| `docs/prompts/diligence/04_Final_Compiler_And_Handoff.prompt.md` | ARCHIVE_CANDIDATE / HIGH RISK IF USED | `06_FINAL_COMPILER.prompt.md` + Node 5B contract | Old prompt combines compiler and handoff. | Archive only after README/status references are fixed. |

No old prompt should be deleted now. They should be marked legacy/reference and archived later.

---

## 7. Schema Inventory and Conflicts

| Schema | Classification | Owner | Issues found | Recommended action |
|---|---|---|---|---|
| `compilerOutput.schema.json` | ACTIVE / NEEDS_UPDATE | Stage 06 Node 5 compiler | Correctly excludes Node 5B fields, but `source_mode` enum includes `manual_urls`. | Remove `manual_urls` from source-mode enum if runtime canonical enum remains `url/text/url_plus_text`. |
| `diligenceReport.schema.json` | ACTIVE | Final post-Node-5B / final report object | Should not be used as Stage 06 validator. | Keep; make `src/lib/schemas.js` route Stage 06 to compilerOutput. |
| `sourceBundle.schema.json` | ACTIVE / NEEDS_UPDATE | Stage 01 source bundle | `source_mode` enum includes `manual_urls`, conflicting with runtime wiring plan. | Decide canonical enum, then patch schema/prompt/docs together. Current locked runtime says `manual_urls` is input form, not source mode. |
| `targetFeatureProfile.schema.json` | ACTIVE | Stage 02 | No blocking issue found in this audit. | Keep. |
| `legalStackReview.schema.json` | ACTIVE | Stage 03 | No blocking issue found in this audit. | Keep. |
| `registryLedger.schema.json` | ACTIVE | Stage 04 | Dynamic count compatible. | Keep. |
| `operatorChallenge.schema.json` | ACTIVE | Stage 05 | No blocking issue found in this audit. | Keep. |
| `assemblyOutput.schema.json` | ACTIVE | Node 5B / Assembly | Owns `vault_prefill_suggestions`; correct boundary. | Keep. |
| `vault.schema.json` | ACTIVE | Vault payload | Should remain strict to Vault map. | Keep. |
| `handoffEnvelope.schema.json` | ACTIVE / NEEDS_UPDATE | Handoff envelope | Allows `created` and `queued`; JS validator does not. | Align with `handoffEnvelope.js`. |
| `diligenceRunState.schema.json` | ACTIVE | Runtime run state | No blocking issue found. | Keep. |
| `schemaManifest.schema.json` | ACTIVE | Schema registry schema | No actual schema manifest data file audited. | Keep. |
| `deliveryState.schema.json` | ACTIVE | Downstream delivery placeholder | Out of Diligence scope. | Keep. |
| `maintenanceRun.schema.json` | ACTIVE | Downstream maintenance placeholder | Out of Diligence scope. | Keep. |

### Critical schema mapping issue

`src/lib/schemas.js` currently has no `compilerOutput` path and maps:

```text
diligence_compiler_output -> diligenceReport.schema.json
```

This is wrong under the Node 5 / Node 5B split.

Required patch:

```text
SCHEMA_PATHS.compilerOutput = "/data/schemas/compilerOutput.schema.json"
CANONICAL_SCHEMA_PATHS.diligence_compiler_output = SCHEMA_PATHS.compilerOutput
```

Do not remove `diligenceReport`; it can remain as final assembled report schema.

---

## 8. Runtime / App File Inventory

| Path | Classification | Job | Recommendation |
|---|---|---|---|
| `src/app/*` | ACTIVE | React shell routing and pages. | Keep. |
| `src/components/*` | ACTIVE | UI shell components. | Keep. |
| `src/pages/*` | ACTIVE | Placeholder pages for operational units. | Keep. |
| `src/lib/constants.js` | ACTIVE | Operational unit metadata. | Keep; update later only if product copy changes. |
| `src/lib/schemas.js` | ACTIVE / NEEDS_UPDATE | Schema path registry. | Patch before validators. |
| `src/wrapper/config/*` | ACTIVE | Firebase/runtime config. | Keep. |
| `src/wrapper/bridge/firebaseBridge.js` | ACTIVE | Firebase/Firestore readiness bridge. | Keep; no writes in cleanup. |
| `src/wrapper/runtime/artifactStatus.js` | ACTIVE / NEEDS_UPDATE | Artifact status display registry. | Stop marking Groq sandbox runtime required. |
| `src/wrapper/ui/SystemStatusPanel.jsx` | ACTIVE | Technical status drawer. | Keep unless artifact shape changes. |
| `functions/api/system-status.js` | ACTIVE | Server status endpoint. | Keep. |
| `functions/api/ai-smoke-test.js` | ACTIVE | Fixed Gemini smoke test only. | Keep. |
| `functions/_shared/*` | ACTIVE | Cloudflare function helpers. | Keep. |
| `.env.example` | ACTIVE / NEEDS_UPDATE | Env template. | Review model names and source capability labels before runtime wiring. |

---

## 9. README and Documentation Drift

| File | Stale section | Conflict | Recommended patch |
|---|---|---|---|
| `README.md` | Current status says no Groq calls, while AI provider section has Gemini smoke test and optional Groq fallback config. | Not fatal, but wording is old. | Clarify no Diligence runtime calls exist; Gemini smoke endpoint exists. |
| `README.md` | Runtime artifacts section lists Groq sandbox runtime as installed future Groq-compatible doctrine. | Active v2 is Gemini-primary and Groq runtime is reference-only. | Reword as legacy/reference source, not active runtime dependency. |
| `README.md` | Diligence Stage Prompt Templates section says active templates are under `docs/prompts/diligence/`. | v2 index says active chain is under `docs/prompts/diligence-v2/`. | Replace with v2 prompt chain list and mark old tree archive/reference. |
| `docs/contracts/README.md` | Phase status says Phase 0A/1/2 only; omits Node 5B contract, wiring plan, compiler schema. | Stale contract inventory. | Update to list current contract stack. |
| `INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md` | Authority says it sits under Groq runtime doctrine; source-mode line says enum unified to 3 values. | v2 architecture now treats Contract Spine/Vault map as top, with runtime wiring plan and Node 5B contract below. | Patch authority wording and source-mode language. |

---

## 10. Runtime Artifact Manifest Drift

| Artifact ID | Current status | Correct classification | Recommended action |
|---|---|---|---|
| `registry_runtime` | required installed | ACTIVE | Keep. |
| `registry_key_runtime` | required installed | ACTIVE | Keep. |
| `runtime_artifacts_manifest` | required installed | ACTIVE | Keep. |
| `vault_reference` | required installed, reference-only note | REFERENCE_ONLY but still important | Keep; clarify required-for-contract/source, not app execution. |
| `diligence_groq_sandbox_runtime` | required installed | REFERENCE_ONLY / ARCHIVE_CANDIDATE | Change required to false or equivalent reference-only semantics; update artifactStatus.js together. |

---

## 11. Search Findings

### 11.1 Old prompt path references

Old prompt tree still exists and is still described by README as active. The old Groq prompt index says `docs/prompts/diligence/04_Final_Compiler_And_Handoff.prompt.md` produces `assembly_handoff`, which conflicts with v2 Node 5B boundaries.

Risk: high if an implementer follows README/old prompt index.

Action: update README first, then archive old prompt tree later.

### 11.2 Groq references

Groq references are legitimate in three places:

```text
1. Optional fallback provider config.
2. Historical/reference runtime doctrine.
3. Old prompt tree/archive candidates.
```

They are risky where they appear as active required runtime artifacts.

Action: keep optional fallback config, but mark old runtime/prompt docs as reference-only.

### 11.3 Gemini references

Gemini-primary references are active and correct in:

```text
- runtime wiring plan
- system status / smoke test
- README AI provider section
- v2 prompt index
```

Action: keep. Do not expose Gemini key with `VITE_`.

### 11.4 source_mode / manual_urls

Wiring plan says canonical values are:

```text
url
text
url_plus_text
```

`manual_urls` is an input form under `target_input.manual_urls[]`.

But `compilerOutput.schema.json` and `sourceBundle.schema.json` still allow `manual_urls` as source_mode.

Action: patch schemas if the wiring plan remains controlling.

### 11.5 Node 5 / Node 5B boundary

Active v2 prompt index and Node 5B contract are correct: model emits confirmation questions only; backend derives prefill/handoff/envelope.

Old prompt tree is the main boundary hazard.

Action: do not delete yet; mark legacy/reference and archive after README/manifest cleanup.

### 11.6 stale Vault field references

Search hits for stale fields mostly appear as forbidden-field warnings in active v2 docs and as legacy material in old/runtime docs.

Action: keep forbidden warnings; do not let active output schemas/prompts emit stale fields.

### 11.7 stale sales/prospect fields

Search hits for `sales_viability`, `signal_context`, `ghost_protection_profile`, `true_gaps`, and `prospect_meta` appear in old prompt/runtime/reference docs and as forbidden warnings in v2 docs.

Action: no active output should use these fields. Existing v2 warnings are useful.

---

## 12. Delete Candidates

Immediate delete candidates: **none**.

Reason: old prompt/runtime/reference material still has migration/audit value and is still referenced by README/manifest/v2 docs.

Deletion before archiving would be sloppy.

---

## 13. Archive Candidates

| Path | Why archive candidate | Suggested archive path | Preconditions |
|---|---|---|---|
| `docs/prompts/diligence/` | Old Groq prompt tree replaced by v2 chain. | `docs/archive/diligence-v1-groq/prompts/` | README and runtime references updated. |
| `docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md` | Historical Groq doctrine, not active runtime. | `docs/archive/diligence-v1-groq/runtimes/` | Manifest/artifactStatus no longer mark it required. |
| `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md` | Large source material; no longer active once v2 stable. | `docs/archive/runtime-source-material/` | Only after v2 implementation stabilizes. |
| `docs/contracts/SCHEMA_REGENERATION_PLAN_v1.md` | Historical schema regeneration plan. | `docs/archive/runtime-source-material/` | Only after schema validators are implemented. |

---

## 14. Needs Update

| Path | Required update | Priority |
|---|---|---:|
| `README.md` | Replace old Groq prompt section with v2 prompt chain and reference-only old tree language. | P0 |
| `data/runtime/runtime_artifacts_manifest.json` | Mark Groq sandbox runtime reference-only, not active required. | P0 |
| `src/wrapper/runtime/artifactStatus.js` | Mirror manifest correction; stop required=true for Groq sandbox runtime. | P0 |
| `src/lib/schemas.js` | Add `compilerOutput` and map `diligence_compiler_output` to it. | P0 |
| `data/schemas/compilerOutput.schema.json` | Remove `manual_urls` from source_mode enum if wiring plan controls. | P0 |
| `data/schemas/sourceBundle.schema.json` | Same source-mode correction if wiring plan controls. | P0/P1 |
| `docs/contracts/README.md` | Update contract inventory and phase status. | P1 |
| `INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md` | Clarify authority hierarchy and source-mode language. | P1 |
| `data/schemas/handoffEnvelope.schema.json` + `src/wrapper/contracts/handoffEnvelope.js` | Align handoff status enums. | P2 |
| `.env.example` | Verify model names and distinguish provider capability flags from runtime source_mode. | P2 |

---

## 15. Must Not Touch Yet

Do not delete or materially rewrite these before cleanup Phase 2E-0B is approved:

```text
data/runtime/registry.runtime.json
data/runtime/registry_key.runtime.json
docs/reference/vault.js
docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md
docs/contracts/NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md
docs/contracts/DILIGENCE_RUNTIME_WIRING_PLAN_v1.md
docs/prompts/diligence-v2/*.prompt.md
docs/prompts/diligence-v2/PROMPT_INDEX.md
data/schemas/registryLedger.schema.json
data/schemas/operatorChallenge.schema.json
data/schemas/assemblyOutput.schema.json
data/schemas/vault.schema.json
functions/api/ai-smoke-test.js
functions/api/system-status.js
```

---

## 16. Recommended Cleanup Plan

### Phase 2E-0B — Safe status/docs/schema pointer cleanup

Files to change:

```text
README.md
data/runtime/runtime_artifacts_manifest.json
src/wrapper/runtime/artifactStatus.js
src/lib/schemas.js
data/schemas/compilerOutput.schema.json
data/schemas/sourceBundle.schema.json
```

Goals:

```text
- README points to diligence-v2 chain.
- Old Groq tree is marked legacy/reference.
- Groq sandbox runtime no longer required active artifact.
- Stage 06 compiler output validates against compilerOutput.schema.json.
- source_mode enum aligns with runtime wiring plan.
```

Do not archive/delete old prompt tree in this phase.

### Phase 2E-0C — Contract/docs alignment

Files to change:

```text
docs/contracts/README.md
docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md
```

Goals:

```text
- Authority hierarchy reflects current v2 stack.
- Source-mode language is consistent.
- Contract README lists current Node 5B and wiring docs.
```

### Phase 2E-0D — Optional archive move

Only after Phase 2E-0B/0C:

```text
Move docs/prompts/diligence/ to docs/archive/diligence-v1-groq/prompts/
Optionally move docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md to archive after references are updated.
```

### Phase 2E-1 — Validator utilities

After cleanup:

```text
Add schema loader and AJV validator utilities.
Add schema smoke script.
Validate compilerOutput and stage schemas.
```

---

## 17. Stop Conditions

Stop cleanup and ask for human decision if:

```text
- old Groq prompt tree is still referenced after README/manifest cleanup;
- source_mode enum decision changes again;
- compilerOutput and diligenceReport boundaries cannot both be validated cleanly;
- handoff schema/JS status alignment requires changing live handoff behavior;
- any cleanup requires deleting registry runtime, registry key, Vault map, or v2 prompt files;
- build fails after docs/status cleanup;
- UI artifact-status component breaks because manifest shape changes.
```

---

## 18. Final Recommendation

Proceed to cleanup, but only in this order:

```text
1. Phase 2E-0B: README + manifest + artifactStatus + schema pointer/source_mode cleanup.
2. Phase 2E-0C: Contract README + Contract Spine language cleanup.
3. Phase 2E-0D: archive old Groq prompt/runtime material only after references are fixed.
4. Phase 2E-1: schema loader + validator utilities.
```

Do **not** delete files now.

Do **not** implement runtime orchestration until Phase 2E-0B is complete.

The repo is now coherent enough to clean surgically, but not clean enough to wire runtime validators safely without first fixing stale README/status/schema mapping.
