import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const app = read("src/runtime/app.js");
const routes = read("src/runtime/routes/public.routes.js");
const legacyRoutes = read("src/public-reviewer-routes.js");
const ui = read("public/interface-diligence/diligence-system/diligence-system.js");
const reportUi = read("public/interface-diligence/diligence-system/report.js");

assert.ok(app.includes('app.use("/public", publicRouter)'), "central app must mount publicRouter");
assert.equal(app.includes("public-reviewer-routes"), false, "central app must not mount legacy public reviewer routes");

for (const route of [
  '/diligence-system/jobs"',
  '/diligence-system/jobs/:run_id"',
  '/diligence-system/jobs/:run_id/advance"',
  '/diligence-system/report/:run_id"',
  '/diligence-system/technical-annexure/:run_id"',
  '/diligence-system/qualified-review/:run_id"'
]) assert.ok(routes.includes(route), `central public router missing route ${route}`);

for (const forbidden of [
  "reviewer-async-runner.js",
  "reviewer-runner-normalized.js",
  "public-reviewer-routes.js",
  'from "../../firestore.js"',
  'from "../../drive.js"',
  'from "../../sheets.js"'
]) assert.equal(routes.includes(forbidden), false, `central public router imports retired dependency: ${forbidden}`);

assert.ok(routes.includes("requestPipelineAdvance"));
assert.ok(routes.includes("createDiligenceRun"));
assert.ok(routes.includes("DOCUMENT_UPLOAD_17_ROOT_CUTOVER_REQUIRED"));
assert.ok(routes.includes("retired lossless-family uploader is not permitted"));
assert.ok(ui.includes('/public/diligence-system/jobs'));
assert.ok(reportUi.includes('/public/diligence-system/'));
assert.ok(legacyRoutes.includes("requestReviewerRunAdvance"), "legacy route fixture changed unexpectedly before archive pass");

console.log(JSON.stringify({
  check: "public API central runtime",
  status: "PASS",
  enforced_gates: [
    "CENTRAL_PUBLIC_ROUTER_MOUNTED",
    "URL_RUN_CREATE_POLL_ADVANCE_MIGRATED",
    "REPORT_ANNEXURE_QR_READ_MIGRATED",
    "NO_LEGACY_REVIEWER_RUNTIME_IMPORTS",
    "LEGACY_DOCUMENT_UPLOAD_FENCED_PENDING_17_ROOT_REBUILD"
  ]
}, null, 2));
