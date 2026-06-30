import { getNextArtifactVersion, saveArtifactMetadata, logEvent, updateRunRecord } from "./firestore.js";
import { updateRunDashboardRow } from "./sheets.js";
import { saveJsonArtifactToDrive } from "./drive.js";
import { readArtifactPayload } from "./artifact-service.js";
import { buildIntegratedDapReport } from "./integrated-dap-report.js";

const NAME = "integrated_dap_report";
const ACTOR = "agent_4c_integrated_dap_compiler";

export async function runAgent4cIntegratedDapReportPhase({ run, phase, contract }) {
  let status = "LOCKED_WITH_LIMITATIONS";
  try {
    const artifacts = {};
    for (const name of contract.reads || []) {
      try { artifacts[name] = await readArtifactPayload({ run_id: run.run_id, artifact_name: name, agent_id: "operator" }); }
      catch (_e) { artifacts[name] = null; }
    }
    const output = buildIntegratedDapReport({ run, artifacts });
    const artifact = output?.[NAME];
    if (!artifact || typeof artifact !== "object") throw new Error("AGENT4C_OUTPUT_MISSING");
    status = artifact.status === "LOCKED" || artifact.lock_status === "LOCKED" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS";
    const version = await getNextArtifactVersion(run.run_id, NAME);
    const drive = await saveJsonArtifactToDrive({ run_id: run.run_id, artifact_name: NAME, version, drive_folder_id: run.drive_folder_id, artifact });
    await saveArtifactMetadata({ run_id: run.run_id, artifact_name: NAME, phase, agent_id: ACTOR, lock_status: status, version, drive_file_id: drive.drive_file_id, drive_web_view_link: drive.drive_web_view_link, drive_folder_id: run.drive_folder_id, artifact_size_bytes: drive.artifact_size_bytes });
    await logEvent({ run_id: run.run_id, event_type: "AGENT4C_COMPLETED", actor: ACTOR, payload: { artifact_name: NAME, lock_status: status, row_count: artifact.coverage_summary?.row_count || 0 } });
  } catch (error) {
    await logEvent({ run_id: run.run_id, event_type: "AGENT4C_LIMITED", actor: ACTOR, payload: { artifact_name: NAME, note: error?.message || String(error) } });
  }
  const updated = await updateRunRecord(run.run_id, { current_phase: contract.next, status });
  await updateRunDashboardRow(updated);
  await logEvent({ run_id: run.run_id, event_type: "PHASE_LOCKED", actor: ACTOR, payload: { phase, status, next_phase: contract.next } });
}
