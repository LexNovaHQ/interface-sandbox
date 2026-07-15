import { artifactRoot } from "./phase12-report-contract.js";
import { cleanMaterialValue } from "./phase12-profile-normalizer.js";

export const PHASE12_OBLIGATION_PRESENTATION_SCHEMA = "phase12_obligation_presentation.v1";
export const OBLIGATION_TABLE_PAGE_SIZE = 10;
export const OBLIGATION_DECK_PAGE_SIZE = 5;

export const OBLIGATION_PRESENTATION_FIELDS = Object.freeze([
  "obligation_reference",
  "obligation_family",
  "source_scope",
  "capability_context",
  "linked_activity_references",
  "matched_behavior_classes",
  "matched_surfaces",
  "normalized_name",
  "what_it_requires",
  "target_specific_context",
  "authority_dependency",
  "exposure_role_context",
  "obligation_locus",
  "trigger_timing",
  "expected_control_signal",
  "control_mechanism_present",
  "control_posture_status",
  "evidence_basis",
  "missing_proof",
  "diligence_question",
  "derivation_basis",
  "regulatory_context",
  "limitation"
]);

const SOURCE_SCOPES = new Set(["Primary Sector", "Capability Overlay"]);
const FORBIDDEN_ROW_KEYS = new Set([
  "candidate_id",
  "source_package_id",
  "catalog_package_id",
  "package_id",
  "registry_key_ref",
  "obligation_catalog_ref",
  "p2e_navigation_route_refs",
  "legal_applicability_conclusion",
  "compliance_conclusion",
  "breach_conclusion",
  "satisfaction_conclusion",
  "liability_conclusion"
]);

export function injectPhase12ObligationPresentation({ section, artifacts = {}, custody = null } = {}) {
  if (!section) return section;
  const source = artifactRoot(artifacts.domain_control_obligation_profile, "domain_control_obligation_profile");
  const obligations = Array.isArray(source.obligations) ? source.obligations : [];
  const rows = obligations.map(projectObligationRow);

  section.obligation_register = {
    schema_version: PHASE12_OBLIGATION_PRESENTATION_SCHEMA,
    presentation_only: true,
    substantive_derivation_performed: false,
    legal_applicability_conclusion_forbidden: true,
    compliance_conclusion_forbidden: true,
    source_profile: "domain_control_obligation_profile",
    source_layers: ["Primary Sector", "Capability Overlay"],
    regulatory_context_enrichment_only: true,
    row_count: rows.length,
    table_rows_per_page: OBLIGATION_TABLE_PAGE_SIZE,
    deck_cards_per_page: OBLIGATION_DECK_PAGE_SIZE,
    rows
  };

  section.summary = {
    ...(section.summary || {}),
    obligation_row_count: rows.length,
    primary_sector_obligation_count: rows.filter((row) => row.source_scope === "Primary Sector").length,
    capability_overlay_obligation_count: rows.filter((row) => row.source_scope === "Capability Overlay").length,
    legal_applicability_conclusion_forbidden: true
  };

  if (custody?.profile_family_bindings) {
    custody.profile_family_bindings.push({
      report_section: "06",
      source_artifact: "domain_control_obligation_profile",
      projection_mode: "CLEAN_OBLIGATION_PRESENTATION_REGISTER",
      obligation_row_count: rows.length
    });
  }
  return section;
}

export function assertPhase12ObligationPresentation(section = {}) {
  const register = section.obligation_register || {};
  const failures = [];
  if (register.schema_version !== PHASE12_OBLIGATION_PRESENTATION_SCHEMA) failures.push("SECTION6_OBLIGATION_PRESENTATION_SCHEMA_INVALID");
  if (register.presentation_only !== true) failures.push("SECTION6_OBLIGATION_PRESENTATION_NOT_PRESENTATION_ONLY");
  if (register.substantive_derivation_performed !== false) failures.push("SECTION6_OBLIGATION_PRESENTATION_DERIVATION_NOT_FORBIDDEN");
  if (register.legal_applicability_conclusion_forbidden !== true) failures.push("SECTION6_LEGAL_APPLICABILITY_CONCLUSION_NOT_FORBIDDEN");
  if (register.compliance_conclusion_forbidden !== true) failures.push("SECTION6_COMPLIANCE_CONCLUSION_NOT_FORBIDDEN");
  if (register.table_rows_per_page !== OBLIGATION_TABLE_PAGE_SIZE) failures.push("SECTION6_OBLIGATION_TABLE_PAGE_SIZE_INVALID");
  if (register.deck_cards_per_page !== OBLIGATION_DECK_PAGE_SIZE) failures.push("SECTION6_OBLIGATION_DECK_PAGE_SIZE_INVALID");
  if (!Array.isArray(register.rows)) failures.push("SECTION6_OBLIGATION_ROWS_MISSING");

  for (const [index, row] of (register.rows || []).entries()) {
    for (const key of OBLIGATION_PRESENTATION_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(row, key)) failures.push(`SECTION6_OBLIGATION_FIELD_MISSING:${index}:${key}`);
    }
    if (!SOURCE_SCOPES.has(row.source_scope)) failures.push(`SECTION6_SOURCE_SCOPE_INVALID:${index}:${row.source_scope}`);
    for (const forbidden of FORBIDDEN_ROW_KEYS) {
      if (Object.prototype.hasOwnProperty.call(row, forbidden)) failures.push(`SECTION6_FORBIDDEN_ROW_KEY:${index}:${forbidden}`);
    }
  }

  if (failures.length) throw new Error(`PHASE12_OBLIGATION_PRESENTATION_INVALID:${failures.join("|")}`);
  return register;
}

function projectObligationRow(obligation = {}) {
  return {
    obligation_reference: cleanMaterialValue(obligation.obligation_id || obligation.candidate_id),
    obligation_family: cleanMaterialValue(obligation.obligation_family),
    source_scope: publicSourceScope(obligation.source_layer),
    capability_context: cleanMaterialValue(obligation.capability_overlay_id),
    linked_activity_references: cleanArray(obligation.linked_activity_references),
    matched_behavior_classes: cleanArray(obligation.matched_behavior_codes),
    matched_surfaces: cleanArray(obligation.matched_surface_tokens),
    normalized_name: cleanMaterialValue(obligation.normalized_name),
    what_it_requires: cleanMaterialValue(obligation.what_it_requires),
    target_specific_context: cleanMaterialValue(obligation.target_specific_obligation_context),
    authority_dependency: cleanMaterialValue(obligation.authority_dependency),
    exposure_role_context: cleanMaterialValue(obligation.exposure_role_context),
    obligation_locus: cleanMaterialValue(obligation.obligation_locus),
    trigger_timing: cleanMaterialValue(obligation.obligation_trigger_timing),
    expected_control_signal: cleanMaterialValue(obligation.expected_control_signal),
    control_mechanism_present: cleanMaterialValue(obligation.control_mechanism_present),
    control_posture_status: cleanMaterialValue(obligation.control_posture_status),
    evidence_basis: cleanMaterialValue(obligation.evidence_basis),
    missing_proof: cleanMaterialValue(obligation.missing_proof),
    diligence_question: cleanMaterialValue(obligation.diligence_question),
    derivation_basis: cleanDerivationBasis(obligation.derivation_basis),
    regulatory_context: cleanRegulatoryContext(obligation.regulatory_overlay_refs),
    limitation: cleanMaterialValue(obligation.limitation)
  };
}

function publicSourceScope(value) {
  return String(value || "").toUpperCase() === "OVERLAY" || String(value || "").toUpperCase() === "CAPABILITY_OVERLAY"
    ? "Capability Overlay"
    : "Primary Sector";
}

function cleanArray(value) {
  return (Array.isArray(value) ? value : []).map(cleanMaterialValue);
}

function cleanDerivationBasis(value) {
  return (Array.isArray(value) ? value : []).map((row = {}) => ({
    output_field: cleanMaterialValue(row.output_field),
    material_basis: cleanMaterialValue(row.material_basis),
    limitation: cleanMaterialValue(row.limitation)
  }));
}

function cleanRegulatoryContext(value) {
  return (Array.isArray(value) ? value : []).map((row = {}) => ({
    context_overlay: cleanMaterialValue(row.overlay_id),
    matched_frameworks: cleanArray(row.matched_frameworks),
    context_status: cleanMaterialValue(row.overlay_status)
  }));
}
