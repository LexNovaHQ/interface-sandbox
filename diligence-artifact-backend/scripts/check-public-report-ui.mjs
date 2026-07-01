import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const reportHtml = readFileSync("public/interface-diligence/diligence-system/report.html", "utf8");
const reportJs = readFileSync("public/interface-diligence/diligence-system/report.js", "utf8");
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

assert.ok(qualifiedReviewHtml.includes('id="qualifiedReviewRail"'));
assert.ok(qualifiedReviewHtml.includes('id="qualifiedReviewTabs"'));
assert.ok(qualifiedReviewHtml.includes('id="qrWorkflowPanel"'));
assert.ok(qualifiedReviewHtml.includes('id="qrNavigationPanel"'));
assert.ok(qualifiedReviewHtml.includes("qualified-review.css"));
assert.ok(qualifiedReviewHtml.includes("qr-action-row"));
assert.ok(qualifiedReviewHtml.includes("hairline"));
assert.equal(qualifiedReviewHtml.includes("qualified-review-backend-sync.js"), false);

assert.ok(qualifiedReviewCss.includes("qr-app-layout"));
assert.ok(qualifiedReviewCss.includes("qr-section-tab"));
assert.ok(qualifiedReviewCss.includes("qr-progress-fill"));
assert.ok(qualifiedReviewCss.includes("qr-rail-list::before"));
assert.ok(qualifiedReviewCss.includes("grid-template-columns: 230px"));
assert.ok(qualifiedReviewCss.includes("min-height: 40px"));
assert.ok(qualifiedReviewCss.includes("qr-card-actions .btn"));

assert.ok(qualifiedReviewJs.includes("renderQuestionCard"));
assert.ok(qualifiedReviewJs.includes("renderDocumentImpact"));
assert.ok(qualifiedReviewJs.includes("Confirm as shown"));
assert.ok(qualifiedReviewJs.includes("qr-question-card"));
assert.ok(qualifiedReviewJs.includes("Review the prefilled answers"));
assert.ok(qualifiedReviewJs.includes("Demo assumption — edit if inaccurate."));
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
assert.equal(qualifiedReviewWorkflowJs.includes("scrollIntoView"), false);
assert.equal(qualifiedReviewWorkflowJs.includes("data-qr-demo"), false);
assert.equal(qualifiedReviewWorkflowJs.includes("I understand this is a demo assumption"), false);
assert.equal(qualifiedReviewWorkflowJs.includes('const save = plain("Save progress"'), false);
assert.equal(qualifiedReviewWorkflowJs.includes('() => save("save_progress")'), false);
assert.equal(qualifiedReviewWorkflowJs.includes('() => save("submit_final_gate")'), false);
assert.equal(qualifiedReviewWorkflowJs.includes("Final gate PASS"), false);
assert.equal(qualifiedReviewWorkflowJs.includes("server_final_gate"), false);

console.log("public report UI: PASS");
