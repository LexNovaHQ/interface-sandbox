import { assertNormalizedProfilerOutput as assertBaseNormalizedProfilerOutput, validateNormalizedProfilerOutput as validateBaseNormalizedProfilerOutput } from "./normalizer-validator-section10-v4.js";

export function validateNormalizedProfilerOutput(output = {}) {
  const base = validateBaseNormalizedProfilerOutput(output);
  const failures = [...(base.failures || [])];
  const warnings = [...(base.warnings || [])];

  const section4 = JSON.stringify(output.normalized_section__product_activity_ip_profile || {});
  const section5 = JSON.stringify(output.normalized_section__data_provenance_controls || {});
  const section6 = JSON.stringify(output.normalized_section__legal_document_control_review || {});

  if (!section4.includes("commercial_availability_posture") || !section4.includes("Commercial Availability Posture")) failures.push("Section 4 missing commercial availability posture subsection");
  if (!section5.includes("privacy_contact_consent_manager_readiness") || !section5.includes("Privacy Contact & Consent Manager Readiness")) failures.push("Section 5 missing privacy contact / consent manager readiness subsection");
  if (!section6.includes("legal_signal_derivation_summary") || !section6.includes("Legal Signal Derivation Summary")) failures.push("Section 6 missing legal signal derivation summary subsection");
  if (section6.includes("qualified_review_legal_signals")) failures.push("Section 6 still contains retired qualified_review_legal_signals object");

  return {
    ...base,
    status: failures.length ? "REPAIR_REQUIRED" : base.status,
    failures,
    warnings,
    validator_version: "normalizer_validator_v8_legal_signal_profile_sync"
  };
}

export function assertNormalizedProfilerOutput(output = {}) {
  const validation = validateNormalizedProfilerOutput(output);
  if (validation.status !== "PASS") throw new Error(`NORMALIZER_VALIDATION_FAILED:${JSON.stringify(validation)}`);
  return validation;
}

export { assertBaseNormalizedProfilerOutput };
