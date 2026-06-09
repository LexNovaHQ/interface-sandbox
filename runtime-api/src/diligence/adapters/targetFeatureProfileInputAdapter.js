import crypto from "node:crypto";

const DEFAULT_MAX_INPUT_CHARS = 120000;
const DEFAULT_MAX_ESTIMATED_TOKENS = 60000;
const DEFAULT_MAX_SINGLE_SOURCE_CHARS = 45000;
const DEFAULT_PROMPT_OVERHEAD_TOKENS = 30000;
const ESTIMATED_CHARS_PER_TOKEN = 2.25;
const PRODUCT_STAGE_KEY = "target_feature_profile";
const SOURCE_PRIORITY = {
  product_profile: 10,
  company_profile: 20,
  governance_profile: 30,
  legal_profile: 40
};

function nowIso() { return new Date().toISOString(); }
function sha256(value) { return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex"); }
function cleanText(record = {}) { return record?.text?.clean_text_lossless || ""; }
function titleOf(record = {}) { return record?.structure?.title || record?.title || ""; }
function normalizeLimit(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null; }
function sourceSpecificity(record = {}) {
  const url = String(record.final_url || record.url || "").toLowerCase();
  const title = String(titleOf(record) || "").toLowerCase();
  let score = 0;
  if (/\/products?\b|\/features?\b|\/models?\b|\/platform\b|\/solutions?\b/.test(url)) score += 40;
  if (/\/docs?\b|\/developers?\b|\/api\b|\/reference\b|\/sdk\b/.test(url)) score += 35;
  if (/product|feature|model|api|developer|platform|solution/.test(title)) score += 20;
  if (url === "/" || url.endsWith("//")) score -= 20;
  score += Math.min(cleanText(record).length, 20000) / 2000;
  return score;
}
function sortSources(records = []) { return [...records].sort((a, b) => { const pa = SOURCE_PRIORITY[a.source_family] || 99; const pb = SOURCE_PRIORITY[b.source_family] || 99; if (pa !== pb) return pa - pb; return sourceSpecificity(b) - sourceSpecificity(a); }); }
function estimateSourceTokens(chars) { return Math.ceil(Number(chars || 0) / ESTIMATED_CHARS_PER_TOKEN); }
function estimateTotalPromptTokens(sourceChars, promptOverheadTokens = DEFAULT_PROMPT_OVERHEAD_TOKENS) { return estimateSourceTokens(sourceChars) + promptOverheadTokens; }
function artifactFromRecord(record = {}) { const text = cleanText(record); return { evidence_source_id: record.evidence_source_id || null, source_family: record.source_family || "unknown", source_url: record.url || null, final_url: record.final_url || null, title: titleOf(record), word_count: record?.text?.word_count || 0, clean_text_sha256: record?.text?.clean_text_sha256 || sha256(text), clean_text_length: text.length, estimated_source_tokens: estimateSourceTokens(text.length), coverage_status: record?.quality?.coverage_status || "unknown", full_text_in_evidence_buffer: true }; }
function evidenceFromRecord(record = {}) { const text = cleanText(record); return { evidence_source_id: record.evidence_source_id || null, source_family: record.source_family || "unknown", source_url: record.url || null, final_url: record.final_url || null, title: titleOf(record), clean_text_sha256: record?.text?.clean_text_sha256 || sha256(text), word_count: record?.text?.word_count || 0, estimated_source_tokens: estimateSourceTokens(text.length), clean_text_lossless: text, evidence_policy: { admitted_source: true, discovery_only: false, full_text_lossless: true, summarized: false, compressed: false, truncated_by_stage_5_adapter: false } }; }
function extractPacket(evidenceJunction = {}) { return evidenceJunction?.downstream_packets?.[PRODUCT_STAGE_KEY] || null; }

export function buildTargetFeatureProfileInput({ sourceBundle = {}, evidenceJunction = {}, companyProfile = null, runId = null, generatedAt = nowIso(), budget = {} } = {}) {
  const packet = extractPacket(evidenceJunction);
  const packetRecords = Array.isArray(packet?.source_records) ? packet.source_records : [];
  const sortedRecords = sortSources(packetRecords);
  const maxInputChars = normalizeLimit(budget.max_input_chars) || DEFAULT_MAX_INPUT_CHARS;
  const maxEstimatedTokens = normalizeLimit(budget.max_estimated_tokens) || DEFAULT_MAX_ESTIMATED_TOKENS;
  const maxSingleSourceChars = normalizeLimit(budget.max_single_source_chars) || DEFAULT_MAX_SINGLE_SOURCE_CHARS;
  const promptOverheadTokens = normalizeLimit(budget.prompt_overhead_tokens) || DEFAULT_PROMPT_OVERHEAD_TOKENS;
  const effectiveSourceTokenLimit = Math.max(0, maxEstimatedTokens - promptOverheadTokens);
  const hardTokenCharLimit = effectiveSourceTokenLimit * ESTIMATED_CHARS_PER_TOKEN;
  const effectiveCharLimit = Math.min(maxInputChars, hardTokenCharLimit);
  const included = [];
  const excluded = [];
  let usedChars = 0;
  for (const record of sortedRecords) {
    const text = cleanText(record);
    const textLength = text.length;
    const exclusionBase = { evidence_source_id: record.evidence_source_id || null, source_family: record.source_family || "unknown", source_url: record.url || null, final_url: record.final_url || null, title: titleOf(record), clean_text_length: textLength, estimated_source_tokens: estimateSourceTokens(textLength), clean_text_sha256: record?.text?.clean_text_sha256 || sha256(text) };
    if (!text) { excluded.push({ ...exclusionBase, reason: "empty_clean_text" }); continue; }
    if (textLength > maxSingleSourceChars) { excluded.push({ ...exclusionBase, reason: "single_source_exceeds_max_single_source_chars" }); continue; }
    if (usedChars + textLength > effectiveCharLimit) { excluded.push({ ...exclusionBase, reason: "input_budget_exceeded_by_source_selection" }); continue; }
    included.push(record);
    usedChars += textLength;
  }
  const estimatedSourceTokens = estimateSourceTokens(usedChars);
  const estimatedTotalPromptTokens = estimateTotalPromptTokens(usedChars, promptOverheadTokens);
  const hardFailure = included.length === 0 && sortedRecords.some((record) => cleanText(record).length > 0);
  const limitations = [];
  if (excluded.length) limitations.push("Some admitted target-feature sources were excluded from the model input by deterministic source-level budget selection. They remain preserved in the Stage 3 evidence archive.");
  if (hardFailure) limitations.push("No non-empty target-feature source could fit inside the configured Stage 5 input budget without truncation.");
  const adapterOutput = {
    target_feature_profile_input_version: "target_feature_profile_input_v1",
    run_id: runId || `target_feature_profile_input_${Date.now()}`,
    generated_at: generatedAt,
    source_bundle: {
      run_id: sourceBundle.run_id || null,
      source_mode: sourceBundle.source_mode || "runtime_discovery_capture",
      target_input: sourceBundle.target_input || evidenceJunction.target_input || {},
      source_review: { source_bundle_version: sourceBundle.source_bundle_version || null, evidence_junction_version: evidenceJunction.evidence_junction_version || null, source_bundle_sha256: evidenceJunction.source_bundle_sha256 || sourceBundle?.scrape_meta?.hashes?.raw_footprint_sha256 || null, packet_id: packet?.packet_id || null, downstream_stage: PRODUCT_STAGE_KEY, packet_source_count: packetRecords.length, included_source_count: included.length, excluded_source_count: excluded.length, packet_policy: packet?.packet_policy || {}, dedupe_groups: packet?.dedupe_groups || [], routed_evidence: packet?.routed_evidence || [] },
      artifact_inventory: included.map(artifactFromRecord),
      evidence_buffer: included.map(evidenceFromRecord),
      limitations: [...(Array.isArray(sourceBundle?.source_discovery?.coverage_gaps) ? sourceBundle.source_discovery.coverage_gaps.map((gap) => typeof gap === "string" ? gap : JSON.stringify(gap)) : []), ...limitations]
    },
    company_profile_v1: companyProfile || null,
    input_budget: { budget_status: hardFailure ? "TOKEN_BUDGET_EXCEEDED" : (excluded.length ? "PARTIAL_SOURCE_SELECTION" : "FULL_PACKET_INCLUDED"), max_input_chars: maxInputChars, max_estimated_tokens: maxEstimatedTokens, max_single_source_chars: maxSingleSourceChars, prompt_overhead_tokens: promptOverheadTokens, source_token_estimation_ratio_chars_per_token: ESTIMATED_CHARS_PER_TOKEN, estimated_input_chars: usedChars, estimated_source_tokens: estimatedSourceTokens, estimated_prompt_overhead_tokens: promptOverheadTokens, estimated_total_prompt_tokens: estimatedTotalPromptTokens, estimated_input_tokens: estimatedTotalPromptTokens, total_packet_sources: packetRecords.length, included_sources: included.map(artifactFromRecord), excluded_sources: excluded, fail_loud_if_no_source_fits: true, text_truncated: false, text_summarized: false, text_compressed: false },
    adapter_policy: { prompt_compatibility_mode: "legacy_source_bundle_fields", full_stage_3_archive_preserved_upstream: true, model_input_uses_source_level_selection_only: true, no_text_truncation: true, no_text_summary: true, no_text_compression: true, company_profile_context_only: true, final_features_require_evidence_buffer_quote: true }
  };
  if (hardFailure) return { ok: false, status: 413, error_type: "TOKEN_BUDGET_EXCEEDED", error: "No target-feature source could fit inside the configured Stage 5 input budget without truncation.", input_budget: adapterOutput.input_budget, target_feature_profile_input: adapterOutput };
  return { ok: true, status: 200, target_feature_profile_input: adapterOutput };
}
