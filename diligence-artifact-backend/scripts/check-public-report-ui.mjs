import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildRendererPayload } from "../src/report-renderer.js";

const reportHtml = readFileSync("public/interface-diligence/diligence-system/report.html", "utf8");
const reportJs = readFileSync("public/interface-diligence/diligence-system/report.js", "utf8");
const technicalAnnexureHtml = readFileSync("public/interface-diligence/diligence-system/technical-annexure.html", "utf8");
const technicalAnnexureJs = readFileSync("public/interface-diligence/diligence-system/technical-annexure.js", "utf8");
const reportRenderer = readFileSync("src/report-renderer.js", "utf8");
const serverJs = readFileSync("server.js", "utf8");
const publicRoutesJs = readFileSync("src/public-reviewer-routes.js", "utf8");
const diligenceSystemJs = readFileSync("public/interface-diligence/diligence-system/diligence-system.js", "utf8");
const publicRunConsoleJs = readFileSync("public/interface-diligence/diligence-system/public-run-console.js", "utf8");
const qualifiedReviewHtml = readFileSync("public/interface-diligence/diligence-system/qualified-review.html", "utf8");
const qualifiedReviewCss = readFileSync("public/interface-diligence/diligence-system/qualified-review.css", "utf8");
const qualifiedReviewJs = readFileSync("public/interface-diligence/diligence-system/qualified-review-system/qualified-review.js", "utf8");

assert.ok(reportHtml.includes("Download PDF"));
assert.ok(reportHtml.includes("Open Public Technical Annexure"));
assert.ok(reportHtml.includes("Proceed to Qualified Review"));
assert.equal(reportHtml.includes("Proceed to " + "Vault"), false);
assert.ok(reportHtml.includes('http-equiv="Cache-Control"'));
assert.ok(reportHtml.includes("no-store, no-cache"));
assert.ok(reportHtml.includes("report.js?v=locked-report-20260701"));
assert.ok(reportHtml.includes("diligence-system.css?v=locked-report-20260701"));
assert.ok(reportJs.includes("qualified-review.html?run_id="));
assert.ok(reportJs.includes("technical-annexure.html?run_id="));
assert.equal(reportJs.includes("#public-technical-annexure"), false);
assert.equal(reportJs.includes("reportSections.push(renderTechnicalAnnexure"), false);
assert.equal(reportJs.includes("/public/diligence-system/technical-annexure/"), false);
assert.equal(reportJs.includes("vault" + "/intake"), false);
assert.ok(reportJs.includes("renderReportUnavailable"));
assert.ok(reportJs.includes("/public/diligence-system/jobs/"));
assert.ok(reportJs.includes("Renderer payload is missing"));
assert.ok(reportJs.includes("Current phase"));
assert.ok(reportJs.includes("Runner last error"));
assert.ok(technicalAnnexureHtml.includes("Public Technical Annexure"));
assert.ok(technicalAnnexureHtml.includes("technical-annexure.js?v=locked-report-20260701"));
assert.ok(technicalAnnexureHtml.includes("Back to Report"));
assert.ok(technicalAnnexureHtml.includes("Open Manifest JSON"));
assert.ok(technicalAnnexureJs.includes("/public/diligence-system/technical-annexure/"));
assert.ok(technicalAnnexureJs.includes("layer_2_public_technical_annexure"));
assert.ok(technicalAnnexureJs.includes("report_body_inlines_full_payloads"));
assert.ok(technicalAnnexureJs.includes("included_in_public_annexure_manifest"));
assert.ok(technicalAnnexureJs.includes("Private reviewer submission"));
assert.ok(serverJs.includes("etag: false"));
assert.ok(serverJs.includes("lastModified: false"));
assert.ok(serverJs.includes("Cache-Control"));
assert.ok(serverJs.includes("no-store, no-cache, must-revalidate"));
assert.ok(publicRoutesJs.includes("/diligence-system/technical-annexure/:run_id"));
assert.ok(publicRoutesJs.includes("publicTechnicalAnnexureResponse"));
assert.ok(publicRoutesJs.includes("report_body_inlines_full_payloads: false"));
assert.ok(publicRoutesJs.includes("qualified_review_submission"));
assert.ok(diligenceSystemJs.includes("NORMALIZED_COMPILER"));
assert.equal(diligenceSystemJs.includes('id: "QUALIFIED_REVIEW"'), false);
assert.ok(publicRunConsoleJs.includes("postReportPairs"));

assert.ok(reportJs.includes("LOCKED_RENDERER_SOURCE"));
assert.ok(reportJs.includes("EXPECTED_SECTION_IDS"));
assert.ok(reportJs.includes("assertLockedPayload"));
assert.ok(reportJs.includes("payload.sections.map(renderSection)"));
assert.ok(reportJs.includes("renderReportValue"));
assert.ok(reportJs.includes("renderKeyValueTable"));
assert.ok(reportJs.includes("FORBIDDEN_VISIBLE_KEYS"));
assert.equal(reportJs.includes("renderLimitations"), false);
assert.equal(reportJs.includes("function normalizeSections"), false);
assert.equal(reportJs.includes("payload.section_list"), false);
assert.equal(reportJs.includes('"Renderer Payload"'), false);
assert.equal(reportJs.includes("function renderValue"), false);
assert.equal(reportJs.includes("function renderObject"), false);
assert.equal(reportJs.includes("payload.sections || {}"), false);
assert.equal(reportJs.includes("section.data"), false);
assert.equal(reportJs.includes("renderTable(els.meta"), false);
assert.equal(reportJs.includes("formatPrimitive"), false);

assert.equal(reportRenderer.includes("report-section-adapter"), false);
assert.equal(reportRenderer.includes("buildRendererPayloadFromHandoff"), false);
assert.ok(reportRenderer.includes("NORMALIZED_RENDERER_INPUT_MISSING"));
assert.ok(reportRenderer.includes("TEN_SECTION_PLAN"));
assert.ok(reportRenderer.includes("unwrapNormalizedSection"));
assert.ok(reportRenderer.includes("sanitizeSectionsForPublicReport"));
assert.ok(reportRenderer.includes("PUBLIC_RENDERER_SECTION_LIMITATIONS_FORBIDDEN"));
assert.ok(reportRenderer.includes("three_layer_ten_section_deterministic_report"));
assert.ok(reportRenderer.includes("projectPublicSection"));
assert.ok(reportRenderer.includes("projectPublicSubsection"));
assert.ok(reportRenderer.includes("projectPublicField"));
assert.ok(reportRenderer.includes("normalized_section_artifacts_only"));
assert.ok(reportRenderer.includes("PUBLIC_REFERENCE_KEYS"));
assert.ok(reportRenderer.includes("evidence_reference_summary"));
assert.equal(reportRenderer.includes("raw_final_output_handoff: handoff"), false);
assert.equal(reportRenderer.includes("section_list:"), false);
assert.ok(reportRenderer.includes("registry_authority"));

const sample = buildRendererPayload({
  run: { run_id: "TEST-PUBLIC-RENDERER", target: "Example", root_url: "https://example.com" },
  final_output_handoff: {
    normalized_report_manifest: { run_id: "TEST-PUBLIC-RENDERER", target: "Example", target_url: "https://example.com", validation_status: "LOCKED", section_order: ["matter_overview"] },
    normalized_section__matter_overview: { artifact: sampleSection("matter_overview", "Matter Overview") }
  }
}).renderer_payload;

const serialized = JSON.stringify(sample);
assert.equal(sample.renderer_source, "normalized_section_artifacts_only");
assert.ok(Array.isArray(sample.sections));
assert.equal(serialized.includes("artifact_name"), false);
assert.equal(serialized.includes("source_artifact"), false);
assert.equal(serialized.includes("source_path"), false);
assert.equal(serialized.includes("technical_refs"), false);
assert.equal(serialized.includes("normalization"), false);
assert.equal(serialized.includes("vault_mapping"), false);
assert.equal(serialized.includes("raw_final_output_handoff"), false);
assert.equal(serialized.includes("section_list"), false);
assert.equal(serialized.includes("registry_authority"), false);
assert.equal(serialized.includes("FORBIDDEN SECTION LIMITATION"), false);
assert.ok(serialized.includes("evidence_reference_summary"));
assert.equal(sample.sections[0].subsections[0].fields[0].label, "Target");
assert.equal(sample.sections[0].subsections[0].fields[0].value.public_name, "Example");
assert.equal(sample.sections[0].subsections[0].fields[0].value.evidence_reference_summary.evidence_id, "E-001");
assert.deepEqual(sample.sections[0].section_limitations || [], []);

const fullOrder = ["matter_overview", "executive_summary", "target_profile", "product_activity_ip_profile", "data_provenance_controls", "legal_document_control_review", "exposure_summary_harm_mechanism_workpad_summary", "exposure_diagnosis_table", "exposure_control_discipline", "review_route_action_plan", "control_handoff_readiness", "exposure_clarification_queue", "global_confirmation_queue", "methodology_limitations_forensic_annexure"];
const fullInput = { normalized_report_manifest: { run_id: "TEST-FULL-RENDERER", target: "Example", target_url: "https://example.com", validation_status: "LOCKED_WITH_LIMITATIONS", section_order: fullOrder } };
for (const sectionId of fullOrder) fullInput[`normalized_section__${sectionId}`] = { artifact: sampleSection(sectionId, sectionTitle(sectionId)) };
fullInput.normalized_section__exposure_summary_harm_mechanism_workpad_summary.artifact.subsections = [
  subsection("exposure_summary", "Exposure Summary", "Exposure summary", { registry_workpad_rows: 98, triggered_rows: 15 }),
  subsection("harm_mechanism_summary", "Harm Mechanism Summary", "Harm mechanism summary", [{ Subcat: "PRV", Harm_Mechanism: "Public signal", Triggered_Rows: 1 }]),
  subsection("workpad_only_summary", "Workpad-Only / Not Applicable Summary", "Workpad-only summary", [{ Subcat: "PRV", Workpad_Only_Rows: 2 }]),
  subsection("exposure_identity_index", "Exposure Identity Index", "Exposure identity index", [{ Exposure_ID: "EXP-001", Threat_ID: "T-001", Threat_Name: "Example", Subcat: "PRV" }])
];
fullInput.normalized_section__exposure_diagnosis_table.artifact.subsections = [subsection("exposure_diagnosis_table", "Exposure Diagnosis Table", "Exposure diagnosis table", Array.from({ length: 30 }, (_, index) => ({ Exposure_ID: `EXP-${index + 1}`, Threat_ID: `T-${index + 1}`, Threat_Name: "Example threat", Subcat: "PRV", row_type: "FORBIDDEN" })) )];
fullInput.normalized_section__exposure_control_discipline.artifact.subsections = [subsection("control_discipline", "Control / Exclusion / False-Positive Discipline", "Control discipline table", [{ Exposure_ID: "EXP-001", Threat_ID: "T-001", Threat_Name: "Example", Subcat: "PRV", Status: "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION" }])];
const fullPayload = buildRendererPayload({ run: { run_id: "TEST-FULL-RENDERER", target: "Example", root_url: "https://example.com" }, final_output_handoff: fullInput }).renderer_payload;
assert.equal(fullPayload.renderer_design, "three_layer_ten_section_deterministic_report");
assert.equal(fullPayload.sections.length, 10);
assert.deepEqual(fullPayload.sections.map((section) => section.section_id), ["matter_overview", "executive_summary", "target_profile", "product_activity_ip_profile", "data_provenance_controls", "legal_document_control_review", "exposure_findings", "review_route_handoff_plan", "clarification_missing_source_queue", "methodology_limitations_public_annexure"]);
for (const section of fullPayload.sections) assert.deepEqual(section.section_limitations || [], []);
assert.equal(JSON.stringify(fullPayload.sections).includes("FORBIDDEN SECTION LIMITATION"), false);
assert.equal(JSON.stringify(fullPayload.sections).includes("row_type"), false);
assert.equal(JSON.stringify(fullPayload.sections).includes("technical_annexure_only"), false);
assert.equal(JSON.stringify(fullPayload.sections).includes("display_in_main_report"), false);
assert.equal(JSON.stringify(fullPayload.sections).includes("subsection_title\\\":\\\"Nested"), false);
const section7 = fullPayload.sections.find((section) => section.section_id === "exposure_findings");
assert.ok(section7.subsections.some((subsection) => subsection.subsection_title === "Exposure Summary"));
assert.ok(section7.subsections.some((subsection) => subsection.subsection_title === "Harm Mechanism Summary"));
assert.ok(section7.subsections.some((subsection) => subsection.subsection_title === "Workpad-Only / Not Applicable Summary"));
assert.ok(section7.subsections.some((subsection) => subsection.subsection_title === "Exposure Diagnosis Table"));
assert.ok(section7.subsections.some((subsection) => subsection.subsection_title === "Control / Exclusion / False-Positive Discipline"));
assert.equal(JSON.stringify(section7.subsections.map((subsection) => subsection.fields.map((field) => field.value))).includes("subsection_title"), false);
assert.equal(fullPayload.report_layers.length, 3);
assert.ok(fullPayload.report_layers.some((layer) => layer.layer_id === "layer_2_public_technical_annexure"));
assert.ok(fullPayload.report_layers.some((layer) => layer.layer_id === "layer_3_qualified_review"));
assert.ok(fullPayload.public_report_ui.primary_actions.some((action) => action.id === "open_public_technical_annexure"));
assert.equal(fullPayload.public_report_ui.raw_json_download_enabled, false);
assert.equal(fullPayload.public_technical_annexure.report_body_inlines_full_payloads, false);
assert.equal(fullPayload.sections.some((section) => section.section_id === "public_technical_annexure"), false);
assert.ok(JSON.stringify(fullPayload).includes("suppressed_row_count"));

assert.ok(qualifiedReviewHtml.includes('id="qualifiedReviewRail"'));
assert.ok(qualifiedReviewHtml.includes('id="qualifiedReviewTabs"'));
assert.ok(qualifiedReviewHtml.includes('id="qrWorkflowPanel"'));
assert.ok(qualifiedReviewHtml.includes('id="qrNavigationPanel"'));
assert.ok(qualifiedReviewHtml.includes("qualified-review.css"));
assert.ok(qualifiedReviewHtml.includes("Review Workspace"));
assert.ok(qualifiedReviewHtml.includes("qr-action-row"));
assert.ok(qualifiedReviewHtml.includes("hairline"));
assert.equal(qualifiedReviewHtml.includes("qualified-review-backend-sync.js"), false);

assert.ok(qualifiedReviewCss.includes("qr-app-layout"));
assert.ok(qualifiedReviewCss.includes("qr-section-tab"));
assert.ok(qualifiedReviewCss.includes("qr-progress-fill"));
assert.ok(qualifiedReviewCss.includes("qr-rail-list::before"));
assert.ok(qualifiedReviewCss.includes("grid-template-columns: 250px"));
assert.ok(qualifiedReviewCss.includes("min-height: 38px"));
assert.ok(qualifiedReviewCss.includes("qr-instruction"));
assert.ok(qualifiedReviewCss.includes("qr-na-toggle"));
assert.ok(qualifiedReviewCss.includes("qr-na-reason"));
assert.ok(qualifiedReviewCss.includes("data-qr-na"));
assert.ok(qualifiedReviewCss.includes("qr-row-status"));

assert.ok(qualifiedReviewJs.includes("renderQuestionCard"));
assert.ok(qualifiedReviewJs.includes("renderDocumentImpact"));
assert.ok(qualifiedReviewJs.includes("qr-question-card"));
assert.ok(qualifiedReviewJs.includes('title.textContent = "Qualified Review"'));
assert.ok(qualifiedReviewJs.includes("Review the prefilled answers, correct what the diligence system could not verify, and lock the inputs before draft preparation."));
assert.ok(qualifiedReviewJs.includes("Suggestion — demo assumption. Edit if inaccurate."));
assert.ok(qualifiedReviewJs.includes("Suggestion — prefilled from the diligence review. Edit only if inaccurate."));
assert.ok(qualifiedReviewJs.includes("qr-instruction"));
assert.equal(qualifiedReviewJs.includes("Confirm as shown"), false);
assert.equal(qualifiedReviewJs.includes("Save edited"), false);
assert.equal(qualifiedReviewJs.includes("Mark not applicable"), false);
assert.equal(qualifiedReviewJs.includes('dataset.qrState = "confirmed"'), false);
assert.equal(qualifiedReviewJs.includes("Review and confirm the working answers"), false);
assert.equal(qualifiedReviewJs.includes("JSON.stringify(value)"), false);
assert.equal(qualifiedReviewJs.includes("renderBridgeSummary"), false);
assert.equal(qualifiedReviewJs.includes("renderFinalGate"), false);
assert.equal(qualifiedReviewJs.includes("Matrix-driven QR bridge"), false);
assert.equal(qualifiedReviewJs.includes("block.dataset.confirmed"), false);
assert.equal(qualifiedReviewJs.includes("Download JSON"), false);

console.log("public report UI: PASS");

function sampleSection(section_id, section_title) {
  return { section_id, artifact_name: `normalized_section__${section_id}`, section_title, section_order: 1, section_status: "LOCKED", reviewer_summary: "Summary", section_limitations: ["FORBIDDEN SECTION LIMITATION"], source_artifacts_used: ["target_profile"], normalization: { internal: true }, vault_mapping: { internal: true }, subsections: [subsection(`${section_id}_subsection`, "Sample", "Target", { public_name: "Example", source_path: "target_profile.target_identity.brand_name", technical_refs: { evidence_id: "E-001" }, row_type: "FORBIDDEN", technical_annexure_only: false })] };
}
function subsection(subsection_id, subsection_title, label, value) {
  return { subsection_id, subsection_title, fields: [{ field_id: `${subsection_id}_field`, label, value, source_artifact: "target_profile", source_path: "target_profile.target_identity.brand_name", technical_refs: { evidence_id: "E-002" }, qualified_review_note: "Verify before reliance.", limitation: "" }] };
}
function sectionTitle(sectionId) { return sectionId.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
