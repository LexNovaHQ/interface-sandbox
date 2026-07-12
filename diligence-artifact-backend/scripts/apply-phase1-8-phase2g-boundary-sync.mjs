import fs from "node:fs";

patch("src/runtime/contracts/pipeline.contract.js", [
  ["runtime_cutover_complete_through_compiler: true", "runtime_boundary_ends_at_operator_challenge: true, phase12_compiler_excluded: true"]
]);

patch("scripts/check-phase1-8-central-runtime.mjs", [
  [
    'assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.runtime_cutover_complete_through_compiler, true);',
    'assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.runtime_boundary_ends_at_operator_challenge, true);\nassert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.phase12_compiler_excluded, true);'
  ],
  [
    'assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_runtime_cutover_complete_through_compiler, true);',
    'assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_runtime_boundary_ends_before_compiler, true);\nassert.equal(PIPELINE_CONTRACT_STATUS.phase12_direct_profile_runtime_wired, true);'
  ],
  ["PHASE2G_RUNTIME_CUTOVER_COMPLETE_THROUGH_COMPILER", "PHASE2G_RUNTIME_BOUNDARY_ENDS_BEFORE_COMPILER"]
]);

console.log("Phase 2G runtime boundary through Phase 11: APPLIED");

function patch(file, replacements) {
  let source = fs.readFileSync(file, "utf8");
  for (const [before, after] of replacements) {
    if (!source.includes(before)) throw new Error(`PHASE2G_BOUNDARY_MARKER_MISSING:${file}:${before}`);
    source = source.replace(before, after);
  }
  fs.writeFileSync(file, source);
}
