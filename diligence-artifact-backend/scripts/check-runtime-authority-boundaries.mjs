import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { PHASE12_DIRECT_COMPILER_RUNNER_STATUS } from "../src/phases/12-normalized-compiler/phase12-compiler.runner.js";
import {
  PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES,
  PHASE12_RENDERER_READ_ARTIFACT_NAMES
} from "../src/runtime/contracts/artifact-permissions.contract.js";
import { PIPELINE_CONTRACTS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import {
  P2G_RUNTIME_ROUTE_BY_JOB,
  P2G_PHASE_ROUTE_RUNTIME_READER_STATUS
} from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";
import { P2G_ROUTE_BUCKETS } from "../src/phases/02-cartography-index/phase-routing.contract.js";

validatePhase2GBoundary();
validateDirectPhase12Authority();
validateCleanRendererAuthority();
validateRetiredAuthoritiesAbsent();

console.log(JSON.stringify({
  check: "runtime authority boundaries",
  status: "PASS",
  mode: "STRUCTURAL_AUTHORITY_ONLY",
  behavioral_fixture_owner: "check-phase12-production.mjs",
  authorities: {
    phase2g: "ENDS_AT_PHASE11_OPERATOR_CHALLENGE",
    phase12_compiler: "DIRECT_MATERIAL_PROFILE_ARTIFACTS",
    report_renderer: "REPORT_MANIFEST_CLEAN_PROFILES"
  },
  stale_ownership_checks_retired: true
}, null, 2));

function validatePhase2GBoundary() {
  assert.equal(P2G_ROUTE_BUCKETS.length, 6);
  assert.equal(Object.prototype.hasOwnProperty.call(P2G_RUNTIME_ROUTE_BY_JOB, "NORMALIZED_COMPILER"), false);
  assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.cutover_jobs.includes("NORMALIZED_COMPILER"), false);
  assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.phase12_compiler_excluded, true);
  assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_runtime_boundary_ends_before_compiler, true);
  assert.equal(PIPELINE_CONTRACT_STATUS.phase12_direct_profile_runtime_wired, true);
  assert.equal(PIPELINE_CONTRACTS.M12.reads.includes("phase_routing_manifest"), true);
  assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.reads.includes("phase_routing_manifest"), false);
  assert.deepEqual(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.reads, PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES);
}

function validateDirectPhase12Authority() {
  assert.equal(PHASE12_DIRECT_COMPILER_RUNNER_STATUS.phase2g_dependency_forbidden, true);
  assert.equal(PHASE12_DIRECT_COMPILER_RUNNER_STATUS.input_authority, "DIRECT_MATERIAL_PROFILE_ARTIFACTS");
  assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.route_delivery_mode, "DIRECT_MATERIAL_PROFILES");
  assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.phase2g_dependency_forbidden, true);
  for (const forbidden of [
    "phase_routing_manifest",
    "exposure_registry_route_plan",
    "exposure_registry_workpad_98",
    "exposure_registry_profile_forensics",
    "target_profile_forensics",
    "target_feature_profile_forensics",
    "dap_forensics_profile"
  ]) assert.equal(PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES.includes(forbidden), false, `Phase 12 direct reads include forbidden artifact ${forbidden}`);

  const pipeline = readFileSync("src/runtime/services/pipeline.service.js", "utf8");
  assert.ok(pipeline.includes("../../phases/12-normalized-compiler/phase12-compiler.runner.js"));
  assert.equal(pipeline.includes("runCompilerPhase2G"), false);
  assert.equal(pipeline.includes("phase12_compiler_phase2g_derived_only_runner_wired"), false);
}

function validateCleanRendererAuthority() {
  assert.deepEqual(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.reads, PHASE12_RENDERER_READ_ARTIFACT_NAMES);
  const rendererSource = readFileSync("src/runtime/services/reporting/report-renderer.service.js", "utf8");
  assert.ok(rendererSource.includes("report_manifest_clean_profiles"));
  assert.equal(rendererSource.includes("normalized_section_artifacts_only"), false);
  assert.equal(rendererSource.includes("normalized_section__"), false);

  const publicReport = readFileSync("public/interface-diligence/diligence-system/report.js", "utf8");
  assert.ok(publicReport.includes('LOCKED_RENDERER_SOURCE = "report_manifest_clean_profiles"'));
  assert.equal(publicReport.includes('LOCKED_RENDERER_SOURCE = "normalized_section_artifacts_only"'), false);
}

function validateRetiredAuthoritiesAbsent() {
  for (const file of [
    "src/phases/12-normalized-compiler/compiler-m9-section6-v3.js",
    "src/phases/12-normalized-compiler/phase7-dap-report-projection.js",
    "src/phases/12-normalized-compiler/exposure-tier-normalizer.js",
    "src/phases/12-normalized-compiler/normalized-profiler-m9-section6-v4.js",
    "src/phases/12-normalized-compiler/normalized-profiler-section10-v3.js",
    "src/phases/12-normalized-compiler/normalized-profiler-section789-v2.js",
    "src/phases/12-normalized-compiler/normalized-profiler.js",
    "src/phases/12-normalized-compiler/legal-section-normalizer.js",
    "src/phases/12-normalized-compiler/report-safe-language.js",
    "src/phases/12-normalized-compiler/forensic-annexure-normalizer.js",
    "src/phases/12-normalized-compiler/report-normalization-map.js",
    "src/phases/12-normalized-compiler/normalized-status.js",
    "src/phases/12-normalized-compiler/normalizer-validator.js",
    "src/phases/12-normalized-compiler/normalizer-validator-new-field-sync-v5.js",
    "src/phases/12-normalized-compiler/normalizer-validator-section10-v4.js",
    "src/phases/12-normalized-compiler/normalized-compiler.runner.js",
    "scripts/check-phase2g-no-competing-routing-authority.mjs",
    "scripts/check-phase2g-runtime-cutover-through-compiler.mjs",
    "scripts/check-phase11-ownership-cleanup.mjs",
    "scripts/check-renderer-ownership-cleanup.mjs",
    "scripts/check-central-runtime-no-legacy-implementation.mjs",
    "scripts/check-co-p12-05.mjs"
  ]) assert.equal(existsSync(file), false, `retired authority remains: ${file}`);
}
