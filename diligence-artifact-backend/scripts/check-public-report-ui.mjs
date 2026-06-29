import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const reportHtml = readFileSync("public/interface-diligence/diligence-system/report.html", "utf8");

assert.ok(reportHtml.includes("Proceed to Qualified Review"));
console.log("public report UI: PASS");
