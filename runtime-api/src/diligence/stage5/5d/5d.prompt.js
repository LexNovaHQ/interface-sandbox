import { STAGE5D_DICTIONARY } from "./5d.dictionary.js";

export function buildStage5DIntegratorInput({ canonicalInput, stage5a, stage5b, stage5c } = {}) {
  return {
    substage: "5D",
    task: "target_feature_profile_integrator",
    target_profile_ref: canonicalInput?.target_profile_ref || {},
    custody_manifest_required: true,
    source_window_validation_required: true,
    stage5a_validation: stage5a?.validation || {},
    stage5b_validation: stage5b?.validation || {},
    stage5c_validation: stage5c?.validation || {},
    dictionary: STAGE5D_DICTIONARY
  };
}
