import assert from "node:assert/strict";
import { buildRendererPayload } from "../src/report-renderer.js";

const run = { run_id: "TEST-RENDERER", target: "Example", root_url: "https://example.com" };
const final_output_handoff = {
  final_output_handoff: {
    validation_status: "LOCKED",
    normalized_report_manifest: {
      run_id: "TEST-RENDERER",
      target: "Example",
      target_url: "https://example.com",
      validation_status: "LOCKED",
      section_order: ["matter_overview"],
      renderer_contract: { renderer_may_render: true }
    },
    normalized_sections: {
      matter_overview: {
        artifact: sampleSection("matter_overview", "Matter Overview")
      }
    }
  }
};

const output = buildRendererPayload({ run, final_output_handoff });
assert.equal(output.renderer_payload.renderer_source, "normalized_section_artifacts_only");
assert.equal(output.renderer_payload.sections[0].section_id, "matter_overview");
assert.equal(output.renderer_payload.sections[0].section_title, "Matter Overview");
assert.equal(output.renderer_payload.sections[0].subsections.length, 1);
assert.deepEqual(output.renderer_payload.sections[0].section_limitations || [], []);
assert.equal(JSON.stringify(output.renderer_payload.sections).includes("FORBIDDEN SECTION LIMITATION"), false);
assert.equal(JSON.stringify(output.renderer_payload.sections).includes("subsection_title\":\"Nested"), false);

const fullOrder = ["matter_overview", "executive_summary", "target_profile", "product_activity_ip_profile", "data_provenance_controls", "legal_document_control_review", "exposure_summary_harm_mechanism_workpad_summary", "exposure_diagnosis_table", "exposure_control_discipline", "review_route_action_plan", "control_handoff_readiness", "exposure_clarification_queue", "global_confirmation_queue", "methodology_limitations_forensic_annexure"];
const fullInput = { normalized_report_manifest: { run_id: "TEST-FULL-RENDERER", target: "Example", target_url: "https://example.com", validation_status: "LOCKED", section_order: fullOrder } };
for (const sectionId of fullOrder) fullInput[`normalized_section__${sectionId}`] = { artifact: sampleSection(sectionId, sectionTitle(sectionId)) };
fullInput.normalized_section__exposure_summary_harm_mechanism_workpad_summary.artifact.subsections = [
  subsection("exposure_summary", "Exposure Summary", "Exposure summary", { registry_workpad_rows: 98, triggered_rows: 15 }),
  subsection("harm_mechanism_summary", "Harm Mechanism Summary", "Harm mechanism summary", [{ Subcat: "PRV", Harm_Mechanism: "Public signal", Triggered_Rows: 1 }])
];
fullInput.normalized_section__exposure_diagnosis_table.artifact.subsections = [
  subsection("exposure_diagnosis_table", "Exposure Diagnosis Table", "Exposure diagnosis table", [{ Exposure_ID: "EXP-001", Threat_ID: "T-001", Threat_Name: "Example", Subcat: "PRV", Status: "TRIGGERED" }])
];
fullInput.normalized_section__exposure_control_discipline.artifact.subsections = [
  subsection("control_discipline", "Control / Exclusion / False-Positive Discipline", "Control discipline table", [{ Exposure_ID: "EXP-001", Threat_ID: "T-001", Threat_Name: "Example", Subcat: "PRV", Status: "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION" }])
];
const fullOutput = buildRendererPayload({ run: { run_id: "TEST-FULL-RENDERER", target: "Example", root_url: "https://example.com" }, final_output_handoff: fullInput }).renderer_payload;
assert.equal(fullOutput.sections.length, 10);
assert.deepEqual(fullOutput.sections.map((section) => section.section_id), ["matter_overview", "executive_summary", "target_profile", "product_activity_ip_profile", "data_provenance_controls", "legal_document_control_review", "exposure_findings", "review_route_handoff_plan", "clarification_missing_source_queue", "methodology_limitations_public_annexure"]);
for (const section of fullOutput.sections) assert.deepEqual(section.section_limitations || [], []);
const section7 = fullOutput.sections.find((section) => section.section_id === "exposure_findings");
assert.ok(section7.subsections.some((subsection) => subsection.subsection_title === "Exposure Summary"));
assert.ok(section7.subsections.some((subsection) => subsection.subsection_title === "Exposure Diagnosis Table"));
assert.ok(section7.subsections.some((subsection) => subsection.subsection_title === "Control / Exclusion / False-Positive Discipline"));
assert.equal(JSON.stringify(section7.subsections.map((subsection) => subsection.fields.map((field) => field.value))).includes("subsection_title"), false);
console.log("normalized renderer output: PASS");

function sampleSection(section_id, section_title) {
  return { section_id, artifact_name: `normalized_section__${section_id}`, section_title, section_order: 1, section_status: "LOCKED", reviewer_summary: "Summary", section_limitations: ["FORBIDDEN SECTION LIMITATION"], source_artifacts_used: ["target_profile"], normalization: { internal: true }, vault_mapping: { internal: true }, subsections: [subsection(`${section_id}_subsection`, "Sample", "Target", { public_name: "Example", source_path: "target_profile.target_identity.brand_name", technical_refs: { evidence_id: "E-001" } })] };
}
function subsection(subsection_id, subsection_title, label, value) {
  return { subsection_id, subsection_title, fields: [{ field_id: `${subsection_id}_field`, label, value, source_artifact: "target_profile", source_path: "target_profile.target_identity.brand_name", technical_refs: { evidence_id: "E-002" }, qualified_review_note: "Verify before reliance.", limitation: "" }] };
}
function sectionTitle(sectionId) { return sectionId.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
