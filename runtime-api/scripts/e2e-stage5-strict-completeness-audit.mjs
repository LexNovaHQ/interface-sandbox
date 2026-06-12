#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cachePath = process.env.STAGE5_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage5-target-feature-profile.json");

function fail(message, detail = {}) {
  console.error(JSON.stringify({ ok: false, step: "stage5_strict_completeness_audit", error: message, ...detail }, null, 2));
  process.exit(1);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) fail("Stage 5 cache not found", { cache_path: filePath });
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch (error) { fail("Stage 5 cache is not valid JSON", { cache_path: filePath, error: error.message }); }
}

function stage5Input(cache) {
  return cache.target_feature_profile_stage_result?.request_body?.input || cache.stage5_input || cache.input || {};
}

function stage5SourceRecords(cache) {
  const packet = cache.evidence_junction?.downstream_packets?.target_feature_profile;
  if (Array.isArray(packet?.source_records)) return packet.source_records;
  if (Array.isArray(packet?.included_sources)) return packet.included_sources;
  if (Array.isArray(cache.target_feature_profile_stage_result?.request_body?.input?.source_bundle?.evidence_buffer)) return cache.target_feature_profile_stage_result.request_body.input.source_bundle.evidence_buffer;
  if (Array.isArray(cache.source_bundle?.evidence_buffer)) return cache.source_bundle.evidence_buffer;
  return [];
}

function sourceId(row) {
  return String(row?.evidence_source_id || row?.source_id || "").trim();
}

function textOfFeature(feature = {}) {
  return [feature.feature_name, feature.commercial_function, feature.business_label_or_product_area, feature.feature_description, feature.system_action, feature.output_or_result, ...(Array.isArray(feature.evidence_refs) ? feature.evidence_refs : [])].filter(Boolean).join(" ").toLowerCase();
}

function textOfRecord(record = {}) {
  return [record.url, record.final_url, record.title, record.structure?.title, record.source_family, record.text?.clean_text_lossless, record.clean_text_lossless].filter(Boolean).join("\n").toLowerCase();
}

const candidateRules = [
  ["text_to_speech", "text-to-speech / speech synthesis", ["text-to-speech", "text to speech", "tts", "speech synthesis"]],
  ["speech_to_text", "speech-to-text / transcription", ["speech-to-text", "speech to text", "asr", "transcription", "transcribe"]],
  ["translation", "translation", ["translation", "translate", "machine translation"]],
  ["document_digitisation", "document digitisation / OCR", ["document digitisation", "document digitization", "ocr", "document parsing"]],
  ["dubbing", "dubbing", ["dubbing", "dub"]],
  ["voice_agent", "voice agent / conversational AI", ["voice agent", "voice ai", "conversational ai"]],
  ["language_model", "language model / generative text", ["language model", "large language model", "llm", "chat completion", "text generation"]],
  ["embeddings", "embeddings", ["embedding", "embeddings"]]
];

function detectCandidates(records) {
  const out = new Map();
  for (const record of records) {
    const haystack = textOfRecord(record);
    const id = sourceId(record);
    for (const [candidateId, label, terms] of candidateRules) {
      if (!terms.some((term) => haystack.includes(term))) continue;
      const current = out.get(candidateId) || { candidate_id: candidateId, label, source_ids: [], source_urls: [], index_source: "strict_audit_keyword_fallback" };
      if (id && !current.source_ids.includes(id)) current.source_ids.push(id);
      const url = record.final_url || record.url;
      if (url && !current.source_urls.includes(url)) current.source_urls.push(url);
      out.set(candidateId, current);
    }
  }
  return [...out.values()];
}

function indexedCandidates(cache) {
  const index = stage5Input(cache)?.target_feature_candidate_index || cache.target_feature_candidate_index;
  const rows = Array.isArray(index?.candidates) ? index.candidates : [];
  if (!rows.length) return [];
  return rows.map((row, i) => ({
    candidate_id: String(row.candidate_id || `CAND_${String(i + 1).padStart(3, "0")}`),
    label: String(row.candidate_label || row.label || row.raw_label || row.source_url || "unknown_candidate"),
    source_ids: Array.isArray(row.source_ids) ? row.source_ids.map(String) : [row.source_id, row.evidence_source_id].filter(Boolean).map(String),
    source_urls: Array.isArray(row.source_urls) ? row.source_urls.map(String) : [row.source_url, row.url, row.final_url].filter(Boolean).map(String),
    candidate_type: row.candidate_type || "unknown",
    index_source: "target_feature_candidate_index"
  }));
}

function candidateTerms(candidate) {
  const ruleTerms = candidateRules.find(([id]) => id === candidate.candidate_id)?.[2] || [];
  const labelTerms = String(candidate.label || "").toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length >= 4);
  return [...new Set([...ruleTerms, String(candidate.label || "").toLowerCase(), ...labelTerms].filter(Boolean))];
}

function candidateAccounted(candidate, featureText, scanText, coverageText) {
  const terms = candidateTerms(candidate);
  const sourceTokens = [...(candidate.source_ids || []), ...(candidate.source_urls || [])].map((x) => String(x).toLowerCase());
  return [...terms, ...sourceTokens].some((term) => featureText.includes(term) || scanText.includes(term) || coverageText.includes(term));
}

const cache = readJson(cachePath);
const profile = cache.feature_profile_v2 || cache.target_feature_profile;
if (!profile || typeof profile !== "object") fail("Stage 5 profile missing from cache", { cache_path: cachePath });

const features = Array.isArray(profile.feature_inventory) ? profile.feature_inventory : [];
const scan = profile.commercial_scan || {};
const coverage = Array.isArray(scan.source_coverage) ? scan.source_coverage : [];
const outcomes = Array.isArray(scan.distinct_commercial_outcomes_seen) ? scan.distinct_commercial_outcomes_seen : [];
const unmapped = Array.isArray(scan.unmapped_outcomes_due_to_insufficient_detail) ? scan.unmapped_outcomes_due_to_insufficient_detail : [];
const expectedSources = stage5SourceRecords(cache);
const expectedSourceIds = expectedSources.map(sourceId).filter(Boolean);
const coverageSourceIds = coverage.map((row) => String(row?.source_id || "").trim()).filter(Boolean);
const missingSourceCoverage = expectedSourceIds.filter((id) => !coverageSourceIds.includes(id));
const deterministicIndexCandidates = indexedCandidates(cache);
const candidates = deterministicIndexCandidates.length ? deterministicIndexCandidates : detectCandidates(expectedSources);
const featureText = features.map(textOfFeature).join("\n");
const scanText = [...outcomes, ...unmapped].join("\n").toLowerCase();
const coverageText = JSON.stringify(coverage).toLowerCase();
const unaccountedCandidates = candidates.filter((candidate) => !candidateAccounted(candidate, featureText, scanText, coverageText));
const finishReasons = [];
for (const attempt of cache.target_feature_profile_stage_result?.model_metadata?.attempted_models || []) if (attempt?.finish_reason) finishReasons.push(attempt.finish_reason);

const failures = [];
if (!features.length) failures.push("feature_inventory is empty");
if (!outcomes.length) failures.push("commercial_scan.distinct_commercial_outcomes_seen is empty");
if (!coverage.length) failures.push("commercial_scan.source_coverage is empty");
if (expectedSourceIds.length && coverage.length < expectedSourceIds.length) failures.push(`source_coverage rows (${coverage.length}) fewer than Stage 5 packet sources (${expectedSourceIds.length})`);
if (missingSourceCoverage.length) failures.push(`source_coverage missing Stage 5 source IDs: ${missingSourceCoverage.join(", ")}`);
if (!deterministicIndexCandidates.length) failures.push("target_feature_candidate_index missing or empty in Stage 5 input/cache");
if (unaccountedCandidates.length) failures.push(`visible/indexed commercial candidates neither mapped nor listed as insufficient_detail: ${unaccountedCandidates.map((candidate) => candidate.label).join(" | ")}`);
if (finishReasons.includes("MAX_TOKENS")) failures.push("model finish_reason MAX_TOKENS; Stage 5 may be truncated");

const payload = {
  ok: failures.length === 0,
  step: "stage5_strict_completeness_audit",
  cache_path: cachePath,
  feature_count: features.length,
  outcome_count: outcomes.length,
  source_coverage_count: coverage.length,
  expected_stage5_source_count: expectedSourceIds.length,
  missing_source_coverage_ids: missingSourceCoverage,
  deterministic_candidate_count: candidates.length,
  deterministic_candidate_index_source: deterministicIndexCandidates.length ? "target_feature_candidate_index" : "strict_audit_keyword_fallback",
  deterministic_candidates: candidates,
  unaccounted_candidate_count: unaccountedCandidates.length,
  unaccounted_candidates: unaccountedCandidates,
  finish_reasons: finishReasons,
  failures
};

if (failures.length) fail("Stage 5 strict completeness audit failed", payload);
console.log(JSON.stringify(payload, null, 2));
