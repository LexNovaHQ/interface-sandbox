import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PACKAGE_DIR = "agent-packages/phase_2c_activity_profile_source_index";
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const EXPECTED_PACKAGE_FILES = Object.freeze([
  "00_RUNTIME_CONTROLLER_PHASE2C_ACTIVITY_PROFILE_SOURCE_INDEX.md",
  "00_TERMINAL_RECEIPT_RULES_PHASE2C_ACTIVITY_PROFILE_SOURCE_INDEX.md",
  "00_VALIDATOR_RULES_PHASE2C_ACTIVITY_PROFILE_SOURCE_INDEX.md",
  "P2C_ACTIVITY_PROFILE_SOURCE_INDEX.md",
  "P2C_ACTIVITY_PROFILE_SOURCE_INDEX_REFERENCE_MAP.yaml",
  "P2C_ACTIVITY_PROFILE_SOURCE_INDEX_RUNTIME_BINDING_PACKET.yaml",
  "P2C_PACKET_MANIFEST.json"
]);

const OMITTED_PACKAGE_FILES = Object.freeze([
  "P2C_STEP1_OUTPUT_CONTRACT_LOCK.md",
  "P2C_REINVESTIGATION.md",
  "P2C_HYBRID_COMPILER_CONTRACT.md",
  "P2C_PROMPT_STACK_ORDER.md",
  "P2C_PACKET_VALIDATION.json"
]);

const P2C_ROOTS = Object.freeze([
  "lossless_root__product_service",
  "lossless_root__platform_feature_solution",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow",
  "lossless_root__integrations_ecosystem",
  "lossless_root__pricing_commercial_availability",
  "lossless_root__use_case_customer_industry",
  "lossless_root__support_help_resources",
  "lossless_root__ai_safety_transparency"
]);

const CANDIDATE_ROOTS = Object.freeze([
  "lossless_root__product_service",
  "lossless_root__platform_feature_solution",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow",
  "lossless_root__integrations_ecosystem",
  "lossless_root__pricing_commercial_availability"
]);

const CONTEXT_ONLY_ROOTS = Object.freeze([
  "lossless_root__use_case_customer_industry",
  "lossless_root__support_help_resources",
  "lossless_root__ai_safety_transparency"
]);

const WRITE_ORDER = Object.freeze([
  "activity_profile_deterministic_map",
  "activity_profile_semantic_profile",
  "activity_profile_source_index"
]);

const ROUTE_MAPS = Object.freeze([
  "activity_candidate_source_locator_map",
  "product_capability_locator_map",
  "feature_mechanics_locator_map",
  "technical_mechanics_locator_map",
  "api_interaction_locator_map",
  "data_object_interaction_locator_map",
  "integration_action_locator_map",
  "commercial_availability_locator_map",
  "customer_use_context_locator_map",
  "support_operational_context_locator_map",
  "automation_transparency_context_locator_map",
  "human_control_context_locator_map",
  "external_action_context_locator_map",
  "input_output_object_context_locator_map"
]);

const packagePath = path.join(ROOT, PACKAGE_DIR);
assert.equal(fs.existsSync(packagePath), true, "Phase 2C activity profile package folder must exist");
assert.deepEqual(fs.readdirSync(packagePath).filter((name) => !name.startsWith(".")).sort(), [...EXPECTED_PACKAGE_FILES].sort(), "Phase 2C package must contain exactly seven locked files");

for (const file of EXPECTED_PACKAGE_FILES) {
  const text = read(`${PACKAGE_DIR}/${file}`);
  assert.ok(text.trim().length > 0, `${file} must not be empty`);
  assert.ok(text.split(/\r?\n/).length >= minLines(file), `${file} is suspiciously thin or truncated`);
}
for (const file of OMITTED_PACKAGE_FILES) assert.equal(fs.existsSync(path.join(packagePath, file)), false, `${file} must remain omitted from lean package`);

const binding = read(`${PACKAGE_DIR}/P2C_ACTIVITY_PROFILE_SOURCE_INDEX_RUNTIME_BINDING_PACKET.yaml`);
const controller = read(`${PACKAGE_DIR}/00_RUNTIME_CONTROLLER_PHASE2C_ACTIVITY_PROFILE_SOURCE_INDEX.md`);
const moduleText = read(`${PACKAGE_DIR}/P2C_ACTIVITY_PROFILE_SOURCE_INDEX.md`);
const referenceMap = read(`${PACKAGE_DIR}/P2C_ACTIVITY_PROFILE_SOURCE_INDEX_REFERENCE_MAP.yaml`);
const validator = read(`${PACKAGE_DIR}/00_VALIDATOR_RULES_PHASE2C_ACTIVITY_PROFILE_SOURCE_INDEX.md`);
const terminal = read(`${PACKAGE_DIR}/00_TERMINAL_RECEIPT_RULES_PHASE2C_ACTIVITY_PROFILE_SOURCE_INDEX.md`);
const manifest = JSON.parse(read(`${PACKAGE_DIR}/P2C_PACKET_MANIFEST.json`));

assert.equal(manifest.packet_name, "P2C_ACTIVITY_PROFILE_SOURCE_INDEX_PACKET");
assert.equal(manifest.package_status, "LEAN_PACKAGE_RUNTIME_WIRED");
assert.equal(manifest.runtime_wiring_changed, true);
assert.equal(manifest.runtime_job_id, "P2C_ACTIVITY_PROFILE_SOURCE_INDEX");
assert.equal(manifest.final_downstream_required_artifact, "activity_profile_source_index");
assert.equal(manifest.downstream_owner, "ACTIVITY_PROFILE_REVIEW");
assert.equal(manifest.boundary_locks.runtime_wiring_changed, true);
assert.equal(manifest.boundary_locks.compiler_built, true);
assert.equal(manifest.boundary_locks.final_validator_built, true);
assert.equal(manifest.boundary_locks.orchestrator_built, true);
for (const flag of ["artifact_permissions_registered", "pipeline_contract_registered", "central_phase_registered", "pipeline_service_dispatch_registered", "save_order_gates_registered"]) assert.equal(manifest.runtime_wiring[flag], true, `manifest must claim runtime wiring flag ${flag}`);
assert.equal(manifest.runtime_wiring.p2b_next, "P2C_ACTIVITY_PROFILE_SOURCE_INDEX");
assert.equal(manifest.runtime_wiring.p2c_next, "P2_INDEX_COMPILER_VALIDATION");
assert.deepEqual(manifest.components, EXPECTED_PACKAGE_FILES);
assert.deepEqual(manifest.deliberately_not_created, OMITTED_PACKAGE_FILES);
assert.deepEqual(manifest.write_artifacts_in_order, WRITE_ORDER);
assert.deepEqual(manifest.read_artifacts.filter((artifact) => artifact.startsWith("lossless_root__")), P2C_ROOTS);
assert.deepEqual(manifest.candidate_creation_roots, CANDIDATE_ROOTS);
assert.deepEqual(manifest.context_only_roots, CONTEXT_ONLY_ROOTS);

for (const root of P2C_ROOTS) {
  assert.ok(binding.includes(root), `binding missing ${root}`);
  assert.ok(moduleText.includes(root), `module missing ${root}`);
  assert.ok(referenceMap.includes(root), `reference map missing ${root}`);
  assert.ok(manifest.read_artifacts.includes(root), `manifest missing ${root}`);
}
for (const forbiddenRead of ["legal_doc_{DOC_TYPE}", "legal_cartography_index", "legal_signal_derivation_profile", "data_privacy_navigation_index", "domain_derivation_source_index"]) assert.equal(manifest.read_artifacts.includes(forbiddenRead), false, `manifest must not read ${forbiddenRead}`);
for (const oldFamily of ["lossless_family__P1_PRODUCT", "lossless_family__P2_PLATFORM_FEATURE_SOLUTION", "lossless_family__P3_AI_CAPABILITY_TECHNICAL", "lossless_family__P4_USE_CASE_INDUSTRY", "lossless_family__P5_ENTERPRISE_PRICING"]) assert.ok(moduleText.includes(oldFamily), `module must explicitly forbid old family ${oldFamily}`);

for (const artifact of WRITE_ORDER) {
  assert.ok(binding.includes(artifact), `binding missing write artifact ${artifact}`);
  assert.ok(terminal.includes(artifact), `terminal missing write artifact ${artifact}`);
}
for (const routeMap of ROUTE_MAPS) {
  assert.ok(moduleText.includes(routeMap), `module missing ${routeMap}`);
  assert.ok(referenceMap.includes(routeMap), `reference map missing ${routeMap}`);
  assert.ok(validator.includes(routeMap), `validator rules missing ${routeMap}`);
}

for (const marker of ["2C locates activity-profile evidence", "2C is not an Activity Profile generator", "mounted domain package", "Phase 5 then derives package-specific activity values", "domain-agnostic", "evidence-navigation layer"]) assert.ok(moduleText.includes(marker), `module missing boundary marker: ${marker}`);
for (const marker of ["package_specific_classification_forbidden: true", "derived_value_forbidden: true", "candidate_creation_allowed: false", "context_only: true", "active_domain_package_as_classification_source_inside_2c"]) assert.ok(referenceMap.includes(marker), `reference map missing route doctrine: ${marker}`);
for (const marker of ["Semantic coverage", "coverage_ratio", "ready_for_compiler", "Forbidden outputs", "Retired roots forbidden", "lossless_family__"]) assert.ok(validator.includes(marker), `validator rules missing ${marker}`);
for (const marker of ["strict JSON", "same-chat next-phase instructions", "Do not continue to:", "ACTIVITY_PROFILE_REVIEW", "Each save event must have one top-level root only"]) assert.ok(terminal.includes(marker), `terminal missing ${marker}`);
assert.ok(controller.includes("Phase 2C exists only to build a pointer-only source index"));
assert.ok(binding.includes("runtime_wiring_changed: true"));
assert.ok(binding.includes("P2C_ACTIVITY_PROFILE_SOURCE_INDEX"));

for (const text of [binding, controller, moduleText, referenceMap, validator, terminal]) {
  assert.equal(text.includes("source text may be copied"), false, "package must not allow source text copy");
  assert.equal(text.includes("derive archetype"), false, "package must not instruct 2C to derive archetypes");
  assert.equal(text.includes("derive surface"), false, "package must not instruct 2C to derive surfaces");
}

console.log("Phase 2C activity profile lean package quality audit: PASS");

function minLines(file) {
  if (file.endsWith("MANIFEST.json")) return 80;
  if (file.includes("REFERENCE_MAP")) return 200;
  if (file === "P2C_ACTIVITY_PROFILE_SOURCE_INDEX.md") return 220;
  if (file.includes("RUNTIME_BINDING")) return 55;
  return 40;
}
