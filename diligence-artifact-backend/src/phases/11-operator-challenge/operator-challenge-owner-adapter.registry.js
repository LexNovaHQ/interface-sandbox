import { runPhase10TargetedReinvestigation } from "./phase10-targeted-reinvestigation.js";

export const PHASE11_OWNER_ADAPTER_REGISTRY_VERSION = "phase11_owner_adapter_registry.v1";

const ADAPTERS = new Map([
  ["M11", runPhase10TargetedReinvestigation]
]);

export const PHASE11_TARGETED_OWNER_ADAPTERS = Object.freeze({
  schema_version: PHASE11_OWNER_ADAPTER_REGISTRY_VERSION,
  ordinary_owner_runners_forbidden: true,
  registered_owner_jobs: ["M11"],
  pending_owner_jobs: [
    "P3_DOMAIN_DERIVATION_LAYER",
    "M8_TARGET_FEATURE_PROFILE",
    "DATA_PROVENANCE_PROFILE_LAYER4",
    "DOMAIN_CONTROL_OBLIGATION_PROFILE"
  ]
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
