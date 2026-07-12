import { runSingleArtifactTargetedOwnerAdapter } from "./targeted-owner-common.js";

export const PHASE11_PHASE8_TARGETED_REINVESTIGATION_VERSION = "phase11_phase8_targeted_reinvestigation.v1";

export async function runPhase8TargetedReinvestigation(params = {}) {
  return runSingleArtifactTargetedOwnerAdapter({
    ...params,
    ownerInternalJob: "DOMAIN_CONTROL_OBLIGATION_PROFILE",
    canonicalArtifactName: "domain_control_obligation_profile",
    promptPhase: "PHASE11_TARGETED_REINVESTIGATION:DOMAIN_CONTROL_OBLIGATION_PROFILE",
    ownerNotes: "Phase 8 targeted adapter: existing obligation row/field only; candidate inventory, package identity and row order must be preserved."
  });
}
