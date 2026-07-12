import { buildPhase12AdmissionAdapter } from "./phase12-admission-adapter.js";
import { buildPhase12RouteAdapter } from "./phase12-route-adapter.js";
import { artifactRoot, assertPhase12ReportContract, loadPhase12ReportContract } from "./phase12-report-contract.js";

export function buildPhase12ProjectionAdapter({ run = {}, artifacts = {}, admission = null, routePlan = null, contract = loadPhase12ReportContract() } = {}) {
  const reportContract = assertPhase12ReportContract(contract);
  const admissionRoot = admission?.phase12_admission || admission || buildPhase12AdmissionAdapter({ run, artifacts, contract: reportContract }).phase12_admission;
  const routeRoot = routePlan?.phase12_route_plan || routePlan || buildPhase12RouteAdapter({ run, artifacts, admission: admissionRoot, contract: reportContract }).phase12_route_plan;
  const failures = [];
  const warnings = [];
  if (admissionRoot.validation?.status === "CONTROLLED_FAILURE") failures.push(...(admissionRoot.validation.failures || []).map((failure) => `ADMISSION:${failure}`));
  if (routeRoot.validation?.status === "CONTROLLED_FAILURE") failures.push(...(routeRoot.validation.failures || []).map((failure) => `ROUTE:${failure}`));

  const sections = {};
  for (const section of reportContract.section_schema.sections || []) {
    const sectionRoute = (routeRoot.section_routes || []).find((candidate) => candidate.section_id === section.section_id) || {};
    const routes = (routeRoot.route_rows || []).filter((row) => row.primary_report_section === section.section_id);
    sections[section.artifact_name] = buildReportSection({ section, sectionRoute, routes, artifacts, admissionRoot });
  }
  injectExposureRegister(sections.report_section__08_exposure_register, admissionRoot);
  injectOpenHandoff(sections.report_section__09_open_review_items_handoff, admissionRoot);
  injectMethodology(sections.report_section__10_methodology_limitations_annexure, { admissionRoot, routeRoot, reportContract });

  const sectionArtifacts = (reportContract.section_schema.sections || []).map((section) => ({
    section_id: section.section_id,
    section_key: section.section_key,
    artifact_name: section.artifact_name,
    title: section.title,
    status: failures.length ? "CONTROLLED_FAILURE" : "PROJECTED",
    field_count: sections[section.artifact_name]?.field_count || 0
  }));

  const status = failures.length ? "CONTROLLED_FAILURE" : warnings.length || admissionRoot.status === "PASS_WITH_LIMITATION" ? "PASS_WITH_LIMITATION" : "PASS";
  const normalized_report_manifest = {
    schema_version: "normalized_report_manifest.v12.phase12_direct_projection",
    status,
    doctrine: "Upstream phases decide. Phase 12 arranges.",
    route_plan_ref: "phase12_route_plan",
    admission_ref: "phase12_admission",
    section_count: sectionArtifacts.length,
    section_artifacts: sectionArtifacts,
    old_normalized_section_artifacts_emitted: false,
    renderer_semantic_merge_forbidden: true,
    p12_model_usage: "FORBIDDEN",
    phase2g_dependency_forbidden: true,
    phase12_projection_contract: {
      schema_version: "phase12_projection_contract.v1",
      one_report_section_one_artifact: true,
      section_8_complete_exposure_register: true,
      section_9_open_items_only: true,
      no_compiler_authored_questions_priorities_routes_or_limitations: true,
      route_path_contract_status: "CO_P12_03_ADAPTER_BOUND_TO_OWNER_ARTIFACTS"
    },
    validation: { status, failures, warnings }
  };

  const review_ready_section_handoff = {
    schema_version: "review_ready_section_handoff.v12.phase12_direct_projection",
    status,
    normalized_report_manifest_ref: "normalized_report_manifest",
    section_artifacts: sectionArtifacts,
    local_counsel_review_required: true,
    review_ready_draft_notice: "This is a Review-Ready Draft projection for local counsel review; it is not legal advice and does not replace jurisdiction-specific counsel review."
  };

  const final_output_handoff = {
    schema_version: "final_output_handoff.v12.phase12_direct_projection",
    status,
    normalized_report_manifest,
    section_artifacts: sectionArtifacts,
    compiler_trace: {
      compiler_version: "phase12_direct_projection_adapter_v1_co_p12_03",
      deterministic_only: true,
      p12_model_usage: "FORBIDDEN",
      no_new_findings_created: true,
      no_row_re_evaluation: true,
      phase2g_dependency_forbidden: true,
      old_recursive_profiler_not_used_by_adapter: true
    }
  };

  const renderer_payload = {
    schema_version: "renderer_payload.v12.phase12_direct_projection",
    status,
    normalized_report_manifest_ref: "normalized_report_manifest",
    sections: sectionArtifacts.map((row) => sections[row.artifact_name]),
    renderer_must_not_merge_sections_semantically: true
  };

  return {
    phase12_admission: admissionRoot,
    phase12_route_plan: routeRoot,
    normalized_report_manifest,
    review_ready_section_handoff,
    final_output_handoff,
    renderer_payload,
    ...sections
  };
}

export const compilePhase12DirectReportProjection = buildPhase12ProjectionAdapter;

function buildReportSection({ section, sectionRoute, routes, artifacts }) {
  const fields = routes.map((route) => projectField(route, artifacts));
  const unresolved = fields.filter((field) => field.value_status !== "RESOLVED");
  return {
    schema_version: "report_section.v12.phase12_direct_projection",
    section_id: section.section_id,
    section_key: section.section_key,
    artifact_name: section.artifact_name,
    title: section.title,
    status: "PROJECTED",
    route_field_count: sectionRoute.route_field_count || routes.length,
    field_count: fields.length,
    unresolved_value_count: unresolved.length,
    subsections: section.subsections || [],
    fields,
    limitations: unresolved.map((field) => ({
      field_id: field.field_id,
      limitation: "Upstream value was not found through the bound deterministic owner-artifact route. Phase 12 did not synthesize it.",
      source_artifact: field.selected_source_artifact
    })),
    p12_substantive_derivation_forbidden: true
  };
}

function projectField(route, artifacts) {
  const resolved = resolveValue(route, artifacts);
  return {
    field_id: route.field_id,
    label: route.canonical_label,
    value: resolved.value,
    value_status: resolved.status,
    value_path: resolved.path,
    owner_phase: route.owner_phase,
    selected_source_artifact: route.selected_source_artifact,
    source_value_route: route.source_value_route,
    taxonomy_resolver: route.taxonomy_resolver,
    report_importance: route.report_importance,
    presentation: route.presentation,
    p12_value_mutation_forbidden: true,
    p12_generated: false
  };
}

function resolveValue(route, artifacts) {
  const artifactName = route.selected_source_artifact;
  const root = artifactRoot(artifacts[artifactName], artifactName);
  if (!artifactName || !Object.keys(root).length) return unresolved("OWNER_ARTIFACT_MISSING");
  const id = route.field_id;
  for (const [path, value] of [
    [`${artifactName}.__fdr_values.${id}`, root.__fdr_values?.[id]],
    [`${artifactName}.fields_by_id.${id}`, root.fields_by_id?.[id]],
    [`${artifactName}.${id}`, root[id]],
    [`${artifactName}.${slug(route.canonical_label)}`, root[slug(route.canonical_label)]]
  ]) {
    if (value !== undefined && value !== null && !(typeof value === "string" && !value.trim())) {
      return { status: "RESOLVED", value, path };
    }
  }
  return unresolved("VALUE_NOT_BOUND_IN_OWNER_ARTIFACT");
}

function injectExposureRegister(section, admissionRoot) {
  if (!section) return;
  const phase10 = admissionRoot.phase10_downstream_compatibility || {};
  section.exposure_register = {
    schema_version: "phase12_section8_exposure_register.v1",
    triggered_rows: phase10.material_rows?.filter((row) => row.evaluation_status === "TRIGGERED") || [],
    controlled_rows: phase10.material_rows?.filter((row) => row.evaluation_status !== "TRIGGERED") || [],
    final_status_counts: phase10.final_status_counts || {},
    no_row_re_evaluation: true,
    complete_exposure_register: true
  };
}

function injectOpenHandoff(section, admissionRoot) {
  if (!section) return;
  const warnings = admissionRoot.phase10_downstream_compatibility?.phase11_warning_projection?.warnings || [];
  section.open_handoff_items = {
    schema_version: "phase12_section9_open_handoff.v1",
    item_count: warnings.length,
    items: warnings,
    open_or_unresolved_items_only: true,
    exposure_register_duplication_forbidden: true,
    p12_question_creation_forbidden: true,
    p12_priority_creation_forbidden: true,
    p12_route_creation_forbidden: true
  };
}

function injectMethodology(section, { admissionRoot, routeRoot, reportContract }) {
  if (!section) return;
  section.methodology = {
    schema_version: "phase12_methodology_projection.v1",
    doctrine: "Upstream phases decide. Phase 12 arranges.",
    admission_status: admissionRoot.status,
    route_status: routeRoot.status,
    active_owned_field_count: reportContract.validation.active_owned_field_count,
    blocked_gap_field_count: reportContract.validation.blocked_gap_field_count,
    local_counsel_review_required: true,
    review_ready_draft_boundary: "Review-Ready Draft only; local counsel review required before use."
  };
}

function unresolved(reason) { return { status: reason, value: null, path: null }; }
function slug(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }
