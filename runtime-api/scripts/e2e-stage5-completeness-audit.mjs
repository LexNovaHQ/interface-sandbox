#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cachePath = process.env.STAGE5_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage5-target-feature-profile.json");
const allowPartial = process.env.STAGE5_ALLOW_PARTIAL_COMPLETENESS === "true";
const minMappedRatio = Number(process.env.STAGE5_COMPLETENESS_MIN_MAPPED_RATIO || 0.8);

function fail(message, detail = {}) {
  console.error(JSON.stringify({ ok: false, step: "stage5_completeness_audit", error: message, ...detail }, null, 2));
  process.exit(1);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) fail("Stage 5 cache not found", { cache_path: filePath });
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch (error) { fail("Stage 5 cache is not valid JSON", { cache_path: filePath, error: error.message }); }
}

const cache = readJson(cachePath);
const profile = cache.feature_profile_v2 || cache.target_feature_profile;
if (!profile || typeof profile !== "object") fail("Stage 5 profile missing from cache", { cache_path: cachePath });

const scan = profile.commercial_scan || {};
const coverage = Array.isArray(scan.source_coverage) ? scan.source_coverage : [];
const outcomes = Array.isArray(scan.distinct_commercial_outcomes_seen) ? scan.distinct_commercial_outcomes_seen : [];
const unmapped = Array.isArray(scan.unmapped_outcomes_due_to_insufficient_detail) ? scan.unmapped_outcomes_due_to_insufficient_detail : [];
const features = Array.isArray(profile.feature_inventory) ? profile.feature_inventory : [];
const coverageStatuses = new Set(["mapped", "supporting", "duplicate", "insufficient_detail", "non_feature_context"]);
const mappedLike = new Set(["mapped", "supporting", "duplicate"]);
const invalidCoverage = coverage.filter((row) => !row || typeof row !== "object" || !coverageStatuses.has(row.coverage_status));
const mappedCoverage = coverage.filter((row) => row && mappedLike.has(row.coverage_status));
const mappedRatio = coverage.length ? mappedCoverage.length / coverage.length : 0;
const missingMappedFeatureIds = coverage.filter((row) => row && mappedLike.has(row.coverage_status) && (!Array.isArray(row.mapped_feature_ids) || row.mapped_feature_ids.length === 0));
const sourceBundleSources = Array.isArray(cache.source_bundle?.evidence_buffer) ? cache.source_bundle.evidence_buffer.length : null;
const finishReasons = [];
for (const attempt of cache.target_feature_profile_stage_result?.model_metadata?.attempted_models || []) {
  if (attempt?.finish_reason) finishReasons.push(attempt.finish_reason);
}
const maxTokens = finishReasons.includes("MAX_TOKENS");

const failures = [];
if (!features.length) failures.push("feature_inventory is empty");
if (!outcomes.length) failures.push("distinct_commercial_outcomes_seen is empty");
if (!coverage.length) failures.push("commercial_scan.source_coverage is empty or missing");
if (sourceBundleSources !== null && coverage.length && coverage.length < sourceBundleSources) failures.push(`source_coverage rows (${coverage.length}) fewer than Stage 5 evidence_buffer sources (${sourceBundleSources})`);
if (invalidCoverage.length) failures.push(`source_coverage has invalid rows/statuses (${invalidCoverage.length})`);
if (missingMappedFeatureIds.length) failures.push(`mapped/supporting/duplicate source_coverage rows lack mapped_feature_ids (${missingMappedFeatureIds.length})`);
if (!allowPartial && scan.completeness_status !== "COMPLETE") failures.push(`completeness_status is ${scan.completeness_status || "missing"}, expected COMPLETE`);
if (allowPartial && !["COMPLETE", "PARTIAL"].includes(scan.completeness_status)) failures.push(`completeness_status is ${scan.completeness_status || "missing"}, expected COMPLETE or PARTIAL`);
if (coverage.length && mappedRatio < minMappedRatio && !allowPartial) failures.push(`mapped/supporting/duplicate coverage ratio ${mappedRatio.toFixed(2)} below threshold ${minMappedRatio}`);
if (unmapped.length && !allowPartial) failures.push(`unmapped outcomes present (${unmapped.length})`);
if (maxTokens) failures.push("model finish_reason MAX_TOKENS; Stage 5 output may be truncated/incomplete");

const payload = {
  ok: failures.length === 0,
  step: "stage5_completeness_audit",
  cache_path: cachePath,
  feature_count: features.length,
  outcome_count: outcomes.length,
  source_coverage_count: coverage.length,
  source_bundle_evidence_count: sourceBundleSources,
  mapped_coverage_count: mappedCoverage.length,
  mapped_coverage_ratio: Number(mappedRatio.toFixed(3)),
  completeness_status: scan.completeness_status || null,
  completeness_warning_count: Array.isArray(scan.completeness_warnings) ? scan.completeness_warnings.length : 0,
  unmapped_outcome_count: unmapped.length,
  finish_reasons: finishReasons,
  allow_partial: allowPartial,
  failures
};

if (failures.length) fail("Stage 5 completeness audit failed", payload);
console.log(JSON.stringify(payload, null, 2));
