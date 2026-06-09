import { runGeminiPool } from "../gemini/geminiPool.js";
import { getDiligenceStageConfig } from "./stageConfigs.js";
import { loadDiligencePrompt } from "./stagePromptLoader.js";
import { formatSchemaErrors, resolveSchemaEntry, validateDiligenceStageOutput } from "./stageSchemaValidator.js";
import { validateTargetFeatureProfileGuardrails } from "./targetFeatureProfileGuardrails.js";
import { validateLegalStackReviewGuardrails } from "./legalStackReviewGuardrails.js";
import { validateRegistryLedgerGuardrails } from "./registryLedgerGuardrails.js";

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

function normalizeStageOutputForSchema(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { value, repaired: false, repair_notes: [] };
  const copy = { ...value };
  const repairNotes = [];
  if (Array.isArray(copy.limitations)) {
    const normalized = copy.limitations.map(stringifyLimitation).map((item) => String(item || "").trim()).filter(Boolean);
    const changed = normalized.length !== copy.limitations.length || copy.limitations.some((item, index) => item !== normalized[index]);
    if (changed) {
      copy.limitations = normalized;
      repairNotes.push("normalized_limitations_to_string_array");
    }
  }
  return { value: copy, repaired: repairNotes.length > 0, repair_notes: repairNotes };
}

function quoteNorm(value) {
  return String(value || "").toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, "\"").replace(/\s+/g, " ").trim();
}

function urlNorm(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return String(value || "").trim();
  }
}

function sourceText(record = {}) {
  return record.clean_text_lossless || record?.text?.clean_text_lossless || "";
}

function tokenSet(value) {
  const stop = new Set(["the", "and", "for", "with", "that", "this", "from", "into", "your", "you", "our", "are", "can", "will", "api", "apis"]);
  return new Set(quoteNorm(value).split(/[^a-z0-9]+/).filter((token) => token.length >= 4 && !stop.has(token)));
}

function overlapScore(needle, candidate) {
  const n = tokenSet(needle);
  const c = tokenSet(candidate);
  if (!n.size || !c.size) return 0;
  let hits = 0;
  for (const token of n) if (c.has(token)) hits += 1;
  return hits / Math.max(3, n.size);
}

function evidenceMatchesForUrl(first = [], second = "") {
  const evidenceBuffer = Array.isArray(first) ? first : (Array.isArray(second) ? second : []);
  const featureSourceUrl = Array.isArray(first) ? second : first;
  const wanted = urlNorm(featureSourceUrl);
  return evidenceBuffer.filter((record) => [record.source_url, record.final_url, record.url].map(urlNorm).includes(wanted));
}

function candidateSnippets(text = "") {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const sentenceLike = cleaned.split(/(?<=[.!?])\s+|\s+[|•]\s+|\n+/).map((item) => item.trim()).filter((item) => item.length >= 25 && item.length <= 360);
  const words = cleaned.split(/\s+/).filter(Boolean);
  const windows = [];
  for (let i = 0; i < words.length; i += 18) {
    const window = words.slice(i, i + 36).join(" ").trim();
    if (window.length >= 25 && window.length <= 420) windows.push(window);
  }
  return [...new Set([...sentenceLike, ...windows])];
}

function snapQuoteToEvidence(feature, evidenceBuffer = []) {
  if (!feature?.evidence_quote || !feature?.feature_source_url) return null;
  const matches = evidenceMatchesForUrl(evidenceBuffer, feature.feature_source_url);
  if (!matches.length) return null;
  const current = quoteNorm(feature.evidence_quote);
  for (const record of matches) if (quoteNorm(sourceText(record)).includes(current)) return feature.evidence_quote;
  let best = null;
  for (const record of matches) {
    for (const candidate of candidateSnippets(sourceText(record))) {
      const score = overlapScore(feature.evidence_quote, candidate);
      if (!best || score > best.score) best = { quote: candidate, score };
    }
  }
  return best && best.score >= 0.38 ? best.quote : null;
}

function repairTargetFeatureProfileQuotes(value, input) {
  if (!value || typeof value !== "object" || !Array.isArray(value.product_feature_map)) return { value, repaired: false, repair_notes: [] };
  const evidenceBuffer = Array.isArray(input?.source_bundle?.evidence_buffer) ? input.source_bundle.evidence_buffer : [];
  if (!evidenceBuffer.length) return { value, repaired: false, repair_notes: [] };
  const copy = { ...value, product_feature_map: value.product_feature_map.map((feature) => ({ ...feature })) };
  let repairedCount = 0;
  for (const feature of copy.product_feature_map) {
    const snapped = snapQuoteToEvidence(feature, evidenceBuffer);
    if (snapped && quoteNorm(snapped) !== quoteNorm(feature.evidence_quote)) {
      feature.evidence_quote = snapped;
      repairedCount += 1;
    }
  }
  return { value: copy, repaired: repairedCount > 0, repair_notes: repairedCount > 0 ? [`snapped_${repairedCount}_target_feature_evidence_quotes_to_admitted_source_text`] : [] };
}

function gateFailure(entry = {}) {
  return entry.archetype_gate === "FAIL" || entry.surface_gate === "FAIL";
}

function derivedRegistryStatus(entry = {}) {
  if (gateFailure(entry)) return "NOT_APPLICABLE";
  if (entry.final_status === "NOT_APPLICABLE" || entry.final_status === "INSUFFICIENT_EVIDENCE") return entry.final_status;
  if (entry.trigger_if_result === true && entry.exclude_if_result === true) return "CONTROLLED";
  if (entry.trigger_if_result === true && entry.exclude_if_result === false) return "TRIGGERED";
  if (entry.trigger_if_result === false && ["TRIGGERED", "CONTROLLED", "NOT_TRIGGERED"].includes(entry.final_status)) return "NOT_TRIGGERED";
  return entry.final_status;
}

function repairRegistryLedgerFinalStatuses(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.registry_evaluation_ledger)) return { value, repaired: false, repair_notes: [] };
  const copy = { ...value, registry_evaluation_ledger: value.registry_evaluation_ledger.map((entry) => ({ ...entry })) };
  let repairedCount = 0;
  let gateRepairCount = 0;
  for (const entry of copy.registry_evaluation_ledger) {
    const derived = derivedRegistryStatus(entry);
    if (derived && derived !== entry.final_status) {
      entry.final_status = derived;
      repairedCount += 1;
      if (derived === "NOT_APPLICABLE" && gateFailure(entry)) gateRepairCount += 1;
    }
  }
  const notes = [];
  if (repairedCount > 0) notes.push(`normalized_${repairedCount}_registry_final_statuses_without_overriding_not_applicable_or_insufficient`);
  if (gateRepairCount > 0) notes.push(`forced_${gateRepairCount}_gate_fail_rows_to_not_applicable`);
  return { value: copy, repaired: repairedCount > 0, repair_notes: notes };
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
  if (config.output_schema_key === "targetFeatureProfile") return { ...validateTargetFeatureProfileGuardrails(output, { threatMappingSupplied, evidenceBuffer }), validation_mode: "target_feature_profile_runtime_guardrails" };
  if (config.output_schema_key === "legalStackReview") return { ...validateLegalStackReviewGuardrails(output, { threatMappingSupplied, evidenceBuffer }), validation_mode: "legal_stack_review_runtime_guardrails" };
  if (config.output_schema_key === "registryLedger") return { ...validateRegistryLedgerGuardrails(output, { input }), validation_mode: "registry_ledger_runtime_guardrails" };
  return { ok: true, errors: [], validation_mode: null };
}

export async function runDiligenceStage({ stageId, input, options = {}, env = process.env }) {
  const config = getDiligenceStageConfig(stageId);
  const schemaEntry = resolveSchemaEntry(config.output_schema_key);
  if (!schemaEntry?.schema) return { ok: false, status: 500, stage_id: config.stage_id, error_type: "SCHEMA_NOT_FOUND", error: `Output schema not found for ${config.output_schema_key}`, output_schema_key: config.output_schema_key };
  const promptBundle = loadDiligencePrompt(config.prompt_stage_id);
  const modelPrompt = buildPromptInput({ stageId: config.stage_id, prompt: promptBundle.combined_prompt, runtimeInstruction: config.runtime_instruction, input });
  const runResult = await runGeminiPool({ poolName: options.pool || config.pool, prompt: modelPrompt, env, options: { responseMimeType: "application/json", temperature: options.temperature ?? config.temperature, maxOutputTokens: options.maxOutputTokens ?? options.max_output_tokens ?? config.max_output_tokens, timeoutMs: options.timeoutMs ?? options.timeout_ms ?? config.timeout_ms, maxAttempts: options.maxAttempts ?? options.max_attempts } });
  if (!runResult.ok) return { ok: false, status: providerFailureStatus(runResult), stage_id: config.stage_id, error_type: runResult.error_type || "MODEL_STAGE_ERROR", error: runResult.error || "Diligence stage model run failed", model_metadata: publicModelMetadata(runResult) };
  const normalizedOutput = unwrapStageOutput(runResult.json, config.output_key);
  const schemaNormalizedOutput = normalizeStageOutputForSchema(normalizedOutput.value, config.output_schema_key);
  const quoteRepair = config.output_schema_key === "targetFeatureProfile" ? repairTargetFeatureProfileQuotes(schemaNormalizedOutput.value, input) : { value: schemaNormalizedOutput.value, repaired: false, repair_notes: [] };
  const registryRepair = config.output_schema_key === "registryLedger" ? repairRegistryLedgerFinalStatuses(quoteRepair.value) : { value: quoteRepair.value, repaired: false, repair_notes: [] };
  const finalOutput = registryRepair.value;
  const repair = { repaired: schemaNormalizedOutput.repaired || quoteRepair.repaired || registryRepair.repaired, repair_notes: [...(schemaNormalizedOutput.repair_notes || []), ...(quoteRepair.repair_notes || []), ...(registryRepair.repair_notes || [])] };
  const validation = validateDiligenceStageOutput(config.output_schema_key, finalOutput);
  if (!validation.ok) return { ok: false, status: 422, stage_id: config.stage_id, output_schema_key: config.output_schema_key, output_schema_path: validation.schema_path || schemaEntry.path, validation_schema_key: validation.resolvedKey, validation_mode: validation.validation_mode, output_unwrapped: normalizedOutput.unwrapped, output_repaired: repair.repaired, output_repair_notes: repair.repair_notes, error_type: "SCHEMA_VALIDATION_ERROR", error: "Model output failed schema validation", validation_errors: validation.errors, error_summary: formatSchemaErrors(validation.errors), model_metadata: publicModelMetadata(runResult, repair), prompt_metadata: { prompt_root: promptBundle.prompt_root, shared_sha256: promptBundle.shared_prompt.sha256, stage_sha256: promptBundle.stage_prompt.sha256, combined_characters: promptBundle.combined_characters, runtime_instruction_configured: Boolean(config.runtime_instruction) } };
  const guardrails = guardrailResultFor(config, finalOutput, input);
  if (!guardrails.ok) return { ok: false, status: 422, stage_id: config.stage_id, output_schema_key: config.output_schema_key, output_schema_path: validation.schema_path || schemaEntry.path, validation_schema_key: validation.resolvedKey, validation_mode: guardrails.validation_mode, output_unwrapped: normalizedOutput.unwrapped, output_repaired: repair.repaired, output_repair_notes: repair.repair_notes, error_type: "GUARDRAIL_VALIDATION_ERROR", error: `Model output failed ${config.stage_id} guardrails`, validation_errors: guardrails.errors, error_summary: formatSchemaErrors(guardrails.errors), model_metadata: publicModelMetadata(runResult, repair), prompt_metadata: { prompt_root: promptBundle.prompt_root, shared_sha256: promptBundle.shared_prompt.sha256, stage_sha256: promptBundle.stage_prompt.sha256, combined_characters: promptBundle.combined_characters, runtime_instruction_configured: Boolean(config.runtime_instruction) } };
  return { ok: true, status: 200, stage_id: config.stage_id, output_schema_key: config.output_schema_key, output_schema_path: validation.schema_path || schemaEntry.path, validation_schema_key: validation.resolvedKey, validation_mode: validation.validation_mode, guardrail_validation_mode: guardrails.validation_mode, output_unwrapped: normalizedOutput.unwrapped, output_repaired: repair.repaired, output_repair_notes: repair.repair_notes, [config.output_key]: finalOutput, model_metadata: publicModelMetadata(runResult, repair), prompt_metadata: { prompt_root: promptBundle.prompt_root, shared_sha256: promptBundle.shared_prompt.sha256, stage_sha256: promptBundle.stage_prompt.sha256, combined_characters: promptBundle.combined_characters, runtime_instruction_configured: Boolean(config.runtime_instruction) } };
}
