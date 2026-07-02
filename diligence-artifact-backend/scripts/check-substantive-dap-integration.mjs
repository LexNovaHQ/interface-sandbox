import assert from "node:assert/strict";
import { buildExtendedDapIndiaReadinessProfile } from "../src/extended-dap-india-readiness.js";
import { buildIntegratedDapReport } from "../src/integrated-dap-report.js";

const run = { run_id: "TEST-DAP-SUBSTANTIVE", target: "Example AI", root_url: "https://example.com" };
const artifacts = {
  target_feature_profile: {
    activities: [
      {
        activity_display_id: "ACT-001",
        activity_feature_name: "AI assistant workflow",
        activity_summary: "Users submit prompts, documents and account data to an AI assistant. The service returns generated outputs and uses cloud model processing."
      }
    ]
  },
  data_provenance_profile: {
    data_categories: ["name", "email address", "account data", "user prompts", "generated outputs", "usage telemetry"],
    generated_output_and_derived_data_treatment: "The product produces generated AI outputs from user prompts and uploaded materials.",
    prompt_output_logging_telemetry_controls: "Usage telemetry and logs are referenced for monitoring and diagnostics.",
    security_access_controls: "Security materials reference encryption, access control, SOC 2 and ISO 27001.",
    privacy_notice_visibility: "A public privacy policy is available.",
    rights_request_routes: "A contact route for privacy requests is visible."
  },
  legal_cartography_index: {
    document_coverage_index: [{ document_type: "Privacy Policy", status: "FOUND_INDEXED" }]
  },
  lossless_family__L4_PRIVACY_ADJACENT_NOTICES: {
    clean_text: "The privacy policy describes personal information including name, email, account data, prompts, usage information, vendors, transfers, retention, deletion requests, access requests and grievance contact routes."
  },
  lossless_family__D1_SECURITY_TRUST: {
    clean_text: "The trust center references encryption, SOC 2, ISO 27001, access control, audit logging and incident response procedures."
  }
};

const b4 = buildExtendedDapIndiaReadinessProfile({ run, artifacts }).extended_dap_india_readiness_profile;
assert.equal(b4.profile_version, "extended_dap_india_readiness_v2_substantive_field_base");
assert.equal(b4.field_count, 36);
assert.equal(b4.output_policy.machine_signal_statuses_are_internal_only, true);
assert.ok(b4.fields.every((field) => field.finding && field.factual_basis && field.limitation && field.qualified_review_action), "4B fields must be substantive");
assert.ok(b4.fields.every((field) => Array.isArray(field.registry_basis) && field.registry_basis.length), "4B fields must carry registry basis");
assert.ok(b4.fields.some((field) => field.linked_m8_activity_ids.includes("ACT-001")), "4B must link fields to M8 activity IDs");
assert.equal(b4.fields.some((field) => /^india_/.test(field.field_id)), false, "4B v2 must not expose old india_* machine-signal field ids");

const integrated = buildIntegratedDapReport({ run, artifacts: { ...artifacts, extended_dap_india_readiness_profile: b4 } }).integrated_dap_report;
assert.equal(integrated.profile_version, "integrated_dap_projection_v3_substantive_m8_4b");
assert.equal(integrated.coverage_summary.expected_4b_fields, 36);
assert.equal(integrated.coverage_summary.actual_4b_fields, 36);
assert.equal(integrated.integration_policy.public_report_body_uses_analytical_findings_not_machine_signal_rows, true);
assert.ok(integrated.integrated_table_rows.length >= 30);
for (const row of integrated.integrated_table_rows) {
  assert.equal(row.row_type, "Integrated analytical finding");
  assert.ok(row.evidence_summary && !/VISIBLE_CONTROL_PRESENT|NOT_VISIBLE_AFTER_TARGETED_SEARCH|india_/.test(row.evidence_summary), `${row.normalized_dap_field_id}:machine_garbage_in_evidence_summary`);
  assert.ok(row.factual_basis, `${row.normalized_dap_field_id}:missing_factual_basis`);
  assert.ok(row.limitation, `${row.normalized_dap_field_id}:missing_limitation`);
}
assert.equal(integrated.normalized_section_projection.subsections.length, 12);

console.log("substantive DAP integration: PASS");
