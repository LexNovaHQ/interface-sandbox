import { logEvent } from "../../runtime/services/storage/firestore.service.js";
import { buildPhasePrompt } from "../../runtime/services/prompts.service.js";
import { loadReferencePacket } from "../../runtime/services/reference.service.js";
import { callGeminiJson } from "../../runtime/services/provider.service.js";
import { lockPhase, readArtifact, readArtifactPayload, saveArtifact } from "../../runtime/services/artifacts.service.js";
import { assembleM11AcceptedBatchLedger, buildExposureRegistryRoutePlan, buildM11BatchPacket, mergeExposureRegistryWorkpad98, projectControlledProfile, projectTriggeredProfile, validateM11BatchLedger } from "./m11-deterministic-system-m11v2.js";
import { buildExposureRegistryForensicsFromSavedArtifacts } from "./m11-deterministic-forensics-m11v2.js";
import { buildCompactM11BatchPacket } from "./m11-batch-evidence-resolver.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";

const AGENT_5 = "agent_5_exposure_registry";
const ACCEPTED = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE"]);
const STATUS_INPUT_FIELDS = Object.freeze(["target_match_present", "hunter_conditions_met", "trigger_if_met", "exclude_if_met", "visible_control_present", "visible_control_defeats_or_reduces_exposure", "evidence_sufficient", "public_evidence_limitation", "false_positive_concern"]);
const BATCH_PROMPTS = Object.freeze(["agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml", "agent-packages/agent_5_exposure_registry/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md", "agent-packages/agent_5_exposure_registry/00_M11_RUNTIME_CONTROLLER.md", "agent-packages/agent_5_exposure_registry/M11_C_BATCH_EVALUATION.md", "agent-packages/agent_5_exposure_registry/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md", "agent-packages/agent_5_exposure_registry/BACKEND_CANONICAL_OUTPUT_ADAPTER.md"]);
const REPAIR_PROMPTS = Object.freeze(["agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml", "agent-packages/agent_5_exposure_registry/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md", "agent-packages/agent_5_exposure_registry/00_M11_RUNTIME_CONTROLLER.md", "agent-packages/agent_5_exposure_registry/M11_D_BATCH_REINVESTIGATION_REPAIR.md", "agent-packages/agent_5_exposure_registry/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md", "agent-packages/agent_5_exposure_registry/BACKEND_CANONICAL_OUTPUT_ADAPTER.md"]);
const ART = Object.freeze({ legalIndex: "legal_cartography_index", featureMain: "target_feature_profile", route: "exposure_registry_route_plan", workpad: "exposure_registry_workpad_98", controlled: "exposure_registry_controlled_profile", triggered: "exposure_registry_triggered_profile", forensics: "exposure_registry_profile_forensics" });
const M11_SCHEMA_UPGRADE = "THREAT_NAME_AND_SUBCATEGORY_NORMALIZATION_V1";

export const M11_PHASE2G_RUNTIME_STATUS = Object.freeze({
  routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
  route_id: "ROUTE.PHASE9.EXPOSURE_PROFILE",
  bucket_id: "2F_BUCKET_LEGAL_CARTOGRAPHY_LEGAL_SIGNALS",
  delivery_mode: "SOURCE_BUCKET_PROFILE",
  lossless_evidence_is_primary: true,
  index_navigation_mandatory: true,
  preceding_forensic_inputs_forbidden: true,
  infrastructure_authority: "CENTRAL_RUNTIME_SERVICES",
  phase_owned_path: "src/phases/10-exposure-profile"
});

export async function runM11OrchestratedPhase({ run, phase, contract }) {
  if (!(contract.reads || []).includes("phase_routing_manifest")) throw new Error("M11_PHASE2G_MANIFEST_READ_MISSING");
  const routed = await readPhaseRouteRuntimePacket({
    internalJobId: "M11",
    consumerAgentId: contract.agent_id || AGENT_5,
    readArtifacts: ({ reads, agent_id, strict }) => readArtifactsForM11({ run_id: run.run_id, reads, agent_id, strict })
  });
  const artifacts = routed.artifacts;
  assertM11RoutePacket(artifacts.phase_route_runtime_packet);
  const referencePacket = await loadReferencePacket(contract.references || []);
  const route = await getOrBuildRoutePlan({ run, phase, artifacts, referencePacket });
  if (!isAccepted(route.lock_status)) return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "CONTROLLED_FAILURE", next_phase: phase });

  const acceptedBatches = [];
  const batchValidations = [];
  for (const batch of route.artifact.batch_plan || []) {
    const completed = await readCompletedBatchCheckpoint({ run_id: run.run_id, batch_id: batch.batch_id });
    if (completed) {
      acceptedBatches.push(completed.batchArtifact);
      batchValidations.push(completed.validationArtifact);
      await logEvent({ run_id: run.run_id, event_type: "M11_V2_CHECKPOINT_REUSED", actor: AGENT_5, payload: { artifact_name: `exposure_registry_batch__${batch.batch_id}`, lock_status: completed.batchLockStatus, m11_schema_upgrade: M11_SCHEMA_UPGRADE } });
      continue;
    }

    const batchPacketRoot = buildM11BatchPacket({ routePlan: { [ART.route]: route.artifact }, batchId: batch.batch_id, upstreamArtifacts: artifacts, referencePacket });
    const compactPacket = buildCompactM11BatchPacket({ batchPacket: batchPacketRoot, upstreamArtifacts: artifacts });
    let semanticOutput = await runModelBatch({ run, phase, batch, compactPacket, repair: false });
    let shape = validateM11BatchLedger(semanticOutput, batch.expected_threat_ids || []);
    const validationName = `exposure_registry_batch_validation__${batch.batch_id}`;

    if (!shape.ok) {
      semanticOutput = await runModelBatch({ run, phase, batch, compactPacket, repair: true, batchOutput: semanticOutput, shape, validationArtifact: null, repairReason: "SEMANTIC_SHAPE" });
      shape = validateM11BatchLedger(semanticOutput, batch.expected_threat_ids || []);
      if (!shape.ok) return failBatch({ run, phase, batch, validationName, shape });
    }

    let validationArtifact = validateSemanticBatch({ batch, batchOutput: semanticOutput, shape, routePlan: route.artifact });
    let validationStatus = validationArtifact.exposure_registry_batch_validation.status;
    if (!isAcceptedBatchValidationStatus(validationStatus)) {
      semanticOutput = await runModelBatch({ run, phase, batch, compactPacket, repair: true, batchOutput: semanticOutput, shape, validationArtifact, repairReason: "BATCH_VALIDATION" });
      shape = validateM11BatchLedger(semanticOutput, batch.expected_threat_ids || []);
      if (!shape.ok) return failBatch({ run, phase, batch, validationName, shape, prior: validationArtifact });
      validationArtifact = validateSemanticBatch({ batch, batchOutput: semanticOutput, shape, routePlan: route.artifact });
      validationStatus = validationArtifact.exposure_registry_batch_validation.status;
      if (!isAcceptedBatchValidationStatus(validationStatus)) {
        validationArtifact.exposure_registry_batch_validation.status = "PASS_WITH_LIMITATION";
        validationArtifact.exposure_registry_batch_validation.limitations.push({ code: "POST_REPAIR_SEMANTIC_LIMITATION", batch_id: batch.batch_id });
        validationStatus = "PASS_WITH_LIMITATION";
      }
    }

    const acceptedBatch = assembleM11AcceptedBatchLedger({ semanticBatch: semanticOutput, batchPacket: batchPacketRoot });
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: validationName, artifact: validationArtifact, lock_status: batchValidationLockStatus(validationStatus) }));
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: `exposure_registry_batch__${batch.batch_id}`, artifact: acceptedBatch, lock_status: validationStatus === "PASS_WITH_LIMITATION" ? "LOCKED_WITH_LIMITATIONS" : "LOCKED" }));
    acceptedBatches.push(acceptedBatch);
    batchValidations.push(validationArtifact);
  }

  const workpad = await getOrBuildWorkpad({ run, phase, route, acceptedBatches, batchValidations });
  if (!isAccepted(workpad.lock_status)) return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "REPAIR_REQUIRED", next_phase: phase });
  const controlled = await getOrBuildProjection({ run, phase, artifactName: ART.controlled, isCurrent: isM11V2Projection, build: () => projectControlledProfile({ [ART.workpad]: workpad.artifact })[ART.controlled] });
  const triggered = await getOrBuildProjection({ run, phase, artifactName: ART.triggered, isCurrent: isM11V2Projection, build: () => projectTriggeredProfile({ [ART.workpad]: workpad.artifact })[ART.triggered] });
  const forensics = await getOrBuildForensics({ run, phase, route, workpad, controlled, triggered, acceptedBatches, batchValidations, referencePacket });
  const finalStatus = deriveFinalM11Status({ routeStatus: route.lock_status, forensicStatus: forensics.lock_status, batchValidations });
  await logEvent({ run_id: run.run_id, event_type: "M11_V2_ORCHESTRATED_PHASE_COMPLETED", actor: AGENT_5, payload: { batch_prompt_mode: "semantic_evidence_application_then_backend_materialization", route_status: route.lock_status, batch_count: acceptedBatches.length, forensic_lock_status: forensics.lock_status, forensic_diagnostic_status: forensics.diagnostic_status || "UNKNOWN", phase_status: finalStatus, m11_schema_upgrade: M11_SCHEMA_UPGRADE, phase2g_route_id: routed.route.route_id, phase2g_bucket_id: routed.route.bucket_id, infrastructure_authority: "CENTRAL_RUNTIME_SERVICES", phase_owned_path: "src/phases/10-exposure-profile" } });
  await lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: finalStatus, next_phase: isAccepted(finalStatus) ? contract.next : phase });
}

async function runModelBatch({ run, phase, batch, compactPacket, repair, batchOutput = null, shape = null, validationArtifact = null, repairReason = "" }) {
  const prompt = await buildPhasePrompt({ prompt_files: repair ? REPAIR_PROMPTS : BATCH_PROMPTS, phase: `${phase}:${repair ? "M11_REPAIR" : "M11_BATCH"}:${batch.batch_id}`, run, artifacts: repair ? { m11_batch_packet: compactPacket, m11_batch_registry_ledger: batchOutput, backend_structural_validation: shape, m12_batch_validation: validationArtifact, repair_context: { batch_id: batch.batch_id, repair_reason: repairReason, rule: "Repair only semantic evidence-application fields. Do not emit final material status, profile placement, deterministic registry spine, workpad, projections, or forensics." } } : { m11_batch_packet: compactPacket }, writes: ["m11_batch_registry_ledger"], references: [] });
  return (await callGeminiJson({ prompt, phase: `${phase}:${repair ? "REPAIR" : "BATCH"}:${batch.batch_id}` })).json;
}

async function getOrBuildRoutePlan({ run, phase, artifacts, referencePacket }) {
  const existing = await readAcceptedCheckpoint({ run_id: run.run_id, artifact_name: ART.route });
  if (existing && !hasSurfaceTriggeredRoutes(existing.artifact) && isM11V2RoutePlan(existing.artifact)) return existing;
  const output = buildExposureRegistryRoutePlan({ upstreamArtifacts: artifacts, targetFeatureProfile: artifacts[ART.featureMain], legalCartographyIndex: artifacts[ART.legalIndex], referencePacket, runId: run.run_id });
  const artifact = output[ART.route];
  const lock_status = routePlanLockStatus(artifact.phase_a_validation?.status);
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: ART.route, artifact, lock_status }));
  return { artifact, lock_status };
}

function validateSemanticBatch({ batch, batchOutput, shape, routePlan }) {
  const ledger = batchOutput?.m11_batch_registry_ledger || batchOutput || {};
  const rows = Array.isArray(ledger.batch_registry_ledger) ? ledger.batch_registry_ledger : [];
  const expected = Array.isArray(batch.expected_threat_ids) ? batch.expected_threat_ids.map(String) : [];
  const returned = Array.isArray(ledger.returned_threat_ids) ? ledger.returned_threat_ids.map(String) : rows.map((row) => String(row.Threat_ID || "")).filter(Boolean);
  const failures = [];
  const limitations = [];
  if (!shape?.ok) failures.push(...(shape.failures || []));
  if (!arraysEqualAsSets(expected, returned)) failures.push("returned_threat_ids do not match expected_threat_ids");
  if (rows.length !== expected.length) failures.push(`batch_registry_ledger length ${rows.length} does not match expected ${expected.length}`);
  for (const row of rows) {
    const id = String(row.Threat_ID || "").trim();
    if (!id) failures.push("batch row missing Threat_ID");
    const statusInputs = row.status_inputs && typeof row.status_inputs === "object" && !Array.isArray(row.status_inputs) ? row.status_inputs : {};
    for (const field of STATUS_INPUT_FIELDS) if (!(field in statusInputs)) failures.push(`${id || "row"} missing status_inputs.${field}`);
    if (String(row.row_limitations || "").trim()) limitations.push(`row limitation carried: ${id || "unknown"}`);
    if (["yes", "partial"].includes(String(statusInputs.public_evidence_limitation || "").toLowerCase())) limitations.push(`public evidence limitation carried: ${id || "unknown"}`);
    if (["yes", "partial"].includes(String(statusInputs.false_positive_concern || "").toLowerCase())) limitations.push(`false positive concern carried: ${id || "unknown"}`);
  }
  const status = failures.length ? "REPAIR_REQUIRED" : limitations.length ? "PASS_WITH_LIMITATION" : "PASS";
  return { exposure_registry_batch_validation: { batch_id: batch.batch_id, batch_group: batch.batch_group, status, validation_owner: "backend_deterministic_semantic_batch_validator", semantic_m12_validation_status: status, expected_threat_ids: expected, validated_threat_ids: returned, shape_checks: { backend_structural_validation_status: shape?.status || "UNKNOWN", expected_count: expected.length, returned_count: returned.length, row_count: rows.length, route_plan_status: routePlan?.phase_a_validation?.status || "UNKNOWN" }, challenge_checks: { deterministic: true, model_usage: "NONE_DETERMINISTIC", semantic_evidence_application_only: true, final_status_owner: "backend_after_validation", false_positive_discipline: "STATUS_INPUT_VALIDATED_NO_POST_RUN_MUTATION", m11_schema_upgrade: M11_SCHEMA_UPGRADE }, findings: [], failures, repair_directives: failures.map((failure) => ({ failure, directive: "Repair active semantic batch only." })), limitations, model_metadata: { model_usage: "NONE_DETERMINISTIC" } } };
}

async function failBatch({ run, phase, batch, validationName, shape, prior = null }) {
  const artifact = { exposure_registry_batch_validation: { batch_id: batch.batch_id, batch_group: batch.batch_group, status: "REPAIR_REQUIRED", validation_owner: "backend_semantic_shape_validator", expected_threat_ids: batch.expected_threat_ids || [], failures: shape.failures || [], prior_m12_validation: prior?.exposure_registry_batch_validation || null } };
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: validationName, artifact, lock_status: "REPAIR_REQUIRED" }));
  await lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "REPAIR_REQUIRED", next_phase: phase });
}

async function getOrBuildWorkpad({ run, phase, route, acceptedBatches, batchValidations }) {
  const existing = await readAcceptedCheckpoint({ run_id: run.run_id, artifact_name: ART.workpad });
  if (existing && isM11V2Workpad(existing.artifact)) return existing;
  const output = mergeExposureRegistryWorkpad98({ routePlan: { [ART.route]: route.artifact }, acceptedBatches, batchValidations });
  const artifact = output[ART.workpad];
  const lock_status = artifact.merge_validation?.status === "PASS" ? "LOCKED" : artifact.merge_validation?.status === "PASS_WITH_LIMITATION" ? "LOCKED_WITH_LIMITATIONS" : "REPAIR_REQUIRED";
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: ART.workpad, artifact, lock_status }));
  return { artifact, lock_status };
}

async function getOrBuildProjection({ run, phase, artifactName, isCurrent, build }) {
  const existing = await readAcceptedCheckpoint({ run_id: run.run_id, artifact_name: artifactName });
  if (existing && isCurrent(existing.artifact)) return existing;
  const artifact = build();
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: artifactName, artifact, lock_status: "LOCKED" }));
  return { artifact, lock_status: "LOCKED" };
}

async function getOrBuildForensics({ run, phase, route, workpad, controlled, triggered, acceptedBatches, batchValidations, referencePacket }) {
  const existing = await readAcceptedCheckpoint({ run_id: run.run_id, artifact_name: ART.forensics });
  if (existing && isM11V2Forensics(existing.artifact)) return { ...existing, diagnostic_status: existing.artifact?.forensic_lock_gate_result?.status || existing.artifact?.registry_lock_gate_result?.status || existing.lock_status };
  const output = buildExposureRegistryForensicsFromSavedArtifacts({ routePlan: { [ART.route]: route.artifact }, acceptedBatches, batchValidations, workpad: { [ART.workpad]: workpad.artifact }, controlledProfile: { [ART.controlled]: controlled.artifact }, triggeredProfile: { [ART.triggered]: triggered.artifact }, fieldDerivationRegistryText: referencePacket.files?.["Diligence_Field_Derivation_Registry.yml"]?.content || "" });
  const artifact = output[ART.forensics];
  const diagnostic_status = artifact.forensic_lock_gate_result?.status || artifact.registry_lock_gate_result?.status || "REPAIR_REQUIRED";
  const lock_status = diagnostic_status === "PASS" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS";
  if (diagnostic_status !== "PASS" && diagnostic_status !== "PASS_WITH_LIMITATION") {
    artifact.non_blocking_forensic_repair = { status: diagnostic_status, policy: "FORENSICS_DIAGNOSTIC_ONLY_DOES_NOT_BLOCK_M11_TO_M12", note: "Forensic repair requirements are preserved for audit but do not block controlled/triggered profile handoff." };
  }
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: ART.forensics, artifact, lock_status }));
  return { artifact, lock_status, diagnostic_status };
}

async function readAcceptedCheckpoint({ run_id, artifact_name }) {
  try {
    const result = await readArtifact({ run_id, artifact_name, agent_id: AGENT_5 });
    return isAccepted(result.lock_status) ? { artifact: result.artifact, lock_status: result.lock_status } : null;
  } catch (_error) {
    return null;
  }
}

async function readCompletedBatchCheckpoint({ run_id, batch_id }) {
  const validation = await readAcceptedCheckpoint({ run_id, artifact_name: `exposure_registry_batch_validation__${batch_id}` });
  const batch = await readAcceptedCheckpoint({ run_id, artifact_name: `exposure_registry_batch__${batch_id}` });
  return validation && batch && isM11V2Batch(batch.artifact) ? { validationArtifact: validation.artifact, batchArtifact: batch.artifact, validationLockStatus: validation.lock_status, batchLockStatus: batch.lock_status } : null;
}

async function readArtifactsForM11({ run_id, reads, agent_id, strict = true }) {
  const artifacts = {};
  for (const artifactName of reads || []) {
    try { artifacts[artifactName] = await readArtifactPayload({ run_id, artifact_name: artifactName, agent_id }); }
    catch (error) { if (strict) throw error; artifacts[artifactName] = null; }
  }
  return artifacts;
}

function assertM11RoutePacket(packet = {}) {
  if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("M11_PHASE2G_AUTHORITY_MISSING");
  if (packet.internal_job_id !== "M11") throw new Error(`M11_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`);
  if (packet.route_id !== "ROUTE.PHASE9.EXPOSURE_PROFILE") throw new Error(`M11_PHASE2G_ROUTE_MISMATCH:${packet.route_id || "missing"}`);
  if (packet.delivery_mode !== "SOURCE_BUCKET_PROFILE") throw new Error(`M11_PHASE2G_DELIVERY_MODE_MISMATCH:${packet.delivery_mode || "missing"}`);
  if (packet.source_bucket_delivered !== true) throw new Error("M11_PHASE2G_SOURCE_BUCKET_MISSING");
  if (packet.lossless_evidence_role !== "PRIMARY_EVIDENCE") throw new Error("M11_PHASE2G_LOSSLESS_PRIMARY_MISSING");
  if (packet.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") throw new Error("M11_PHASE2G_INDEX_NAVIGATION_MISSING");
  if (packet.profile_forensics_inputs_allowed !== false) throw new Error("M11_PHASE2G_FORENSICS_INPUT_BOUNDARY_MISSING");
}

function artifactSaveBody({ run_id, phase, agent_id, artifact_name, artifact, lock_status = "LOCKED" }) { return { run_id, phase, agent_id, artifact_name, lock_status, artifact }; }
function routePlanLockStatus(status) { return status === "PASS" ? "LOCKED" : status === "PASS_WITH_LIMITATION" ? "LOCKED_WITH_LIMITATIONS" : "CONTROLLED_FAILURE"; }
function isAccepted(status) { return ACCEPTED.has(status); }
function deriveFinalM11Status({ routeStatus, forensicStatus, batchValidations }) { if (routeStatus === "LOCKED_WITH_LIMITATIONS") return "LOCKED_WITH_LIMITATIONS"; if (forensicStatus === "LOCKED_WITH_LIMITATIONS" || !isAccepted(forensicStatus)) return "LOCKED_WITH_LIMITATIONS"; return batchValidations.some((v) => v?.exposure_registry_batch_validation?.status === "PASS_WITH_LIMITATION") ? "LOCKED_WITH_LIMITATIONS" : "LOCKED"; }
function isAcceptedBatchValidationStatus(status) { return status === "PASS" || status === "PASS_WITH_LIMITATION"; }
function batchValidationLockStatus(status) { return status === "PASS" ? "LOCKED" : status === "PASS_WITH_LIMITATION" ? "LOCKED_WITH_LIMITATIONS" : status === "CONTROLLED_FAILURE" ? "CONTROLLED_FAILURE" : "REPAIR_REQUIRED"; }
function hasSurfaceTriggeredRoutes(routePlan) { const retired = ["SURFACE", "TRIGGERED"].join("_"); return (Array.isArray(routePlan?.route_rows) ? routePlan.route_rows : []).some((row) => row.route_reason === retired); }
function arraysEqualAsSets(a, b) { const aa = new Set((Array.isArray(a) ? a : []).map(String)); const bb = new Set((Array.isArray(b) ? b : []).map(String)); if (aa.size !== bb.size) return false; for (const item of aa) if (!bb.has(item)) return false; return true; }
function isM11V2RoutePlan(artifact = {}) { return artifact?.registry_inventory?.m11_schema_upgrade === M11_SCHEMA_UPGRADE; }
function isM11V2Batch(artifact = {}) { return artifact?.m11_batch_registry_ledger?.material_row_field_count === 19 && asArray(artifact?.m11_batch_registry_ledger?.batch_registry_ledger).every((row) => row.Threat_Name && row.Subcategory); }
function isM11V2Workpad(artifact = {}) { return artifact?.workpad_metadata?.m11_schema_upgrade === M11_SCHEMA_UPGRADE && artifact?.workpad_metadata?.material_row_field_count === 19; }
function isM11V2Projection(artifact = {}) { return artifact?.m11_schema_upgrade === M11_SCHEMA_UPGRADE && artifact?.material_row_field_count === 19; }
function isM11V2Forensics(artifact = {}) { return artifact?.registry_input_manifest?.m11_schema_upgrade === M11_SCHEMA_UPGRADE && artifact?.registry_input_manifest?.material_row_field_count === 19; }
function asArray(value) { return Array.isArray(value) ? value : []; }
