# DILIGENCE_POOLING_CONTRACT_v1

## Purpose

This file locks the Diligence System pool architecture for the split-prompt runtime.

The Diligence System must not route every stage through one generic model/key pool once the monolithic prompt is decomposed. Pools are assigned by cognitive job, not by arbitrary stage number.

## Pool Names

### search

Purpose:
- Public source discovery
- Same-origin source expansion
- Grounded discovery fallback when deterministic fetch is thin

Grounding:
- Allowed

Allowed evidence use:
- Search may discover candidate first-party target-domain pages or qualifying hosted governance artifacts.
- Search output is not itself final evidence unless admitted by deterministic source rules.

### extract

Purpose:
- Source typing
- Lossless evidence normalization
- Evidence inventory structuring
- Legal document inventory extraction

Grounding:
- Not allowed

### router

Purpose:
- Route the full evidentiary box into marked stage packages
- Preserve all admitted sources
- Produce routing ledger

Grounding:
- Not allowed

Rules:
- No source deletion.
- Evidence may be routed to multiple packages.
- Rejected/unused material must remain visible in the routing ledger.

### profile

Purpose:
- Target/business profile
- Function/feature profile
- Data provenance profile
- Semantic profile building from admitted evidence and upstream handoffs

Grounding:
- Not allowed

### registry

Purpose:
- Exposure profile
- Registry row evaluation
- 98-row row-by-row ledger execution

Grounding:
- Not allowed

Rules:
- Registry row inventory is server-owned.
- Model must not invent, drop, or summarize registry rows.
- Registry must run in batches once split prompt runtime is active.

### final

Purpose:
- Integrated report
- Vault handoff compiler
- Narrative assembly from validated upstream handoffs

Grounding:
- Not allowed by default

Rules:
- No new evidence.
- No new registry findings.
- No reclassification.
- No row deletion.
- Mandatory public demo disclaimer is server-enforced.

### repair

Purpose:
- Schema repair
- JSON repair
- Format normalization
- Retry cleanup

Grounding:
- Not allowed

Rules:
- Repair cannot change substantive findings unless a specific caller permits it.
- Repair cannot convert a failed guardrail into PASS.

## Stage Binding

| Stage | System Function | Primary Pool | Secondary/Fallback Pool |
|---|---|---|---|
| 1 | Search, extraction, full evidentiary lossless box | search | extract |
| 2 | Evidence package routing | router | extract |
| 3 | Target Profiling / business profile | profile | repair |
| 4 | Function Profiling / feature profile | profile | repair |
| 5 | Legal Index / legal cartograph | extract | profile |
| 6 | Data Profiling / data provenance | profile | repair |
| 7 | Exposure Profile / registry ledger | registry | repair |
| 8 | Integrated Report / Vault handoff | final | repair |

## Environment Variables

Each pool has separate key and model sequence variables.

```yaml
DILIGENCE_SEARCH_API_KEYS: "..."
DILIGENCE_EXTRACT_API_KEYS: "..."
DILIGENCE_ROUTER_API_KEYS: "..."
DILIGENCE_PROFILE_API_KEYS: "..."
DILIGENCE_REGISTRY_API_KEYS: "..."
DILIGENCE_FINAL_API_KEYS: "..."
DILIGENCE_REPAIR_API_KEYS: "..."

DILIGENCE_SEARCH_MODEL_SEQUENCE: "gemini-2.5-flash-lite,gemini-2.5-flash"
DILIGENCE_EXTRACT_MODEL_SEQUENCE: "gemini-2.5-flash-lite,gemini-2.5-flash"
DILIGENCE_ROUTER_MODEL_SEQUENCE: "gemini-2.5-flash-lite,gemini-2.5-flash"
DILIGENCE_PROFILE_MODEL_SEQUENCE: "gemini-2.5-flash,gemini-2.5-flash-lite"
DILIGENCE_REGISTRY_MODEL_SEQUENCE: "gemini-2.5-flash,gemini-2.5-flash-lite"
DILIGENCE_FINAL_MODEL_SEQUENCE: "gemini-2.5-flash,gemini-2.5-flash-lite"
DILIGENCE_REPAIR_MODEL_SEQUENCE: "gemini-2.5-flash-lite,gemini-2.5-flash"
```

Fallback behavior:
- If pool-specific key env is missing, the server may fall back to `GEMINI_API_KEYS` / `GEMINI_API_KEY` during migration.
- If pool-specific model sequence env is missing, the server uses locked defaults for that pool.
- This migration fallback must not be confused with the final split-prompt production policy.

## Production Policy

When split prompt runtime is activated:
- Search may use grounding.
- Extract/router/profile/registry/final/repair must not use grounding.
- Registry execution must be batched and server-validated.
- Final output must be compiled from validated upstream handoffs only.

