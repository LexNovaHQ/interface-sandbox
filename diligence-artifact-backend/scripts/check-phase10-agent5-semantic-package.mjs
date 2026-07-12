import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "agent-packages/agent_5_exposure_registry";
const files = {
  binding: "AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml",
  topController: "00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md",
  controller: "00_M11_RUNTIME_CONTROLLER.md",
  module: "M11_EXPOSURE_REGISTRY.md",
  packet: "M11_B_BATCH_PACKET_ASSEMBLY.md",
  evaluation: "M11_C_BATCH_EVALUATION.md",
  repair: "M11_D_BATCH_REINVESTIGATION_REPAIR.md",
  dco: "M11_DOMAIN_CONTROL_OBLIGATION_HANDOFF.md",
  validator: "00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md",
  adapter: "BACKEND_CANONICAL_OUTPUT_ADAPTER.md"
};
const text = {};
for (const [key, file] of Object.entries(files)) {
  const path = join(ROOT, file);
  assert.equal(existsSync(path), true, `missing Agent 5 contract file: ${file}`);
  text[key] = readFileSync(path, "utf8");
}

for (const marker of [
  "runtime_contract_version: v17_domain_agnostic_layer2_layer3_forensics",
  "status: CO_8_DOMAIN_AGNOSTIC_RUNTIME_ACTIVE",
  "current_runtime_may_call_model: true",
  "status: CO_9_DYNAMIC_FINALIZATION_ACTIVE",
  "status: CO_10_DOMAIN_AGNOSTIC_TRACE_ACTIVE",
  "version: M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1",
  "version: M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1",
  "version: M11_DYNAMIC_LAYER3_v1",
  "version: M11_DOMAIN_AGNOSTIC_FORENSICS_v1",
  "fixed_98_row_assumption: false",
  "fixed_ai_subcategory_assumption: false"
]) assert.ok(text.binding.includes(marker), `binding missing active marker: ${marker}`);

for (const marker of [
  "M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1",
  "1 <= row_count <= 15"
]) assert.ok(text.packet.includes(marker), `packet contract missing: ${marker}`);
for (const marker of [
  "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1",
  "Return exactly one JSON root",
  "The model must not emit `registry_row_key`"
]) assert.ok(text.evaluation.includes(marker), `semantic contract missing: ${marker}`);
for (const marker of [
  "M11_PACKAGE_SCOPED_SEMANTIC_REPAIR_v1",
  "Return the complete semantic ledger for every expected Threat ID"
]) assert.ok(text.repair.includes(marker), `repair contract missing: ${marker}`);

const corpus = Object.values(text).join("\n");
for (const stale of [
  "Every model-routed batch must contain max 8 rows",
  "all 98 active Threat_IDs",
  "98/98 row coverage",
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "AI_THREAT_REGISTRY.yaml",
  "AI_Registry_Key.yml",
  "BLOCKED_PENDING_CO_7_AND_CO_8",
  "M11_A_DETERMINISTIC_ROUTING_PREFILL.md"
]) assert.equal(corpus.includes(stale), false, `stale semantic marker remains: ${stale}`);

const promptFiles = [...text.binding.matchAll(/^\s{2}- ([A-Za-z0-9_.-]+\.(?:md|yaml|yml|json))$/gm)].map((match) => match[1]);
for (const file of new Set(promptFiles)) assert.equal(existsSync(join(ROOT, file)), true, `binding references missing package file: ${file}`);

assert.ok(text.binding.includes("write_artifacts_in_order:"));
assert.ok(text.binding.includes("exposure_registry_batch_validation__{batch_id}"));
assert.ok(text.binding.includes("exposure_registry_profile_forensics"));
assert.ok(text.binding.includes("current_handoff_allowed: true"));

console.log(JSON.stringify({
  check: "Phase 10 Agent 5 active domain-agnostic package",
  status: "PASS",
  layer2_runtime: "ACTIVE",
  layer3_runtime: "ACTIVE",
  domain_agnostic_forensics: "ACTIVE",
  maximum_rows_per_batch: 15,
  model_output_root: "m11_batch_registry_ledger"
}, null, 2));
