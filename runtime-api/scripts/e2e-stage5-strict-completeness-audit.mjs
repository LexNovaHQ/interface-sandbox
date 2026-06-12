#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cachePath = process.env.STAGE5_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage5-target-feature-profile.json");
const FINAL_DISPOSITIONS = new Set(["mapped_feature", "duplicate_of", "supporting_only", "insufficient_detail", "non_feature_context"]);

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
  return cache.target_feature_profile_input
    || cache.target_feature_profile_stage_result?.request_body?.input
    || cache.stage5_input
    || cache.input
    || {};
}

function auditLedger(cache) {
  return cache.target_feature_audit_ledger
    || cache.stage5_audit_ledger
    || cache.target_feature_profile_stage_result?.target_feature_audit_ledger
    || cache.target_feature_profile_stage_result?.stage5_audit_ledger
    || null;
}

function sourceId(row) {
  return String(row?.evidence_source_id || row?.source_id || "").trim();
}

function stage5SourceRecords(cache) {
  const input = stage5Input(cache);
  if (Array.isArray(cache.product_family_primary_sources) && cache.product_family_primary_sources.length) return cache.product_family_primary_sources;
  if (Array.isArray(input.product_family_primary_sources) && input.product_family_primary_sources.length) return input.product_family_primary_sources;
  if (Array.isArray(input.source_bundle?.evidence_buffer)) return input.source_bundle.evidence_buffer;
  return [];
}

function indexedCandidates(cache) {
  const input = stage5Input(cache);
  const index = input.target_feature_candidate_index || cache.target_feature_candidate_index || {};
  return Array.isArray(index.candidates) ? index.candidates : [];
}

function ledgerCandidateMap(ledger) {
  return new Map((Array.isArray(ledger?.candidate_walk_ledger) ? ledger.candidate_walk_ledger : []).map((row) => [String(row?.candidate_id || "").trim(), row]).filter(([id]) => id));
}

function ledgerSourceMap(ledger) {
  return new Map((Array.isArray(ledger?.source_walk_ledger) ? ledger.source_walk_ledger : []).map((row) => [String(row?.source_id || "").trim(), row]).filter(([id]) => id));
}

const cache = readJson(cachePath);
const profile = cache.feature_profile_v2 || cache.target_feature_profile;
if (!profile || typeof profile !== "object") fail("Stage 5 profile missing from cache", { cache_path: cachePath });

const ledger = auditLedger(cache);
const features = Array.isArray(profile.feature_inventory) ? profile.feature_inventory : [];
const scan = profile.commercial_scan || {};
const coverage = Array.isArray(scan.source_coverage) ? scan.source_coverage : [];
const outcomes = Array.isArray(scan.distinct_commercial_outcomes_seen) ? scan.distinct_commercial_outcomes_seen : [];
const expectedSources = stage5SourceRecords(cache);
const expectedSourceIds = expectedSources.map(sourceId).filter(Boolean);
const coverageSourceIds = coverage.map((row) => String(row?.source_id || "").trim()).filter(Boolean);
const candidates = indexedCandidates(cache);
const candidateLedger = ledgerCandidateMap(ledger);
const sourceLedger = ledgerSourceMap(ledger);
const missingSourceCoverage = expectedSourceIds.filter((id) => {
  if (coverageSourceIds.includes(id)) return false;
  return !FINAL_DISPOSITIONS.has(sourceLedger.get(id)?.disposition);
});
const missingCandidateLedger = candidates.filter((candidate) => !candidateLedger.has(candidate.candidate_id));
const unresolvedCandidates = candidates.filter((candidate) => !FINAL_DISPOSITIONS.has(candidateLedger.get(candidate.candidate_id)?.disposition));
const finishReasons = [];
for (const attempt of cache.target_feature_profile_stage_result?.model_metadata?.attempted_models || []) if (attempt?.finish_reason) finishReasons.push(attempt.finish_reason);

const failures = [];
if (!ledger) failures.push("target_feature_audit_ledger missing from Stage 5 cache/runtime result");
if (expectedSourceIds.length && coverage.length < expectedSourceIds.length && missingSourceCoverage.length) failures.push(`source_coverage rows (${coverage.length}) fewer than Stage 5 primary sources (${expectedSourceIds.length}) without ledger accounting`);
if (missingSourceCoverage.length) failures.push(`source_coverage/audit ledger missing Stage 5 source IDs: ${missingSourceCoverage.join(", ")}`);
if (!candidates.length) failures.push("target_feature_candidate_index missing or empty in Stage 5 input/cache");
if (missingCandidateLedger.length) failures.push(`audit ledger missing candidate IDs: ${missingCandidateLedger.map((candidate) => candidate.candidate_id).join(", ")}`);
if (unresolvedCandidates.length) failures.push(`indexed candidates unresolved in audit ledger: ${unresolvedCandidates.map((candidate) => candidate.candidate_id).join(", ")}`);
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
  deterministic_candidate_index_source: "target_feature_candidate_index",
  deterministic_candidate_count: candidates.length,
  audit_ledger_source: ledger ? "target_feature_audit_ledger" : "missing",
  missing_candidate_ledger_ids: missingCandidateLedger.map((candidate) => candidate.candidate_id),
  unresolved_candidate_ids: unresolvedCandidates.map((candidate) => candidate.candidate_id),
  finish_reasons: finishReasons,
  failures
};

if (failures.length) fail("Stage 5 strict completeness audit failed", payload);
console.log(JSON.stringify(payload, null, 2));
