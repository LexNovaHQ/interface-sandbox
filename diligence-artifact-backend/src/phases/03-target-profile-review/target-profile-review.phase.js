import { TARGET_PROFILE_REVIEW_CONTRACT } from "./target-profile-review.contract.js";

export const TARGET_PROFILE_REVIEW_PHASE = Object.freeze({
  order: 3,
  phase_id: TARGET_PROFILE_REVIEW_CONTRACT.central_phase_id,
  public_label: TARGET_PROFILE_REVIEW_CONTRACT.public_label,
  implementation_status: TARGET_PROFILE_REVIEW_CONTRACT.implementation_status,
  production_entrypoint_switched: TARGET_PROFILE_REVIEW_CONTRACT.production_entrypoint_switched,
  responsibility: "Derive the public target identity, jurisdiction notice, business context, and product/service wrapper profile from admitted target-family source material, with bounded direct legal signal support only for owned legal-notice and jurisdiction fields.",
  material_outputs: [...TARGET_PROFILE_REVIEW_CONTRACT.material_job.writes],
  primary_read_artifacts: TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads.filter((artifact) => artifact.startsWith("lossless_family__T") || artifact === "source_discovery_handoff"),
  secondary_bounded_read_artifacts: ["legal_signal_derivation_profile"],
  forbidden_read_artifacts: [...TARGET_PROFILE_REVIEW_CONTRACT.material_job.forbidden_reads],
  runtime_boundary: "Runtime orchestrates. This phase owns Target Profile Review logic after helper migration. Raw Legal Cartography index and legal-governance source families are not Target Profile Review model evidence."
});
