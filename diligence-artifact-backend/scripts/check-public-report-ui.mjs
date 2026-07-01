import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildRendererPayload } from "../src/report-renderer.js";

const reportHtml = readFileSync("public/interface-diligence/diligence-system/report.html", "utf8");
const reportJs = readFileSync("public/interface-diligence/diligence-system/report.js", "utf8");
const reportRenderer = readFileSync("src/report-renderer.js", "utf8");
const serverJs = readFileSync("server.js", "utf8");
const diligenceSystemJs = readFileSync("public/interface-diligence/diligence-system/diligence-system.js", "utf8");
const publicRunConsoleJs = readFileSync("public/interface-diligence/diligence-system/public-run-console.js", "utf8");
const qualifiedReviewHtml = readFileSync("public/interface-diligence/diligence-system/qualified-review.html", "utf8");
const qualifiedReviewCss = readFileSync("public/interface-diligence/diligence-system/qualified-review.css", "utf8");
const qualifiedReviewJs = readFileSync("public/interface-diligence/diligence-system/qualified-review-system/qualified-review.js", "utf8");

assert.ok(reportHtml.includes("Download PDF"));
assert.ok(reportHtml.includes("Proceed to Qualified Review"));
assert.equal(reportHtml.includes("Proceed to " + "Vault"), false);
assert.ok(reportHtml.includes('http-equiv="Cache-Control"'));
assert.ok(reportHtml.includes("no-store, no-cache"));
assert.ok(reportHtml.includes("report.js?v=locked-report-20260701"));
assert.ok(reportHtml.includes("diligence-system.css?v=locked-report-20260701"));
assert.ok(reportJs.includes("qualified-review.html?run_id="));
assert.equal(reportJs.includes("vault" + "/intake"), false);
assert.ok(serverJs.includes("etag: false"));
assert.ok(serverJs.includes("lastModified: false"));
assert.ok(serverJs.includes("Cache-Control"));
assert.ok(serverJs.includes("no-store, no-cache, must-revalidate"));
assert.ok(diligenceSystemJs.includes("NORMALIZED_COMPILER"));
assert.equal(diligenceSystemJs.includes('id: "QUALIFIED_REVIEW"'), false);
assert.ok(publicRunConsoleJs.includes("postReportPairs"));

assert.ok(reportJs.includes("LOCKED_RENDERER_SOURCE"));
assert.ok(reportJs.includes("assertLockedPayload"));
assert.ok(reportJs.includes("payload.sections.map(renderSection)"));
assert.ok(reportJs.includes("renderAllowedValue"));
assert.ok(reportJs.includes("renderAllowedObject"));
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
      subsections: [{ subsection_id: "matter_identity", subsection_title: "Matter Identity", fields: [{ field_id: "target", label: "Target", value: { public_name: "Example", source_path: "target_profile.target_identity.brand_name", technical_refs: { evidence_id: "E-001" } }, source_artifact: "target_profile", source_path: "target_profile.target_identity.brand_name", technical_refs: { evidence_id: "E-002" }, qualified_review_note: "Verify before reliance.", limitation: "" }] }]
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
assert.ok(serialized.includes("evidence_reference_summary"));
assert.equal(sample.sections[0].subsections[0].fields[0].label, "Target");
assert.equal(sample.sections[0].subsections[0].fields[0].value.public_name, "Example");
assert.equal(sample.sections[0].subsections[0].fields[0].value.evidence_reference_summary.evidence_id, "E-001");

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
