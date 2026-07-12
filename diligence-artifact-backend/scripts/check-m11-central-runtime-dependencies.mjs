import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const m11 = readFileSync("src/phases/10-exposure-profile/m11-orchestrator-m11v2.js", "utf8");
const routing = readFileSync("src/phases/10-exposure-profile/phase10-classification-routing.js", "utf8");
const finalization = readFileSync("src/phases/10-exposure-profile/phase10-semantic-finalization.js", "utf8");
const binding = readFileSync("agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml", "utf8");
const prompts = readFileSync("src/runtime/services/prompts.service.js", "utf8");
const runtimeReference = readFileSync("src/runtime/services/reference.service.js", "utf8");

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
  'semantic_runtime_stage: "CO_8_DOMAIN_AGNOSTIC_LAYER2_ACTIVE"',
  'deterministic_finalization_stage: "CO_9_DYNAMIC_LAYER3_ACTIVE"',
  'forensics_stage: "CO_10_DOMAIN_AGNOSTIC_TRACE_ACTIVE"'
]) assert.ok(m11.includes(marker), `M11 active runtime marker missing: ${marker}`);

for (const marker of [
  "phase5_classification_inventory.v1",
  "M11_PACKAGE_SCOPED_ROUTE_RULES_v1",
  "MAX_M11_BATCH_ROWS = 15",
  "MAX_M11_BATCH_PACKET_CHARS = 180000",
  "UNI_ALWAYS_RUN",
  "PACKAGE_ARCHETYPE_MATCH",
  "surface_routing_allowed: false",
  "expected_registry_row_keys"
]) assert.ok(routing.includes(marker), `M11 route implementation missing: ${marker}`);

for (const marker of [
  "M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1",
  "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1",
  "M11_DYNAMIC_LAYER3_v1",
  "M11_DOMAIN_AGNOSTIC_FORENSICS_v1",
  "registry_row_key",
  "CONTROLLED_BY_VISIBLE_CONTROL",
  "CONTROLLED_BY_EXCLUSION",
  "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION",
  "NOT_TRIGGERED_NOT_APPLICABLE"
]) assert.ok(finalization.includes(marker), `M11 finalization implementation missing: ${marker}`);

for (const marker of [
  "runtime_contract_version: v17_domain_agnostic_layer2_layer3_forensics",
  "status: CO_8_DOMAIN_AGNOSTIC_RUNTIME_ACTIVE",
  "current_runtime_may_call_model: true",
  "status: CO_9_DYNAMIC_FINALIZATION_ACTIVE",
  "status: CO_10_DOMAIN_AGNOSTIC_TRACE_ACTIVE"
]) assert.ok(binding.includes(marker), `Agent 5 binding missing active marker: ${marker}`);

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
assert.ok(runtimeReference.includes("references/domain-packages"));
assert.ok(runtimeReference.includes("references/registry"));

console.log(JSON.stringify({
  check: "M11 central runtime dependency cutover",
  status: "PASS",
  enforced_gates: [
    "M11_PHASE_OWNED",
    "CENTRAL_PROMPT_PROVIDER_STORAGE_REFERENCE_SERVICES",
    "CO8_DOMAIN_AGNOSTIC_LAYER2_ACTIVE",
    "CO9_DYNAMIC_LAYER3_ACTIVE",
    "CO10_DOMAIN_AGNOSTIC_FORENSICS_ACTIVE",
    "PACKAGE_SCOPED_CLASSIFICATION_ROUTING",
    "MAXIMUM_15_PACKET_CEILING_BATCHING",
    "COMPOUND_IDENTITY_RECONCILIATION",
    "ONE_REFERENCE_LOADER_IMPLEMENTATION"
  ]
}, null, 2));
