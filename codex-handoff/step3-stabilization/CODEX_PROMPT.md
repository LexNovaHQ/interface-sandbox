# Codex Prompt — Step 3 Stabilization Patch

Apply this on top of current `main`.

Scope:
1. Patch M10 package names to canonical backend roots.
2. Replace exactly the 22 LEP rows in `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` with the new split-M11 LEP rows.
3. Fix Agent 5 package-only inconsistencies not handled by backend code.
4. Do not touch compiler, renderer, portfolio, final_output_handoff schema, report schema, or routes outside the listed files.

Current direct-main backend patches already done:
- `src/m11-orchestrator.js` now passes the M11 batch packet and registry reference packet to M12 batch validation.
- `src/reviewer-runner.js` now dynamically loads all planned M11 batch artifacts and paired batch-validation artifacts for M12 global.
- `src/artifact-service.js` now gates challenge_gate save/lock behind all M11 split artifacts, batches, validations, and forensics.
- `src/phase-contracts.js` now loads `AGENT4_BACKEND_OUTPUT_CONTRACT_SYNCED_M10.md` into the M10 prompt stack.

Patch order:

A. M10 name sync:
Run exact textual replacements in these Agent 4 files only:
- `diligence-artifact-backend/agent-packages/agent_4_data_privacy/M10_DATA_PROVENANCE.md`
- `diligence-artifact-backend/agent-packages/agent_4_data_privacy/00_VALIDATOR_RULES_INTEGRATED_AGENT4_SYNCED.md`
- `diligence-artifact-backend/agent-packages/agent_4_data_privacy/00_TERMINAL_RECEIPT_RULES_INTEGRATED_AGENT4_SYNCED.md`
- `diligence-artifact-backend/agent-packages/agent_4_data_privacy/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`
- `diligence-artifact-backend/agent-packages/agent_4_data_privacy/BACKEND_CANONICAL_OUTPUT_ADAPTER.md`

Required replacements:
- `target_data_provenance_profile_forensics` -> `data_provenance_profile_forensics`
- `target_data_provenance_profile` -> `data_provenance_profile`
- `TARGET_DATA_PROVENANCE_PROFILE` -> `DATA_PROVENANCE_PROFILE`
- `Target Data Provenance Profile` -> `Data Provenance Profile`
- `target data provenance profile` -> `data provenance profile`
- `Do not use `data_provenance_profile` alias.` -> `Do not use `target_data_provenance_profile` legacy alias.`

Do not rename unrelated Agent 3 target/profile names.

B. LEP row replacement:
In `diligence-artifact-backend/references/registry/FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`, replace only the contiguous LEP block:

Start: first line matching `- Field_ID: LEP.`
End: the line immediately before the next `- Field_ID: DRR.`

Replace that whole LEP block with the exact contents of:
`codex-handoff/step3-stabilization/LEP_ROWS_REPLACEMENT.yaml`

Do not touch TAP, TFP, DAP, DRR, or any non-LEP rows.

C. Agent 5 package consistency:
Patch `AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml`:
- Move `M12_GLOBAL_CHALLENGE_AFTER_M11_FORENSICS` to after `M11_PHASE_F_DETERMINISTIC_FORENSICS` in `phase_sequence`.
- Rename `forbidden_outputs:` to `forbidden_outputs_for_m11_and_m12_batch:` if it includes `challenge_gate`.
- Keep the rule that M12 global may emit challenge_gate.

Patch `AGENT5_BACKEND_OUTPUT_CONTRACT_SYNCED_M11.md` Section 1:
- active_phase_scope must list M11_EXPOSURE_REGISTRY, M12_BATCH_VALIDATION, M12_GLOBAL_CHALLENGE.
- allowed_modules must list M11_EXPOSURE_REGISTRY, M12_BATCH_VALIDATION, M12_GLOBAL_CHALLENGE.
- phase_lock must list M11_EXPOSURE_REGISTRY and M12_GLOBAL_CHALLENGE.

D. M12 global prompt clarity:
Patch `M12_GLOBAL_CHALLENGE.md` to state that backend injects dynamic batch artifacts under:
- `m11_batch_artifacts[]`
- `m12_batch_validation_artifacts[]`
- `m12_global_dynamic_artifact_manifest`

E. Run checks:
From `diligence-artifact-backend`, run:
`npm run check`

Stop after these changes. Do not proceed to compiler/renderer.
