import { CHECK_STATUSES } from "./test-support/check-severity.mjs";

const ADVISORY_STATUSES = Object.freeze([
  CHECK_STATUSES.MATERIAL_REINVESTIGATION,
  CHECK_STATUSES.PASS_WITH_WARNING
]);

const CRITICAL_ONLY = Object.freeze([]);

export const PRODUCTION_GATE_CHECKS = Object.freeze([
  gate("severity-policy", "Production gate severity policy", "check:production-gate-severity", "STRUCTURAL_RUNTIME_SAFETY", CRITICAL_ONLY),
  gate("syntax", "Active production syntax", "check:syntax:active", "STRUCTURAL_RUNTIME_SAFETY", CRITICAL_ONLY),
  gate("domain-gate", "Domain gate v0", "check:domain-gate-v0", "STRUCTURAL_RUNTIME_SAFETY", CRITICAL_ONLY),
  gate("phase1-8-runtime", "Phase 1-8 central runtime", "check:phase1-8-runtime", "PHASE_BOUNDARY_INTEGRITY", CRITICAL_ONLY),
  gate("phase3a-target-profile", "Phase 3A target profile", "check:phase3a-target-profile", "MATERIAL_OUTPUT_INTEGRITY", ADVISORY_STATUSES),
  gate("phase3-domain-derivation", "Phase 3 domain derivation", "check:phase3-domain-derivation", "MATERIAL_OUTPUT_INTEGRITY", ADVISORY_STATUSES),
  gate("phase3-sync", "Phase 3 runtime sync", "check:phase3-sync-v0", "PHASE_BOUNDARY_INTEGRITY", CRITICAL_ONLY),
  gate("phase4-target-forensics", "Phase 4 target profile forensics", "check:phase4-target-profile-forensics", "MATERIAL_OUTPUT_INTEGRITY", ADVISORY_STATUSES),
  gate("phase5-activity-profile", "Phase 5 activity profile", "check:phase5-activity-profile", "MATERIAL_OUTPUT_INTEGRITY", ADVISORY_STATUSES),
  gate("phase6-activity-forensics", "Phase 6 activity profile forensics", "check:phase6-activity-profile-forensics", "MATERIAL_OUTPUT_INTEGRITY", ADVISORY_STATUSES),
  gate("phase7-data-provenance", "Phase 7 data provenance profile", "check:phase7-data-provenance-profile", "MATERIAL_OUTPUT_INTEGRITY", ADVISORY_STATUSES),
  gate("phase8-sector-obligations", "Phase 8 sector control obligations", "check:phase8-domain-control-obligation", "MATERIAL_OUTPUT_INTEGRITY", ADVISORY_STATUSES),
  gate("runtime-yaml", "Runtime YAML dependency", "check:runtime-yaml-dep", "STRUCTURAL_RUNTIME_SAFETY", CRITICAL_ONLY),
  gate("phase10-exposure", "Phase 10 exposure profile", "check:phase10-full", "MATERIAL_OUTPUT_INTEGRITY", ADVISORY_STATUSES),
  gate("phase11-operator-challenge", "Phase 11 operator challenge", "check:phase11-critical", "MATERIAL_OUTPUT_INTEGRITY", ADVISORY_STATUSES),
  gate("phase12-production", "Phase 12 production compiler and renderer", "check:phase12-production", "PHASE_BOUNDARY_INTEGRITY", CRITICAL_ONLY),
  gate("runtime-authority", "Runtime authority boundaries", "check:runtime-authority-boundaries", "PHASE_BOUNDARY_INTEGRITY", CRITICAL_ONLY),
  gate("domain-registry", "Assembled domain registry", "check:domain-registry-assembled", "STRUCTURAL_RUNTIME_SAFETY", CRITICAL_ONLY)
]);

function gate(id, label, script, category, allowedNonBlockingStatuses) {
  return Object.freeze({
    id,
    label,
    script,
    category,
    allowed_non_blocking_statuses: allowedNonBlockingStatuses
  });
}
