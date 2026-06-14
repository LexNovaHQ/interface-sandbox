#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cachePath = process.env.STAGE5_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage5-target-feature-profile.json");
const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
const profile = cache.feature_profile_v2 || cache.target_feature_profile || {};
const input = cache.target_feature_profile_input || cache.target_feature_profile_stage_result?.request_body?.input || cache.input || {};
const ledger = cache.target_feature_audit_ledger || cache.stage5_audit_ledger || cache.target_feature_profile_stage_result?.target_feature_audit_ledger || cache.target_feature_profile_stage_result?.stage5_audit_ledger || {};
const features = Array.isArray(profile.feature_inventory) ? profile.feature_inventory : [];
const scan = profile.commercial_scan || {};
const coverage = Array.isArray(scan.source_coverage) ? scan.source_coverage : [];
const outcomes = Array.isArray(scan.distinct_commercial_outcomes_seen) ? scan.distinct_commercial_outcomes_seen : [];
const candidates = Array.isArray(input.target_feature_candidate_index?.candidates) ? input.target_feature_candidate_index.candidates : [];
const candidateLedger = new Set((Array.isArray(ledger.candidate_walk_ledger) ? ledger.candidate_walk_ledger : []).map((r) => String(r?.candidate_id || "").trim()).filter(Boolean));
const missingCandidateLedger = candidates.filter((c) => !candidateLedger.has(String(c?.candidate_id || "").trim()));
const finishReasons = [];
for (const attempt of cache.target_feature_profile_stage_result?.model_metadata?.attempted_models || []) if (attempt?.finish_reason) finishReasons.push(attempt.finish_reason);

const failures = [];
const warnings = [];
if (!features.length) failures.push("feature_inventory is empty");
if (!coverage.length) failures.push("commercial_scan.source_coverage is empty");
if (!outcomes.length) failures.push("distinct_commercial_outcomes_seen is empty");
if (!candidates.length) failures.push("target_feature_candidate_index missing or empty");
if (missingCandidateLedger.length) failures.push(`audit ledger missing candidate IDs: ${missingCandidateLedger.map((c) => c.candidate_id).join(", ")}`);
if (scan.completeness_status !== "COMPLETE") warnings.push(`completeness_status is ${scan.completeness_status || "missing"}`);
if (finishReasons.includes("MAX_TOKENS")) {
  if (failures.length) failures.push("model finish_reason MAX_TOKENS with structural completeness failures");
  else warnings.push("model finish_reason MAX_TOKENS but Stage 5 structural completeness invariants passed; treating as warning");
}

const payload = {
  ok: failures.length === 0,
  step: "stage5_completeness_audit",
  cache_path: cachePath,
  feature_count: features.length,
  outcome_count: outcomes.length,
  source_coverage_count: coverage.length,
  deterministic_candidate_count: candidates.length,
  missing_candidate_ledger_ids: missingCandidateLedger.map((c) => c.candidate_id),
  completeness_status: scan.completeness_status || null,
  finish_reasons: finishReasons,
  warnings,
  failures
};
console.log(JSON.stringify(payload, null, 2));
if (failures.length) process.exit(1);
