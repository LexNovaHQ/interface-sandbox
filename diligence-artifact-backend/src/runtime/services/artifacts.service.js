import { assertRunId } from "../utils/run-id.js";
import { assertKnownArtifactName, assertPhaseCanWriteArtifact, M11_BATCH_ARTIFACT_PATTERN, M11_BATCH_VALIDATION_ARTIFACT_PATTERN } from "../../constants.js";
import { assertCanReadArtifact, assertCanWriteArtifact } from "../../permissions.js";
import { isStaleDeterministicForensics } from "../../deterministic-profile-forensics.js";
import { buildExtendedDapIndiaReadinessProfile } from "../../extended-dap-india-readiness.js";
import { config, requireRuntimeConfig } from "../config.js";
import { artifactsForCentralPhase } from "../contracts/artifacts.contract.js";
import { centralPhaseForInternalJob, getCentralPhase, CENTRAL_PHASE_BY_ID } from "../contracts/central-phase.contract.js";
import { getInternalJobContract, normalizeInternalJobId } from "../contracts/internal-job.contract.js";
import { saveJsonArtifactToDrive, readJsonArtifactFromDrive } from "./storage/drive.service.js";
import { updateRunDashboardRow } from "./storage/sheets.service.js";
import { getRunRecord, updateRunRecord, getNextArtifactVersion, saveArtifactMetadata, getArtifactMetadata, listArtifactMetadata, logEvent } from "./storage/firestore.service.js";

const LOCK_STATUSES = new Set(["CREATED", "RUNNING", "LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE", "COMPLETE"]);
const LOCK_ADVANCE_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE"]);
const ACCEPTED_ARTIFACT_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS"]);
const FORENSIC_CONTRACT_EXPOSURE = "M11_ROW_LEVEL_TRACE_CONTRACT_V1";
const DETERMINISTIC_PROFILE_FORENSICS = new Set(["target_profile_forensics", "target_feature_profile_forensics", "data_provenance_profile_forensics", "exposure_registry_profile_forensics"]);
const EXTENDED_DATA_READINESS_ARTIFACT = "extended_dap_india_readiness_profile";
const INTEGRATED_DATA_REPORT_ARTIFACT = "integrated_dap_report";
const EXTENDED_DATA_READINESS_ACTOR = "agent_4b_extended_dap";
const RUNTIME_ARTIFACT_EXTRAS = new Set(["qualified_review_validation_manifest", "diligence_qa_completion_receipt"]);

const ART = Object.freeze({
  targetProfile: "target_profile",
  targetForensics: "target_profile_forensics",
  activityInventory: "feature_candidate_inventory",
  activityProfile: "target_feature_profile",
  activityForensics: "target_feature_profile_forensics",
  dataProfile: "data_provenance_profile",
  dataForensics: "data_provenance_profile_forensics",
  exposureRoutePlan: "exposure_registry_route_plan",
  exposureWorkpad: "exposure_registry_workpad_98",
  exposureControlled: "exposure_registry_controlled_profile",
  exposureTriggered: "exposure_registry_triggered_profile",
  exposureForensics: "exposure_registry_profile_forensics",
  challengeGate: "challenge_gate",
  sourceFamilyIndex: "source_family_index",
  uploadedSourceCorpus: "uploaded_source_document_corpus"
});

export const ARTIFACTS_SERVICE_STATUS = Object.freeze({
  central_runtime_service: "artifacts.service",
  migration_status: "runtime_owned_central_artifact_service",
  old_artifact_service_bridge_removed: true,
  central_phase_aware: true,
  compatibility_permission_ids_retained: true
});

export async function saveRuntimeArtifact(input) {
  return saveArtifact(input);
}

export async function readRuntimeArtifact(input) {
  return readArtifact(input);
}

export async function readRuntimeArtifactPayload(input) {
  return readArtifactPayload(input);
}

export async function lockRuntimePhase(input) {
  return lockPhase(input);
}

export async function listRuntimeArtifacts(runId) {
  return listArtifacts(runId);
}

export async function assertCentralPhaseArtifactsExist(runId, centralPhaseId) {
  return assertRequiredArtifactsExist(runId, artifactsForCentralPhase(centralPhaseId));
}

export async function saveArtifact(input) {
  requireRuntimeConfig();
  const parsed = parseSaveArtifactInput(input);
  const phaseContext = phaseContextFor(parsed.phase);
  assertRunId(parsed.run_id);
  assertRuntimeKnownArtifact(parsed.artifact_name);
  assertRuntimeWritePermission(parsed.agent_id, parsed.artifact_name);
  assertRuntimePhaseCanWriteArtifact(phaseContext, parsed.artifact_name);
  await assertArtifactSaveOrder(parsed);

  const effectiveLockStatus = normalizeArtifactLockStatus(parsed);
  const run = await getRunRecord(parsed.run_id);
  const version = await getNextArtifactVersion(parsed.run_id, parsed.artifact_name);
  const driveResult = await saveJsonArtifactToDrive({ run_id: parsed.run_id, artifact_name: parsed.artifact_name, version, drive_folder_id: run.drive_folder_id, artifact: parsed.artifact });
  const meta = await saveArtifactMetadata({ run_id: parsed.run_id, artifact_name: parsed.artifact_name, phase: phaseContext.persistence_phase, agent_id: parsed.agent_id, lock_status: effectiveLockStatus, version, drive_file_id: driveResult.drive_file_id, drive_web_view_link: driveResult.drive_web_view_link, drive_folder_id: run.drive_folder_id, artifact_size_bytes: driveResult.artifact_size_bytes });

  if (parsed.artifact_name === ART.dataForensics && ACCEPTED_ARTIFACT_STATUSES.has(effectiveLockStatus)) {
    await buildExtendedDataReadinessSidecarNonblocking({ run, dataForensicsArtifact: parsed.artifact });
  }

  await updateRunRecord(parsed.run_id, { current_phase: phaseContext.persistence_phase, status: effectiveLockStatus, central_phase: phaseContext.central_phase_id, central_phase_label: phaseContext.central_phase_label, active_internal_job: phaseContext.internal_job_id });
  await logRuntimeArtifactEvent({ run_id: parsed.run_id, event_type: "ARTIFACT_SAVED", actor: parsed.agent_id, phaseContext, payload: { artifact_name: parsed.artifact_name, version, lock_status: effectiveLockStatus, original_lock_status: parsed.lock_status, save_order_gate: "PASS" } });
  return { ok: true, run_id: parsed.run_id, artifact_name: parsed.artifact_name, version, lock_status: effectiveLockStatus, drive_file_id: meta.drive_file_id, drive_web_view_link: meta.drive_web_view_link, receipt: `${parsed.artifact_name}_v${version} saved for ${parsed.run_id}` };
}

export async function readArtifact({ run_id, artifact_name, agent_id = "operator" }) {
  assertRunId(run_id);
  assertRuntimeKnownArtifact(artifact_name);
  assertRuntimeReadPermission(agent_id, artifact_name);
  const run = await getRunRecord(run_id);
  const meta = await getArtifactMetadata(run_id, artifact_name);
  const rawArtifact = await readJsonArtifactFromDrive(meta.drive_file_id);
  const artifact = await mergeUploadedDocumentSourcesIntoArtifact({ run, artifactName: artifact_name, artifact: rawArtifact });
  const lock_status = DETERMINISTIC_PROFILE_FORENSICS.has(artifact_name) && isStaleForensicsArtifact(artifact_name, artifact) ? "REPAIR_REQUIRED" : meta.lock_status;
  return { ok: true, run_id, artifact_name, version: meta.latest_version || meta.version, lock_status, artifact };
}

export async function readArtifactPayload({ run_id, artifact_name, agent_id = "operator" }) {
  try {
    const result = await readArtifact({ run_id, artifact_name, agent_id });
    if (DETERMINISTIC_PROFILE_FORENSICS.has(artifact_name) && result.lock_status === "REPAIR_REQUIRED") throw new Error(`STALE_FORENSICS_ARTIFACT:${artifact_name}`);
    return result.artifact;
  } catch (error) {
    if (!isLosslessFamilyArtifactName(artifact_name)) throw error;
    await logDynamicFamilyFallback({ run_id, artifact_name, agent_id, error });
    return buildDynamicEmptyLosslessFamilyArtifact({ artifact_name, error });
  }
}

export async function listArtifacts(runId) {
  assertRunId(runId);
  return listArtifactMetadata(runId);
}

export async function assertRequiredArtifactsExist(runId, artifactNames) {
  for (const artifactName of artifactNames || []) {
    if (String(artifactName || "").includes("{GROUP}")) continue;
    await getArtifactMetadata(runId, artifactName);
  }
}

export async function lockPhase(input) {
  const parsed = parseLockPhaseInput(input);
  const phaseContext = phaseContextFor(parsed.phase);
  const body = await normalizePhaseLockBody({ ...parsed, phase: phaseContext.persistence_phase }, phaseContext);
  assertRunId(body.run_id);
  await assertArtifactLockOrder(body, phaseContext);
  const requiredWrites = requiredWritesForPhaseContext(phaseContext);
  if (LOCK_ADVANCE_STATUSES.has(body.status) && body.phase !== "COMPLETE") await assertRequiredArtifactsExist(body.run_id, requiredWrites);

  const existing = await getRunRecord(body.run_id);
  const nextContext = body.next_phase ? phaseContextFor(body.next_phase) : null;
  const patch = {
    current_phase: nextContext?.persistence_phase || body.next_phase || body.phase,
    status: body.status,
    central_phase: nextContext?.central_phase_id || phaseContext.central_phase_id,
    central_phase_label: nextContext?.central_phase_label || phaseContext.central_phase_label,
    active_internal_job: nextContext?.internal_job_id || phaseContext.internal_job_id,
    final_report_url: body.final_report_url || existing.final_report_url || ""
  };
  const updated = await updateRunRecord(body.run_id, patch);
  await updateRunDashboardRow(updated);
  await logRuntimeArtifactEvent({ run_id: body.run_id, event_type: "CENTRAL_PHASE_LOCKED", actor: body.agent_id, phaseContext, payload: { status: body.status, next_phase: patch.current_phase, next_central_phase: patch.central_phase } });
  return { ok: true, run_id: body.run_id, phase: body.phase, central_phase: phaseContext.central_phase_id, central_phase_label: phaseContext.central_phase_label, status: body.status, next_phase: patch.current_phase, next_central_phase: patch.central_phase };
}

function parseSaveArtifactInput(input = {}) {
  const parsed = {
    run_id: String(input.run_id || ""),
    phase: String(input.phase || ""),
    agent_id: String(input.agent_id || ""),
    artifact_name: String(input.artifact_name || ""),
    lock_status: String(input.lock_status || ""),
    artifact: input.artifact
  };
  const missing = [];
  if (!parsed.run_id) missing.push("run_id");
  if (!parsed.phase) missing.push("phase");
  if (!parsed.agent_id) missing.push("agent_id");
  if (!parsed.artifact_name) missing.push("artifact_name");
  if (!LOCK_STATUSES.has(parsed.lock_status)) missing.push("lock_status");
  if (!parsed.artifact || typeof parsed.artifact !== "object" || Array.isArray(parsed.artifact)) missing.push("artifact_object");
  if (missing.length) throw new Error(`INVALID_REQUEST:${missing.join(",")}`);
  return parsed;
}

function parseLockPhaseInput(input = {}) {
  const parsed = {
    run_id: String(input.run_id || ""),
    phase: String(input.phase || ""),
    agent_id: String(input.agent_id || "operator"),
    status: String(input.status || ""),
    next_phase: input.next_phase == null ? null : String(input.next_phase),
    final_report_url: String(input.final_report_url || "")
  };
  const missing = [];
  if (!parsed.run_id) missing.push("run_id");
  if (!parsed.phase) missing.push("phase");
  if (!parsed.agent_id) missing.push("agent_id");
  if (!LOCK_STATUSES.has(parsed.status)) missing.push("status");
  if (missing.length) throw new Error(`INVALID_REQUEST:${missing.join(",")}`);
  return parsed;
}

function phaseContextFor(phaseValue) {
  const raw = String(phaseValue || "");
  if (!raw) throw new Error("INVALID_PHASE:missing");
  if (raw === "NORMALIZED_REPORT_RENDERER") return phaseContextFor("RENDERER");
  if (raw === "COMPILER") return phaseContextFor("NORMALIZED_COMPILER");
  if (raw === "COMPLETE") return { requested_phase: raw, persistence_phase: "COMPLETE", internal_job_id: "COMPLETE", central_phase_id: "DILIGENCE_QA_COMPLETE", central_phase_label: "Diligence-QA Complete", is_central_phase_request: false };
  if (CENTRAL_PHASE_BY_ID[raw]) {
    const central = getCentralPhase(raw);
    return { requested_phase: raw, persistence_phase: raw, internal_job_id: raw, central_phase_id: central.central_phase_id, central_phase_label: central.public_label, is_central_phase_request: true };
  }
  const internalJobId = normalizeInternalJobId(raw);
  const central = centralPhaseForInternalJob(internalJobId);
  if (!central) throw new Error(`INVALID_RUNTIME_PHASE:${raw}`);
  return { requested_phase: raw, persistence_phase: raw, internal_job_id: internalJobId, central_phase_id: central.central_phase_id, central_phase_label: central.public_label, is_central_phase_request: false };
}

function requiredWritesForPhaseContext(phaseContext) {
  if (phaseContext.is_central_phase_request) return artifactsForCentralPhase(phaseContext.central_phase_id);
  if (phaseContext.internal_job_id === "COMPLETE") return [];
  return getInternalJobContract(phaseContext.internal_job_id).writes || [];
}

function assertRuntimeKnownArtifact(artifactName) {
  if (RUNTIME_ARTIFACT_EXTRAS.has(artifactName)) return;
  if (M11_BATCH_ARTIFACT_PATTERN.test(artifactName) || M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName)) return;
  assertKnownArtifactName(artifactName);
}

function assertRuntimeReadPermission(agentId, artifactName) {
  if (RUNTIME_ARTIFACT_EXTRAS.has(artifactName)) return;
  assertCanReadArtifact(agentId, artifactName);
}

function assertRuntimeWritePermission(agentId, artifactName) {
  if (RUNTIME_ARTIFACT_EXTRAS.has(artifactName)) {
    if (!["qualified_review_system", "diligence_qa_gate", "operator"].includes(agentId)) throw new Error(`WRITE_FORBIDDEN:${agentId}:${artifactName}`);
    return;
  }
  assertCanWriteArtifact(agentId, artifactName);
}

function assertRuntimePhaseCanWriteArtifact(phaseContext, artifactName) {
  if (phaseContext.is_central_phase_request) {
    const allowed = artifactsForCentralPhase(phaseContext.central_phase_id);
    if (!allowed.includes(artifactName)) throw new Error(`CENTRAL_PHASE_WRITE_FORBIDDEN:${phaseContext.central_phase_id}:${artifactName}`);
    return;
  }
  if (RUNTIME_ARTIFACT_EXTRAS.has(artifactName)) return;
  if (M11_BATCH_ARTIFACT_PATTERN.test(artifactName) || M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName)) return;
  assertPhaseCanWriteArtifact(phaseContext.persistence_phase, artifactName);
}

function normalizeArtifactLockStatus(parsed) {
  if (parsed.artifact_name === ART.exposureForensics && parsed.lock_status === "REPAIR_REQUIRED") return "LOCKED_WITH_LIMITATIONS";
  return parsed.lock_status;
}

async function assertArtifactSaveOrder(parsed) {
  const { run_id, artifact_name } = parsed;
  if (artifact_name === ART.targetForensics) await requireSavedArtifact(run_id, ART.targetProfile, "SAVE_ORDER_BLOCKED:target_forensics_requires_target_profile");
  if (artifact_name === ART.activityInventory) {
    await requireSavedArtifact(run_id, ART.targetProfile, "SAVE_ORDER_BLOCKED:activity_inventory_requires_target_profile");
    await requireSavedArtifact(run_id, ART.targetForensics, "SAVE_ORDER_BLOCKED:activity_inventory_requires_target_forensics");
    await requirePhaseAccepted(run_id, ART.targetForensics, "SAVE_ORDER_BLOCKED:activity_inventory_requires_accepted_target_forensics");
  }
  if (artifact_name === ART.activityProfile) {
    await requireSavedArtifact(run_id, ART.activityInventory, "SAVE_ORDER_BLOCKED:activity_profile_requires_activity_inventory");
    await requirePhaseAccepted(run_id, ART.activityInventory, "SAVE_ORDER_BLOCKED:activity_profile_requires_accepted_activity_inventory");
    await requireSavedArtifact(run_id, ART.targetProfile, "SAVE_ORDER_BLOCKED:activity_profile_requires_target_profile");
    await requireSavedArtifact(run_id, ART.targetForensics, "SAVE_ORDER_BLOCKED:activity_profile_requires_target_forensics");
  }
  if (artifact_name === ART.activityForensics) {
    await requireSavedArtifact(run_id, ART.activityProfile, "SAVE_ORDER_BLOCKED:activity_forensics_requires_activity_profile");
    await requirePhaseAccepted(run_id, ART.activityProfile, "SAVE_ORDER_BLOCKED:activity_forensics_requires_accepted_activity_profile");
  }
  if (artifact_name === ART.dataProfile) {
    await requireSavedArtifact(run_id, ART.activityInventory, "SAVE_ORDER_BLOCKED:data_profile_requires_activity_inventory");
    await requirePhaseAccepted(run_id, ART.activityInventory, "SAVE_ORDER_BLOCKED:data_profile_requires_accepted_activity_inventory");
    await requireSavedArtifact(run_id, ART.activityProfile, "SAVE_ORDER_BLOCKED:data_profile_requires_activity_profile");
    await requireSavedArtifact(run_id, ART.activityForensics, "SAVE_ORDER_BLOCKED:data_profile_requires_activity_forensics");
    await requirePhaseAccepted(run_id, ART.activityForensics, "SAVE_ORDER_BLOCKED:data_profile_requires_accepted_activity_forensics");
  }
  if (artifact_name === ART.dataForensics) {
    await requireSavedArtifact(run_id, ART.dataProfile, "SAVE_ORDER_BLOCKED:data_forensics_requires_data_profile");
    await requirePhaseAccepted(run_id, ART.dataProfile, "SAVE_ORDER_BLOCKED:data_forensics_requires_accepted_data_profile");
  }
  if (artifact_name === ART.exposureRoutePlan) {
    await requireSavedArtifact(run_id, ART.dataProfile, "SAVE_ORDER_BLOCKED:exposure_route_plan_requires_data_profile");
    await requireSavedArtifact(run_id, ART.dataForensics, "SAVE_ORDER_BLOCKED:exposure_route_plan_requires_data_forensics");
    await requirePhaseAccepted(run_id, ART.dataForensics, "SAVE_ORDER_BLOCKED:exposure_route_plan_requires_accepted_data_forensics");
  }
  if (M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifact_name)) await requireSavedArtifact(run_id, ART.exposureRoutePlan, "SAVE_ORDER_BLOCKED:exposure_batch_validation_requires_route_plan");
  if (M11_BATCH_ARTIFACT_PATTERN.test(artifact_name)) {
    await requireSavedArtifact(run_id, ART.exposureRoutePlan, "SAVE_ORDER_BLOCKED:exposure_batch_requires_route_plan");
    await requireSavedArtifact(run_id, pairedBatchValidationName(artifact_name), "SAVE_ORDER_BLOCKED:exposure_batch_requires_paired_validation");
  }
  if (artifact_name === ART.exposureWorkpad) {
    await requireSavedArtifact(run_id, ART.exposureRoutePlan, "SAVE_ORDER_BLOCKED:exposure_workpad_requires_route_plan");
    await requireAllPlannedExposureBatchesSaved(run_id, "SAVE_ORDER_BLOCKED:exposure_workpad_requires_all_batches_and_validations");
  }
  if (artifact_name === ART.exposureControlled) await requireSavedArtifact(run_id, ART.exposureWorkpad, "SAVE_ORDER_BLOCKED:controlled_exposure_requires_workpad");
  if (artifact_name === ART.exposureTriggered) {
    await requireSavedArtifact(run_id, ART.exposureWorkpad, "SAVE_ORDER_BLOCKED:triggered_exposure_requires_workpad");
    await requireSavedArtifact(run_id, ART.exposureControlled, "SAVE_ORDER_BLOCKED:triggered_exposure_requires_controlled_profile_first");
  }
  if (artifact_name === ART.exposureForensics) {
    await requireSavedArtifact(run_id, ART.exposureRoutePlan, "SAVE_ORDER_BLOCKED:exposure_forensics_requires_route_plan");
    await requireAllPlannedExposureBatchesSaved(run_id, "SAVE_ORDER_BLOCKED:exposure_forensics_requires_all_batches_and_validations");
    await requireSavedArtifact(run_id, ART.exposureWorkpad, "SAVE_ORDER_BLOCKED:exposure_forensics_requires_workpad");
    await requireSavedArtifact(run_id, ART.exposureControlled, "SAVE_ORDER_BLOCKED:exposure_forensics_requires_controlled_profile");
    await requireSavedArtifact(run_id, ART.exposureTriggered, "SAVE_ORDER_BLOCKED:exposure_forensics_requires_triggered_profile");
  }
  if (artifact_name === ART.challengeGate) {
    await requireSavedArtifact(run_id, ART.exposureRoutePlan, "SAVE_ORDER_BLOCKED:operator_challenge_requires_route_plan");
    await requireAllPlannedExposureBatchesSaved(run_id, "SAVE_ORDER_BLOCKED:operator_challenge_requires_all_batches_and_validations");
    await requireSavedArtifact(run_id, ART.exposureWorkpad, "SAVE_ORDER_BLOCKED:operator_challenge_requires_workpad");
    await requireSavedArtifact(run_id, ART.exposureControlled, "SAVE_ORDER_BLOCKED:operator_challenge_requires_controlled_profile");
    await requireSavedArtifact(run_id, ART.exposureTriggered, "SAVE_ORDER_BLOCKED:operator_challenge_requires_triggered_profile");
    await requireSavedArtifact(run_id, ART.exposureForensics, "SAVE_ORDER_BLOCKED:operator_challenge_requires_exposure_forensics");
    await requirePhaseAccepted(run_id, ART.exposureForensics, "SAVE_ORDER_BLOCKED:operator_challenge_requires_accepted_exposure_forensics");
  }
}

async function assertArtifactLockOrder(body, phaseContext) {
  if (!LOCK_ADVANCE_STATUSES.has(body.status)) return;
  const required = requiredWritesForPhaseContext(phaseContext);
  if (required.includes(ART.activityInventory)) {
    await requireSavedArtifact(body.run_id, ART.targetProfile, "PHASE_LOCK_BLOCKED:activity_inventory_requires_target_profile");
    await requireSavedArtifact(body.run_id, ART.targetForensics, "PHASE_LOCK_BLOCKED:activity_inventory_requires_target_forensics");
    await requirePhaseAccepted(body.run_id, ART.targetForensics, "PHASE_LOCK_BLOCKED:activity_inventory_requires_accepted_target_forensics");
  }
  if (required.some((name) => [ART.activityProfile, ART.activityForensics, ART.dataProfile, ART.dataForensics].includes(name))) {
    await requireSavedArtifact(body.run_id, ART.activityInventory, "PHASE_LOCK_BLOCKED:profile_chain_requires_activity_inventory");
    await requirePhaseAccepted(body.run_id, ART.activityInventory, "PHASE_LOCK_BLOCKED:profile_chain_requires_accepted_activity_inventory");
  }
  if (required.includes(ART.activityForensics)) {
    await requireSavedArtifact(body.run_id, ART.activityProfile, "PHASE_LOCK_BLOCKED:activity_forensics_requires_activity_profile");
    await requirePhaseAccepted(body.run_id, ART.activityProfile, "PHASE_LOCK_BLOCKED:activity_forensics_requires_accepted_activity_profile");
  }
  if (required.includes(ART.dataProfile)) {
    await requireSavedArtifact(body.run_id, ART.activityProfile, "PHASE_LOCK_BLOCKED:data_profile_requires_activity_profile");
    await requireSavedArtifact(body.run_id, ART.activityForensics, "PHASE_LOCK_BLOCKED:data_profile_requires_activity_forensics");
    await requirePhaseAccepted(body.run_id, ART.activityForensics, "PHASE_LOCK_BLOCKED:data_profile_requires_accepted_activity_forensics");
  }
  if (required.includes(ART.dataForensics)) {
    await requireSavedArtifact(body.run_id, ART.dataProfile, "PHASE_LOCK_BLOCKED:data_forensics_requires_data_profile");
    await requirePhaseAccepted(body.run_id, ART.dataProfile, "PHASE_LOCK_BLOCKED:data_forensics_requires_accepted_data_profile");
  }
  if (required.includes(ART.exposureWorkpad) || required.includes(ART.exposureForensics) || required.includes(ART.challengeGate)) {
    await requireSavedArtifact(body.run_id, ART.exposureRoutePlan, "PHASE_LOCK_BLOCKED:exposure_route_plan_required");
    await requireAllPlannedExposureBatchesSaved(body.run_id, "PHASE_LOCK_BLOCKED:all_exposure_batches_and_validations_required");
  }
  if (required.includes(ART.exposureForensics) || required.includes(ART.challengeGate)) {
    await requireSavedArtifact(body.run_id, ART.exposureWorkpad, "PHASE_LOCK_BLOCKED:exposure_workpad_required");
    await requireSavedArtifact(body.run_id, ART.exposureControlled, "PHASE_LOCK_BLOCKED:controlled_exposure_required");
    await requireSavedArtifact(body.run_id, ART.exposureTriggered, "PHASE_LOCK_BLOCKED:triggered_exposure_required");
  }
  if (required.includes(ART.challengeGate)) {
    await requireSavedArtifact(body.run_id, ART.exposureForensics, "PHASE_LOCK_BLOCKED:exposure_forensics_required");
    await requirePhaseAccepted(body.run_id, ART.exposureForensics, "PHASE_LOCK_BLOCKED:accepted_exposure_forensics_required");
    await requireSavedArtifact(body.run_id, ART.challengeGate, "PHASE_LOCK_BLOCKED:operator_challenge_gate_required");
  }
}

async function normalizePhaseLockBody(body, phaseContext) {
  if (phaseContext.central_phase_id === "EXPOSURE_PROFILE" && body.status === "REPAIR_REQUIRED") {
    try {
      const meta = await getArtifactMetadata(body.run_id, ART.exposureForensics);
      if (meta) return { ...body, status: "LOCKED_WITH_LIMITATIONS", next_phase: body.next_phase && body.next_phase !== body.phase ? body.next_phase : "M12" };
    } catch (_error) { }
  }
  return body;
}

async function requireAllPlannedExposureBatchesSaved(runId, message) {
  const routePlan = await readInternalArtifactPayload(runId, ART.exposureRoutePlan);
  const batches = routePlan?.batch_plan || routePlan?.exposure_registry_route_plan?.batch_plan || [];
  if (!Array.isArray(batches)) throw new Error(`${message}:batch_plan_missing_or_not_array`);
  for (const batch of batches) {
    if (!batch?.batch_id) throw new Error(`${message}:batch_id_missing`);
    await requireSavedArtifact(runId, `exposure_registry_batch_validation__${batch.batch_id}`, `${message}:missing_validation:${batch.batch_id}`);
    await requireSavedArtifact(runId, `exposure_registry_batch__${batch.batch_id}`, `${message}:missing_batch:${batch.batch_id}`);
  }
}

function pairedBatchValidationName(batchArtifactName) {
  return batchArtifactName.replace(/^exposure_registry_batch__/, "exposure_registry_batch_validation__");
}

async function readInternalArtifactPayload(runId, artifactName) {
  const meta = await getArtifactMetadata(runId, artifactName);
  return readJsonArtifactFromDrive(meta.drive_file_id);
}

async function requireSavedArtifact(runId, artifactName, message) {
  try {
    const meta = await getArtifactMetadata(runId, artifactName);
    if (DETERMINISTIC_PROFILE_FORENSICS.has(artifactName)) await assertForensicsNotStale(runId, artifactName, meta, message);
  } catch (_error) {
    throw new Error(message);
  }
}

async function requirePhaseAccepted(runId, artifactName, message) {
  let meta;
  try {
    meta = await getArtifactMetadata(runId, artifactName);
    if (DETERMINISTIC_PROFILE_FORENSICS.has(artifactName)) await assertForensicsNotStale(runId, artifactName, meta, message);
  } catch (_error) {
    throw new Error(message);
  }
  if (!ACCEPTED_ARTIFACT_STATUSES.has(meta.lock_status)) throw new Error(`${message}:status:${meta.lock_status || "missing"}`);
}

async function assertForensicsNotStale(runId, artifactName, meta, message) {
  const artifact = await readJsonArtifactFromDrive(meta.drive_file_id);
  if (isStaleForensicsArtifact(artifactName, artifact)) {
    await logEvent({ run_id: runId, event_type: "STALE_FORENSICS_REJECTED", actor: "runtime.artifacts.service", payload: { artifact_name: artifactName, version: meta.latest_version || meta.version, reason: "missing deterministic forensic trace contract" } });
    throw new Error(`${message}:stale_forensics`);
  }
}

function isStaleForensicsArtifact(artifactName, artifact) {
  if (artifactName === ART.exposureForensics) return isStaleExposureForensicsArtifact(artifact);
  return isStaleDeterministicForensics({ artifactName, artifact });
}

function isStaleExposureForensicsArtifact(artifact) {
  const root = artifact?.exposure_registry_profile_forensics || artifact || {};
  return root.forensic_contract?.contract_name !== FORENSIC_CONTRACT_EXPOSURE || root.forensic_contract?.model_generated_forensics_allowed !== false || !Array.isArray(root.forensic_trace_index) || !Array.isArray(root.material_profile_trace_index) || root.forensic_boundary?.semantic_forensic_profile_retired !== true;
}

async function buildExtendedDataReadinessSidecarNonblocking({ run, dataForensicsArtifact }) {
  try {
    const artifacts = {};
    for (const artifactName of ["source_discovery_handoff", "legal_cartography_index", ART.targetProfile, ART.targetForensics, ART.activityProfile, ART.activityForensics, ART.dataProfile]) {
      try { artifacts[artifactName] = await readArtifactPayload({ run_id: run.run_id, artifact_name: artifactName, agent_id: "operator" }); }
      catch (_error) { artifacts[artifactName] = null; }
    }
    artifacts[ART.dataForensics] = dataForensicsArtifact;
    const output = buildExtendedDapIndiaReadinessProfile({ run, artifacts });
    const artifact = normalizeExtendedDataReadinessProofQueue(output?.[EXTENDED_DATA_READINESS_ARTIFACT]);
    if (!artifact || typeof artifact !== "object") throw new Error(`EXTENDED_DATA_READINESS_OUTPUT_MISSING:${EXTENDED_DATA_READINESS_ARTIFACT}`);
    const status = artifact.lock_status === "LOCKED" || artifact.status === "LOCKED" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS";
    const version = await getNextArtifactVersion(run.run_id, EXTENDED_DATA_READINESS_ARTIFACT);
    const driveResult = await saveJsonArtifactToDrive({ run_id: run.run_id, artifact_name: EXTENDED_DATA_READINESS_ARTIFACT, version, drive_folder_id: run.drive_folder_id, artifact });
    await saveArtifactMetadata({ run_id: run.run_id, artifact_name: EXTENDED_DATA_READINESS_ARTIFACT, phase: "AGENT_4B_EXTENDED_DAP_INDIA_READINESS", agent_id: EXTENDED_DATA_READINESS_ACTOR, lock_status: status, version, drive_file_id: driveResult.drive_file_id, drive_web_view_link: driveResult.drive_web_view_link, drive_folder_id: run.drive_folder_id, artifact_size_bytes: driveResult.artifact_size_bytes });
    await logEvent({ run_id: run.run_id, event_type: "EXTENDED_DATA_READINESS_SIDECAR_COMPLETED", actor: EXTENDED_DATA_READINESS_ACTOR, payload: { artifact_name: EXTENDED_DATA_READINESS_ARTIFACT, lock_status: status, field_count: artifact.field_count, model_usage: "NONE_DETERMINISTIC", mode: "sidecar_nonblocking", missing_proof_queue_normalized: true } });
  } catch (error) {
    await logEvent({ run_id: run.run_id, event_type: "EXTENDED_DATA_READINESS_SIDECAR_NONBLOCKING_FAILURE", actor: EXTENDED_DATA_READINESS_ACTOR, payload: { artifact_name: EXTENDED_DATA_READINESS_ARTIFACT, error_message: error?.message || String(error) } });
  }
}

function normalizeExtendedDataReadinessProofQueue(artifact) {
  if (!artifact || typeof artifact !== "object") return artifact;
  const missing = Array.isArray(artifact.missing_proof_requests) ? artifact.missing_proof_requests : [];
  return { ...artifact, missing_proof_requests: missing.map((row) => ({ ...row, field_status: row.field_status || row.status || "", status: proofRequestStatus(row.status), required_action: row.required_action || "QUALIFIED_REVIEW_OR_TARGETED_REINVESTIGATION", blocking: false })) };
}

function proofRequestStatus(fieldStatus) {
  if (fieldStatus === "ACCESS_FAILED") return "ACCESS_FAILED_REVIEW_REQUIRED";
  if (fieldStatus === "CONFLICTING_SIGNALS") return "REVIEWER_CONFIRMATION_REQUIRED";
  if (fieldStatus === "VISIBLE_DATA_PROCESSING_NO_CONTROL_FOUND") return "PUBLIC_PROOF_INSUFFICIENT";
  if (fieldStatus === "VISIBLE_CONTROL_PRESENT") return "REVIEWER_CONFIRMATION_REQUIRED";
  return "PROOF_REQUESTED";
}

async function mergeUploadedDocumentSourcesIntoArtifact({ run, artifactName, artifact }) {
  if (!run?.uploaded_source_document_corpus_drive_file_id || !artifact || typeof artifact !== "object") return artifact;
  if (artifactName === ART.sourceFamilyIndex) return mergeSourceFamilyIndex({ run, artifact });
  if (!String(artifactName || "").startsWith("lossless_family__")) return artifact;
  const family = String(artifactName).replace(/^lossless_family__/, "");
  const corpus = await readJsonArtifactFromDrive(run.uploaded_source_document_corpus_drive_file_id);
  const matching = (corpus.sources || []).filter((source) => Array.isArray(source.root_families) && source.root_families.includes(family));
  if (!matching.length) return artifact;
  const existing = Array.isArray(artifact.sources) ? artifact.sources : [];
  const rows = matching.map((source, index) => uploadedSourceRow({ source, family, sourceNumber: existing.length + index + 1 }));
  return { ...artifact, sources: [...existing, ...rows], corpus_forensics: { ...(artifact.corpus_forensics || {}), total_sources: existing.length + rows.length, uploaded_document_sources: rows.length }, uploaded_document_merge: { status: "APPLIED", source: ART.uploadedSourceCorpus, merged_rows: rows.length, generated_at: new Date().toISOString() } };
}

async function mergeSourceFamilyIndex({ run, artifact }) {
  const corpus = await readJsonArtifactFromDrive(run.uploaded_source_document_corpus_drive_file_id);
  const uploadedRows = [];
  for (const source of corpus.sources || []) for (const family of source.root_families || []) uploadedRows.push(withoutText(uploadedSourceRow({ source, family, sourceNumber: uploadedRows.length + 1 })));
  if (!uploadedRows.length) return artifact;
  return { ...artifact, discovered_source_index: [...(artifact.discovered_source_index || []), ...uploadedRows], corpus_forensics: { ...(artifact.corpus_forensics || {}), sources_extracted: Number(artifact.corpus_forensics?.sources_extracted || 0) + uploadedRows.length, uploaded_document_sources: uploadedRows.length } };
}

function uploadedSourceRow({ source, family, sourceNumber }) {
  const routeType = source.route_type_by_family?.[family] || source.document_class || "uploaded_document";
  const bucket = source.bucket_by_family?.[family] || "legal_governance_profile_urls";
  return { source_id: `${family}.UPDOC.${String(sourceNumber).padStart(3, "0")}`, manifest_id: source.uploaded_source_id, bucket, root_family: family, canonical_url: source.canonical_url, url: source.original_drive_web_view_link || source.canonical_url, route_type: routeType, materiality: source.materiality || "uploaded_source_material", discovered_by: ["USER_UPLOADED_DOCUMENT"], route_found_by: "DOCUMENT_UPLOAD", priority_result: "UPLOADED_PRIMARY_SOURCE", admission_tier: "PRIMARY", variant_class: "UPLOADED_DOCUMENT", extraction_decision: "EXTRACT", tier_reason: "Uploaded by user as source material.", execution_status: "uploaded_document_parsed", extraction_status: source.extraction_status, evidence_text_source: "UPLOADED_DOCUMENT_TEXT", content_type: source.content_type, final_url: source.original_drive_web_view_link, filename: source.filename, sha256: source.sha256, lossless_text: source.lossless_text, extraction_warnings: source.extraction_warnings || [] };
}

function withoutText(source) {
  const { lossless_text: _losslessText, ...rest } = source;
  return rest;
}

export function buildReportUrl(runId) {
  const base = config.reviewerPublicBaseUrl || config.rendererBaseUrl || "";
  if (!base) return "";
  const clean = base.replace(/\/$/, "");
  return `${clean}/interface-diligence/diligence-system/report.html?run_id=${encodeURIComponent(runId)}`;
}

export function artifactSaveBody({ run_id, phase, agent_id, artifact_name, artifact, lock_status = "LOCKED" }) {
  return { run_id, phase, agent_id, artifact_name, lock_status, artifact };
}

export function isLosslessFamilyArtifactName(value) {
  return /^lossless_family__[A-Z0-9_]+$/.test(String(value || ""));
}

export function buildDynamicEmptyLosslessFamilyArtifact({ artifact_name, error = null } = {}) {
  const family = String(artifact_name || "").replace(/^lossless_family__/, "");
  return { artifact_name, root_family: family, bucket: "", storage_mode: "UNSAVED_EMPTY", sources: [], manifest_only_sources: [], metadata_only_sources: [], rejected_sources: [], missing_limited_primary_sources: [], dynamic_family_read_resolution: { status: "CONTROLLED_EMPTY_FAMILY", reason: "DYNAMIC_SOURCE_FAMILY_NOT_PHYSICALLY_SAVED", original_error: error?.message || String(error || "") }, family_part_resolution: { status: "UNSAVED_EMPTY", reason: "DYNAMIC_SOURCE_FAMILY_NOT_PHYSICALLY_SAVED", required_artifacts: [], loaded_artifacts: [], required_together: false }, corpus_forensics: { total_sources: 0, dynamic_empty_family: true }, dedupe_forensics: {} };
}

async function logDynamicFamilyFallback({ run_id, artifact_name, agent_id, error }) {
  try {
    await logEvent({ run_id, event_type: "DYNAMIC_LOSSLESS_FAMILY_EMPTY_READ", actor: agent_id || "runtime.artifacts.service", payload: { artifact_name, reason: "lossless family artifact not physically saved", original_error: error?.message || String(error || "") } });
  } catch (_ignored) { }
}

async function logRuntimeArtifactEvent({ run_id, event_type, actor, phaseContext, payload = {} }) {
  await logEvent({ run_id, event_type, actor, payload: { phase: phaseContext.persistence_phase, internal_job_id: phaseContext.internal_job_id, central_phase: phaseContext.central_phase_id, central_phase_label: phaseContext.central_phase_label, ...payload } });
}
