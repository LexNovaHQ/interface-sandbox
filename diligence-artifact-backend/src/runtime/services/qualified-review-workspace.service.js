import { getInternalJobContract } from "../contracts/internal-job.contract.js";
import { readRuntimeArtifactPayload, saveRuntimeArtifact } from "./artifacts.service.js";
import { updateRunRecord, logEvent } from "./storage/firestore.service.js";
import { runQualifiedReviewPhase, QUALIFIED_REVIEW_PAUSE_PHASE } from "../../phases/13-qualified-review/qualified-review.runner.js";

export async function rebuildQualifiedReviewWorkspace({ run, reviewer_values = {} } = {}) {
  const contract = getInternalJobContract("QUALIFIED_REVIEW");
  const artifacts = {};
  for (const artifact_name of contract.reads || []) {
    artifacts[artifact_name] = await readRuntimeArtifactPayload({ run_id: run.run_id, artifact_name, agent_id: contract.actor_id });
  }
  const result = runQualifiedReviewPhase({ run, artifacts, reviewer_values });
  for (const artifact_name of contract.writes || []) {
    const artifact = result.output[artifact_name];
    if (!artifact) throw new Error(`QUALIFIED_REVIEW_OUTPUT_MISSING:${artifact_name}`);
    await saveRuntimeArtifact({ run_id: run.run_id, phase: "QUALIFIED_REVIEW", agent_id: contract.actor_id, artifact_name, artifact, lock_status: result.phase_lock_status });
  }
  const paused = await updateRunRecord(run.run_id, {
    current_phase: QUALIFIED_REVIEW_PAUSE_PHASE,
    status: QUALIFIED_REVIEW_PAUSE_PHASE,
    central_phase: "QUALIFIED_REVIEW",
    central_phase_label: "Qualified Review",
    active_internal_job: "QUALIFIED_REVIEW",
    runner_state: "IDLE",
    runner_auto_continue: false,
    qualified_review_ready: true,
    qualified_review_ready_at: new Date().toISOString()
  });
  await logEvent({ run_id: run.run_id, event_type: "QUALIFIED_REVIEW_WORKSPACE_REBUILT", actor: contract.actor_id, payload: { phase_lock_status: result.phase_lock_status, active_field_count: result.output.qr_active_field_ledger?.counts?.active_field_count || 0, active_section_count: result.output.qr_active_field_ledger?.counts?.active_section_count || 0 } });
  return { run: paused, result };
}
