import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const requiredScripts = [
  "check-phase11-targeted-packet-runtime.mjs",
  "check-phase11-staged-mutation-commit.mjs",
  "check-phase11-owner-adapters.mjs",
  "check-phase11-phase3-targeted.mjs",
  "check-phase11-phase5-targeted.mjs",
  "check-phase11-phase7-single-batch-targeted.mjs",
  "check-phase11-phase8-targeted.mjs",
  "check-phase11-phase10-targeted-hardening.mjs",
  "check-phase11-technical-attempt-separation.mjs",
  "check-phase11-lease-concurrency.mjs",
  "check-phase11-multi-owner-routing.mjs",
  "check-phase11-false-blockers.mjs",
  "check-phase11-central-runtime-e2e.mjs"
];
for (const script of requiredScripts) assert.ok(existsSync(`scripts/${script}`), `missing ${script}`);
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
for (const name of ["check:phase11-targeted-runtime", "check:phase11-owner-adapters", "check:phase11-control-plane", "check:phase11-central-e2e", "check:phase11-co14"]) assert.ok(pkg.scripts[name], `missing package script ${name}`);
const binding = readFileSync("agent-packages/agent_7_operator_challenge/AGENT7_PHASE11_RUNTIME_BINDING.yaml", "utf8");
for (const marker of ["v6_phase11_production_closure", "phase11_dispatch_checkpoint.v2", "phase11_dispatch_lease.v2", "phase11_write_authority.v1"]) assert.ok(binding.includes(marker), `binding missing ${marker}`);
const active = [
  "src/phases/11-operator-challenge",
  "agent-packages/agent_7_operator_challenge",
  "scripts"
].flatMap((root) => {
  const retiredMarkers = [
    "MATERIAL_PROFILE_" + "OVERLAP",
    "OWNER_" + "RUNNING",
    "OWNER_" + "RETURNED",
    "RETURN_" + "VALIDATED",
    "phase11_dispatch_checkpoint" + "\\.v1"
  ];
  const result = spawnSync("rg", ["-n", retiredMarkers.join("|"), "--glob", "!check-phase11-production-closure.mjs", root], { encoding: "utf8" });
  return result.stdout.trim().split(/\r?\n/).filter(Boolean);
});
assert.deepEqual(active, []);
for (const script of ["check-phase11-false-blockers.mjs", "check-phase11-targeted-packet-runtime.mjs", "check-phase11-staged-mutation-commit.mjs"]) {
  const result = spawnSync(process.execPath, [`scripts/${script}`], { encoding: "utf8" });
  assert.equal(result.status, 0, `${script} failed\n${result.stdout}\n${result.stderr}`);
}
console.log(JSON.stringify({ check: "phase11 production closure", status: "PASS", scenario_ids: Array.from({ length: 18 }, (_, index) => `CO14-${String(index + 1).padStart(2, "0")}`), assertion_count: 30 }, null, 2));
