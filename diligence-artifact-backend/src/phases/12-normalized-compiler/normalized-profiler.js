export const NORMALIZED_PROFILER_VERSION = "normalized_profiler_base_section_artifacts_v2";

export const NORMALIZED_SECTION_DEFINITIONS = Object.freeze([
  ["matter_overview", "Matter Overview"],
  ["executive_summary", "Executive Summary"],
  ["target_profile", "Target Profile"],
  ["product_activity_ip_profile", "Product, Activity & IP Profile"],
  ["data_provenance_controls", "Data Provenance & Controls"],
  ["legal_document_control_review", "Legal Document & Control Review"],
  ["exposure_findings", "Exposure Findings"],
  ["implications_review_path", "Implications & Review Path"],
  ["evidence_gaps_clarification_points", "Evidence Gaps & Clarification Points"],
  ["methodology_limitations_review_notes", "Methodology, Limitations & Review Notes"],
  ["forensic_ledger_appendix", "Forensic Ledger Appendix"]
]);

export const NORMALIZED_SECTION_KEYS = Object.freeze(NORMALIZED_SECTION_DEFINITIONS.map(([key]) => key));
export const NORMALIZED_SECTION_ARTIFACT_NAMES = Object.freeze(NORMALIZED_SECTION_KEYS.map((key) => `normalized_section__${key}`));

export function buildNormalizedProfilerOutput({ run = {}, artifacts = {} } = {}) {
  const context = { run, artifacts, generated_at: new Date().toISOString(), validation_status: normalizeStatus(run.status || run.validation_status || "LOCKED_WITH_LIMITATIONS") };
  const sections = {
    matter_overview: section(context, "matter_overview", "Matter Overview", [subsection("matter_identity", "Matter Identity", [field("run_id", "Run ID", run.run_id || "UNKNOWN_RUN"), field("target", "Target", run.target || hostFromUrl(run.root_url)), field("target_url", "Target URL", run.root_url || run.target_url || run.target || "")])]),
    executive_summary: section(context, "executive_summary", "Executive Summary", [subsection("summary", "Summary", [field("review_boundary", "Review boundary", "Public-footprint diligence signals only. Qualified review required before reliance.")])]),
    target_profile: sectionFromArtifact(context, "target_profile", "Target Profile", unwrap(artifacts.target_profile, "target_profile")),
    product_activity_ip_profile: sectionFromArtifact(context, "product_activity_ip_profile", "Product, Activity & IP Profile", unwrap(artifacts.target_feature_profile, "target_feature_profile")),
    data_provenance_controls: sectionFromArtifact(context, "data_provenance_controls", "Data Provenance & Controls", unwrap(artifacts.data_provenance_profile, "data_provenance_profile")),
    legal_document_control_review: sectionFromArtifact(context, "legal_document_control_review", "Legal Document & Control Review", unwrap(artifacts.legal_cartography_index, "legal_cartography_index")),
    exposure_findings: sectionFromArtifact(context, "exposure_findings", "Exposure Findings", unwrap(artifacts.exposure_registry_triggered_profile, "exposure_registry_triggered_profile")),
    implications_review_path: section(context, "implications_review_path", "Implications & Review Path", [subsection("review_route", "Review Route", [field("status", "Status", context.validation_status)])]),
    evidence_gaps_clarification_points: section(context, "evidence_gaps_clarification_points", "Evidence Gaps & Clarification Points", [subsection("clarifications", "Clarifications", [field("qualified_review_required", "Qualified review required", true)])]),
    methodology_limitations_review_notes: section(context, "methodology_limitations_review_notes", "Methodology, Limitations & Review Notes", [subsection("methodology", "Methodology", [field("method", "Method", "Deterministic normalized section projection from locked artifacts."), field("limitation", "Limitation", "Public and uploaded-source signals only; no legal advice generated.")])]),
    forensic_ledger_appendix: section(context, "forensic_ledger_appendix", "Forensic Ledger Appendix", [subsection("forensic_sources", "Forensic Sources", [field("source_count", "Source count", Object.keys(artifacts || {}).length)])])
  };
  const namedSections = Object.fromEntries(NORMALIZED_SECTION_KEYS.map((key) => [`normalized_section__${key}`, sections[key]]));
  const normalized_report_manifest = { manifest_type: "normalized_report_manifest", profiler_version: NORMALIZED_PROFILER_VERSION, run_id: run.run_id || "UNKNOWN_RUN", target: run.target || hostFromUrl(run.root_url), target_url: run.root_url || run.target_url || run.target || "", generated_at: context.generated_at, validation_status: context.validation_status, section_order: NORMALIZED_SECTION_KEYS, section_artifacts: NORMALIZED_SECTION_KEYS.map((key) => ({ section_id: key, artifact_name: `normalized_section__${key}`, title: sections[key].section_title, status: context.validation_status })) };
  const final_output_handoff = { final_output_handoff: { validation_status: context.validation_status, normalized_report_manifest, normalized_sections: sections, compiler_trace: { compiler_version: NORMALIZED_PROFILER_VERSION, deterministic_only: true, no_new_findings_created: true } } };
  return { normalized_report_manifest, final_output_handoff, ...namedSections };
}

function sectionFromArtifact(context, id, title, artifact) {
  const fields = objectFields(artifact).slice(0, 24);
  return section(context, id, title, [subsection("profile_summary", "Profile Summary", fields.length ? fields : [field("status", "Status", "Not visible in reviewed public materials.")])]);
}

function objectFields(object, prefix = "") {
  if (!object || typeof object !== "object") return [];
  const rows = [];
  for (const [key, value] of Object.entries(object)) {
    if (value === undefined || typeof value === "function") continue;
    const id = normalizeId(prefix ? `${prefix}_${key}` : key);
    if (Array.isArray(value) || !value || typeof value !== "object") rows.push(field(id, label(key), value));
    else rows.push(field(id, label(key), summarizeObject(value)));
  }
  return rows;
}

function section(context, id, title, subsections) { return { section_id: id, artifact_name: `normalized_section__${id}`, section_title: title, section_status: context.validation_status, display_section_status: context.validation_status, reviewer_summary: title, subsections, section_limitations: [] }; }
function subsection(id, title, fields) { return { subsection_id: id, subsection_title: title, fields }; }
function field(field_id, labelText, value) { return { field_id, label: labelText, value, qualified_review_note: "Confirm before reliance." }; }
function unwrap(value, key) { if (!value || typeof value !== "object") return {}; if (value[key] && typeof value[key] === "object") return value[key]; if (value.artifact && typeof value.artifact === "object") return unwrap(value.artifact, key); return value; }
function summarizeObject(value) { return Object.fromEntries(Object.entries(value || {}).slice(0, 12).map(([key, nested]) => [key, Array.isArray(nested) ? nested.slice(0, 5) : nested && typeof nested === "object" ? "Object" : nested])); }
function normalizeStatus(value) { const raw = String(value || "").toUpperCase(); if (raw === "COMPLETE") return "LOCKED"; if (["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"].includes(raw)) return raw; return "LOCKED_WITH_LIMITATIONS"; }
function normalizeId(value) { return String(value || "field").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase() || "field"; }
function label(value) { return String(value || "Field").replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
function hostFromUrl(value) { try { return new URL(String(value || "")).hostname.replace(/^www\./i, ""); } catch { return String(value || "UNKNOWN_TARGET"); } }
