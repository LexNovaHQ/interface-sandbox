import {
  assertPhase12ReportContract,
  getActiveOwnershipRows,
  getGapOwnershipRows,
  getNormalizerField,
  loadPhase12ReportContract
} from "./phase12-report-contract.js";
import { buildPhase12AdmissionAdapter } from "./phase12-admission-adapter.js";

export function buildPhase12RouteAdapter({ run = {}, artifacts = {}, admission = null, contract = loadPhase12ReportContract() } = {}) {
  const reportContract = assertPhase12ReportContract(contract);
  const admissionRoot = admission?.phase12_admission || admission || buildPhase12AdmissionAdapter({ run, artifacts, contract: reportContract }).phase12_admission;
  const failures = [];
  const warnings = [];
  if (admissionRoot.validation?.status === "CONTROLLED_FAILURE") failures.push(...(admissionRoot.validation.failures || []).map((failure) => `ADMISSION:${failure}`));

  const activeRows = getActiveOwnershipRows(reportContract);
  const gapRows = getGapOwnershipRows(reportContract);
  const sectionRows = new Map();
  for (const section of reportContract.section_schema.sections || []) sectionRows.set(section.section_id, []);

  const routeRows = activeRows.map((row) => {
    const normalizer = getNormalizerField(reportContract, row.field_id) || {};
    const ownerArtifact = firstPresentArtifact(row.owner_artifacts, artifacts);
    if (!ownerArtifact) failures.push(`ROUTE_OWNER_ARTIFACT_UNAVAILABLE:${row.field_id}:${(row.owner_artifacts || []).join(",")}`);
    const route = {
      route_id: `P12.ROUTE.${row.field_id}`,
      field_id: row.field_id,
      canonical_label: row.output_field,
      owner_phase: row.owner_phase,
      owner_artifact_candidates: row.owner_artifacts || [],
      selected_source_artifact: ownerArtifact || null,
      source_value_route: buildSourceValueRoute(row, normalizer, ownerArtifact),
      primary_report_section: row.primary_report_section,
      secondary_projection_sections: row.secondary_projection_sections || [],
      report_importance: normalizer.report_importance,
      presentation: normalizer.presentation,
      taxonomy_resolver: normalizer.taxonomy_resolver || null,
      value_authority: normalizer.value_authority,
      p12_value_mutation_forbidden: true,
      p12_limitation_creation_forbidden: normalizer.limitation_policy !== "CARRY_UPSTREAM_ONLY"
    };
    if (sectionRows.has(row.primary_report_section)) sectionRows.get(row.primary_report_section).push(route);
    else failures.push(`ROUTE_SECTION_UNKNOWN:${row.field_id}:${row.primary_report_section || "missing"}`);
    return route;
  });

  const blockedRows = gapRows.map((row) => ({
    field_id: row.field_id,
    output_field: row.output_field,
    owner_gap_code: row.owner_gap_code,
    treatment: "BLOCKED_FROM_PROJECTION_OWNER_MISSING",
    p12_derivation_forbidden: true
  }));

  const sectionRoutes = (reportContract.section_schema.sections || []).map((section) => {
    const rows = sectionRows.get(section.section_id) || [];
    return {
      section_id: section.section_id,
      section_key: section.section_key,
      artifact_name: section.artifact_name,
      title: section.title,
      subsection_count: (section.subsections || []).length,
      route_field_count: rows.length,
      route_ids: rows.map((row) => row.route_id)
    };
  });

  if (routeRows.length !== 430) failures.push(`ROUTE_ACTIVE_FIELD_COUNT:${routeRows.length}:430`);
  if (blockedRows.length !== 27) failures.push(`ROUTE_BLOCKED_FIELD_COUNT:${blockedRows.length}:27`);
  if (sectionRoutes.length !== 10) failures.push(`ROUTE_SECTION_COUNT:${sectionRoutes.length}:10`);

  const status = failures.length ? "CONTROLLED_FAILURE" : warnings.length ? "PASS_WITH_LIMITATION" : "PASS";
  return {
    phase12_route_plan: {
      schema_version: "phase12_route_plan.v1.direct_owner_artifacts",
      status,
      run_id: run.run_id || run.id || "",
      source_contract: "REPORT_FIELD_OWNERSHIP_MATRIX.json + REPORT_NORMALIZER_KEY.yml + REPORT_SECTION_SCHEMA.yml",
      route_mode: "DIRECT_PROFILE_ARTIFACTS_NO_PHASE2G",
      phase2g_dependency_forbidden: true,
      active_field_route_count: routeRows.length,
      blocked_upstream_gap_count: blockedRows.length,
      section_count: sectionRoutes.length,
      route_rows: routeRows,
      blocked_gap_rows: blockedRows,
      section_routes: sectionRoutes,
      validation: {
        status,
        failures,
        warnings,
        all_active_fields_routed: routeRows.length === 430,
        all_gap_fields_blocked: blockedRows.length === 27,
        one_artifact_per_report_section: sectionRoutes.length === 10,
        p12_substantive_derivation_forbidden: true
      }
    }
  };
}

export function assertPhase12RoutePlan(value) {
  const route = value?.phase12_route_plan || value;
  if (route?.validation?.status === "CONTROLLED_FAILURE") throw new Error(`PHASE12_ROUTE_PLAN_FAILED:${(route.validation.failures || []).join("|")}`);
  return route;
}

function buildSourceValueRoute(row, normalizer, ownerArtifact) {
  return {
    binding_schema: "phase12_source_value_route.v1",
    binding_status: ownerArtifact ? "BOUND_TO_OWNER_ARTIFACT" : "OWNER_ARTIFACT_MISSING",
    selected_source_artifact: ownerArtifact || null,
    allowed_resolution_order: [
      `artifact.${ownerArtifact || "<owner>"}.__fdr_values[${row.field_id}]`,
      `artifact.${ownerArtifact || "<owner>"}.fields_by_id[${row.field_id}]`,
      `artifact.${ownerArtifact || "<owner>"}[${row.field_id}]`,
      `artifact.${ownerArtifact || "<owner>"}.${slug(row.output_field)}`
    ],
    canonical_label_source: "FDR.output_field",
    value_authority: normalizer.value_authority || "UPSTREAM_MATERIAL_PROFILE_VALUE",
    empty_value_policy: normalizer.empty_value_policy || "PRESERVE_UPSTREAM_VALUE_OR_EXPLICIT_UPSTREAM_LIMITATION"
  };
}

function firstPresentArtifact(candidates = [], artifacts = {}) {
  for (const name of candidates || []) {
    if (Object.prototype.hasOwnProperty.call(artifacts, name)) return name;
  }
  return null;
}
function slug(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }
