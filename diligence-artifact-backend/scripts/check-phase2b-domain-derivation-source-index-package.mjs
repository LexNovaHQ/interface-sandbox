import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PACKAGE_DIR = "agent-packages/phase_2b_domain_derivation_source_index";
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const EXPECTED_PACKAGE_FILES = Object.freeze([
  "00_RUNTIME_CONTROLLER_PHASE2B_DOMAIN_DERIVATION_SOURCE_INDEX.md",
  "00_TERMINAL_RECEIPT_RULES_PHASE2B_DOMAIN_DERIVATION_SOURCE_INDEX.md",
  "00_VALIDATOR_RULES_PHASE2B_DOMAIN_DERIVATION_SOURCE_INDEX.md",
  "P2B_DOMAIN_DERIVATION_SOURCE_INDEX.md",
  "P2B_DOMAIN_DERIVATION_SOURCE_INDEX_REFERENCE_MAP.yaml",
  "P2B_DOMAIN_DERIVATION_SOURCE_INDEX_RUNTIME_BINDING_PACKET.yaml",
  "P2B_PACKET_MANIFEST.json"
]);

const OMITTED_PACKAGE_FILES = Object.freeze([
  "P2B_STEP1_OUTPUT_CONTRACT_LOCK.md",
  "P2B_REINVESTIGATION.md",
  "P2B_HYBRID_COMPILER_CONTRACT.md",
  "P2B_PROMPT_STACK_ORDER.md",
  "P2B_PACKET_VALIDATION.json"
]);

const P2B_ROOTS = Object.freeze([
  "lossless_root__homepage_landing",
  "lossless_root__company_identity",
  "lossless_root__product_service",
  "lossless_root__platform_feature_solution",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow",
  "lossless_root__pricing_commercial_availability",
  "lossless_root__use_case_customer_industry",
  "lossless_root__integrations_ecosystem",
  "lossless_root__ai_safety_transparency",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints"
]);

const WRITE_ORDER = Object.freeze([
  "domain_derivation_deterministic_map",
  "domain_derivation_semantic_profile",
  "domain_derivation_source_index"
]);

const ROUTE_MAPS = Object.freeze([
  "primary_domain_locator_map",
  "ai_overlay_locator_map",
  "regulatory_overlay_locator_map",
  "fusion_candidate_locator_map",
  "activity_capability_locator_map",
  "commercial_availability_locator_map",
  "technical_capability_locator_map",
  "integration_ecosystem_locator_map",
  "use_case_customer_industry_locator_map"
]);

const BAD_MARKERS = Object.freeze([
  "P2B_DOMAIN_ACTIVITY_SOURCE_INDEX",
  "domain_activity_deterministic_map",
  "domain_activity_semantic_profile",
  "activity_profile_source_index_owned_by_2b",
  "final_downstream_required_artifact\": \"activity_profile_source_index",
  "Phase 2B owns `activity_profile_source_index`"
]);

const packagePath = path.join(ROOT, PACKAGE_DIR);
assert.equal(fs.existsSync(packagePath), true, "Phase 2B domain derivation package folder must exist");
assert.deepEqual(fs.readdirSync(packagePath).filter((name) => !name.startsWith(".")).sort(), [...EXPECTED_PACKAGE_FILES].sort(), "Phase 2B package must contain exactly seven locked files");

for (const file of EXPECTED_PACKAGE_FILES) {
  const text = read(`${PACKAGE_DIR}/${file}`);
  assert.ok(text.trim().length > 0, `${file} must not be empty`);
  assert.ok(text.split(/\r?\n/).length >= minLines(file), `${file} is suspiciously thin or truncated`);
  for (const bad of BAD_MARKERS) assert.equal(text.includes(bad), false, `${file} contains wrong 2B activity artifact marker: ${bad}`);
}
for (const file of OMITTED_PACKAGE_FILES) assert.equal(fs.existsSync(path.join(packagePath, file)), false, `${file} must remain omitted from lean package`);

const binding = read(`${PACKAGE_DIR}/P2B_DOMAIN_DERIVATION_SOURCE_INDEX_RUNTIME_BINDING_PACKET.yaml`);
const controller = read(`${PACKAGE_DIR}/00_RUNTIME_CONTROLLER_PHASE2B_DOMAIN_DERIVATION_SOURCE_INDEX.md`);
const moduleText = read(`${PACKAGE_DIR}/P2B_DOMAIN_DERIVATION_SOURCE_INDEX.md`);
const referenceMap = read(`${PACKAGE_DIR}/P2B_DOMAIN_DERIVATION_SOURCE_INDEX_REFERENCE_MAP.yaml`);
const validator = read(`${PACKAGE_DIR}/00_VALIDATOR_RULES_PHASE2B_DOMAIN_DERIVATION_SOURCE_INDEX.md`);
const terminal = read(`${PACKAGE_DIR}/00_TERMINAL_RECEIPT_RULES_PHASE2B_DOMAIN_DERIVATION_SOURCE_INDEX.md`);
const manifest = JSON.parse(read(`${PACKAGE_DIR}/P2B_PACKET_MANIFEST.json`));

assert.equal(manifest.packet_name, "P2B_DOMAIN_DERIVATION_SOURCE_INDEX_PACKET");
assert.equal(manifest.package_status, "LEAN_PACKAGE_RUNTIME_WIRED");
assert.equal(manifest.runtime_wiring_changed, true);
assert.equal(manifest.runtime_job_id, "P2B_DOMAIN_DERIVATION_SOURCE_INDEX");
assert.equal(manifest.final_downstream_required_artifact, "domain_derivation_source_index");
assert.equal(manifest.reserved_for_2c_phase5, "activity_profile_source_index");
assert.equal(manifest.boundary_locks.runtime_wiring_changed, true);
for (const flag of ["artifact_permissions_registered", "pipeline_contract_registered", "central_phase_registered", "pipeline_service_dispatch_registered", "save_order_gates_registered"]) assert.equal(manifest.runtime_wiring[flag], true, `manifest missing runtime wiring flag ${flag}`);
assert.equal(manifest.runtime_wiring.p2a_next, "P2B_DOMAIN_DERIVATION_SOURCE_INDEX");
assert.equal(manifest.runtime_wiring.p2b_next, "P2_INDEX_COMPILER_VALIDATION");
assert.deepEqual(manifest.components, EXPECTED_PACKAGE_FILES);
assert.deepEqual(manifest.deliberately_not_created, OMITTED_PACKAGE_FILES);
assert.deepEqual(manifest.write_artifacts_in_order, WRITE_ORDER);

for (const root of P2B_ROOTS) {
  assert.ok(binding.includes(root), `binding missing ${root}`);
  assert.ok(moduleText.includes(root), `module missing ${root}`);
  assert.ok(referenceMap.includes(root), `reference map missing ${root}`);
  assert.ok(manifest.read_artifacts.includes(root), `manifest missing ${root}`);
}
assert.deepEqual(manifest.read_artifacts.filter((artifact) => artifact.startsWith("lossless_root__")), P2B_ROOTS);
for (const forbiddenRead of ["legal_doc_{DOC_TYPE}", "legal_cartography_index", "legal_signal_derivation_profile", "data_privacy_navigation_index"]) assert.equal(manifest.read_artifacts.includes(forbiddenRead), false, `manifest must not read ${forbiddenRead}`);

for (const artifact of WRITE_ORDER) {
  assert.ok(binding.includes(artifact), `binding missing write artifact ${artifact}`);
  assert.ok(terminal.includes(artifact), `terminal missing write artifact ${artifact}`);
}
for (const routeMap of ROUTE_MAPS) {
  assert.ok(moduleText.includes(routeMap), `module missing ${routeMap}`);
  assert.ok(referenceMap.includes(routeMap), `reference map missing ${routeMap}`);
  assert.ok(validator.includes(routeMap), `validator rules missing ${routeMap}`);
}

for (const marker of ["Phase 2B builds a source-navigation index", "Phase 2B owns", "domain_derivation_source_index", "Phase 3B Domain Derivation owns", "Phase 2C / Phase 5 owns", "not an activity profile layer"]) assert.ok(moduleText.includes(marker), `module missing boundary marker: ${marker}`);
for (const marker of ["AI_SIGNAL_PLUS_ONE_OR_MORE_PRIMARY_REGULATORY_ACTIVITY_OR_COMMERCIAL_SIGNAL", "composite_signal_required: true", "derived_value_forbidden: true", "phase_2b_action: LOCATE_ONLY"]) assert.ok(referenceMap.includes(marker), `reference map missing route doctrine: ${marker}`);
for (const marker of ["Semantic coverage is measured against deterministic `semantic_label_queue`", "coverage_ratio", "ready_for_compiler", "Forbidden outputs", "Retired roots forbidden", "lossless_family__"]) assert.ok(validator.includes(marker), `validator rules missing ${marker}`);
for (const marker of ["strict JSON", "same-chat next-phase instructions", "Do not continue to:", "P3_DOMAIN_DERIVATION_LAYER", "Each save event must have one top-level root only"]) assert.ok(terminal.includes(marker), `terminal missing ${marker}`);
assert.ok(controller.includes("Phase 2B exists only to build a pointer-only source index"));
assert.ok(binding.includes("runtime_wiring_changed: true"));
assert.ok(binding.includes("P2B_DOMAIN_DERIVATION_SOURCE_INDEX"));

for (const text of [binding, controller, moduleText, referenceMap, validator, terminal]) {
  assert.equal(text.includes("source text may be copied"), false, "package must not allow source text copy");
  assert.equal(text.includes("derive primary domain"), false, "package must not instruct 2B to derive primary domain");
}

console.log("Phase 2B domain derivation lean package quality audit: PASS");

function minLines(file) {
  if (file.endsWith("MANIFEST.json")) return 60;
  if (file.includes("REFERENCE_MAP")) return 120;
  if (file === "P2B_DOMAIN_DERIVATION_SOURCE_INDEX.md") return 180;
  if (file.includes("RUNTIME_BINDING")) return 55;
  return 40;
}
