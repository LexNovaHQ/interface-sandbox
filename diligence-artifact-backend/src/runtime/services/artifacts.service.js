import { assertRunId } from "../utils/run-id.js";
import { assertKnownArtifactName, assertInternalJobCanWriteArtifact as assertPhaseCanWriteArtifact, M11_BATCH_ARTIFACT_PATTERN, M11_BATCH_VALIDATION_ARTIFACT_PATTERN, PHASE7_DAP_BATCH_ARTIFACT_PATTERN, PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN, assertCanReadArtifact, assertCanWriteArtifact } from "../contracts/artifact-permissions.contract.js";
import { artifactsForCentralPhase } from "../contracts/artifacts.contract.js";
import { centralPhaseForInternalJob, getCentralPhase, CENTRAL_PHASE_BY_ID } from "../contracts/central-phase.contract.js";
import { getInternalJobContract, normalizeInternalJobId } from "../contracts/internal-job.contract.js";
import { saveJsonArtifactToDrive, readJsonArtifactFromDrive } from "./storage/drive.service.js";
import { updateRunDashboardRow } from "./storage/sheets.service.js";
import { getRunRecord, updateRunRecord, getNextArtifactVersion, saveArtifactMetadata, getArtifactMetadata, listArtifactMetadata, logEvent } from "./storage/firestore.service.js";
import { requireRuntimeConfig } from "../config.js";

const LOCK_STATUSES = new Set(["CREATED", "RUNNING", "LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE", "COMPLETE"]);
const LOCK_ADVANCE_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE"]);
const ACCEPTED_ARTIFACT_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS"]);
const RUNTIME_ARTIFACT_EXTRAS = new Set(["qualified_review_validation_manifest", "diligence_qa_completion_receipt"]);
const ART = Object.freeze({
  dedupedUrlManifest: "deduped_url_manifest",
  sourceFamilyIndex: "source_family_index",
  sourceHandoff: "source_discovery_handoff",
  cartographySourceInventory: "cartography_source_inventory",
  cartographyLocatorSpine: "cartography_locator_spine",
  cartographyProfileRouteMatrix: "cartography_profile_route_matrix",
  cartographySemanticNavigationOverlay: "cartography_semantic_navigation_overlay",
  legalCartographyDeterministicMap: "legal_cartography_deterministic_map",
  legalCartographySemanticProfile: "legal_cartography_semantic_profile",
  legalCartographyReinvestigationWorkpad: "legal_cartography_reinvestigation_workpad",
  legalCartographyIndex: "legal_cartography_index",
  legalSignalDerivationProfile: "legal_signal_derivation_profile",
  targetProfileSourceIndex: "target_profile_source_index",
  activityProfileSourceIndex: "activity_profile_source_index",
  dataPrivacyNavigationIndex: "data_privacy_navigation_index",
  cartographyIndex: "cartography_index",
  cartographyValidationManifest: "cartography_validation_manifest",
  targetProfile: "target_profile",
  targetForensics: "target_profile_forensics",
  activityInventory: "feature_candidate_inventory",
  activityProfile: "target_feature_profile",
  activityForensics: "target_feature_profile_forensics",
  dapRegistryManifest: "dap_registry_manifest",
  dapStrategicMatrix: "dap_strategic_derivation_matrix",
  dapRoute: "dap_semantic_batch_route_manifest",
  dapValidationManifest: "dap_semantic_batch_validation_manifest",
  dapGate: "data_provenance_profile_semantic_batch_gate",
  dapForensics: "dap_forensics_profile",
  exposureRoutePlan: "exposure_registry_route_plan",
  exposureWorkpad: "exposure_registry_workpad_98",
  exposureControlled: "exposure_registry_controlled_profile",
  exposureTriggered: "exposure_registry_triggered_profile",
  exposureForensics: "exposure_registry_profile_forensics",
  challengeGate: "challenge_gate"
});

export const ARTIFACTS_SERVICE_STATUS = Object.freeze({ central_runtime_service: "artifacts.service", migration_status: "phase2_cartography_m9_dpni_order_gates_synced", old_artifact_service_bridge_removed: true, old_constants_permissions_dependency_removed: true, central_phase_aware: true, source_to_phase6_order_gates_enforced: true, phase2_cartography_index_gates_enforced: true, m9_legal_cartography_gates_preserved: true, legal_signal_derivation_gate_preserved: true, data_privacy_navigation_index_gate_preserved_phase2_owned: true, no_legal_governance_source_index_gate: true, no_data_provenance_source_index_gate: true, phase7_semantic_batch_gate_enforced: true, phase8_dap_forensics_gate_enforced: true, old_m10_4b_4c_sidecar_removed: true });

export async function saveRuntimeArtifact(input) { return saveArtifact(input); }
export async function readRuntimeArtifact(input) { return readArtifact(input); }
export async function readRuntimeArtifactPayload(input) { return readArtifactPayload(input); }
export async function lockRuntimePhase(input) { return lockPhase(input); }
export async function listRuntimeArtifacts(runId) { return listArtifacts(runId); }
export async function assertCentralPhaseArtifactsExist(runId, centralPhaseId) { return assertRequiredArtifactsExist(runId, artifactsForCentralPhase(centralPhaseId)); }

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
  await updateRunRecord(parsed.run_id, { current_phase: phaseContext.persistence_phase, status: effectiveLockStatus, central_phase: phaseContext.central_phase_id, central_phase_label: phaseContext.central_phase_label, active_internal_job: phaseContext.internal_job_id });
  await logRuntimeArtifactEvent({ run_id: parsed.run_id, event_type: "ARTIFACT_SAVED", actor: parsed.agent_id, phaseContext, payload: { artifact_name: parsed.artifact_name, version, lock_status: effectiveLockStatus, original_lock_status: parsed.lock_status, save_order_gate: "PASS" } });
  return { ok: true, run_id: parsed.run_id, artifact_name: parsed.artifact_name, version, lock_status: effectiveLockStatus, drive_file_id: meta.drive_file_id, drive_web_view_link: meta.drive_web_view_link, receipt: `${parsed.artifact_name}_v${version} saved for ${parsed.run_id}` };
}

export async function readArtifact({ run_id, artifact_name, agent_id = "operator" }) { assertRunId(run_id); assertRuntimeKnownArtifact(artifact_name); assertRuntimeReadPermission(agent_id, artifact_name); const meta = await getArtifactMetadata(run_id, artifact_name); const artifact = await readJsonArtifactFromDrive(meta.drive_file_id); return { ok: true, run_id, artifact_name, version: meta.latest_version || meta.version, lock_status: meta.lock_status, artifact }; }
export async function readArtifactPayload({ run_id, artifact_name, agent_id = "operator" }) { return (await readArtifact({ run_id, artifact_name, agent_id })).artifact; }
export async function listArtifacts(runId) { assertRunId(runId); return listArtifactMetadata(runId); }
export async function assertRequiredArtifactsExist(runId, artifactNames) { for (const artifactName of artifactNames || []) { const name = String(artifactName || ""); if (name.includes("{GROUP}") || name.includes("{BATCH_ID}") || name.includes("{DOC_TYPE}")) continue; await getArtifactMetadata(runId, name); } }

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
  const patch = { current_phase: nextContext?.persistence_phase || body.next_phase || body.phase, status: body.status, central_phase: nextContext?.central_phase_id || phaseContext.central_phase_id, central_phase_label: nextContext?.central_phase_label || phaseContext.central_phase_label, active_internal_job: nextContext?.internal_job_id || phaseContext.internal_job_id, final_report_url: body.final_report_url || existing.final_report_url || "" };
  const updated = await updateRunRecord(body.run_id, patch);
  await updateRunDashboardRow(updated);
  await logRuntimeArtifactEvent({ run_id: body.run_id, event_type: "CENTRAL_PHASE_LOCKED", actor: body.agent_id, phaseContext, payload: { status: body.status, next_phase: patch.current_phase, next_central_phase: patch.central_phase } });
  return { ok: true, run_id: body.run_id, phase: body.phase, central_phase: phaseContext.central_phase_id, central_phase_label: phaseContext.central_phase_label, status: body.status, next_phase: patch.current_phase, next_central_phase: patch.central_phase };
}

function parseSaveArtifactInput(input = {}) { const parsed = { run_id: String(input.run_id || ""), phase: String(input.phase || ""), agent_id: String(input.agent_id || ""), artifact_name: String(input.artifact_name || ""), lock_status: String(input.lock_status || ""), artifact: input.artifact }; const missing = []; if (!parsed.run_id) missing.push("run_id"); if (!parsed.phase) missing.push("phase"); if (!parsed.agent_id) missing.push("agent_id"); if (!parsed.artifact_name) missing.push("artifact_name"); if (!LOCK_STATUSES.has(parsed.lock_status)) missing.push("lock_status"); if (!parsed.artifact || typeof parsed.artifact !== "object" || Array.isArray(parsed.artifact)) missing.push("artifact_object"); if (missing.length) throw new Error(`INVALID_REQUEST:${missing.join(",")}`); return parsed; }
function parseLockPhaseInput(input = {}) { const parsed = { run_id: String(input.run_id || ""), phase: String(input.phase || ""), agent_id: String(input.agent_id || "operator"), status: String(input.status || ""), next_phase: input.next_phase == null ? null : String(input.next_phase), final_report_url: String(input.final_report_url || "") }; const missing = []; if (!parsed.run_id) missing.push("run_id"); if (!parsed.phase) missing.push("phase"); if (!parsed.agent_id) missing.push("agent_id"); if (!LOCK_STATUSES.has(parsed.status)) missing.push("status"); if (missing.length) throw new Error(`INVALID_REQUEST:${missing.join(",")}`); return parsed; }
function phaseContextFor(phaseValue) { const raw = String(phaseValue || ""); if (!raw) throw new Error("INVALID_PHASE:missing"); if (raw === "NORMALIZED_REPORT_RENDERER") return phaseContextFor("RENDERER"); if (raw === "COMPILER") return phaseContextFor("NORMALIZED_COMPILER"); if (raw === "COMPLETE") return { requested_phase: raw, persistence_phase: "COMPLETE", internal_job_id: "COMPLETE", central_phase_id: "DILIGENCE_QA_COMPLETE", central_phase_label: "Diligence-QA Complete", is_central_phase_request: false }; if (CENTRAL_PHASE_BY_ID[raw]) { const central = getCentralPhase(raw); return { requested_phase: raw, persistence_phase: raw, internal_job_id: raw, central_phase_id: central.central_phase_id, central_phase_label: central.public_label, is_central_phase_request: true }; } const internalJobId = normalizeInternalJobId(raw); const central = centralPhaseForInternalJob(internalJobId); if (!central) throw new Error(`INVALID_RUNTIME_PHASE:${raw}`); return { requested_phase: raw, persistence_phase: raw, internal_job_id: internalJobId, central_phase_id: central.central_phase_id, central_phase_label: central.public_label, is_central_phase_request: false }; }
function requiredWritesForPhaseContext(phaseContext) { if (phaseContext.is_central_phase_request) return artifactsForCentralPhase(phaseContext.central_phase_id); if (phaseContext.internal_job_id === "COMPLETE") return []; return getInternalJobContract(phaseContext.internal_job_id).writes || []; }
function assertRuntimeKnownArtifact(artifactName) { if (RUNTIME_ARTIFACT_EXTRAS.has(artifactName)) return; if (M11_BATCH_ARTIFACT_PATTERN.test(artifactName) || M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName) || PHASE7_DAP_BATCH_ARTIFACT_PATTERN.test(artifactName) || PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName)) return; assertKnownArtifactName(artifactName); }
function assertRuntimeReadPermission(agentId, artifactName) { if (RUNTIME_ARTIFACT_EXTRAS.has(artifactName)) return; assertCanReadArtifact(agentId, artifactName); }
function assertRuntimeWritePermission(agentId, artifactName) { if (RUNTIME_ARTIFACT_EXTRAS.has(artifactName)) { if (!["qualified_review_system", "diligence_qa_gate", "operator"].includes(agentId)) throw new Error(`WRITE_FORBIDDEN:${agentId}:${artifactName}`); return; } assertCanWriteArtifact(agentId, artifactName); }
function assertRuntimePhaseCanWriteArtifact(phaseContext, artifactName) { if (phaseContext.is_central_phase_request) { const allowed = artifactsForCentralPhase(phaseContext.central_phase_id); if (!allowed.includes(artifactName) && !(phaseContext.central_phase_id === "DATA_PROVENANCE_PROFILE" && PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName))) throw new Error(`CENTRAL_PHASE_WRITE_FORBIDDEN:${phaseContext.central_phase_id}:${artifactName}`); return; } if (RUNTIME_ARTIFACT_EXTRAS.has(artifactName)) return; if (M11_BATCH_ARTIFACT_PATTERN.test(artifactName) || M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName) || PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName)) return; assertPhaseCanWriteArtifact(phaseContext.persistence_phase, artifactName); }
function normalizeArtifactLockStatus(parsed) { if (parsed.artifact_name === ART.exposureForensics && parsed.lock_status === "REPAIR_REQUIRED") return "LOCKED_WITH_LIMITATIONS"; return parsed.lock_status; }

async function assertArtifactSaveOrder(parsed) {
  const { run_id, artifact_name } = parsed;
  if (artifact_name === ART.sourceFamilyIndex) await requireSavedArtifact(run_id, ART.dedupedUrlManifest, "SAVE_ORDER_BLOCKED:source_family_index_requires_deduped_url_manifest");
  if (artifact_name === ART.sourceHandoff) await requireSavedArtifact(run_id, ART.sourceFamilyIndex, "SAVE_ORDER_BLOCKED:source_handoff_requires_source_family_index");
  if (artifact_name === ART.cartographySourceInventory) await requireSavedArtifact(run_id, ART.sourceHandoff, "SAVE_ORDER_BLOCKED:cartography_source_inventory_requires_source_handoff");
  if (artifact_name === ART.cartographyLocatorSpine) await requireSavedArtifact(run_id, ART.cartographySourceInventory, "SAVE_ORDER_BLOCKED:locator_spine_requires_source_inventory");
  if (artifact_name === ART.cartographyProfileRouteMatrix) await requireSavedArtifact(run_id, ART.cartographyLocatorSpine, "SAVE_ORDER_BLOCKED:profile_route_matrix_requires_locator_spine");
  if (artifact_name === ART.cartographySemanticNavigationOverlay) await requireSavedArtifact(run_id, ART.cartographyProfileRouteMatrix, "SAVE_ORDER_BLOCKED:semantic_overlay_requires_profile_route_matrix");
  if (artifact_name === ART.legalCartographyDeterministicMap) await requireSavedArtifact(run_id, ART.cartographySemanticNavigationOverlay, "SAVE_ORDER_BLOCKED:m9_deterministic_map_requires_semantic_overlay");
  if (artifact_name === ART.legalCartographySemanticProfile) await requireSavedArtifact(run_id, ART.legalCartographyDeterministicMap, "SAVE_ORDER_BLOCKED:m9_semantic_profile_requires_deterministic_map");
  if (artifact_name === ART.legalCartographyReinvestigationWorkpad) await requireSavedArtifact(run_id, ART.legalCartographySemanticProfile, "SAVE_ORDER_BLOCKED:m9_reinvestigation_workpad_requires_semantic_profile");
  if (artifact_name === ART.legalCartographyIndex) await requireSavedArtifact(run_id, ART.legalCartographySemanticProfile, "SAVE_ORDER_BLOCKED:m9_final_index_requires_semantic_profile");
  if (artifact_name === ART.legalSignalDerivationProfile) await requireSavedArtifact(run_id, ART.legalCartographyIndex, "SAVE_ORDER_BLOCKED:legal_signal_derivation_requires_legal_cartography_index");
  if ([ART.targetProfileSourceIndex, ART.activityProfileSourceIndex, ART.dataPrivacyNavigationIndex, ART.cartographyIndex, ART.cartographyValidationManifest].includes(artifact_name)) { await requireSavedArtifact(run_id, ART.cartographySemanticNavigationOverlay, `SAVE_ORDER_BLOCKED:${artifact_name}_requires_semantic_navigation_overlay`); await requireSavedArtifact(run_id, ART.legalCartographyIndex, `SAVE_ORDER_BLOCKED:${artifact_name}_requires_legal_cartography_index`); await requireSavedArtifact(run_id, ART.legalSignalDerivationProfile, `SAVE_ORDER_BLOCKED:${artifact_name}_requires_legal_signal_derivation_profile`); }
  if (artifact_name === ART.targetProfile) { await requireSavedArtifact(run_id, ART.cartographyIndex, "SAVE_ORDER_BLOCKED:target_profile_requires_cartography_index"); await requireSavedArtifact(run_id, ART.targetProfileSourceIndex, "SAVE_ORDER_BLOCKED:target_profile_requires_target_profile_source_index"); await requireSavedArtifact(run_id, ART.legalCartographyIndex, "SAVE_ORDER_BLOCKED:target_profile_requires_legal_cartography_index"); await requireSavedArtifact(run_id, ART.legalSignalDerivationProfile, "SAVE_ORDER_BLOCKED:target_profile_requires_legal_signal_derivation_profile"); }
  if (artifact_name === ART.targetForensics) await requireSavedArtifact(run_id, ART.targetProfile, "SAVE_ORDER_BLOCKED:target_forensics_requires_target_profile");
  if (artifact_name === ART.activityInventory) { await requireSavedArtifact(run_id, ART.activityProfileSourceIndex, "SAVE_ORDER_BLOCKED:activity_inventory_requires_activity_profile_source_index"); await requireSavedArtifact(run_id, ART.targetProfile, "SAVE_ORDER_BLOCKED:activity_inventory_requires_target_profile"); await requireSavedArtifact(run_id, ART.targetForensics, "SAVE_ORDER_BLOCKED:activity_inventory_requires_target_forensics"); await requirePhaseAccepted(run_id, ART.targetForensics, "SAVE_ORDER_BLOCKED:activity_inventory_requires_accepted_target_forensics"); }
  if (artifact_name === ART.activityProfile) { await requireSavedArtifact(run_id, ART.activityProfileSourceIndex, "SAVE_ORDER_BLOCKED:activity_profile_requires_activity_profile_source_index"); await requireSavedArtifact(run_id, ART.activityInventory, "SAVE_ORDER_BLOCKED:activity_profile_requires_activity_inventory"); await requirePhaseAccepted(run_id, ART.activityInventory, "SAVE_ORDER_BLOCKED:activity_profile_requires_accepted_activity_inventory"); await requireSavedArtifact(run_id, ART.targetProfile, "SAVE_ORDER_BLOCKED:activity_profile_requires_target_profile"); await requireSavedArtifact(run_id, ART.targetForensics, "SAVE_ORDER_BLOCKED:activity_profile_requires_target_forensics"); }
  if (artifact_name === ART.activityForensics) { await requireSavedArtifact(run_id, ART.activityProfile, "SAVE_ORDER_BLOCKED:activity_forensics_requires_activity_profile"); await requirePhaseAccepted(run_id, ART.activityProfile, "SAVE_ORDER_BLOCKED:activity_forensics_requires_accepted_activity_profile"); }
  if (artifact_name === ART.dapRegistryManifest) await requireAcceptedActivityForensics(run_id, "SAVE_ORDER_BLOCKED:dap_registry_requires_accepted_activity_forensics");
  if (artifact_name === ART.dapStrategicMatrix) await requireSavedArtifact(run_id, ART.dapRegistryManifest, "SAVE_ORDER_BLOCKED:dap_strategic_matrix_requires_registry_manifest");
  if (artifact_name === ART.dapRoute) { await requireSavedArtifact(run_id, ART.cartographyIndex, "SAVE_ORDER_BLOCKED:dap_route_requires_cartography_index"); await requireSavedArtifact(run_id, ART.dataPrivacyNavigationIndex, "SAVE_ORDER_BLOCKED:dap_route_requires_data_privacy_navigation_index"); await requireSavedArtifact(run_id, ART.legalCartographyIndex, "SAVE_ORDER_BLOCKED:dap_route_requires_legal_cartography_index"); await requireSavedArtifact(run_id, ART.legalSignalDerivationProfile, "SAVE_ORDER_BLOCKED:dap_route_requires_legal_signal_derivation_profile"); await requireSavedArtifact(run_id, ART.dapRegistryManifest, "SAVE_ORDER_BLOCKED:dap_route_requires_registry_manifest"); await requireSavedArtifact(run_id, ART.dapStrategicMatrix, "SAVE_ORDER_BLOCKED:dap_route_requires_strategic_matrix"); }
  if (PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifact_name)) await requireSavedArtifact(run_id, ART.dapRoute, "SAVE_ORDER_BLOCKED:dap_batch_validation_requires_route_manifest");
  if (PHASE7_DAP_BATCH_ARTIFACT_PATTERN.test(artifact_name)) { await requireSavedArtifact(run_id, ART.dapRoute, "SAVE_ORDER_BLOCKED:dap_batch_requires_route_manifest"); await requirePairedDapValidationForBatch(run_id, artifact_name, "SAVE_ORDER_BLOCKED:dap_batch_requires_paired_validation"); }
  if (artifact_name === ART.dapValidationManifest) { await requireSavedArtifact(run_id, ART.dapRoute, "SAVE_ORDER_BLOCKED:dap_validation_manifest_requires_route_manifest"); await requireAllPlannedDapBatchesSaved(run_id, "SAVE_ORDER_BLOCKED:dap_validation_manifest_requires_all_batches_and_validations"); }
  if (artifact_name === ART.dapGate) { await requireSavedArtifact(run_id, ART.dapValidationManifest, "SAVE_ORDER_BLOCKED:dap_gate_requires_validation_manifest"); await requirePhaseAccepted(run_id, ART.dapValidationManifest, "SAVE_ORDER_BLOCKED:dap_gate_requires_accepted_validation_manifest"); await requireAllPlannedDapBatchesSaved(run_id, "SAVE_ORDER_BLOCKED:dap_gate_requires_all_batches_and_validations"); }
  if (artifact_name === ART.dapForensics) { await requireSavedArtifact(run_id, ART.cartographyIndex, "SAVE_ORDER_BLOCKED:dap_forensics_requires_cartography_index"); await requireSavedArtifact(run_id, ART.dataPrivacyNavigationIndex, "SAVE_ORDER_BLOCKED:dap_forensics_requires_data_privacy_navigation_index"); await requireSavedArtifact(run_id, ART.dapRoute, "SAVE_ORDER_BLOCKED:dap_forensics_requires_route_manifest"); await requireAllPlannedDapBatchesSaved(run_id, "SAVE_ORDER_BLOCKED:dap_forensics_requires_all_batches_and_validations"); await requireSavedArtifact(run_id, ART.dapValidationManifest, "SAVE_ORDER_BLOCKED:dap_forensics_requires_validation_manifest"); await requireSavedArtifact(run_id, ART.dapGate, "SAVE_ORDER_BLOCKED:dap_forensics_requires_semantic_batch_gate"); await requirePhaseAccepted(run_id, ART.dapGate, "SAVE_ORDER_BLOCKED:dap_forensics_requires_accepted_semantic_batch_gate"); }
  if (artifact_name === ART.exposureRoutePlan) { await requireSavedArtifact(run_id, ART.dapForensics, "SAVE_ORDER_BLOCKED:exposure_route_plan_requires_dap_forensics"); await requirePhaseAccepted(run_id, ART.dapForensics, "SAVE_ORDER_BLOCKED:exposure_route_plan_requires_accepted_dap_forensics"); }
  if (M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifact_name)) await requireSavedArtifact(run_id, ART.exposureRoutePlan, "SAVE_ORDER_BLOCKED:exposure_batch_validation_requires_route_plan");
  if (M11_BATCH_ARTIFACT_PATTERN.test(artifact_name)) { await requireSavedArtifact(run_id, ART.exposureRoutePlan, "SAVE_ORDER_BLOCKED:exposure_batch_requires_route_plan"); await requireSavedArtifact(run_id, pairedBatchValidationName(artifact_name), "SAVE_ORDER_BLOCKED:exposure_batch_requires_paired_validation"); }
  if (artifact_name === ART.exposureWorkpad) { await requireSavedArtifact(run_id, ART.exposureRoutePlan, "SAVE_ORDER_BLOCKED:exposure_workpad_requires_route_plan"); await requireAllPlannedExposureBatchesSaved(run_id, "SAVE_ORDER_BLOCKED:exposure_workpad_requires_all_batches_and_validations"); }
  if (artifact_name === ART.exposureControlled) await requireSavedArtifact(run_id, ART.exposureWorkpad, "SAVE_ORDER_BLOCKED:controlled_exposure_requires_workpad");
  if (artifact_name === ART.exposureTriggered) { await requireSavedArtifact(run_id, ART.exposureWorkpad, "SAVE_ORDER_BLOCKED:triggered_exposure_requires_workpad"); await requireSavedArtifact(run_id, ART.exposureControlled, "SAVE_ORDER_BLOCKED:triggered_exposure_requires_controlled_profile_first"); }
  if (artifact_name === ART.exposureForensics) { await requireSavedArtifact(run_id, ART.exposureRoutePlan, "SAVE_ORDER_BLOCKED:exposure_forensics_requires_route_plan"); await requireAllPlannedExposureBatchesSaved(run_id, "SAVE_ORDER_BLOCKED:exposure_forensics_requires_all_batches_and_validations"); await requireSavedArtifact(run_id, ART.exposureWorkpad, "SAVE_ORDER_BLOCKED:exposure_forensics_requires_workpad"); await requireSavedArtifact(run_id, ART.exposureControlled, "SAVE_ORDER_BLOCKED:exposure_forensics_requires_controlled_profile"); await requireSavedArtifact(run_id, ART.exposureTriggered, "SAVE_ORDER_BLOCKED:exposure_forensics_requires_triggered_profile"); }
  if (artifact_name === ART.challengeGate) { await requireSavedArtifact(run_id, ART.exposureRoutePlan, "SAVE_ORDER_BLOCKED:operator_challenge_requires_route_plan"); await requireAllPlannedExposureBatchesSaved(run_id, "SAVE_ORDER_BLOCKED:operator_challenge_requires_all_batches_and_validations"); await requireSavedArtifact(run_id, ART.exposureWorkpad, "SAVE_ORDER_BLOCKED:operator_challenge_requires_workpad"); await requireSavedArtifact(run_id, ART.exposureControlled, "SAVE_ORDER_BLOCKED:operator_challenge_requires_controlled_profile"); await requireSavedArtifact(run_id, ART.exposureTriggered, "SAVE_ORDER_BLOCKED:operator_challenge_requires_triggered_profile"); await requireSavedArtifact(run_id, ART.exposureForensics, "SAVE_ORDER_BLOCKED:operator_challenge_requires_exposure_forensics"); await requirePhaseAccepted(run_id, ART.exposureForensics, "SAVE_ORDER_BLOCKED:operator_challenge_requires_accepted_exposure_forensics"); }
}

async function assertArtifactLockOrder(body, phaseContext) {
  if (!LOCK_ADVANCE_STATUSES.has(body.status)) return;
  const required = requiredWritesForPhaseContext(phaseContext);
  const requiresAny = (...names) => names.some((name) => required.includes(name));
  const requiresAnyDapBatch = required.some((name) => PHASE7_DAP_BATCH_ARTIFACT_PATTERN.test(name));
  if (requiresAny(ART.sourceHandoff)) await requireSavedArtifact(body.run_id, ART.sourceFamilyIndex, "PHASE_LOCK_BLOCKED:source_handoff_requires_source_family_index");
  if (requiresAny(ART.cartographySourceInventory)) await requireSavedArtifact(body.run_id, ART.sourceHandoff, "PHASE_LOCK_BLOCKED:cartography_requires_source_handoff");
  if (requiresAny(ART.cartographyLocatorSpine)) await requireSavedArtifact(body.run_id, ART.cartographySourceInventory, "PHASE_LOCK_BLOCKED:locator_spine_requires_source_inventory");
  if (requiresAny(ART.cartographyProfileRouteMatrix)) await requireSavedArtifact(body.run_id, ART.cartographyLocatorSpine, "PHASE_LOCK_BLOCKED:profile_route_matrix_requires_locator_spine");
  if (requiresAny(ART.cartographySemanticNavigationOverlay)) await requireSavedArtifact(body.run_id, ART.cartographyProfileRouteMatrix, "PHASE_LOCK_BLOCKED:semantic_overlay_requires_profile_route_matrix");
  if (requiresAny(ART.legalCartographyDeterministicMap)) await requireSavedArtifact(body.run_id, ART.cartographySemanticNavigationOverlay, "PHASE_LOCK_BLOCKED:m9_requires_semantic_overlay");
  if (requiresAny(ART.legalCartographyIndex, ART.legalSignalDerivationProfile, ART.targetProfileSourceIndex, ART.activityProfileSourceIndex, ART.dataPrivacyNavigationIndex, ART.cartographyIndex, ART.cartographyValidationManifest)) { await requireSavedArtifact(body.run_id, ART.legalCartographyIndex, "PHASE_LOCK_BLOCKED:phase2_compiler_requires_m9_legal_cartography_index"); await requireSavedArtifact(body.run_id, ART.legalSignalDerivationProfile, "PHASE_LOCK_BLOCKED:phase2_compiler_requires_legal_signal_derivation_profile"); }
  if (requiresAny(ART.targetProfile)) { await requireSavedArtifact(body.run_id, ART.cartographyIndex, "PHASE_LOCK_BLOCKED:target_profile_requires_cartography_index"); await requireSavedArtifact(body.run_id, ART.targetProfileSourceIndex, "PHASE_LOCK_BLOCKED:target_profile_requires_target_profile_source_index"); }
  if (requiresAny(ART.activityInventory)) { await requireSavedArtifact(body.run_id, ART.activityProfileSourceIndex, "PHASE_LOCK_BLOCKED:activity_inventory_requires_activity_index"); await requireSavedArtifact(body.run_id, ART.targetProfile, "PHASE_LOCK_BLOCKED:activity_inventory_requires_target_profile"); await requireSavedArtifact(body.run_id, ART.targetForensics, "PHASE_LOCK_BLOCKED:activity_inventory_requires_target_forensics"); await requirePhaseAccepted(body.run_id, ART.targetForensics, "PHASE_LOCK_BLOCKED:activity_inventory_requires_accepted_target_forensics"); }
  if (requiresAny(ART.activityForensics)) { await requireSavedArtifact(body.run_id, ART.activityProfile, "PHASE_LOCK_BLOCKED:activity_forensics_requires_activity_profile"); await requirePhaseAccepted(body.run_id, ART.activityProfile, "PHASE_LOCK_BLOCKED:activity_forensics_requires_accepted_activity_profile"); }
  if (requiresAny(ART.dapRegistryManifest, ART.dapStrategicMatrix, ART.dapRoute) || requiresAnyDapBatch) await requireAcceptedActivityForensics(body.run_id, "PHASE_LOCK_BLOCKED:dap_layer4_requires_accepted_activity_forensics");
  if (requiresAny(ART.dapRoute) || requiresAnyDapBatch || requiresAny(ART.dapValidationManifest, ART.dapGate, ART.dapForensics)) { await requireSavedArtifact(body.run_id, ART.dataPrivacyNavigationIndex, "PHASE_LOCK_BLOCKED:dap_requires_data_privacy_navigation_index"); await requireSavedArtifact(body.run_id, ART.dapRoute, "PHASE_LOCK_BLOCKED:dap_route_manifest_required"); }
  if (requiresAnyDapBatch || requiresAny(ART.dapValidationManifest, ART.dapGate, ART.dapForensics)) await requireAllPlannedDapBatchesSaved(body.run_id, "PHASE_LOCK_BLOCKED:all_dap_batches_and_validations_required");
  if (requiresAny(ART.dapGate, ART.dapForensics)) { await requireSavedArtifact(body.run_id, ART.dapValidationManifest, "PHASE_LOCK_BLOCKED:dap_validation_manifest_required"); if (requiresAny(ART.dapGate)) await requirePhaseAccepted(body.run_id, ART.dapValidationManifest, "PHASE_LOCK_BLOCKED:accepted_dap_validation_manifest_required"); }
  if (requiresAny(ART.dapForensics)) { await requireSavedArtifact(body.run_id, ART.dapGate, "PHASE_LOCK_BLOCKED:dap_semantic_batch_gate_required"); await requirePhaseAccepted(body.run_id, ART.dapGate, "PHASE_LOCK_BLOCKED:accepted_dap_semantic_batch_gate_required"); }
  if (requiresAny(ART.exposureRoutePlan)) { await requireSavedArtifact(body.run_id, ART.dapForensics, "PHASE_LOCK_BLOCKED:exposure_requires_dap_forensics"); await requirePhaseAccepted(body.run_id, ART.dapForensics, "PHASE_LOCK_BLOCKED:exposure_requires_accepted_dap_forensics"); }
}

async function requireSavedArtifact(runId, artifactName, message) { try { await getArtifactMetadata(runId, artifactName); } catch { throw new Error(message); } }
async function requirePhaseAccepted(runId, artifactName, message) { const meta = await getArtifactMetadata(runId, artifactName); if (!ACCEPTED_ARTIFACT_STATUSES.has(meta.lock_status)) throw new Error(message); }
async function requireAcceptedActivityForensics(runId, message) { await requireSavedArtifact(runId, ART.activityForensics, message); await requirePhaseAccepted(runId, ART.activityForensics, message); }
async function requirePairedDapValidationForBatch(runId, batchArtifactName, message) { await requireSavedArtifact(runId, batchArtifactName.replace(/^dap_semantic_batch_/, "dap_semantic_batch_validation__DAP-SEM-BATCH-").replace(/_artifact$/, ""), message); }
async function requireAllPlannedDapBatchesSaved(runId, message) { const metas = await listArtifactMetadata(runId); const names = new Set(metas.map((row) => row.artifact_name)); const batches = [...names].filter((name) => PHASE7_DAP_BATCH_ARTIFACT_PATTERN.test(name)); for (const batch of batches) if (!names.has(batch.replace(/^dap_semantic_batch_/, "dap_semantic_batch_validation__DAP-SEM-BATCH-").replace(/_artifact$/, ""))) throw new Error(message); }
async function requireAllPlannedExposureBatchesSaved(runId, message) { const metas = await listArtifactMetadata(runId); const names = new Set(metas.map((row) => row.artifact_name)); for (const batch of [...names].filter((name) => M11_BATCH_ARTIFACT_PATTERN.test(name))) if (!names.has(pairedBatchValidationName(batch))) throw new Error(message); }
function pairedBatchValidationName(batchArtifactName) { return String(batchArtifactName || "").replace("exposure_registry_batch__", "exposure_registry_batch_validation__"); }
async function normalizePhaseLockBody(body) { return body; }
async function logRuntimeArtifactEvent({ run_id, event_type, actor, phaseContext, payload }) { await logEvent({ run_id, event_type, actor, payload: { phase: phaseContext.persistence_phase, internal_job_id: phaseContext.internal_job_id, central_phase: phaseContext.central_phase_id, central_phase_label: phaseContext.central_phase_label, ...payload } }); }
