import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PACKAGE_DIR = "agent-packages/phase_2a_target_profile_source_index";
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const EXPECTED_PACKAGE_FILES = Object.freeze([
  "00_RUNTIME_CONTROLLER_PHASE2A_TARGET_PROFILE_SOURCE_INDEX.md",
  "00_TERMINAL_RECEIPT_RULES_PHASE2A_TARGET_PROFILE_SOURCE_INDEX.md",
  "00_VALIDATOR_RULES_PHASE2A_TARGET_PROFILE_SOURCE_INDEX.md",
  "P2A_PACKET_MANIFEST.json",
  "P2A_TARGET_PROFILE_SOURCE_INDEX.md",
  "P2A_TARGET_PROFILE_SOURCE_INDEX_REFERENCE_MAP.yaml",
  "P2A_TARGET_PROFILE_SOURCE_INDEX_RUNTIME_BINDING_PACKET.yaml"
]);

const OMITTED_PACKAGE_FILES = Object.freeze([
  "P2A_STEP1_OUTPUT_CONTRACT_LOCK.md",
  "P2A_REINVESTIGATION.md",
  "P2A_HYBRID_COMPILER_CONTRACT.md",
  "P2A_PROMPT_STACK_ORDER.md",
  "P2A_PACKET_VALIDATION.json"
]);

const PHASE1_V5_TARGET_ROOTS = Object.freeze([
  "lossless_root__homepage_landing",
  "lossless_root__company_identity",
  "lossless_root__contact_notice",
  "lossless_root__pricing_commercial_availability",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints"
]);

const WRITE_ORDER = Object.freeze([
  "target_profile_deterministic_map",
  "target_profile_semantic_profile",
  "target_profile_source_index"
]);

const packagePath = path.join(ROOT, PACKAGE_DIR);
assert.equal(fs.existsSync(packagePath), true, "Phase 2A package folder must exist");
assert.deepEqual(fs.readdirSync(packagePath).filter((name) => !name.startsWith(".")).sort(), [...EXPECTED_PACKAGE_FILES].sort(), "Phase 2A package must contain exactly seven locked files");

for (const file of EXPECTED_PACKAGE_FILES) assert.ok(read(`${PACKAGE_DIR}/${file}`).trim().length > 0, `${file} must not be empty`);
for (const file of OMITTED_PACKAGE_FILES) assert.equal(fs.existsSync(path.join(packagePath, file)), false, `${file} must remain omitted from lean package`);

const binding = read(`${PACKAGE_DIR}/P2A_TARGET_PROFILE_SOURCE_INDEX_RUNTIME_BINDING_PACKET.yaml`);
const controller = read(`${PACKAGE_DIR}/00_RUNTIME_CONTROLLER_PHASE2A_TARGET_PROFILE_SOURCE_INDEX.md`);
const moduleText = read(`${PACKAGE_DIR}/P2A_TARGET_PROFILE_SOURCE_INDEX.md`);
const referenceMap = read(`${PACKAGE_DIR}/P2A_TARGET_PROFILE_SOURCE_INDEX_REFERENCE_MAP.yaml`);
const validator = read(`${PACKAGE_DIR}/00_VALIDATOR_RULES_PHASE2A_TARGET_PROFILE_SOURCE_INDEX.md`);
const terminal = read(`${PACKAGE_DIR}/00_TERMINAL_RECEIPT_RULES_PHASE2A_TARGET_PROFILE_SOURCE_INDEX.md`);
const manifest = JSON.parse(read(`${PACKAGE_DIR}/P2A_PACKET_MANIFEST.json`));

assert.equal(manifest.packet_name, "P2A_TARGET_PROFILE_SOURCE_INDEX_PACKET");
assert.equal(manifest.package_status, "LEAN_PACKAGE_CREATED_NOT_RUNTIME_WIRED");
assert.equal(manifest.runtime_wiring_changed, false);
assert.equal(manifest.final_downstream_required_artifact, "target_profile_source_index");
assert.deepEqual(manifest.components, [
  "P2A_TARGET_PROFILE_SOURCE_INDEX_RUNTIME_BINDING_PACKET.yaml",
  "00_RUNTIME_CONTROLLER_PHASE2A_TARGET_PROFILE_SOURCE_INDEX.md",
  "P2A_TARGET_PROFILE_SOURCE_INDEX.md",
  "P2A_TARGET_PROFILE_SOURCE_INDEX_REFERENCE_MAP.yaml",
  "00_VALIDATOR_RULES_PHASE2A_TARGET_PROFILE_SOURCE_INDEX.md",
  "00_TERMINAL_RECEIPT_RULES_PHASE2A_TARGET_PROFILE_SOURCE_INDEX.md",
  "P2A_PACKET_MANIFEST.json"
]);
assert.deepEqual(manifest.deliberately_not_created, OMITTED_PACKAGE_FILES);
assert.deepEqual(manifest.write_artifacts_in_order, WRITE_ORDER);

for (const root of PHASE1_V5_TARGET_ROOTS) {
  assert.ok(binding.includes(root), `binding missing ${root}`);
  assert.ok(moduleText.includes(root), `module missing ${root}`);
  assert.ok(referenceMap.includes(root), `reference map missing ${root}`);
  assert.ok(manifest.read_artifacts.includes(root), `manifest missing ${root}`);
}

for (const artifact of WRITE_ORDER) {
  assert.ok(binding.includes(artifact), `binding missing write artifact ${artifact}`);
  assert.ok(terminal.includes(artifact), `terminal missing write artifact ${artifact}`);
}

for (const marker of ["TP.BIZ.009", "TP.BIZ.010", "phase_2a_action: LOCATE_ONLY", "derived_value_forbidden: true"]) assert.ok(referenceMap.includes(marker), `reference map missing ${marker}`);
assert.equal((referenceMap.match(/field_id:\s*TP\.BIZ\.009/g) || []).length, 1, "TP.BIZ.009 must appear as a field row exactly once");
assert.equal((referenceMap.match(/field_id:\s*TP\.BIZ\.010/g) || []).length, 1, "TP.BIZ.010 must appear as a field row exactly once");

for (const marker of ["Phase 2A locates", "Phase 3A Target Profile Review owns", "Phase 2E / M9 owns", "not a profile derivation layer"]) assert.ok(moduleText.includes(marker), `module missing boundary marker ${marker}`);
for (const marker of ["P2A_TARGET_PROFILE_FORBIDDEN_OUTPUTS", "P2A_TARGET_PROFILE_FORBIDDEN_CONCLUSIONS", "P2A_TARGET_PROFILE_RETIRED_ROOTS_FORBIDDEN"]) assert.ok(validator.includes(marker), `validator overlay missing ${marker}`);
for (const marker of ["strict JSON", "No markdown", "Do not instruct the backend to advance", "Do not run Target Profile Review"]) assert.ok(terminal.includes(marker), `terminal missing ${marker}`);
assert.ok(controller.includes("Phase 2A executes only Target Profile Source Index work"));

const runtimeText = ["src/phase-contracts.js", "src/runtime/contracts/pipeline.contract.js", "src/runtime/contracts/artifact-permissions.contract.js"].map(read).join("\n");
assert.equal(runtimeText.includes(PACKAGE_DIR), false, "Phase 2A package must not be runtime-wired during package audit");

console.log("Phase 2A target source lean package audit: PASS");
