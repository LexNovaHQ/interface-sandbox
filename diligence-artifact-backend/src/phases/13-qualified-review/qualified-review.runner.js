import { buildPhase13DomainFieldResolutionArtifacts } from "./phase13-domain-field-resolution.builder.js";
import { buildQualifiedReviewPresentation } from "./presentation/qualified-review-presentation.builder.js";

export const QUALIFIED_REVIEW_RUNNER_VERSION = "phase13_qualified_review_runner.v1";
export const QUALIFIED_REVIEW_PAUSE_PHASE = "AWAITING_QUALIFIED_REVIEW";

export function runQualifiedReviewPhase({ run = {}, artifacts = {}, reviewer_values = {} } = {}) {
  const phase13 = buildPhase13DomainFieldResolutionArtifacts({
    domain_derivation_profile: artifacts.domain_derivation_profile || {},
    active_run_package_manifest: artifacts.active_run_package_manifest || {},
    phase12_report_artifacts: artifacts,
    reviewer_values,
    run_mode: run.run_mode || run.mode || "PRODUCTION"
  });
  const presentation = buildQualifiedReviewPresentation({ run, phase13 });
  const status = statusFor({ phase13, presentation });
  return Object.freeze({
    runner_version: QUALIFIED_REVIEW_RUNNER_VERSION,
    phase_lock_status: status,
    next_phase: QUALIFIED_REVIEW_PAUSE_PHASE,
    output: Object.freeze({ ...phase13, ...presentation })
  });
}

function statusFor({ phase13, presentation }) {
  if (phase13.qr_registry_structural_validation?.status !== "PASS") return "CONTROLLED_FAILURE";
  if (presentation.qualified_review_validation_manifest?.status === "FAIL") return "CONTROLLED_FAILURE";
  if ([
    phase13.phase13_domain_field_resolution_summary?.status,
    presentation.qualified_review_validation_manifest?.phase_lock_status
  ].includes("LOCKED_WITH_LIMITATIONS")) return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}
