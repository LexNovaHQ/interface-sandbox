import { runGeminiPool } from "../gemini/geminiPool.js";
import { buildStage6ACartography } from "./stage6aLegalCartographyMerge.js";
import { buildStage6AModelOverlayPacket } from "./stage6aModelOverlayPacketBuilder.js";
import { normalizeStage6AModelOverlay } from "./stage6aModelOverlayNormalizer.js";

function buildOverlayPrompt(promptText, packet) {
  return [
    String(promptText || "").trim(),
    "",
    "---INPUT_JSON---",
    JSON.stringify(packet, null, 2),
    "",
    "Return valid JSON only. Do not include Markdown fences or commentary outside JSON."
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

export async function runStage6AModelOverlay({ input = {}, promptText = "", env = process.env, options = {} } = {}) {
  if (!String(promptText || "").trim()) {
    return { ok: false, error_type: "STAGE6A_OVERLAY_PROMPT_MISSING", error: "Stage 6A model overlay prompt text is required." };
  }
  const packet = buildStage6AModelOverlayPacket(input, {
    maxSections: options.maxSections,
    textWindowChars: options.textWindowChars
  });
  const prompt = buildOverlayPrompt(promptText, packet);
  const runResult = await runGeminiPool({
    poolName: options.pool || "reasoning",
    prompt,
    env,
    options: {
      responseMimeType: "application/json",
      temperature: options.temperature ?? 0.05,
      maxOutputTokens: Number(options.maxOutputTokens || env.STAGE6A_OVERLAY_MAX_OUTPUT_TOKENS || 24000),
      timeoutMs: Number(options.timeoutMs || env.STAGE6A_OVERLAY_TIMEOUT_MS || 60000),
      maxAttempts: options.maxAttempts
    }
  });
  if (!runResult.ok) {
    return {
      ok: false,
      error_type: runResult.error_type || "STAGE6A_OVERLAY_MODEL_FAILED",
      error: runResult.error || "Stage 6A overlay model call failed.",
      packet_summary: {
        document_inventory_seed_count: packet.document_inventory_seed.length,
        section_index_seed_count: packet.section_index_seed.length,
        deterministic_control_seed_count: packet.deterministic_control_seed.length,
        feature_ref_count: packet.feature_refs.length
      },
      model_metadata: publicModelMetadata(runResult)
    };
  }
  const rawOverlay = runResult.json?.stage6a_model_overlay || runResult.json;
  const normalized = normalizeStage6AModelOverlay(rawOverlay, packet);
  const cartography = buildStage6ACartography(input, { normalized_overlay: normalized.overlay });
  return {
    ok: true,
    overlay_packet_version: packet.overlay_packet_version,
    raw_overlay_version: rawOverlay?.stage6a_model_overlay_version || null,
    normalized_overlay: normalized.overlay,
    overlay_repairs: normalized.repairs,
    cartography,
    packet_summary: {
      document_inventory_seed_count: packet.document_inventory_seed.length,
      section_index_seed_count: packet.section_index_seed.length,
      deterministic_control_seed_count: packet.deterministic_control_seed.length,
      feature_ref_count: packet.feature_refs.length
    },
    cartography_summary: {
      legal_document_inventory_count: cartography.legal_document_cartography?.legal_document_inventory?.length || 0,
      legal_document_index_count: cartography.legal_document_cartography?.legal_document_index?.length || 0,
      document_control_signal_map_count: cartography.legal_document_cartography?.document_control_signal_map?.length || 0,
      document_relationship_map_count: cartography.legal_document_cartography?.document_relationship_map?.length || 0,
      document_mismatch_signal_map_count: cartography.legal_document_cartography?.document_mismatch_signal_map?.length || 0,
      feature_to_document_section_index_count: cartography.stage7_navigation_index?.feature_to_document_section_index?.length || 0,
      control_family_index_count: cartography.stage7_navigation_index?.control_family_index?.length || 0,
      source_locator_index_count: cartography.stage7_navigation_index?.document_source_locator_index?.length || 0
    },
    model_metadata: publicModelMetadata(runResult)
  };
}

export const stage6aModelOverlayRunnerInternals = { buildOverlayPrompt, publicModelMetadata };
