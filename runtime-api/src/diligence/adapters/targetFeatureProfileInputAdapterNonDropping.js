import crypto from "node:crypto";

const PRODUCT_STAGE_KEY = "target_feature_profile";
const ESTIMATED_CHARS_PER_TOKEN = 2.25;
const DEFAULT_PROMPT_OVERHEAD_TOKENS = 30000;
const SOURCE_PRIORITY = { product_profile: 10, company_profile: 20, governance_profile: 30, legal_profile: 40 };

function nowIso() { return new Date().toISOString(); }
function sha256(value) { return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex"); }
function cleanText(record = {}) { return record?.text?.clean_text_lossless || ""; }
function titleOf(record = {}) { return record?.structure?.title || record?.title || ""; }
function normalizeLimit(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null; }
function estimateSourceTokens(chars) { return Math.ceil(Number(chars || 0) / ESTIMATED_CHARS_PER_TOKEN); }
function estimateTotalPromptTokens(sourceChars, promptOverheadTokens = DEFAULT_PROMPT_OVERHEAD_TOKENS) { return estimateSourceTokens(sourceChars) + promptOverheadTokens; }
function extractPacket(evidenceJunction = {}) { return evidenceJunction?.downstream_packets?.[PRODUCT_STAGE_KEY] || null; }
function sourceScore(record = {}) {
  const url = String(record.final_url || record.url || "").toLowerCase();
  const title = String(titleOf(record)).toLowerCase();
  let score = 0;
  for (const needle of ["/product", "/feature", "/model", "/platform", "/solution", "/api", "/developer", "/doc", "/reference", "/sdk", "/integration"]) if (url.includes(needle)) score += 10;
  if (/product|feature|model|api|developer|platform|solution|integration/.test(title)) score += 10;
  return score + Math.min(cleanText(record).length, 20000) / 2000;
}
function sortSources(records = []) {
  return [...records].sort((a, b) => {
    const pa = SOURCE_PRIORITY[a.source_family] || 99;
    const pb = SOURCE_PRIORITY[b.source_family] || 99;
    if (pa !== pb) return pa - pb;
    return sourceScore(b) - sourceScore(a);
  });
}
function citationManifest(record = {}) {
  return (Array.isArray(record.chunk_index) ? record.chunk_index : []).map((chunk, index) => ({
    evidence_ref_id: chunk.evidence_ref_id || `${record.evidence_source_id}#${chunk.chunk_id || `C${String(index + 1).padStart(3, "0")}`}`,
    evidence_source_id: record.evidence_source_id || null,
    chunk_id: chunk.chunk_id || `C${String(index + 1).padStart(3, "0")}`,
    source_url: chunk.source_url || record.final_url || record.url || null,
    start_char: chunk.start_char ?? null,
    end_char: chunk.end_char ?? null,
    text_sha256: chunk.text_sha256 || null
  }));
}
function artifactFromRecord(record = {}) {
  const text = cleanText(record);
  return {
    evidence_source_id: record.evidence_source_id || null,
    source_family: record.source_family || "unknown",
    source_url: record.url || null,
    final_url: record.final_url || null,
    title: titleOf(record),
    word_count: record?.text?.word_count || 0,
    clean_text_sha256: record?.text?.clean_text_sha256 || sha256(text),
    clean_text_length: text.length,
    estimated_source_tokens: estimateSourceTokens(text.length),
    coverage_status: record?.quality?.coverage_status || "unknown",
    full_text_in_evidence_buffer: true,
    citation_count: citationManifest(record).length
  };
}
function evidenceFromRecord(record = {}) {
  const text = cleanText(record);
  return {
    evidence_source_id: record.evidence_source_id || null,
    source_family: record.source_family || "unknown",
    source_url: record.url || null,
    final_url: record.final_url || null,
    title: titleOf(record),
    clean_text_sha256: record?.text?.clean_text_sha256 || sha256(text),
    word_count: record?.text?.word_count || 0,
    estimated_source_tokens: estimateSourceTokens(text.length),
    clean_text_lossless: text,
    source_citation_manifest: citationManifest(record),
    evidence_policy: { admitted_source: true, full_text_lossless: true, summarized: false, compressed: false, truncated_by_stage_5_adapter: false, evidence_refs_are_citations_not_model_quotes: true }
  };
}
function emptyRecord(record = {}) {
  const text = cleanText(record);
  return { evidence_source_id: record.evidence_source_id || null, source_family: record.source_family || "unknown", source_url: record.url || null, final_url: record.final_url || null, title: titleOf(record), clean_text_length: text.length, clean_text_sha256: record?.text?.clean_text_sha256 || sha256(text), reason: "empty_clean_text_recorded_not_budget_dropped" };
}

export function buildTargetFeatureProfileInput({ sourceBundle = {}, evidenceJunction = {}, companyProfile = null, runId = null, generatedAt = nowIso(), budget = {} } = {}) {
  const packet = extractPacket(evidenceJunction);
  const packetRecords = Array.isArray(packet?.source_records) ? packet.source_records : [];
  const included = [];
  const excluded = [];
  for (const record of sortSources(packetRecords)) {
    if (!cleanText(record)) excluded.push(emptyRecord(record));
    else included.push(record);
  }
  const usedChars = included.reduce((sum, record) => sum + cleanText(record).length, 0);
  const promptOverheadTokens = normalizeLimit(budget.prompt_overhead_tokens) || DEFAULT_PROMPT_OVERHEAD_TOKENS;
  const estimatedTotalPromptTokens = estimateTotalPromptTokens(usedChars, promptOverheadTokens);
  const maxInputChars = normalizeLimit(budget.max_input_chars);
  const maxEstimatedTokens = normalizeLimit(budget.max_estimated_tokens);
  const budgetWarnings = [];
  if (maxInputChars && usedChars > maxInputChars) budgetWarnings.push({ reason: "max_input_chars_guidance_exceeded_non_dropping", max_input_chars: maxInputChars, actual_input_chars: usedChars });
  if (maxEstimatedTokens && estimatedTotalPromptTokens > maxEstimatedTokens) budgetWarnings.push({ reason: "max_estimated_tokens_guidance_exceeded_non_dropping", max_estimated_tokens: maxEstimatedTokens, estimated_total_prompt_tokens: estimatedTotalPromptTokens });
  const sourceCitationManifest = included.flatMap(citationManifest);
  const limitations = [];
  if (excluded.length) limitations.push("Some target-feature packet records had empty clean_text_lossless because capture/extraction produced no text. They were recorded, not dropped for budget.");
  if (budgetWarnings.length) limitations.push("Stage 5 budget guidance was exceeded; every non-empty target-feature source was still included. No source text was truncated, summarized, compressed, or dropped for budget.");
  const adapterOutput = {
    target_feature_profile_input_version: "target_feature_profile_input_v2",
    run_id: runId || `target_feature_profile_input_${Date.now()}`,
    generated_at: generatedAt,
    source_bundle: {
      run_id: sourceBundle.run_id || null,
      source_mode: sourceBundle.source_mode || "runtime_discovery_capture",
      target_input: sourceBundle.target_input || evidenceJunction.target_input || {},
      source_review: { source_bundle_version: sourceBundle.source_bundle_version || null, evidence_junction_version: evidenceJunction.evidence_junction_version || null, source_bundle_sha256: evidenceJunction.source_bundle_sha256 || sourceBundle?.scrape_meta?.hashes?.raw_footprint_sha256 || null, packet_id: packet?.packet_id || null, downstream_stage: PRODUCT_STAGE_KEY, packet_source_count: packetRecords.length, included_source_count: included.length, excluded_source_count: excluded.length, packet_policy: packet?.packet_policy || {}, dedupe_groups: packet?.dedupe_groups || [], routed_evidence: packet?.routed_evidence || [] },
      artifact_inventory: included.map(artifactFromRecord),
      source_citation_manifest: sourceCitationManifest,
      evidence_ref_manifest: sourceCitationManifest,
      evidence_buffer: included.map(evidenceFromRecord),
      limitations: [...(Array.isArray(sourceBundle?.source_discovery?.coverage_gaps) ? sourceBundle.source_discovery.coverage_gaps.map((gap) => typeof gap === "string" ? gap : JSON.stringify(gap)) : []), ...limitations]
    },
    target_profile_v2: companyProfile || null,
    input_budget: { budget_status: budgetWarnings.length ? "GUIDANCE_EXCEEDED_FULL_PACKET_INCLUDED" : "FULL_PACKET_INCLUDED", enforcement_mode: "non_dropping", max_input_chars: maxInputChars, max_estimated_tokens: maxEstimatedTokens, max_single_source_chars: null, prompt_overhead_tokens: promptOverheadTokens, source_token_estimation_ratio_chars_per_token: ESTIMATED_CHARS_PER_TOKEN, estimated_input_chars: usedChars, estimated_source_tokens: estimateSourceTokens(usedChars), estimated_prompt_overhead_tokens: promptOverheadTokens, estimated_total_prompt_tokens: estimatedTotalPromptTokens, estimated_input_tokens: estimatedTotalPromptTokens, total_packet_sources: packetRecords.length, included_sources: included.map(artifactFromRecord), excluded_sources: excluded, budget_warnings: budgetWarnings, fail_loud_if_no_source_fits: false, text_truncated: false, text_summarized: false, text_compressed: false, source_dropping_for_budget_forbidden: true },
    adapter_policy: { prompt_compatibility_mode: "target_profile_v2_context", full_stage_3_archive_preserved_upstream: true, model_input_uses_all_non_empty_packet_sources: true, budget_guidance_not_source_selection: true, hard_budget_source_dropping_disabled: true, no_text_truncation: true, no_text_summary: true, no_text_compression: true, max_single_source_chars_removed: true, target_profile_context_only: true, final_features_require_evidence_refs_not_model_quotes: true, evidence_quote_runtime_resolved_from_citation: true, feature_inventory_is_atomic_unit: true }
  };
  return { ok: true, status: 200, target_feature_profile_input: adapterOutput };
}
