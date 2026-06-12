import { runGeminiPool } from "../gemini/geminiPool.js";
import { getDiligenceStageConfig } from "./stageConfigs.js";
import { loadDiligencePrompt } from "./stagePromptLoader.js";
import { formatSchemaErrors, resolveSchemaEntry, validateDiligenceStageOutput } from "./stageSchemaValidator.js";
import { validateTargetFeatureProfileGuardrails } from "./targetFeatureProfileGuardrails.js";
import { validateLegalStackReviewGuardrails } from "./legalStackReviewGuardrails.js";
import { validateRegistryLedgerGuardrails } from "./registryLedgerGuardrails.js";
import { hasUnadmittedLegalDocumentCandidates, reconcileStage6LegalDocumentInput } from "./stage6LegalDocumentInputReconciler.js";
import { repairTargetFeatureProfileForSchema } from "./targetFeatureProfileSchemaRepair.js";

function unwrapStageOutput(parsedJson, outputKey) {
  if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson) && Object.prototype.hasOwnProperty.call(parsedJson, outputKey)) return { value: parsedJson[outputKey], unwrapped: true };
  return { value: parsedJson, unwrapped: false };
}

function stringifyLimitation(item) {
  if (typeof item === "string") return item;
  if (item == null) return "";
  if (typeof item !== "object") return String(item);
  const fields = [item.limitation, item.summary, item.reason, item.message, item.description, item.note, item.value].filter((value) => typeof value === "string" && value.trim());
  if (fields.length) return fields.join(" — ");
  try { return JSON.stringify(item); } catch { return String(item); }
}

function normalizeStageOutputForSchema(value, schemaKey) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { value, repaired: false, repair_notes: [] };
  const copy = { ...value };
  const notes = [];
  if (Array.isArray(copy.limitations)) {
    const normalized = copy.limitations.map(stringifyLimitation).map((item) => String(item || "").trim()).filter(Boolean);
    if (normalized.length !== copy.limitations.length || copy.limitations.some((item, index) => item !== normalized[index])) {
      copy.limitations = normalized;
      notes.push("normalized_limitations_to_string_array");
    }
  }
  if (schemaKey === "targetFeatureProfile") {
    const enumRepair = repairTargetFeatureProfileForSchema(copy);
    if (enumRepair.repaired) notes.push(...enumRepair.repair_notes);
    if (Array.isArray(copy.product_feature_map) && copy.product_feature_map.length > 0) {
      copy.product_feature_map = [];
      if (!Array.isArray(copy.limitations)) copy.limitations = [];
      const warning = "GUARDRAIL_WARNING /product_feature_map: product_feature_map is legacy and was cleared before schema validation";
      if (!copy.limitations.includes(warning)) copy.limitations.push(warning);
      notes.push("cleared_legacy_product_feature_map_before_schema_validation");
    }
  }
  return { value: copy, repaired: notes.length > 0, repair_notes: notes };
}

function repairRegistryLedgerFinalStatuses(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.registry_evaluation_ledger)) return { value, repaired: false, repair_notes: [] };
  const copy = { ...value, registry_evaluation_ledger: value.registry_evaluation_ledger.map((entry) => ({ ...entry })) };
  let count = 0;
  for (const entry of copy.registry_evaluation_ledger) {
    let derived = entry.final_status;
    if (entry.archetype_gate === "FAIL" || entry.surface_gate === "FAIL") derived = "NOT_APPLICABLE";
    else if (entry.final_status === "INSUFFICIENT_EVIDENCE") derived = "INSUFFICIENT_EVIDENCE";
    else if (entry.trigger_if_result === true && entry.exclude_if_result === true) derived = "CONTROLLED";
    else if (entry.trigger_if_result === true && entry.exclude_if_result === false) derived = "TRIGGERED";
    else if (entry.trigger_if_result === false) derived = "NOT_TRIGGERED";
    if (derived && derived !== entry.final_status) { entry.final_status = derived; count += 1; }
  }
  return { value: copy, repaired: count > 0, repair_notes: count > 0 ? [`normalized_${count}_registry_final_statuses`] : [] };
}

function buildPromptInput({ stageId, prompt, runtimeInstruction, input }) {
  return [prompt.trim(), runtimeInstruction ? `\n\n---RUNTIME_STAGE_INSTRUCTION---\n${runtimeInstruction.trim()}` : "", "\n\n---\n\nReturn valid JSON only. Do not include Markdown fences or commentary outside JSON.", "\n\n---INPUT_JSON---\n", JSON.stringify({ stage_id: stageId, input }, null, 2)].join("");
}

function publicModelMetadata(result, repair = {}) {
  return { pool: result?.model_meta?.pool || null, model: result?.model_meta?.selected_model || null, selected_model: result?.model_meta?.selected_model || null, selected_key_alias: result?.model_meta?.selected_key_alias || null, attempted_models: result?.attempts || [], fallback_used: result?.fallback_used === true, primary_error: result?.primary_error || null, usage_metadata: result?.usage_metadata || null, grounding_metadata: result?.grounding_metadata || null, repaired: result?.repaired === true || repair?.repaired === true, repair_notes: repair?.repair_notes || [] };
}

function providerFailureStatus(result) {
  if (result?.error_type === "POOL_KEYS_NOT_CONFIGURED" || result?.error_type === "POOL_MODELS_NOT_CONFIGURED") return 503;
  if (result?.error_type === "ATTEMPT_BUDGET_EXHAUSTED" || result?.error_type === "POOL_EXHAUSTED") return 502;
  if (result?.error_type === "TIMEOUT") return 504;
  return 502;
}

function guardrailResultFor(config, output, input) {
  const threatMappingSupplied = input?.threat_mapping_supplied === true || input?.source_bundle?.source_review?.threat_mapping_supplied === true;
  const evidenceBuffer = Array.isArray(input?.source_bundle?.evidence_buffer) ? input.source_bundle.evidence_buffer : [];
  if (config.output_schema_key === "targetFeatureProfile") return { ...validateTargetFeatureProfileGuardrails(output, { threatMappingSupplied, evidenceBuffer, packageInput: input }), validation_mode: "target_feature_profile_runtime_guardrails" };
  if (config.output_schema_key === "legalStackReview") return { ...validateLegalStackReviewGuardrails(output, { threatMappingSupplied, evidenceBuffer }), validation_mode: "legal_stack_review_runtime_guardrails" };
  if (config.output_schema_key === "registryLedger") return { ...validateRegistryLedgerGuardrails(output, { input }), validation_mode: "registry_ledger_runtime_guardrails" };
  return { ok: true, errors: [], warnings: [], repairs: [], validation_mode: null };
}

function combinedRepairMetadata(repair = {}, guardrails = {}) {
  const guardrailNotes = (guardrails.repairs || []).map((item, index) => item?.action ? `guardrail_${item.severity || "REPAIRABLE"}_${item.action}_${index + 1}` : `guardrail_REPAIRABLE_${index + 1}`);
  return { repaired: repair.repaired === true || (guardrails.repairs || []).length > 0, repair_notes: [...(repair.repair_notes || []), ...guardrailNotes] };
}

function stageOutputWarnings(config, finalOutput) {
  const warnings = [];
  if (config.output_schema_key === "targetProfileV2") {
    const refs = Array.isArray(finalOutput?.evidence?.field_evidence_refs) ? finalOutput.evidence.field_evidence_refs : [];
    refs.forEach((ref, index) => {
      const fieldPath = String(ref?.field_path || "");
      const evidenceSourceId = String(ref?.evidence_source_id || "");
      if (/^unknown_\d+$/i.test(fieldPath) || /^evidence_\d+$/i.test(evidenceSourceId) || !String(ref?.source_url || "").trim()) warnings.push({ keyword: "stage4_evidence_quality_warning", severity: "WARNING", instancePath: `/evidence/field_evidence_refs/${index}`, schemaPath: "#/stageRunnerNonBlockingWarnings", message: "Stage 4 evidence ref is weak or fallback-generated; passed with warning", params: { field_path: fieldPath, evidence_source_id: evidenceSourceId || null, source_url: ref?.source_url || null } });
    });
  }
  return warnings;
}

function successPayload({ config, validation, guardrails, normalizedOutput, repair, finalOutput, runResult, promptBundle, reconciliation = null }) {
  const combined = combinedRepairMetadata(repair, guardrails);
  const guardrailWarnings = [...(guardrails.warnings || []), ...stageOutputWarnings(config, finalOutput)];
  return { ok: true, status: 200, stage_id: config.stage_id, output_schema_key: config.output_schema_key, output_schema_path: validation.schema_path, validation_schema_key: validation.resolvedKey, validation_mode: validation.validation_mode, guardrail_validation_mode: guardrails.validation_mode, output_unwrapped: normalizedOutput.unwrapped, output_repaired: combined.repaired, output_repair_notes: combined.repair_notes, guardrail_warnings: guardrailWarnings, guardrail_repairs: guardrails.repairs || [], guardrail_warning_count: guardrailWarnings.length, guardrail_repair_count: (guardrails.repairs || []).length, [config.output_key]: finalOutput, legal_document_reconciliation: reconciliation, model_metadata: publicModelMetadata(runResult, combined), prompt_metadata: { prompt_root: promptBundle.prompt_root, shared_sha256: promptBundle.shared_prompt.sha256, stage_sha256: promptBundle.stage_prompt.sha256, combined_characters: promptBundle.combined_characters, runtime_instruction_configured: Boolean(config.runtime_instruction) } };
}

function validationFailurePayload({ config, schemaEntry, validation, normalizedOutput, repair, runResult, promptBundle }) {
  return { ok: false, status: 422, stage_id: config.stage_id, output_schema_key: config.output_schema_key, output_schema_path: validation.schema_path || schemaEntry.path, validation_schema_key: validation.resolvedKey, validation_mode: validation.validation_mode, output_unwrapped: normalizedOutput.unwrapped, output_repaired: repair.repaired, output_repair_notes: repair.repair_notes, error_type: "SCHEMA_VALIDATION_ERROR", error: "Model output failed schema validation", validation_errors: validation.errors, error_summary: formatSchemaErrors(validation.errors), model_metadata: publicModelMetadata(runResult, repair), prompt_metadata: { prompt_root: promptBundle.prompt_root, shared_sha256: promptBundle.shared_prompt.sha256, stage_sha256: promptBundle.stage_prompt.sha256, combined_characters: promptBundle.combined_characters, runtime_instruction_configured: Boolean(config.runtime_instruction) } };
}

function guardrailFailurePayload({ config, schemaEntry, validation, guardrails, normalizedOutput, repair, runResult, promptBundle }) {
  const combined = combinedRepairMetadata(repair, guardrails);
  return { ok: false, status: 422, stage_id: config.stage_id, output_schema_key: config.output_schema_key, output_schema_path: validation.schema_path || schemaEntry.path, validation_schema_key: validation.resolvedKey, validation_mode: guardrails.validation_mode, output_unwrapped: normalizedOutput.unwrapped, output_repaired: combined.repaired, output_repair_notes: combined.repair_notes, guardrail_warnings: guardrails.warnings || [], guardrail_repairs: guardrails.repairs || [], guardrail_warning_count: (guardrails.warnings || []).length, guardrail_repair_count: (guardrails.repairs || []).length, error_type: "GUARDRAIL_VALIDATION_ERROR", error: `Model output failed ${config.stage_id} guardrails`, validation_errors: guardrails.errors, error_summary: formatSchemaErrors(guardrails.errors), model_metadata: publicModelMetadata(runResult, combined), prompt_metadata: { prompt_root: promptBundle.prompt_root, shared_sha256: promptBundle.shared_prompt.sha256, stage_sha256: promptBundle.stage_prompt.sha256, combined_characters: promptBundle.combined_characters, runtime_instruction_configured: Boolean(config.runtime_instruction) } };
}

async function executeStageOnce({ config, schemaEntry, promptBundle, stageId, input, options, env }) {
  const modelPrompt = buildPromptInput({ stageId: config.stage_id, prompt: promptBundle.combined_prompt, runtimeInstruction: config.runtime_instruction, input });
  const runResult = await runGeminiPool({ poolName: options.pool || config.pool, prompt: modelPrompt, env, options: { responseMimeType: "application/json", temperature: options.temperature ?? config.temperature, maxOutputTokens: options.maxOutputTokens ?? options.max_output_tokens ?? config.max_output_tokens, timeoutMs: options.timeoutMs ?? options.timeout_ms ?? config.timeout_ms, maxAttempts: options.maxAttempts ?? options.max_attempts } });
  if (!runResult.ok) return { ok: false, payload: { ok: false, status: providerFailureStatus(runResult), stage_id: config.stage_id, error_type: runResult.error_type || "MODEL_STAGE_ERROR", error: runResult.error || "Diligence stage model run failed", model_metadata: publicModelMetadata(runResult) } };
  const normalizedOutput = unwrapStageOutput(runResult.json, config.output_key);
  const schemaNormalized = normalizeStageOutputForSchema(normalizedOutput.value, config.output_schema_key);
  const registryRepair = config.output_schema_key === "registryLedger" ? repairRegistryLedgerFinalStatuses(schemaNormalized.value) : { value: schemaNormalized.value, repaired: false, repair_notes: [] };
  const finalOutput = registryRepair.value;
  const repair = { repaired: schemaNormalized.repaired || registryRepair.repaired, repair_notes: [...(schemaNormalized.repair_notes || []), ...(registryRepair.repair_notes || [])] };
  const validation = validateDiligenceStageOutput(config.output_schema_key, finalOutput);
  if (!validation.ok) return { ok: false, payload: validationFailurePayload({ config, schemaEntry, validation, normalizedOutput, repair, runResult, promptBundle }) };
  const guardrails = guardrailResultFor(config, finalOutput, input);
  if (!guardrails.ok) return { ok: false, payload: guardrailFailurePayload({ config, schemaEntry, validation, guardrails, normalizedOutput, repair, runResult, promptBundle }) };
  return { ok: true, payload: successPayload({ config, validation, guardrails, normalizedOutput, repair, finalOutput, runResult, promptBundle }), finalOutput, input };
}

export async function runDiligenceStage({ stageId, input, options = {}, env = process.env }) {
  const config = getDiligenceStageConfig(stageId);
  const schemaEntry = resolveSchemaEntry(config.output_schema_key);
  if (!schemaEntry?.schema) return { ok: false, status: 500, stage_id: config.stage_id, error_type: "SCHEMA_NOT_FOUND", error: `Output schema not found for ${config.output_schema_key}`, output_schema_key: config.output_schema_key };
  const promptBundle = loadDiligencePrompt(config.prompt_stage_id);
  const first = await executeStageOnce({ config, schemaEntry, promptBundle, stageId, input, options, env });
  if (!first.ok) return first.payload;
  if (config.output_schema_key !== "legalStackReview" || options.skipLegalDocumentReconciliation === true || !hasUnadmittedLegalDocumentCandidates(first.finalOutput)) return first.payload;
  const reconciliation = await reconcileStage6LegalDocumentInput({ legalStackReview: first.finalOutput, legalStackReviewInput: input, timeoutMs: Number(options.legalDocumentTimeoutMs || env.STAGE6_LEGAL_DOCUMENT_TIMEOUT_MS || 15000), maxBytes: Number(options.legalDocumentMaxBytes || env.STAGE6_LEGAL_DOCUMENT_MAX_BYTES || 15 * 1024 * 1024) });
  if (!reconciliation.resolved_count) return { ...first.payload, legal_document_reconciliation: reconciliation };
  const rerun = await executeStageOnce({ config, schemaEntry, promptBundle, stageId, input: reconciliation.legal_stack_review_input, options: { ...options, skipLegalDocumentReconciliation: true }, env });
  if (!rerun.ok) return { ...first.payload, legal_document_reconciliation: { ...reconciliation, rerun_failed: true, rerun_error: rerun.payload?.error || "rerun_failed" } };
  return { ...rerun.payload, legal_document_reconciliation: { ...reconciliation, rerun_applied: true } };
}
