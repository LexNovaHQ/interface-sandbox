import { getRunRecord, updateRunRecord } from "./storage/firestore.service.js";
import { advanceReviewerRun } from "../../reviewer-runner-normalized.js";
import { centralPhaseStatusForInternalJob } from "../contracts/central-phase.contract.js";

export function decorateRunWithCentralPhase(run = {}) {
  const currentPhase = run.current_phase || "";
  const central = centralPhaseStatusForInternalJob(currentPhase === "RENDERER" ? "NORMALIZED_REPORT_RENDERER" : currentPhase);
  return {
    ...run,
    central_phase: run.central_phase || central.central_phase_id,
    central_phase_label: run.central_phase_label || central.central_phase_label,
    active_internal_job: currentPhase
  };
}

export async function advanceCentralPipelineRun({ run_id } = {}) {
  const result = await advanceReviewerRun({ run_id });
  const run = await getRunRecord(run_id);
  const decorated = decorateRunWithCentralPhase(run);
  await updateRunRecord(run_id, {
    central_phase: decorated.central_phase,
    central_phase_label: decorated.central_phase_label,
    active_internal_job: decorated.active_internal_job
  });
  return { ...result, central_phase: decorated.central_phase, central_phase_label: decorated.central_phase_label, active_internal_job: decorated.active_internal_job };
}

export const PIPELINE_SERVICE_STATUS = Object.freeze({
  central_runtime_service: "pipeline.service",
  migration_status: "bridge_to_existing_reviewer_runner_normalized",
  old_runner_files_untouched: true
});
