import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const bindingPath = path.join(root, "agent-packages", "agent_3_target_feature", "AGENT3_RUNTIME_BINDING_PACKET.yaml");
const binding = await readFile(bindingPath, "utf8");

const requiredMarkers = Object.freeze([
  "runtime_contract_version: v10_activity_profile_v4_basis_coverage",
  "Activity Profile Review must use AI_REGISTRY_KEY.md directly as the active archetype and surface derivation authority.",
  "CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml is superseded for Activity Profile material derivation",
  "Activity Profile Review must support multiple archetypes per activity",
  "Activity Profile Review must emit archetype_derivation_basis and surface_derivation_basis as material basis arrays.",
  "Activity Profile Review must not emit retired material fields archetype_proof or surface_proof_and_routing_limits.",
  "Activity Profile Review must emit exactly one matching derivation-basis object per selected archetype code and per selected surface token using code_or_token.",
  "Activity Profile Review must not emit derivation-basis objects for unselected archetype codes or unselected surface tokens.",
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
  "basis_coverage_rules:",
  "Every selected archetype code must have exactly one matching archetype_derivation_basis object whose code_or_token equals the selected archetype code.",
  "No archetype_derivation_basis object may exist for an unselected archetype code.",
  "Every selected surface token must have exactly one matching surface_derivation_basis object whose code_or_token equals the selected surface token.",
  "No surface_derivation_basis object may exist for an unselected surface token.",
  "Duplicate archetype_codes, surface_context_tokens, or derivation-basis code_or_token values are forbidden.",
  "Activity Profile Review material must emit exactly one derivation-basis object per selected archetype code and per selected surface token.",
  "Activity Profile Review material must reject derivation-basis objects for unselected archetype codes or unselected surface tokens."
]);

const requiredArchetypes = Object.freeze(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV", "CUR", "MOD", "ORA"]);
const requiredSurfaces = Object.freeze(["Consumer-Public", "Enterprise-Private", "PII", "Employment", "Sensitive/Biometric", "Financial", "Content&IP", "Safety&Physical", "Infrastructure", "Minors"]);
const requiredActivityKeys = Object.freeze(["activity_reference", "product_service_wrapper", "activity_feature_name", "activity_candidate_summary", "mechanics_proof", "autonomy_human_control_signal", "data_content_object_touched", "external_internal_action_signal", "archetype_codes", "archetype_derivation_basis", "surface_context_tokens", "surface_derivation_basis"]);
const requiredBasisKeys = Object.freeze(["code_or_token", "normalized_name", "conditions_satisfied", "trigger_if_applied", "exclude_if_checked", "material_basis", "limitation"]);

for (const marker of requiredMarkers) assert.ok(binding.includes(marker), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing marker: ${marker}`);
for (const code of requiredArchetypes) assert.ok(binding.includes(`    - ${code}`), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing v4 archetype code: ${code}`);
for (const surface of requiredSurfaces) assert.ok(binding.includes(`    - ${surface}`), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing surface token: ${surface}`);
for (const key of requiredActivityKeys) assert.ok(binding.includes(`    - ${key}`), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing activity row key: ${key}`);
for (const key of requiredBasisKeys) assert.ok(binding.includes(`    - ${key}`), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing derivation basis key: ${key}`);

console.log(JSON.stringify({
  check: "activity-profile v4 binding packet",
  status: "PASS",
  enforced_gates: [
    "AGENT3_BINDING_AI_REGISTRY_KEY_DIRECT_AUTHORITY",
    "AGENT3_BINDING_NO_ACTIVE_CLASSIFICATION_MATRIX",
    "AGENT3_BINDING_V4_ARCHETYPE_ENUM",
    "AGENT3_BINDING_DERIVATION_BASIS_SCHEMA",
    "AGENT3_BINDING_BASIS_COVERAGE_RULES"
  ]
}, null, 2));
