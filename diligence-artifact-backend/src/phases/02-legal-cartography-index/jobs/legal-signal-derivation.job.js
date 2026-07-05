import { buildLegalSignalDerivationProfile } from "../services/legal-signal-derivation.service.js";
import { assertLegalSignalDerivationProfile } from "../validators/legal-signal-derivation.validator.js";

export const LEGAL_SIGNAL_DERIVATION_JOB = Object.freeze({
  phase_id: "LEGAL_CARTOGRAPHY_INDEX",
  job_id: "LEGAL_SIGNAL_DERIVATION",
  public_label: "Legal Signal Derivation",
  implementation_status: "PHASE_OWNED_IMPLEMENTATION_VALIDATOR_LOCKED",
  model_usage: "NONE",
  output_artifact: "legal_signal_derivation_profile"
});

export async function buildLegalSignalDerivation({ run, artifacts = {} } = {}) {
  const output = buildLegalSignalDerivationProfile({ run, artifacts });
  assertLegalSignalDerivationProfile(output);
  return output;
}
