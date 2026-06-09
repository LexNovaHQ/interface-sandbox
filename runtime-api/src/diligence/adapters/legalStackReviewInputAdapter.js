import crypto from "node:crypto";

const DEFAULT_MAX_INPUT_CHARS = 120000;
const DEFAULT_MAX_ESTIMATED_TOKENS = 60000;
const DEFAULT_MAX_SINGLE_SOURCE_CHARS = 60000;
const DEFAULT_PROMPT_OVERHEAD_TOKENS = 30000;
const ESTIMATED_CHARS_PER_TOKEN = 2.25;
const LEGAL_STAGE_KEY = "legal_stack_review";
const SOURCE_PRIORITY = { legal_profile: 10, governance_profile: 20, company_profile: 50, product_profile: 90 };

function nowIso() { return new Date().toISOString(); }
function sha256(value) { return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex"); }
function cleanText(record = {}) { return record?.text?.clean_text_lossless || ""; }
function titleOf(record = {}) { return record?.structure?.title || record?.title || ""; }
function normalizeLimit(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null; }
function enforcementMode(value) { return String(value || "guidance").trim().toLowerCase() === "hard" ? "hard" : "guidance"; }
function shouldEnforce(budget = {}) { return enforcementMode(budget.enforcement_mode || budget.mode) === "hard"; }
function estimateSourceTokens(chars) { return Math.ceil(Number(chars || 0) / ESTIMATED_CHARS_PER_TOKEN); }
function estimateTotalPromptTokens(sourceChars, promptOverheadTokens = DEFAULT_PROMPT_OVERHEAD_TOKENS) { return estimateSourceTokens(sourceChars) + promptOverheadTokens; }
function sourceSpecificity(record = {}) { const url = String(record.final_url || record.url || "").toLowerCase(); const title = String(titleOf(record) || "").toLowerCase(); const text = cleanText(record).toLowerCase(); let score = 0; if (/terms|privacy|dpa|data-processing|acceptable-use|aup|sla|service-level|security|trust|subprocessor|compliance|legal/.test(url)) score += 40; if (/terms|privacy|dpa|data processing|acceptable use|prohibited use|sla|service level|security|trust|subprocessor|compliance/.test(title)) score += 30; if (/data processing addendum|data processing agreement|acceptable use|service level agreement|sub-?processors?|annexure|schedule|addendum|prohibited use|support services/.test(text)) score += 25; score += Math.min(cleanText(record).length, 30000) / 3000; return score; }
function sortSources(records = []) { return [...records].sort((a, b) => { const pa = SOURCE_PRIORITY[a.source_family] || 99; const pb = SOURCE_PRIORITY[b.source_family] || 99; if (pa !== pb) return pa - pb; return sourceSpecificity(b) - sourceSpecificity(a); }); }
function artifactFromRecord(record = {}) { const text = cleanText(record); return { evidence_source_id: record.evidence_source_id || null, source_family: record.source_family || "unknown", source_url: record.url || null, final_url: record.final_url || null, title: titleOf(record), word_count: record?.text?.word_count || 0, clean_text_sha256: record?.text?.clean_text_sha256 || sha256(text), clean_text_length: text.length, estimated_source_tokens: estimateSourceTokens(text.length), coverage_status: record?.quality?.coverage_status || "unknown", full_text_in_evidence_buffer: true }; }
function evidenceFromRecord(record = {}) { const text = cleanText(record); return { evidence_source_id: record.evidence_source_id || null, source_family: record.source_family || "unknown", source_url: record.url || null, final_url: record.final_url || null, title: titleOf(record), clean_text_sha256: record?.text?.clean_text_sha256 || sha256(text), word_count: record?.text?.word_count || 0, estimated_source_tokens: estimateSourceTokens(text.length), clean_text_lossless: text, evidence_policy: { admitted_source: true, discovery_only: false, full_text_lossless: true, summarized: false, compressed: false, truncated_by_stage_6_adapter: false } }; }
function extractPacket(evidenceJunction = {}) { return evidenceJunction?.downstream_packets?.[LEGAL_STAGE_KEY] || null; }
function compactTargetFeatureProfile(profile = {}) { return { target_profile: profile.target_profile || {}, primary_product: profile.primary_product || {}, product_feature_map: Array.isArray(profile.product_feature_map) ? profile.product_feature_map : [], limitations: Array.isArray(profile.limitations) ? profile.limitations : [] }; }
function exclusionBase(record = {}) { const text = cleanText(record); return { evidence_source_id: record.evidence_source_id || null, source_family: record.source_family || "unknown", source_url: record.url || null, final_url: record.final_url || null, title: titleOf(record), clean_text_length: text.length, estimated_source_tokens: estimateSourceTokens(text.length), clean_text_sha256: record?.text?.clean_text_sha256 || sha256(text) }; }

export function buildLegalStackReviewInput({ sourceBundle = {}, evidenceJunction = {}, targetFeatureProfile = null, runId = null, generatedAt = nowIso(), budget = {} } = {}) {
  const packet = extractPacket(evidenceJunction);
  const packetRecords = Array.isArray(packet?.source_records) ? packet.source_records : [];
  const sortedRecords = sortSources(packetRecords);
  const maxInputChars = normalizeLimit(budget.max_input_chars) || DEFAULT_MAX_INPUT_CHARS;
  const maxEstimatedTokens = normalizeLimit(budget.max_estimated_tokens) || DEFAULT_MAX_ESTIMATED_TOKENS;
  const maxSingleSourceChars = normalizeLimit(budget.max_single_source_chars) || DEFAULT_MAX_SINGLE_SOURCE_CHARS;
  const promptOverheadTokens = normalizeLimit(budget.prompt_overhead_tokens) || DEFAULT_PROMPT_OVERHEAD_TOKENS;
  const hardMode = shouldEnforce(budget);
  const effectiveSourceTokenLimit = Math.max(0, maxEstimatedTokens - promptOverheadTokens);
  const hardTokenCharLimit = effectiveSourceTokenLimit * ESTIMATED_CHARS_PER_TOKEN;
  const effectiveCharLimit = Math.min(maxInputChars, hardTokenCharLimit);
  const included = [];
  const excluded = [];
  const budgetWarnings = [];
  let usedChars = 0;
  for (const record of sortedRecords) {
    const text = cleanText(record);
    const textLength = text.length;
    const base = exclusionBase(record);
    if (!text) { excluded.push({ ...base, reason: "empty_clean_text" }); continue; }
    const singleOver = textLength > maxSingleSourceChars;
    const totalOver = usedChars + textLength > effectiveCharLimit;
    if (singleOver) budgetWarnings.push({ ...base, reason: "single_source_exceeds_guidance" });
    if (totalOver) budgetWarnings.push({ ...base, reason: "input_budget_guidance_exceeded" });
    if (hardMode && singleOver) { excluded.push({ ...base, reason: "single_source_exceeds_max_single_source_chars" }); continue; }
    if (hardMode && totalOver) { excluded.push({ ...base, reason: "input_budget_exceeded_by_source_selection" }); continue; }
    included.push(record);
    usedChars += textLength;
  }
  const estimatedSourceTokens = estimateSourceTokens(usedChars);
  const estimatedTotalPromptTokens = estimateTotalPromptTokens(usedChars, promptOverheadTokens);
  const hardFailure = hardMode && included.length === 0 && sortedRecords.some((record) => cleanText(record).length > 0);
  const limitations = [];
  if (excluded.length) limitations.push("Some admitted legal/governance sources were excluded because hard budget enforcement was explicitly enabled. They remain preserved in the Stage 3 evidence archive.");
  if (budgetWarnings.length && !hardMode) limitations.push("Stage 6 source budget was exceeded in guidance mode; all non-empty legal/governance sources were still included to prevent silent under-reading.");
  if (hardFailure) limitations.push("No non-empty legal/governance source could fit inside the configured Stage 6 input budget without truncation.");
  const adapterOutput = { legal_stack_review_input_version: "legal_stack_review_input_v1", run_id: runId || `legal_stack_review_input_${Date.now()}`, generated_at: generatedAt, source_bundle: { run_id: sourceBundle.run_id || null, source_mode: sourceBundle.source_mode || "runtime_discovery_capture", target_input: sourceBundle.target_input || evidenceJunction.target_input || {}, source_review: { source_bundle_version: sourceBundle.source_bundle_version || null, evidence_junction_version: evidenceJunction.evidence_junction_version || null, source_bundle_sha256: evidenceJunction.source_bundle_sha256 || sourceBundle?.scrape_meta?.hashes?.raw_footprint_sha256 || null, packet_id: packet?.packet_id || null, downstream_stage: LEGAL_STAGE_KEY, packet_source_count: packetRecords.length, included_source_count: included.length, excluded_source_count: excluded.length, packet_policy: packet?.packet_policy || {}, dedupe_groups: packet?.dedupe_groups || [], routed_evidence: packet?.routed_evidence || [], embedded_artifact_instruction: "Inspect admitted legal/governance text for embedded DPA, AUP, SLA, annexures, schedules, addenda, exhibits, appendices, prohibited-use sections, support terms, subprocessors, trust/security/compliance sections before marking absent." }, artifact_inventory: included.map(artifactFromRecord), evidence_buffer: included.map(evidenceFromRecord), limitations: [...(Array.isArray(sourceBundle?.source_discovery?.coverage_gaps) ? sourceBundle.source_discovery.coverage_gaps.map((gap) => typeof gap === "string" ? gap : JSON.stringify(gap)) : []), ...limitations] }, target_feature_profile: compactTargetFeatureProfile(targetFeatureProfile || {}), input_budget: { budget_status: hardFailure ? "TOKEN_BUDGET_EXCEEDED" : (excluded.length ? "PARTIAL_SOURCE_SELECTION" : (budgetWarnings.length ? "GUIDANCE_EXCEEDED_FULL_PACKET_INCLUDED" : "FULL_PACKET_INCLUDED")), enforcement_mode: hardMode ? "hard" : "guidance", max_input_chars: maxInputChars, max_estimated_tokens: maxEstimatedTokens, max_single_source_chars: maxSingleSourceChars, prompt_overhead_tokens: promptOverheadTokens, source_token_estimation_ratio_chars_per_token: ESTIMATED_CHARS_PER_TOKEN, estimated_input_chars: usedChars, estimated_source_tokens: estimatedSourceTokens, estimated_prompt_overhead_tokens: promptOverheadTokens, estimated_total_prompt_tokens: estimatedTotalPromptTokens, estimated_input_tokens: estimatedTotalPromptTokens, total_packet_sources: packetRecords.length, included_sources: included.map(artifactFromRecord), excluded_sources: excluded, budget_warnings: budgetWarnings, fail_loud_if_no_source_fits: hardMode, text_truncated: false, text_summarized: false, text_compressed: false }, adapter_policy: { prompt_compatibility_mode: "legacy_source_bundle_fields", full_stage_3_archive_preserved_upstream: true, model_input_uses_source_level_selection_only: true, budget_guidance_not_hard_cap_by_default: true, no_text_truncation: true, no_text_summary: true, no_text_compression: true, target_feature_profile_validated_upstream: true, legal_advice_forbidden: true, registry_evaluation_forbidden: true } };
  if (hardFailure) return { ok: false, status: 413, error_type: "TOKEN_BUDGET_EXCEEDED", error: "No legal/governance source could fit inside the configured Stage 6 input budget without truncation.", input_budget: adapterOutput.input_budget, legal_stack_review_input: adapterOutput };
  return { ok: true, status: 200, legal_stack_review_input: adapterOutput };
}
