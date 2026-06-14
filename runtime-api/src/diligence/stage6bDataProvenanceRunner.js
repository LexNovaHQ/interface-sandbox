import { DILIGENCE_PROMPT_BUNDLE } from "../../functions/_generated/diligencePromptBundle.js";
import { runGeminiPool } from "../gemini/geminiPool.js";
import { formatSchemaErrors, validateDiligenceStageOutput } from "./stageSchemaValidator.js";
import { buildStage6BDataProvenance } from "./stage6bDataProvenanceMerge.js";
import { buildStage6BSemanticPacket } from "./stage6bSemanticPacketBuilder.js";
import { normalizeStage5FeatureProfile } from "./stage6bDataProvenanceBuilder.js";
import { normalizeStage6BDataProvenanceClassification } from "./stage6bDataProvenanceNormalizer.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function readDefaultSemanticPrompt() {
  return DILIGENCE_PROMPT_BUNDLE.prompts?.stage6b_data_provenance?.text || "";
}

function buildSemanticPrompt(promptText, packet) {
  return [
    String(promptText || "").trim(),
    "",
    "---CANONICAL_STAGE_6B_SEMANTIC_PACKET---",
    JSON.stringify(packet, null, 2),
    "",
    "Return valid JSON only. Do not include Markdown fences, legal conclusions, quotes, report prose, or commentary outside JSON."
  ].join("\n");
}

function dataProvenanceCount(input = {}) {
  const profile = normalizeStage5FeatureProfile(input);
  if (Array.isArray(profile.data_provenance_map) && profile.data_provenance_map.length) return profile.data_provenance_map.length;
  return asArray(profile.feature_inventory).reduce((count, feature) => count + asArray(feature?.data_provenance).length, 0);
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

function stage6Summary(stage6Review = {}) {
  const rows = stage6Review.data_provenance_profile?.data_flow_profile || [];
  return {
    data_flow_profile_count: rows.length,
    feature_to_data_flow_index_count: stage6Review.stage7_navigation_index?.feature_to_data_flow_index?.length || 0,
    data_signal_index_count: stage6Review.stage7_navigation_index?.data_signal_index?.length || 0,
    data_profile_limitation_count: stage6Review.data_provenance_profile?.data_profile_limitations?.length || 0
  };
}

function validateFinalStage6B(stage6Review, input = {}) {
  const stage5Rows = dataProvenanceCount(input);
  const stage6Rows = stage6Review?.data_provenance_profile?.data_flow_profile?.length || 0;
  if (stage5Rows > 0 && stage6Rows === 0) {
    return {
      ok: false,
      error_type: "STAGE6B_CRITICAL_EMPTY_DATA_FLOW_PROFILE",
      error: "Stage 5 data_provenance_map rows exist but Stage 6B produced an empty data_flow_profile."
    };
  }
  const validation = validateDiligenceStageOutput("stage6Review", stage6Review);
  if (!validation.ok) {
    return {
      ok: false,
      error_type: "SCHEMA_VALIDATION_ERROR",
      error: "Stage 6B Data Provenance output failed schema validation",
      validation,
      error_summary: formatSchemaErrors(validation.errors)
    };
  }
  return { ok: true, validation };
}

export async function runStage6BDataProvenanceClassification({ input = {}, promptText = "", env = process.env, options = {} } = {}) {
  const semanticPromptText = String(promptText || readDefaultSemanticPrompt() || "").trim();
  if (!semanticPromptText) {
    return { ok: false, error_type: "STAGE6B_SEMANTIC_PROMPT_MISSING", error: "Stage 6B semantic prompt text is required." };
  }
  const packet = buildStage6BSemanticPacket(input, {
    maxDataFlows: options.maxDataFlows,
    textWindowChars: options.textWindowChars
  });
  const prompt = buildSemanticPrompt(semanticPromptText, packet);
  const runResult = await runGeminiPool({
    poolName: options.pool || "reasoning",
    prompt,
    env,
    options: {
      responseMimeType: "application/json",
      temperature: options.temperature ?? 0.05,
      maxOutputTokens: Number(options.maxOutputTokens || env.STAGE6B_SEMANTIC_MAX_OUTPUT_TOKENS || 24000),
      timeoutMs: Number(options.timeoutMs || env.STAGE6B_SEMANTIC_TIMEOUT_MS || 90000),
      maxAttempts: options.maxAttempts
    }
  });
  if (!runResult.ok) {
    return {
      ok: false,
      error_type: runResult.error_type || "STAGE6B_SEMANTIC_MODEL_FAILED",
      error: runResult.error || "Stage 6B semantic model call failed.",
      packet_summary: {
        data_flow_seed_count: packet.data_flow_seed.length,
        feature_ref_count: packet.feature_refs.length,
        provenance_ref_count: packet.provenance_refs.length,
        source_ref_count: packet.source_refs.length
      },
      model_metadata: publicModelMetadata(runResult)
    };
  }
  const rawClassification = runResult.json?.stage6_semantic_classification || runResult.json;
  const normalized = normalizeStage6BDataProvenanceClassification(rawClassification, packet);
  const stage6Review = buildStage6BDataProvenance(input, { normalized_semantic_classification: normalized.classification });
  const finalValidation = validateFinalStage6B(stage6Review, input);
  if (!finalValidation.ok) {
    return {
      ok: false,
      ...finalValidation,
      packet_summary: {
        data_flow_seed_count: packet.data_flow_seed.length,
        feature_ref_count: packet.feature_refs.length,
        provenance_ref_count: packet.provenance_refs.length,
        source_ref_count: packet.source_refs.length
      },
      normalized_semantic_classification: normalized.classification,
      semantic_classification_repairs: normalized.repairs,
      model_metadata: publicModelMetadata(runResult)
    };
  }
  return {
    ok: true,
    semantic_packet_version: packet.semantic_packet_version,
    raw_semantic_classification_version: rawClassification?.semantic_classification_version || null,
    normalized_semantic_classification: normalized.classification,
    semantic_classification_repairs: normalized.repairs,
    stage6_review: stage6Review,
    packet_summary: {
      data_flow_seed_count: packet.data_flow_seed.length,
      feature_ref_count: packet.feature_refs.length,
      provenance_ref_count: packet.provenance_refs.length,
      source_ref_count: packet.source_refs.length
    },
    stage6_summary: stage6Summary(stage6Review),
    validation: finalValidation.validation,
    model_metadata: publicModelMetadata(runResult)
  };
}

export async function runStage6BDataProvenance({
  source_bundle,
  target_profile,
  company_profile,
  target_feature_profile,
  evidence_junction,
  runtime_options = {},
  promptText = "",
  env = process.env
} = {}) {
  const input = {
    source_bundle,
    target_profile: target_profile || company_profile,
    company_profile: company_profile || target_profile,
    target_feature_profile,
    evidence_junction
  };
  const options = runtime_options || {};
  if (options.disableSemanticClassification === true || env.STAGE6_DISABLE_SEMANTIC_MODEL === "true") {
    const stage6Review = buildStage6BDataProvenance(input);
    const finalValidation = validateFinalStage6B(stage6Review, input);
    if (!finalValidation.ok) return { ok: false, ...finalValidation, stage6_review: stage6Review, stage6_summary: stage6Summary(stage6Review) };
    return {
      ok: true,
      semantic_model_attempted: false,
      semantic_model_disabled: true,
      normalized_semantic_classification: null,
      semantic_classification_repairs: [],
      stage6_review: stage6Review,
      packet_summary: {
        data_flow_seed_count: stage6Review.data_provenance_profile?.data_flow_profile?.length || 0,
        feature_ref_count: target_feature_profile?.feature_inventory?.length || 0,
        provenance_ref_count: dataProvenanceCount(input),
        source_ref_count: 0
      },
      stage6_summary: stage6Summary(stage6Review),
      validation: finalValidation.validation,
      model_metadata: null
    };
  }
  const result = await runStage6BDataProvenanceClassification({
    input,
    promptText,
    env,
    options
  });
  return {
    ...result,
    semantic_model_attempted: true
  };
}

export const stage6bDataProvenanceRunnerInternals = {
  buildSemanticPrompt,
  dataProvenanceCount,
  validateFinalStage6B
};
