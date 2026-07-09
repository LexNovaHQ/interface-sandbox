import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const bindingPath = path.join(root, "agent-packages", "agent_3_target_feature", "AGENT3_RUNTIME_BINDING_PACKET.yaml");
const binding = await readFile(bindingPath, "utf8");

const requiredMarkers = Object.freeze([
  "runtime_contract_version: v12_phase3a_scoped_lossless_phase3b_registry_ladder",
  "activity_profile_material_schema:",
  "archetype_derivation_authority: AI_REGISTRY_KEY.md §4",
  "surface_derivation_authority: AI_REGISTRY_KEY.md §7",
  "classification_matrix_active_for_material_derivation: false",
  "multiple_archetypes_per_activity_allowed: true",
  "allowed_archetype_codes:",
  "allowed_surface_context_tokens:",
  "activity_row_required_keys:",
  "retired_activity_row_keys_forbidden:",
  "derivation_basis_object_required_keys:",
  "Activity Profile Review material uses feature_candidate_inventory as candidate universe and backend-authorized product/activity evidence."
]);

const requiredArchetypes = Object.freeze(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV", "CUR", "MOD", "ORA"]);
const requiredSurfaces = Object.freeze(["Consumer-Public", "Enterprise-Private", "PII", "Employment", "Sensitive/Biometric", "Financial", "Content&IP", "Safety&Physical", "Infrastructure", "Minors"]);
const requiredActivityKeys = Object.freeze(["activity_reference", "product_service_wrapper", "activity_feature_name", "activity_candidate_summary", "mechanics_proof", "autonomy_human_control_signal", "data_content_object_touched", "external_internal_action_signal", "archetype_codes", "archetype_derivation_basis", "surface_context_tokens", "surface_derivation_basis"]);
const retiredActivityKeys = Object.freeze(["archetype_proof", "surface_proof_and_routing_limits"]);
const requiredBasisKeys = Object.freeze(["code_or_token", "normalized_name", "conditions_satisfied", "trigger_if_applied", "exclude_if_checked", "material_basis", "limitation"]);

for (const marker of requiredMarkers) assert.ok(binding.includes(marker), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing marker: ${marker}`);
for (const code of requiredArchetypes) assert.ok(binding.includes(`    - ${code}`), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing archetype code: ${code}`);
for (const surface of requiredSurfaces) assert.ok(binding.includes(`    - ${surface}`), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing surface token: ${surface}`);
for (const key of requiredActivityKeys) assert.ok(binding.includes(`    - ${key}`), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing activity row key: ${key}`);
for (const key of retiredActivityKeys) assert.ok(binding.includes(`    - ${key}`), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing retired key fence: ${key}`);
for (const key of requiredBasisKeys) assert.ok(binding.includes(`    - ${key}`), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing derivation basis key: ${key}`);

console.log(JSON.stringify({
  check: "activity-profile v4 binding packet",
  status: "PASS",
  enforced_gates: [
    "AGENT3_BINDING_AI_REGISTRY_KEY_DIRECT_AUTHORITY",
    "AGENT3_BINDING_NO_ACTIVE_CLASSIFICATION_MATRIX",
    "AGENT3_BINDING_V4_ARCHETYPE_ENUM",
    "AGENT3_BINDING_DERIVATION_BASIS_SCHEMA"
  ]
}, null, 2));
