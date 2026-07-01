const PUBLIC_RENDERER_VERSION = "locked_normalized_public_renderer_v1";
const FORBIDDEN_PUBLIC_KEYS = new Set([
  "artifact_name",
  "section_order",
  "section_status",
  "display_section_status",
  "source_artifacts_used",
  "normalization",
  "vault_mapping",
  "source_artifact",
  "source_path",
  "technical_refs",
  "evidence_refs",
  "raw_final_output_handoff",
  "renderer_contract",
  "registry_authority",
  "normalized_report_manifest",
  "vault_section_handoff",
  "qualified_review_handoff",
  "normalized_sections"
]);
const PUBLIC_REFERENCE_KEYS = new Set(["technical_refs", "evidence_refs"]);

export function buildRendererPayload({ run = {}, final_output_handoff }) {
  const bundle = final_output_handoff || {};
  const handoff = bundle?.final_output_handoff?.final_output_handoff || bundle?.final_output_handoff || bundle || {};
  const manifest = bundle.normalized_report_manifest || handoff.normalized_report_manifest;

  if (!manifest || !Array.isArray(manifest.section_order) || !manifest.section_order.length) {
    throw new Error("NORMALIZED_RENDERER_INPUT_MISSING:normalized_report_manifest.section_order required");
  }

  const sections = manifest.section_order.map((sectionId) => {
    const artifactName = `normalized_section__${sectionId}`;
    const section = bundle[artifactName] || handoff.normalized_sections?.[sectionId] || handoff[artifactName];
    if (!section || typeof section !== "object") throw new Error(`NORMALIZED_RENDERER_SECTION_MISSING:${artifactName}`);
    return projectPublicSection(section);
  });

  const generatedAt = new Date().toISOString();
  return {
    renderer_payload: {
      renderer_version: PUBLIC_RENDERER_VERSION,
      renderer_source: "normalized_section_artifacts_only",
      run_id: run.run_id || handoff?.run_meta?.run_id || manifest.run_id || "UNKNOWN_RUN",
      target: run.target || handoff?.run_meta?.target || manifest.target || "UNKNOWN_TARGET",
      target_url: run.root_url || run.target_url || handoff?.run_meta?.target_url || manifest.target_url || "UNKNOWN_TARGET_URL",
      generated_by: "portfolio_renderer",
      generated_at: generatedAt,
      validation_status: manifest.validation_status || handoff.validation_status || "UNKNOWN",
      report_shell: {
        report_title: "Interface Public-Footprint Diligence Report",
        report_subtitle: "Review-Ready support material — qualified review required",
        target_display_name: run.target || manifest.target || "Target not specified",
        target_domain: run.root_url || run.target_url || manifest.target_url || "Target domain not specified",
        run_id: run.run_id || manifest.run_id || "Run ID not specified",
        generated_at: generatedAt,
        report_mode: "PUBLIC_FOOTPRINT_REVIEW_READY_SUPPORT",
        validation_status: manifest.validation_status || handoff.validation_status || "UNKNOWN",
        public_footprint_only: true,
        no_legal_advice: true,
        qualified_review_required: true
      },
      public_report_ui: {
        product_name: "Interface Diligence Engine",
        primary_actions: [
          { id: "download_pdf", label: "Download PDF", action_type: "download_pdf" },
          { id: "proceed_to_qualified_review", label: "Proceed to Qualified Review", action_type: "qualified_review", handoff_ref: "qualified_review_handoff" }
        ],
        forbidden_actions: ["Download JSON"],
        raw_json_download_enabled: false,
        render_contract: "locked_public_projection_only"
      },
      sections
    }
  };
}

function projectPublicSection(section = {}) {
  return {
    section_id: text(section.section_id, "section"),
    section_title: text(section.section_title, "Section"),
    reviewer_summary: text(section.reviewer_summary, ""),
    subsections: asArray(section.subsections).map(projectPublicSubsection),
    section_limitations: asArray(section.section_limitations).map((item) => cleanPublicValue(item))
  };
}

function projectPublicSubsection(subsection = {}) {
  return {
    subsection_id: text(subsection.subsection_id, "subsection"),
    subsection_title: text(subsection.subsection_title, "Subsection"),
    fields: asArray(subsection.fields).map(projectPublicField)
  };
}

function projectPublicField(field = {}) {
  return {
    field_id: text(field.field_id, "field"),
    label: text(field.label, "Field"),
    value: cleanPublicValue(field.value),
    qualified_review_note: text(field.qualified_review_note, ""),
    limitation: text(field.limitation, "")
  };
}

function cleanPublicValue(value) {
  if (value === null || value === undefined || value === "") return "Not visible in reviewed public materials.";
  if (Array.isArray(value)) return value.map((item) => cleanPublicValue(item));
  if (typeof value === "object") {
    const entries = [];
    for (const [key, nested] of Object.entries(value)) {
      if (nested === undefined) continue;
      if (PUBLIC_REFERENCE_KEYS.has(key)) {
        entries.push(["evidence_reference_summary", cleanPublicValue(nested)]);
        continue;
      }
      if (FORBIDDEN_PUBLIC_KEYS.has(key)) continue;
      entries.push([key, cleanPublicValue(nested)]);
    }
    return Object.fromEntries(entries);
  }
  return value;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value, fallback) {
  const out = String(value ?? "").trim();
  return out || fallback;
}
