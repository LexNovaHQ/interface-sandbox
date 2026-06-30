import assert from "node:assert/strict";
import { NORMALIZED_SECTION_KEYS } from "../src/normalized-profiler.js";
import { buildQualifiedReviewSystemArtifacts } from "../src/qualified-review-system/branch.js";

const run = { run_id: "TEST-QR-BRANCH", target: "Example", root_url: "https://example.com", status: "COMPLETE" };
const normalized_report_manifest = {
  manifest_type: "normalized_report_manifest",
  run_id: run.run_id,
  target: run.target,
  target_url: run.root_url,
  validation_status: "LOCKED",
  section_order: NORMALIZED_SECTION_KEYS
};
const normalized_compiler_output = { normalized_report_manifest };

for (const sectionId of NORMALIZED_SECTION_KEYS) {
  normalized_compiler_output[`normalized_section__${sectionId}`] = {
    artifact_name: `normalized_section__${sectionId}`,
    section_id: sectionId,
    section_title: sectionId,
    source_artifacts_used: ["target_profile"],
    section_limitations: [],
    subsections: [
      {
        subsection_id: "sample",
        subsection_title: "Sample",
        fields: [
          {
            field_id: "sample_field",
            label: "Sample field",
            value: "Sample",
            source_artifact: "target_profile",
            source_path: "target_profile.sample_field",
            qualified_review_note: "Reviewer confirmation required before downstream use.",
            evidence_refs: []
          }
        ]
      }
    ]
  };
}

const source_artifacts = {
  source_discovery_handoff: { ok: true },
  target_profile: { target_identity: { brand_name: "Example" } },
  legal_cartography_index: { document_coverage_index: [] },
  target_feature_profile: { activities: [] },
  data_provenance_profile: { limitations: [] },
  data_provenance_profile_forensics: { forensic_trace_index: [] },
  extended_dap_india_readiness_profile: { india_readiness: {} },
  integrated_dap_report: { india_privacy_cyber: {} }
};

const output = buildQualifiedReviewSystemArtifacts({ run, normalized_compiler_output, source_artifacts });
const handoff = output.qualified_review_handoff;
const renderer = output.qualified_review_renderer_payload;

assert.equal(handoff.handoff_type, "qualified_review_handoff");
assert.equal(handoff.public_label, "Qualified Review");
assert.equal(handoff.source_branch, "NORMALIZED_COMPILER_TO_QUALIFIED_REVIEW");
assert.equal(handoff.question_count, 79);
assert.equal(handoff.question_handoff_validation.status, "PASS");
assert.equal(renderer.renderer_type, "qualified_review_renderer_payload");
assert.equal(renderer.question_count, 79);
assert.equal(renderer.source_handoff_ref, "qualified_review_handoff");
assert.equal(renderer.render_contract.section_wizard, true);
assert.equal(renderer.render_contract.no_document_assembly, true);
assert.equal(renderer.render_contract.forbidden_public_actions.includes("Download JSON"), true);

console.log("qualified review branch contract: PASS");