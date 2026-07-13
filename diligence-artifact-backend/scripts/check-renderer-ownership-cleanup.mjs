import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { buildRendererPayload } from "../src/runtime/services/reporting/report-renderer.service.js";

const implementation = readFileSync("src/runtime/services/reporting/report-renderer.service.js", "utf8");
const pipeline = readFileSync("src/runtime/services/pipeline.service.js", "utf8");
for (const marker of ["report_manifest_clean_profiles", "ten_section_clean_profile_report", "custody_rendered", "semantic_merge_performed"]) {
  assert.ok(implementation.includes(marker), `renderer implementation missing ${marker}`);
}
for (const retired of ["normalized_section_artifacts_only", "normalized_section__", "TEN_SECTION_PLAN"]) {
  assert.equal(implementation.includes(retired), false, `renderer retains legacy marker ${retired}`);
}
assert.equal(existsSync("src/report-renderer.js"), false);
assert.ok(pipeline.includes('./reporting/report-renderer.service.js'));
assert.equal(pipeline.includes('../../report-renderer.js'), false);
assert.equal(typeof buildRendererPayload, "function");
console.log("Phase 12 renderer ownership and clean-profile cutover: PASS");
