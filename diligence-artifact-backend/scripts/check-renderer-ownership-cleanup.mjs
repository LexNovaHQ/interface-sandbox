import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { buildRendererPayload } from "../src/runtime/services/reporting/report-renderer.service.js";

const implementation = readFileSync("src/runtime/services/reporting/report-renderer.service.js", "utf8");
const pipeline = readFileSync("src/runtime/services/pipeline.service.js", "utf8");

for (const marker of ["TEN_SECTION_PLAN", "NORMALIZED_RENDERER_INPUT_MISSING", "normalized_section_artifacts_only", "three_layer_ten_section_deterministic_report", "public_tables_render_full_rows"]) assert.ok(implementation.includes(marker), `renderer implementation missing ${marker}`);
assert.equal(existsSync("src/report-renderer.js"), false, "obsolete root renderer file still exists");
assert.ok(pipeline.includes('./reporting/report-renderer.service.js'), "central pipeline must import runtime renderer directly");
assert.equal(pipeline.includes('../../report-renderer.js'), false, "central pipeline must not use root renderer path");

const sample = buildRendererPayload({ run: { run_id: "CLEANUP-RENDERER", target: "Example", root_url: "https://example.com" }, final_output_handoff: { normalized_report_manifest: { run_id: "CLEANUP-RENDERER", target: "Example", target_url: "https://example.com", validation_status: "LOCKED", section_order: ["matter_overview"] }, normalized_section__matter_overview: { artifact: { section_id: "matter_overview", section_title: "Matter Overview", subsections: [], fields: [], tables: [], section_limitations: [] } } } });
assert.ok(sample.renderer_payload);
assert.equal(sample.renderer_payload.renderer_source, "normalized_section_artifacts_only");

console.log(JSON.stringify({ check: "renderer ownership cleanup", status: "PASS", enforced_gates: ["RENDERER_IMPLEMENTATION_RUNTIME_OWNED", "CENTRAL_PIPELINE_IMPORTS_RENDERER_DIRECTLY", "OBSOLETE_ROOT_RENDERER_FILE_DELETED", "LOCKED_RENDERER_CONTRACT_PRESERVED"] }, null, 2));