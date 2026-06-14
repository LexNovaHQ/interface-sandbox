import { runDiligenceStage } from "../diligence/stageRunner.js";
import { buildRegistryLedgerInput } from "../diligence/adapters/registryLedgerInputAdapterV2.js";
import { buildPriorityRowPlan, mergePriorityRows, validatePriorityMerge } from "../diligence/priorityRowPlanner.js";
import { validateStage6ReviewGuardrail } from "../diligence/guardrails/stage6ReviewGuardrail.js";
import { buildStage6IntegratedHandoffArtifact } from "../diligence/stage6IntegratedHandoffBuilder.js";
import { validateDiligenceStageOutput } from "../diligence/stageSchemaValidator.js";
import {
  applyCorrections,
  asArray,
  compactRegistryLogicReference,
  countsByStatus,
  coverage,
  logStage,
  makeBatch,
  normalizeRegistryRow,
  nowIso,
  registryThreatId,
  threatId,
  validateChallengeOutput
} from "./liveRunShared.js";

export async function runStage(stageId, input, options = {}) {
  const result = await runDiligenceStage({ stageId, input, options, env: process.env });
  if (!result.ok) {
    const error = new Error(result.error || `${stageId} failed`);
    error.result = result;
    error.status = result.status || 500;
    throw error;
  }
  return result;
}

function buildStage6Input({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, runId }) {
  return {
    stage6_input_version: "stage6_live_input_v1",
    run_id: `${runId}_stage6_input`,
    source_bundle: sourceBundle,
    evidence_junction: evidenceJunction,
    company_profile: companyProfile,
    target_profile: companyProfile,
    target_feature_profile: targetFeatureProfile
  };
}

function compactValidationErrors(errors = []) {
  return asArray(errors).map((error) => `${error?.instancePath || "/"}: ${error?.message || error?.code || error?.keyword || "validation error"}`).join("; ");
}

function throwStage6IntegratedValidationError({ message, result }) {
  const error = new Error(message);
  error.status = 422;
  error.result = result;
  throw error;
}

function validateStage6IntegratedArtifact({ stage6IntegratedArtifact, stage6Input, stage6aStageResult, stage6bStageResult }) {
  const stage6Review = stage6IntegratedArtifact?.stage6_review;
  const schemaValidation = validateDiligenceStageOutput("stage6Review", stage6Review);
  if (!schemaValidation.ok) {
    throwStage6IntegratedValidationError({ message: `Stage 6 integrated handoff failed schema validation: ${compactValidationErrors(schemaValidation.errors)}`, result: { ok: false, status: 422, stage_id: "stage6_integrated_handoff", error_type: "STAGE6_INTEGRATED_SCHEMA_VALIDATION_ERROR", validation: schemaValidation, stage6_review: stage6Review || null } });
  }
  const guardrail = validateStage6ReviewGuardrail(stage6Review, { input: stage6Input, stageId: "stage6_integrated_handoff", semanticModelAttempted: stage6aStageResult?.semantic_model_attempted === true || stage6bStageResult?.semantic_model_attempted === true });
  if (!guardrail.ok) {
    throwStage6IntegratedValidationError({ message: `Stage 6 integrated handoff failed canonical guardrail validation: ${compactValidationErrors(guardrail.critical || guardrail.errors)}`, result: { ok: false, status: 422, stage_id: "stage6_integrated_handoff", error_type: "STAGE6_INTEGRATED_GUARDRAIL_VALIDATION_ERROR", validation: schemaValidation, stage6_guardrail: guardrail, stage6_review: stage6Review } });
  }
  return { schemaValidation, guardrail };
}

export async function runStage6Live({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, logs, runId }) {
  const stage6Input = buildStage6Input({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, runId });
  logStage(logs, "stage6a_legal_document_cartography", "running");
  const stage6aStageResult = await runStage("stage6a_legal_document_cartography", stage6Input, { pool: process.env.LIVE_STAGE6A_POOL || process.env.LIVE_LEGAL_POOL || process.env.STAGE6A_POOL || process.env.STAGE6_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_STAGE6A_MAX_OUTPUT_TOKENS || process.env.LIVE_LEGAL_MAX_OUTPUT_TOKENS || process.env.STAGE6A_MAX_OUTPUT_TOKENS || 24000), timeoutMs: Number(process.env.LIVE_STAGE6A_TIMEOUT_MS || process.env.LIVE_LEGAL_TIMEOUT_MS || process.env.STAGE6A_TIMEOUT_MS || 90000) });
  logStage(logs, "stage6a_legal_document_cartography", "complete", { legal_document_inventory_count: stage6aStageResult.stage6_review?.legal_document_cartography?.legal_document_inventory?.length || 0, legal_unit_count: stage6aStageResult.stage6_review?.legal_document_cartography?.legal_document_index?.length || 0, semantic_model_attempted: stage6aStageResult.semantic_model_attempted === true });
  logStage(logs, "stage6b_data_provenance", "running");
  const stage6bStageResult = await runStage("stage6b_data_provenance", stage6Input, { pool: process.env.LIVE_STAGE6B_POOL || process.env.STAGE6B_POOL || process.env.STAGE6_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_STAGE6B_MAX_OUTPUT_TOKENS || process.env.STAGE6B_MAX_OUTPUT_TOKENS || 24000), timeoutMs: Number(process.env.LIVE_STAGE6B_TIMEOUT_MS || process.env.STAGE6B_TIMEOUT_MS || 90000) });
  logStage(logs, "stage6b_data_provenance", "complete", { data_flow_profile_count: stage6bStageResult.stage6_review?.data_provenance_profile?.data_flow_profile?.length || 0, semantic_model_attempted: stage6bStageResult.semantic_model_attempted === true });
  logStage(logs, "stage6_integrated_handoff", "running");
  const stage6IntegratedArtifact = buildStage6IntegratedHandoffArtifact({ stage6a_review: stage6aStageResult.stage6_review, stage6b_review: stage6bStageResult.stage6_review }, { run_id: `${runId}_stage6_integrated_handoff`, generated_at: nowIso(), stage6a_stage_id: stage6aStageResult.stage_id || "stage6a_legal_document_cartography", stage6b_stage_id: stage6bStageResult.stage_id || "stage6b_data_provenance" });
  const integratedValidation = validateStage6IntegratedArtifact({ stage6IntegratedArtifact, stage6Input, stage6aStageResult, stage6bStageResult });
  logStage(logs, "stage6_integrated_handoff", "complete", { feature_to_data_flow_index_count: stage6IntegratedArtifact.stage6_review?.stage7_navigation_index?.feature_to_data_flow_index?.length || 0, feature_to_legal_unit_index_count: stage6IntegratedArtifact.stage6_review?.stage7_navigation_index?.feature_to_legal_unit_index?.length || 0, validation_mode: integratedValidation.schemaValidation.validation_mode, guardrail_validation_mode: integratedValidation.guardrail.validation_mode, guardrail_warning_count: integratedValidation.guardrail.warnings?.length || 0, guardrail_repair_count: integratedValidation.guardrail.repairs?.length || 0 });
  return { stage6aStageResult, stage6bStageResult, stage6IntegratedArtifact, stage6IntegratedValidation: integratedValidation };
}

export function buildStage6Cache({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, stage6aStageResult, stage6bStageResult, stage6IntegratedArtifact, stage6IntegratedValidation = null }) {
  return { cache_version: "stage6_integrated_handoff_live_cache_v1", generated_at: nowIso(), source_bundle: sourceBundle, evidence_junction: evidenceJunction, company_profile: companyProfile, target_feature_profile: targetFeatureProfile, stage6a_stage_result: stage6aStageResult, stage6b_stage_result: stage6bStageResult, stage6_integrated_artifact: stage6IntegratedArtifact, stage6_integrated_validation: stage6IntegratedValidation, stage6_review: stage6IntegratedArtifact.stage6_review, stage6_to_stage7_adapter: stage6IntegratedArtifact.stage6_to_stage7_adapter };
}

export async function runStage7({ stage6Cache, registryRuntime, registryKey, logs, runId }) {
  logStage(logs, "registry_ledger_evaluation", "running");
  const rows = asArray(registryRuntime?.threats).map(normalizeRegistryRow);
  if (!rows.length) throw new Error("Runtime registry contains no rows.");
  const batchSize = Number(process.env.STAGE7_PRIORITY_BATCH_SIZE || process.env.STAGE7_BATCH_SIZE || 8);
  const plan = buildPriorityRowPlan({ rows, profile: stage6Cache.target_feature_profile, batchSize });
  const modelRows = [];
  const batchSummaries = [];
  for (let index = 0; index < plan.model_batches.length; index += 1) {
    const rowBatch = plan.model_batches[index];
    const batch = makeBatch({ rows: rowBatch, batchNumber: index + 1, batchCount: plan.model_batches.length, totalRows: rows.length, runId });
    batch.batch_route_summary = rowBatch._batch_route_summary || null;
    const adapter = buildRegistryLedgerInput({ sourceBundle: stage6Cache.source_bundle, evidenceJunction: stage6Cache.evidence_junction, targetProfile: stage6Cache.company_profile, targetFeatureProfile: stage6Cache.target_feature_profile, stage6Review: stage6Cache.stage6_review, stage6ToStage7Adapter: stage6Cache.stage6_to_stage7_adapter, registryBatch: batch, registryKey, runId, budget: { enforcement_mode: process.env.STAGE7_BUDGET_ENFORCEMENT_MODE || "guidance" } });
    if (!adapter.ok) { const error = new Error(adapter.error || "Stage 7 input adapter failed"); error.status = adapter.status || 500; error.result = adapter; throw error; }
    const result = await runStage("registry_ledger_evaluation", adapter.registry_ledger_input, { pool: process.env.LIVE_REGISTRY_POOL || process.env.STAGE7_POOL || "registry", maxOutputTokens: Number(process.env.LIVE_REGISTRY_MAX_OUTPUT_TOKENS || 16384), timeoutMs: Number(process.env.LIVE_REGISTRY_TIMEOUT_MS || 120000) });
    const ledger = result.registry_ledger;
    if (!ledger || !Array.isArray(ledger.registry_evaluation_ledger)) throw new Error("Stage 7 returned no usable registry ledger.");
    const emittedIds = ledger.registry_evaluation_ledger.map((entry) => entry.threat_id);
    const batchCoverage = coverage(batch.expected_threat_ids, emittedIds);
    if (!batchCoverage.ok) { const error = new Error("Stage 7 batch coverage failed before merge."); error.result = { batch_number: batch.batch_number, coverage: batchCoverage }; throw error; }
    modelRows.push(...ledger.registry_evaluation_ledger);
    batchSummaries.push({ batch_number: batch.batch_number, batch_count: batch.batch_count, expected_batch_size: batch.batch_size, ledger_count: ledger.registry_evaluation_ledger.length, expected_ids: batch.expected_threat_ids, emitted_ids: emittedIds, coverage: batchCoverage, final_status_counts: countsByStatus(ledger.registry_evaluation_ledger), model_metadata: result.model_metadata || null });
    logStage(logs, "registry_ledger_evaluation", "batch_complete", { batch_number: batch.batch_number, batch_count: batch.batch_count, ledger_count: ledger.registry_evaluation_ledger.length });
  }
  const modelCoverage = coverage(plan.model_rows.map((row) => row.Threat_ID), modelRows.map((entry) => entry.threat_id));
  if (!modelCoverage.ok) throw new Error(`Stage 7 model-row coverage failed: ${JSON.stringify(modelCoverage)}`);
  const merged = mergePriorityRows({ modelRows, deterministicRows: plan.deterministic_rows, sourceRows: rows });
  const validation = validatePriorityMerge({ mergedRows: merged, sourceRows: rows });
  if (!validation.ok) throw new Error(`Merged Stage 7 output failed validation: ${JSON.stringify(validation)}`);
  const stage7Artifact = { artifact_type: "stage7_priority_ledger_live_export", generated_at: nowIso(), run_id: runId, summary: { ok: true, phase: "stage_7_priority_complete", batch_size_config: batchSize, counts: plan.counts, routing_summary: plan.routing_summary, model_rows_returned: modelRows.length, model_coverage: modelCoverage, deterministic_rows: plan.deterministic_rows.length, merged_rows: merged.length, final_status_counts: countsByStatus(merged), validation, batch_summaries: batchSummaries }, active_archetypes: plan.active_archetypes, active_surfaces: plan.active_surfaces, route_records: plan.route_records, deterministic_rows: plan.deterministic_rows, model_rows: modelRows, merged_ledger: merged, source_row_count: rows.length };
  logStage(logs, "registry_ledger_evaluation", "complete", { merged_rows: merged.length, final_status_counts: countsByStatus(merged) });
  return stage7Artifact;
}

export async function runStage8({ stage6Cache, stage7Artifact, registryRuntime, logs, runId }) {
  logStage(logs, "operator_challenge", "running");
  const mergedLedger = asArray(stage7Artifact.merged_ledger);
  if (!mergedLedger.length) throw new Error("Stage 8 requires a merged Stage 7 ledger.");
  const registryRows = asArray(registryRuntime?.threats);
  const expectedIds = registryRows.length ? registryRows.map(registryThreatId) : mergedLedger.map(threatId);
  const registryTotal = expectedIds.length || Number(stage7Artifact.source_row_count || mergedLedger.length);
  const stage8Input = { run_id: runId, registry_count_loaded: registryTotal, registry_total_count: registryTotal, registry_count_evaluated: mergedLedger.length, registry_evaluation_ledger: mergedLedger, registry_batch_meta: { run_id: stage7Artifact.run_id || runId, batch_id: "MERGED", is_merged_ledger: true, test_run: false, registry_count_loaded: registryTotal, registry_total_count: registryTotal, registry_count_evaluated: mergedLedger.length, stage7_artifact_type: stage7Artifact.artifact_type || null }, source_bundle: stage6Cache.source_bundle, target_profile: stage6Cache.company_profile, target_feature_profile: stage6Cache.target_feature_profile, stage6_review: stage6Cache.stage6_review, stage6_to_stage7_adapter: stage6Cache.stage6_to_stage7_adapter, registry_logic_reference: compactRegistryLogicReference(registryRows), prior_stage_summaries: { stage7_summary: stage7Artifact.summary || null, active_archetypes: stage7Artifact.active_archetypes || [], active_surfaces: stage7Artifact.active_surfaces || [] }, test_run: false };
  const result = await runStage("operator_challenge", stage8Input, { pool: process.env.LIVE_STAGE8_POOL || process.env.STAGE8_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_STAGE8_MAX_OUTPUT_TOKENS || 8192), timeoutMs: Number(process.env.LIVE_STAGE8_TIMEOUT_MS || 120000) });
  const challengeOutput = result.operator_challenge;
  if (!challengeOutput) throw new Error("Stage 8 returned no operator_challenge output.");
  const outputErrors = validateChallengeOutput(challengeOutput, registryTotal);
  if (outputErrors.length) throw new Error(`Stage 8 output validation failed: ${outputErrors.join("; ")}`);
  const correctionResult = applyCorrections({ mergedLedger, challengeOutput, expectedIds });
  if (!correctionResult.ok) throw new Error(`Stage 8 correction merge validation failed: ${correctionResult.correction_errors.join("; ")}`);
  const stage8Export = { artifact_type: "stage8_operator_challenge_live_export", generated_at: nowIso(), run_id: runId, operator_challenge: challengeOutput, correction_result: { ok: correctionResult.ok, corrected_count: correctionResult.corrected_count, correction_errors: correctionResult.correction_errors, correction_meta: correctionResult.correction_meta || null }, model_metadata: result.model_metadata || null, prompt_metadata: result.prompt_metadata || null, validation_mode: result.validation_mode || null, guardrail_validation_mode: result.guardrail_validation_mode || null, summary: { registry_total: registryTotal, pre_challenge_status_counts: countsByStatus(mergedLedger), post_challenge_status_counts: countsByStatus(correctionResult.post_challenge_ledger), corrected_count: correctionResult.corrected_count, operator_result: challengeOutput.operator_challenge_gate?.result || null, reopened_rows: challengeOutput.operator_challenge_gate?.reopened_rows || [] } };
  const stage8Ledger = { artifact_type: "stage8_post_challenge_ledger", generated_at: nowIso(), run_id: runId, corrected_count: correctionResult.corrected_count, correction_meta: correctionResult.correction_meta || null, operator_challenge_gate: challengeOutput.operator_challenge_gate, post_challenge_ledger: correctionResult.post_challenge_ledger, final_status_counts: countsByStatus(correctionResult.post_challenge_ledger) };
  logStage(logs, "operator_challenge", "complete", { corrected_count: correctionResult.corrected_count, post_status_counts: countsByStatus(correctionResult.post_challenge_ledger) });
  return { stage8Export, stage8Ledger, stage8Input };
}
