import { runGeminiPool } from "../gemini/geminiPool.js";
import { validateDiligenceStageOutput } from "./stageSchemaValidator.js";
import { validateTargetFeatureProfileGuardrails } from "./targetFeatureProfileGuardrails.js";
import {
  STAGE5_COMPATIBILITY_TERMS,
  canonicalCandidateCluster
} from "./stage5TargetFeaturePackageBuilder.js";

const ARCHETYPES = Object.freeze({
  UNI: { label: "Universal", detection_logic: "No archetype gate — applies to every product regardless of behavior." },
  DOE: { label: "The Doer", detection_logic: "Product takes autonomous actions in the world on a user's behalf without per-action human approval." },
  JDG: { label: "The Judge", detection_logic: "Product outputs a consequential decision or score about a human that gates access to something." },
  CMP: { label: "The Companion", detection_logic: "Product forms an ongoing emotional or relational bond with the user as a primary function." },
  CRT: { label: "The Creator", detection_logic: "Product generates new copyrightable or synthetic output as its primary output." },
  RDR: { label: "The Reader", detection_logic: "Product ingests third-party data it does not own to function." },
  ORC: { label: "The Orchestrator", detection_logic: "Product routes requests across multiple models, tools, agents, workflows, or sub-processors dynamically." },
  TRN: { label: "The Translator", detection_logic: "Product processes biometric or audio signals as input or performs speech/translation/transformation workflows." },
  SHD: { label: "The Shield", detection_logic: "Product is deployed to defend or monitor a system for security purposes." },
  OPT: { label: "The Optimizer", detection_logic: "Product runs high-stakes optimization where its output directly moves money or controls operations." },
  MOV: { label: "The Mover", detection_logic: "Product governs a physical system that can act on or in the physical world." }
});

const SURFACES = Object.freeze({
  "Consumer-Public": "Product is consumer-facing / publicly accessible.",
  "Enterprise-Private": "Product sold B2B / behind enterprise contracts.",
  PII: "Handles personally identifiable information.",
  Employment: "Touches hiring, HR, or workforce decisions.",
  "Sensitive/Biometric": "Processes biometric or special-category data.",
  Financial: "Touches financial markets, payments, or money movement.",
  "Content&IP": "Generates, ingests, or stores copyrightable content.",
  "Safety&Physical": "Can cause physical harm or governs physical systems.",
  Infrastructure: "Operates critical or backbone infrastructure.",
  Minors: "Accessible to or directed at users under 18."
});

const CLUSTER_LABELS = Object.freeze({
  text_to_speech: "Text-to-Speech API",
  speech_to_text: "Speech-to-Text API",
  translation: "Translation API",
  dubbing: "AI Dubbing",
  document_digitisation: "Document Digitisation / OCR",
  voice_agent: "Voice AI Agents",
  language_model: "Language Model Access",
  embeddings: "Embeddings API",
  integration_connector: "Integration / Connector Capability",
  model_catalog: "Model Catalog",
  api_platform: "Developer API Platform"
});

const CLUSTER_DEFAULTS = Object.freeze({
  text_to_speech: {
    input_signal: "text or prompt content",
    system_action: "converts text into synthetic speech or spoken audio",
    output_signal: "generated audio",
    archetypes: ["TRN", "CRT"],
    surfaces: ["Sensitive/Biometric", "Content&IP", "Enterprise-Private"],
    data_category: "text",
    output_data: ["generated audio"],
    processing_action: ["speech synthesis", "audio generation"]
  },
  speech_to_text: {
    input_signal: "speech or audio",
    system_action: "transcribes speech/audio into text",
    output_signal: "text transcript",
    archetypes: ["TRN", "RDR"],
    surfaces: ["Sensitive/Biometric", "Content&IP", "Enterprise-Private"],
    data_category: "audio",
    output_data: ["text transcript"],
    processing_action: ["speech recognition", "transcription"]
  },
  translation: {
    input_signal: "source text or speech",
    system_action: "translates content between languages",
    output_signal: "translated text or speech",
    archetypes: ["TRN", "CRT"],
    surfaces: ["Content&IP", "Enterprise-Private"],
    data_category: "text",
    output_data: ["translated content"],
    processing_action: ["translation"]
  },
  dubbing: {
    input_signal: "audio/video or script content",
    system_action: "generates dubbed speech in another language or voice",
    output_signal: "dubbed audio/video output",
    archetypes: ["TRN", "CRT"],
    surfaces: ["Sensitive/Biometric", "Content&IP", "Enterprise-Private"],
    data_category: "audio",
    output_data: ["dubbed audio", "translated media"],
    processing_action: ["audio transformation", "dubbing"]
  },
  document_digitisation: {
    input_signal: "documents or scanned files",
    system_action: "extracts, parses, or digitises document content",
    output_signal: "structured text or extracted document data",
    archetypes: ["RDR"],
    surfaces: ["Content&IP", "PII", "Enterprise-Private"],
    data_category: "document",
    output_data: ["extracted text", "structured document data"],
    processing_action: ["OCR", "document extraction", "document parsing"]
  },
  voice_agent: {
    input_signal: "voice conversation or call audio",
    system_action: "conducts voice-based conversational or agent workflow",
    output_signal: "spoken response or workflow action",
    archetypes: ["TRN", "ORC", "CRT"],
    surfaces: ["Sensitive/Biometric", "PII", "Enterprise-Private"],
    data_category: "audio",
    output_data: ["spoken response", "conversation transcript"],
    processing_action: ["voice interaction", "agentic conversation"]
  },
  language_model: {
    input_signal: "prompt or text input",
    system_action: "generates or transforms language output",
    output_signal: "generated text or model response",
    archetypes: ["CRT", "RDR"],
    surfaces: ["Content&IP", "Enterprise-Private"],
    data_category: "prompt",
    output_data: ["generated text"],
    processing_action: ["text generation", "language transformation"]
  },
  embeddings: {
    input_signal: "text or document content",
    system_action: "converts content into vector embeddings",
    output_signal: "embedding vectors",
    archetypes: ["RDR"],
    surfaces: ["Content&IP", "Enterprise-Private", "Infrastructure"],
    data_category: "text",
    output_data: ["embedding vectors"],
    processing_action: ["embedding generation", "semantic encoding"]
  },
  integration_connector: {
    input_signal: "workflow or integration event",
    system_action: "connects or routes functionality across systems",
    output_signal: "integration or workflow result",
    archetypes: ["ORC"],
    surfaces: ["Infrastructure", "Enterprise-Private"],
    data_category: "api_payload",
    output_data: ["workflow payload"],
    processing_action: ["integration routing"]
  },
  model_catalog: {
    input_signal: "developer model selection or model request",
    system_action: "exposes available models for product/API use",
    output_signal: "selected model capability or model response",
    archetypes: ["UNI"],
    surfaces: ["Infrastructure", "Enterprise-Private"],
    data_category: "api_payload",
    output_data: ["model response"],
    processing_action: ["model access"]
  },
  api_platform: {
    input_signal: "developer API request",
    system_action: "exposes product capabilities through API endpoints or SDKs",
    output_signal: "API response",
    archetypes: ["UNI"],
    surfaces: ["Infrastructure", "Enterprise-Private"],
    data_category: "api_payload",
    output_data: ["API response"],
    processing_action: ["API processing"]
  }
});

function asArray(value) { return Array.isArray(value) ? value : []; }
function asText(value, fallback = "") { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function unique(values = []) { return [...new Set(asArray(values).map((value) => String(value || "").trim()).filter(Boolean))]; }
function lower(value) { return String(value || "").toLowerCase(); }
function nowIso() { return new Date().toISOString(); }

function sourceId(record = {}) { return asText(record.source_id || record.evidence_source_id); }
function sourceUrl(record = {}) { return asText(record.source_url || record.final_url || record.url, "unknown"); }
function sourceFamily(record = {}) { return asText(record.source_family, "unknown"); }
function titleOf(record = {}) { return asText(record.title || record.structure?.title); }

function sourceRecords(stage5Input = {}) {
  const records = [];
  const add = (record) => {
    if (!record || typeof record !== "object") return;
    const id = sourceId(record);
    const url = sourceUrl(record);
    const key = id || url;
    if (!key || records.some((row) => (sourceId(row) || sourceUrl(row)) === key)) return;
    records.push(record);
  };
  for (const listName of [
    "product_family_primary_sources",
    "product_family_secondary_sources",
    "product_family_supporting_sources",
    "product_family_duplicate_sources",
    "product_family_discovery_sources",
    "product_family_non_feature_context_sources"
  ]) for (const record of asArray(stage5Input[listName])) add(record);
  for (const record of asArray(stage5Input?.source_bundle?.evidence_buffer)) add(record);
  for (const record of asArray(stage5Input?.source_bundle?.source_records)) add(record);
  return records;
}

function sourceMap(stage5Input = {}) {
  const map = new Map();
  for (const record of sourceRecords(stage5Input)) {
    const id = sourceId(record);
    if (id && !map.has(id)) map.set(id, record);
  }
  return map;
}

function fallbackEvidenceRefs(sourceIds = [], candidates = []) {
  const refs = unique(candidates.flatMap((candidate) => asArray(candidate.evidence_refs)));
  if (refs.length) return refs;
  const first = unique(sourceIds)[0];
  return first ? [`${first}#C001`] : ["SRC_UNKNOWN#C001"];
}

function candidateCluster(candidate = {}) {
  const cluster = canonicalCandidateCluster(candidate);
  return STAGE5_COMPATIBILITY_TERMS[cluster] ? cluster : "api_platform";
}

function clusterName(cluster) { return CLUSTER_LABELS[cluster] || cluster.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" "); }
function clusterDefaults(cluster) { return CLUSTER_DEFAULTS[cluster] || CLUSTER_DEFAULTS.api_platform; }

function companyRef(stage5Input = {}) {
  const profile = stage5Input.target_profile || stage5Input.company_profile || stage5Input.target_profile_ref || {};
  const identity = profile.identity || {};
  return {
    target_profile_version: asText(profile.target_profile_version, "target_profile_v2"),
    brand_name: asText(identity.brand_name || profile.brand_name || stage5Input?.target_input?.company_name, "Unknown target"),
    legal_name: asText(identity.legal_name || profile.legal_name, ""),
    domain: asText(identity.domain || identity.website || profile.domain || stage5Input?.target_input?.primary_url, "")
  };
}

function buildMasterInstructionPlan(stage5Input = {}) {
  const records = sourceRecords(stage5Input);
  const candidates = asArray(stage5Input?.target_feature_candidate_index?.candidates);
  const clusters = unique([
    ...asArray(stage5Input.stage5_candidate_clusters).map((row) => row?.canonical_function_cluster),
    ...candidates.map(candidateCluster)
  ]).filter((cluster) => STAGE5_COMPATIBILITY_TERMS[cluster]);
  return {
    stage5_instruction_plan_version: "stage5_instruction_plan_v1",
    generated_at: nowIso(),
    source_density: {
      total_stage5_sources: records.length,
      product_family_primary_source_count: asArray(stage5Input.product_family_primary_sources).length,
      product_family_secondary_source_count: asArray(stage5Input.product_family_secondary_sources).length,
      product_family_supporting_source_count: asArray(stage5Input.product_family_supporting_sources).length,
      deterministic_candidate_count: candidates.length,
      deterministic_cluster_count: clusters.length
    },
    execution_plan: { run_5a: true, run_5b: true, run_5c: true, run_5d: true, run_5e: true },
    baseline_sources: "docs/contracts/STAGE5_FIELD_DERIVATION_INSTRUCTIONS_v2.md + data/runtime/registry_key.runtime.json + runtime candidate/source package",
    substage_instruction_refs: {
      "5a": "stage5a_product_function_extraction_instruction_packet",
      "5b": "stage5b_archetype_surface_tagging_instruction_packet",
      "5d": "stage5d_feature_data_touchpoint_instruction_packet"
    },
    controlled_values: { archetypes: Object.keys(ARCHETYPES), surfaces: Object.keys(SURFACES) },
    candidate_clusters: clusters
  };
}

function compactEvidencePacket(stage5Input = {}) {
  const sMap = sourceMap(stage5Input);
  const candidates = asArray(stage5Input?.target_feature_candidate_index?.candidates).map((candidate) => {
    const sid = asText(candidate.source_id);
    const src = sid ? sMap.get(sid) : null;
    return {
      candidate_id: candidate.candidate_id || null,
      candidate_cluster: candidateCluster(candidate),
      raw_label: candidate.raw_label || candidate.candidate_label || candidate.normalized_label || null,
      source_id: sid || null,
      source_url: candidate.source_url || (src ? sourceUrl(src) : null),
      source_role: candidate.source_role || src?.source_role || src?.stage5_source_role || null,
      evidence_refs: asArray(candidate.evidence_refs)
    };
  });
  return {
    target_profile_ref: companyRef(stage5Input),
    candidates,
    source_records: sourceRecords(stage5Input).map((record) => ({
      source_id: sourceId(record),
      source_url: sourceUrl(record),
      source_family: sourceFamily(record),
      source_role: record.source_role || record.stage5_source_role || null,
      candidate_cluster: record.candidate_cluster || null,
      title: titleOf(record)
    }))
  };
}

async function runJsonModel({ prompt, poolName, maxOutputTokens, timeoutMs, temperature = 0, env = process.env }) {
  const result = await runGeminiPool({
    poolName,
    prompt,
    env,
    options: { responseMimeType: "application/json", temperature, maxOutputTokens, timeoutMs }
  });
  return { ok: result.ok === true, json: result.json || null, metadata: publicModelMetadata(result), error: result.error || null, error_type: result.error_type || null };
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
    grounding_metadata: result?.grounding_metadata || null
  };
}

function deterministic5A(stage5Input = {}) {
  const sMap = sourceMap(stage5Input);
  const candidateRows = asArray(stage5Input?.target_feature_candidate_index?.candidates);
  const groups = new Map();
  for (const candidate of candidateRows) {
    const cluster = candidateCluster(candidate);
    if (!STAGE5_COMPATIBILITY_TERMS[cluster]) continue;
    if (!groups.has(cluster)) groups.set(cluster, []);
    groups.get(cluster).push(candidate);
  }
  for (const clusterRow of asArray(stage5Input.stage5_candidate_clusters)) {
    const cluster = asText(clusterRow?.canonical_function_cluster);
    if (STAGE5_COMPATIBILITY_TERMS[cluster] && !groups.has(cluster)) groups.set(cluster, []);
  }
  const productFunctions = [...groups.entries()].map(([cluster, candidates], index) => {
    const defaults = clusterDefaults(cluster);
    const sourceIds = unique([...candidates.map((c) => c.source_id), ...asArray(stage5Input.stage5_candidate_clusters).filter((row) => row?.canonical_function_cluster === cluster).flatMap((row) => [row.primary_source_id, ...asArray(row.supporting_source_ids)])]);
    const sources = sourceIds.map((id) => sMap.get(id)).filter(Boolean);
    const primarySource = sources[0] || {};
    return {
      function_id: `PF${String(index + 1).padStart(3, "0")}`,
      function_cluster: cluster,
      function_name: clusterName(cluster),
      primary_or_secondary: ["api_platform", "model_catalog", "integration_connector"].includes(cluster) ? "secondary" : "primary",
      commercial_function: defaults.system_action,
      business_label_or_product_area: clusterName(cluster),
      actor_or_user: lower(cluster).includes("api") || sources.some((src) => /api|docs|developer|sdk/i.test(sourceUrl(src) + " " + titleOf(src))) ? "developer or enterprise customer" : "end user or enterprise customer",
      input_signal: defaults.input_signal,
      system_action: defaults.system_action,
      output_or_result: defaults.output_signal,
      source_ids: sourceIds,
      source_url: sourceUrl(primarySource),
      evidence_refs: fallbackEvidenceRefs(sourceIds, candidates),
      extraction_confidence: candidates.length || sourceIds.length ? "high" : "medium",
      candidate_status: "PROMOTED",
      extraction_basis: "Deterministic Stage 5 candidate/source cluster baseline; model refinement may update wording but cannot erase this product function."
    };
  });
  return {
    stage5a_version: "stage5a_product_function_extraction_v1",
    product_functions: productFunctions,
    visible_but_unmapped: [],
    limitations: productFunctions.length ? [] : ["No deterministic Stage 5 product-function clusters were available."],
    instruction_packet: {
      substage: "5A",
      mode: "product_function_extraction",
      promotion_rule: "A function can be promoted if source evidence shows an identifiable product capability with input/action/output, even if archetype/surface tagging is not yet done."
    }
  };
}

function merge5A(deterministic, modelJson = null) {
  const modelValue = modelJson?.stage5a_product_function_extraction || modelJson;
  const modelFunctions = asArray(modelValue?.product_functions);
  if (!modelFunctions.length) return deterministic;
  const byCluster = new Map(deterministic.product_functions.map((fn) => [fn.function_cluster, fn]));
  for (const modelFn of modelFunctions) {
    const cluster = asText(modelFn.function_cluster || modelFn.candidate_cluster);
    const existing = cluster ? byCluster.get(cluster) : null;
    if (!existing) continue;
    Object.assign(existing, {
      function_name: asText(modelFn.function_name, existing.function_name),
      primary_or_secondary: ["primary", "secondary"].includes(modelFn.primary_or_secondary) ? modelFn.primary_or_secondary : existing.primary_or_secondary,
      commercial_function: asText(modelFn.commercial_function, existing.commercial_function),
      business_label_or_product_area: asText(modelFn.business_label_or_product_area, existing.business_label_or_product_area),
      actor_or_user: asText(modelFn.actor_or_user, existing.actor_or_user),
      input_signal: asText(modelFn.input_signal, existing.input_signal),
      system_action: asText(modelFn.system_action, existing.system_action),
      output_or_result: asText(modelFn.output_or_result, existing.output_or_result),
      evidence_refs: unique([...existing.evidence_refs, ...asArray(modelFn.evidence_refs)]),
      extraction_confidence: asText(modelFn.extraction_confidence || modelFn.confidence, existing.extraction_confidence),
      extraction_basis: asText(modelFn.extraction_basis, "Model-refined from 5A product-function extraction packet.")
    });
  }
  return deterministic;
}

async function run5A({ stage5Input, instructionPlan, env }) {
  const deterministic = deterministic5A(stage5Input);
  const prompt = [
    "You are Stage 5A Product Function Extractor for Lex Nova runtime.",
    "Return JSON only with {\"stage5a_product_function_extraction\":{\"product_functions\":[],\"visible_but_unmapped\":[],\"limitations\":[]}}.",
    "Use the deterministic baseline and admitted source refs. Your job is to refine product function wording, primary/secondary role, input/action/output, and evidence refs.",
    "Do not classify archetypes, surfaces, registry threats, or legal risk. Do not delete baseline functions unless the baseline is clearly duplicate/non-feature; if unsure keep it.",
    "Each product function must preserve function_id and function_cluster from the baseline.",
    "---INSTRUCTION_PLAN---", JSON.stringify(instructionPlan, null, 2),
    "---BASELINE_AND_EVIDENCE---", JSON.stringify({ deterministic, evidence_packet: compactEvidencePacket(stage5Input) }, null, 2)
  ].join("\n");
  const model = await runJsonModel({
    prompt,
    poolName: env.STAGE5A_POOL || env.STAGE5_FEATURE_POOL || env.LIVE_FEATURE_POOL || "reasoning",
    maxOutputTokens: Number(env.STAGE5A_MAX_OUTPUT_TOKENS || 8192),
    timeoutMs: Number(env.STAGE5A_TIMEOUT_MS || env.LIVE_FEATURE_TIMEOUT_MS || 90000),
    temperature: 0,
    env
  });
  return { ...merge5A(deterministic, model.ok ? model.json : null), model_metadata: model.metadata, model_error: model.ok ? null : { error_type: model.error_type, error: model.error } };
}

function deterministic5B(stage5a = {}) {
  const featureTags = asArray(stage5a.product_functions).map((fn) => {
    const defaults = clusterDefaults(fn.function_cluster);
    const archetypeCodes = unique(defaults.archetypes).filter((code) => ARCHETYPES[code]);
    const surfaceTokens = unique(defaults.surfaces).filter((token) => SURFACES[token]);
    return {
      function_id: fn.function_id,
      function_cluster: fn.function_cluster,
      archetype_codes: archetypeCodes,
      surface_tokens: surfaceTokens,
      triggering_status: archetypeCodes.some((code) => code !== "UNI") ? "TRIGGERED" : "UNIVERSAL_OR_CONTEXTUAL",
      trigger_reason: `Function behavior (${fn.system_action}) maps to ${archetypeCodes.join(", ")} and surfaces ${surfaceTokens.join(", ")} using registry key controlled values.`,
      autonomy_level: /agent|workflow|action|route|connect/i.test(`${fn.function_name} ${fn.system_action}`) ? "recommend" : "none",
      human_review_signal: "unknown",
      external_action_signal: /agent|connector|integration|workflow|api call|send|book|transaction/i.test(`${fn.function_name} ${fn.system_action}`) ? "unknown" : "false",
      tagging_confidence: "high",
      tagging_gaps: []
    };
  });
  return {
    stage5b_version: "stage5b_archetype_surface_tagging_v1",
    registry_key_source: "data/runtime/registry_key.runtime.json",
    controlled_values: { archetypes: ARCHETYPES, surfaces: SURFACES },
    feature_tags: featureTags,
    limitations: []
  };
}

function normalizeArchetypes(values = []) { return unique(values).filter((code) => ARCHETYPES[code]); }
function normalizeSurfaces(values = []) { return unique(values).filter((token) => SURFACES[token]); }

function merge5B(deterministic, modelJson = null) {
  const modelValue = modelJson?.stage5b_archetype_surface_tagging || modelJson;
  const modelTags = asArray(modelValue?.feature_tags);
  if (!modelTags.length) return deterministic;
  const byId = new Map(deterministic.feature_tags.map((row) => [row.function_id, row]));
  for (const tag of modelTags) {
    const existing = byId.get(tag.function_id);
    if (!existing) continue;
    const archetypes = normalizeArchetypes(tag.archetype_codes);
    const surfaces = normalizeSurfaces(tag.surface_tokens);
    Object.assign(existing, {
      archetype_codes: archetypes.length ? archetypes : existing.archetype_codes,
      surface_tokens: surfaces.length ? surfaces : existing.surface_tokens,
      triggering_status: asText(tag.triggering_status, existing.triggering_status),
      trigger_reason: asText(tag.trigger_reason, existing.trigger_reason),
      autonomy_level: ["none", "draft", "recommend", "execute", "unknown"].includes(tag.autonomy_level) ? tag.autonomy_level : existing.autonomy_level,
      human_review_signal: ["required", "optional", "not_visible", "unknown"].includes(tag.human_review_signal) ? tag.human_review_signal : existing.human_review_signal,
      external_action_signal: ["true", "false", "unknown"].includes(tag.external_action_signal) ? tag.external_action_signal : existing.external_action_signal,
      tagging_confidence: asText(tag.tagging_confidence || tag.confidence, existing.tagging_confidence),
      tagging_gaps: asArray(tag.tagging_gaps)
    });
  }
  return deterministic;
}

async function run5B({ stage5a, instructionPlan, env }) {
  const deterministic = deterministic5B(stage5a);
  const prompt = [
    "You are Stage 5B Archetype + Surface Tagger for Lex Nova runtime.",
    "Return JSON only with {\"stage5b_archetype_surface_tagging\":{\"feature_tags\":[],\"limitations\":[]}}.",
    "Use only the supplied controlled archetype/surface values. Every 5A function must receive at least one archetype and one surface. Never delete a 5A function.",
    "If uncertain, keep the deterministic tag and add a tagging_gaps entry; do not output empty archetype_codes or surface_tokens.",
    "---REGISTRY_KEY_CONTROLLED_VALUES---", JSON.stringify({ archetypes: ARCHETYPES, surfaces: SURFACES }, null, 2),
    "---INSTRUCTION_PLAN---", JSON.stringify(instructionPlan, null, 2),
    "---5A_PRODUCT_FUNCTIONS_AND_BASELINE_TAGS---", JSON.stringify({ product_functions: stage5a.product_functions, deterministic }, null, 2)
  ].join("\n");
  const model = await runJsonModel({
    prompt,
    poolName: env.STAGE5B_POOL || env.STAGE5_FEATURE_POOL || env.LIVE_FEATURE_POOL || "reasoning",
    maxOutputTokens: Number(env.STAGE5B_MAX_OUTPUT_TOKENS || 8192),
    timeoutMs: Number(env.STAGE5B_TIMEOUT_MS || env.LIVE_FEATURE_TIMEOUT_MS || 90000),
    temperature: 0,
    env
  });
  return { ...merge5B(deterministic, model.ok ? model.json : null), model_metadata: model.metadata, model_error: model.ok ? null : { error_type: model.error_type, error: model.error } };
}

function deliveryChannels(fn = {}) {
  const text = lower([fn.function_name, fn.source_url, fn.business_label_or_product_area, fn.commercial_function].join(" "));
  return {
    app: /app|studio|dashboard|portal|web/i.test(text) ? "true" : "unknown",
    api: /api|sdk|developer|endpoint|docs|reference/i.test(text) ? "true" : "unknown",
    web: /web|site|platform|studio|dashboard|portal/i.test(text) ? "true" : "unknown"
  };
}

function confidenceMerge(...values) {
  const v = values.map((item) => asText(item, "unknown"));
  if (v.includes("low")) return "low";
  if (v.includes("medium")) return "medium";
  if (v.includes("unknown")) return "medium";
  return "high";
}

function build5C({ stage5a, stage5b }) {
  const tagsById = new Map(asArray(stage5b.feature_tags).map((row) => [row.function_id, row]));
  const featureInventory = asArray(stage5a.product_functions).filter((fn) => fn.candidate_status !== "DUPLICATE" && fn.candidate_status !== "TOO_VAGUE").map((fn, index) => {
    const tag = tagsById.get(fn.function_id) || deterministic5B({ product_functions: [fn] }).feature_tags[0];
    const featureId = `F${String(index + 1).padStart(3, "0")}`;
    const archetypeProvenance = asArray(tag.archetype_codes).map((code) => ({
      archetype_code: code,
      registry_key_detection_logic: ARCHETYPES[code]?.detection_logic || "Controlled archetype selected from registry key.",
      matched_feature_behavior: tag.trigger_reason || fn.system_action,
      source_url: fn.source_url || "unknown",
      evidence_refs: fallbackEvidenceRefs(fn.source_ids, [{ evidence_refs: fn.evidence_refs }]),
      confidence: tag.tagging_confidence || "medium"
    }));
    const surfaceProvenance = asArray(tag.surface_tokens).map((token) => ({
      surface_token: token,
      registry_key_surface_meaning: SURFACES[token] || "Controlled surface selected from registry key.",
      matched_data_or_context: `${fn.input_signal}; ${fn.output_or_result}`,
      source_url: fn.source_url || "unknown",
      evidence_refs: fallbackEvidenceRefs(fn.source_ids, [{ evidence_refs: fn.evidence_refs }]),
      confidence: tag.tagging_confidence || "medium"
    }));
    return {
      feature_id: featureId,
      feature_name: fn.function_name,
      feature_role: fn.primary_or_secondary === "primary" ? "CORE" : "SECONDARY",
      commercial_function: fn.commercial_function,
      business_label_or_product_area: fn.business_label_or_product_area,
      feature_description: `${fn.system_action}; output: ${fn.output_or_result}`,
      actor_or_user: fn.actor_or_user,
      input_data: unique([fn.input_signal]),
      system_action: fn.system_action,
      output_or_result: fn.output_or_result,
      autonomy_level: tag.autonomy_level || "unknown",
      human_review_signal: tag.human_review_signal || "unknown",
      external_action_signal: tag.external_action_signal || "unknown",
      delivery_channels: deliveryChannels(fn),
      data_provenance: [],
      archetype_codes: asArray(tag.archetype_codes),
      archetype_labels: asArray(tag.archetype_codes).map((code) => ARCHETYPES[code]?.label || code),
      archetype_provenance: archetypeProvenance,
      surface_tokens: asArray(tag.surface_tokens),
      surface_provenance: surfaceProvenance,
      confidence: confidenceMerge(fn.extraction_confidence, tag.tagging_confidence),
      feature_source_url: fn.source_url || "unknown",
      evidence_refs: fallbackEvidenceRefs(fn.source_ids, [{ evidence_refs: fn.evidence_refs }]),
      linked_threat_ids: [],
      _stage5a_function_id: fn.function_id,
      _function_cluster: fn.function_cluster
    };
  });
  return {
    stage5c_version: "stage5c_feature_inventory_canonicalization_v1",
    feature_inventory_seed: featureInventory,
    unresolved_feature_candidates: asArray(stage5a.product_functions).filter((fn) => fn.candidate_status && fn.candidate_status !== "PROMOTED").map((fn, index) => ({
      candidate_id: fn.function_id || `UNRESOLVED_${index + 1}`,
      candidate_name: fn.function_name || fn.function_cluster || "Unresolved candidate",
      reason: fn.candidate_status || "not_promoted",
      source_url: fn.source_url || null,
      evidence_refs: fallbackEvidenceRefs(fn.source_ids, [{ evidence_refs: fn.evidence_refs }]),
      recommended_downstream_handling: "Do not feed as final feature unless 5A/5B can promote it."
    }))
  };
}

function deterministic5D(stage5c = {}) {
  const touchpoints = asArray(stage5c.feature_inventory_seed).map((feature) => {
    const defaults = clusterDefaults(feature._function_cluster);
    return {
      feature_id: feature.feature_id,
      input_data: unique([...(feature.input_data || []), defaults.input_signal]),
      output_data: unique(defaults.output_data || [feature.output_or_result]),
      processing_action: unique(defaults.processing_action || [feature.system_action]),
      data_origin: "user_provided",
      data_subject: /developer|api/i.test(feature.actor_or_user) ? "developer" : "user",
      data_category: defaults.data_category || "unknown",
      processing_context: feature.system_action,
      storage_or_retention_signal: "unknown_not_evidenced_in_product_function_sources",
      training_or_finetuning_signal: "unknown_not_evidenced_in_product_function_sources",
      source_url: feature.feature_source_url,
      evidence_refs: feature.evidence_refs,
      confidence: feature.confidence || "medium",
      gaps: []
    };
  });
  return {
    stage5d_version: "stage5d_feature_data_touchpoints_v1",
    feature_data_touchpoints: touchpoints,
    limitations: []
  };
}

function merge5D(deterministic, modelJson = null) {
  const modelValue = modelJson?.stage5d_feature_data_touchpoints || modelJson;
  const modelRows = asArray(modelValue?.feature_data_touchpoints);
  if (!modelRows.length) return deterministic;
  const allowedCategories = new Set(["prompt", "account", "contact", "uploaded_file", "generated_output", "audio", "text", "document", "image", "video", "code", "api_payload", "payment", "usage_log", "support", "sensitive", "unknown"]);
  const byId = new Map(deterministic.feature_data_touchpoints.map((row) => [row.feature_id, row]));
  for (const row of modelRows) {
    const existing = byId.get(row.feature_id);
    if (!existing) continue;
    Object.assign(existing, {
      input_data: unique([...existing.input_data, ...asArray(row.input_data)]),
      output_data: unique([...existing.output_data, ...asArray(row.output_data)]),
      processing_action: unique([...existing.processing_action, ...asArray(row.processing_action)]),
      data_origin: ["user_provided", "customer_provided", "third_party_source", "public_web", "system_generated", "unknown"].includes(row.data_origin) ? row.data_origin : existing.data_origin,
      data_subject: ["user", "customer", "employee", "consumer", "developer", "child", "business_entity", "unknown"].includes(row.data_subject) ? row.data_subject : existing.data_subject,
      data_category: allowedCategories.has(row.data_category) ? row.data_category : existing.data_category,
      processing_context: asText(row.processing_context, existing.processing_context),
      storage_or_retention_signal: asText(row.storage_or_retention_signal, existing.storage_or_retention_signal),
      training_or_finetuning_signal: asText(row.training_or_finetuning_signal, existing.training_or_finetuning_signal),
      confidence: asText(row.confidence, existing.confidence),
      gaps: asArray(row.gaps)
    });
  }
  return deterministic;
}

async function run5D({ stage5c, stage5a, env }) {
  const deterministic = deterministic5D(stage5c);
  const prompt = [
    "You are Stage 5D Feature Data Touchpoint Extractor for Lex Nova runtime.",
    "Return JSON only with {\"stage5d_feature_data_touchpoints\":{\"feature_data_touchpoints\":[],\"limitations\":[]}}.",
    "Extract feature-level functional data touchpoints only. Do not perform legal data provenance; Stage 6B owns legal/governance provenance.",
    "For retention, training/fine-tuning, or sharing, use UNKNOWN_NOT_EVIDENCED unless supplied product evidence explicitly says otherwise.",
    "---5C_FEATURES_AND_BASELINE_TOUCHPOINTS---", JSON.stringify({ feature_inventory_seed: stage5c.feature_inventory_seed, deterministic, product_functions: stage5a.product_functions }, null, 2)
  ].join("\n");
  const model = await runJsonModel({
    prompt,
    poolName: env.STAGE5D_POOL || env.STAGE5_FEATURE_POOL || env.LIVE_FEATURE_POOL || "reasoning",
    maxOutputTokens: Number(env.STAGE5D_MAX_OUTPUT_TOKENS || 8192),
    timeoutMs: Number(env.STAGE5D_TIMEOUT_MS || env.LIVE_FEATURE_TIMEOUT_MS || 90000),
    temperature: 0,
    env
  });
  return { ...merge5D(deterministic, model.ok ? model.json : null), model_metadata: model.metadata, model_error: model.ok ? null : { error_type: model.error_type, error: model.error } };
}

function provenanceRows(feature, touchpoint) {
  return [{
    data_origin: touchpoint.data_origin || "unknown",
    data_subject: touchpoint.data_subject || "unknown",
    data_category: touchpoint.data_category || "unknown",
    processing_context: touchpoint.processing_context || feature.system_action,
    storage_or_retention_signal: touchpoint.storage_or_retention_signal || "unknown_not_evidenced_in_product_function_sources",
    training_or_finetuning_signal: touchpoint.training_or_finetuning_signal || "unknown_not_evidenced_in_product_function_sources",
    source_url: feature.feature_source_url || "unknown",
    evidence_refs: feature.evidence_refs,
    confidence: touchpoint.confidence || feature.confidence || "medium"
  }];
}

function intExtForSurface(token) {
  if (token === "Consumer-Public") return "external";
  if (token === "Enterprise-Private" || token === "Infrastructure") return "both";
  return "unknown";
}

function build5E({ stage5Input, stage5a, stage5b, stage5c, stage5d, instructionPlan }) {
  const touchpointsByFeature = new Map(asArray(stage5d.feature_data_touchpoints).map((row) => [row.feature_id, row]));
  const featureInventory = asArray(stage5c.feature_inventory_seed).map((feature) => {
    const clean = { ...feature };
    delete clean._stage5a_function_id;
    delete clean._function_cluster;
    const touchpoint = touchpointsByFeature.get(feature.feature_id) || {};
    clean.input_data = unique([...(clean.input_data || []), ...asArray(touchpoint.input_data)]);
    clean.data_provenance = provenanceRows(clean, touchpoint);
    return clean;
  });
  const dataProvenanceMap = featureInventory.flatMap((feature) => asArray(feature.data_provenance).map((row, index) => ({
    provenance_id: `DP_${feature.feature_id}_${String(index + 1).padStart(3, "0")}`,
    feature_id: feature.feature_id,
    ...row
  })));
  const regulatedSurfaceMap = featureInventory.flatMap((feature) => asArray(feature.surface_tokens).map((surface, index) => ({
    surface_id: `RS_${feature.feature_id}_${String(index + 1).padStart(3, "0")}`,
    feature_id: feature.feature_id,
    surface_token: surface,
    int_ext_classification: intExtForSurface(surface),
    basis: `Surface ${surface} derived from Stage 5B tagging for ${feature.feature_name}.`,
    confidence: feature.confidence || "medium",
    evidence_refs: feature.evidence_refs
  })));
  const records = sourceRecords(stage5Input);
  const featuresBySource = new Map();
  for (const feature of featureInventory) for (const ref of asArray(feature.evidence_refs)) {
    const sourcePrefix = String(ref).split("#")[0];
    if (!featuresBySource.has(sourcePrefix)) featuresBySource.set(sourcePrefix, new Set());
    featuresBySource.get(sourcePrefix).add(feature.feature_id);
  }
  const sourceCoverage = records.map((record) => {
    const sid = sourceId(record);
    const mapped = sid && featuresBySource.has(sid) ? [...featuresBySource.get(sid)] : [];
    const role = record.source_role || record.stage5_source_role || "supporting_commercial_source";
    const nonFeature = role === "non_feature_context" || role === "excluded_from_stage5";
    return {
      source_id: sid || sourceUrl(record),
      source_url: sourceUrl(record),
      source_family: sourceFamily(record),
      coverage_status: mapped.length ? "mapped" : (nonFeature ? "non_feature_context" : role === "duplicate_source" ? "duplicate" : "supporting"),
      mapped_feature_ids: mapped,
      unmapped_reason: mapped.length ? "mapped_to_feature_inventory" : (nonFeature ? "not_a_product_function_source" : "supporting_context_without_primary_mapping"),
      evidence_refs: mapped.length ? featureInventory.find((f) => mapped.includes(f.feature_id))?.evidence_refs || [`${sid || "SRC_UNKNOWN"}#C001`] : [`${sid || "SRC_UNKNOWN"}#C001`]
    };
  });
  const commercialOutcomes = unique(featureInventory.map((feature) => feature.feature_name));
  const unresolved = asArray(stage5c.unresolved_feature_candidates);
  const fieldEvidenceRefs = [];
  for (const feature of featureInventory) {
    fieldEvidenceRefs.push({ field_path: `/feature_inventory/${feature.feature_id}`, evidence_refs: feature.evidence_refs, basis: `Feature ${feature.feature_name} derived from Stage 5A/5B/5D substage outputs.`, confidence: feature.confidence || "medium" });
    fieldEvidenceRefs.push({ field_path: `/feature_inventory/${feature.feature_id}/archetype_codes`, evidence_refs: feature.evidence_refs, basis: "Archetype tags derived from Stage 5B registry-key controlled tagging.", confidence: feature.confidence || "medium" });
    fieldEvidenceRefs.push({ field_path: `/feature_inventory/${feature.feature_id}/data_provenance`, evidence_refs: feature.evidence_refs, basis: "Feature-level data touchpoints derived in Stage 5D.", confidence: feature.confidence || "medium" });
  }
  return {
    feature_profile_version: "feature_profile_v2",
    target_profile_ref: companyRef(stage5Input),
    feature_inventory: featureInventory,
    product_feature_map: [],
    data_provenance_map: dataProvenanceMap,
    regulated_surface_map: regulatedSurfaceMap,
    architecture_hints: [],
    classification_quality: {
      quality_version: "stage5_feature_classification_quality_v1",
      status: unresolved.length ? "DEGRADED" : "PASS",
      reinvestigation_required: false,
      reinvestigation_attempted: false,
      reinvestigation_pass_count: 0,
      unresolved_feature_count: unresolved.length,
      fallback_routing_required: unresolved.length > 0
    },
    unresolved_feature_candidates: unresolved,
    commercial_scan: {
      distinct_commercial_outcomes_seen: commercialOutcomes,
      mapped_core_feature_ids: featureInventory.filter((feature) => feature.feature_role === "CORE").map((feature) => feature.feature_id),
      source_coverage: sourceCoverage,
      unmapped_outcomes_due_to_insufficient_detail: unresolved.map((row) => row.candidate_name),
      completeness_status: unresolved.length ? "PARTIAL" : "COMPLETE",
      completeness_warnings: unresolved.length ? [`${unresolved.length} unresolved Stage 5 candidate(s) retained for audit; no promoted 5A function was deleted by 5B/5C/5D.`] : []
    },
    vault_feature_candidates: {
      baseline: Object.fromEntries(featureInventory.map((feature) => [feature.feature_id, feature.feature_name])),
      archetypes: Object.fromEntries(featureInventory.map((feature) => [feature.feature_id, feature.archetype_codes])),
      compliance: Object.fromEntries(featureInventory.map((feature) => [feature.feature_id, feature.surface_tokens]))
    },
    evidence: {
      field_evidence_refs: fieldEvidenceRefs.length ? fieldEvidenceRefs : [{ field_path: "/feature_inventory", evidence_refs: ["SRC_UNKNOWN#C001"], basis: "Fallback evidence placeholder; Stage 5 had no feature evidence refs.", confidence: "low" }],
      unresolved_questions: unresolved.map((row) => row.reason)
    },
    limitations: [
      "Stage 5 executed as multi-substage pipeline: 5A product functions, 5B archetype/surface tagging, 5C deterministic feature inventory, 5D feature data touchpoints, 5E deterministic assembly.",
      ...asArray(stage5a.limitations),
      ...asArray(stage5b.limitations),
      ...asArray(stage5d.limitations)
    ],
    stage5_suboutputs: {
      instruction_plan: instructionPlan,
      product_function_extraction: stage5a,
      archetype_surface_tagging: stage5b,
      feature_inventory_canonicalization: stage5c,
      feature_data_touchpoints: stage5d
    }
  };
}

function stripNonSchemaStage5Fields(profile = {}) {
  const copy = { ...profile };
  delete copy.stage5_suboutputs;
  return copy;
}

export async function runStage5MultiSubstageProfile({ adapterResult, logs = [], logStage = null, env = process.env } = {}) {
  const stage5Input = adapterResult?.target_feature_profile_input;
  if (!stage5Input) return null;
  const log = (status, meta = {}) => {
    if (typeof logStage === "function") logStage(logs, "target_feature_profile_multistage", status, meta);
  };
  const instructionPlan = buildMasterInstructionPlan(stage5Input);
  log("5a_running", { deterministic_candidate_count: instructionPlan.source_density.deterministic_candidate_count, deterministic_cluster_count: instructionPlan.source_density.deterministic_cluster_count });
  const stage5a = await run5A({ stage5Input, instructionPlan, env });
  log("5a_complete", { product_function_count: asArray(stage5a.product_functions).length, model_error_type: stage5a.model_error?.error_type || null });
  log("5b_running", { product_function_count: asArray(stage5a.product_functions).length });
  const stage5b = await run5B({ stage5a, instructionPlan, env });
  log("5b_complete", { tagged_function_count: asArray(stage5b.feature_tags).length, model_error_type: stage5b.model_error?.error_type || null });
  const stage5c = build5C({ stage5a, stage5b });
  log("5c_complete", { feature_seed_count: asArray(stage5c.feature_inventory_seed).length, unresolved_count: asArray(stage5c.unresolved_feature_candidates).length });
  log("5d_running", { feature_seed_count: asArray(stage5c.feature_inventory_seed).length });
  const stage5d = await run5D({ stage5c, stage5a, env });
  log("5d_complete", { touchpoint_count: asArray(stage5d.feature_data_touchpoints).length, model_error_type: stage5d.model_error?.error_type || null });
  const assembled = build5E({ stage5Input, stage5a, stage5b, stage5c, stage5d, instructionPlan });
  const schemaProfile = stripNonSchemaStage5Fields(assembled);
  const schemaValidation = validateDiligenceStageOutput("targetFeatureProfile", schemaProfile);
  if (!schemaValidation.ok) {
    log("schema_failed", { error_count: schemaValidation.errors?.length || 0 });
    const error = new Error("Stage 5 multi-substage assembled profile failed targetFeatureProfile schema validation");
    error.status = 422;
    error.validation_errors = schemaValidation.errors || [];
    error.stage5_suboutputs = assembled.stage5_suboutputs;
    throw error;
  }
  const guardrail = validateTargetFeatureProfileGuardrails(schemaProfile, {
    packageInput: stage5Input,
    evidenceBuffer: asArray(stage5Input?.source_bundle?.evidence_buffer),
    threatMappingSupplied: stage5Input?.threat_mapping_supplied === true || stage5Input?.source_bundle?.source_review?.threat_mapping_supplied === true
  });
  if (!guardrail.ok) {
    log("guardrail_failed", { error_count: guardrail.errors?.length || 0, repair_count: guardrail.repairs?.length || 0, warning_count: guardrail.warnings?.length || 0 });
    const error = new Error("Stage 5 multi-substage assembled profile failed targetFeatureProfile guardrails");
    error.status = 422;
    error.validation_errors = guardrail.errors || [];
    error.guardrail_repairs = guardrail.repairs || [];
    error.stage5_suboutputs = assembled.stage5_suboutputs;
    throw error;
  }
  schemaProfile.stage5_suboutputs = assembled.stage5_suboutputs;
  schemaProfile.stage5_multistage_metadata = {
    runner_version: "stage5_multi_substage_runner_v1",
    model_metadata: {
      stage5a: stage5a.model_metadata || null,
      stage5b: stage5b.model_metadata || null,
      stage5d: stage5d.model_metadata || null
    },
    guardrail_warning_count: guardrail.warnings?.length || 0,
    guardrail_repair_count: guardrail.repairs?.length || 0
  };
  log("complete", { feature_count: schemaProfile.feature_inventory.length, classification_status: schemaProfile.classification_quality?.status || null, guardrail_warning_count: guardrail.warnings?.length || 0 });
  return schemaProfile;
}

export const stage5MultiSubstageInternals = {
  buildMasterInstructionPlan,
  deterministic5A,
  deterministic5B,
  build5C,
  deterministic5D,
  build5E
};
