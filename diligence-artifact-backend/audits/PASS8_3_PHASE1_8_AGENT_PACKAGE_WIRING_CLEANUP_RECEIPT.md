# Pass 8.3 Receipt — Phase 1-8 Agent Package Wiring Cleanup

Branch: `phase1-8-central-runtime-integration`

## Scope

This receipt covers Phase 1-8 runtime cleanup only.

In scope:

```txt
Source Discovery metadata
Phase 7 Data Provenance Profile prompt wiring
Phase 1-8 runtime validator coverage
```

Out of scope:

```txt
M11 / Exposure Profile
M12 / Operator Challenge
Normalized Compiler
Report Renderer
Qualified Review
Assembly Engine
```

## Fix 1 — Source Discovery Contract Metadata

Patched:

```txt
src/phases/01-source-discovery/source-discovery.contract.js
```

The Source Discovery contract now records runtime cutover consistently:

```txt
implementation_status: PHASE_OWNED_IMPLEMENTATION_RUNTIME_CUTOVER
boundary.production_entrypoint_switched: true
```

The three Source Discovery jobs also carry runtime cutover status:

```txt
URL_MANIFEST
SOURCE_EXTRACTION
SOURCE_FAMILY_HANDOFF
```

## Fix 2 — Phase 7 Prompt Wiring Centralized

Patched:

```txt
src/runtime/contracts/pipeline.contract.js
src/phases/07-data-provenance-profile/data-provenance-profile.runner.js
```

Phase 7 Layer 4 prompt files are now owned by the pipeline contract:

```txt
prompt_files:
  agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml
  agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md

repair_prompt_files:
  agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml
  agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md
  agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_REPAIR.md
```

The Phase 7 runner now consumes:

```txt
contract.prompt_files
contract.repair_prompt_files
```

and no longer hardcodes the Agent 4 package prompt paths.

## Fix 3 — Validator Coverage

Patched:

```txt
scripts/check-phase1-8-central-runtime.mjs
```

Added enforced gate:

```txt
PHASE7_AGENT_PACKAGE_PROMPT_WIRING_SYNC
```

The validator now asserts:

- Phase 7 Layer 4 prompt files are exact and contract-owned.
- Phase 7 Layer 4 repair prompt files are exact and contract-owned.
- The Phase 7 runner consumes `contract.prompt_files`.
- The Phase 7 runner consumes `contract.repair_prompt_files`.
- The Phase 7 runner does not hardcode Agent 4 prompt-file paths.

## Validation Required Locally

After pulling these commits locally, run:

```powershell
npm run check:phase1-8-runtime
$LASTEXITCODE
npm run check:syntax
$LASTEXITCODE
```

Do not use `npm run check:normalized` or full `npm run check` as Phase 1-8 acceptance gates.
