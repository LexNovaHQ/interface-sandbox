import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildRendererPayload } from "../src/report-renderer.js";

const reportHtml = readFileSync("public/interface-diligence/diligence-system/report.html", "utf8");
const reportJs = readFileSync("public/interface-diligence/diligence-system/report.js", "utf8");
const reportRenderer = readFileSync("src/report-renderer.js", "utf8");
const diligenceSystemJs = readFileSync("public/interface-diligence/diligence-system/diligence-system.js", "utf8");
const publicRunConsoleJs = readFileSync("public/interface-diligence/diligence-system/public-run-console.js", "utf8");
const qualifiedReviewHtml = readFileSync("public/interface-diligence/diligence-system/qualified-review.html", "utf8");
const qualifiedReviewCss = readFileSync("public/interface-diligence/diligence-system/qualified-review.css", "utf8");
const qualifiedReviewJs = readFileSync("public/interface-diligence/diligence-system/qualified-review-system/qualified-review.js", "utf8");
const qualifiedReviewWorkflowJs = readFileSync("public/interface-diligence/diligence-system/qualified-review-system/qualified-review-workflow.js", "utf8");

assert.ok(reportHtml.includes("Download PDF"));
assert.ok(reportHtml.includes("Proceed to Qualified Review"));
assert.equal(reportHtml.includes("Proceed to " + "Vault"), false);
assert.ok(reportJs.includes("qualified-review.html?run_id="));
assert.equal(reportJs.includes("vault" + "/intake"), false);
assert.ok(diligenceSystemJs.includes("NORMALIZED_COMPILER"));
assert.equal(diligenceSystemJs.includes('id: "QUALIFIED_REVIEW"'), false);
assert.ok(publicRunConsoleJs.includes("postReportPairs"));

assert.equal(reportRenderer.includes("report-section-adapter"), false);
assert.equal(reportRenderer.includes("buildRendererPayloadFromHandoff"), false);
assert.ok(reportRenderer.includes("NORMALIZED_RENDERER_INPUT_MISSING"));
assert.ok(reportRenderer.includes("projectPublicSection"));
assert.ok(reportRenderer.includes("projectPublicSubsection"));
assert.ok(reportRenderer.includes("projectPublicField"));
assert.ok(reportRenderer.includes("normalized_section_artifacts_only"));
assert.equal(reportRenderer.includes("raw_final_output_handoff: handoff"), false);
assert.equal(reportRenderer.includes("section_list:"), false);
assert.equal(reportRenderer.includes("registry_authority"), false);

const sample = buildRendererPayload({
  run: { run_id: "TEST-PUBLIC-RENDERER", target: "Example", root_url: "https://example.com" },
  final_output_handoff: {
    normalized_report_manifest: { run_id: "TEST-PUBLIC-RENDERER", target: "Example", target_url: "https://example.com", validation_status: "LOCKED", section_order: ["matter_overview"] },
    normalized_section__matter_overview: {
      section_id: "matter_overview",
      artifact_name: "normalized_section__matter_overview",
      section_title: "Matter Overview",
      section_order: 1,
      section_status: "LOCKED",
      reviewer_summary: "Summary",
      source_artifacts_used: ["target_profile"],
      normalization: { internal: true },
      vault_mapping: { internal: true },
      subsections: [{ subsection_id: "matter_identity", subsection_title: "Matter Identity", fields: [{ field_id: "target", label: "Target", value: { public_name: "Example", source_path: "target_profile.target_identity.brand_name", technical_refs: { internal: true } }, source_artifact: "target_profile", source_path: "target_profile.target_identity.brand_name", technical_refs: { internal: true }, qualified_review_note: "Verify before reliance.", limitation: "" }] }]
    }
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
assert.equal(sample.sections[0].subsections[0].fields[0].label, "Target");
assert.equal(sample.sections[0].subsections[0].fields[0].value.public_name, "Example");

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

assert.ok(qualifiedReviewWorkflowJs.includes("Submit final"));
assert.ok(qualifiedReviewWorkflowJs.includes("Save progress"));
assert.ok(qualifiedReviewWorkflowJs.includes("Review progress"));
assert.ok(qualifiedReviewWorkflowJs.includes("/responses"));
assert.ok(qualifiedReviewWorkflowJs.includes("async function persistSubmission"));
assert.ok(qualifiedReviewWorkflowJs.includes("saveButton"));
assert.ok(qualifiedReviewWorkflowJs.includes("submitButton"));
assert.ok(qualifiedReviewWorkflowJs.includes("collectCurrentResponses"));
assert.ok(qualifiedReviewWorkflowJs.includes("rowFromCard"));
assert.ok(qualifiedReviewWorkflowJs.includes("stableValue"));
assert.ok(qualifiedReviewWorkflowJs.includes("This does not apply"));
assert.ok(qualifiedReviewWorkflowJs.includes("Optional reason"));
assert.ok(qualifiedReviewWorkflowJs.includes('answer_state: "confirmed"'));
assert.ok(qualifiedReviewWorkflowJs.includes('answer_state: "edited"'));
assert.ok(qualifiedReviewWorkflowJs.includes('answer_state: "not_applicable"'));
assert.equal(qualifiedReviewWorkflowJs.includes("scrollIntoView"), false);
assert.equal(qualifiedReviewWorkflowJs.includes("data-qr-demo"), false);
assert.equal(qualifiedReviewWorkflowJs.includes("I understand this is a demo assumption"), false);
assert.equal(qualifiedReviewWorkflowJs.includes("add a reason before marking not applicable"), false);
assert.equal(qualifiedReviewWorkflowJs.includes("captureRowButtons"), false);
assert.equal(qualifiedReviewWorkflowJs.includes('btn("Save edited"'), false);
assert.equal(qualifiedReviewWorkflowJs.includes('btn("Mark not applicable"'), false);
assert.equal(qualifiedReviewWorkflowJs.includes("updateActionState"), false);
assert.equal(qualifiedReviewWorkflowJs.includes('const save = plain("Save progress"'), false);
assert.equal(qualifiedReviewWorkflowJs.includes('() => save("save_progress")'), false);
assert.equal(qualifiedReviewWorkflowJs.includes('() => save("submit_final_gate")'), false);
assert.equal(qualifiedReviewWorkflowJs.includes("Final gate PASS"), false);
assert.equal(qualifiedReviewWorkflowJs.includes("server_final_gate"), false);

console.log("public report UI: PASS");
