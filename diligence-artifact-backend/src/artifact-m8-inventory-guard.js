const ACCEPTED = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS"]);
const LOCK_ADVANCE = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE"]);
const TP = "target_profile";
const TPF = "target_profile_forensics";
const FCI = "feature_candidate_inventory";
const TFP = "target_feature_profile";
const TFPF = "target_feature_profile_forensics";
const DPP = "data_provenance_profile";

export async function assertM8InventorySaveGate(parsed, helpers) {
  const { run_id, phase, artifact_name } = parsed;
  const allowed = {
    M7_TARGET_PROFILE: [TP],
    M7_TARGET_PROFILE_FORENSICS: [TPF],
    M8_FEATURE_CANDIDATE_INVENTORY: [FCI],
    M8_TARGET_FEATURE_PROFILE: [TFP],
    M8_TARGET_FEATURE_PROFILE_FORENSICS: [TFPF]
  }[phase];
  if (allowed && !allowed.includes(artifact_name)) throw new Error(`PHASE_WRITE_FORBIDDEN:${phase}:${artifact_name}`);

  if (artifact_name === FCI) {
    await helpers.requireSavedArtifact(run_id, TP, "SAVE_ORDER_BLOCKED:feature_candidate_inventory_requires_target_profile");
    await helpers.requireSavedArtifact(run_id, TPF, "SAVE_ORDER_BLOCKED:feature_candidate_inventory_requires_target_profile_forensics");
    await helpers.requirePhaseAccepted(run_id, TPF, "SAVE_ORDER_BLOCKED:feature_candidate_inventory_requires_locked_m7");
  }

  if ([TFP, TFPF, DPP].includes(artifact_name)) {
    await helpers.requireSavedArtifact(run_id, FCI, `SAVE_ORDER_BLOCKED:${artifact_name}_requires_feature_candidate_inventory`);
    await helpers.requirePhaseAccepted(run_id, FCI, `SAVE_ORDER_BLOCKED:${artifact_name}_requires_locked_feature_candidate_inventory`);
  }

  if (artifact_name === TFPF) {
    await helpers.requirePhaseAccepted(run_id, TFP, "SAVE_ORDER_BLOCKED:target_feature_profile_forensics_requires_locked_target_feature_profile");
  }
}

export async function assertM8InventoryLockGate(body, helpers) {
  const { run_id, phase, status } = body;
  if (!LOCK_ADVANCE.has(status)) return;

  if (phase === "M8_FEATURE_CANDIDATE_INVENTORY") {
    await helpers.requireSavedArtifact(run_id, TP, "PHASE_LOCK_BLOCKED:M8_INVENTORY_requires_target_profile");
    await helpers.requireSavedArtifact(run_id, TPF, "PHASE_LOCK_BLOCKED:M8_INVENTORY_requires_target_profile_forensics");
    await helpers.requirePhaseAccepted(run_id, TPF, "PHASE_LOCK_BLOCKED:M8_INVENTORY_requires_locked_m7");
  }

  if (["M8_TARGET_FEATURE_PROFILE", "M8_TARGET_FEATURE_PROFILE_FORENSICS", "M10", "M10_FORENSICS"].includes(phase)) {
    await helpers.requireSavedArtifact(run_id, FCI, `PHASE_LOCK_BLOCKED:${phase}_requires_feature_candidate_inventory`);
    await helpers.requirePhaseAccepted(run_id, FCI, `PHASE_LOCK_BLOCKED:${phase}_requires_locked_feature_candidate_inventory`);
  }

  if (phase === "M8_TARGET_FEATURE_PROFILE_FORENSICS") {
    await helpers.requireSavedArtifact(run_id, TFP, "PHASE_LOCK_BLOCKED:M8_FORENSICS_requires_target_feature_profile");
    await helpers.requirePhaseAccepted(run_id, TFP, "PHASE_LOCK_BLOCKED:M8_FORENSICS_requires_locked_target_feature_profile");
  }
}

export function isAcceptedStatus(status) { return ACCEPTED.has(status); }
