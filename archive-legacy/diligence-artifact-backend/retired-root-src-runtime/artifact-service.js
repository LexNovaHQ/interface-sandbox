import { config, requireRuntimeConfig } from "./config.js";
import { assertRunId } from "./run-id.js";
import { assertKnownArtifactName, assertKnownPhase, assertPhaseCanWriteArtifact, M11_BATCH_ARTIFACT_PATTERN, M11_BATCH_VALIDATION_ARTIFACT_PATTERN } from "./constants.js";
import { assertCanReadArtifact, assertCanWriteArtifact } from "./permissions.js";
import { saveArtifactSchema, lockPhaseSchema, parseOrThrow } from "./schemas.js";
import { saveJsonArtifactToDrive, readJsonArtifactFromDrive } from "./drive.js";
import { updateRunDashboardRow } from "./sheets.js";
import { getRunRecord, updateRunRecord, getNextArtifactVersion, saveArtifactMetadata, getArtifactMetadata, listArtifactMetadata, logEvent } from "./firestore.js";
import { getRequiredWritesForPhase } from "./phase-contracts.js";
import { mergeUploadedDocumentSourcesIntoArtifact } from "./document-source-ingestor.js";
import { isStaleDeterministicForensics } from "./deterministic-profile-forensics.js";
import { assertM8InventoryLockGate, assertM8InventorySaveGate } from "./artifact-m8-inventory-guard.js";

const LOCK_ADVANCE_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE"]);
const ACCEPTED_PHASE_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS"]);
const M11_FORENSIC_CONTRACT = "M11_ROW_LEVEL_TRACE_CONTRACT_V1";
const DETERMINISTIC_PROFILE_FORENSICS = new Set(["target_profile_forensics", "target_feature_profile_forensics", "dap_forensics_profile", "exposure_registry_profile_forensics"]);
const gateHelpers = { requireSavedArtifact, requirePhaseAccepted };

export async function saveArtifact(input) {
  requireRuntimeConfig();
  const parsed = parseOrThrow(saveArtifactSchema, input);
  assertRunId(parsed.run_id);
  assertKnownPhase(parsed.phase);
  assertKnownArtifactName(parsed.artifact_name);
  assertCanWriteArtifact(parsed.agent_id, parsed.artifact_name);
  assertPhaseCanWriteArtifact(parsed.phase, parsed.artifact_name);
  await assertArtifactSaveOrder(parsed);
  await assertM8InventorySaveGate(parsed, gateHelpers);
  const effectiveLockStatus = normalizeArtifactLockStatus(parsed);
  const run = await getRunRecord(parsed.run_id);
  const version = await getNextArtifactVersion(parsed.run_id, parsed.artifact_name);
  const driveResult = await saveJsonArtifactToDrive({ run_id: parsed.run_id, artifact_name: parsed.artifact_name, version, drive_folder_id: run.drive_folder_id, artifact: parsed.artifact });
  const meta = await saveArtifactMetadata({ run_id: parsed.run_id, artifact_name: parsed.artifact_name, phase: parsed.phase, agent_id: parsed.agent_id, lock_status: effectiveLockStatus, version, drive_file_id: driveResult.drive_file_id, drive_web_view_link: driveResult.drive_web_view_link, drive_folder_id: run.drive_folder_id, artifact_size_bytes: driveResult.artifact_size_bytes });
  await updateRunRecord(parsed.run_id, { current_phase: parsed.phase, status: effectiveLockStatus });
  await logEvent({ run_id: parsed.run_id, event_type: "ARTIFACT_SAVED", actor: parsed.agent_id, payload: { phase: parsed.phase, artifact_name: parsed.artifact_name, version, lock_status: effectiveLockStatus, original_lock_status: parsed.lock_status, save_order_gate: "PASS" } });
  return { ok: true, run_id: parsed.run_id, artifact_name: parsed.artifact_name, version, lock_status: effectiveLockStatus, drive_file_id: meta.drive_file_id, drive_web_view_link: meta.drive_web_view_link, drive_folder_id: meta.drive_folder_id, receipt: `${parsed.artifact_name}_v${version} saved for ${parsed.run_id}` };
}

function normalizeArtifactLockStatus(parsed) {
  if (parsed.artifact_name === "exposure_registry_profile_forensics" && parsed.lock_status === "REPAIR_REQUIRED") return "LOCKED_WITH_LIMITATIONS";
  return parsed.lock_status;
}

async function assertArtifactSaveOrder(parsed) {
  const { run_id, artifact_name } = parsed;
  if (artifact_name === "target_profile_forensics") await requireSavedArtifact(run_id, "target_profile", "SAVE_ORDER_BLOCKED:target_profile_forensics_requires_target_profile");
  if (artifact_name === "feature_candidate_inventory") { await requireSavedArtifact(run_id, "domain_derivation_profile", "SAVE_ORDER_BLOCKED:activity_inventory_requires_domain_profile"); await requireSavedArtifact(run_id, "activity_profile_source_index", "SAVE_ORDER_BLOCKED:activity_inventory_requires_2c"); }
  if (artifact_name === "target_feature_profile") { await requireSavedArtifact(run_id, "feature_candidate_inventory", "SAVE_ORDER_BLOCKED:target_feature_profile_requires_inventory"); await requireSavedArtifact(run_id, "target_profile", "SAVE_ORDER_BLOCKED:target_feature_profile_requires_target_profile"); await requireSavedArtifact(run_id, "domain_derivation_profile", "SAVE_ORDER_BLOCKED:target_feature_profile_requires_domain_profile"); }
  if (artifact_name === "target_feature_profile_forensics") { await requireSavedArtifact(run_id, "feature_candidate_inventory", "SAVE_ORDER_BLOCKED:activity_forensics_requires_inventory"); await requireSavedArtifact(run_id, "target_feature_profile", "SAVE_ORDER_BLOCKED:activity_forensics_requires_activity_profile"); }
  if (artifact_name === "dap_forensics_profile") { await requireSavedArtifact(run_id, "dap_semantic_batch_route_manifest", "SAVE_ORDER_BLOCKED:dap_forensics_requires_route_manifest"); await requireSavedArtifact(run_id, "data_provenance_profile_semantic_batch_gate", "SAVE_ORDER_BLOCKED:dap_forensics_requires_material_gate"); }
  if (artifact_name === "exposure_registry_route_plan") { await requireSavedArtifact(run_id, "legal_cartography_index", "SAVE_ORDER_BLOCKED:m11_route_plan_requires_legal_cartography"); await requireSavedArtifact(run_id, "legal_signal_derivation_profile", "SAVE_ORDER_BLOCKED:m11_route_plan_requires_legal_signals"); await requireSavedArtifact(run_id, "data_provenance_profile_semantic_batch_gate", "SAVE_ORDER_BLOCKED:m11_route_plan_requires_dap_material_gate"); await requireSavedArtifact(run_id, "target_feature_profile", "SAVE_ORDER_BLOCKED:m11_route_plan_requires_activity_profile"); }
  if (M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifact_name)) await requireSavedArtifact(run_id, "exposure_registry_route_plan", "SAVE_ORDER_BLOCKED:m11_batch_validation_requires_route_plan");
  if (M11_BATCH_ARTIFACT_PATTERN.test(artifact_name)) { await requireSavedArtifact(run_id, "exposure_registry_route_plan", "SAVE_ORDER_BLOCKED:m11_batch_requires_route_plan"); await requireSavedArtifact(run_id, pairedBatchValidationName(artifact_name), "SAVE_ORDER_BLOCKED:m11_batch_requires_paired_validation"); }
  if (artifact_name === "exposure_registry_workpad_98") { await requireSavedArtifact(run_id, "exposure_registry_route_plan", "SAVE_ORDER_BLOCKED:m11_workpad_requires_route_plan"); await requireAllPlannedM11BatchesSaved(run_id, "SAVE_ORDER_BLOCKED:m11_workpad_requires_all_batches_and_validations"); }
  if (artifact_name === "exposure_registry_controlled_profile") await requireSavedArtifact(run_id, "exposure_registry_workpad_98", "SAVE_ORDER_BLOCKED:controlled_profile_requires_workpad_98");
  if (artifact_name === "exposure_registry_triggered_profile") { await requireSavedArtifact(run_id, "exposure_registry_workpad_98", "SAVE_ORDER_BLOCKED:triggered_profile_requires_workpad_98"); await requireSavedArtifact(run_id, "exposure_registry_controlled_profile", "SAVE_ORDER_BLOCKED:triggered_profile_requires_controlled_profile_first"); }
  if (artifact_name === "exposure_registry_profile_forensics") { await requireSavedArtifact(run_id, "exposure_registry_route_plan", "SAVE_ORDER_BLOCKED:m11_forensics_requires_route_plan"); await requireAllPlannedM11BatchesSaved(run_id, "SAVE_ORDER_BLOCKED:m11_forensics_requires_all_batches_and_validations"); await requireSavedArtifact(run_id, "exposure_registry_workpad_98", "SAVE_ORDER_BLOCKED:m11_forensics_requires_workpad_98"); await requireSavedArtifact(run_id, "exposure_registry_controlled_profile", "SAVE_ORDER_BLOCKED:m11_forensics_requires_controlled_profile"); await requireSavedArtifact(run_id, "exposure_registry_triggered_profile", "SAVE_ORDER_BLOCKED:m11_forensics_requires_triggered_profile"); }
  if (artifact_name === "challenge_gate") { await requireSavedArtifact(run_id, "exposure_registry_route_plan", "SAVE_ORDER_BLOCKED:challenge_gate_requires_route_plan"); await requireAllPlannedM11BatchesSaved(run_id, "SAVE_ORDER_BLOCKED:challenge_gate_requires_all_batches_and_validations"); await requireSavedArtifact(run_id, "exposure_registry_workpad_98", "SAVE_ORDER_BLOCKED:challenge_gate_requires_workpad_98"); await requireSavedArtifact(run_id, "exposure_registry_controlled_profile", "SAVE_ORDER_BLOCKED:challenge_gate_requires_controlled_profile"); await requireSavedArtifact(run_id, "exposure_registry_triggered_profile", "SAVE_ORDER_BLOCKED:challenge_gate_requires_triggered_profile"); }
  if (parsed.phase === "M7_TARGET_PROFILE" && artifact_name !== "target_profile") throw new Error(`PHASE_WRITE_FORBIDDEN:${parsed.phase}:${artifact_name}`);
  if (parsed.phase === "M7_TARGET_PROFILE_FORENSICS" && artifact_name !== "target_profile_forensics") throw new Error(`PHASE_WRITE_FORBIDDEN:${parsed.phase}:${artifact_name}`);
  if (parsed.phase === "M8_FEATURE_CANDIDATE_INVENTORY" && artifact_name !== "feature_candidate_inventory") throw new Error(`PHASE_WRITE_FORBIDDEN:${parsed.phase}:${artifact_name}`);
  if (parsed.phase === "M8_TARGET_FEATURE_PROFILE" && artifact_name !== "target_feature_profile") throw new Error(`PHASE_WRITE_FORBIDDEN:${parsed.phase}:${artifact_name}`);
  if (parsed.phase === "M8_TARGET_FEATURE_PROFILE_FORENSICS" && artifact_name !== "target_feature_profile_forensics") throw new Error(`PHASE_WRITE_FORBIDDEN:${parsed.phase}:${artifact_name}`);
}

async function requireAllPlannedM11BatchesSaved(runId, message) {
  const routePlan = await readInternalArtifactPayload(runId, "exposure_registry_route_plan");
  const batches = routePlan?.batch_plan || routePlan?.exposure_registry_route_plan?.batch_plan || [];
  if (!Array.isArray(batches)) throw new Error(`${message}:batch_plan_missing_or_not_array`);
  for (const batch of batches) {
    if (!batch?.batch_id) throw new Error(`${message}:batch_id_missing`);
    await requireSavedArtifact(runId, `exposure_registry_batch_validation__${batch.batch_id}`, `${message}:missing_validation:${batch.batch_id}`);
    await requireSavedArtifact(runId, `exposure_registry_batch__${batch.batch_id}`, `${message}:missing_batch:${batch.batch_id}`);
  }
}
function pairedBatchValidationName(batchArtifactName) { return batchArtifactName.replace(/^exposure_registry_batch__/, "exposure_registry_batch_validation__"); }
async function readInternalArtifactPayload(runId, artifactName) { const meta = await getArtifactMetadata(runId, artifactName); return readJsonArtifactFromDrive(meta.drive_file_id); }
async function requireSavedArtifact(runId, artifactName, message) { try { const meta = await getArtifactMetadata(runId, artifactName); if (DETERMINISTIC_PROFILE_FORENSICS.has(artifactName)) await assertForensicsNotStale(runId, artifactName, meta, message); } catch (_error) { throw new Error(message); } }
async function requirePhaseAccepted(runId, artifactName, message) { let meta; try { meta = await getArtifactMetadata(runId, artifactName); if (DETERMINISTIC_PROFILE_FORENSICS.has(artifactName)) await assertForensicsNotStale(runId, artifactName, meta, message); } catch (_error) { throw new Error(message); } if (!ACCEPTED_PHASE_STATUSES.has(meta.lock_status)) throw new Error(`${message}:status:${meta.lock_status || "missing"}`); }

export async function readArtifact({ run_id, artifact_name, agent_id = "operator" }) {
  assertRunId(run_id);
  assertKnownArtifactName(artifact_name);
  assertCanReadArtifact(agent_id, artifact_name);
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

export async function listArtifacts(runId) { assertRunId(runId); return listArtifactMetadata(runId); }
export async function assertRequiredArtifactsExist(runId, artifactNames) { for (const artifactName of artifactNames) { if (String(artifactName || "").includes("{GROUP}")) continue; await getArtifactMetadata(runId, artifactName); } }

export async function lockPhase(input) {
  const parsed = parseOrThrow(lockPhaseSchema, input);
  const body = await normalizePhaseLockBody(parsed);
  assertRunId(body.run_id);
  assertKnownPhase(body.phase);
  await assertM8InventoryLockGate(body, gateHelpers);
  if (body.phase === "M8_TARGET_FEATURE_PROFILE" && LOCK_ADVANCE_STATUSES.has(body.status)) { await requireSavedArtifact(body.run_id, "feature_candidate_inventory", "PHASE_LOCK_BLOCKED:M8_requires_inventory"); await requireSavedArtifact(body.run_id, "domain_derivation_profile", "PHASE_LOCK_BLOCKED:M8_requires_domain_profile"); }
  if (body.phase === "DATA_PROVENANCE_PROFILE_LAYER4" && LOCK_ADVANCE_STATUSES.has(body.status)) { await requireSavedArtifact(body.run_id, "data_privacy_navigation_index", "PHASE_LOCK_BLOCKED:DAP_requires_2D"); await requireSavedArtifact(body.run_id, "target_feature_profile", "PHASE_LOCK_BLOCKED:DAP_requires_activity_profile"); }
  if (body.phase === "DATA_PROVENANCE_PROFILE_FORENSICS" && LOCK_ADVANCE_STATUSES.has(body.status)) await requireSavedArtifact(body.run_id, "data_provenance_profile_semantic_batch_gate", "PHASE_LOCK_BLOCKED:DAP_FORENSICS_requires_material_gate");
  if (body.phase === "M11" && LOCK_ADVANCE_STATUSES.has(body.status)) { await requireSavedArtifact(body.run_id, "exposure_registry_route_plan", "PHASE_LOCK_BLOCKED:M11_requires_route_plan"); await requireAllPlannedM11BatchesSaved(body.run_id, "PHASE_LOCK_BLOCKED:M11_requires_all_batches_and_validations"); await requireSavedArtifact(body.run_id, "exposure_registry_workpad_98", "PHASE_LOCK_BLOCKED:M11_requires_workpad_98"); await requireSavedArtifact(body.run_id, "exposure_registry_controlled_profile", "PHASE_LOCK_BLOCKED:M11_requires_controlled_profile"); await requireSavedArtifact(body.run_id, "exposure_registry_triggered_profile", "PHASE_LOCK_BLOCKED:M11_requires_triggered_profile"); }
  if (body.phase === "M12" && LOCK_ADVANCE_STATUSES.has(body.status)) { await requireSavedArtifact(body.run_id, "exposure_registry_route_plan", "PHASE_LOCK_BLOCKED:M12_requires_route_plan"); await requireAllPlannedM11BatchesSaved(body.run_id, "PHASE_LOCK_BLOCKED:M12_requires_all_batches_and_validations"); await requireSavedArtifact(body.run_id, "exposure_registry_workpad_98", "PHASE_LOCK_BLOCKED:M12_requires_workpad_98"); await requireSavedArtifact(body.run_id, "exposure_registry_controlled_profile", "PHASE_LOCK_BLOCKED:M12_requires_controlled_profile"); await requireSavedArtifact(body.run_id, "exposure_registry_triggered_profile", "PHASE_LOCK_BLOCKED:M12_requires_triggered_profile"); await requireSavedArtifact(body.run_id, "challenge_gate", "PHASE_LOCK_BLOCKED:M12_requires_challenge_gate"); }
  if (LOCK_ADVANCE_STATUSES.has(body.status) && body.phase !== "COMPLETE") await assertRequiredArtifactsExist(body.run_id, getRequiredWritesForPhase(body.phase));
  const existing = await getRunRecord(body.run_id);
  const patch = { current_phase: body.next_phase || body.phase, status: body.status, final_report_url: body.final_report_url || existing.final_report_url || "" };
  const updated = await updateRunRecord(body.run_id, patch);
  await updateRunDashboardRow(updated);
  await logEvent({ run_id: body.run_id, event_type: "PHASE_LOCKED", actor: body.agent_id, payload: { phase: body.phase, status: body.status, next_phase: body.next_phase || null } });
  return { ok: true, run_id: body.run_id, phase: body.phase, status: body.status, next_phase: body.next_phase || null };
}

async function normalizePhaseLockBody(body) {
  if (body.phase === "M11" && body.status === "REPAIR_REQUIRED") {
    try {
      const controlled = await getArtifactMetadata(body.run_id, "exposure_registry_controlled_profile");
      const triggered = await getArtifactMetadata(body.run_id, "exposure_registry_triggered_profile");
      if (controlled && triggered) return { ...body, status: "LOCKED_WITH_LIMITATIONS", next_phase: body.next_phase && body.next_phase !== body.phase ? body.next_phase : "M12" };
    } catch (_error) { }
  }
  return body;
}

async function assertForensicsNotStale(runId, artifactName, meta, message) { const artifact = await readJsonArtifactFromDrive(meta.drive_file_id); if (isStaleForensicsArtifact(artifactName, artifact)) { await logEvent({ run_id: runId, event_type: "STALE_FORENSICS_REJECTED", actor: "artifact-service", payload: { artifact_name: artifactName, version: meta.latest_version || meta.version, reason: "missing deterministic forensic trace contract" } }); throw new Error(`${message}:stale_forensics`); } }
function isStaleForensicsArtifact(artifactName, artifact) { if (artifactName === "exposure_registry_profile_forensics") return isStaleM11ForensicsArtifact(artifact); return isStaleDeterministicForensics({ artifactName, artifact }); }
function isStaleM11ForensicsArtifact(artifact) { const root = artifact?.exposure_registry_profile_forensics || artifact || {}; return root.forensic_contract?.contract_name !== M11_FORENSIC_CONTRACT || root.forensic_contract?.model_generated_forensics_allowed !== false || !Array.isArray(root.forensic_trace_index) || !Array.isArray(root.material_profile_trace_index) || root.forensic_boundary?.semantic_forensic_profile_retired !== true; }
export function buildReportUrl(runId) { const base = config.reviewerPublicBaseUrl || config.rendererBaseUrl || ""; if (!base) return ""; const clean = base.replace(/\/$/, ""); return `${clean}/interface-diligence/diligence-system/report.html?run_id=${encodeURIComponent(runId)}`; }
export function artifactSaveBody({ run_id, phase, agent_id, artifact_name, artifact, lock_status = "LOCKED" }) { return { run_id, phase, agent_id, artifact_name, lock_status, artifact }; }
export function isLosslessFamilyArtifactName(value) { return /^lossless_family__[A-Z0-9_]+$/.test(String(value || "")); }
export function buildDynamicEmptyLosslessFamilyArtifact({ artifact_name, error = null } = {}) { const family = String(artifact_name || "").replace(/^lossless_family__/, ""); return { artifact_name, root_family: family, bucket: "", storage_mode: "UNSAVED_EMPTY", sources: [], manifest_only_sources: [], metadata_only_sources: [], rejected_sources: [], missing_limited_primary_sources: [], dynamic_family_read_resolution: { status: "CONTROLLED_EMPTY_FAMILY", reason: "DYNAMIC_SOURCE_FAMILY_NOT_PHYSICALLY_SAVED", original_error: error?.message || String(error || "") }, family_part_resolution: { status: "UNSAVED_EMPTY", reason: "DYNAMIC_SOURCE_FAMILY_NOT_PHYSICALLY_SAVED", required_artifacts: [], loaded_artifacts: [], required_together: false }, corpus_forensics: { total_sources: 0, dynamic_empty_family: true }, dedupe_forensics: {} }; }
async function logDynamicFamilyFallback({ run_id, artifact_name, agent_id, error }) { try { await logEvent({ run_id, event_type: "DYNAMIC_LOSSLESS_FAMILY_EMPTY_READ", actor: agent_id || "artifact-service", payload: { artifact_name, reason: "lossless family artifact not physically saved", original_error: error?.message || String(error || "") } }); } catch (_ignored) { } }
