import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const m11 = readFileSync("src/phases/10-exposure-profile/m11-orchestrator-m11v2.js", "utf8");
const routing = readFileSync("src/phases/10-exposure-profile/phase10-classification-routing.js", "utf8");
const binding = readFileSync("agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml", "utf8");
const semanticPrompt = readFileSync("agent-packages/agent_5_exposure_registry/M11_C_BATCH_EVALUATION.md", "utf8");
const prompts = readFileSync("src/runtime/services/prompts.service.js", "utf8");
const runtimeReference = readFileSync("src/runtime/services/reference.service.js", "utf8");

for (const marker of [
  "../../runtime/services/storage/firestore.service.js",
  "../../runtime/services/reference.service.js",
  "../../runtime/services/artifacts.service.js"
]) assert.ok(m11.includes(marker), `M11 deterministic route stage missing central runtime dependency: ${marker}`);

for (const forbiddenSemanticImport of [
  "../../runtime/services/prompts.service.js",
  "../../runtime/services/provider.service.js"
]) assert.equal(m11.includes(forbiddenSemanticImport), false, `M11 must not import semantic runtime before CO-8: ${forbiddenSemanticImport}`);

for (const marker of [
  "finalizePhase10RoutingContext",
  "buildPackageScopedExposureRegistryRoutePlan",
  "M11_PACKAGE_SCOPED_ROUTE_PLAN_READY_SEMANTIC_RUNTIME_PENDING",
  "M11_SEMANTIC_STAGE_MUST_NOT_RUN_BEFORE_CO_8",
  'deterministic_route_stage: "CO_4_CO_5_CO_6_ACTIVE"',
  'semantic_package_stage: "CO_7_CONTRACT_READY"',
  'semantic_runtime_stage: "PENDING_CO_8_DOMAIN_AGNOSTIC_LAYER2_RUNTIME"',
  'semantic_package_contract: "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1"'
]) assert.ok(m11.includes(marker), `M11 route-stage boundary missing: ${marker}`);

for (const marker of [
  "phase5_classification_inventory.v1",
  "M11_PACKAGE_SCOPED_ROUTE_RULES_v1",
  "MAX_M11_BATCH_ROWS = 15",
  "MAX_M11_BATCH_PACKET_CHARS = 180000",
  "UNI_ALWAYS_RUN",
  "PACKAGE_ARCHETYPE_MATCH",
  "surface_routing_allowed: false",
  "expected_registry_row_keys"
]) assert.ok(routing.includes(marker), `M11 package-scoped routing implementation missing: ${marker}`);

for (const marker of [
  "runtime_contract_version: v16_package_scoped_semantic_contract",
  "status: CONTRACT_READY_RUNTIME_BLOCKED_PENDING_CO_8",
  "current_runtime_may_call_model: false",
  "version: M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1",
  "version: M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1",
  "version: M11_PACKAGE_SCOPED_SEMANTIC_REPAIR_v1"
]) assert.ok(binding.includes(marker), `Agent 5 binding missing CO-7 semantic marker: ${marker}`);

assert.ok(semanticPrompt.includes("Return exactly one JSON root"));
assert.ok(semanticPrompt.includes('"m11_batch_registry_ledger"'));
assert.ok(semanticPrompt.includes("The model must not emit `registry_row_key`"));

for (const retired of [
  "src/m11-orchestrator.js",
  "src/m11-orchestrator-m11v2.js",
  "src/reference-loader.js",
  "src/prompt-loader.js",
  "src/gemini-client.js",
  "src/artifact-service.js"
]) assert.equal(existsSync(retired), false, `obsolete root file still exists: ${retired}`);

assert.ok(m11.includes('infrastructure_authority: "CENTRAL_RUNTIME_SERVICES"'));
assert.ok(m11.includes('phase_owned_path: "src/phases/10-exposure-profile"'));
assert.ok(prompts.includes('from "./reference.service.js"'));
assert.equal(prompts.includes("../../reference-loader.js"), false);
assert.ok(prompts.includes('reference_loader_authority: "reference.service"'));
assert.ok(runtimeReference.includes('source_of_truth: "src/runtime/services/reference.service.js"'));
assert.ok(runtimeReference.includes("references/domain-packages"));
assert.ok(runtimeReference.includes("references/registry"));
assert.ok(runtimeReference.includes('fileName.includes("..")'));

console.log(JSON.stringify({
  check: "M11 central runtime dependency cutover",
  status: "PASS",
  enforced_gates: [
    "M11_PHASE_OWNED",
    "M11_CENTRAL_STORAGE_REFERENCE_ARTIFACT_SERVICES",
    "CO4_CO6_DETERMINISTIC_ROUTE_STAGE_ACTIVE",
    "CO7_AGENT5_SEMANTIC_PACKAGE_READY",
    "SEMANTIC_PROVIDER_AND_PROMPT_IMPORTS_BLOCKED_PENDING_CO8",
    "PACKAGE_SCOPED_CLASSIFICATION_ROUTING",
    "MAXIMUM_15_PACKET_CEILING_BATCHING",
    "ONE_REFERENCE_LOADER_IMPLEMENTATION",
    "OBSOLETE_ROOT_M11_AND_REFERENCE_FILES_DELETED"
  ]
}, null, 2));
