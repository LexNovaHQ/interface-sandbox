import {
  FORBIDDEN_REPORT_KEYS,
  REPORT_FACING_ARTIFACTS
} from "../../../phases/12-normalized-compiler/phase12-artifact-family.contract.js";

const PUBLIC_RENDERER_VERSION = "phase12_clean_report_renderer_v1_co_p12_05";
const RENDERER_SOURCE = "report_manifest_clean_profiles";
const EXPECTED_SECTION_IDS = Object.freeze(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
const PROFILE_METADATA_KEYS = new Set([
  "schema_version", "artifact_role", "renderable", "section_id", "section_key", "profile_id",
  "artifact_name", "title", "status", "summary", "findings", "rows", "limitations",
  "child_artifacts", "render_order", "renderer_instruction", "stream_scope", "material_status",
  "public_status_label", "status_definitions"
]);

export function buildRendererPayload({ run = {}, artifacts = {}, final_output_handoff = null } = {}) {
  const bundle = Object.keys(artifacts || {}).length ? artifacts : (final_output_handoff || {});
  const manifest = unwrapArtifact(bundle.report_manifest);
  const handoff = unwrapArtifact(bundle.report_handoff);
  const validation = unwrapArtifact(bundle.phase12_compiler_validation);
  assertRendererInputs({ manifest, handoff, validation, bundle });

  const sections = manifest.section_artifacts.map((entry, index) =>
    buildPublicSection({ entry, index, bundle })
  );
  const generatedAt = new Date().toISOString();
  const runId = run.run_id || manifest.run_id || "UNKNOWN_RUN";
  const target = run.target || manifest.target || "UNKNOWN_TARGET";
  const targetUrl = run.root_url || run.target_url || manifest.target_url || "UNKNOWN_TARGET_URL";
  const status = manifest.status || handoff.status || validation.status || "UNKNOWN";

  return {
    renderer_payload: {
      schema_version: "renderer_payload.v14.co_p12_05",
      renderer_version: PUBLIC_RENDERER_VERSION,
      renderer_source: RENDERER_SOURCE,
      renderer_design: "ten_section_clean_profile_report",
      run_id: runId,
      target,
      target_url: targetUrl,
      generated_by: "portfolio_renderer",
      generated_at: generatedAt,
      validation_status: status,
      status_label: statusLabel(status),
      report_shell: {
        report_title: "Lex Nova Diligence Report",
        report_subtitle: "Review-Ready Public-Footprint Legal Architecture",
        target_display_name: target,
        target_domain: targetUrl,
        run_id: runId,
        generated_at: generatedAt,
        report_mode: "PUBLIC_FOOTPRINT_REVIEW_READY_DRAFT",
        validation_status: status,
        status_label: statusLabel(status),
        public_footprint_only: true,
        review_ready_draft: true,
        no_legal_advice: true,
        local_counsel_review_required: true,
        boundary_notice: "This is a Review-Ready Draft prepared from public and uploaded source materials. It is not legal advice, a compliance certification, or a final legal opinion. Local counsel review is required before reliance."
      },
      dashboard_tiles: buildDashboardTiles({ sections, bundle, status }),
      public_report_ui: {
        product_name: "Lex Nova Diligence Engine",
        primary_actions: [
          { id: "download_pdf", label: "Download PDF", action_type: "download_pdf" },
          { id: "open_public_technical_annexure", label: "Open Public Technical Annexure", action_type: "public_technical_annexure", layer_ref: "layer_2_public_technical_annexure" },
          { id: "proceed_to_qualified_review", label: "Proceed to Qualified Review", action_type: "qualified_review", layer_ref: "layer_3_qualified_review" }
        ],
        forbidden_actions: ["Download JSON"],
        raw_json_download_enabled: false,
        render_contract: "clean_report_profiles_only"
      },
      report_layers: [
        {
          layer_id: "layer_1_public_report",
          label: "Public Report",
          purpose: "Readable ten-section report rendered directly from the 29 clean Phase 12 report profiles.",
          canonical: true,
          section_count: sections.length
        },
        {
          layer_id: "layer_2_public_technical_annexure",
          label: "Public Technical Annexure",
          purpose: "Reference layer. Custody, route, forensic and validation artifacts are never rendered in the main report.",
          canonical: false
        },
        {
          layer_id: "layer_3_qualified_review",
          label: "Qualified Review Workspace",
          purpose: "Separate reviewer confirmation and counsel handoff workspace.",
          canonical: false,
          separate_branch: true
        }
      ],
      section_order: EXPECTED_SECTION_IDS,
      sections,
      report_artifact_source_count: REPORT_FACING_ARTIFACTS.length,
      semantic_merge_performed: false,
      custody_rendered: false
    }
  };
}

function assertRendererInputs({ manifest, handoff, validation, bundle }) {
  if (manifest.schema_version !== "report_manifest.v1.co_p12_04") throw new Error(`REPORT_RENDERER_MANIFEST_SCHEMA_INVALID:${manifest.schema_version || "missing"}`);
  if (manifest.status === "CONTROLLED_FAILURE") throw new Error("REPORT_RENDERER_MANIFEST_CONTROLLED_FAILURE");
  if (handoff.schema_version !== "report_handoff.v1.co_p12_04") throw new Error(`REPORT_RENDERER_HANDOFF_SCHEMA_INVALID:${handoff.schema_version || "missing"}`);
  if (validation.validation?.status === "CONTROLLED_FAILURE" || validation.status === "CONTROLLED_FAILURE") throw new Error("REPORT_RENDERER_COMPILER_VALIDATION_FAILED");
  if (manifest.canonical_section_count !== 10 || !Array.isArray(manifest.section_artifacts) || manifest.section_artifacts.length !== 10) throw new Error("REPORT_RENDERER_SECTION_MANIFEST_INVALID");
  if (!sameArray(manifest.section_artifacts.map((entry) => entry.section_id), EXPECTED_SECTION_IDS)) throw new Error("REPORT_RENDERER_SECTION_ORDER_INVALID");
  if (!sameSet(manifest.report_facing_artifacts, REPORT_FACING_ARTIFACTS)) throw new Error("REPORT_RENDERER_ARTIFACT_SET_INVALID");
  for (const artifactName of REPORT_FACING_ARTIFACTS) {
    const artifact = unwrapArtifact(bundle[artifactName]);
    if (!artifact || typeof artifact !== "object" || !Object.keys(artifact).length) throw new Error(`REPORT_RENDERER_ARTIFACT_MISSING:${artifactName}`);
    if (artifact.renderable !== true) throw new Error(`REPORT_RENDERER_ARTIFACT_NOT_RENDERABLE:${artifactName}`);
    assertNoForbiddenKeys(artifact, artifactName);
  }
  for (const forbidden of ["phase12_report_custody_manifest", "phase12_route_plan", "phase12_admission"]) {
    if (manifest.report_facing_artifacts.includes(forbidden)) throw new Error(`REPORT_RENDERER_CONTROL_ARTIFACT_LISTED:${forbidden}`);
  }
}

function buildPublicSection({ entry, index, bundle }) {
  const parent = unwrapArtifact(bundle[entry.artifact_name]);
  const subsections = [];
  if (parent.summary && Object.keys(parent.summary).length) {
    subsections.push({
      subsection_id: `${entry.section_id}.00`,
      subsection_title: "Section Summary",
      fields: [{ label: "Summary", value: cleanPublic(parent.summary) }]
    });
  }
  const children = Array.isArray(entry.child_artifacts) ? entry.child_artifacts : [];
  if (children.length) {
    for (const childName of children) subsections.push(profileToSubsection(unwrapArtifact(bundle[childName]), childName));
  } else {
    subsections.push(profileToSubsection(parent, entry.artifact_name));
  }
  return {
    section_id: entry.section_id,
    section_key: entry.section_key,
    section_number: index + 1,
    section_title: entry.title,
    report_layer: "layer_1_public_report",
    artifact_role: parent.artifact_role,
    source_profile_artifacts: children.length ? children : [entry.artifact_name],
    reviewer_summary: sectionReviewerSummary(parent),
    subsections: subsections.filter((subsection) => subsection.fields.length)
  };
}

function profileToSubsection(profile, artifactName) {
  const fields = [];
  if (Array.isArray(profile.findings)) {
    for (const finding of profile.findings) {
      fields.push({
        label: finding.label || finding.field_id || "Finding",
        value: cleanPublic(finding.value),
        value_status: finding.value_status,
        report_importance: finding.report_importance,
        presentation: finding.presentation
      });
    }
  }
  if (Array.isArray(profile.rows)) {
    fields.push({ label: "Material Rows", value: cleanPublic(profile.rows) });
  }
  if (Array.isArray(profile.limitations) && profile.limitations.length) {
    fields.push({ label: "Upstream Limitations", value: cleanPublic(profile.limitations) });
  }
  for (const [key, value] of Object.entries(profile || {})) {
    if (PROFILE_METADATA_KEYS.has(key) || key.startsWith("p12_")) continue;
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) continue;
    fields.push({ label: publicLabel(key), value: cleanPublic(value) });
  }
  return {
    subsection_id: profile.profile_id || profile.section_key || artifactName,
    subsection_title: profile.title || artifactName,
    fields
  };
}

function sectionReviewerSummary(parent) {
  if (parent.artifact_role === "SECTION_WRAPPER") {
    return "This section is rendered from separately validated child profiles. The renderer does not merge or reinterpret them.";
  }
  return "Material fields are projected from upstream-owned profiles without Phase 12 substantive re-evaluation.";
}

function buildDashboardTiles({ sections, bundle, status }) {
  const exposure = unwrapArtifact(bundle.report_section__08_exposure_register);
  const data = unwrapArtifact(bundle.report_section__05_data_provenance_privacy_architecture);
  return [
    { label: "Review status", value: statusLabel(status), detail: status },
    { label: "Report sections", value: String(sections.length), detail: "Canonical ten-section report" },
    { label: "Exposure rows", value: String(exposure.summary?.total_exposure_row_count || 0), detail: "Triggered and controlled profiles" },
    { label: "Data/privacy material fields", value: String(data.summary?.material_field_count || 0), detail: "Preserved across eleven clean profiles" }
  ];
}

function assertNoForbiddenKeys(value, path) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_REPORT_KEYS.has(key)) throw new Error(`REPORT_RENDERER_FORBIDDEN_KEY:${path}.${key}`);
    assertNoForbiddenKeys(nested, `${path}.${key}`);
  }
}

function cleanPublic(value) {
  if (Array.isArray(value)) return value.map(cleanPublic);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_REPORT_KEYS.has(key) || key.startsWith("p12_")) continue;
    out[key] = cleanPublic(nested);
  }
  return out;
}

function publicLabel(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function statusLabel(status) {
  if (status === "PASS") return "Pass";
  if (status === "PASS_WITH_LIMITATION") return "Pass with limitation";
  if (status === "LOCKED") return "Completed";
  if (status === "LOCKED_WITH_LIMITATIONS") return "Completed with limitations";
  if (status === "CONTROLLED_FAILURE") return "Controlled failure";
  return "In review";
}
function unwrapArtifact(value) {
  if (!value || typeof value !== "object") return value || {};
  if (value.artifact && typeof value.artifact === "object") return unwrapArtifact(value.artifact);
  return value;
}
function sameSet(left = [], right = []) {
  return JSON.stringify([...new Set(left)].sort()) === JSON.stringify([...new Set(right)].sort());
}
function sameArray(left = [], right = []) {
  return JSON.stringify(left) === JSON.stringify(right);
}
