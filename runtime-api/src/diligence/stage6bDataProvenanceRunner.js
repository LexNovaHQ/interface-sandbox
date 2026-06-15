import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DILIGENCE_PROMPT_BUNDLE } from "../../functions/_generated/diligencePromptBundle.js";
import { runGeminiPool } from "../gemini/geminiPool.js";
import { validateStage6ReviewGuardrail } from "./guardrails/stage6ReviewGuardrail.js";
import { formatSchemaErrors, validateDiligenceStageOutput } from "./stageSchemaValidator.js";
import { buildStage6ALegalCartographySkeleton } from "./stage6aLegalCartographyBuilder.js";
import { buildStage6BDataProvenance } from "./stage6bDataProvenanceMerge.js";
import { finalizeStage6BDataProvenance } from "./stage6bDataProvenanceFinalizer.js";
import { buildStage6BSemanticPacket } from "./stage6bSemanticPacketBuilder.js";
import { normalizeStage5FeatureProfile } from "./stage6bDataProvenanceBuilder.js";
import { normalizeStage6BDataProvenanceClassification } from "./stage6bDataProvenanceNormalizer.js";
import { buildTargetDataProvenanceProfile } from "./stage6bTargetDataProvenanceProfile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const ACTIVE_STAGE6B_PROMPT_PATH = path.resolve(REPO_ROOT, "functions/_prompts/diligence-v2/03B_DATA_PROVENANCE.prompt.md");
const STAGE6B_FIELD_DERIVATION_PATH = path.resolve(REPO_ROOT, "docs/contracts/STAGE6B_FIELD_DERIVATION_INSTRUCTIONS_v1.md");

function asArray(value) { return Array.isArray(value) ? value : []; }
function asObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

function readDefaultSemanticPrompt() { try { const sourcePrompt = fs.readFileSync(ACTIVE_STAGE6B_PROMPT_PATH, "utf8").trim(); if (sourcePrompt) return sourcePrompt; } catch {} return DILIGENCE_PROMPT_BUNDLE.prompts?.stage6b_data_provenance?.text || ""; }
function readStage6BDerivationInstructions() { try { const text = fs.readFileSync(STAGE6B_FIELD_DERIVATION_PATH, "utf8").trim(); return text ? `---STAGE6B_FIELD_DERIVATION_INSTRUCTIONS_V1---\n${text}` : ""; } catch { return ""; } }
function withStage6BDerivationInstructions(promptText = "") { const base = String(promptText || "").trim(); const derivation = readStage6BDerivationInstructions(); if (!derivation || base.includes("STAGE6B_FIELD_DERIVATION_INSTRUCTIONS_V1")) return base; return [base, "", derivation].filter(Boolean).join("\n"); }
function buildSemanticPrompt(promptText, packet) { return [withStage6BDerivationInstructions(promptText), "", "---CANONICAL_STAGE_6B_SEMANTIC_PACKET---", JSON.stringify(packet, null, 2), "", "Return valid JSON only. Do not include Markdown fences, legal conclusions, quotes, report prose, or commentary outside JSON."].join("\n"); }

function dataProvenanceCount(input = {}) { const profile = normalizeStage5FeatureProfile(input); if (Array.isArray(profile.data_provenance_map) && profile.data_provenance_map.length) return profile.data_provenance_map.length; return asArray(profile.feature_inventory).reduce((count, feature) => count + asArray(feature?.data_provenance).length, 0); }
function publicModelMetadata(result = {}) { return { pool: result?.model_meta?.pool || null, model: result?.model_meta?.selected_model || null, selected_model: result?.model_meta?.selected_model || null, selected_key_alias: result?.model_meta?.selected_key_alias || null, attempted_models: result?.attempts || [], fallback_used: result?.fallback_used === true, primary_error: result?.primary_error || null, usage_metadata: result?.usage_metadata || null, grounding_metadata: result?.grounding_metadata || null, repaired: result?.repaired === true }; }
function stage6Summary(stage6Review = {}, guardrail = null) { const rows = stage6Review.data_provenance_profile?.data_flow_profile || []; return { data_flow_profile_count: rows.length, feature_to_data_flow_index_count: stage6Review.stage7_navigation_index?.feature_to_data_flow_index?.length || 0, data_signal_index_count: stage6Review.stage7_navigation_index?.data_signal_index?.length || 0, data_profile_limitation_count: stage6Review.data_provenance_profile?.data_profile_limitations?.length || 0, guardrail_ok: guardrail?.ok ?? null, guardrail_critical_count: guardrail?.critical?.length || 0, guardrail_repair_count: guardrail?.repairs?.length || 0, guardrail_warning_count: guardrail?.warnings?.length || 0 }; }
function packetSummaryFromPacket(packet) { return { data_flow_seed_count: packet.data_flow_seed.length, feature_ref_count: packet.feature_refs.length, provenance_ref_count: packet.provenance_refs.length, source_ref_count: packet.source_refs.length, legal_governance_lossless_source_count: packet.legal_governance_lossless_sources?.length || 0, legal_unit_ref_count: packet.stage6a_legal_cartography_refs?.legal_unit_source_locator_index?.length || 0 }; }

function validateFinalStage6B(stage6Review, input = {}, semanticModelAttempted = null) {
  const stage5Rows = dataProvenanceCount(input);
  const stage6Rows = stage6Review?.data_provenance_profile?.data_flow_profile?.length || 0;
  if (stage5Rows > 0 && stage6Rows === 0) return { ok: false, error_type: "STAGE6B_CRITICAL_EMPTY_DATA_FLOW_PROFILE", error: "Stage 5 data_provenance_map rows exist but Stage 6B produced an empty data_flow_profile." };
  const validation = validateDiligenceStageOutput("stage6Review", stage6Review);
  if (!validation.ok) return { ok: false, error_type: "SCHEMA_VALIDATION_ERROR", error: "Stage 6B Data Provenance output failed schema validation", validation, error_summary: formatSchemaErrors(validation.errors) };
  const guardrail = validateStage6ReviewGuardrail(stage6Review, { input, stageId: "stage6b_data_provenance", semanticModelAttempted });
  if (!guardrail.ok) return { ok: false, error_type: "STAGE6_GUARDRAIL_VALIDATION_ERROR", error: "Stage 6B Data Provenance failed canonical Stage 6 guardrails.", validation, guardrail, error_summary: formatSchemaErrors(guardrail.errors) };
  return { ok: true, validation, guardrail };
}

function buildTargetDataProfile(stage6Review, input, normalized = null) { return buildTargetDataProvenanceProfile({ targetFeatureProfile: input.target_feature_profile, stage6bReview: stage6Review, legalDocumentCartography: input.legal_document_cartography || input.stage6a_review?.legal_document_cartography || {}, normalizedClassification: normalized }); }

export async function runStage6BDataProvenanceClassification({ input = {}, promptText = "", env = process.env, options = {} } = {}) {
  const semanticPromptText = String(promptText || readDefaultSemanticPrompt() || "").trim();
  if (!semanticPromptText) return { ok: false, error_type: "STAGE6B_SEMANTIC_PROMPT_MISSING", error: "Stage 6B semantic prompt text is required." };
  const packet = buildStage6BSemanticPacket(input, { maxDataFlows: options.maxDataFlows, textWindowChars: options.textWindowChars });
  const packetSummary = packetSummaryFromPacket(packet);
  const prompt = buildSemanticPrompt(semanticPromptText, packet);
  const runResult = await runGeminiPool({ poolName: options.pool || "reasoning", prompt, env, options: { responseMimeType: "application/json", temperature: options.temperature ?? 0.05, maxOutputTokens: Number(options.maxOutputTokens || env.STAGE6B_SEMANTIC_MAX_OUTPUT_TOKENS || 24000), timeoutMs: Number(options.timeoutMs || env.STAGE6B_SEMANTIC_TIMEOUT_MS || 90000), maxAttempts: options.maxAttempts } });
  if (!runResult.ok) return { ok: false, error_type: runResult.error_type || "STAGE6B_SEMANTIC_MODEL_FAILED", error: runResult.error || "Stage 6B semantic model call failed.", packet_summary: packetSummary, model_metadata: publicModelMetadata(runResult) };
  const rawClassification = runResult.json?.stage6_semantic_classification || runResult.json;
  const normalized = normalizeStage6BDataProvenanceClassification(rawClassification, packet);
  const built = buildStage6BDataProvenance(input, { normalized_semantic_classification: normalized.classification });
  const finalized = finalizeStage6BDataProvenance(built, input);
  const stage6Review = finalized.stage6_review;
  const targetDataProvenanceProfile = buildTargetDataProfile(stage6Review, input, normalized.classification);
  const finalValidation = validateFinalStage6B(stage6Review, input, true);
  if (!finalValidation.ok) return { ok: false, ...finalValidation, stage6_review: stage6Review, target_data_provenance_profile: targetDataProvenanceProfile, legal_governance_prefill: finalized.legal_governance_prefill, stage6_guardrail: finalValidation.guardrail || null, stage6_summary: stage6Summary(stage6Review, finalValidation.guardrail), packet_summary: packetSummary, normalized_semantic_classification: normalized.classification, semantic_classification_repairs: normalized.repairs, model_metadata: publicModelMetadata(runResult) };
  return { ok: true, semantic_packet_version: packet.semantic_packet_version, raw_semantic_classification_version: rawClassification?.semantic_classification_version || null, normalized_semantic_classification: normalized.classification, semantic_classification_repairs: normalized.repairs, stage6_review: stage6Review, target_data_provenance_profile: targetDataProvenanceProfile, legal_governance_prefill: finalized.legal_governance_prefill, stage6_guardrail: finalValidation.guardrail, packet_summary: packetSummary, stage6_summary: stage6Summary(stage6Review, finalValidation.guardrail), validation: finalValidation.validation, model_metadata: publicModelMetadata(runResult) };
}

function resolveLegalCartography(input = {}) {
  const existing = input.legal_document_cartography || input.stage6a_review?.legal_document_cartography || input.stage6a?.legal_document_cartography || input.stage6a_result?.stage6_review?.legal_document_cartography;
  if (existing) return existing;
  try { return buildStage6ALegalCartographySkeleton(input).legal_document_cartography || null; } catch { return null; }
}

export async function runStage6BDataProvenance({ source_bundle, target_profile, company_profile, target_feature_profile, evidence_junction, legal_document_cartography, stage6a_review, runtime_options = {}, promptText = "", env = process.env } = {}) {
  const baseInput = { source_bundle, target_profile: target_profile || company_profile, company_profile: company_profile || target_profile, target_feature_profile, evidence_junction, legal_document_cartography, stage6a_review };
  const input = { ...baseInput, legal_document_cartography: resolveLegalCartography(baseInput) || legal_document_cartography || null };
  const options = runtime_options || {};
  const deterministicOnlyAllowed = env.STAGE6_ALLOW_DETERMINISTIC_ONLY === "true";
  if (deterministicOnlyAllowed && options.disableSemanticClassification === true) {
    const built = buildStage6BDataProvenance(input);
    const finalized = finalizeStage6BDataProvenance(built, input);
    const stage6Review = finalized.stage6_review;
    const targetDataProvenanceProfile = buildTargetDataProfile(stage6Review, input, null);
    const finalValidation = validateFinalStage6B(stage6Review, input, false);
    if (!finalValidation.ok) return { ok: false, ...finalValidation, stage6_review: stage6Review, target_data_provenance_profile: targetDataProvenanceProfile, legal_governance_prefill: finalized.legal_governance_prefill, stage6_guardrail: finalValidation.guardrail || null, stage6_summary: stage6Summary(stage6Review, finalValidation.guardrail) };
    return { ok: true, semantic_model_attempted: false, semantic_model_disabled: true, normalized_semantic_classification: null, semantic_classification_repairs: [], stage6_review: stage6Review, target_data_provenance_profile: targetDataProvenanceProfile, legal_governance_prefill: finalized.legal_governance_prefill, stage6_guardrail: finalValidation.guardrail, packet_summary: { data_flow_seed_count: stage6Review.data_provenance_profile?.data_flow_profile?.length || 0, feature_ref_count: target_feature_profile?.feature_inventory?.length || 0, provenance_ref_count: dataProvenanceCount(input), source_ref_count: 0 }, stage6_summary: stage6Summary(stage6Review, finalValidation.guardrail), validation: finalValidation.validation, model_metadata: null };
  }
  const result = await runStage6BDataProvenanceClassification({ input, promptText, env, options: { ...options, disableSemanticClassification: false } });
  return { ...result, semantic_model_attempted: true };
}

export const stage6bDataProvenanceRunnerInternals = { buildSemanticPrompt, dataProvenanceCount, validateFinalStage6B, ACTIVE_STAGE6B_PROMPT_PATH, STAGE6B_FIELD_DERIVATION_PATH, withStage6BDerivationInstructions, resolveLegalCartography };
