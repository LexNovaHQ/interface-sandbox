import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const reportHtml = readFileSync("public/interface-diligence/diligence-system/report.html", "utf8");
const reportJs = readFileSync("public/interface-diligence/diligence-system/report.js", "utf8");
const diligenceSystemJs = readFileSync("public/interface-diligence/diligence-system/diligence-system.js", "utf8");
const publicRunConsoleJs = readFileSync("public/interface-diligence/diligence-system/public-run-console.js", "utf8");
const qualifiedReviewHtml = readFileSync("public/interface-diligence/diligence-system/qualified-review.html", "utf8");
const qualifiedReviewJs = readFileSync("public/interface-diligence/diligence-system/qualified-review-system/qualified-review.js", "utf8");
const qualifiedReviewWorkflowJs = readFileSync("public/interface-diligence/diligence-system/qualified-review-system/qualified-review-workflow.js", "utf8");

assert.ok(reportHtml.includes("Download PDF"));
assert.ok(reportHtml.includes("Proceed to Qualified Review"));
assert.equal(reportHtml.includes("Proceed to " + "Vault"), false);
assert.equal(reportHtml.includes("Technical " + "payload"), false);
assert.equal(reportHtml.includes("technical" + "Payload"), false);
assert.ok(reportJs.includes("qualified-review.html?run_id="));
assert.equal(reportJs.includes("vault" + "/intake"), false);

assert.ok(diligenceSystemJs.includes("NORMALIZED_COMPILER"));
assert.equal(diligenceSystemJs.includes('phases: ["COMPILER"]'), false);
assert.equal(diligenceSystemJs.includes('id: "QUALIFIED_REVIEW"'), false);
assert.ok(diligenceSystemJs.includes("Diligence Engine rail"));

assert.ok(publicRunConsoleJs.includes("postReportPairs"));
assert.ok(publicRunConsoleJs.includes("Open the report first; Qualified Review is available from the completed report."));

assert.ok(qualifiedReviewHtml.includes("Qualified Review"));
assert.ok(qualifiedReviewHtml.includes('id="qualifiedReviewRail"'));
assert.ok(qualifiedReviewHtml.includes("Separate System"));
assert.ok(qualifiedReviewHtml.includes("qualified-review-system/qualified-review.js"));
assert.ok(qualifiedReviewHtml.includes("qualified-review-system/qualified-review-workflow.js"));
assert.equal(qualifiedReviewHtml.includes("qualified-review-backend-sync.js"), false);
assert.ok(qualifiedReviewJs.includes("renderQualifiedReviewRail"));
assert.ok(qualifiedReviewJs.includes("Qualified Review rail"));
assert.equal(qualifiedReviewJs.includes("Download JSON"), true);

assert.ok(qualifiedReviewWorkflowJs.includes("Submit final gate"));
assert.ok(qualifiedReviewWorkflowJs.includes("Save progress"));
assert.ok(qualifiedReviewWorkflowJs.includes("ready_for_assembly"));
assert.ok(qualifiedReviewWorkflowJs.includes("/responses"));
assert.ok(qualifiedReviewWorkflowJs.includes("blocking_errors"));
assert.ok(qualifiedReviewWorkflowJs.includes("sectionDone"));
assert.ok(qualifiedReviewWorkflowJs.includes("responses.size !== questions.size"));

console.log("public report UI: PASS");
