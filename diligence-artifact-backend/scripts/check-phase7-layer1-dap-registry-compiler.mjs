import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCentralPhaseImplementation } from "../src/phases/phase-registry.js";
import { DATA_PROVENANCE_PROFILE_PHASE } from "../src/phases/07-data-provenance-profile/data-provenance-profile.phase.js";
import { PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT } from "../src/phases/07-data-provenance-profile/data-provenance-profile.contract.js";
import { compilePhase7DapRegistryDerivationRules, PHASE7_DAP_MATERIAL_SECTION_MATRIX, PHASE7_EXPECTED_DAP_FIELD_COUNT, PHASE7_REGISTRY_SOURCE_PATH, validatePhase7DapRegistryManifest } from "../src/phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryText = fs.readFileSync(path.join(root, PHASE7_REGISTRY_SOURCE_PATH), "utf8");
const manifest = compilePhase7DapRegistryDerivationRules(registryText);
const validation = validatePhase7DapRegistryManifest(manifest);
const phaseRegistryRow = getCentralPhaseImplementation("DATA_PROVENANCE_PROFILE");

assert.equal(DATA_PROVENANCE_PROFILE_PHASE.implementation_status, "PACKAGE_CONTRACT_LAYER_1_LOCKED_RUNTIME_CUTOVER_PENDING");
assert.equal(phaseRegistryRow.implementation_status, "PACKAGE_CONTRACT_LAYER_1_LOCKED_RUNTIME_CUTOVER_PENDING");
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.phase_id, "DATA_PROVENANCE_PROFILE");
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.material_dap_field_base_count, PHASE7_EXPECTED_DAP_FIELD_COUNT);
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.semantic_led_architecture, true);
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.deterministic_first, false);
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.compiler_inside_phase7, false);
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.forensics_inside_phase7, false);
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.layer_contracts.length, 5);
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.layer_contracts[0].writes[0], "dap_registry_manifest");
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.layer_contracts[0].writes[1], "dap_strategic_derivation_matrix");

assert.equal(manifest.registry_metadata.declared_row_count, 427);
assert.equal(manifest.registry_metadata.locked, true);
assert.equal(manifest.actual_dap_field_count, PHASE7_EXPECTED_DAP_FIELD_COUNT);
assert.equal(manifest.material_section_count, 17);
assert.equal(validation.status, "PASS");
assert.equal(validation.all_derivation_rules_compiled, true);

for (const sectionRow of PHASE7_DAP_MATERIAL_SECTION_MATRIX) {
  assert.equal(manifest.section_counts[sectionRow.section_id], sectionRow.expected_count, `bad section count ${sectionRow.section_id}`);
}

for (const requiredFamily of ["DAP.EXEC", "DAP.PARTY", "DAP.ROLE", "DAP.OBJ", "DAP.FLOW", "DAP.AUTH", "DAP.CTRL", "DAP.CONTACT", "DAP.CM", "DAP.VEND", "DAP.LOC", "DAP.RET", "DAP.SEC", "DAP.DOM", "DAP.SENS", "DAP.READY", "DAP.REQ", "DAP.LIM"]) {
  assert.ok(manifest.registry_family_counts[requiredFamily] > 0, `missing family ${requiredFamily}`);
}

for (const packetName of ["PACKET_A_PARTIES_ROLES_OBJECTS_FLOW", "PACKET_B_PURPOSE_NOTICE_CONTACT_CONSENT", "PACKET_C_VENDORS_TRANSFERS_RETENTION", "PACKET_D_SECURITY_SENSITIVE_AI_LIFECYCLE", "PACKET_E_REGULATORY_READINESS", "PACKET_F_EXECUTIVE_SYNTHESIS", "DETERMINISTIC_REQ_LIM"]) {
  assert.ok(manifest.model_packet_counts[packetName] > 0, `missing packet ${packetName}`);
}

for (const row of manifest.material_rules) {
  assert.equal(row.profile_section, "Data / Asset Provenance Profile");
  assert.equal(row.lock_status, "LOCKED");
  assert.ok(row.mode, `missing mode ${row.field_id}`);
  assert.ok(row.source_basis, `missing source_basis ${row.field_id}`);
  assert.ok(row.conditions, `missing conditions ${row.field_id}`);
  assert.ok(row.trigger_outcome, `missing trigger_outcome ${row.field_id}`);
  assert.ok(row.exclude_fallback, `missing exclude_fallback ${row.field_id}`);
  assert.ok(row.forbidden_inference, `missing forbidden_inference ${row.field_id}`);
  assert.ok(row.material_section_id.startsWith("DAP-"), `missing material section ${row.field_id}`);
  assert.ok(Array.isArray(row.evidence_atom_requirements) && row.evidence_atom_requirements.length >= 6, `missing evidence atom requirements ${row.field_id}`);
  assert.ok(row.limitation_trigger, `missing limitation trigger ${row.field_id}`);
  assert.ok(row.missing_proof_trigger, `missing missing proof trigger ${row.field_id}`);
  assert.equal(row.legal_firewall.no_compliance_conclusion, true);
  assert.equal(row.legal_firewall.no_m11_exposure_or_threat_logic, true);
}

console.log("Phase 7 Layer 1 DAP registry compiler: PASS");
