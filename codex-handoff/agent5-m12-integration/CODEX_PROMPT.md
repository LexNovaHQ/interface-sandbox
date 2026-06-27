# Codex Prompt — Agent 5 M12 Integration

You are patching `LexNovaHQ/interface-sandbox` on top of `main`.

Scope is surgical:

1. Keep compiler, renderer, portfolio, final handoff, and report schema untouched.
2. Integrate M12 into Agent 5 only.
3. Do not merge M12 into `M11_EXPOSURE_REGISTRY.md`.
4. Keep M11 and M12 as separate module prompts inside `agent_5_exposure_registry`.
5. M11 may not emit `challenge_gate`.
6. M12 global may emit `challenge_gate`.
7. M12 batch validation may emit only a batch validation object that backend persists as `exposure_registry_batch_validation__{GROUP}__{NNN}`.

Patch order:

A. Replace `agent-packages/agent_5_exposure_registry/M12_GLOBAL_CHALLENGE.md` with `M12_GLOBAL_CHALLENGE_FINAL.md` from this handoff.

B. Patch `src/phase-contracts.js`:
- Add `AGENT_5_M12_GLOBAL_FILES` using Agent 5 package files and `M12_GLOBAL_CHALLENGE.md`.
- Change phase `M12` from `agent_7_m12` / `agent_7_m12.md` to `agent_5_exposure_registry` / `AGENT_5_M12_GLOBAL_FILES`.
- Keep M12 writes as `["challenge_gate"]`.
- Do not touch COMPILER or RENDERER.

C. Patch `src/constants.js`:
- Allow `agent_5_exposure_registry` to write `exposure_registry_batch_validation__{GROUP}__{NNN}` and `challenge_gate`.
- Allow `agent_5_exposure_registry` to read `exposure_registry_profile_forensics` and `challenge_gate`.
- Leaving `agent_7_m12` in constants is acceptable temporarily, but active phase contracts should not use it.

D. Patch `src/m11-orchestrator.js`:
- Replace backend-only fake semantic batch validation with a real prompt-backed `M12_BATCH_VALIDATION.md` call.
- Run order per batch:
  1. M11 batch model returns `m11_batch_registry_ledger`.
  2. Backend structural validation passes.
  3. M12 batch prompt runs.
  4. Backend saves `exposure_registry_batch_validation__{GROUP}__{NNN}`.
  5. Only if M12 batch status is `PASS` or `PASS_WITH_LIMITATION`, backend saves `exposure_registry_batch__{GROUP}__{NNN}`.
- If M12 batch returns `REPAIR_REQUIRED` or `CONTROLLED_FAILURE`, stop M11 at repair required and do not save the accepted batch.

E. Patch Agent 5 package contracts:
- Binding packet must state that Agent 5 owns M12 batch validation and M12 global challenge.
- Adapter must say M11 cannot emit `challenge_gate`; M12 global can.
- Validator must validate global challenge root `challenge_gate`.
- Terminal rules must advance to compiler only after `challenge_gate` locks.

F. Run checks:
- `npm run check` from `diligence-artifact-backend`.
- Create or run a targeted smoke if available that reaches M11/M12.

Stop after M12 is integrated. Do not patch compiler/renderer in this PR.
