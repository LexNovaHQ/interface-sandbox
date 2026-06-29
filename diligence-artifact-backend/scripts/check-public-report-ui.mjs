import assert from "node:assert/strict";
import { buildRendererPayload } from "../src/report-renderer.js";

const output = buildRendererPayload({
  run: { run_id: "TEST-UI", target: "Example", root_url: "https://example.com" },
  final_output_handoff: {
    final_output_handoff: {
      validation_status: "LOCKED",
      normalized_report_manifest: { run_id: "TEST-UI", target: "Example", target_url: "https://example.com", validation_status: "LOCKED", section_order: ["matter_overview"], renderer_contract: {} },
      qualified_review_handoff: { handoff_type: "qualified_review_handoff", public_label: "Qualified Review" },
      normalized_sections: { matter_overview: { section_id: "matter_overview", section_title: "Matter Overview", subsections: [] } }
    }
  }
});

assert.equal(output.renderer_payload.public_report_ui.primary_actions[0].label, "Download PDF");
assert.equal(output.renderer_payload.public_report_ui.primary_actions[1].label, "Proceed to Qualified Review");
assert.equal(output.renderer_payload.public_report_ui.raw_json_download_enabled, false);
assert.equal(output.renderer_payload.qualified_review_handoff.public_label, "Qualified Review");
console.log("public report UI: PASS");
