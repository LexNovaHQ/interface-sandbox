import assert from "node:assert/strict";
import { compileFinalOutputHandoff } from "../src/compiler.js";

const run = { run_id: "TEST-COMPILER", target: "Example", root_url: "https://example.com", status: "LOCKED" };
const artifacts = {
  target_profile: { target_identity: {}, jurisdiction_notice: {}, business_context: {}, product_service_wrapper: {}, target_profile_limitations: [] },
  target_feature_profile: { activities: [], profile_level_limitations: [] },
  legal_cartography_index: { document_coverage_index: [], document_structure_index: [], incorporated_linked_document_map: [], control_language_locator: [], missing_limited_legal_governance_items: [], lock_status: "LOCKED" },
  data_provenance_profile: { missing_proof_and_diligence_requests: [], limitations: [] },
  exposure_registry_triggered_profile: { triggered_rows: [] },
  exposure_registry_controlled_profile: { controlled_rows: [] },
  exposure_registry_workpad_98: { registry_rows: [] },
  exposure_registry_profile_forensics: {},
  challenge_gate: { status: "LOCKED" }
};

const output = compileFinalOutputHandoff({ run, artifacts });
assert.ok(output.normalized_report_manifest);
assert.ok(output.vault_section_handoff);
assert.ok(output.qualified_review_handoff);
assert.ok(output.normalized_section__matter_overview);
assert.ok(output.final_output_handoff);
assert.ok(output.final_output_handoff.final_output_handoff.normalized_sections);
assert.equal(output.final_output_handoff.validation_status, "LOCKED");
assert.equal(output.qualified_review_handoff.public_label, "Qualified Review");
assert.equal(output.final_output_handoff.final_output_handoff.legacy_archive.profiles_combined, "ARCHIVED_LEGACY");
console.log("normalized compiler output: PASS");
