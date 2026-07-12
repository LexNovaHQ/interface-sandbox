import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "agent-packages/agent_5_exposure_registry";
const files = {
  binding: "AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml",
  output: "AGENT5_BACKEND_OUTPUT_CONTRACT_SYNCED_M11.md",
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
  "runtime_contract_version: v18_final_runtime_package_downstream_sync",
  "synchronization_status: FINAL_CO_11_SYNC_COMPLETE",
  "status: CO_8_DOMAIN_AGNOSTIC_RUNTIME_ACTIVE",
  "status: CO_9_DYNAMIC_FINALIZATION_ACTIVE",
  "status: CO_10_DOMAIN_AGNOSTIC_TRACE_ACTIVE",
  "static_ai_reference_injection_forbidden: true",
  "version: PHASE10_EXECUTION_IDENTITY_v2",
  "packet_version: M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1",
  "output_version: M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1",
  "version: M11_DYNAMIC_LAYER3_v1",
  "version: M11_DOMAIN_AGNOSTIC_FORENSICS_v1",
  "fixed_98_functional_assumption: false",
  "fixed_ai_subcategory_assumption: false",
  "m12_status: CO_13_DYNAMIC_COMPOUND_IDENTITY_COMPATIBLE",
  "compiler_status: CO_13_DYNAMIC_COMPOUND_IDENTITY_COMPATIBLE"
]) assert.ok(text.binding.includes(marker), `binding missing final marker: ${marker}`);

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
for (const marker of [
  "No fixed registry count is permitted",
  "Global reconciliation uses `registry_row_key`",
  "M11_DOMAIN_AGNOSTIC_FORENSICS_v1",
  "M12 and the normalized compiler consume Phase 10 material outputs"
]) assert.ok(text.output.includes(marker), `output contract missing final marker: ${marker}`);

const corpus = Object.values(text).join("\n");
for (const stale of [
  "CURRENT_SINGLE_REGISTRY_PRE_AUTO_SELECTOR",
  "auto_selector_status: PENDING_CO_2",
  "Every model-routed batch must contain max 8 rows",
  "all 98 active Threat_IDs",
  "98/98 row coverage",
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "BLOCKED_PENDING_CO_7_AND_CO_8",
  "M11_A_DETERMINISTIC_ROUTING_PREFILL.md"
]) assert.equal(corpus.includes(stale), false, `stale Agent 5 marker remains: ${stale}`);

const promptFiles = [...text.binding.matchAll(/^\s{2}- ([A-Za-z0-9_.-]+\.(?:md|yaml|yml|json))$/gm)].map((match) => match[1]);
for (const file of new Set(promptFiles)) assert.equal(existsSync(join(ROOT, file)), true, `binding references missing package file: ${file}`);

console.log(JSON.stringify({
  check: "Phase 10 Agent 5 final synchronized package",
  status: "PASS",
  runtime_contract_version: "v18_final_runtime_package_downstream_sync",
  layer2_runtime: "ACTIVE",
  layer3_runtime: "ACTIVE",
  domain_agnostic_forensics: "ACTIVE",
  downstream_compatibility: "ACTIVE",
  maximum_rows_per_batch: 15,
  model_output_root: "m11_batch_registry_ledger"
}, null, 2));
