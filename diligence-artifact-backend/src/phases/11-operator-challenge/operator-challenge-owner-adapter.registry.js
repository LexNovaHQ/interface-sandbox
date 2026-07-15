import { runPhase3TargetedReinvestigation } from "./owners/phase3-targeted-reinvestigation.js";
import { runPhase5TargetedReinvestigation } from "./owners/phase5-targeted-reinvestigation.js";
import { runPhase7TargetedReinvestigation } from "./owners/phase7-targeted-reinvestigation.js";
import { runPhase8TargetedReinvestigation } from "./owners/phase8-targeted-reinvestigation.js";
import { runPhase10TargetedReinvestigation } from "./phase10-targeted-reinvestigation.js";

export const PHASE11_OWNER_ADAPTER_REGISTRY_VERSION = "phase11_owner_adapter_registry.v2";

const ADAPTERS = new Map([
  ["P3_DOMAIN_DERIVATION_LAYER", runPhase3TargetedReinvestigation],
  ["M8_TARGET_FEATURE_PROFILE", runPhase5TargetedReinvestigation],
  ["DATA_PROVENANCE_PROFILE_LAYER4", runPhase7TargetedReinvestigation],
  ["DOMAIN_CONTROL_OBLIGATION_PROFILE", runPhase8TargetedReinvestigation],
  ["M11", runPhase10TargetedReinvestigation]
]);

export const PHASE11_TARGETED_OWNER_ADAPTERS = Object.freeze({
  schema_version: PHASE11_OWNER_ADAPTER_REGISTRY_VERSION,
  ordinary_owner_runners_forbidden: true,
  registered_owner_jobs: [...ADAPTERS.keys()],
  pending_owner_jobs: []
});

export function registerPhase11OwnerAdapter(ownerInternalJob, adapter) {
  const owner = String(ownerInternalJob || "");
  if (!owner) throw new Error("PHASE11_OWNER_ADAPTER_OWNER_MISSING");
  if (typeof adapter !== "function") throw new Error(`PHASE11_OWNER_ADAPTER_INVALID:${owner}`);
  ADAPTERS.set(owner, adapter);
  return true;
}

export function getPhase11OwnerAdapter(ownerInternalJob) {
  const owner = String(ownerInternalJob || "");
  const adapter = ADAPTERS.get(owner);
  if (!adapter) throw new Error(`PHASE11_TARGETED_OWNER_ADAPTER_NOT_REGISTERED:${owner || "missing"}`);
  return adapter;
}

export async function runPhase11RegisteredOwnerAdapter({ ownerInternalJob, ...params } = {}) {
  const adapter = getPhase11OwnerAdapter(ownerInternalJob);
  return adapter({ ...params, ownerInternalJob });
}
