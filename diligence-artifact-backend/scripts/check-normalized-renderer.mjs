import assert from "node:assert/strict";
import { buildRendererPayload } from "../src/report-renderer.js";

const run = { run_id: "TEST-RENDERER", target: "Example", root_url: "https://example.com" };
const final_output_handoff = {
  final_output_handoff: {
    validation_status: "LOCKED",
    normalized_report_manifest: {
      run_id: "TEST-RENDERER",
      target: "Example",
      target_url: "https://example.com",
      validation_status: "LOCKED",
      section_order: ["matter_overview"],
      renderer_contract: { renderer_may_render: true }
    },
    normalized_sections: {
      matter_overview: {
        section_id: "matter_overview",
        section_title: "Matter Overview",
        subsections: []
      }
    }
  }
};

const output = buildRendererPayload({ run, final_output_handoff });
assert.equal(output.renderer_payload.renderer_source, "normalized_section_artifacts");
assert.equal(output.renderer_payload.section_order[0], "matter_overview");
assert.equal(output.renderer_payload.sections.matter_overview.section_title, "Matter Overview");
console.log("normalized renderer output: PASS");
