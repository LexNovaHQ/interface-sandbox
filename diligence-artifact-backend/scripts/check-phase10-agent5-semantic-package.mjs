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
  adapter: "BACKEND_CANONICAL_OUTPUT_ADAPTER.md",
  selector: "PHASE10_AUTO_SELECTOR_AND_FINGERPRINT_ADDENDUM.md",
  routing: "PHASE10_CLASSIFICATION_ROUTING_BATCH_ADDENDUM.md"
};

const text = {};
for (const [key, file] of Object.entries(files)) {
  const path = join(ROOT, file);
  assert.equal(existsSync(path), true, `missing Agent 5 semantic contract file: ${file}`);
  text[key] = readFileSync(path, "utf8");
}

const requiredMarkers = [
  ["binding", "runtime_contract_version: v16_package_scoped_semantic_contract"],
  ["binding", "status: CONTRACT_READY_RUNTIME_BLOCKED_PENDING_CO_8"],
  ["binding", "current_runtime_may_call_model: false"],
  ["binding", "version: M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1"],
  ["binding", "version: M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1"],
  ["binding", "version: M11_PACKAGE_SCOPED_SEMANTIC_REPAIR_v1"],
  ["packet", "M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1"],
  ["packet", "1 <= row_count <= 15"],
  ["evaluation", "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1"],
  ["evaluation", "Return exactly one JSON root"],
  ["evaluation", "The batch contains one package, one stream, and one archetype group"],
  ["repair", "M11_PACKAGE_SCOPED_SEMANTIC_REPAIR_v1"],
  ["repair", "Return the complete semantic ledger for every expected Threat ID"],
  ["validator", "AGENT5_PACKAGE_SCOPED_SEMANTIC_VALIDATOR_v1"],
  ["validator", "No fixed 98-row assumption is permitted"],
  ["validator", "1 <= row_count <= 15"],
  ["adapter", "AGENT5_PACKAGE_SCOPED_OUTPUT_ADAPTER_v1"],
  ["adapter", "For normal semantic evaluation and repair, the model may return exactly one root"],
  ["module", "CO-7 makes the semantic package contract ready"],
  ["controller", "CO_7_AGENT5_SEMANTIC_PACKAGE: READY"],
  ["topController", "CO-8 remains required to activate the domain-agnostic Layer 2 runtime"],
  ["dco", "This contract is active inside the CO-7 Agent 5 semantic package"],
  ["selector", "CO-8 remains required before any semantic model call"],
  ["routing", "CO-4 through CO-7 are contract-complete"]
];

for (const [key, marker] of requiredMarkers) {
  assert.ok(text[key].includes(marker), `${files[key]} missing marker: ${marker}`);
}

const semanticFiles = [
  "binding",
  "topController",
  "controller",
  "module",
  "packet",
  "evaluation",
  "repair",
  "dco",
  "validator",
  "adapter"
];
const semanticCorpus = semanticFiles.map((key) => text[key]).join("\n");

const forbiddenMarkers = [
  "Every model-routed batch must contain max 8 rows",
  "all 98 active Threat_IDs",
  "98/98 row coverage",
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "lossless_family__L2_B2B_CONTRACTING",
  "lossless_family__L3_AI_USAGE_GOVERNANCE",
  "AI_THREAT_REGISTRY.yaml",
  "AI_Registry_Key.yml",
  "BLOCKED_PENDING_CO_7_AND_CO_8",
  "M11_A_DETERMINISTIC_ROUTING_PREFILL.md"
];
for (const marker of forbiddenMarkers) {
  assert.equal(semanticCorpus.includes(marker), false, `stale Agent 5 semantic marker remains: ${marker}`);
}

assert.ok(text.binding.includes("semantic_prompt_files:"));
assert.ok(text.binding.includes("semantic_repair_prompt_files:"));
assert.ok(text.binding.includes("- M11_B_BATCH_PACKET_ASSEMBLY.md"));
assert.ok(text.binding.includes("- M11_C_BATCH_EVALUATION.md"));
assert.ok(text.binding.includes("- M11_D_BATCH_REINVESTIGATION_REPAIR.md"));
assert.equal(text.binding.includes("semantic_prompt_files:\n  - PHASE10_AUTO_SELECTOR_AND_FINGERPRINT_ADDENDUM.md"), false, "backend selector addendum must not lead semantic prompt bundle");

const promptFileMatches = [...text.binding.matchAll(/^\s{2}- ([A-Za-z0-9_.-]+\.(?:md|yaml))$/gm)].map((match) => match[1]);
for (const file of new Set(promptFileMatches)) {
  if (["03_REGISTRY_EVALUATION_RULES.yaml", "Diligence_Field_Derivation_Registry.yml", "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"].includes(file)) continue;
  assert.equal(existsSync(join(ROOT, file)), true, `runtime binding references missing Agent 5 file: ${file}`);
}

assert.ok(text.evaluation.includes('"m11_batch_registry_ledger"'));
assert.ok(text.evaluation.includes('"stream_id"'));
assert.ok(text.evaluation.includes('"package_id"'));
assert.ok(text.evaluation.includes('"expected_threat_ids"'));
assert.ok(text.evaluation.includes('"returned_threat_ids"'));
assert.ok(text.evaluation.includes("The model must not emit `registry_row_key`"));
assert.ok(text.validator.includes("The backend, not the model, maps canonical Threat IDs to deterministic `registry_row_key` values"));
assert.ok(text.adapter.includes("The stable workpad artifact name does not impose a fixed row count"));

console.log(JSON.stringify({
  check: "Phase 10 Agent 5 package-scoped semantic package",
  status: "PASS",
  semantic_packet_contract: "M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1",
  semantic_output_contract: "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1",
  semantic_repair_contract: "M11_PACKAGE_SCOPED_SEMANTIC_REPAIR_v1",
  validator_contract: "AGENT5_PACKAGE_SCOPED_SEMANTIC_VALIDATOR_v1",
  maximum_rows_per_batch: 15,
  model_output_root: "m11_batch_registry_ledger",
  model_registry_row_key_emission: false,
  co7_status: "READY",
  runtime_status: "BLOCKED_PENDING_CO_8"
}, null, 2));
