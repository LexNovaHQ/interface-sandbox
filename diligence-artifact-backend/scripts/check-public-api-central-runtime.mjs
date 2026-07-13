import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const app = readFileSync("src/runtime/app.js", "utf8");
const routes = readFileSync("src/runtime/routes/public.routes.js", "utf8");
const submissionService = readFileSync("src/runtime/services/qualified-review-submission.service.js", "utf8");
const ui = readFileSync("public/interface-diligence/diligence-system/diligence-system.js", "utf8");
const reportUi = readFileSync("public/interface-diligence/diligence-system/report.js", "utf8");

assert.ok(app.includes('app.use("/public", publicRouter)'), "central app must mount publicRouter");
assert.equal(app.includes("public-reviewer-routes"), false, "central app must not mount legacy public reviewer routes");
for (const route of ['/diligence-system/jobs"', '/diligence-system/jobs/:run_id"', '/diligence-system/jobs/:run_id/advance"', '/diligence-system/report/:run_id"', '/diligence-system/technical-annexure/:run_id"', '/diligence-system/qualified-review/:run_id"', '/diligence-system/qualified-review/:run_id/responses"']) assert.ok(routes.includes(route), `central public router missing route ${route}`);
for (const forbidden of ["reviewer-async-runner.js", "reviewer-runner-normalized.js", "public-reviewer-routes.js", 'from "../..' + '/firestore.js"', 'from "../..' + '/drive.js"', 'from "../..' + '/sheets.js"']) assert.equal(routes.includes(forbidden), false, `central public router imports retired dependency: ${forbidden}`);

assert.ok(routes.includes("requestPipelineAdvance"));
assert.ok(routes.includes("createDiligenceRun"));
assert.ok(routes.includes("saveQualifiedReviewSubmission"));
assert.ok(routes.includes("DOCUMENT_UPLOAD_17_ROOT_CUTOVER_REQUIRED"));
assert.ok(routes.includes("retired lossless-family uploader is not permitted"));
assert.ok(submissionService.includes('QUALIFIED_REVIEW_SUBMISSION_ARTIFACT = "qualified_review_submission"'));
assert.ok(submissionService.includes("./storage/drive.service.js"));
assert.ok(submissionService.includes("./storage/firestore.service.js"));
assert.ok(ui.includes("/public/diligence-system/jobs"));
assert.ok(reportUi.includes("/public/diligence-system/"));

for (const retired of ["src/public-reviewer-routes.js", "src/reviewer-routes.js", "src/reviewer-runner.js", "src/reviewer-runner-normalized.js", "src/reviewer-async-runner.js", "src/qualified-review-system/submission.js"]) assert.equal(existsSync(retired), false, `obsolete public/reviewer file still exists: ${retired}`);

console.log(JSON.stringify({ check: "public API central runtime", status: "PASS", enforced_gates: ["CENTRAL_PUBLIC_ROUTER_MOUNTED", "URL_RUN_CREATE_POLL_ADVANCE_MIGRATED", "REPORT_ANNEXURE_QR_READ_MIGRATED", "QR_SUBMISSION_MIGRATED", "OBSOLETE_REVIEWER_ROUTES_AND_RUNNERS_DELETED", "LEGACY_DOCUMENT_UPLOAD_FENCED_PENDING_17_ROOT_REBUILD"] }, null, 2));
