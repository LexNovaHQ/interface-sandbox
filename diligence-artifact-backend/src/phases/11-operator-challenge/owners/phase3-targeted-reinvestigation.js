import { runSingleArtifactTargetedOwnerAdapter } from "./targeted-owner-common.js";

export const PHASE11_PHASE3_TARGETED_REINVESTIGATION_VERSION = "phase11_phase3_targeted_reinvestigation.v1";

export async function runPhase3TargetedReinvestigation(params = {}) {
  return runSingleArtifactTargetedOwnerAdapter({
    ...params,
    ownerInternalJob: "P3_DOMAIN_DERIVATION_LAYER",
    canonicalArtifactName: "domain_derivation_profile",
    promptPhase: "PHASE11_TARGETED_REINVESTIGATION:P3_DOMAIN_DERIVATION_LAYER",
    ownerNotes: "Phase 3 targeted adapter: existing domain_derivation_profile only; package remount/full phase rerun forbidden."
  });
}
