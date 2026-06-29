import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const reportHtml = readFileSync("public/interface-diligence/diligence-system/report.html", "utf8");
const reportJs = readFileSync("public/interface-diligence/diligence-system/report.js", "utf8");
const qualifiedReviewHtml = readFileSync("public/interface-diligence/diligence-system/qualified-review.html", "utf8");
const qualifiedReviewJs = readFileSync("public/interface-diligence/diligence-system/qualified-review.js", "utf8");

assert.ok(reportHtml.includes("Download PDF"));
assert.ok(reportHtml.includes("Proceed to Qualified Review"));
assert.equal(reportHtml.includes("Proceed to " + "Vault"), false);
assert.equal(reportHtml.includes("Technical " + "payload"), false);
assert.equal(reportHtml.includes("technical" + "Payload"), false);
assert.ok(reportJs.includes("qualified-review.html?run_id="));
assert.equal(reportJs.includes("vault" + "/intake"), false);
assert.ok(qualifiedReviewHtml.includes("Qualified Review"));
assert.ok(qualifiedReviewJs.includes("qualified-review"));

console.log("public report UI: PASS");
