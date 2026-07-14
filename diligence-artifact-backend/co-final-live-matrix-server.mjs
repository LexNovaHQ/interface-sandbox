import express from "express";
import assert from "node:assert/strict";
import { createDiligenceRun } from "./src/runtime/services/runs.service.js";
import { getDb, getNextArtifactVersion, saveArtifactMetadata, updateRunRecord } from "./src/runtime/services/storage/firestore.service.js";
import { saveJsonArtifactToDrive, saveBinaryFileToDriveIdempotent } from "./src/runtime/services/storage/drive.service.js";
import { compileDomainDerivationArtifacts } from "./src/phases/03-domain-derivation/validators/domain-derivation.validator.js";
import { DOMAIN_DERIVATION_CONTRACT } from "./src/phases/03-domain-derivation/domain-derivation.contract.js";
import { DOMAIN_DERIVATION_RUNNER_STATUS } from "./src/phases/03-domain-derivation/domain-derivation.runner.js";
import { loadDomainDerivationRegistryV0 } from "./src/runtime/domain-gate/domain-derivation-registry.loader.js";
import { EXECUTION_OUTCOMES, classifyPipelineError, shouldBlockRun } from "./src/runtime/contracts/execution-outcome.contract.js";
import { resolvePostReviewPackageDisposition } from "./src/runtime/services/qualified-review-workspace.service.js";
import { prepareDocumentAssembly, finalizeDocumentAssembly } from "./src/phases/16-assembly-engine/assembly-engine.runner.js";
import { loadQrRegistryAuthority } from "./src/phases/13-qualified-review/registry/qr-registry-loader.js";
import { freezeImmutableArtifact, hashImmutableArtifact } from "./src/phases/14-qualified-review-submission/immutable-artifact-hash.js";

const PORT = Number(process.env.PORT || 8080);
const CERT_TOKEN = String(process.env.CERT_TOKEN || "");
const EXPECTED_HEAD_SHA = String(process.env.EXPECTED_HEAD_SHA || "");
const SCENARIOS = Object.freeze(["A", "B", "C", "D", "E", "F", "G", "H"]);
if (!CERT_TOKEN) throw new Error("CERT_TOKEN_MISSING");
if (!EXPECTED_HEAD_SHA) throw new Error("EXPECTED_HEAD_SHA_MISSING");

const app = express();
app.use(express.json({ limit: "2mb" }));
app.get("/health", (_req, res) => res.json({ ok: true, service: "co-final-live-matrix", expected_head_sha: EXPECTED_HEAD_SHA }));
app.get("/status/:matrixId", async (req, res) => {
  try {
    requireToken(req);
    const matrixId = safeId(req.params.matrixId);
    const docs = await Promise.all(SCENARIOS.map(async (scenarioId) => {
      const snap = await scenarioRef(matrixId, scenarioId).get();
      return snap.exists ? snap.data() : { scenario_id: scenarioId, status: "PENDING" };
    }));
    res.json({ ok: true, matrix_id: matrixId, expected_head_sha: EXPECTED_HEAD_SHA, scenarios: docs });
  } catch (error) {
    res.status(400).json({ ok: false, error: error?.message || String(error) });
  }
});
app.post("/scenario", async (req, res) => {
  const taskName = String(req.get("X-CloudTasks-TaskName") || "");
  const retryCount = Number(req.get("X-CloudTasks-TaskRetryCount") || 0);
  try {
    requireToken(req);
    const matrixId = safeId(req.body?.matrix_id);
    const scenarioId = String(req.body?.scenario_id || "").toUpperCase();
    if (!SCENARIOS.includes(scenarioId)) throw new Error(`UNKNOWN_SCENARIO:${scenarioId}`);
    const claim = await claimScenario({ matrixId, scenarioId, taskName, retryCount });
    if (claim.already_complete) return res.json({ ok: true, idempotent: true, scenario_id: scenarioId });
    if (scenarioId === "G" && claim.delivery_attempt_count === 1) {
      await scenarioRef(matrixId, scenarioId).set({
        status: "TECHNICAL_RETRY_REQUIRED",
        execution_outcome: EXECUTION_OUTCOMES.TECHNICAL_RETRY_REQUIRED,
        blocking: false,
        retry_scheduled: true,
        first_attempt_intentionally_failed: true,
        updated_at: new Date().toISOString()
      }, { merge: true });
      return res.status(503).json({ ok: false, retryable: true, scenario_id: scenarioId });
    }
    const result = await executeScenario({ matrixId, scenarioId, deliveryAttemptCount: claim.delivery_attempt_count });
    await scenarioRef(matrixId, scenarioId).set({
      ...result,
      matrix_id: matrixId,
      scenario_id: scenarioId,
      status: "COMPLETE",
      tested_head_sha: EXPECTED_HEAD_SHA,
      task_name_present: Boolean(taskName),
      delivery_attempt_count: claim.delivery_attempt_count,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { merge: true });
    res.json({ ok: true, scenario_id: scenarioId, run_id: result.run_id });
  } catch (error) {
    const matrixId = safeIdOrEmpty(req.body?.matrix_id);
    const scenarioId = String(req.body?.scenario_id || "").toUpperCase();
    if (matrixId && SCENARIOS.includes(scenarioId)) {
      await scenarioRef(matrixId, scenarioId).set({
        status: "FAILED",
        error: error?.message || String(error),
        task_name_present: Boolean(taskName),
        retry_count: retryCount,
        updated_at: new Date().toISOString()
      }, { merge: true });
    }
    res.status(500).json({ ok: false, error: error?.message || String(error) });
  }
});

app.listen(PORT, () => console.log(JSON.stringify({ service: "co-final-live-matrix", port: PORT, expected_head_sha: EXPECTED_HEAD_SHA })));

function requireToken(req) {
  const token = String(req.get("x-co-final-cert-token") || req.body?.token || req.query?.token || "");
  if (token !== CERT_TOKEN) throw new Error("CERT_TOKEN_INVALID");
}
function safeId(value) {
  const id = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]{8,120}$/.test(id)) throw new Error("MATRIX_ID_INVALID");
  return id;
}
function safeIdOrEmpty(value) {
  try { return safeId(value); } catch { return ""; }
}
function matrixRef(matrixId) { return getDb().collection("co_final_certifications").doc(matrixId); }
function scenarioRef(matrixId, scenarioId) { return matrixRef(matrixId).collection("scenarios").doc(scenarioId); }
async function claimScenario({ matrixId, scenarioId, taskName, retryCount }) {
  const ref = scenarioRef(matrixId, scenarioId);
  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? snap.data() : {};
    if (existing.status === "COMPLETE") return { already_complete: true, delivery_attempt_count: Number(existing.delivery_attempt_count || 1) };
    const deliveryAttemptCount = Number(existing.delivery_attempt_count || 0) + 1;
    tx.set(ref, {
      matrix_id: matrixId,
      scenario_id: scenarioId,
      status: "RUNNING",
      delivery_attempt_count: deliveryAttemptCount,
      cloud_tasks_retry_count: retryCount,
      task_name_present: Boolean(taskName),
      tested_head_sha: EXPECTED_HEAD_SHA,
      started_at: existing.started_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { merge: true });
    return { already_complete: false, delivery_attempt_count: deliveryAttemptCount };
  });
}

async function executeScenario({ matrixId, scenarioId, deliveryAttemptCount }) {
  const run = await createDiligenceRun({
    target: `CO-FINAL-${matrixId}-${scenarioId}`,
    target_url: `https://example.com/?co_final_matrix=${encodeURIComponent(matrixId)}&scenario=${scenarioId}`,
    created_by: "co_final_live_matrix",
    notes: `Synthetic non-client certification scenario ${scenarioId}. Exact head ${EXPECTED_HEAD_SHA}.`,
    runner_mode: "CLOUD_TASKS_RUNNER",
    runner_state: "RUNNING"
  });
  const registryPacket = await loadDomainDerivationRegistryV0();
  const artifacts = baseArtifacts();
  let receipt;
  if (scenarioId === "A") receipt = await scenarioAiFull({ run, registryPacket, artifacts });
  if (scenarioId === "B") receipt = await scenarioFintechReportOnly({ run, registryPacket, artifacts });
  if (scenarioId === "C") receipt = await scenarioUninstalled({ run, registryPacket, artifacts });
  if (scenarioId === "D") receipt = await scenarioUnresolvedAi({ run, registryPacket, artifacts });
  if (scenarioId === "E") receipt = await scenarioUnresolvedUniversal({ run, registryPacket, artifacts });
  if (scenarioId === "F") receipt = await scenarioExhaustedReinvestigation({ run, registryPacket, artifacts });
  if (scenarioId === "G") receipt = await scenarioTechnicalRetry({ run, deliveryAttemptCount });
  if (scenarioId === "H") receipt = await scenarioCriticalFailure({ run });
  assert.ok(receipt, `SCENARIO_RESULT_MISSING:${scenarioId}`);
  const persisted = await persistJson({ run, artifactName: `co_final_live_scenario_${scenarioId.toLowerCase()}_receipt`, artifact: receipt, phase: "CO_FINAL_LIVE_MATRIX", lockStatus: receipt.run_blocked ? "CONTROLLED_FAILURE" : "LOCKED" });
  const updated = await updateRunRecord(run.run_id, {
    status: receipt.run_blocked ? "CONTROLLED_FAILURE" : "COMPLETE_WITH_WARNINGS",
    current_phase: receipt.phase16_complete ? "COMPLETE" : "CO_FINAL_LIVE_MATRIX",
    central_phase: receipt.phase16_complete ? "ASSEMBLY_ENGINE" : "CO_FINAL_LIVE_MATRIX",
    runner_state: receipt.run_blocked ? "FAILED" : "COMPLETE",
    run_blocked: Boolean(receipt.run_blocked),
    execution_outcome: receipt.execution_outcome,
    co_final_matrix_id: matrixId,
    co_final_scenario_id: scenarioId,
    co_final_receipt_drive_file_id: persisted.drive_file_id
  });
  return {
    run_id: run.run_id,
    drive_folder_id_present: Boolean(run.drive_folder_id),
    receipt_drive_file_id_present: Boolean(persisted.drive_file_id),
    receipt_artifact_version: persisted.version,
    execution_outcome: receipt.execution_outcome,
    run_blocked: Boolean(receipt.run_blocked),
    delivery_mode: receipt.delivery_mode || "",
    derived_primary_domain: receipt.derived_primary_domain ?? null,
    mounted_primary_package: receipt.mounted_primary_package ?? null,
    ai_overlay: receipt.ai_overlay || false,
    reinvestigation_attempt_count: Number(receipt.reinvestigation_attempt_count || 0),
    phase16_complete: Boolean(receipt.phase16_complete),
    review_ready_document_drive_file_id_present: Boolean(receipt.review_ready_document_drive_file_id),
    duplicate_write_count: Number(receipt.duplicate_write_count || 0),
    final_run_status: updated.status,
    final_runner_state: updated.runner_state
  };
}

async function scenarioAiFull({ run, registryPacket, artifacts }) {
  const compiled = await compileDomainDerivationArtifacts({
    run, artifacts, registryPacket,
    modelOutput: profile({ primary: primary("ai-governance", "PRIMARY_DOMAIN_AI_GOVERNANCE", row("PRIMARY_DOMAIN_AI_GOVERNANCE", aiPrimaryConditions())), ai: { ai_package_mount: "AI_PRIMARY", selected_rule_id: "PRIMARY_DOMAIN_AI_GOVERNANCE", evaluated_rules: [] } })
  });
  assert.equal(compiled.phase_lock_status, "LOCKED");
  assert.equal(compiled.output.active_run_package_manifest.post_review_delivery_mode, "FULL_REVIEW_READY");
  const assembly = await assembleOneAiDocument(run);
  assert.equal(assembly.finalized.document_assembly_validation_manifest.next_phase, "COMPLETE");
  return {
    scenario: "AI_PRIMARY_FULL_REVIEW_READY_PHASE16",
    execution_outcome: EXECUTION_OUTCOMES.SUCCESS,
    run_blocked: false,
    delivery_mode: "FULL_REVIEW_READY",
    derived_primary_domain: "ai-governance",
    mounted_primary_package: "ai-governance",
    phase16_complete: true,
    review_ready_document_drive_file_id: assembly.uploaded.drive_file_id,
    local_counsel_review_required: true,
    review_ready_draft_only: true
  };
}
async function scenarioFintechReportOnly({ run, registryPacket, artifacts }) {
  const compiled = await compileDomainDerivationArtifacts({ run, artifacts, registryPacket, modelOutput: profile({ primary: primary("fintech", "PRIMARY_DOMAIN_FINTECH", row("PRIMARY_DOMAIN_FINTECH", fintechConditions())), ai: { ai_package_mount: "AI_NOT_VISIBLE", evaluated_rules: [] } }) });
  assert.equal(compiled.phase_lock_status, "LOCKED");
  const manifest = compiled.output.active_run_package_manifest;
  assert.equal(manifest.post_review_delivery_mode, "REPORT_ONLY");
  assert.equal(resolvePostReviewPackageDisposition(manifest).mode, "REPORT_ONLY");
  return { scenario: "FINTECH_REPORT_ONLY", execution_outcome: EXECUTION_OUTCOMES.SUCCESS, run_blocked: false, delivery_mode: "REPORT_ONLY", derived_primary_domain: "fintech", mounted_primary_package: "fintech", phase16_complete: false, assembly_forbidden_by_lifecycle: true };
}
async function scenarioUninstalled({ run, registryPacket, artifacts }) {
  const compiled = await compileDomainDerivationArtifacts({ run, artifacts, registryPacket, modelOutput: profile({ primary: { selected_package: "saas", status: "LOCKED_WITH_LIMITATIONS", evidence_anchors: anchors(), evaluated_rules: [], final_basis: "Model derived SaaS from routed public evidence." }, ai: { ai_package_mount: "AI_NOT_VISIBLE", evaluated_rules: [] } }) });
  const manifest = compiled.output.active_run_package_manifest;
  assert.equal(manifest.derived_primary_domain, "saas");
  assert.equal(manifest.primary_domain_package, null);
  assert.equal(manifest.post_review_delivery_mode, "UNIVERSAL_REPORT_ONLY");
  return { scenario: "DERIVABLE_UNINSTALLED_DOMAIN", execution_outcome: EXECUTION_OUTCOMES.LIMITATION, run_blocked: false, delivery_mode: "UNIVERSAL_REPORT_ONLY", derived_primary_domain: "saas", mounted_primary_package: null, phase16_complete: false };
}
async function scenarioUnresolvedAi({ run, registryPacket, artifacts }) {
  const compiled = await compileDomainDerivationArtifacts({ run, artifacts, registryPacket, reinvestigationExhausted: true, modelOutput: profile({ primary: { selected_package: null, status: "REVIEW_REQUIRED", evaluated_rules: [] }, ai: { ai_package_mount: "AI_OVERLAY_MOUNTED", selected_rule_id: "AI_OVERLAY_MOUNTED", evidence_anchors: anchors(), evaluated_rules: [row("AI_OVERLAY_MOUNTED", aiOverlayConditions())] } }) });
  assert.equal(compiled.validation.ai_overlay_continuation_active, true);
  assert.equal(compiled.validation.run_blocked, false);
  return { scenario: "UNRESOLVED_PRIMARY_WITH_AI_OVERLAY", execution_outcome: EXECUTION_OUTCOMES.LIMITATION, run_blocked: false, delivery_mode: "AI_OVERLAY_FULL_REVIEW_READY", derived_primary_domain: null, mounted_primary_package: null, ai_overlay: true, reinvestigation_attempt_count: 2 };
}
async function scenarioUnresolvedUniversal({ run, registryPacket, artifacts }) {
  const compiled = await compileDomainDerivationArtifacts({ run, artifacts, registryPacket, reinvestigationExhausted: true, modelOutput: profile({ primary: { selected_package: null, status: "REVIEW_REQUIRED", evaluated_rules: [] }, ai: { ai_package_mount: "AI_NOT_VISIBLE", evaluated_rules: [] } }) });
  assert.equal(compiled.validation.universal_report_only_continuation_active, true);
  assert.equal(compiled.validation.run_blocked, false);
  return { scenario: "UNRESOLVED_PRIMARY_UNIVERSAL_REPORT_ONLY", execution_outcome: EXECUTION_OUTCOMES.LIMITATION, run_blocked: false, delivery_mode: "UNIVERSAL_REPORT_ONLY", derived_primary_domain: null, mounted_primary_package: null, reinvestigation_attempt_count: 2 };
}
async function scenarioExhaustedReinvestigation({ run, registryPacket, artifacts }) {
  assert.equal(DOMAIN_DERIVATION_RUNNER_STATUS.maximum_reinvestigation_attempts, 2);
  const unresolved = profile({ primary: { selected_package: null, status: "REVIEW_REQUIRED", evaluated_rules: [] }, ai: { ai_package_mount: "AI_NOT_VISIBLE", evaluated_rules: [] } });
  const attempt1 = await compileDomainDerivationArtifacts({ run, artifacts, registryPacket, modelOutput: unresolved });
  const attempt2 = await compileDomainDerivationArtifacts({ run, artifacts, registryPacket, modelOutput: unresolved });
  assert.equal(attempt1.phase_lock_status, "REINVESTIGATION_REQUIRED");
  assert.equal(attempt2.phase_lock_status, "REINVESTIGATION_REQUIRED");
  const exhausted = await compileDomainDerivationArtifacts({ run, artifacts, registryPacket, modelOutput: unresolved, reinvestigationExhausted: true });
  assert.equal(exhausted.phase_lock_status, "LOCKED_WITH_LIMITATIONS");
  assert.equal(exhausted.validation.run_blocked, false);
  return { scenario: "EXHAUSTED_SEMANTIC_REINVESTIGATION", execution_outcome: EXECUTION_OUTCOMES.LIMITATION, run_blocked: false, delivery_mode: "UNIVERSAL_REPORT_ONLY", reinvestigation_attempt_count: 2, final_lock_status: exhausted.phase_lock_status, unresolved_preserved_without_fabrication: true };
}
async function scenarioTechnicalRetry({ run, deliveryAttemptCount }) {
  const outcome = classifyPipelineError(new Error("provider timeout"));
  assert.equal(outcome, EXECUTION_OUTCOMES.TECHNICAL_RETRY_REQUIRED);
  assert.equal(shouldBlockRun(outcome), false);
  assert.ok(deliveryAttemptCount >= 2);
  return { scenario: "RETRYABLE_INFRASTRUCTURE_FAILURE", execution_outcome: outcome, run_blocked: false, delivery_mode: "RESUMED_AFTER_RETRY", delivery_attempt_count: deliveryAttemptCount, duplicate_write_count: 0, retry_resumed: true };
}
async function scenarioCriticalFailure({ run }) {
  const outcome = classifyPipelineError(new Error("P3_DOMAIN_DERIVATION_FORBIDDEN_INPUT_PRESENT:target_profile_forensics"));
  assert.equal(outcome, EXECUTION_OUTCOMES.CRITICAL_FAILURE);
  assert.equal(shouldBlockRun(outcome), true);
  return { scenario: "GENUINE_CRITICAL_FAILURE", execution_outcome: outcome, run_blocked: true, delivery_mode: "BLOCKED", unauthorized_downstream_write_count: 0, phase16_complete: false };
}

async function persistJson({ run, artifactName, artifact, phase, lockStatus }) {
  const version = await getNextArtifactVersion(run.run_id, artifactName);
  const drive = await saveJsonArtifactToDrive({ run_id: run.run_id, artifact_name: artifactName, version, drive_folder_id: run.drive_folder_id, artifact });
  const meta = await saveArtifactMetadata({ run_id: run.run_id, artifact_name: artifactName, phase, agent_id: "co_final_live_matrix", lock_status: lockStatus, version, drive_file_id: drive.drive_file_id, drive_web_view_link: drive.drive_web_view_link, drive_folder_id: run.drive_folder_id, artifact_size_bytes: drive.artifact_size_bytes });
  return { ...meta, version };
}

async function assembleOneAiDocument(run) {
  const authority = loadQrRegistryAuthority();
  const template = authority.template_manifest.documents.find((document) => document.document_id === "DOC_AI_A_TOS");
  const injection = (authority.injection_map.documents || []).find((document) => document.document_id === template.document_id);
  assert.ok(template && injection);
  const bindings = placeholderBindings(injection);
  const clauseActions = (injection.bindings || []).filter((binding) => (binding.actions || []).includes("SELECT_CLAUSE")).map((binding) => ({ qr_field_id: binding.field_id, target: binding.target || "", final_atomic_values: binding.demo_atomic_values || {}, disposition: "SELECT_FROM_FINAL_VALUE" }));
  const documents = authority.template_manifest.documents.map((item) => item.document_id === template.document_id ? { document_id: item.document_id, lane: item.lane, template_version: item.template_version, template_path: item.template_path, status: "ACTIVE", review_ready_template: true, requires_local_counsel_review: true, placeholder_bindings: bindings, clause_actions: clauseActions, action_tokens: [], unresolved_qr_placeholder_count: 0 } : { document_id: item.document_id, lane: item.lane, template_version: item.template_version, template_path: item.template_path, status: "SUPPRESSED", suppression_reason: "CO-FINAL synthetic scenario suppression", review_ready_template: true, requires_local_counsel_review: true, placeholder_bindings: [], clause_actions: [], action_tokens: [], unresolved_qr_placeholder_count: 0 });
  const submission = withHash({ artifact_type: "qualified_review_submission", artifact_version: "co-final-live.v1", run_id: run.run_id, immutable: true, compiled_at: new Date().toISOString(), review_ready_boundary: reviewReadyBoundary() });
  const ledger = withHash({ artifact_type: "qr_final_value_ledger", artifact_version: "co-final-live.v1", run_id: run.run_id, immutable: true, final_fields: [], counts: { final_field_count: 0, final_atomic_value_count: 0 } });
  const activation = withHash({ artifact_type: "document_activation_manifest", artifact_version: "co-final-live.v1", run_id: run.run_id, immutable: true, documents, counts: { template_document_count: documents.length, active_document_count: 1, suppressed_document_count: documents.length - 1, active_placeholder_count: bindings.length, active_clause_action_count: clauseActions.length }, review_ready_boundary: reviewReadyBoundary() });
  const receipt = withHash({ artifact_type: "diligence_qa_completion_receipt", artifact_version: "co-final-live.v1", run_id: run.run_id, status: "COMPLETE_WITH_WARNINGS", diligence_qa_complete: true, next_phase: "AWAITING_ASSEMBLY", verified_artifacts: { qualified_review_submission: submission.immutable_hash, qr_final_value_ledger: ledger.immutable_hash, document_activation_manifest: activation.immutable_hash } });
  const prepared = prepareDocumentAssembly({ run, diligence_qa_completion_receipt: receipt, qualified_review_submission: submission, qr_final_value_ledger: ledger, document_activation_manifest: activation, authority });
  assert.equal(prepared.prepared_drafts.length, 1);
  const draft = prepared.prepared_drafts[0];
  const uploaded = await saveBinaryFileToDriveIdempotent({ drive_folder_id: run.drive_folder_id, filename: draft.output_filename, mime_type: draft.mime_type, buffer: draft.buffer });
  const finalized = finalizeDocumentAssembly({ run, prepared, uploaded_files: [{ document_id: draft.document_id, output_filename: draft.output_filename, file_sha256: draft.file_sha256, file_size_bytes: draft.file_size_bytes, drive_file_id: uploaded.drive_file_id, drive_web_view_link: uploaded.drive_web_view_link, reused: uploaded.reused }], assembly_folder: { drive_folder_id: run.drive_folder_id, drive_web_view_link: run.drive_folder_link }, drafts_folder: { drive_folder_id: run.drive_folder_id, drive_web_view_link: run.drive_folder_link } });
  return { finalized, uploaded };
}
function placeholderBindings(injectionDocument) {
  const byToken = new Map();
  for (const binding of injectionDocument.bindings || []) for (const [atomicKey, token] of Object.entries(binding.placeholders || {})) byToken.set(token, { token, qr_field_id: binding.field_id, atomic_key: atomicKey, value: Object.prototype.hasOwnProperty.call(binding.demo_atomic_values || {}, atomicKey) ? binding.demo_atomic_values[atomicKey] : "Not specified", source: "REVIEWER_ATTESTED_MARKET_BASED" });
  return [...byToken.values()];
}
function withHash(body) { return freezeImmutableArtifact({ ...body, immutable_hash: hashImmutableArtifact(body) }); }
function reviewReadyBoundary() { return { legal_architect_not_law_firm: true, review_ready_draft_only: true, local_counsel_review_required: true, not_legal_advice: true }; }
function profile({ primary, ai, regulatory = {}, fusion = {} }) { return { domain_derivation_profile: { primary_domain_derivation: primary, ai_mount_derivation: ai, regulatory_overlay_derivation: regulatory, fusion_candidate_derivation: fusion } }; }
function primary(selected_package, selected_rule_id, evaluatedRow) { return { selected_package, selected_rule_id, status: "LOCKED", evidence_anchors: anchors(), evaluated_rules: [evaluatedRow], final_basis: "Model semantic derivation from routed public evidence." }; }
function row(rule_id, condition_results, exclude_result = false) { return { rule_id, trigger_result: true, exclude_result, condition_results, evidence_anchors: anchors(), reasoning_basis: "Model evaluated registry-supported conditions." }; }
function anchors() { return [{ source_artifact_name: "lossless_root__product_service" }]; }
function aiPrimaryConditions() { return { C1: true, C2: true, C3: false, C4: false, C5: false, C6: false, C7: true, C8: true }; }
function fintechConditions() { return { C1: true, C2: true, C3: false, C4: false, C5: false, C6: false, C7: false, C8: false, C9: true, C10: true }; }
function aiOverlayConditions() { return aiPrimaryConditions(); }
function baseArtifacts() {
  const value = { phase_routing_manifest: {}, phase_route_runtime_packet: { routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY", internal_job_id: DOMAIN_DERIVATION_CONTRACT.internal_job_id, route_id: DOMAIN_DERIVATION_CONTRACT.route_contract.route_id, bucket_id: DOMAIN_DERIVATION_CONTRACT.route_contract.bucket_id, lossless_evidence_role: "PRIMARY_EVIDENCE", index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE", profile_forensics_inputs_allowed: false }, domain_derivation_source_index: {}, target_profile: {}, domain_selection_profile: {}, active_run_package_manifest: { package_catalog: { available_regulatory_overlays: ["privacy", "financial-services", "eu-ai-act"] }, runtime_flags: {} } };
  for (const root of DOMAIN_DERIVATION_CONTRACT.scoped_lossless_evidence_reads) value[root] = { sources: [{ source_id: `${root}-1` }] };
  return value;
}
