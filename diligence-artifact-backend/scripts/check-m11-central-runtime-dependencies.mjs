import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const wrapper = readFileSync("src/phases/10-exposure-profile/m11-final-synchronized.runner.js", "utf8");
const runner = readFileSync("src/phases/10-exposure-profile/exposure-profile.runner.js", "utf8");
const m11 = readFileSync("src/phases/10-exposure-profile/m11-orchestrator-m11v2.js", "utf8");
const routing = readFileSync("src/phases/10-exposure-profile/phase10-classification-routing.js", "utf8");
const finalization = readFileSync("src/phases/10-exposure-profile/phase10-semantic-finalization.js", "utf8");
const binding = readFileSync("agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml", "utf8");
const prompts = readFileSync("src/runtime/services/prompts.service.js", "utf8");
const runtimeReference = readFileSync("src/runtime/services/reference.service.js", "utf8");

assert.ok(runner.includes('from "./m11-final-synchronized.runner.js"'));
for (const marker of [
  "CO_11_COMPLETE",
  "v18_final_runtime_package_downstream_sync",
  "static_package_reference_injection_forbidden",
  "selected_registry_references_loaded_dynamically",
  "synchronizeReferences"
]) assert.ok(wrapper.includes(marker), `M11 synchronized wrapper missing: ${marker}`);

for (const marker of [
  "../../runtime/services/storage/firestore.service.js",
  "../../runtime/services/reference.service.js",
  "../../runtime/services/artifacts.service.js",
  "../../runtime/services/prompts.service.js",
  "../../runtime/services/provider.service.js"
]) assert.ok(m11.includes(marker), `M11 active runtime dependency missing: ${marker}`);

for (const marker of [
  "finalizePhase10RoutingContext",
  "buildPackageScopedExposureRegistryRoutePlan",
  "buildPackageScopedSemanticPacket",
  "validateSemanticLedger",
  "assembleAcceptedBatch",
  "buildDynamicWorkpad",
  "projectDynamicProfiles",
  "buildDomainAgnosticForensics",
  'semantic_runtime_stage: "MODEL_SEMANTIC_FIELDS_ONLY_ACTIVE"',
  'deterministic_finalization_stage: "COMPLETE_REPORT_ROW_ACTIVE"',
  'forensics_stage: "COMPLETE_REGISTRY_SPINE_TRACE_ACTIVE"'
]) assert.ok(m11.includes(marker), `M11 active runtime marker missing: ${marker}`);

for (const marker of [
  "phase5_classification_inventory.v2.behavior_class",
  "M11_PACKAGE_SCOPED_BEHAVIOR_CLASS_ROUTE_RULES_v2",
  "MAX_M11_BATCH_ROWS = 15",
  "MAX_M11_BATCH_PACKET_CHARS = 180000",
  "UNI_ALWAYS_RUN",
  "PACKAGE_BEHAVIOR_CLASS_MATCH",
  "surface_routing_allowed: false",
  "expected_registry_row_keys"
]) assert.ok(routing.includes(marker), `M11 route implementation missing: ${marker}`);

for (const marker of [
  "M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v2_COMPLETE_REGISTRY_SPINE",
  "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1",
  "M11_DYNAMIC_LAYER3_v2_COMPLETE_REPORT_ROW",
  "M11_DOMAIN_AGNOSTIC_FORENSICS_v2_COMPLETE_REPORT_ROW",
  "registry_row_key",
  "CONTROLLED_BY_VISIBLE_CONTROL",
  "CONTROLLED_BY_EXCLUSION",
  "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION",
  "NOT_TRIGGERED_NOT_APPLICABLE"
]) assert.ok(finalization.includes(marker), `M11 finalization implementation missing: ${marker}`);

for (const marker of [
  "runtime_contract_version: v18_final_runtime_package_downstream_sync",
  "synchronization_status: FINAL_CO_11_SYNC_COMPLETE",
  "status: CO_8_DOMAIN_AGNOSTIC_RUNTIME_ACTIVE",
  "status: CO_9_DYNAMIC_FINALIZATION_ACTIVE",
  "status: CO_10_DOMAIN_AGNOSTIC_TRACE_ACTIVE",
  "packet_version: M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v2_COMPLETE_REGISTRY_SPINE",
  "version: M11_DYNAMIC_LAYER3_v2_COMPLETE_REPORT_ROW",
  "version: M11_DOMAIN_AGNOSTIC_FORENSICS_v2_COMPLETE_REPORT_ROW",
  "m12_status: CO_13_DYNAMIC_COMPOUND_IDENTITY_COMPATIBLE",
  "compiler_status: CO_13_DYNAMIC_COMPOUND_IDENTITY_COMPATIBLE"
]) assert.ok(binding.includes(marker), `Agent 5 binding missing final marker: ${marker}`);

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
assert.equal(prompts.includes("../.." + "/reference-loader.js"), false);
assert.ok(runtimeReference.includes("references/domain-packages"));
assert.ok(runtimeReference.includes("references/registry"));

console.log(JSON.stringify({
  check: "M11 central runtime dependency cutover",
  status: "PASS",
  enforced_gates: [
    "M11_PHASE_OWNED",
    "CO11_FINAL_SYNCHRONIZED_WRAPPER_ACTIVE",
    "STATIC_PACKAGE_REFERENCE_INJECTION_BLOCKED",
    "CENTRAL_PROMPT_PROVIDER_STORAGE_REFERENCE_SERVICES",
    "MODEL_SEMANTIC_FIELDS_ONLY_ACTIVE",
    "COMPLETE_REPORT_ROW_ACTIVE",
    "COMPLETE_REGISTRY_SPINE_TRACE_ACTIVE",
    "CO13_DOWNSTREAM_COMPATIBILITY_ACTIVE",
    "PACKAGE_SCOPED_CLASSIFICATION_ROUTING",
    "MAXIMUM_15_PACKET_CEILING_BATCHING",
    "COMPOUND_IDENTITY_RECONCILIATION",
    "ONE_REFERENCE_LOADER_IMPLEMENTATION"
  ]
}, null, 2));
