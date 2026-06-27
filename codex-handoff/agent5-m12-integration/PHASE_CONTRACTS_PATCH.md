# PHASE CONTRACTS PATCH SPEC

File: `diligence-artifact-backend/src/phase-contracts.js`

Goal: route M12 global through Agent 5 package instead of orphan `agent_7_m12.md`.

## Add constant

After `AGENT_5_M11_FILES`, add:

```js
const AGENT_5_M12_GLOBAL_FILES = Object.freeze([
  SYSTEM_BLOCKING_DOCTRINE_FILE,
  `${AGENT_5_M11_PACKAGE_ROOT}/` + packetFile("AGENT5_RUNTIME_", "_SYNCED_M11.yaml"),
  `${AGENT_5_M11_PACKAGE_ROOT}/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/M12_GLOBAL_CHALLENGE.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/BACKEND_CANONICAL_OUTPUT_ADAPTER.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/00_TERMINAL_RECEIPT_RULES_INTEGRATED_AGENT5_SYNCED.md`
]);
```

## Replace M12 contract

Replace current M12 contract with:

```js
M12: {
  type: "model",
  agent_id: "agent_5_exposure_registry",
  prompt_files: AGENT_5_M12_GLOBAL_FILES,
  reads: [
    "source_discovery_handoff",
    "legal_cartography_index",
    "target_profile",
    "target_profile_forensics",
    "target_feature_profile",
    "target_feature_profile_forensics",
    "data_provenance_profile",
    "data_provenance_profile_forensics",
    "exposure_registry_route_plan",
    "exposure_registry_workpad_98",
    "exposure_registry_controlled_profile",
    "exposure_registry_triggered_profile",
    "exposure_registry_profile_forensics"
  ],
  writes: ["challenge_gate"],
  next: "COMPILER"
}
```

## Do not change

Do not change `COMPILER`, `RENDERER`, or M11 writes in this patch.

## Required effect

- Backend no longer attempts to load missing `agent_7_m12.md`.
- Backend uses Agent 5 package to run global challenge.
- M12 still writes `challenge_gate` only.
