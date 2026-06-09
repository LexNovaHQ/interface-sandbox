import crypto from "node:crypto";

const DEFAULT_MAX_INPUT_CHARS = 120000;
const DEFAULT_MAX_ESTIMATED_TOKENS = 60000;
const DEFAULT_MAX_SINGLE_SOURCE_CHARS = 60000;
const DEFAULT_PROMPT_OVERHEAD_TOKENS = 25000;
const ESTIMATED_CHARS_PER_TOKEN = 3;
const LEGAL_SOURCE_FAMILIES = new Set(["legal_profile", "governance_profile"]);

function nowIso() { return new Date().toISOString(); }
function sha256(value) { return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex"); }
function cleanText(record = {}) { return record?.text?.clean_text_lossless || record?.clean_text_lossless || ""; }
function titleOf(record = {}) { return record?.structure?.title || record?.title || ""; }
function normalizeLimit(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null; }
function estimateSourceTokens(chars) { return Math.ceil(Number(chars || 0) / ESTIMATED_CHARS_PER_TOKEN); }
function estimateTotalPromptTokens(sourceChars, promptOverheadTokens = DEFAULT_PROMPT_OVERHEAD_TOKENS) { return estimateSourceTokens(sourceChars) + promptOverheadTokens; }

function sourceSpecificity(record = {}) {
  const url = String(record.final_url || record.url || "").toLowerCase();
  const title = String(titleOf(record) || "").toLowerCase();
  const text = cleanText(record).toLowerCase();
  let score = 0;
  if (record.source_family === "legal_profile") score += 30;
  if (record.source_family === "governance_profile") score += 25;
  if (/terms|privacy|dpa|data-processing|acceptable-use|aup|sla|service-level|security|trust|subprocessor|compliance|legal/.test(url)) score += 40;
  if (/terms|privacy|dpa|data processing|acceptable use|prohibited use|sla|service level|security|trust|subprocessor|compliance/.test(title)) score += 30;
  if (/data processing addendum|data processing agreement|acceptable use|service level agreement|sub-?processors?|annexure|schedule|addendum|prohibited use|support services|limitation of liability|disclaimer|governing law|privacy policy/.test(text)) score += 30;
  score += Math.min(cleanText(record).length, 40000) / 4000;
  return score;
}

function sortSources(records = []) {
  return [...records].sort((a, b) => sourceSpecificity(b) - sourceSpecificity(a));
}

function allSourceRecords(sourceBundle = {}, evidenceJunction = {}) {
  const fromArchive = Array.isArray(sourceBundle?.raw_footprint?.source_records) ? sourceBundle.raw_footprint.source_records : [];
  if (fromArchive.length) return fromArchive;
  const packets = evidenceJunction?.downstream_packets || {};
  const seen = new Set();
  const out = [];
  for (const key of ["legal_stack_review", "governance_review", "registry_matching", "registry_ledger_evaluation"]) {
    for (const record of Array.isArray(packets?.[key]?.source_records) ? packets[key].source_records : []) {
      const id = record.evidence_source_id || `${record.source_family}|${record.url}|${record.final_url}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(record);
    }
  }
  return out;
}

function legalGovernanceRecords(sourceBundle = {}, evidenceJunction = {}) {
  return allSourceRecords(sourceBundle, evidenceJunction).filter((record) => LEGAL_SOURCE_FAMILIES.has(record.source_family));
}

function artifactFromRecord(record = {}) {
  const text = cleanText(record);
  return {
    evidence_source_id: record.evidence_source_id || null,
    source_family: record.source_family || "unknown",
    source_url: record.url || null,
    final_url: record.final_url || null,
    title: titleOf(record),
    word_count: record?.text?.word_count || record.word_count || 0,
    clean_text_sha256: record?.text?.clean_text_sha256 || record.clean_text_sha256 || sha256(text),
    clean_text_length: text.length,
    estimated_source_tokens: estimateSourceTokens(text.length),
    coverage_status: record?.quality?.coverage_status || record.coverage_status || "unknown",
    full_text_in_evidence_buffer: true
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
    clean_text_sha256: record?.text?.clean_text_sha256 || record.clean_text_sha256 || sha256(text),
    word_count: record?.text?.word_count || record.word_count || 0,
    estimated_source_tokens: estimateSourceTokens(text.length),
    clean_text_lossless: text,
    evidence_policy: {
      admitted_source: true,
      discovery_only: false,
      full_text_lossless: true,
      summarized: false,
      compressed: false,
      truncated_by_stage_7_adapter: false
    }
  };
}

function compactTargetFeatureProfile(profile = {}) {
  return {
    target_profile: profile.target_profile || {},
    primary_product: profile.primary_product || {},
    product_feature_map: Array.isArray(profile.product_feature_map) ? profile.product_feature_map : [],
    feature_map_scratchpad: Array.isArray(profile.feature_map_scratchpad) ? profile.feature_map_scratchpad : [],
    limitations: Array.isArray(profile.limitations) ? profile.limitations : []
  };
}

function compactLegalStackReview(review = {}) {
  return {
    legal_stack: Array.isArray(review.legal_stack) ? review.legal_stack : [],
    document_stack_redline: Array.isArray(review.document_stack_redline) ? review.document_stack_redline : [],
    document_stack_synthesis: review.document_stack_synthesis || {},
    legal_stack_assessment: Array.isArray(review.legal_stack_assessment) ? review.legal_stack_assessment : [],
    limitations: Array.isArray(review.limitations) ? review.limitations : []
  };
}

function normalizeBatch(batch = {}) {
  const rows = Array.isArray(batch.registry_rows) ? batch.registry_rows : [];
  return {
    run_id: batch.run_id || "pending-run-id",
    batch_id: batch.batch_id || `registry_batch_${Date.now()}`,
    batch_number: batch.batch_number || 1,
    batch_count: batch.batch_count || 1,
    batch_size: rows.length,
    registry_count_loaded: rows.length,
    registry_total_count: batch.registry_total_count || batch.registry_count_loaded || rows.length,
    registry_range: batch.registry_range || { start_position: 1, end_position: rows.length },
    expected_threat_ids: batch.expected_threat_ids || rows.map((row, index) => String(row.Threat_ID || row.threat_id || `MISSING_THREAT_ID_ROW_${index + 1}`)),
    registry_rows: rows
  };
}

export function buildRegistryLedgerInput({
  sourceBundle = {},
  evidenceJunction = {},
  targetFeatureProfile = null,
  legalStackReview = null,
  registryBatch = {},
  registryKey = {},
  runId = null,
  generatedAt = nowIso(),
  budget = {}
} = {}) {
  const batch = normalizeBatch(registryBatch);
  const sortedRecords = sortSources(legalGovernanceRecords(sourceBundle, evidenceJunction));
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
    const exclusionBase = { ...artifactFromRecord(record), clean_text_length: textLength };
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
  if (excluded.length) limitations.push("Some admitted legal/governance sources were excluded from the Registry Ledger model input by deterministic source-level budget selection. They remain preserved in the Stage 3 evidence archive.");
  if (hardFailure) limitations.push("No non-empty legal/governance source could fit inside the configured Stage 7 input budget without truncation.");

  const adapterOutput = {
    registry_ledger_input_version: "registry_ledger_input_v1",
    run_id: runId || batch.run_id || `registry_ledger_input_${Date.now()}`,
    batch_id: batch.batch_id,
    generated_at: generatedAt,
    registry_batch_meta: {
      run_id: runId || batch.run_id,
      batch_id: batch.batch_id,
      batch_number: batch.batch_number,
      batch_count: batch.batch_count,
      batch_size: batch.batch_size,
      registry_count_loaded: batch.registry_rows.length,
      registry_total_count: batch.registry_total_count,
      registry_range: batch.registry_range,
      expected_threat_ids: batch.expected_threat_ids
    },
    registry_rows: batch.registry_rows,
    registry_key: registryKey,
    source_bundle: {
      run_id: sourceBundle.run_id || null,
      source_mode: sourceBundle.source_mode || "runtime_discovery_capture",
      target_input: sourceBundle.target_input || evidenceJunction.target_input || {},
      source_review: {
        source_bundle_version: sourceBundle.source_bundle_version || null,
        evidence_junction_version: evidenceJunction.evidence_junction_version || null,
        source_bundle_sha256: evidenceJunction.source_bundle_sha256 || sourceBundle?.scrape_meta?.hashes?.raw_footprint_sha256 || null,
        downstream_stage: "registry_ledger_evaluation",
        source_selection_policy: "legal_profile_and_governance_profile_full_text_only",
        packet_source_count: sortedRecords.length,
        included_source_count: included.length,
        excluded_source_count: excluded.length
      },
      artifact_inventory: included.map(artifactFromRecord),
      evidence_buffer: included.map(evidenceFromRecord),
      limitations: [
        ...(Array.isArray(sourceBundle?.source_discovery?.coverage_gaps) ? sourceBundle.source_discovery.coverage_gaps.map((gap) => typeof gap === "string" ? gap : JSON.stringify(gap)) : []),
        ...limitations
      ]
    },
    target_feature_profile: compactTargetFeatureProfile(targetFeatureProfile || {}),
    legal_stack_review: compactLegalStackReview(legalStackReview || {}),
    input_budget: {
      budget_status: hardFailure ? "TOKEN_BUDGET_EXCEEDED" : (excluded.length ? "PARTIAL_SOURCE_SELECTION" : "FULL_PACKET_INCLUDED"),
      max_input_chars: maxInputChars,
      max_estimated_tokens: maxEstimatedTokens,
      max_single_source_chars: maxSingleSourceChars,
      prompt_overhead_tokens: promptOverheadTokens,
      source_token_estimation_ratio_chars_per_token: ESTIMATED_CHARS_PER_TOKEN,
      estimated_input_chars: usedChars,
      estimated_source_tokens: estimatedSourceTokens,
      estimated_prompt_overhead_tokens: promptOverheadTokens,
      estimated_total_prompt_tokens: estimatedTotalPromptTokens,
      total_candidate_legal_governance_sources: sortedRecords.length,
      included_sources: included.map(artifactFromRecord),
      excluded_sources: excluded,
      fail_loud_if_no_source_fits: true,
      text_truncated: false,
      text_summarized: false,
      text_compressed: false
    },
    adapter_policy: {
      prompt_compatibility_mode: "registry_stage_04_fields",
      full_legal_profile_text_preserved: true,
      full_governance_profile_text_preserved: true,
      product_full_text_excluded_by_design: true,
      product_truth_from_target_feature_profile: true,
      legal_truth_from_legal_stack_review_plus_full_legal_governance_text: true,
      no_text_truncation: true,
      no_text_summary: true,
      no_text_compression: true,
      batch_evaluation_required: true
    }
  };

  if (hardFailure) return { ok: false, status: 413, error_type: "TOKEN_BUDGET_EXCEEDED", error: "No legal/governance source could fit inside the configured Stage 7 input budget without truncation.", input_budget: adapterOutput.input_budget, registry_ledger_input: adapterOutput };
  return { ok: true, status: 200, registry_ledger_input: adapterOutput };
}
