import assert from "node:assert/strict";
import { runPhase11RegisteredOwnerAdapter, PHASE11_OWNER_ADAPTER_REGISTRY_VERSION } from "../src/phases/11-operator-challenge/operator-challenge-owner-adapter.registry.js";
import { printReceipt } from "./phase11-executable-test-fixtures.mjs";

assert.equal(PHASE11_OWNER_ADAPTER_REGISTRY_VERSION, "phase11_owner_adapter_registry.v2");
assert.equal(typeof runPhase11RegisteredOwnerAdapter, "function");

printReceipt("phase11 owner adapters", ["CO14-16", "CO14-17"], 2, { runtime_versions: { owner_adapter_registry: PHASE11_OWNER_ADAPTER_REGISTRY_VERSION } });
