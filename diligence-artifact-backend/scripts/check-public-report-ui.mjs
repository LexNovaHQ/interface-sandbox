import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { buildRendererPayload } from "../src/report-renderer.js";

const reportHtml = readFileSync("public/interface-diligence/diligence-system/report.html", "utf8");
const reportJs = readFileSync("public/interface-diligence/diligence-system/report.js", "utf8");
const reportTableCss = readFileSync("public/interface-diligence/diligence-system/report-table-overrides.css", "utf8");
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
assert.ok(reportHtml.includes("no-store, no-cache"));
assert.ok(reportHtml.includes('class="report-page"'));
assert.ok(reportHtml.includes('id="reportRail"'));
assert.ok(reportHtml.includes('id="reportControlPanel"'));
assert.ok(reportHtml.includes('id="reportDeckStatus"'));
assert.ok(reportHtml.includes("report-table-overrides.css?v=report-deck-workspace-20260703"));
assert.ok(reportHtml.includes("report.js?v=report-deck-workspace-20260703"));
assert.ok(reportJs.includes("qualified-review.html?run_id="));
assert.ok(reportJs.includes("technical-annexure.html?run_id="));
assert.ok(reportJs.includes("renderReportUnavailable"));
assert.ok(reportJs.includes("/public/diligence-system/jobs/"));
assert.ok(reportJs.includes("Renderer payload is missing"));
assert.ok(reportJs.includes("Current phase"));
assert.ok(reportJs.includes("Runner last error"));
assert.ok(reportJs.includes("wrapTable"));
assert.ok(reportJs.includes("Full public table"));
assert.ok(reportJs.includes("DECK_PAGE_SIZE = 5"));
assert.ok(reportJs.includes("SECTION_DECK_PROFILES"));
assert.ok(reportJs.includes("renderPagedCardDeck"));
assert.ok(reportJs.includes("renderFindingCard"));
assert.ok(reportJs.includes("renderReportRail"));
assert.ok(reportJs.includes("beforeprint"));
assert.ok(reportJs.includes("afterprint"));
assert.ok(reportJs.includes("Show all"));
assert.ok(reportJs.includes("Collapse"));
assert.ok(reportTableCss.includes(".table-scroll"));
assert.ok(reportTableCss.includes("overflow-x: auto"));
assert.ok(reportTableCss.includes("writing-mode: horizontal-tb"));
assert.ok(reportTableCss.includes("word-break: normal"));
assert.ok(reportTableCss.includes("report-app-layout"));
assert.ok(reportTableCss.includes("report-left-rail"));
assert.ok(reportTableCss.includes("report-control-card"));
assert.ok(reportTableCss.includes("report-card-deck"));
assert.ok(reportTableCss.includes("report-deck-actions"));
assert.ok(reportTableCss.includes("report-finding-card"));
assert.ok(reportTableCss.includes("report-finding-layout"));
assert.ok(reportTableCss.includes("report-detail-grid"));
assert.ok(reportTableCss.includes("grid-template-columns: 260px"));
assert.ok(reportTableCss.includes("position: sticky"));
assert.ok(reportTableCss.includes("@media print"));
assert.ok(reportTableCss.includes("report-deck-actions"));
assert.ok(technicalAnnexureHtml.includes("Public Technical Annexure"));
assert.ok(technicalAnnexureJs.includes("/public/diligence-system/technical-annexure/"));
assert.ok(technicalAnnexureJs.includes("layer_2_public_technical_annexure"));
assert.ok(technicalAnnexureJs.includes("report_body_inlines_full_payloads"));
assert.ok(serverJs.includes("etag: false"));
assert.ok(serverJs.includes("lastModified: false"));
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
assert.equal(reportJs.includes("columns.length < 10"), false);
assert.equal(reportJs.includes("function normalizeSections"), false);
assert.equal(reportJs.includes("payload.section_list"), false);
assert.equal(reportJs.includes('"Renderer Payload"'), false);
assert.equal(reportJs.includes("function renderValue"), false);
assert.equal(reportJs.includes("function renderObject"), false);
assert.equal(reportJs.includes("payload.sections || {}"), false);
assert.equal(reportJs.includes("section.data"), false);

assert.equal(reportRenderer.includes("report-section-adapter"), false);
assert.equal(reportRenderer.includes("buildRendererPayloadFromHandoff"), false);
assert.ok(reportRenderer.includes("NORMALIZED_RENDERER_INPUT_MISSING"));
assert.ok(reportRenderer.includes("TEN_SECTION_PLAN"));
assert.ok(reportRenderer.includes("sanitizeSectionsForPublicReport"));
assert.ok(reportRenderer.includes("three_layer_ten_section_deterministic_report"));
assert.ok(reportRenderer.includes("normalized_section_artifacts_only"));
assert.ok(reportRenderer.includes("public_tables_render_full_rows"));
assert.equal(reportRenderer.includes("MAX_INLINE_ROWS"), false);
assert.equal(reportRenderer.includes("raw_final_output_handoff: handoff"), false);
assert.equal(reportRenderer.includes("section_list:"), false);

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
assert.equal(serialized.includes("FORBIDDEN SECTION LIMITATION"), false);

const fullOrder = ["matter_overview", "executive_summary", "target_profile", "product_activity_ip_profile", "data_provenance_controls", "legal_document_control_review", "exposure_summary_harm_mechanism_workpad_summary", "exposure_diagnosis_table", "exposure_control_discipline", "review_route_action_plan", "control_handoff_readiness", "exposure_clarification_queue", "global_confirmation_queue", "methodology_limitations_forensic_annexure"];
const fullInput = { normalized_report_manifest: { run_id: "TEST-FULL-RENDERER", target: "Example", target_url: "https://example.com", validation_status: "LOCKED_WITH_LIMITATIONS", section_order: fullOrder } };
for (const sectionId of fullOrder) fullInput[`normalized_section__${sectionId}`] = { artifact: sampleSection(sectionId, sectionTitle(sectionId)) };
fullInput.normalized_section__exposure_diagnosis_table.artifact.subsections = [subsection("exposure_diagnosis_table", "Exposure Diagnosis Table", "Exposure diagnosis table", Array.from({ length: 30 }, (_, index) => ({ Exposure_ID: `EXP-${index + 1}`, Threat_ID: `T-${index + 1}`, Threat_Name: "Example threat", Subcat: "PRV", row_type: "FORBIDDEN" })))];
const fullPayload = buildRendererPayload({ run: { run_id: "TEST-FULL-RENDERER", target: "Example", root_url: "https://example.com" }, final_output_handoff: fullInput }).renderer_payload;
assert.equal(fullPayload.renderer_design, "three_layer_ten_section_deterministic_report");
assert.equal(fullPayload.sections.length, 10);
assert.equal(JSON.stringify(fullPayload.sections).includes("row_type"), false);
assert.equal(fullPayload.report_layers.length, 3);
assert.equal(fullPayload.public_report_ui.raw_json_download_enabled, false);
assert.equal(fullPayload.public_report_ui.public_tables_render_full_rows, true);

assert.ok(qualifiedReviewHtml.includes('id="qualifiedReviewRail"'));
assert.equal(qualifiedReviewHtml.includes('id="qualifiedReviewTabs"'), false);
assert.ok(qualifiedReviewHtml.includes('id="qrWorkflowPanel"'));
assert.ok(qualifiedReviewHtml.includes('id="qrNavigationPanel"'));
assert.ok(qualifiedReviewHtml.includes('id="qrFinalGatePanel"'));
assert.ok(qualifiedReviewHtml.includes("qualified-review.css?v=qr-single-controller-20260703"));
assert.ok(qualifiedReviewHtml.includes("qualified-review.js?v=qr-single-controller-20260703"));
assert.equal(qualifiedReviewHtml.includes("qualified-review-workflow.js"), false);
assert.equal(existsSync("public/interface-diligence/diligence-system/qualified-review-system/qualified-review-workflow.js"), false);
assert.ok(qualifiedReviewCss.includes("qr-app-layout"));
assert.equal(qualifiedReviewCss.includes("qr-section-tab"), false);
assert.ok(qualifiedReviewCss.includes("qr-question-layout"));
assert.ok(qualifiedReviewCss.includes("qr-context-panel"));
assert.ok(qualifiedReviewCss.includes("qr-section-attestation"));
assert.ok(qualifiedReviewCss.includes("qr-final-gate-card"));
assert.ok(qualifiedReviewJs.includes("renderQuestionCard"));
assert.ok(qualifiedReviewJs.includes("renderSectionAttestation"));
assert.ok(qualifiedReviewJs.includes("renderFinalGate"));
assert.ok(qualifiedReviewJs.includes("Proceed to Drafting"));
assert.ok(qualifiedReviewJs.includes("assembly-engine.html?run_id="));
assert.equal(qualifiedReviewJs.includes("Confirm as shown"), false);
assert.equal(qualifiedReviewJs.includes("Save edited"), false);
assert.equal(qualifiedReviewJs.includes("Mark not applicable"), false);
assert.equal(qualifiedReviewJs.includes("Download JSON"), false);

console.log("public report UI: PASS");

function sampleSection(section_id, section_title) {
  return { section_id, artifact_name: `normalized_section__${section_id}`, section_title, section_order: 1, section_status: "LOCKED", reviewer_summary: "Summary", section_limitations: ["FORBIDDEN SECTION LIMITATION"], source_artifacts_used: ["target_profile"], normalization: { internal: true }, vault_mapping: { internal: true }, subsections: [subsection(`${section_id}_subsection`, "Sample", "Target", { public_name: "Example", source_path: "target_profile.target_identity.brand_name", technical_refs: { evidence_id: "E-001" }, row_type: "FORBIDDEN", technical_annexure_only: false })] };
}
function subsection(subsection_id, subsection_title, label, value) {
  return { subsection_id, subsection_title, fields: [{ field_id: `${subsection_id}_field`, label, value, source_artifact: "target_profile", source_path: "target_profile.target_identity.brand_name", technical_refs: { evidence_id: "E-002" }, qualified_review_note: "Verify before reliance.", limitation: "" }] };
}
function sectionTitle(sectionId) { return sectionId.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
