import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DILIGENCE_PROMPT_BUNDLE } from "../../functions/_generated/diligencePromptBundle.js";
import { runGeminiPool } from "../gemini/geminiPool.js";
import { validateStage6ReviewGuardrail } from "./guardrails/stage6ReviewGuardrail.js";
import { buildStage6ACartography } from "./stage6aLegalCartographyMerge.js";
import { buildStage6ASemanticClassificationPacket } from "./stage6aSemanticClassificationPacketBuilder.js";
import { normalizeStage6ASemanticClassification } from "./stage6aSemanticClassificationNormalizer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const ACTIVE_STAGE6A_PROMPT_PATH = path.resolve(REPO_ROOT, "functions/_prompts/diligence-v2/03A_LEGAL_CARTOGRAPHY.prompt.md");

function readDefaultSemanticPrompt() {
  try {
    const sourcePrompt = fs.readFileSync(ACTIVE_STAGE6A_PROMPT_PATH, "utf8").trim();
    if (sourcePrompt) return sourcePrompt;
  } catch {
    // Fall back to generated bundle when source prompt files are unavailable in a deployed package.
  }
  return DILIGENCE_PROMPT_BUNDLE.prompts?.stage6a_legal_document_cartography?.text || "";
}

function buildSemanticPrompt(promptText, packet) {
  return [
    String(promptText || "").trim(),
    "",
    "---CANONICAL_STAGE_6_SEMANTIC_PACKET---",
    JSON.stringify(packet, null, 2),
    "",
    "Return valid JSON only. Do not include Markdown fences, legal conclusions, quotes, report prose, or commentary outside JSON."
  ].join("\n");
}

function publicModelMetadata(result = {}) {
  return {
    pool: result?.model_meta?.pool || null,
    model: result?.model_meta?.selected_model || null,
    selected_model: result?.model_meta?.selected_model || null,
    selected_key_alias: result?.model_meta?.selected_key_alias || null,
    attempted_models: result?.attempts || [],
    fallback_used: result?.fallback_used === true,
    primary_error: result?.primary_error || null,
    usage_metadata: result?.usage_metadata || null,
    grounding_metadata: result?.grounding_metadata || null,
    repaired: result?.repaired === true
  };
}

function stage6Summary(stage6Review = {}, guardrail = null) {
  return {
    legal_document_inventory_count: stage6Review.legal_document_cartography?.legal_document_inventory?.length || 0,
    legal_document_index_count: stage6Review.legal_document_cartography?.legal_document_index?.length || 0,
    document_control_signal_map_count: stage6Review.legal_document_cartography?.document_control_signal_map?.length || 0,
    document_relationship_map_count: stage6Review.legal_document_cartography?.document_relationship_map?.length || 0,
    document_mismatch_signal_map_count: stage6Review.legal_document_cartography?.document_mismatch_signal_map?.length || 0,
    feature_to_legal_unit_index_count: stage6Review.stage7_navigation_index?.feature_to_legal_unit_index?.length || 0,
    control_family_index_count: stage6Review.stage7_navigation_index?.control_family_index?.length || 0,
    legal_unit_source_locator_index_count: stage6Review.stage7_navigation_index?.legal_unit_source_locator_index?.length || 0,
    guardrail_ok: guardrail?.ok ?? null,
    guardrail_critical_count: guardrail?.critical?.length || 0,
    guardrail_repair_count: guardrail?.repairs?.length || 0,
    guardrail_warning_count: guardrail?.warnings?.length || 0
  };
}

function guardrailFailure(stage6Review, guardrail, packetSummary = {}) {
  return {
    ok: false,
    error_type: "STAGE6_GUARDRAIL_VALIDATION_ERROR",
    error: "Stage 6A Legal Cartography failed canonical Stage 6 guardrails.",
    stage6_review: stage6Review,
    stage6_guardrail: guardrail,
    stage6_summary: stage6Summary(stage6Review, guardrail),
    packet_summary: packetSummary
  };
}

export async function runStage6ASemanticClassification({ input = {}, promptText = "", env = process.env, options = {} } = {}) {
  const semanticPromptText = String(promptText || readDefaultSemanticPrompt() || "").trim();
  if (!semanticPromptText) return { ok: false, error_type: "STAGE6_SEMANTIC_PROMPT_MISSING", error: "Stage 6 semantic prompt text is required." };

  const packet = buildStage6ASemanticClassificationPacket(input, {
    maxLegalUnits: options.maxLegalUnits || options.maxSections,
    textWindowChars: options.textWindowChars
  });
  const packetSummary = {
    document_inventory_seed_count: packet.document_inventory_seed.length,
    legal_unit_seed_count: packet.legal_unit_seed.length,
    deterministic_control_seed_count: packet.deterministic_control_seed.length,
    feature_ref_count: packet.feature_refs.length
  };

  const prompt = buildSemanticPrompt(semanticPromptText, packet);
  const runResult = await runGeminiPool({
    poolName: options.pool || "reasoning",
    prompt,
    env,
    options: {
      responseMimeType: "application/json",
      temperature: options.temperature ?? 0.05,
      maxOutputTokens: Number(options.maxOutputTokens || env.STAGE6_SEMANTIC_MAX_OUTPUT_TOKENS || 24000),
      timeoutMs: Number(options.timeoutMs || env.STAGE6_SEMANTIC_TIMEOUT_MS || 60000),
      maxAttempts: options.maxAttempts
    }
  });
  if (!runResult.ok) {
    return { ok: false, error_type: runResult.error_type || "STAGE6_SEMANTIC_MODEL_FAILED", error: runResult.error || "Stage 6 semantic model call failed.", packet_summary: packetSummary, model_metadata: publicModelMetadata(runResult) };
  }

  const rawClassification = runResult.json?.stage6_semantic_classification || runResult.json;
  const normalized = normalizeStage6ASemanticClassification(rawClassification, packet);
  const stage6Review = buildStage6ACartography(input, { normalized_semantic_classification: normalized.classification });
  const guardrail = validateStage6ReviewGuardrail(stage6Review, { input, stageId: "stage6a_legal_document_cartography", semanticModelAttempted: true });
  if (!guardrail.ok) return guardrailFailure(stage6Review, guardrail, packetSummary);

  return {
    ok: true,
    semantic_packet_version: packet.semantic_packet_version,
    raw_semantic_classification_version: rawClassification?.semantic_classification_version || null,
    normalized_semantic_classification: normalized.classification,
    semantic_classification_repairs: normalized.repairs,
    stage6_review: stage6Review,
    stage6_guardrail: guardrail,
    packet_summary: packetSummary,
    stage6_summary: stage6Summary(stage6Review, guardrail),
    model_metadata: publicModelMetadata(runResult)
  };
}

export async function runStage6ALegalCartography({
  source_bundle,
  target_profile,
  company_profile,
  target_feature_profile,
  evidence_junction,
  runtime_options = {},
  promptText = "",
  env = process.env
} = {}) {
  const input = { source_bundle, target_profile: target_profile || company_profile, company_profile: company_profile || target_profile, target_feature_profile, evidence_junction };
  const options = runtime_options || {};
  if (options.disableSemanticClassification === true || env.STAGE6_DISABLE_SEMANTIC_MODEL === "true") {
    const stage6Review = buildStage6ACartography(input);
    const guardrail = validateStage6ReviewGuardrail(stage6Review, { input, stageId: "stage6a_legal_document_cartography", semanticModelAttempted: false });
    const packetSummary = {
      document_inventory_seed_count: stage6Review.legal_document_cartography?.legal_document_inventory?.length || 0,
      legal_unit_seed_count: stage6Review.legal_document_cartography?.legal_document_index?.length || 0,
      deterministic_control_seed_count: stage6Review.legal_document_cartography?.document_control_signal_map?.length || 0,
      feature_ref_count: target_feature_profile?.feature_inventory?.length || 0
    };
    if (!guardrail.ok) return guardrailFailure(stage6Review, guardrail, packetSummary);
    return { ok: true, semantic_model_attempted: false, semantic_model_disabled: true, normalized_semantic_classification: null, semantic_classification_repairs: [], stage6_review: stage6Review, stage6_guardrail: guardrail, packet_summary: packetSummary, stage6_summary: stage6Summary(stage6Review, guardrail), model_metadata: null };
  }
  const result = await runStage6ASemanticClassification({ input, promptText, env, options });
  return { ...result, semantic_model_attempted: true };
}

export const stage6aSemanticClassificationRunnerInternals = { buildSemanticPrompt, publicModelMetadata, ACTIVE_STAGE6A_PROMPT_PATH };
