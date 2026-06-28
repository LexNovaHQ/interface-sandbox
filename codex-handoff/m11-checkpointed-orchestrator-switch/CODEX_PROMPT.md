# Codex Handoff — Activate M11 Checkpointed Orchestrator

## Context
The following files have already been added on `main`:

- `diligence-artifact-backend/agent-packages/agent_5_exposure_registry/00_M11_RUNTIME_CONTROLLER.md`
- `diligence-artifact-backend/agent-packages/agent_5_exposure_registry/M11_C_BATCH_EVALUATION.md`
- `diligence-artifact-backend/src/m11-batch-evidence-resolver.js`
- `diligence-artifact-backend/src/m11-orchestrator-checkpointed.js`

A low-level commit was also created but could not be moved onto `main` by the connector safety layer:

- `abdea8e9c82dce4346623f7ae851b77d2a45c873`
- message: `Route M11 through checkpointed orchestrator`

## Required Patch
Apply exactly this one-line replacement to:

`diligence-artifact-backend/src/m11-orchestrator.js`

Replace the entire file with:

```js
export { runM11OrchestratedPhase } from "./m11-orchestrator-checkpointed.js";
```

## Scope Rules
Do not change registry substance.
Do not change M11 evaluation rules.
Do not change artifact names.
Do not change compiler, renderer, vault, Agent 1, Agent 2, Agent 3, or Agent 4.
Do not alter `m11-orchestrator-checkpointed.js` unless syntax check proves a mechanical syntax error.

## Required Checks
Run:

```bash
cd diligence-artifact-backend
npm run check
```

Then stop. Do not deploy automatically unless explicitly instructed.
