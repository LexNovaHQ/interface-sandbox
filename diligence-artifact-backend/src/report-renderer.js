import { buildRendererPayloadFromHandoff } from "./report-section-adapter.js";

export function buildRendererPayload({ run, final_output_handoff }) {
  const bundle = final_output_handoff || {};
  const handoff = bundle?.final_output_handoff?.final_output_handoff || bundle?.final_output_handoff || bundle || {};
  const normalized = buildRendererPayloadFromNormalizedSections({ run, bundle, handoff });
  return { renderer_payload: { run_id: run?.run_id || handoff?.run_meta?.run_id || normalized?.run_id || "UNKNOWN_RUN", target: run?.target || handoff?.run_meta?.target || normalized?.target || "UNKNOWN_TARGET", target_url: run?.root_url || run?.target_url || run?.target || handoff?.run_meta?.target_url || normalized?.target_url || "UNKNOWN_TARGET_URL", generated_by: "portfolio_renderer", generated_at: new Date().toISOString(), validation_status: handoff?.validation_status || normalized?.validation_status || "UNKNOWN", ...(normalized || buildRendererPayloadFromHandoff({ run, handoff })) } };
}

function buildRendererPayloadFromNormalizedSections({ run = {}, bundle = {}, handoff = {} } = {}) {
  const manifest = bundle.normalized_report_manifest || handoff.normalized_report_manifest || null;
  if (!manifest || !Array.isArray(manifest.section_order)) return null;
  const sections = Object.fromEntries(manifest.section_order.map((sectionId) => { const artifactName = `normalized_section__${sectionId}`; return [sectionId, bundle[artifactName] || handoff.normalized_sections?.[sectionId] || handoff[artifactName] || {}]; }));
  return {
    report_shell: { report_title: "Interface Public-Footprint Diligence Report", report_subtitle: "Review-Ready support material — qualified review required", target_display_name: run.target || manifest.target || "Target not specified", target_domain: run.root_url || run.target || manifest.target_url || "Target domain not specified", run_id: run.run_id || manifest.run_id || "Run ID not specified", generated_at: new Date().toISOString(), report_mode: "PUBLIC_FOOTPRINT_REVIEW_READY_SUPPORT", validation_status: manifest.validation_status || handoff.validation_status || "UNKNOWN", public_footprint_only: true, no_legal_advice: true, qualified_review_required: true },
    public_report_ui: { product_name: "Interface Diligence Engine", primary_actions: [{ id: "download_pdf", label: "Download PDF", action_type: "download_pdf" }, { id: "proceed_to_qualified_review", label: "Proceed to Qualified Review", action_type: "qualified_review", handoff_ref: "qualified_review_handoff" }], forbidden_actions: ["Download JSON"], section_render_mode: "section_cards", field_render_mode: "label_value_with_qualified_review_note", raw_json_download_enabled: false },
    display_id_index: {}, sections, section_order: manifest.section_order, section_list: manifest.section_order.map((sectionId) => ({ id: sectionId, title: sections[sectionId]?.section_title || sectionId, data: sections[sectionId] || {} })), normalized_report_manifest: manifest, renderer_contract: manifest.renderer_contract || {}, raw_final_output_handoff: handoff, renderer_source: "normalized_section_artifacts"
  };
}
