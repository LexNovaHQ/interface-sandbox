import { runGeminiPool } from "../gemini/geminiPool.js";
import { getDiligenceStageConfig } from "./stageConfigs.js";
import { loadDiligencePrompt } from "./stagePromptLoader.js";
import { formatSchemaErrors, resolveSchemaEntry, validateDiligenceStageOutput } from "./stageSchemaValidator.js";
import { validateTargetFeatureProfileGuardrails } from "./targetFeatureProfileGuardrails.js";
import { validateLegalStackReviewGuardrails } from "./legalStackReviewGuardrails.js";
import { validateRegistryLedgerGuardrails } from "./registryLedgerGuardrails.js";
import { hasUnadmittedLegalDocumentCandidates, reconcileStage6LegalDocumentInput } from "./stage6LegalDocumentInputReconciler.js";
import { runStage6ALegalCartography } from "./stage6aModelOverlayRunner.js";
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

const STAGE6A_SIGNAL_VALUES = new Set(["visible", "not_visible", "partial", "conflicting", "not_applicable", "unknown"]);

function normalizeStage6ASignal(value) {
  if (typeof value !== "string") return value;
  const raw = value.trim();
  if (STAGE6A_SIGNAL_VALUES.has(raw)) return raw;
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (STAGE6A_SIGNAL_VALUES.has(normalized)) return normalized;
  if (!normalized) return value;
  if (normalized.includes("conflict") || normalized.includes("contradict")) return "conflicting";
  if (normalized.includes("partial") || normalized.includes("limited") || normalized.includes("mixed") || normalized.includes("some")) return "partial";
  if (normalized === "na" || normalized === "n_a" || normalized.includes("not_applicable")) return "not_applicable";
  if (normalized.includes("not_visible") || normalized.includes("not_found") || normalized.includes("missing") || normalized.includes("absent") || normalized.includes("unavailable")) return "not_visible";
  if (normalized.includes("visible") || normalized.includes("present") || normalized.includes("available") || normalized.includes("covered")) return "visible";
  return "unknown";
}

function repairLegalStackReviewForSchema(value) {
  const signals = value?.legal_document_cartography?.legal_stack_summary_signals;
  if (!signals || typeof signals !== "object" || Array.isArray(signals)) return { repaired: false, repair_notes: [] };
  const notes = [];
  for (const key of ["document_hierarchy_signal", "legal_stack_coverage_signal"]) {
    if (typeof signals[key] !== "string") continue;
    const repaired = normalizeStage6ASignal(signals[key]);
    if (repaired !== signals[key]) {
      signals[key] = repaired;
      notes.push(`normalized_stage6a_${key}`);
    }
  }
  return { repaired: notes.length > 0, repair_notes: notes };
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
  if (schemaKey === "legalStackReview") {
    if (copy.legal_document_cartography && typeof copy.legal_document_cartography === "object" && !Array.isArray(copy.legal_document_cartography)) {
      copy.legal_document_cartography = { ...copy.legal_document_cartography };
      if (copy.legal_document_cartography.legal_stack_summary_signals && typeof copy.legal_document_cartography.legal_stack_summary_signals === "object" && !Array.isArray(copy.legal_document_cartography.legal_stack_summary_signals)) {
        copy.legal_document_cartography.legal_stack_summary_signals = { ...copy.legal_document_cartography.legal_stack_summary_signals };
      }
    }
    const legalRepair = repairLegalStackReviewForSchema(copy);
    if (legalRepair.repaired) notes.push(...legalRepair.repair_notes);
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

function buildStage5FeatureDiscoveryPrompt(input) {
  return [
    "You are Stage 5A Feature Discovery for the Diligence Engine.",
    "",
    "Return valid JSON only with this shape:",
    '{"stage5_feature_discovery":{"discovery_version":"stage5_feature_discovery_v1","discovered_features":[],"visible_but_unmapped":[],"limitations":[]}}',
    "",
    "Your job is discovery only. Read admitted Stage 5 evidence and find every concrete product/commercial function visible in evidence.",
    "Keep distinct functions separate. Do not legal-review. Do not registry-evaluate. Do not fill canonical schema fields. Do not browse or use external knowledge.",
    "The deterministic target_feature_candidate_index is a secondary checklist only after you independently scan the admitted evidence. It is not final truth and must not drive discovery.",
    "For each discovered feature include: discovery_id, feature_label, function_summary, input_signal, system_action, output_signal, source_ids, evidence_refs, confidence.",
    "Every discovered feature must cite admitted source_ids/evidence_refs. If evidence is missing, do not emit the feature; use visible_but_unmapped or limitations.",
    "No minimum feature count. No maximum feature count. If zero evidence-backed features exist, return zero discovered_features with limitations.",
    "",
    "---INPUT_JSON---",
    JSON.stringify({ stage_id: "target_feature_profile_discovery", input }, null, 2)
  ].join("\n");
}

function normalizeStage5FeatureDiscovery(json = {}) {
  const value = json?.stage5_feature_discovery || json;
  const discovery = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const discovered = Array.isArray(discovery.discovered_features) ? discovery.discovered_features : [];
  return {
    discovery_version: discovery.discovery_version || "stage5_feature_discovery_v1",
    discovered_features: discovered.map((feature, index) => ({
      discovery_id: feature?.discovery_id || `FD${String(index + 1).padStart(3, "0")}`,
      feature_label: feature?.feature_label || feature?.label || "",
      function_summary: feature?.function_summary || feature?.summary || "",
      input_signal: feature?.input_signal || "",
      system_action: feature?.system_action || "",
      output_signal: feature?.output_signal || "",
      source_ids: Array.isArray(feature?.source_ids) ? feature.source_ids : [],
      evidence_refs: Array.isArray(feature?.evidence_refs) ? feature.evidence_refs : [],
      confidence: feature?.confidence || "unknown"
    })),
    visible_but_unmapped: Array.isArray(discovery.visible_but_unmapped) ? discovery.visible_but_unmapped : [],
    limitations: Array.isArray(discovery.limitations) ? discovery.limitations : []
  };
}

async function runStage5FeatureDiscovery({ config, input, options, env }) {
  const prompt = buildStage5FeatureDiscoveryPrompt(input);
  const runResult = await runGeminiPool({
    poolName: options.discoveryPool || options.pool || config.pool,
    prompt,
    env,
    options: {
      responseMimeType: "application/json",
      temperature: options.discoveryTemperature ?? options.temperature ?? config.temperature,
      maxOutputTokens: Number(options.discoveryMaxOutputTokens || env.STAGE5_DISCOVERY_MAX_OUTPUT_TOKENS || 12000),
      timeoutMs: Number(options.discoveryTimeoutMs || env.STAGE5_DISCOVERY_TIMEOUT_MS || options.timeoutMs || options.timeout_ms || config.timeout_ms),
      maxAttempts: options.discoveryMaxAttempts ?? options.maxAttempts ?? options.max_attempts
    }
  });
  if (!runResult.ok) return { ok: false, runResult };
  return { ok: true, discovery: normalizeStage5FeatureDiscovery(runResult.json), runResult };
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

function targetFeatureCompletenessRepairItems(payload = {}) {
  return (payload.guardrail_repairs || []).filter((item) => item?.action === "rerun_missing_stage5_candidate_or_source_accounting");
}

function withStage5DiscoveryPayload(payload = {}, discoveryResult = null) {
  if (!discoveryResult?.discovery) return payload;
  return {
    ...payload,
    stage5_feature_discovery: discoveryResult.discovery,
    stage5_feature_discovery_metadata: publicModelMetadata(discoveryResult.runResult)
  };
}

function successPayload({ config, validation, guardrails, normalizedOutput, repair, finalOutput, runResult, promptBundle, reconciliation = null }) {
  const combined = combinedRepairMetadata(repair, guardrails);
  const guardrailWarnings = [...(guardrails.warnings || []), ...stageOutputWarnings(config, finalOutput)];
  const ledgerPayload = guardrails.target_feature_audit_ledger ? { target_feature_audit_ledger: guardrails.target_feature_audit_ledger, stage5_audit_ledger: guardrails.stage5_audit_ledger || guardrails.target_feature_audit_ledger } : {};
  return { ok: true, status: 200, stage_id: config.stage_id, output_schema_key: config.output_schema_key, output_schema_path: validation.schema_path, validation_schema_key: validation.resolvedKey, validation_mode: validation.validation_mode, guardrail_validation_mode: guardrails.validation_mode, output_unwrapped: normalizedOutput.unwrapped, output_repaired: combined.repaired, output_repair_notes: combined.repair_notes, guardrail_warnings: guardrailWarnings, guardrail_repairs: guardrails.repairs || [], guardrail_warning_count: guardrailWarnings.length, guardrail_repair_count: (guardrails.repairs || []).length, ...ledgerPayload, [config.output_key]: finalOutput, legal_document_reconciliation: reconciliation, model_metadata: publicModelMetadata(runResult, combined), prompt_metadata: { prompt_root: promptBundle.prompt_root, shared_sha256: promptBundle.shared_prompt.sha256, stage_sha256: promptBundle.stage_prompt.sha256, combined_characters: promptBundle.combined_characters, runtime_instruction_configured: Boolean(config.runtime_instruction) } };
}

function validationFailurePayload({ config, schemaEntry, validation, normalizedOutput, repair, runResult, promptBundle }) {
  return { ok: false, status: 422, stage_id: config.stage_id, output_schema_key: config.output_schema_key, output_schema_path: validation.schema_path || schemaEntry.path, validation_schema_key: validation.resolvedKey, validation_mode: validation.validation_mode, output_unwrapped: normalizedOutput.unwrapped, output_repaired: repair.repaired, output_repair_notes: repair.repair_notes, error_type: "SCHEMA_VALIDATION_ERROR", error: "Model output failed schema validation", validation_errors: validation.errors, error_summary: formatSchemaErrors(validation.errors), model_metadata: publicModelMetadata(runResult, repair), prompt_metadata: { prompt_root: promptBundle.prompt_root, shared_sha256: promptBundle.shared_prompt.sha256, stage_sha256: promptBundle.stage_prompt.sha256, combined_characters: promptBundle.combined_characters, runtime_instruction_configured: Boolean(config.runtime_instruction) } };
}

function guardrailFailurePayload({ config, schemaEntry, validation, guardrails, normalizedOutput, repair, runResult, promptBundle }) {
  const combined = combinedRepairMetadata(repair, guardrails);
  const ledgerPayload = guardrails.target_feature_audit_ledger ? { target_feature_audit_ledger: guardrails.target_feature_audit_ledger, stage5_audit_ledger: guardrails.stage5_audit_ledger || guardrails.target_feature_audit_ledger } : {};
  return { ok: false, status: 422, stage_id: config.stage_id, output_schema_key: config.output_schema_key, output_schema_path: validation.schema_path || schemaEntry.path, validation_schema_key: validation.resolvedKey, validation_mode: guardrails.validation_mode, output_unwrapped: normalizedOutput.unwrapped, output_repaired: combined.repaired, output_repair_notes: combined.repair_notes, guardrail_warnings: guardrails.warnings || [], guardrail_repairs: guardrails.repairs || [], guardrail_warning_count: (guardrails.warnings || []).length, guardrail_repair_count: (guardrails.repairs || []).length, ...ledgerPayload, error_type: "GUARDRAIL_VALIDATION_ERROR", error: `Model output failed ${config.stage_id} guardrails`, validation_errors: guardrails.errors, error_summary: formatSchemaErrors(guardrails.errors), model_metadata: publicModelMetadata(runResult, combined), prompt_metadata: { prompt_root: promptBundle.prompt_root, shared_sha256: promptBundle.shared_prompt.sha256, stage_sha256: promptBundle.stage_prompt.sha256, combined_characters: promptBundle.combined_characters, runtime_instruction_configured: Boolean(config.runtime_instruction) } };
}

function stage6ALegalCartographyFailureStatus(result = {}) {
  if (result?.error_type === "POOL_KEYS_NOT_CONFIGURED" || result?.error_type === "POOL_MODELS_NOT_CONFIGURED") return 503;
  if (result?.error_type === "ATTEMPT_BUDGET_EXHAUSTED" || result?.error_type === "POOL_EXHAUSTED") return 502;
  if (result?.error_type === "TIMEOUT") return 504;
  return 502;
}

async function runStage6ALegalCartographyStage({ config, schemaEntry, input, options, env }) {
  const runResult = await runStage6ALegalCartography({
    source_bundle: input?.source_bundle,
    target_profile: input?.target_profile,
    company_profile: input?.company_profile,
    target_feature_profile: input?.target_feature_profile,
    evidence_junction: input?.evidence_junction,
    runtime_options: options,
    env
  });
  if (!runResult.ok) {
    return {
      ok: false,
      status: stage6ALegalCartographyFailureStatus(runResult),
      stage_id: config.stage_id,
      output_schema_key: config.output_schema_key,
      output_schema_path: schemaEntry.path,
      error_type: runResult.error_type || "STAGE6A_LEGAL_CARTOGRAPHY_FAILED",
      error: runResult.error || "Stage 6A Legal Cartography failed.",
      packet_summary: runResult.packet_summary || null,
      model_overlay_attempted: runResult.model_overlay_attempted === true,
      model_metadata: runResult.model_metadata || null
    };
  }
  const finalOutput = runResult.cartography;
  const validation = validateDiligenceStageOutput(config.output_schema_key, finalOutput);
  if (!validation.ok) {
    return {
      ok: false,
      status: 422,
      stage_id: config.stage_id,
      output_schema_key: config.output_schema_key,
      output_schema_path: validation.schema_path || schemaEntry.path,
      validation_schema_key: validation.resolvedKey,
      validation_mode: validation.validation_mode,
      error_type: "SCHEMA_VALIDATION_ERROR",
      error: "Stage 6A Legal Cartography output failed schema validation",
      validation_errors: validation.errors,
      error_summary: formatSchemaErrors(validation.errors),
      packet_summary: runResult.packet_summary || null,
      cartography_summary: runResult.cartography_summary || null,
      model_overlay_attempted: runResult.model_overlay_attempted === true,
      model_metadata: runResult.model_metadata || null
    };
  }
  return {
    ok: true,
    status: 200,
    stage_id: config.stage_id,
    output_schema_key: config.output_schema_key,
    output_schema_path: validation.schema_path || schemaEntry.path,
    validation_schema_key: validation.resolvedKey,
    validation_mode: validation.validation_mode,
    guardrail_validation_mode: null,
    output_unwrapped: false,
    output_repaired: false,
    output_repair_notes: [],
    legal_stack_review: finalOutput,
    packet_summary: runResult.packet_summary || null,
    cartography_summary: runResult.cartography_summary || null,
    normalized_overlay: runResult.normalized_overlay || null,
    overlay_repairs: runResult.overlay_repairs || [],
    model_overlay_attempted: runResult.model_overlay_attempted === true,
    model_metadata: runResult.model_metadata || null,
    prompt_metadata: {
      stage_prompt: "03A_MODEL_LEGAL_CARTOGRAPHY_OVERLAY.prompt.md",
      runtime_instruction_configured: false
    }
  };
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
  if (config.output_schema_key === "stage6aLegalCartography") {
    return runStage6ALegalCartographyStage({ config, schemaEntry, input, options, env });
  }
  const promptBundle = loadDiligencePrompt(config.prompt_stage_id);
  let stageInput = input;
  let discoveryResult = null;
  if (config.output_schema_key === "targetFeatureProfile" && options.skipStage5FeatureDiscovery !== true && !input?.stage5_feature_discovery) {
    discoveryResult = await runStage5FeatureDiscovery({ config, input, options, env });
    if (!discoveryResult.ok) {
      return { ok: false, status: providerFailureStatus(discoveryResult.runResult), stage_id: config.stage_id, error_type: discoveryResult.runResult?.error_type || "STAGE5_DISCOVERY_ERROR", error: discoveryResult.runResult?.error || "Stage 5 feature discovery failed", model_metadata: publicModelMetadata(discoveryResult.runResult) };
    }
    stageInput = {
      ...input,
      stage5_execution_mode: "stage5b_canonicalization_from_stage5a_discovery",
      stage5_feature_discovery: discoveryResult.discovery
    };
  }
  const first = await executeStageOnce({ config, schemaEntry, promptBundle, stageId, input: stageInput, options, env });
  if (!first.ok) return withStage5DiscoveryPayload(first.payload, discoveryResult);
  const targetFeatureRepairItems = targetFeatureCompletenessRepairItems(first.payload);
  if (config.output_schema_key === "targetFeatureProfile" && options.skipTargetFeatureCompletenessRepair !== true && targetFeatureRepairItems.length > 0) {
    const repairInput = {
      ...stageInput,
      completion_repair_request: {
        repair_version: "stage5_candidate_source_accounting_repair_v1",
        required_action: "After Stage 5A discovery, check the listed candidate/source accounting items. If an item points to an evidence-backed function that Stage 5B missed, map it. Otherwise mark it insufficient_detail, duplicate/supporting, or non_feature_context. Return the complete final feature_profile_v2 JSON. Do not drop prior valid features. Do not browse. Use the same admitted evidence only.",
        repairable_guardrail_items: targetFeatureRepairItems
      }
    };
    const rerun = await executeStageOnce({ config, schemaEntry, promptBundle, stageId, input: repairInput, options: { ...options, skipTargetFeatureCompletenessRepair: true, skipStage5FeatureDiscovery: true }, env });
    if (!rerun.ok) {
      return withStage5DiscoveryPayload({
        ...first.payload,
        ok: false,
        status: rerun.payload?.status || 422,
        error_type: "TARGET_FEATURE_COMPLETENESS_REPAIR_FAILED",
        error: "Stage 5 completeness repair rerun failed",
        target_feature_completeness_repair: {
          rerun_failed: true,
          rerun_error: rerun.payload?.error || rerun.payload?.error_type || "rerun_failed",
          first_guardrail_repairs: targetFeatureRepairItems
        }
      }, discoveryResult);
    }
    const remainingRepairItems = targetFeatureCompletenessRepairItems(rerun.payload);
    if (remainingRepairItems.length) {
      return withStage5DiscoveryPayload({
        ...rerun.payload,
        ok: false,
        status: 422,
        error_type: "TARGET_FEATURE_COMPLETENESS_REPAIR_INCOMPLETE",
        error: "Stage 5 completeness repair rerun did not resolve missing candidate/source accounting",
        target_feature_completeness_repair: {
          rerun_failed: true,
          rerun_error: "repair_rerun_incomplete",
          first_guardrail_repairs: targetFeatureRepairItems,
          rerun_guardrail_repairs: remainingRepairItems
        }
      }, discoveryResult);
    }
    return withStage5DiscoveryPayload({
      ...rerun.payload,
      target_feature_completeness_repair: {
        rerun_applied: true,
        first_guardrail_repairs: targetFeatureRepairItems
      }
    }, discoveryResult);
  }
  if (config.output_schema_key !== "legalStackReview" || options.skipLegalDocumentReconciliation === true || !hasUnadmittedLegalDocumentCandidates(first.finalOutput)) return withStage5DiscoveryPayload(first.payload, discoveryResult);
  const reconciliation = await reconcileStage6LegalDocumentInput({ legalStackReview: first.finalOutput, legalStackReviewInput: input, timeoutMs: Number(options.legalDocumentTimeoutMs || env.STAGE6_LEGAL_DOCUMENT_TIMEOUT_MS || 15000), maxBytes: Number(options.legalDocumentMaxBytes || env.STAGE6_LEGAL_DOCUMENT_MAX_BYTES || 15 * 1024 * 1024) });
  if (!reconciliation.resolved_count) return { ...first.payload, legal_document_reconciliation: reconciliation };
  const rerun = await executeStageOnce({ config, schemaEntry, promptBundle, stageId, input: reconciliation.legal_stack_review_input, options: { ...options, skipLegalDocumentReconciliation: true }, env });
  if (!rerun.ok) return { ...first.payload, legal_document_reconciliation: { ...reconciliation, rerun_failed: true, rerun_error: rerun.payload?.error || "rerun_failed" } };
  return { ...rerun.payload, legal_document_reconciliation: { ...reconciliation, rerun_applied: true } };
}
