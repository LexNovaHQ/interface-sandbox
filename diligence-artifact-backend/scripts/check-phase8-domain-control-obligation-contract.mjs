import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_TOP_LEVEL_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_FINAL_ROW_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MECHANICAL_PROFILE_ROW_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MODEL_OUTPUT_ROW_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_TOP_LEVEL_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_AGENT_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ORDER,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_PUBLIC_LABEL,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID,
  domainControlObligationCandidateInventoryFields,
  domainControlObligationCandidateInventoryReadArtifacts,
  domainControlObligationCandidateInventoryWriteArtifacts,
  domainControlObligationProfileMechanicalFields,
  domainControlObligationProfileModelMaterialFields,
  domainControlObligationProfileReadArtifacts,
  domainControlObligationProfileWriteArtifacts
} from "../src/phases/08-domain-control-obligation-profile/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

assert.equal(PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ID, "DOMAIN_CONTROL_OBLIGATION_PROFILE");
assert.equal(PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ORDER, 8);
assert.equal(PHASE8_DOMAIN_CONTROL_OBLIGATION_PUBLIC_LABEL, "Domain Control Obligation Profile");
assert.equal(PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID, "ROUTE.PHASE8.DOMAIN_CONTROL_OBLIGATION_PROFILE");
assert.equal(PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID, "2E_BUCKET_DOMAIN_CONTROL_OBLIGATION");
assert.equal(PHASE8_DOMAIN_CONTROL_OBLIGATION_AGENT_ID, "agent_8_domain_control_obligation");
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID, "DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY");
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID, "DOMAIN_CONTROL_OBLIGATION_PROFILE");
assert.deepEqual(DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS, ["PRIMARY", "CAPABILITY_OVERLAY"]);

assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.central_phase_id, PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ID);
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.phase_job_id, DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID);
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.model_usage, "NONE_DETERMINISTIC");
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.provider_call_allowed, false);
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.production_entrypoint_switched, false);
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.route_contract.routing_authority, "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY");
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.route_contract.route_id, PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID);
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.route_contract.bucket_id, PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID);
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.output_contract.mechanical_shell_only, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.output_contract.material_field_derivation_forbidden, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.package_scope.mounted_regulatory_overlays_may_create_obligations, false);
assert.deepEqual(domainControlObligationCandidateInventoryWriteArtifacts(), [DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT]);
assert.deepEqual(domainControlObligationCandidateInventoryFields(), DOMAIN_CONTROL_OBLIGATION_CANDIDATE_FIELDS);
assert.deepEqual(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.output_contract.required_top_level_fields, DOMAIN_CONTROL_OBLIGATION_CANDIDATE_TOP_LEVEL_FIELDS);

assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.central_phase_id, PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ID);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.phase_job_id, DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.agent_id, PHASE8_DOMAIN_CONTROL_OBLIGATION_AGENT_ID);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.model_usage, "MODEL_JSON_ONLY_MATERIAL_FIELDS");
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.production_entrypoint_switched, false);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.route_contract.routing_authority, "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY");
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.route_contract.route_id, PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.route_contract.bucket_id, PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.candidate_boundary.candidate_inventory_is_only_candidate_universe ?? true, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.field_ownership.backend_may_author_material_fields, false);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.field_ownership.backend_may_fill_missing_material_fields, false);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.field_ownership.backend_may_rewrite_material_fields, false);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.compiler_contract.compiler_may_not_create_or_remove_candidate_rows, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.compiler_contract.regulatory_overlay_refs_backend_stamped, true);
assert.deepEqual(domainControlObligationProfileWriteArtifacts(), [DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT]);
assert.deepEqual(domainControlObligationProfileModelMaterialFields(), DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS);
assert.deepEqual(domainControlObligationProfileMechanicalFields(), DOMAIN_CONTROL_OBLIGATION_MECHANICAL_PROFILE_ROW_FIELDS);
assert.deepEqual(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.model_output_contract.row_fields, DOMAIN_CONTROL_OBLIGATION_MODEL_OUTPUT_ROW_FIELDS);
assert.deepEqual(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.output_contract.required_top_level_fields, DOMAIN_CONTROL_OBLIGATION_PROFILE_TOP_LEVEL_FIELDS);
assert.deepEqual(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.output_contract.obligation_row_fields, DOMAIN_CONTROL_OBLIGATION_FINAL_ROW_FIELDS);

for (const reads of [
  domainControlObligationCandidateInventoryReadArtifacts(),
  domainControlObligationProfileReadArtifacts()
]) {
  for (const required of [
    "phase_routing_manifest",
    "phase_route_runtime_packet",
    "domain_control_obligation_navigation_index",
    "target_profile",
    "domain_derivation_profile",
    "target_feature_profile",
    "active_run_package_manifest"
  ]) assert.ok(reads.includes(required), `Phase 8 reads missing ${required}`);

  for (const forbidden of [
    "target_profile_forensics",
    "target_feature_profile_forensics",
    "dap_forensics_profile",
    "dap_registry_manifest",
    "dap_strategic_derivation_matrix",
    "data_provenance_profile_semantic_batch_gate",
    "challenge_gate",
    "final_output_handoff",
    "renderer_payload"
  ]) assert.equal(reads.includes(forbidden), false, `Phase 8 reads contain forbidden artifact ${forbidden}`);
}

for (const file of DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.prompt_files) {
  assert.ok(fs.existsSync(path.join(backendRoot, file)), `Phase 8 prompt file missing: ${file}`);
}
for (const file of DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.references) {
  assert.ok(fs.existsSync(path.join(backendRoot, file)), `Phase 8 reference file missing: ${file}`);
}

for (const relativePath of [
  "src/phases/08-domain-control-obligation-profile/domain-control-obligation.constants.js",
  "src/phases/08-domain-control-obligation-profile/domain-control-obligation-candidate-inventory.contract.js",
  "src/phases/08-domain-control-obligation-profile/domain-control-obligation-profile.contract.js",
  "src/phases/08-domain-control-obligation-profile/index.js",
  "src/phases/08-domain-control-obligation-profile/README.md"
]) assert.ok(fs.existsSync(path.join(backendRoot, relativePath)), `Phase 8 package file missing: ${relativePath}`);

console.log("Phase 8 Domain Control Obligation contracts/package surface: PASS");
