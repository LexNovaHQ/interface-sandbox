import { buildLegalSignalDerivationProfile } from "../services/legal-signal-derivation.service.js";

export const LEGAL_SIGNAL_DERIVATION_JOB = Object.freeze({
  phase_id: "LEGAL_CARTOGRAPHY_INDEX",
  job_id: "LEGAL_SIGNAL_DERIVATION",
  public_label: "Legal Signal Derivation",
  implementation_status: "PHASE_OWNED_IMPLEMENTATION_PENDING_VALIDATOR",
  model_usage: "NONE",
  output_artifact: "legal_signal_derivation_profile"
});

export async function buildLegalSignalDerivation({ run, artifacts = {} } = {}) {
  const output = buildLegalSignalDerivationProfile({ run, artifacts });
  assertLegalSignalJobBoundary(output);
  return output;
}

function assertLegalSignalJobBoundary(output) {
  const root = output?.legal_signal_derivation_profile;
  if (!root) throw new Error("LEGAL_SIGNAL_DERIVATION_PROFILE_MISSING_ROOT");
  if (root.model_generated !== false) throw new Error("LEGAL_SIGNAL_DERIVATION_MODEL_GENERATED_NOT_FALSE");
  if (root.validation_manifest?.qr_pollution_present) throw new Error("LEGAL_SIGNAL_DERIVATION_QR_POLLUTION_PRESENT");
  if (root.validation_manifest?.unknown_status_present) throw new Error("LEGAL_SIGNAL_DERIVATION_UNKNOWN_STATUS_PRESENT");
  if (root.coverage_summary?.emitted_field_count !== 21) throw new Error(`LEGAL_SIGNAL_DERIVATION_FIELD_COUNT_INVALID:${root.coverage_summary?.emitted_field_count}`);
}
