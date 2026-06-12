#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { evaluateCandidateFeatureCompatibility } from "../src/diligence/stage5TargetFeaturePackageBuilder.js";

const cachePath = process.env.STAGE5_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage5-target-feature-profile.json");
const allowPartial = process.env.STAGE5_ALLOW_PARTIAL_COMPLETENESS === "true";
const minMappedRatio = Number(process.env.STAGE5_COMPLETENESS_MIN_MAPPED_RATIO || 0.8);
const FINAL_DISPOSITIONS = new Set(["mapped_feature", "duplicate_of", "supporting_only", "insufficient_detail", "non_feature_context"]);
const MAPPED_LIKE = new Set(["mapped", "supporting", "duplicate"]);
const COVERAGE_STATUSES = new Set(["mapped", "supporting", "duplicate", "insufficient_detail", "non_feature_context"]);

function fail(message, detail = {}) {
  console.error(JSON.stringify({ ok: false, step: "stage5_completeness_audit", error: message, ...detail }, null, 2));
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

function ledgerAccountsSource(id, sourceLedger, coverageIds) {
  if (coverageIds.includes(id)) return true;
  const row = sourceLedger.get(id);
  return FINAL_DISPOSITIONS.has(row?.disposition);
}

function mappedFeatureMap(profile = {}) {
  return new Map((Array.isArray(profile.feature_inventory) ? profile.feature_inventory : []).map((feature) => [String(feature?.feature_id || "").trim(), feature]).filter(([id]) => id));
}

function mappedIds(row = {}) {
  return Array.isArray(row.mapped_feature_ids) ? row.mapped_feature_ids.map((id) => String(id || "").trim()).filter(Boolean) : [];
}

function hasReason(row = {}) {
  return Boolean(String(row?.unmapped_reason || row?.reason || row?.coverage_reason || "").trim());
}

function sourceCoverageInvariantFailures(coverage, featureById, sourceLedger) {
  const failures = [];
  for (let index = 0; index < coverage.length; index += 1) {
    const row = coverage[index];
    const path = `/commercial_scan/source_coverage/${index}`;
    if (!row || typeof row !== "object") { failures.push(`${path}: row is not an object`); continue; }
    const ids = mappedIds(row);
    const sourceLedgerRow = sourceLedger.get(String(row.source_id || "").trim()) || {};
    if (!COVERAGE_STATUSES.has(row.coverage_status)) failures.push(`${path}: invalid coverage_status ${row.coverage_status || "missing"}`);
    if (row.coverage_status === "mapped" && !ids.length) failures.push(`${path}: mapped requires mapped_feature_ids`);
    for (const id of ids) if (!featureById.has(id)) failures.push(`${path}: mapped_feature_id ${id} missing from feature_inventory`);
    if (row.coverage_status === "supporting" && !ids.length && !hasReason(row)) failures.push(`${path}: supporting requires mapped_feature_ids or reason`);
    if (row.coverage_status === "duplicate" && !row.duplicate_of && sourceLedgerRow.disposition !== "duplicate_of" && !sourceLedgerRow.duplicate_of) failures.push(`${path}: duplicate requires duplicate_of or duplicate ledger relation`);
    if (row.coverage_status === "insufficient_detail" && !hasReason(row)) failures.push(`${path}: insufficient_detail requires reason`);
    if (row.coverage_status === "non_feature_context" && sourceLedgerRow.source_role === "primary_function_source" && !hasReason(row)) failures.push(`${path}: primary source cannot be non_feature_context without reason`);
  }
  return failures;
}

const cache = readJson(cachePath);
const profile = cache.feature_profile_v2 || cache.target_feature_profile;
if (!profile || typeof profile !== "object") fail("Stage 5 profile missing from cache", { cache_path: cachePath });

const ledger = auditLedger(cache);
const scan = profile.commercial_scan || {};
const coverage = Array.isArray(scan.source_coverage) ? scan.source_coverage : [];
const outcomes = Array.isArray(scan.distinct_commercial_outcomes_seen) ? scan.distinct_commercial_outcomes_seen : [];
const unmapped = Array.isArray(scan.unmapped_outcomes_due_to_insufficient_detail) ? scan.unmapped_outcomes_due_to_insufficient_detail : [];
const features = Array.isArray(profile.feature_inventory) ? profile.feature_inventory : [];
const expectedSources = stage5SourceRecords(cache);
const expectedSourceIds = expectedSources.map(sourceId).filter(Boolean);
const coverageSourceIds = coverage.map((row) => String(row?.source_id || "").trim()).filter(Boolean);
const candidates = indexedCandidates(cache);
const candidateLedger = ledgerCandidateMap(ledger);
const sourceLedger = ledgerSourceMap(ledger);
const featureById = mappedFeatureMap(profile);
const missingSourceCoverage = expectedSourceIds.filter((id) => !ledgerAccountsSource(id, sourceLedger, coverageSourceIds));
const extraSourceCoverage = coverageSourceIds.filter((id) => expectedSourceIds.length && !expectedSourceIds.includes(id));
const invalidCoverage = coverage.filter((row) => !row || typeof row !== "object" || !COVERAGE_STATUSES.has(row.coverage_status));
const mappedCoverage = coverage.filter((row) => row && MAPPED_LIKE.has(row.coverage_status));
const mappedRatio = coverage.length ? mappedCoverage.length / coverage.length : 0;
const missingMappedFeatureIds = coverage.filter((row) => row && MAPPED_LIKE.has(row.coverage_status) && (!Array.isArray(row.mapped_feature_ids) || row.mapped_feature_ids.length === 0));
const missingCandidateLedger = candidates.filter((candidate) => !candidateLedger.has(candidate.candidate_id));
const unresolvedCandidates = candidates.filter((candidate) => {
  const row = candidateLedger.get(candidate.candidate_id);
  return !FINAL_DISPOSITIONS.has(row?.disposition);
});
const incompatibleCandidates = candidates.filter((candidate) => {
  const ledgerRow = candidateLedger.get(candidate.candidate_id);
  if (ledgerRow?.disposition !== "mapped_feature" || !ledgerRow?.mapped_feature_id) return false;
  const feature = featureById.get(String(ledgerRow.mapped_feature_id));
  if (!feature) return false;
  return evaluateCandidateFeatureCompatibility({ ...candidate, candidate_cluster: ledgerRow.candidate_cluster || candidate.candidate_cluster }, feature).compatible === false;
});
const invariantFailures = sourceCoverageInvariantFailures(coverage, featureById, sourceLedger);
const finishReasons = [];
for (const attempt of cache.target_feature_profile_stage_result?.model_metadata?.attempted_models || []) if (attempt?.finish_reason) finishReasons.push(attempt.finish_reason);
const maxTokens = finishReasons.includes("MAX_TOKENS");

const failures = [];
const warnings = [];
if (!ledger) failures.push("target_feature_audit_ledger missing from Stage 5 cache/runtime result");
if (!candidates.length) failures.push("target_feature_candidate_index missing or empty in Stage 5 input/cache");
if (!features.length) warnings.push("feature_inventory is empty; advisory only when all candidates and sources are accounted");
if (!outcomes.length) warnings.push("distinct_commercial_outcomes_seen is empty");
if (missingSourceCoverage.length && !allowPartial) failures.push(`source_coverage/audit ledger missing Stage 5 source IDs: ${missingSourceCoverage.join(", ")}`);
else if (missingSourceCoverage.length) warnings.push(`source_coverage/audit ledger missing Stage 5 source IDs under allow_partial=true: ${missingSourceCoverage.join(", ")}`);
if (extraSourceCoverage.length) warnings.push(`source_coverage contains source IDs not in Stage 5 primary packet: ${extraSourceCoverage.join(", ")}`);
if (invalidCoverage.length) failures.push(`source_coverage has invalid rows/statuses (${invalidCoverage.length})`);
if (missingMappedFeatureIds.length && !allowPartial) failures.push(`mapped/supporting/duplicate source_coverage rows lack mapped_feature_ids (${missingMappedFeatureIds.length})`);
else if (missingMappedFeatureIds.length) warnings.push(`mapped/supporting/duplicate source_coverage rows lack mapped_feature_ids under allow_partial=true (${missingMappedFeatureIds.length})`);
if (missingCandidateLedger.length) failures.push(`audit ledger missing candidate IDs: ${missingCandidateLedger.map((candidate) => candidate.candidate_id).join(", ")}`);
if (unresolvedCandidates.length && !allowPartial) failures.push(`indexed candidates not resolved in audit ledger: ${unresolvedCandidates.map((candidate) => candidate.candidate_id).join(", ")}`);
else if (unresolvedCandidates.length) warnings.push(`indexed candidates unresolved under allow_partial=true: ${unresolvedCandidates.map((candidate) => candidate.candidate_id).join(", ")}`);
if (incompatibleCandidates.length) failures.push(`mapped candidates semantically incompatible with mapped features: ${incompatibleCandidates.map((candidate) => candidate.candidate_id).join(", ")}`);
if (invariantFailures.length && !allowPartial) failures.push(`source coverage invariants failed: ${invariantFailures.join(" | ")}`);
else if (invariantFailures.length) warnings.push(`source coverage invariant warnings under allow_partial=true: ${invariantFailures.join(" | ")}`);
if (scan.completeness_status !== "COMPLETE") warnings.push(`completeness_status is ${scan.completeness_status || "missing"}; accepted only when ledger accounts all sources/candidates`);
if (coverage.length && mappedRatio < minMappedRatio) warnings.push(`mapped/supporting/duplicate coverage ratio ${mappedRatio.toFixed(2)} below advisory threshold ${minMappedRatio}`);
if (unmapped.length) warnings.push(`unmapped outcomes present (${unmapped.length})`);
if (maxTokens) failures.push("model finish_reason MAX_TOKENS; Stage 5 output may be truncated/incomplete");

const payload = {
  ok: failures.length === 0,
  step: "stage5_completeness_audit",
  cache_path: cachePath,
  feature_count: features.length,
  outcome_count: outcomes.length,
  source_coverage_count: coverage.length,
  expected_stage5_source_count: expectedSourceIds.length,
  expected_stage5_source_ids: expectedSourceIds,
  source_coverage_ids: coverageSourceIds,
  missing_source_coverage_ids: missingSourceCoverage,
  deterministic_candidate_count: candidates.length,
  missing_candidate_ledger_ids: missingCandidateLedger.map((candidate) => candidate.candidate_id),
  unresolved_candidate_ids: unresolvedCandidates.map((candidate) => candidate.candidate_id),
  incompatible_candidate_ids: incompatibleCandidates.map((candidate) => candidate.candidate_id),
  source_coverage_invariant_failures: invariantFailures,
  mapped_coverage_count: mappedCoverage.length,
  mapped_coverage_ratio: Number(mappedRatio.toFixed(3)),
  completeness_status: scan.completeness_status || null,
  completeness_warning_count: Array.isArray(scan.completeness_warnings) ? scan.completeness_warnings.length : 0,
  unmapped_outcome_count: unmapped.length,
  finish_reasons: finishReasons,
  allow_partial: allowPartial,
  warnings,
  failures
};

if (failures.length) fail("Stage 5 completeness audit failed", payload);
console.log(JSON.stringify(payload, null, 2));
