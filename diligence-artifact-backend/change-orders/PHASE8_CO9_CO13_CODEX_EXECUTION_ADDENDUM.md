# PHASE 8 — CO-9 THROUGH CO-13 CODEX EXECUTION ADDENDUM

**Document status:** LOCKED MECHANICAL EXECUTION ADDENDUM  
**Repository:** `LexNovaHQ/interface-sandbox`  
**Branch:** `domain-gate-v0-preflight`  
**Reviewed substantive base HEAD:** `0927538f1d63f82a930f245c665b1e537ffc4663`  
**Parent authority:** `change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md`

---

# 1. PURPOSE AND PRECEDENCE

This addendum governs CO-9 through CO-13 only.

Codex must read both:

```text
diligence-artifact-backend/change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md
diligence-artifact-backend/change-orders/PHASE8_CO9_CO13_CODEX_EXECUTION_ADDENDUM.md
```

The original patch package remains authoritative except where this addendum expressly corrects or expands:

1. substantive precondition files added by CO-8;
2. the Phase 8 focused-check count and `package.json` registration command;
3. authorization for the P2E contract marker change;
4. the exact mechanical activation of the approved M11, M12, and compiler handoff adapters.

Where the two documents conflict on those four subjects, this addendum controls.

Do not execute multiple jobs in one Codex invocation. Each CO must begin with a clean tree and end with exactly one commit.

---

# 2. CHANGE-JOB MAP

| Change order | Codex selected job | Commit message |
|---|---|---|
| CO-9 | `A_FDR_SURGERY` | `Correct Phase 8 DCO FDR source authority` |
| CO-10 | `B_FOLDER_RENUMBERING` | `Renumber downstream phase folders for Phase 8 insertion` |
| CO-11 | `C_CENTRAL_RUNTIME_CUTOVER` | `Wire Phase 8 into central runtime sequence` |
| CO-12 | `D_P2G_PERMISSIONS` | `Activate Phase 8 P2G route and permissions` |
| CO-13 | `E_DOWNSTREAM_VALIDATION_WIRING` | `Propagate Phase 8 profile and register checks` |

The jobs must run in that order.

---

# 3. UPDATED SUBSTANTIVE PRECONDITIONS

Before CO-11, CO-12, or CO-13, Codex must confirm all of the following exist.

## Phase 8 package

```text
src/phases/08-domain-control-obligation-profile/domain-control-obligation.constants.js
src/phases/08-domain-control-obligation-profile/domain-control-obligation-candidate-inventory.contract.js
src/phases/08-domain-control-obligation-profile/domain-control-obligation-profile.contract.js
src/phases/08-domain-control-obligation-profile/domain-control-obligation-downstream-handoff.contract.js
src/phases/08-domain-control-obligation-profile/domain-control-obligation-candidate-inventory.runner.js
src/phases/08-domain-control-obligation-profile/domain-control-obligation-profile.runner.js
src/phases/08-domain-control-obligation-profile/index.js
src/phases/08-domain-control-obligation-profile/README.md
src/phases/08-domain-control-obligation-profile/services/domain-control-obligation-taxonomy.resolver.js
src/phases/08-domain-control-obligation-profile/services/domain-control-obligation-candidate-inventory.builder.js
src/phases/08-domain-control-obligation-profile/services/domain-control-obligation-profile.compiler.js
src/phases/08-domain-control-obligation-profile/validators/domain-control-obligation-candidate-inventory.validator.js
src/phases/08-domain-control-obligation-profile/validators/domain-control-obligation-profile.validator.js
```

## Agent 8 package

```text
agent-packages/agent_8_domain_control_obligation/00_RUNTIME_CONTROLLER_PHASE8.md
agent-packages/agent_8_domain_control_obligation/01_DOMAIN_CONTROL_OBLIGATION_PROFILE_BACKEND.md
agent-packages/agent_8_domain_control_obligation/02_PHASE8_VALIDATOR_RULES.md
agent-packages/agent_8_domain_control_obligation/AGENT8_BACKEND_OUTPUT_CONTRACT.md
```

## Approved substantive downstream handoff

Before CO-10, these paths exist under their current folders:

```text
src/phases/09-exposure-profile/domain-control-obligation-profile.handoff.js
src/phases/10-operator-challenge/domain-control-obligation-profile.handoff.js
src/phases/11-normalized-compiler/domain-control-obligation-profile.handoff.js
agent-packages/agent_5_exposure_registry/M11_DOMAIN_CONTROL_OBLIGATION_HANDOFF.md
```

After CO-10, the three phase-owned adapters must exist at:

```text
src/phases/10-exposure-profile/domain-control-obligation-profile.handoff.js
src/phases/11-operator-challenge/domain-control-obligation-profile.handoff.js
src/phases/12-normalized-compiler/domain-control-obligation-profile.handoff.js
```

## Five focused checks

```text
scripts/check-phase8-domain-control-obligation-contract.mjs
scripts/check-phase8-domain-control-obligation-layer1.mjs
scripts/check-phase8-domain-control-obligation-layer2.mjs
scripts/check-phase8-domain-control-obligation-runtime-boundary.mjs
scripts/check-phase8-domain-control-obligation-downstream-handoff.mjs
```

If any required file is missing, abort without editing.

---

# 4. GLOBAL CODEX OPERATING RULES

For every invocation:

1. confirm remote is `LexNovaHQ/interface-sandbox`;
2. confirm branch is exactly `domain-gate-v0-preflight`;
3. confirm `git status --porcelain` is empty;
4. fetch origin without switching or rebasing;
5. record `PRE_JOB_HEAD`;
6. print exact authorized paths before editing;
7. apply only the selected job;
8. run only `git diff --check`, `node --check` on directly edited JavaScript/MJS files, and exact search assertions;
9. do not run `npm run check`, smoke tests, live model calls, deployment, or merge;
10. commit exactly once only after assertions pass;
11. do not push unless the human invocation explicitly says to push.

If any required edit falls outside the selected job’s allowed paths, stop and report the path and dependency. Do not widen scope silently.

---

# 5. CO-9 — FDR SURGERY

## Codex invocation

```text
SELECTED_JOB=A_FDR_SURGERY

Read and obey both locked authorities:
  diligence-artifact-backend/change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md
  diligence-artifact-backend/change-orders/PHASE8_CO9_CO13_CODEX_EXECUTION_ADDENDUM.md

Apply only the FDR surgery.

Authorized file only:
  diligence-artifact-backend/references/registry/Diligence_Field_Derivation_Registry.yml

Required edits:
1. Replace only the source_basis of DCO.OBL.001 with:
   mounted Registry Key obligation entries resolved from active_run_package_manifest; obligation catalog family join and P2E navigation index provide route context only
2. Replace only the source_basis of DCO.OBL.006 with:
   mounted Registry Key obligation entry obligation_locus
3. Replace only the source_basis of DCO.OBL.007 with:
   mounted Registry Key obligation entry obligation_trigger_timing
4. Add exactly one DCO.OBL.008 block using the exact locked YAML in Section 8.2 of the parent package.

Do not change any other FDR row, field_id block, citation, rule grammar, package key, catalog, or obligation content.

Assertions:
- exactly one file changed;
- DCO.OBL.001, DCO.OBL.006, and DCO.OBL.007 contain the exact locked source_basis values;
- DCO.OBL.008 exists exactly once;
- a focused diff proves no other field_id block changed;
- git diff --check passes.

Commit exactly:
  Correct Phase 8 DCO FDR source authority
```

---

# 6. CO-10 — DOWNSTREAM FOLDER RENUMBERING

## Codex invocation

```text
SELECTED_JOB=B_FOLDER_RENUMBERING

Read and obey both locked authorities:
  diligence-artifact-backend/change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md
  diligence-artifact-backend/change-orders/PHASE8_CO9_CO13_CODEX_EXECUTION_ADDENDUM.md

Use git mv for all eight directory moves:
  src/phases/08-data-provenance-forensics -> src/phases/09-data-provenance-forensics
  src/phases/09-exposure-profile -> src/phases/10-exposure-profile
  src/phases/10-operator-challenge -> src/phases/11-operator-challenge
  src/phases/11-normalized-compiler -> src/phases/12-normalized-compiler
  src/phases/12-qualified-review -> src/phases/13-qualified-review
  src/phases/13-diligence-qa-complete -> src/phases/14-diligence-qa-complete
  src/phases/14-qualified-review-submission -> src/phases/15-qualified-review-submission
  src/phases/15-assembly-engine -> src/phases/16-assembly-engine

Preconditions:
- every source directory exists;
- every target directory is absent;
- tree is clean;
- the three CO-8 handoff adapters exist in the source directories before the moves.

After the moves, update only exact active import, path assertion, implementation-registry, check-script, and active-documentation references caused by the moves.

Do not change business logic, internal job IDs, exported symbols, artifact names, prompt package names, Phase 7 DAP logic, or the substantive Phase 8 folder.

Required post-move handoff paths:
  src/phases/10-exposure-profile/domain-control-obligation-profile.handoff.js
  src/phases/11-operator-challenge/domain-control-obligation-profile.handoff.js
  src/phases/12-normalized-compiler/domain-control-obligation-profile.handoff.js

Assertions:
- all eight source directories are absent;
- all eight target directories exist;
- src/phases/08-domain-control-obligation-profile remains present;
- the three handoff adapters moved with their owning directories;
- no active import or implementation-registry entry points to an old folder;
- rename diff contains no substantive implementation change;
- node --check passes only on directly path-edited JS/MJS files;
- git diff --check passes.

Commit exactly:
  Renumber downstream phase folders for Phase 8 insertion
```

---

# 7. CO-11 — CENTRAL RUNTIME CUTOVER

## Corrected authorization

The parent package omitted the P2E contract file even though it requires renaming the active `phase7b_derives_values_later` marker. CO-11 is therefore authorized to edit exactly these five files:

```text
src/runtime/contracts/central-phase.contract.js
src/runtime/contracts/pipeline.contract.js
src/runtime/services/pipeline.service.js
src/phases/phase-registry.js
src/phases/02-cartography-index/domain-control-obligation-navigation-index.contract.js
```

No other Phase 2 file is authorized in CO-11.

## Codex invocation

```text
SELECTED_JOB=C_CENTRAL_RUNTIME_CUTOVER

Read and obey both locked authorities:
  diligence-artifact-backend/change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md
  diligence-artifact-backend/change-orders/PHASE8_CO9_CO13_CODEX_EXECUTION_ADDENDUM.md

Authorized files only:
  diligence-artifact-backend/src/runtime/contracts/central-phase.contract.js
  diligence-artifact-backend/src/runtime/contracts/pipeline.contract.js
  diligence-artifact-backend/src/runtime/services/pipeline.service.js
  diligence-artifact-backend/src/phases/phase-registry.js
  diligence-artifact-backend/src/phases/02-cartography-index/domain-control-obligation-navigation-index.contract.js

Preconditions:
- CO-9 and CO-10 commits are already present;
- tree is clean;
- all updated substantive precondition files in this addendum exist.

Required result:
1. Insert central Phase 8 DOMAIN_CONTROL_OBLIGATION_PROFILE with the two locked jobs and artifacts.
2. Shift downstream public phase orders/folders to 9–16 without renaming established internal job IDs.
3. Add both Phase 8 job IDs between DATA_PROVENANCE_PROFILE_LAYER5 and DATA_PROVENANCE_PROFILE_FORENSICS.
4. Add the Agent 8 prompt root, locked prompt array, and FDR-only reference array.
5. Add both pipeline contracts with exact locked field ownership and routing markers.
6. Change DATA_PROVENANCE_PROFILE_LAYER5.next to DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY.
7. Set candidate inventory next to DOMAIN_CONTROL_OBLIGATION_PROFILE.
8. Set profile next to DATA_PROVENANCE_PROFILE_FORENSICS.
9. Import and explicitly dispatch both Phase 8 runners before DAP Forensics.
10. Inject buildPrompt/callProvider only into Layer 2.
11. Do not permit either Phase 8 job to fall through to the generic model handler.
12. Update downstream import paths only to the CO-10 folders.
13. Add the Phase 8 phase-registry entry and shift downstream order/folder values.
14. In the P2E contract, rename only phase7b_derives_values_later to phase8_derives_values_later; do not change P2E builder logic, route logic, inputs, outputs, or navigation semantics.

Do not change Phase 7 DAP reads, writes, prompts, batches, gates, validators, or substantive implementation.

Assertions:
- exact chain appears once:
  DATA_PROVENANCE_PROFILE_LAYER5 -> DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY -> DOMAIN_CONTROL_OBLIGATION_PROFILE -> DATA_PROVENANCE_PROFILE_FORENSICS
- both jobs map to central phase DOMAIN_CONTROL_OBLIGATION_PROFILE;
- P2E contains phase8_derives_values_later and no active phase7b_derives_values_later;
- pipeline.service has explicit Phase 8 dispatches;
- no generic model fallback handles Phase 8;
- no old downstream folder import remains in the five authorized files;
- node --check passes for all five files;
- git diff --check passes.

Commit exactly:
  Wire Phase 8 into central runtime sequence
```

---

# 8. CO-12 — P2G ROUTE AND PERMISSIONS

## Codex invocation

```text
SELECTED_JOB=D_P2G_PERMISSIONS

Read and obey both locked authorities:
  diligence-artifact-backend/change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md
  diligence-artifact-backend/change-orders/PHASE8_CO9_CO13_CODEX_EXECUTION_ADDENDUM.md

Authorized files only:
  diligence-artifact-backend/src/phases/02-cartography-index/phase-routing.contract.js
  diligence-artifact-backend/src/phases/02-cartography-index/services/phase-route-runtime.reader.js
  diligence-artifact-backend/src/runtime/contracts/artifact-permissions.contract.js

Preconditions:
- CO-9 through CO-11 commits are present;
- tree is clean;
- Phase 8 central contracts exist.

Required result:
1. Rename the active route to ROUTE.PHASE8.DOMAIN_CONTROL_OBLIGATION_PROFILE.
2. Keep bucket 2E_BUCKET_DOMAIN_CONTROL_OBLIGATION unchanged.
3. Authorize exactly DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY and DOMAIN_CONTROL_OBLIGATION_PROFILE as parent jobs.
4. Deliver domain_control_obligation_candidate_inventory only to the Layer 2 job as job-scoped derived context.
5. Give both jobs source-bucket profile delivery.
6. Allow only target_profile, domain_derivation_profile, target_feature_profile, domain_selection_profile, active_run_package_manifest, legal_cartography_index, and legal_signal_derivation_profile plus the bounded 2E source bucket.
7. Explicitly forbid all profile forensics and all Phase 7 DAP Layer 4/Layer 5 artifacts.
8. Map both jobs to the new route in P2G_RUNTIME_ROUTE_BY_JOB.
9. Add agent_8_domain_control_obligation.
10. Register both Phase 8 artifacts as known static artifacts.
11. Give Agent 8 exact write permissions for only those two artifacts.
12. Give Agent 8 material/context read permissions only; do not grant free-corpus source reads.
13. Give each internal Phase 8 job exact write permissions.

Assertions:
- old ROUTE.PHASE7B.DOMAIN_CONTROL_OBLIGATION_PROFILE absent from active files;
- new Phase 8 route present;
- candidate inventory is job-scoped to Layer 2 only;
- candidate inventory is not in any downstream route array;
- DAP arrays and forensic artifacts are forbidden, not allowed;
- no second routing authority or direct artifact loader introduced;
- node --check passes for all three files;
- git diff --check passes.

Commit exactly:
  Activate Phase 8 P2G route and permissions
```

---

# 9. CO-13 — DOWNSTREAM ACTIVATION AND VALIDATION REGISTRATION

CO-13 mechanically activates the already-approved CO-8 handoff. It has no authority to redesign the adapters, create new findings, create a new report section, alter M11 row identity/routing, or let M12 rederive Phase 8.

## Authorized path classes

Codex must first identify the exact active files after CO-10. It may edit only:

```text
src/runtime/contracts/artifact-permissions.contract.js
src/phases/02-cartography-index/phase-routing.contract.js
src/runtime/contracts/pipeline.contract.js
package.json
src/phases/10-exposure-profile/** active M11 orchestration/packet file required to call the approved handoff adapter
src/phases/11-operator-challenge/** active deterministic M12 gate file required to call the approved challenge adapter
src/phases/12-normalized-compiler/** active normalized compiler file required to call the approved compiler adapter
active validation aggregators that register the Phase 8 check command
```

If the active implementation is outside those classes, stop and report it.

## Required mechanical activation

### P2G and permissions

- Propagate only `domain_control_obligation_profile` to M11, M12, and NORMALIZED_COMPILER.
- Never propagate `domain_control_obligation_candidate_inventory` beyond Phase 8.
- Add the profile to the M11 allowed preceding derived-profile list.
- Add the profile to the exact M12 derived-only list.
- Add the profile to the exact compiler derived-only list.
- Add corresponding read permissions only for the three downstream consumers that need it.

### M11

- Add `agent-packages/agent_5_exposure_registry/M11_DOMAIN_CONTROL_OBLIGATION_HANDOFF.md` to the active M11 prompt bundle in `pipeline.contract.js`.
- Import the approved `buildM11DomainControlObligationHandoff` adapter from the Phase 10 folder.
- Build the handoff from the delivered locked `domain_control_obligation_profile` and the active batch threat rows already present in the M11 packet.
- Add the resulting in-memory `m11_domain_control_obligation_context` to the active batch prompt packet only.
- Do not save it as an artifact.
- Do not change route plan, batch membership, threat IDs, Hunter Triggers, registry spine, output row schema, or deterministic final-status logic.
- Do not treat Phase 8 visible controls as M11 control proof.

### M12

- Import the approved `buildM12DomainControlObligationChallenge` adapter from the Phase 11 folder.
- Require the locked `domain_control_obligation_profile` as a derived-only input.
- Run the adapter once inside the deterministic M12 gate.
- Merge its critical failures and warnings into the existing M12 critical-failure/warning arrays.
- Carry its receipt as a nested diagnostic branch of the existing `challenge_gate`; do not create a new saved artifact.
- Do not rederive, repair, or rewrite Phase 8 rows.

### Compiler

- Import the approved `buildDomainControlObligationCompilerHandoff` adapter from the Phase 12 folder.
- Build the in-memory compiler handoff from the locked profile.
- Merge its six approved contribution sets into only these existing sections:
  - legal_document_control_review
  - exposure_control_discipline
  - review_route_action_plan
  - control_handoff_readiness
  - exposure_clarification_queue
  - methodology_limitations_review_notes
- Do not create a new normalized section or renderer section.
- Do not render candidate inventory, candidate IDs, derivation basis, Registry Key refs, catalog refs, or P2E route pointers.
- Do not create new findings; project only the locked Phase 8 material.

### Check registration

Register exactly:

```json
"check:phase8-domain-control-obligation": "node scripts/check-phase8-domain-control-obligation-contract.mjs && node scripts/check-phase8-domain-control-obligation-layer1.mjs && node scripts/check-phase8-domain-control-obligation-layer2.mjs && node scripts/check-phase8-domain-control-obligation-runtime-boundary.mjs && node scripts/check-phase8-domain-control-obligation-downstream-handoff.mjs"
```

Insert it in the primary `check` chain after `check:phase7-data-provenance-profile` and before the central downstream runtime checks.

Do not execute this command or the full check chain during CO-13.

## Codex invocation

```text
SELECTED_JOB=E_DOWNSTREAM_VALIDATION_WIRING

Read and obey both locked authorities:
  diligence-artifact-backend/change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md
  diligence-artifact-backend/change-orders/PHASE8_CO9_CO13_CODEX_EXECUTION_ADDENDUM.md

Preconditions:
- CO-9 through CO-12 commits are present;
- tree is clean;
- the approved CO-8 handoff contract, three adapters, M11 prompt addendum, and five focused checks exist at their post-renumber paths.

Before editing:
1. Search the active Phase 10 M11, Phase 11 M12, Phase 12 compiler, P2G, permissions, pipeline contract, package.json, and validation aggregators.
2. Print the exact discovered files and functions.
3. Confirm every required edit is inside the authorized path classes.
4. Abort if a required file falls outside them.

Apply the Required mechanical activation in Section 9 of this addendum exactly.

Assertions:
- domain_control_obligation_profile is delivered to M11, M12, and NORMALIZED_COMPILER;
- domain_control_obligation_candidate_inventory has zero downstream reads;
- M11 active prompt bundle includes M11_DOMAIN_CONTROL_OBLIGATION_HANDOFF.md exactly once;
- M11 calls the approved context adapter and does not alter route or output schema;
- M12 calls the approved deterministic challenge adapter and does not rederive Phase 8;
- compiler calls the approved projection adapter and creates no new section;
- no new saved handoff artifact exists;
- package.json is valid JSON;
- the Phase 8 check command contains all five focused checks in the locked order;
- node --check passes for every directly edited JS/MJS file;
- git diff --check passes.

Do not run npm run check, focused scripts, smoke tests, provider tests, deployment, or merge.

Commit exactly:
  Propagate Phase 8 profile and register checks
```

---

# 10. REQUIRED CODEX REPORT AFTER EACH JOB

```text
JOB:
PRE_JOB_HEAD:
POST_JOB_HEAD:
COMMIT:

FILES CHANGED:
FILES MOVED:

MECHANICAL CHANGES APPLIED:

ASSERTIONS:
- assertion:
  result:

NODE CHECKS:
- file:
  result:

GIT DIFF CHECK:

FORBIDDEN-FILE AUDIT:

UNRESOLVED BLOCKERS:

CONFIRMATION:
- no merge
- no deploy
- no main-branch change
- no full validation run
```

After each job, stop. The next job may begin only from a clean tree containing the prior job’s commit.
