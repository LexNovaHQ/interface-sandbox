import { requireRuntimeConfig } from "../../config.js";
import { createRunId, nowIso } from "../../run-id.js";
import { createRunFolder } from "../../drive.js";
import { createRunRecord, updateRunRecord } from "../../firestore.js";
import { appendRunDashboardRow, updateRunDashboardRow } from "../../sheets.js";

export function normalizeTargetUrl(value) {
  const raw = String(value || "").trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  url.hash = "";
  return url.toString();
}

export function hostFromUrl(value) {
  return new URL(value).hostname.replace(/^www\./i, "");
}

export async function createDiligenceRun({ target = "", target_url = "", root_url = "", source_mode = "url", created_by = "operator", notes = "", runner_mode = "CLOUD_TASKS_RUNNER", runner_state = "IDLE" } = {}) {
  requireRuntimeConfig();
  const targetUrl = normalizeTargetUrl(target_url || root_url || target);
  const resolvedTarget = target || hostFromUrl(targetUrl);
  const createdAt = nowIso();
  const runId = createRunId(resolvedTarget);
  const folder = await createRunFolder({ run_id: runId });
  const run = {
    ok: true,
    run_id: runId,
    target: resolvedTarget,
    root_url: targetUrl,
    source_mode,
    status: "CREATED",
    current_phase: "AGENT_1A_URL_MANIFEST",
    central_phase: "SOURCE_DISCOVERY",
    central_phase_label: "Source Discovery",
    runner_mode,
    runner_state,
    created_by,
    notes: notes || "",
    drive_folder_id: folder.drive_folder_id,
    drive_folder_link: folder.drive_folder_link,
    final_report_url: "",
    created_at: createdAt,
    updated_at: createdAt,
    isolation_rule: "Artifacts may be read only by exact run_id and artifact_name. Company/domain lookup is forbidden."
  };
  await createRunRecord(run);
  const sheetRow = await appendRunDashboardRow(run);
  const saved = await updateRunRecord(runId, { sheet_row_number: sheetRow });
  await updateRunDashboardRow(saved);
  return saved;
}

export function publicRunCreatedResponse(run) {
  return {
    ok: true,
    run_id: run.run_id,
    status: run.status,
    current_phase: run.current_phase,
    central_phase: run.central_phase || "SOURCE_DISCOVERY",
    central_phase_label: run.central_phase_label || "Source Discovery",
    runner_mode: run.runner_mode || "",
    runner_state: run.runner_state || "",
    drive_folder_link: run.drive_folder_link,
    next_action: `POST /v1/reviewer/jobs/${run.run_id}/advance`,
    poll: `GET /v1/reviewer/jobs/${run.run_id}`
  };
}
