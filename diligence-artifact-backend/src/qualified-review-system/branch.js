import { buildQualifiedReviewHandoff } from "./handoff.js";
import { buildQualifiedReviewRendererPayload } from "./renderer.js";

export function buildQualifiedReviewSystemArtifacts({ run = {}, normalized_compiler_output = {}, source_artifacts = {} } = {}) {
  const manifest = normalized_compiler_output.normalized_report_manifest || {};
  const sections = Object.fromEntries((manifest.section_order || []).map((sectionId) => [sectionId, normalized_compiler_output[`normalized_section__${sectionId}`] || {}]));
  const qualified_review_handoff = buildQualifiedReviewHandoff({ run, normalized_report_manifest: manifest, sections, artifacts: source_artifacts });
  const qualified_review_renderer_payload = buildQualifiedReviewRendererPayload({ run, qualified_review_handoff });
  return { qualified_review_handoff, qualified_review_renderer_payload };
}
