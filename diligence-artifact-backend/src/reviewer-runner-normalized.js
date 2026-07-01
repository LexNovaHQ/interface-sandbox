import { getRunRecord, updateRunRecord, logEvent } from "./firestore.js";
import { updateRunDashboardRow } from "./sheets.js";
import { getPhaseContract } from "./phase-contracts.js";
import { advanceReviewerRun as advanceLegacyReviewerRun } from "./reviewer-runner.js";
import { compileFinalOutputHandoff } from "./compiler.js";
import { buildRendererPayload } from "./report-renderer.js";
import { buildQualifiedReviewSystemArtifacts } from "./qualified-review-system/branch.js";
import { buildFeatureCandidateInventoryIndex, validateFeatureCandidateInventoryIndex } from "./m8-feature-candidate-inventory-index.js";
import { artifactSaveBody, buildReportUrl, lockPhase, readArtifactPayload, saveArtifact } from "./artifact-service.js";
import { readPhaseArtifactWithResolvedLosslessFamilies } from "./lossless-family-resolver.js";

const ART = Object.freeze({ final: "final_output_handoff", renderer: "renderer_payload", exposureRoutePlan: "exposure_registry_route_plan", qrHandoff: "qualified_review_handoff", qrRenderer: "qualified_review_renderer_payload", featureCandidateInventory: "feature_candidate_inventory" });
const QR_ACTOR = "qualified_review_system";

export async function advanceReviewerRun({ run_id }) {
  const run = await getRunRecord(run_id);
  if (run.current_phase === "COMPLETE" || run.status === "COMPLETE") return { ok: true, run_id, status: "COMPLETE", current_phase: "COMPLETE", advanced: false };
  const phase = normalizePhase(run.current_phase);
  if (phase !== run.current_phase) await updateRunRecord(run_id, { current_phase: phase });
  if (!["M8_FEATURE_CANDIDATE_INVENTORY", "NORMALIZED_COMPILER", "RENDERER"].includes(phase)) return advanceLegacyReviewerRun({ run_id });
  const contract = getPhaseContract(phase);
  await markRunning(run_id, phase, contract.actor_id);
  try {
    if (phase === "M8_FEATURE_CANDIDATE_INVENTORY") await runM8FeatureCandidateInventoryPhase({ run: { ...run, current_phase: phase }, phase, contract });
    else if (phase === "NORMALIZED_COMPILER") await runNormalizedCompilerPhase({ run: { ...run, current_phase: phase }, phase, contract });
    else await runRendererPhase({ run: { ...run, current_phase: phase }, phase, contract });
  } catch (error) {
    await markPhaseFailure({ run_id, phase, actor: contract.actor_id, error });
    throw error;
  }
  const updated = await getRunRecord(run_id);
  return { ok: true, run_id, advanced: true, completed_phase: phase, status: updated.status, current_phase: updated.current_phase, final_report_url: updated.final_report_url || "" };
}

function normalizePhase(value) {
  if (value === "COMPILER") return "NORMALIZED_COMPILER";
  return value;
}

async function runM8FeatureCandidateInventoryPhase({ run, phase, contract }) {
  const artifacts = await readResolvedArtifacts({ run_id: run.run_id, reads: contract.reads || [], agent_id: contract.actor_id, strict: true });
  const productArtifacts = Object.entries(artifacts).filter(([name]) => name.startsWith("lossless_family__")).map(([, artifact]) => artifact);
  const inventory = buildFeatureCandidateInventoryIndex(productArtifacts, { runId: run.run_id });
  const validation = validateFeatureCandidateInventoryIndex(inventory);
  if (validation.status !== "PASS") throw new Error(`M8_FEATURE_CANDIDATE_INVENTORY_VALIDATION_FAILED:${JSON.stringify(validation)}`);
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: contract.actor_id, artifact_name: ART.featureCandidateInventory, artifact: inventory, lock_status: "LOCKED" }));
  await logEvent({ run_id: run.run_id, event_type: "M8_FEATURE_CANDIDATE_INVENTORY_COMPLETED", actor: contract.actor_id, payload: { phase, raw_hit_count: inventory.raw_hit_count, canonical_candidate_count: inventory.canonical_candidate_count, source_families_indexed: inventory.source_families_indexed || [], derivation_mode: inventory.derivation_mode, shard_resolution_mandatory: true } });
  await lockPhase({ run_id: run.run_id, phase, agent_id: contract.actor_id, status: "LOCKED", next_phase: contract.next });
}

async function runNormalizedCompilerPhase({ run, phase, contract }) {
  const artifacts = await readArtifactsForCompiler({ run_id: run.run_id, reads: contract.reads, agent_id: contract.actor_id });
  const output = compileFinalOutputHandoff({ run, artifacts });
  const final = output[ART.final];
  const phaseLockStatus = normalizeCompilerLockStatus(final?.validation_status);
  const saved = [];
  for (const artifactName of contract.writes) {
    const artifact = output?.[artifactName];
    if (!artifact || typeof artifact !== "object") throw new Error(`DETERMINISTIC_OUTPUT_MISSING_ARTIFACT:${phase}:${artifactName}`);
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: contract.actor_id, artifact_name: artifactName, artifact, lock_status: phaseLockStatus }));
    saved.push(artifactName);
  }
  const qrSaved = await runQualifiedReviewBranch({ run, normalizedOutput: output, sourceArtifacts: artifacts, lockStatus: phaseLockStatus });
  await logEvent({ run_id: run.run_id, event_type: "NORMALIZED_COMPILER_PHASE_COMPLETED", actor: contract.actor_id, payload: { phase, writes: contract.writes, saved_artifacts: saved, qualified_review_branch_saved_artifacts: qrSaved, lock_status: phaseLockStatus, normalized_section_artifacts_saved: saved.filter((name) => name.startsWith("normalized_section__")), normalized_section_artifact_save_count: saved.filter((name) => name.startsWith("normalized_section__")).length, legacy_compiler_phase_retired: true, qualified_review_branch_separate: true, lossless_family_shards_resolved: true } });
  await lockPhase({ run_id: run.run_id, phase, agent_id: contract.actor_id, status: phaseLockStatus, next_phase: ["LOCKED", "LOCKED_WITH_LIMITATIONS"].includes(phaseLockStatus) ? contract.next : phase });
}

async function runQualifiedReviewBranch({ run, normalizedOutput, sourceArtifacts, lockStatus }) {
  const qrOutput = buildQualifiedReviewSystemArtifacts({ run, normalized_compiler_output: normalizedOutput, source_artifacts: sourceArtifacts });
  const saved = [];
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: "QUALIFIED_REVIEW_HANDOFF", agent_id: QR_ACTOR, artifact_name: ART.qrHandoff, artifact: qrOutput[ART.qrHandoff], lock_status: lockStatus }));
  saved.push(ART.qrHandoff);
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: "QUALIFIED_REVIEW_RENDERER", agent_id: QR_ACTOR, artifact_name: ART.qrRenderer, artifact: qrOutput[ART.qrRenderer], lock_status: lockStatus }));
  saved.push(ART.qrRenderer);
  await logEvent({ run_id: run.run_id, event_type: "QUALIFIED_REVIEW_BRANCH_COMPLETED", actor: QR_ACTOR, payload: { saved_artifacts: saved, source_phase: "NORMALIZED_COMPILER", lock_status: lockStatus } });
  return saved;
}

function normalizeCompilerLockStatus(status) {
  if (status === "LOCKED") return "LOCKED";
  if (status === "LOCKED_WITH_LIMITATIONS") return "LOCKED_WITH_LIMITATIONS";
  return "CONTROLLED_FAILURE";
}

async function runRendererPhase({ run, phase, contract }) {
  const bundle = {};
  for (const artifactName of contract.reads) bundle[artifactName] = await readArtifactPayload({ run_id: run.run_id, artifact_name: artifactName, agent_id: contract.actor_id });
  const output = buildRendererPayload({ run, final_output_handoff: bundle });
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: contract.actor_id, artifact_name: ART.renderer, artifact: output[ART.renderer], lock_status: "COMPLETE" }));
  const finalReportUrl = buildReportUrl(run.run_id);
  await lockPhase({ run_id: run.run_id, phase, agent_id: contract.actor_id, status: "COMPLETE", next_phase: contract.next, final_report_url: finalReportUrl });
}

async function readArtifactsForCompiler({ run_id, reads, agent_id }) {
  const artifacts = await readResolvedArtifacts({ run_id, reads, agent_id, strict: false });
  artifacts.normalized_compiler_missing_static_artifacts = Object.entries(artifacts).filter(([, value]) => value === null).map(([name]) => name);
  return loadDynamicM11Artifacts({ run_id, agent_id, artifacts, manifestKey: "normalized_compiler_dynamic_artifact_manifest" });
}

async function readResolvedArtifacts({ run_id, reads, agent_id, strict }) {
  const artifacts = {};
  const cache = {};
  for (const artifactName of reads || []) {
    try {
      artifacts[artifactName] = await readPhaseArtifactWithResolvedLosslessFamilies({ run_id, artifact_name: artifactName, agent_id, cache });
      if (artifactName === "source_family_index") cache.source_family_index = artifacts[artifactName];
    } catch (error) {
      if (strict) throw error;
      artifacts[artifactName] = null;
    }
  }
  return artifacts;
}

async function loadDynamicM11Artifacts({ run_id, agent_id, artifacts, manifestKey }) {
  const routePlan = artifacts[ART.exposureRoutePlan]?.exposure_registry_route_plan || artifacts[ART.exposureRoutePlan] || {};
  const batchPlan = Array.isArray(routePlan.batch_plan) ? routePlan.batch_plan : [];
  const m11BatchArtifacts = [];
  const m12BatchValidationArtifacts = [];
  const missingBatchArtifacts = [];
  const missingBatchValidationArtifacts = [];
  for (const batch of batchPlan) {
    if (!batch?.batch_id) continue;
    const batchArtifactName = `exposure_registry_batch__${batch.batch_id}`;
    const validationArtifactName = `exposure_registry_batch_validation__${batch.batch_id}`;
    try { m11BatchArtifacts.push({ batch_id: batch.batch_id, artifact_name: batchArtifactName, artifact: await readArtifactPayload({ run_id, artifact_name: batchArtifactName, agent_id }) }); }
    catch (_error) { missingBatchArtifacts.push(batchArtifactName); }
    try { m12BatchValidationArtifacts.push({ batch_id: batch.batch_id, artifact_name: validationArtifactName, artifact: await readArtifactPayload({ run_id, artifact_name: validationArtifactName, agent_id }) }); }
    catch (_error) { missingBatchValidationArtifacts.push(validationArtifactName); }
  }
  artifacts.m11_batch_artifacts = m11BatchArtifacts;
  artifacts.m12_batch_validation_artifacts = m12BatchValidationArtifacts;
  artifacts[manifestKey] = { batch_count: batchPlan.length, loaded_batch_artifacts: m11BatchArtifacts.length, loaded_batch_validation_artifacts: m12BatchValidationArtifacts.length, missing_batch_artifacts: missingBatchArtifacts, missing_batch_validation_artifacts: missingBatchValidationArtifacts, batch_ids: batchPlan.map((batch) => batch.batch_id).filter(Boolean) };
  return artifacts;
}

async function markRunning(runId, phase, actor) {
  const updated = await updateRunRecord(runId, { current_phase: phase, status: "RUNNING" });
  await updateRunDashboardRow(updated);
  await logEvent({ run_id: runId, event_type: "PHASE_RUNNING", actor, payload: { phase } });
}

async function markPhaseFailure({ run_id, phase, actor, error }) {
  const updated = await updateRunRecord(run_id, { current_phase: phase, status: "REPAIR_REQUIRED" });
  await updateRunDashboardRow(updated);
  await logEvent({ run_id, event_type: "PHASE_REPAIR_REQUIRED", actor, payload: { phase, error_message: error?.message || String(error) } });
}
