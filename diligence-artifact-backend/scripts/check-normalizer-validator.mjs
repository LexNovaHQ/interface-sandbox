import assert from "node:assert/strict";
import { compileFinalOutputHandoff } from "../src/compiler.js";
import { validateNormalizedProfilerOutput } from "../src/normalizer-validator.js";

const run = { run_id: "TEST-NORMALIZER-VALIDATOR", target: "Example", root_url: "https://example.com", status: "LOCKED" };
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
const validation = validateNormalizedProfilerOutput(output);
assert.equal(validation.status, "PASS", JSON.stringify(validation, null, 2));
assert.equal(Object.prototype.hasOwnProperty.call(output, "qualified_review_handoff"), false);
assert.equal(Object.prototype.hasOwnProperty.call(output, "qualified_review_renderer_payload"), false);
assert.equal(output.final_output_handoff.final_output_handoff.compiler_trace.qualified_review_branch_separate, true);
assert.equal(output.final_output_handoff.final_output_handoff.legacy_archive.profiles_combined, "ARCHIVED_LEGACY");
console.log("normalizer validator: PASS");
