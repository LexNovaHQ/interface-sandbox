import fs from "node:fs";

const file = "scripts/check-phase1-agnostic-source-discovery.mjs";
let source = fs.readFileSync(file, "utf8");

for (const [before, after] of [
  ['const phaseContracts = read("src/phase-contracts.js");\n', ""],
  ['for (const file of [contract, urlService, extractionService, handoffService, validator, permissions, phaseContracts]) {', 'for (const file of [contract, urlService, extractionService, handoffService, validator, permissions]) {'],
  ['assert.ok(phaseContracts.includes("runtime/contracts/pipeline.contract.js"), "legacy phase-contracts shim must delegate to runtime pipeline contract");\nassert.ok(phaseContracts.includes("old_phase_contract_table_removed: true"), "legacy phase-contracts table must be retired");', 'assert.ok(pipelineContract.includes("export const PIPELINE_CONTRACTS"), "runtime pipeline contract must remain the Phase 1 contract authority");\nassert.ok(pipelineContract.includes("export function getPipelineContract"), "runtime pipeline contract must expose the canonical contract reader");\nassert.equal(fs.existsSync(path.join(ROOT, "src/phase-contracts.js")), false, "retired phase-contracts compatibility shim must not return");']
]) {
  if (!source.includes(before)) throw new Error(`PHASE1_CONTRACT_CHECK_SYNC_MARKER_MISSING:${before.slice(0, 100)}`);
  source = source.replace(before, after);
}

fs.writeFileSync(file, source);
console.log("Phase 1 source-discovery check uses current runtime contract authority: APPLIED");
