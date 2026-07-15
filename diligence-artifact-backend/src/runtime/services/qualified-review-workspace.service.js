import { QUALIFIED_REVIEW_RUNTIME_READS, QUALIFIED_REVIEW_RUNTIME_WRITES } from "../contracts/phase13-runtime.contract.js";
import { saveJsonArtifactToDrive, readJsonArtifactFromDrive } from "./storage/drive.service.js";
import { getArtifactMetadata, getNextArtifactVersion, saveArtifactMetadata, updateRunRecord, logEvent } from "./storage/firestore.service.js";
import { updateRunDashboardRow } from "./storage/sheets.service.js";
import { runQualifiedReviewPhase, QUALIFIED_REVIEW_PAUSE_PHASE } from "../../phases/13-qualified-review/qualified-review.runner.js";

export async function rebuildQualifiedReviewWorkspace({ run, reviewer_values = {} } = {}) {
  const artifacts = {};
  for (const artifact_name of [...new Set(QUALIFIED_REVIEW_RUNTIME_READS)]) artifacts[artifact_name] = await readArtifact(run.run_id, artifact_name);
  const packageDisposition = resolvePostReviewPackageDisposition(artifacts.active_run_package_manifest || {});
  if (packageDisposition.mode === "REPORT_ONLY") return completeReportOnlyRun({ run, packageDisposition });

  const result = runQualifiedReviewPhase({ run, artifacts, reviewer_values });
  for (const artifact_name of QUALIFIED_REVIEW_RUNTIME_WRITES) {
    const artifact = result.output[artifact_name];
    if (!artifact) throw new Error(`QUALIFIED_REVIEW_OUTPUT_MISSING:${artifact_name}`);
    await persistWorkspaceArtifact({ run, artifact_name, artifact, lock_status: result.phase_lock_status });
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
    qualified_review_ready_at: new Date().toISOString(),
    derived_primary_domain: packageDisposition.derived_primary_domain,
    primary_domain_package: packageDisposition.package_id,
    primary_domain_lifecycle: packageDisposition.lifecycle,
    primary_domain_delivery_mode: packageDisposition.delivery_mode,
    ai_overlay_continuation: packageDisposition.ai_overlay === true,
    unresolved_primary_continuation: packageDisposition.unresolved_primary === true
  });
  await updateRunDashboardRow(paused);
  await logEvent({
    run_id: run.run_id,
    event_type: "QUALIFIED_REVIEW_WORKSPACE_REBUILT",
    actor: "qualified_review_system",
    payload: {
      phase_lock_status: result.phase_lock_status,
      active_field_count: result.output.qr_active_field_ledger?.counts?.active_field_count || 0,
      active_section_count: result.output.qr_active_field_ledger?.counts?.active_section_count || 0,
      next_phase: QUALIFIED_REVIEW_PAUSE_PHASE,
      package_lifecycle: packageDisposition.lifecycle,
      post_review_mode: packageDisposition.mode,
      ai_overlay_continuation: packageDisposition.ai_overlay === true,
      unresolved_primary_continuation: packageDisposition.unresolved_primary === true
    }
  });
  return { run: paused, result, report_only: false };
}

export function resolvePostReviewPackageDisposition(activeManifest = {}) {
  const package_id = String(activeManifest.primary_domain_package || "").trim() || null;
  const derived_primary_domain = String(activeManifest.derived_primary_domain || "").trim() || null;
  const lifecycle = String(activeManifest.primary_domain_lifecycle || "").trim() || null;
  const delivery_mode = String(activeManifest.primary_domain_delivery_mode || "").trim() || null;
  const postReviewMode = String(activeManifest.post_review_delivery_mode || "").trim();
  const aiOverlay = activeManifest.ai_package_mount === "AI_OVERLAY_MOUNTED"
    && activeManifest.ai_package_mount_only === true
    && Array.isArray(activeManifest.capability_overlays)
    && activeManifest.capability_overlays.length > 0;

  if (postReviewMode === "AI_OVERLAY_FULL_REVIEW_READY" && aiOverlay) {
    return Object.freeze({
      package_id,
      derived_primary_domain,
      lifecycle,
      delivery_mode: "AI_OVERLAY_FULL_REVIEW_READY",
      mode: "FULL_REVIEW_READY",
      ai_overlay: true,
      unresolved_primary: !package_id
    });
  }
  if (postReviewMode === "UNIVERSAL_REPORT_ONLY" && !package_id) {
    return Object.freeze({
      package_id: null,
      derived_primary_domain,
      lifecycle: lifecycle || "FALLBACK_ONLY",
      delivery_mode: "UNIVERSAL_REPORT_ONLY",
      mode: "REPORT_ONLY",
      ai_overlay: false,
      unresolved_primary: true
    });
  }
  if (package_id && lifecycle === "ACTIVE_E2E" && delivery_mode === "FULL_REVIEW_READY") {
    return Object.freeze({ package_id, derived_primary_domain, lifecycle, delivery_mode, mode: "FULL_REVIEW_READY", ai_overlay: false, unresolved_primary: false });
  }
  if (package_id && lifecycle === "ACTIVE_REPORT_ONLY" && delivery_mode === "REPORT_ONLY") {
    return Object.freeze({ package_id, derived_primary_domain, lifecycle, delivery_mode, mode: "REPORT_ONLY", ai_overlay: false, unresolved_primary: false });
  }
  if (!package_id && aiOverlay) {
    return Object.freeze({
      package_id: null,
      derived_primary_domain,
      lifecycle: lifecycle || "FALLBACK_ONLY",
      delivery_mode: "AI_OVERLAY_FULL_REVIEW_READY",
      mode: "FULL_REVIEW_READY",
      ai_overlay: true,
      unresolved_primary: true
    });
  }
  if (!package_id) {
    return Object.freeze({
      package_id: null,
      derived_primary_domain,
      lifecycle: lifecycle || "FALLBACK_ONLY",
      delivery_mode: "UNIVERSAL_REPORT_ONLY",
      mode: "REPORT_ONLY",
      ai_overlay: false,
      unresolved_primary: true
    });
  }
  throw new Error(`PACKAGE_LIFECYCLE_NOT_EXECUTABLE_POST_REVIEW:${package_id}:${lifecycle || "missing"}:${delivery_mode || "missing"}:${postReviewMode || "missing"}`);
}

async function completeReportOnlyRun({ run, packageDisposition }) {
  const completedAt = new Date().toISOString();
  const unresolvedPrimary = packageDisposition.unresolved_primary === true;
  const completed = await updateRunRecord(run.run_id, {
    current_phase: "COMPLETE",
    status: "COMPLETE_WITH_WARNINGS",
    central_phase: "COMPLETE",
    central_phase_label: unresolvedPrimary ? "Universal Report-Only Complete" : "Report-Only Complete",
    active_internal_job: "COMPLETE",
    runner_state: "IDLE",
    runner_auto_continue: false,
    report_only_completion: true,
    report_only_completed_at: completedAt,
    qualified_review_skipped: true,
    qualified_review_skip_reason: unresolvedPrimary ? "PRIMARY_DOMAIN_UNRESOLVED_NO_AI_OVERLAY" : "PACKAGE_LIFECYCLE_ACTIVE_REPORT_ONLY",
    review_ready_documents_available: false,
    derived_primary_domain: packageDisposition.derived_primary_domain,
    primary_domain_package: packageDisposition.package_id,
    primary_domain_lifecycle: packageDisposition.lifecycle,
    primary_domain_delivery_mode: packageDisposition.delivery_mode,
    unresolved_primary_continuation: unresolvedPrimary
  });
  await updateRunDashboardRow(completed);
  await logEvent({
    run_id: run.run_id,
    event_type: unresolvedPrimary ? "UNRESOLVED_PRIMARY_UNIVERSAL_REPORT_COMPLETED" : "PACKAGE_LIFECYCLE_REPORT_ONLY_COMPLETED",
    actor: "qualified_review_system",
    payload: {
      derived_primary_domain: packageDisposition.derived_primary_domain,
      primary_domain_package: packageDisposition.package_id,
      lifecycle: packageDisposition.lifecycle,
      delivery_mode: packageDisposition.delivery_mode,
      report_preserved: true,
      qualified_review_skipped: true,
      assembly_skipped: true,
      review_ready_documents_available: false,
      unresolved_primary: unresolvedPrimary,
      completed_at: completedAt
    }
  });
  return { run: completed, result: null, report_only: true };
}

async function readArtifact(runId, artifactName) {
  const meta = await getArtifactMetadata(runId, artifactName);
  return readJsonArtifactFromDrive(meta.drive_file_id);
}

async function persistWorkspaceArtifact({ run, artifact_name, artifact, lock_status }) {
  const version = await getNextArtifactVersion(run.run_id, artifact_name).catch(() => 1);
  const drive = await saveJsonArtifactToDrive({ run_id: run.run_id, artifact_name, version, drive_folder_id: run.drive_folder_id, artifact });
  await saveArtifactMetadata({ run_id: run.run_id, artifact_name, phase: "QUALIFIED_REVIEW", agent_id: "qualified_review_system", lock_status, version, drive_file_id: drive.drive_file_id, drive_web_view_link: drive.drive_web_view_link, drive_folder_id: run.drive_folder_id, artifact_size_bytes: drive.artifact_size_bytes || 0 });
  await logEvent({ run_id: run.run_id, event_type: "ARTIFACT_SAVED", actor: "qualified_review_system", payload: { artifact_name, phase: "QUALIFIED_REVIEW", version, lock_status, save_order_gate: "PHASE13_ISOLATED_AUTHORITY_PASS" } });
}
