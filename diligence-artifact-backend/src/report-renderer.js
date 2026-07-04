const PUBLIC_RENDERER_VERSION = "locked_three_layer_ten_section_renderer_v3_full_public_tables";

const FORBIDDEN_PUBLIC_KEYS = new Set([
  "artifact_name",
  "section_order",
  "section_status",
  "display_section_status",
  "source_artifacts_used",
  "normalization",
  "qualified_review_mapping",
  "source_artifact",
  "source_path",
  "technical_refs",
  "evidence_refs",
  "raw_final_output_handoff",
  "renderer_contract",
  "registry_authority",
  "normalized_report_manifest",
  "review_ready_section_handoff",
  "qualified_review_handoff",
  "normalized_sections",
  "trace_id",
  "field_path",
  "value_preview",
  "forensic_trace_present",
  "technical_annexure_only",
  "display_in_main_report",
  "normalized_dap_field_id",
  "integrated_field_group",
  "row_type"
]);

const PUBLIC_REFERENCE_KEYS = new Set(["technical_refs", "evidence_refs"]);

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

const LOCKED_TEN_SECTION_IDS = Object.freeze(TEN_SECTION_PLAN.map((plan) => plan.id));

export function buildRendererPayload({ run = {}, final_output_handoff }) {
  const bundle = final_output_handoff || {};
  const handoff = bundle?.final_output_handoff?.final_output_handoff || bundle?.final_output_handoff || bundle || {};
  const manifest = unwrapArtifact(bundle.normalized_report_manifest || handoff.normalized_report_manifest);

  if (!manifest || !Array.isArray(manifest.section_order) || !manifest.section_order.length) throw new Error("NORMALIZED_RENDERER_INPUT_MISSING:normalized_report_manifest.section_order required");

  const sourceSections = loadSourceSections({ manifest, bundle, handoff });
  const fullNormalizedSetAvailable = TEN_SECTION_PLAN.every((plan) => plan.sources.every((sourceId) => sourceSections[sourceId]));
  const rawSections = fullNormalizedSetAvailable ? TEN_SECTION_PLAN.map((plan, index) => buildTenSection(plan, index, sourceSections)) : manifest.section_order.map((sectionId, index) => {
    const section = sourceSections[sectionId];
    if (!section || typeof section !== "object") throw new Error(`NORMALIZED_RENDERER_SECTION_MISSING:normalized_section__${sectionId}`);
    return { ...projectPublicSection(section), section_number: index + 1, report_layer: "layer_1_public_report" };
  });
  const sections = sanitizeSectionsForPublicReport(rawSections, { requireLockedTenSectionPlan: fullNormalizedSetAvailable });

  const generatedAt = new Date().toISOString();
  const runId = run.run_id || handoff?.run_meta?.run_id || manifest.run_id || "UNKNOWN_RUN";
  const target = run.target || handoff?.run_meta?.target || manifest.target || "UNKNOWN_TARGET";
  const targetUrl = run.root_url || run.target_url || handoff?.run_meta?.target_url || manifest.target_url || "UNKNOWN_TARGET_URL";
  const validationStatus = manifest.validation_status || handoff.validation_status || "UNKNOWN";

  return { renderer_payload: { renderer_version: PUBLIC_RENDERER_VERSION, renderer_source: "normalized_section_artifacts_only", renderer_design: "three_layer_ten_section_deterministic_report", run_id: runId, target, target_url: targetUrl, generated_by: "portfolio_renderer", generated_at: generatedAt, validation_status: validationStatus, status_label: statusLabel(validationStatus), report_shell: { report_title: "Interface Diligence Report", report_subtitle: "Public-Footprint Legal Exposure Diligence", target_display_name: target, target_domain: targetUrl, run_id: runId, generated_at: generatedAt, report_mode: "PUBLIC_FOOTPRINT_REVIEW_READY_SUPPORT", validation_status: validationStatus, status_label: statusLabel(validationStatus), public_footprint_only: true, no_legal_advice: true, qualified_review_required: true, deterministic_renderer_design: "THREE_LAYER_TEN_SECTION", boundary_notice: "This report is generated from public and uploaded source materials only. It is not legal advice, not a compliance certification, and not a final legal opinion. Findings are review-ready diligence signals that require qualified legal review before reliance." }, dashboard_tiles: buildDashboardTiles({ sections, sourceSections, validationStatus }), public_report_ui: { product_name: "Interface Diligence Engine", primary_actions: [{ id: "download_pdf", label: "Download PDF", action_type: "download_pdf" }, { id: "open_public_technical_annexure", label: "Open Public Technical Annexure", action_type: "public_technical_annexure", layer_ref: "layer_2_public_technical_annexure" }, { id: "proceed_to_qualified_review", label: "Proceed to Qualified Review", action_type: "qualified_review", handoff_ref: "qualified_review_handoff", layer_ref: "layer_3_qualified_review" }], forbidden_actions: ["Download JSON"], raw_json_download_enabled: false, render_contract: "locked_public_projection_only", public_tables_render_full_rows: true }, report_layers: [{ layer_id: "layer_1_public_report", label: "Public Report", purpose: "Readable 10-section diligence report with full public-projection tables rendered inline using horizontal scrolling where needed.", canonical: true, section_count: sections.length }, { layer_id: "layer_2_public_technical_annexure", label: "Public Technical Annexure", purpose: "Public auditability layer. Full technical artifacts and machine-detail payloads live outside the main report body.", canonical: false, display_rule: "The report body renders the full public projection tables; raw technical artifacts remain in the annexure." }, { layer_id: "layer_3_qualified_review", label: "Qualified Review Workspace", purpose: "Separate reviewer confirmation and handoff workspace.", canonical: false, separate_branch: true }], section_order: LOCKED_TEN_SECTION_IDS, sections } };
}

function loadSourceSections({ manifest, bundle, handoff }) { const sections = {}; const normalizedSections = handoff.normalized_sections || {}; for (const sectionId of manifest.section_order || []) { const artifactName = `normalized_section__${sectionId}`; const section = unwrapArtifact(bundle[artifactName] || normalizedSections[sectionId] || handoff[artifactName]); if (section) sections[sectionId] = section; } return sections; }
function buildTenSection(plan, index, sourceSections) { const merged = mergeSourceSections(plan, sourceSections); return { ...merged, section_id: plan.id, section_title: plan.title, section_number: index + 1, report_layer: plan.layer, section_sources: plan.sources, artifact_name: `report_section__${plan.id}` }; }
function mergeSourceSections(plan, sourceSections) { const sources = plan.sources.map((id) => sourceSections[id]).filter(Boolean); if (sources.length === 1) return projectPublicSection(sources[0]); return { subsections: sources.flatMap((section) => section.subsections || []), fields: sources.flatMap((section) => section.fields || []), tables: sources.flatMap((section) => section.tables || []), section_limitations: sources.flatMap((section) => section.section_limitations || []) }; }
function projectPublicSection(section) { const cleaned = sanitizeForPublic(section); return { ...cleaned, section_limitations: [] }; }
function sanitizeSectionsForPublicReport(sections, { requireLockedTenSectionPlan = false } = {}) { const sanitized = sections.map((section) => sanitizeForPublic(section)); if (requireLockedTenSectionPlan && sanitized.length !== LOCKED_TEN_SECTION_IDS.length) throw new Error(`PUBLIC_RENDERER_SECTION_COUNT_MISMATCH:${sanitized.length}`); return sanitized; }
function sanitizeForPublic(value) { if (Array.isArray(value)) return value.map((item) => sanitizeForPublic(item)).filter((item) => item !== undefined); if (!value || typeof value !== "object") return value; const out = {}; for (const [key, raw] of Object.entries(value)) { if (FORBIDDEN_PUBLIC_KEYS.has(key) || key === "section_limitations" || key === "vault_mapping") continue; if (PUBLIC_REFERENCE_KEYS.has(key)) { const refs = Array.isArray(raw) ? raw : []; out[key] = refs.map((ref, index) => sanitizeReference(ref, index)).filter(Boolean); continue; } const sanitized = sanitizeForPublic(raw); if (sanitized !== undefined) out[key] = sanitized; } return out; }
function sanitizeReference(ref, index) { if (!ref || typeof ref !== "object") return null; return { ref_id: ref.ref_id || ref.source_id || `REF-${index + 1}`, label: ref.label || ref.source_title || ref.url || "Source reference", url: ref.url || ref.source_url || "", source_type: ref.source_type || ref.type || "public_source" }; }
function buildDashboardTiles({ sections, sourceSections, validationStatus }) { const exposureSection = sourceSections.exposure_summary_harm_mechanism_workpad_summary || {}; const diagnosisSection = sourceSections.exposure_diagnosis_table || {}; const controlledRows = countRowsInSection(sourceSections.exposure_control_discipline); return [{ label: "Review status", value: statusLabel(validationStatus), detail: validationStatus }, { label: "Report sections", value: String(sections.length), detail: "Locked ten-section public report" }, { label: "Exposure findings", value: String(countRowsInSection(exposureSection) + countRowsInSection(diagnosisSection)), detail: "Full rows rendered in report tables" }, { label: "Controlled / N.A. rows", value: String(controlledRows), detail: "Preserved in control discipline tables" }]; }
function countRowsInSection(section) { const tables = Array.isArray(section?.tables) ? section.tables : []; return tables.reduce((sum, table) => sum + (Array.isArray(table.rows) ? table.rows.length : 0), 0); }
function statusLabel(status) { if (status === "COMPLETE") return "Complete"; if (status === "LOCKED") return "Locked"; if (status === "LOCKED_WITH_LIMITATIONS") return "Locked with limitations"; if (status === "REPAIR_REQUIRED") return "Repair required"; if (status === "CONTROLLED_FAILURE") return "Controlled failure"; return "In review"; }
function unwrapArtifact(value) { if (!value || typeof value !== "object") return value; if (value.artifact && typeof value.artifact === "object") return unwrapArtifact(value.artifact); const keys = Object.keys(value); if (keys.length === 1 && value[keys[0]] && typeof value[keys[0]] === "object" && (keys[0].startsWith("normalized_section__") || keys[0] === "normalized_report_manifest")) return value[keys[0]]; return value; }
