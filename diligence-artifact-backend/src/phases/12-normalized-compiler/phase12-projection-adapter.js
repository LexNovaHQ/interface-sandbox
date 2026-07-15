import { buildPhase12AdmissionAdapter } from "./phase12-admission-adapter.js";
import { buildPhase12RouteAdapter } from "./phase12-route-adapter.js";
import { assertPhase12ReportContract, loadPhase12ReportContract } from "./phase12-report-contract.js";
import {
  CANONICAL_SECTION_ARTIFACTS,
  CONTROL_ARTIFACTS,
  PHASE12_ARTIFACT_FAMILY_SCHEMA,
  REPORT_FACING_ARTIFACTS,
  REPORT_PROFILE_SCHEMA,
  REPORT_WRAPPER_SCHEMA,
  SECTION5_CHILD_PROFILES,
  SECTION8_CHILD_PROFILES,
  section5ChildForFieldId,
  section8ChildForRow
} from "./phase12-artifact-family.contract.js";
import { injectPhase12ActivityPresentation } from "./phase12-activity-presentation.js";
import { injectPhase12ObligationPresentation } from "./phase12-obligation-presentation.js";
import { buildExposureDisplayRow, projectFdrFinding } from "./phase12-profile-normalizer.js";
import { validatePhase12CompilerOutput } from "./phase12-compiler-validator.js";

export function buildPhase12ProjectionAdapter({ run = {}, artifacts = {}, admission = null, routePlan = null, contract = loadPhase12ReportContract() } = {}) {
  const reportContract = assertPhase12ReportContract(contract);
  const admissionRoot = admission?.phase12_admission || admission || buildPhase12AdmissionAdapter({ run, artifacts, contract: reportContract }).phase12_admission;
  const routeRoot = routePlan?.phase12_route_plan || routePlan || buildPhase12RouteAdapter({ run, artifacts, admission: admissionRoot, contract: reportContract }).phase12_route_plan;
  const failures = [];
  const warnings = [];
  if (admissionRoot.validation?.status === "CONTROLLED_FAILURE") failures.push(...(admissionRoot.validation.failures || []).map((failure) => `ADMISSION:${failure}`));
  if (routeRoot.validation?.status === "CONTROLLED_FAILURE") failures.push(...(routeRoot.validation.failures || []).map((failure) => `ROUTE:${failure}`));
  if (admissionRoot.status === "PASS_WITH_LIMITATION") warnings.push("PHASE11_LIMITATIONS_CARRIED_FROM_FINAL_GATE");

  const preliminaryStatus = failures.length ? "CONTROLLED_FAILURE" : warnings.length ? "PASS_WITH_LIMITATION" : "PASS";
  const custody = {
    schema_version: "phase12_report_custody_manifest.v1.co_p12_04",
    renderable: false,
    status: preliminaryStatus,
    field_bindings: [],
    profile_family_bindings: [],
    exposure_row_bindings: [],
    warning_bindings: []
  };

  const reportArtifacts = {};
  for (const section of reportContract.section_schema.sections || []) {
    if (["05", "08"].includes(section.section_id)) continue;
    const routes = (routeRoot.route_rows || []).filter((row) => row.primary_report_section === section.section_id);
    reportArtifacts[section.artifact_name] = buildCleanSectionProfile({ section, routes, artifacts, custody, status: preliminaryStatus });
  }

  Object.assign(reportArtifacts, buildSection5ArtifactFamily({ reportContract, routeRoot, artifacts, custody, status: preliminaryStatus }));
  Object.assign(reportArtifacts, buildSection8ArtifactFamily({ admissionRoot, routeRoot, custody, status: preliminaryStatus }));
  injectPhase12ActivityPresentation({
    section: reportArtifacts.report_section__04_product_activity_architecture,
    artifacts,
    custody
  });
  injectPhase12ObligationPresentation({
    section: reportArtifacts.report_section__06_sector_control_obligations,
    artifacts,
    custody
  });
  injectMatterBoundary(reportArtifacts.report_section__01_matter_review_boundary, admissionRoot);
  injectExecutiveOverview(reportArtifacts.report_section__02_executive_legal_risk_overview, reportArtifacts, admissionRoot);
  injectOpenReviewItems(reportArtifacts.report_section__09_open_review_items_handoff, reportArtifacts, admissionRoot, custody);
  injectMethodology(reportArtifacts.report_section__10_methodology_limitations_annexure, { admissionRoot, routeRoot, reportContract });

  custody.field_binding_count = custody.field_bindings.length;
  custody.profile_family_binding_count = custody.profile_family_bindings.length;
  custody.exposure_row_binding_count = custody.exposure_row_bindings.length;
  custody.warning_binding_count = custody.warning_bindings.length;

  const sectionArtifacts = buildCanonicalSectionManifest(reportContract, reportArtifacts);
  const orderedReportArtifacts = buildOrderedReportArtifacts();
  const report_manifest = {
    schema_version: "report_manifest.v1.co_p12_04",
    renderable: false,
    status: preliminaryStatus,
    doctrine: "Upstream phases decide. Phase 12 arranges.",
    artifact_family_schema: PHASE12_ARTIFACT_FAMILY_SCHEMA,
    canonical_section_count: 10,
    report_facing_artifact_count: REPORT_FACING_ARTIFACTS.length,
    canonical_section_artifacts: CANONICAL_SECTION_ARTIFACTS,
    report_facing_artifacts: REPORT_FACING_ARTIFACTS,
    ordered_report_artifacts: orderedReportArtifacts,
    section_artifacts: sectionArtifacts,
    control_artifacts: CONTROL_ARTIFACTS,
    admission_ref: "phase12_admission",
    route_plan_ref: "phase12_route_plan",
    custody_manifest_ref: "phase12_report_custody_manifest",
    compiler_validation_ref: "phase12_compiler_validation",
    old_normalized_section_artifacts_emitted: false,
    renderer_semantic_merge_forbidden: true,
    p12_model_usage: "FORBIDDEN",
    phase2g_dependency_forbidden: true,
    artifact_purity_contract: {
      mandatory_upstream_material_fields_preserved: true,
      report_facing_profiles_only: true,
      forensic_payloads_forbidden: true,
      unnecessary_mechanical_fields_forbidden: true,
      custody_isolated_from_renderable_artifacts: true,
      p12_new_questions_priorities_routes_limitations_or_remediation_forbidden: true
    }
  };

  const report_handoff = {
    schema_version: "report_handoff.v1.co_p12_04",
    renderable: false,
    status: preliminaryStatus,
    report_manifest_ref: "report_manifest",
    report_facing_artifacts: REPORT_FACING_ARTIFACTS,
    ordered_report_artifacts: orderedReportArtifacts,
    custody_manifest_ref: "phase12_report_custody_manifest",
    compiler_validation_ref: "phase12_compiler_validation",
    renderer_payload_ref: "renderer_payload",
    local_counsel_review_required: true,
    review_ready_draft_notice: "This is a Review-Ready Draft projection for local counsel review; it is not legal advice and does not replace jurisdiction-specific counsel review."
  };

  const final_output_handoff = {
    schema_version: "final_output_handoff.v13.co_p12_04",
    renderable: false,
    status: preliminaryStatus,
    report_manifest_ref: "report_manifest",
    report_handoff_ref: "report_handoff",
    renderer_payload_ref: "renderer_payload",
    compiler_validation_ref: "phase12_compiler_validation",
    compiler_trace: {
      compiler_version: "phase12_clean_report_profile_adapter_v1_co_p12_04",
      deterministic_only: true,
      p12_model_usage: "FORBIDDEN",
      no_new_findings_created: true,
      no_row_re_evaluation: true,
      mandatory_material_fields_preserved: true,
      custody_isolated_from_report_profiles: true,
      phase2g_dependency_forbidden: true,
      old_recursive_profiler_not_used_by_adapter: true
    }
  };

  const renderer_payload = {
    schema_version: "renderer_payload.v13.clean_report_artifact_refs",
    renderable: false,
    status: preliminaryStatus,
    report_manifest_ref: "report_manifest",
    report_artifact_refs: orderedReportArtifacts,
    render_plan: sectionArtifacts,
    renderer_must_not_merge_sections_semantically: true,
    renderer_must_not_read_control_artifacts: true,
    custody_artifact_rendering_forbidden: true
  };

  const output = {
    phase12_admission: admissionRoot,
    phase12_route_plan: routeRoot,
    phase12_report_custody_manifest: custody,
    report_manifest,
    report_handoff,
    final_output_handoff,
    renderer_payload,
    ...reportArtifacts
  };
  const validation = validatePhase12CompilerOutput({ output, contract: reportContract });
  output.phase12_compiler_validation = validation.phase12_compiler_validation;
  const finalStatus = validation.phase12_compiler_validation.status;
  for (const artifactName of REPORT_FACING_ARTIFACTS) if (output[artifactName]) output[artifactName].status = finalStatus;
  for (const artifact of [output.phase12_report_custody_manifest, output.report_manifest, output.report_handoff, output.final_output_handoff, output.renderer_payload]) artifact.status = finalStatus;
  return output;
}

export const compilePhase12DirectReportProjection = buildPhase12ProjectionAdapter;

function buildCleanSectionProfile({ section, routes, artifacts, custody, status }) {
  const findings = routes.map((route) => projectFdrFinding({ route, artifacts, reportArtifactName: section.artifact_name, custodyManifest: custody }));
  return {
    schema_version: REPORT_PROFILE_SCHEMA,
    artifact_role: "SECTION_PROFILE",
    renderable: true,
    section_id: section.section_id,
    section_key: section.section_key,
    artifact_name: section.artifact_name,
    title: section.title,
    status,
    summary: summarizeFindings(findings),
    findings,
    limitations: findings.filter((finding) => finding.report_importance === "LIMITATION"),
    p12_substantive_derivation_forbidden: true
  };
}

function buildSection5ArtifactFamily({ reportContract, routeRoot, artifacts, custody, status }) {
  const section = (reportContract.section_schema.sections || []).find((row) => row.section_id === "05");
  const routes = (routeRoot.route_rows || []).filter((row) => row.primary_report_section === "05");
  const out = {};
  for (const profile of SECTION5_CHILD_PROFILES) {
    const profileRoutes = routes.filter((route) => section5ChildForFieldId(route.field_id)?.artifact_name === profile.artifact_name);
    const findings = profileRoutes.map((route) => projectFdrFinding({ route, artifacts, reportArtifactName: profile.artifact_name, custodyManifest: custody }));
    out[profile.artifact_name] = {
      schema_version: REPORT_PROFILE_SCHEMA,
      artifact_role: "SECTION_PROFILE",
      renderable: true,
      section_id: "05",
      profile_id: profile.profile_id,
      artifact_name: profile.artifact_name,
      title: profile.public_title,
      status,
      summary: summarizeFindings(findings),
      findings,
      limitations: findings.filter((finding) => finding.report_importance === "LIMITATION"),
      p12_substantive_derivation_forbidden: true
    };
  }
  const children = SECTION5_CHILD_PROFILES.map((row) => row.artifact_name);
  const childFieldCount = children.reduce((sum, name) => sum + (out[name]?.findings?.length || 0), 0);
  const unresolvedCount = children.reduce((sum, name) => sum + (out[name]?.summary?.unresolved_field_count || 0), 0);
  out[section.artifact_name] = {
    schema_version: REPORT_WRAPPER_SCHEMA,
    artifact_role: "SECTION_WRAPPER",
    renderable: true,
    section_id: "05",
    section_key: section.section_key,
    artifact_name: section.artifact_name,
    title: section.title,
    status,
    child_artifacts: children,
    render_order: children,
    summary: {
      profile_count: children.length,
      material_field_count: childFieldCount,
      unresolved_field_count: unresolvedCount,
      missing_proof_profile_ref: "report_section__05_missing_proof_diligence_requests"
    },
    renderer_instruction: {
      render_child_artifacts: true,
      do_not_render_custody: true,
      do_not_merge_profiles_semantically: true
    },
    p12_substantive_derivation_forbidden: true
  };
  return out;
}

function buildSection8ArtifactFamily({ admissionRoot, routeRoot, custody, status }) {
  const out = {};
  const sourceRows = admissionRoot.phase10_downstream_compatibility?.material_rows || [];
  const section8Routes = (routeRoot.route_rows || []).filter((row) => row.primary_report_section === "08");
  for (const route of section8Routes) {
    custody.profile_family_bindings.push({
      report_section: "08",
      field_id: route.field_id,
      route_id: route.route_id,
      owner_phase: route.owner_phase,
      source_artifact_candidates: route.owner_artifact_candidates,
      projection_mode: "CLEAN_EXPOSURE_ROW_PROFILE_FAMILY"
    });
  }
  for (const profile of SECTION8_CHILD_PROFILES) {
    const selectedRows = sourceRows.filter((row) => section8ChildForRow(row)?.artifact_name === profile.artifact_name);
    const rows = selectedRows.map((row, index) => buildExposureDisplayRow({ row, reportArtifactName: profile.artifact_name, rowIndex: index, custodyManifest: custody }));
    out[profile.artifact_name] = {
      schema_version: REPORT_PROFILE_SCHEMA,
      artifact_role: "SECTION_PROFILE",
      renderable: true,
      section_id: "08",
      profile_id: profile.profile_id,
      artifact_name: profile.artifact_name,
      title: profile.public_title,
      stream_scope: profile.stream_scope,
      material_status: profile.material_status,
      public_status_label: profile.public_status_label,
      status,
      summary: summarizeExposureRows(rows),
      rows,
      p12_substantive_derivation_forbidden: true,
      p12_row_re_evaluation_forbidden: true
    };
  }
  const children = SECTION8_CHILD_PROFILES.map((row) => row.artifact_name);
  out.report_section__08_exposure_register = {
    schema_version: REPORT_WRAPPER_SCHEMA,
    artifact_role: "SECTION_WRAPPER",
    renderable: true,
    section_id: "08",
    section_key: "exposure_register",
    artifact_name: "report_section__08_exposure_register",
    title: "Exposure Register",
    status,
    child_artifacts: children,
    render_order: children,
    summary: buildSection8Summary(out),
    status_definitions: Object.fromEntries(SECTION8_CHILD_PROFILES.slice(0, 4).map((profile) => [profile.material_status, profile.public_status_label])),
    renderer_instruction: {
      render_child_artifacts: true,
      do_not_render_custody: true,
      do_not_merge_status_groups: true,
      do_not_merge_primary_and_overlay_streams: true
    },
    p12_substantive_derivation_forbidden: true
  };
  return out;
}

function injectMatterBoundary(section, admissionRoot) {
  if (!section) return;
  section.review_boundary = {
    doctrine: "Upstream phases decide. Phase 12 arranges.",
    phase11_gate_status: admissionRoot.phase10_downstream_compatibility?.challenge_status || "UNKNOWN",
    evidence_boundary: "Public-footprint diligence projection unless an upstream material profile expressly records another reviewed source.",
    review_ready_draft_notice: "Review-Ready Draft only; local counsel review is required before reliance.",
    local_counsel_review_required: true
  };
}

function injectExecutiveOverview(section, reportArtifacts, admissionRoot) {
  if (!section) return;
  const childArtifacts = SECTION8_CHILD_PROFILES.map((profile) => reportArtifacts[profile.artifact_name]).filter(Boolean);
  const allRows = childArtifacts.flatMap((artifact) => artifact.rows || []);
  section.exposure_overview = {
    total_material_exposure_rows: allRows.length,
    triggered_count: allRows.filter((row) => row.identity?.material_status === "TRIGGERED").length,
    controlled_by_visible_control_count: allRows.filter((row) => row.identity?.material_status === "CONTROLLED_BY_VISIBLE_CONTROL").length,
    controlled_by_exclusion_count: allRows.filter((row) => row.identity?.material_status === "CONTROLLED_BY_EXCLUSION").length,
    controlled_by_public_evidence_limitation_count: allRows.filter((row) => row.identity?.material_status === "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION").length,
    primary_stream_count: allRows.filter((row) => row.identity?.stream_scope === "Primary Sector").length,
    overlay_stream_count: allRows.filter((row) => row.identity?.stream_scope === "Capability Overlay").length,
    highest_upstream_pain_tier: highestPainTier(allRows),
    carried_phase11_warning_count: admissionRoot.phase10_downstream_compatibility?.phase11_warning_projection?.warning_count || 0,
    deterministic_rollup_only: true
  };
}

function injectOpenReviewItems(section, reportArtifacts, admissionRoot, custody) {
  if (!section) return;
  const warnings = admissionRoot.phase10_downstream_compatibility?.phase11_warning_projection?.warnings || [];
  const items = warnings.map((warning, index) => {
    custody.warning_bindings.push({
      report_artifact: "report_section__09_open_review_items_handoff",
      report_item_index: index,
      challenge_candidate_id: warning.challenge_candidate_id,
      affected_artifacts: warning.affected_artifacts,
      affected_field_paths: warning.affected_field_paths,
      affected_registry_row_keys: warning.affected_registry_row_keys
    });
    return {
      warning_type: warning.warning_type,
      remaining_uncertainty: warning.remaining_uncertainty,
      possible_report_impact: warning.possible_report_impact,
      local_counsel_review_route: warning.local_counsel_review_route
    };
  });
  section.open_review_items = items;
  section.summary = {
    ...(section.summary || {}),
    open_item_count: items.length,
    phase7_missing_proof_profile_ref: reportArtifacts.report_section__05_missing_proof_diligence_requests?.artifact_name,
    exposure_register_duplication_forbidden: true
  };
  section.p12_question_creation_forbidden = true;
  section.p12_priority_creation_forbidden = true;
  section.p12_route_creation_forbidden = true;
}

function injectMethodology(section, { admissionRoot, routeRoot, reportContract }) {
  if (!section) return;
  section.methodology = {
    doctrine: "Upstream phases decide. Phase 12 arranges.",
    artifact_purity_rule: "Report-facing artifacts preserve mandatory upstream material fields and exclude forensic or unnecessary mechanical payloads.",
    admission_status: admissionRoot.status,
    route_status: routeRoot.status,
    active_owned_field_count: reportContract.validation.active_owned_field_count,
    blocked_gap_field_count: reportContract.validation.blocked_gap_field_count,
    custody_manifest_ref: "phase12_report_custody_manifest",
    local_counsel_review_required: true,
    review_ready_draft_boundary: "Review-Ready Draft only; local counsel review required before use."
  };
}

function buildCanonicalSectionManifest(reportContract, reportArtifacts) {
  return (reportContract.section_schema.sections || []).map((section) => {
    const artifact = reportArtifacts[section.artifact_name] || {};
    return {
      section_id: section.section_id,
      section_key: section.section_key,
      artifact_name: section.artifact_name,
      artifact_role: artifact.artifact_role,
      title: section.title,
      status: artifact.status,
      child_artifacts: artifact.child_artifacts || [],
      material_field_count: artifact.summary?.material_field_count ?? artifact.summary?.field_count ?? artifact.findings?.length ?? 0,
      render_order: artifact.render_order || [section.artifact_name]
    };
  });
}

function buildOrderedReportArtifacts() {
  const ordered = [];
  for (const artifactName of CANONICAL_SECTION_ARTIFACTS) {
    ordered.push(artifactName);
    if (artifactName === "report_section__05_data_provenance_privacy_architecture") ordered.push(...SECTION5_CHILD_PROFILES.map((row) => row.artifact_name));
    if (artifactName === "report_section__08_exposure_register") ordered.push(...SECTION8_CHILD_PROFILES.map((row) => row.artifact_name));
  }
  return ordered;
}

function summarizeFindings(findings) {
  return {
    field_count: findings.length,
    resolved_field_count: findings.filter((finding) => finding.value_status === "RESOLVED").length,
    unresolved_field_count: findings.filter((finding) => finding.value_status !== "RESOLVED").length,
    limitation_field_count: findings.filter((finding) => finding.report_importance === "LIMITATION").length
  };
}

function summarizeExposureRows(rows) {
  return {
    row_count: rows.length,
    highest_upstream_pain_tier: highestPainTier(rows),
    represented_pain_depths: [...new Set(rows.map((row) => row.severity?.pain_depth?.code || row.severity?.pain_depth).filter(Boolean))],
    mandatory_material_fields_preserved: true
  };
}

function buildSection8Summary(artifacts) {
  const rows = SECTION8_CHILD_PROFILES.flatMap((profile) => artifacts[profile.artifact_name]?.rows || []);
  return {
    total_exposure_row_count: rows.length,
    primary_row_count: rows.filter((row) => row.identity?.stream_scope === "Primary Sector").length,
    overlay_row_count: rows.filter((row) => row.identity?.stream_scope === "Capability Overlay").length,
    triggered_count: rows.filter((row) => row.identity?.material_status === "TRIGGERED").length,
    controlled_by_visible_control_count: rows.filter((row) => row.identity?.material_status === "CONTROLLED_BY_VISIBLE_CONTROL").length,
    controlled_by_exclusion_count: rows.filter((row) => row.identity?.material_status === "CONTROLLED_BY_EXCLUSION").length,
    controlled_by_public_evidence_limitation_count: rows.filter((row) => row.identity?.material_status === "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION").length
  };
}

function highestPainTier(rows) {
  const order = ["T1", "T2", "T3", "T4", "T5"];
  const tiers = rows.map((row) => row.severity?.pain_tier?.code || row.severity?.pain_tier).filter(Boolean);
  return tiers.sort((a, b) => order.indexOf(a) - order.indexOf(b))[0] || null;
}
