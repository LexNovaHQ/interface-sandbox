const PUBLIC_RENDERER_VERSION = "locked_three_layer_ten_section_renderer_v1";

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
const MAX_INLINE_ROWS = 25;

const TEN_SECTION_PLAN = Object.freeze([
  { id: "matter_overview", title: "Matter Overview", sources: ["matter_overview"], layer: "layer_1_public_report" },
  { id: "executive_summary", title: "Executive Summary", sources: ["executive_summary"], layer: "layer_1_public_report" },
  { id: "target_profile", title: "Target Profile", sources: ["target_profile"], layer: "layer_1_public_report" },
  { id: "product_activity_ip_profile", title: "Product, Activity & IP Profile", sources: ["product_activity_ip_profile"], layer: "layer_1_public_report" },
  { id: "data_provenance_controls", title: "Data Provenance & Controls", sources: ["data_provenance_controls"], layer: "layer_1_public_report" },
  { id: "legal_document_control_review", title: "Legal Document & Governance Map", sources: ["legal_document_control_review"], layer: "layer_1_public_report" },
  { id: "exposure_findings", title: "Exposure Findings", sources: ["exposure_summary_harm_mechanism_workpad_summary", "exposure_diagnosis_table", "exposure_control_discipline"], layer: "layer_1_public_report" },
  { id: "review_route_handoff_plan", title: "Review Route & Handoff Plan", sources: ["review_route_action_plan", "control_handoff_readiness"], layer: "layer_1_public_report" },
  { id: "clarification_missing_source_queue", title: "Clarification & Missing Source Queue", sources: ["exposure_clarification_queue", "global_confirmation_queue"], layer: "layer_1_public_report" },
  { id: "methodology_limitations_public_annexure", title: "Methodology, Limitations & Public Technical Annexure", sources: ["methodology_limitations_forensic_annexure"], layer: "layer_2_public_technical_annexure" }
]);

export function buildRendererPayload({ run = {}, final_output_handoff }) {
  const bundle = final_output_handoff || {};
  const handoff = bundle?.final_output_handoff?.final_output_handoff || bundle?.final_output_handoff || bundle || {};
  const manifest = bundle.normalized_report_manifest || handoff.normalized_report_manifest;

  if (!manifest || !Array.isArray(manifest.section_order) || !manifest.section_order.length) {
    throw new Error("NORMALIZED_RENDERER_INPUT_MISSING:normalized_report_manifest.section_order required");
  }

  const sourceSections = loadSourceSections({ manifest, bundle, handoff });
  const fullNormalizedSetAvailable = TEN_SECTION_PLAN.every((plan) => plan.sources.every((sourceId) => sourceSections[sourceId]));
  const sections = fullNormalizedSetAvailable
    ? TEN_SECTION_PLAN.map((plan, index) => buildTenSection(plan, index, sourceSections))
    : manifest.section_order.map((sectionId) => {
        const section = sourceSections[sectionId];
        if (!section || typeof section !== "object") throw new Error(`NORMALIZED_RENDERER_SECTION_MISSING:normalized_section__${sectionId}`);
        return projectPublicSection(section);
      });

  const generatedAt = new Date().toISOString();
  const runId = run.run_id || handoff?.run_meta?.run_id || manifest.run_id || "UNKNOWN_RUN";
  const target = run.target || handoff?.run_meta?.target || manifest.target || "UNKNOWN_TARGET";
  const targetUrl = run.root_url || run.target_url || handoff?.run_meta?.target_url || manifest.target_url || "UNKNOWN_TARGET_URL";
  const validationStatus = manifest.validation_status || handoff.validation_status || "UNKNOWN";

  return {
    renderer_payload: {
      renderer_version: PUBLIC_RENDERER_VERSION,
      renderer_source: "normalized_section_artifacts_only",
      renderer_design: "three_layer_ten_section_deterministic_report",
      run_id: runId,
      target,
      target_url: targetUrl,
      generated_by: "portfolio_renderer",
      generated_at: generatedAt,
      validation_status: validationStatus,
      status_label: statusLabel(validationStatus),
      report_shell: {
        report_title: "Interface Diligence Report",
        report_subtitle: "Public-Footprint Legal Exposure Diligence",
        target_display_name: target,
        target_domain: targetUrl,
        run_id: runId,
        generated_at: generatedAt,
        report_mode: "PUBLIC_FOOTPRINT_REVIEW_READY_SUPPORT",
        validation_status: validationStatus,
        status_label: statusLabel(validationStatus),
        public_footprint_only: true,
        no_legal_advice: true,
        qualified_review_required: true,
        deterministic_renderer_design: "THREE_LAYER_TEN_SECTION",
        boundary_notice: "This report is generated from public and uploaded source materials only. It is not legal advice, not a compliance certification, and not a final legal opinion. Findings are review-ready diligence signals that require qualified legal review before reliance."
      },
      dashboard_tiles: buildDashboardTiles({ sections, sourceSections, validationStatus }),
      public_report_ui: {
        product_name: "Interface Diligence Engine",
        primary_actions: [
          { id: "download_pdf", label: "Download PDF", action_type: "download_pdf" },
          { id: "open_public_technical_annexure", label: "Open Public Technical Annexure", action_type: "public_technical_annexure", layer_ref: "layer_2_public_technical_annexure" },
          { id: "proceed_to_qualified_review", label: "Proceed to Qualified Review", action_type: "qualified_review", handoff_ref: "qualified_review_handoff", layer_ref: "layer_3_qualified_review" }
        ],
        forbidden_actions: ["Download JSON"],
        raw_json_download_enabled: false,
        render_contract: "locked_public_projection_only"
      },
      report_layers: [
        { layer_id: "layer_1_public_report", label: "Public Report", purpose: "Readable 10-section diligence report.", canonical: true, section_count: sections.length },
        { layer_id: "layer_2_public_technical_annexure", label: "Public Technical Annexure", purpose: "Public auditability layer. Full technical artifacts live outside the main report body.", canonical: false, display_rule: "Manifest only in report body; full payloads are not inlined." },
        { layer_id: "layer_3_qualified_review", label: "Qualified Review Workspace", purpose: "Separate reviewer confirmation and handoff workspace.", canonical: false, separate_branch: true }
      ],
      public_technical_annexure: buildPublicTechnicalAnnexure({ runId, sourceSections }),
      sections
    }
  };
}

function loadSourceSections({ manifest, bundle, handoff }) {
  const out = {};
  for (const sectionId of manifest.section_order) {
    const artifactKey = `normalized_section__${sectionId}`;
    out[sectionId] = bundle[artifactKey] || handoff.normalized_sections?.[sectionId] || handoff[artifactKey];
  }
  return out;
}

function buildTenSection(plan, index, sourceSections) {
  const parts = plan.sources.map((sourceId) => sourceSections[sourceId]).filter(Boolean);
  if (parts.length === 1) {
    const section = projectPublicSection(parts[0]);
    return { ...section, section_id: plan.id, section_title: plan.title, section_number: index + 1, source_section_refs: plan.sources, report_layer: plan.layer };
  }

  const subsections = [];
  const limitations = [];
  for (const part of parts) {
    const projected = projectPublicSection(part);
    for (const subsection of asArray(projected.subsections)) {
      subsections.push({ ...subsection, source_section_ref: projected.section_id });
    }
    limitations.push(...asArray(projected.section_limitations));
  }

  return {
    section_id: plan.id,
    section_number: index + 1,
    section_title: plan.title,
    reviewer_summary: summaryForCompositeSection(plan.id),
    subsections,
    section_limitations: limitations,
    source_section_refs: plan.sources,
    report_layer: plan.layer,
    display_rule: displayRuleForSection(plan.id)
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
  if (Array.isArray(value)) {
    const rows = value.map((item) => cleanPublicValue(item));
    if (rows.length > MAX_INLINE_ROWS) {
      return {
        row_count: rows.length,
        displayed_rows: rows.slice(0, MAX_INLINE_ROWS),
        suppressed_row_count: rows.length - MAX_INLINE_ROWS,
        display_rule: "Large technical rowset truncated in the main report. Open the public technical annexure for the full artifact payload."
      };
    }
    return rows;
  }
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
  if (typeof value === "string") return statusLabel(value);
  return value;
}

function buildDashboardTiles({ sections, sourceSections, validationStatus }) {
  return [
    tile("Status", statusLabel(validationStatus)),
    tile("Report Sections", sections.length),
    tile("Legal Documents", findNumber(sourceSections.legal_document_control_review, ["Primary_Legal_Documents_Found", "Legal documents found"])),
    tile("Embedded Instruments", findNumber(sourceSections.legal_document_control_review, ["Embedded_Legal_Instruments_Found", "Embedded legal instruments"])),
    tile("Registry Rows", findNumber(sourceSections.exposure_summary_harm_mechanism_workpad_summary, ["Registry_Workpad_Rows", "registry_workpad_rows", "Registry rows reviewed"])),
    tile("Triggered Rows", findNumber(sourceSections.exposure_summary_harm_mechanism_workpad_summary, ["Triggered_Exposure_Rows", "triggered_exposure_rows", "Triggered exposure rows"])),
    tile("Controlled / Limited", findNumber(sourceSections.exposure_summary_harm_mechanism_workpad_summary, ["Controlled_Limited_Rows", "controlled_limited_rows", "Controlled / limited rows"]))
  ].filter((item) => item.value !== "");
}

function buildPublicTechnicalAnnexure({ runId, sourceSections }) {
  const section10 = sourceSections.methodology_limitations_forensic_annexure || {};
  return {
    layer_id: "layer_2_public_technical_annexure",
    title: "Public Technical Annexure",
    run_id: runId,
    display_rule: "The report body shows only manifest and summaries. Full preserved diligence artifacts belong in the public technical annexure pack.",
    source_section_ref: "methodology_limitations_forensic_annexure",
    manifest_summary: cleanPublicValue(section10),
    expected_pack_name: "technical_annexure_pack.zip",
    report_body_inlines_full_payloads: false
  };
}

function findNumber(value, keys) {
  const result = findByKey(value, new Set(keys.map((key) => String(key).toLowerCase())));
  return result === undefined || result === null || result === "" ? "" : result;
}

function findByKey(value, wanted) {
  if (!value || typeof value !== "object") return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findByKey(item, wanted);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (wanted.has(String(key).toLowerCase())) return nested;
    const found = findByKey(nested, wanted);
    if (found !== undefined) return found;
  }
  return undefined;
}

function tile(label, value) { return { label, value: value === undefined || value === null ? "" : value }; }

function statusLabel(value) {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase();
  if (upper === "LOCKED_WITH_LIMITATIONS") return "Completed with public-source limitations";
  if (upper === "LOCKED" || upper === "COMPLETE") return "Completed";
  if (upper === "FIELD_NOT_FOUND") return "Not visible in reviewed public materials";
  if (upper === "REPAIR_REQUIRED") return "Requires repair before reliance";
  if (upper === "CONTROLLED_FAILURE") return "Controlled failure — do not rely";
  if (upper === "BLOCKED_PENDING_SOURCE") return "Source needed before reliance";
  if (upper === "READY_FOR_REVIEW") return "Ready for qualified review";
  return raw;
}

function summaryForCompositeSection(sectionId) {
  if (sectionId === "exposure_findings") return "Deterministic exposure summary, triggered findings, controlled evidence rows, and false-positive discipline. Full rowsets remain in the public technical annexure.";
  if (sectionId === "review_route_handoff_plan") return "Deterministic review-route and handoff plan derived from locked exposure/action artifacts.";
  if (sectionId === "clarification_missing_source_queue") return "Deterministic clarification and missing-source queue for qualified review.";
  return "";
}

function displayRuleForSection(sectionId) {
  if (sectionId === "exposure_findings") return "Triggered and priority rows are visible first; large controlled/workpad rowsets are summarized and capped in the main report.";
  if (sectionId === "review_route_handoff_plan") return "Action and handoff rows are rendered as reviewer-facing summaries, not legal conclusions.";
  if (sectionId === "clarification_missing_source_queue") return "Question queues preserve deterministic IDs; large queues are capped in the main report.";
  return "";
}

function asArray(value) { return Array.isArray(value) ? value : []; }
function text(value, fallback) { const out = String(value ?? "").trim(); return out || fallback; }
