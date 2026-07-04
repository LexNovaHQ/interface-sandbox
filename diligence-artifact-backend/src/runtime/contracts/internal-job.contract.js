import { PHASE_CONTRACTS, getPhaseContract } from "../../phase-contracts.js";
import { centralPhaseForInternalJob, centralPhaseStatusForInternalJob } from "./central-phase.contract.js";

export const INTERNAL_JOB_ALIASES = Object.freeze({
  RENDERER: "NORMALIZED_REPORT_RENDERER"
});

export const SYNTHETIC_INTERNAL_JOB_CONTRACTS = Object.freeze({
  NORMALIZED_REPORT_RENDERER: {
    type: "deterministic",
    actor_id: "portfolio_renderer",
    reads: ["final_output_handoff", "normalized_report_manifest"],
    writes: ["renderer_payload"],
    next: "QUALIFIED_REVIEW",
    compatibility_alias: "RENDERER"
  },
  QUALIFIED_REVIEW: {
    type: "deterministic",
    actor_id: "qualified_review_system",
    reads: ["normalized_report_manifest", "review_ready_section_handoff", "final_output_handoff"],
    writes: [
      "qr_artifact__entity_commercial",
      "qr_artifact__technology_infrastructure",
      "qr_artifact__ai_capability_product_behavior",
      "qr_artifact__dap_privacy_india_cyber",
      "qualified_review_renderer_payload",
      "qualified_review_validation_manifest"
    ],
    next: "DILIGENCE_QA_COMPLETE"
  },
  DILIGENCE_QA_COMPLETE: {
    type: "deterministic",
    actor_id: "diligence_qa_gate",
    reads: ["renderer_payload", "qualified_review_renderer_payload", "qualified_review_validation_manifest"],
    writes: ["diligence_qa_completion_receipt"],
    next: "COMPLETE"
  },
  QUALIFIED_REVIEW_SUBMISSION: {
    type: "public_runtime_save",
    actor_id: "qualified_review_system",
    reads: ["qualified_review_renderer_payload"],
    writes: ["qualified_review_submission"],
    next: "ASSEMBLY_ENGINE"
  },
  ASSEMBLY_ENGINE: {
    type: "post_diligence_product_layer",
    actor_id: "assembly_engine",
    reads: ["qualified_review_submission"],
    writes: [],
    next: null,
    status: "NEXT_ACTIVE_BUILD_TARGET"
  }
});

export function normalizeInternalJobId(internalJobId) {
  return INTERNAL_JOB_ALIASES[internalJobId] || internalJobId;
}

export function getInternalJobContract(internalJobId) {
  const normalized = normalizeInternalJobId(internalJobId);
  if (SYNTHETIC_INTERNAL_JOB_CONTRACTS[normalized]) return SYNTHETIC_INTERNAL_JOB_CONTRACTS[normalized];
  if (internalJobId === "NORMALIZED_REPORT_RENDERER") return SYNTHETIC_INTERNAL_JOB_CONTRACTS.NORMALIZED_REPORT_RENDERER;
  return getPhaseContract(internalJobId);
}

export function listInternalJobContracts() {
  const current = Object.entries(PHASE_CONTRACTS).map(([internal_job_id, contract]) => ({
    internal_job_id,
    normalized_internal_job_id: normalizeInternalJobId(internal_job_id),
    central_phase: centralPhaseStatusForInternalJob(normalizeInternalJobId(internal_job_id)),
    contract
  }));
  const synthetic = Object.entries(SYNTHETIC_INTERNAL_JOB_CONTRACTS).map(([internal_job_id, contract]) => ({
    internal_job_id,
    normalized_internal_job_id: internal_job_id,
    central_phase: centralPhaseStatusForInternalJob(internal_job_id),
    contract,
    synthetic: true
  }));
  return [...current, ...synthetic];
}

export function centralPhaseForCurrentInternalJob(internalJobId) {
  return centralPhaseForInternalJob(normalizeInternalJobId(internalJobId));
}
