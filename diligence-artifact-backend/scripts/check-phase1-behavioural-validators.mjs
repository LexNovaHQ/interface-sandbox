import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const checks = [
  { category: "contract_and_routing_integrity", script: "check-phase1-public-contract-freeze.mjs" },
  { category: "discovery_accounting_and_entity_ownership", script: "check-phase1-rb02-rb04-post-rb10.mjs" },
  { category: "canonicalisation_clustering_and_legal_integrity", script: "check-phase1-rb05-rb08.mjs" },
  { category: "selection_manifest_and_dedupe_integrity", script: "check-phase1-rb09-rb12.mjs" },
  { category: "artifact_assembly_legal_separation_and_compatibility", script: "check-phase1-rb13-rb15.mjs" },
  { category: "persistence_integrity", script: "check-phase1-rb16-idempotent-persistence.mjs" }
];

const results = [];
for (const check of checks) {
  const result = spawnSync(process.execPath, [path.join(HERE, check.script)], {
    cwd: path.resolve(HERE, ".."),
    encoding: "utf8",
    env: process.env
  });
  const stdout = String(result.stdout || "").trim();
  const stderr = String(result.stderr || "").trim();
  if (result.status !== 0) {
    console.error(JSON.stringify({
      check: "phase1 consolidated behavioural validators",
      status: "FAIL",
      failed_category: check.category,
      failed_script: check.script,
      exit_status: result.status,
      stdout,
      stderr
    }, null, 2));
    process.exit(1);
  }
  results.push({
    category: check.category,
    script: check.script,
    status: "PASS",
    output_tail: stdout.split("\n").slice(-8).join("\n")
  });
}

console.log(JSON.stringify({
  check: "phase1 consolidated behavioural validators",
  schema_version: "PHASE1_BEHAVIOURAL_VALIDATORS_RB17_v1",
  status: "PASS",
  blocking_policy: "FAIL_ON_BEHAVIOURAL_OR_CONTRACT_REGRESSION",
  validator_categories: results.map((item) => item.category),
  checks_run: results.length,
  results
}, null, 2));
