import { runSingleArtifactTargetedOwnerAdapter } from "./targeted-owner-common.js";

export const PHASE11_PHASE5_TARGETED_REINVESTIGATION_VERSION = "phase11_phase5_targeted_reinvestigation.v1";

export async function runPhase5TargetedReinvestigation(params = {}) {
  return runSingleArtifactTargetedOwnerAdapter({
    ...params,
    ownerInternalJob: "M8_TARGET_FEATURE_PROFILE",
    canonicalArtifactName: "target_feature_profile",
    promptPhase: "PHASE11_TARGETED_REINVESTIGATION:M8_TARGET_FEATURE_PROFILE",
    ownerNotes: "Phase 5 targeted adapter: existing activity row/field only; candidate inventory, taxonomy identity and row order must be preserved."
  });
}
