import { artifactRoot } from "./phase12-report-contract.js";
import { cleanMaterialValue } from "./phase12-profile-normalizer.js";

export const PHASE12_ACTIVITY_PRESENTATION_SCHEMA = "phase12_activity_presentation.v1";
export const ACTIVITY_TABLE_PAGE_SIZE = 10;
export const ACTIVITY_DECK_PAGE_SIZE = 5;

export const ACTIVITY_PRESENTATION_FIELDS = Object.freeze([
  "activity_reference",
  "product_service_wrapper",
  "activity_feature_name",
  "activity_candidate_summary",
  "mechanics_proof",
  "autonomy_human_control_signal",
  "data_content_object_touched",
  "external_internal_action_signal",
  "primary_classification",
  "overlay_classifications"
]);

export function injectPhase12ActivityPresentation({ section, artifacts = {}, custody = null } = {}) {
  if (!section) return section;
  const source = artifactRoot(artifacts.target_feature_profile, "target_feature_profile");
  const activities = Array.isArray(source.activities) ? source.activities : [];
  const rows = activities.map(projectActivityRow);

  section.activity_register = {
    schema_version: PHASE12_ACTIVITY_PRESENTATION_SCHEMA,
    presentation_only: true,
    substantive_derivation_performed: false,
    source_profile: "target_feature_profile",
    row_count: rows.length,
    table_rows_per_page: ACTIVITY_TABLE_PAGE_SIZE,
    deck_cards_per_page: ACTIVITY_DECK_PAGE_SIZE,
    primary_overlay_collapse_forbidden: true,
    classification_paths: {
      primary_behavior_class: "primary_classification.behavior_class_codes",
      primary_surface: "primary_classification.surface_context_tokens",
      overlay_behavior_class: "overlay_classifications[].behavior_class_codes",
      overlay_surface: "overlay_classifications[].surface_context_tokens"
    },
    rows
  };

  section.summary = {
    ...(section.summary || {}),
    activity_row_count: rows.length,
    primary_overlay_classification_separation_preserved: true
  };

  if (custody?.profile_family_bindings) {
    custody.profile_family_bindings.push({
      report_section: "04",
      source_artifact: "target_feature_profile",
      projection_mode: "CLEAN_ACTIVITY_PRESENTATION_REGISTER",
      activity_row_count: rows.length
    });
  }
  return section;
}

export function assertPhase12ActivityPresentation(section = {}) {
  const register = section.activity_register || {};
  const failures = [];
  if (register.schema_version !== PHASE12_ACTIVITY_PRESENTATION_SCHEMA) failures.push("SECTION4_ACTIVITY_PRESENTATION_SCHEMA_INVALID");
  if (register.presentation_only !== true) failures.push("SECTION4_ACTIVITY_PRESENTATION_NOT_PRESENTATION_ONLY");
  if (register.substantive_derivation_performed !== false) failures.push("SECTION4_ACTIVITY_PRESENTATION_DERIVATION_NOT_FORBIDDEN");
  if (register.table_rows_per_page !== ACTIVITY_TABLE_PAGE_SIZE) failures.push("SECTION4_ACTIVITY_TABLE_PAGE_SIZE_INVALID");
  if (register.deck_cards_per_page !== ACTIVITY_DECK_PAGE_SIZE) failures.push("SECTION4_ACTIVITY_DECK_PAGE_SIZE_INVALID");
  if (register.primary_overlay_collapse_forbidden !== true) failures.push("SECTION4_PRIMARY_OVERLAY_COLLAPSE_NOT_FORBIDDEN");
  if (!Array.isArray(register.rows)) failures.push("SECTION4_ACTIVITY_ROWS_MISSING");

  for (const [index, row] of (register.rows || []).entries()) {
    for (const key of ACTIVITY_PRESENTATION_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(row, key)) failures.push(`SECTION4_ACTIVITY_FIELD_MISSING:${index}:${key}`);
    }
    if (!row.primary_classification || typeof row.primary_classification !== "object" || Array.isArray(row.primary_classification)) failures.push(`SECTION4_PRIMARY_CLASSIFICATION_INVALID:${index}`);
    if (!Array.isArray(row.overlay_classifications)) failures.push(`SECTION4_OVERLAY_CLASSIFICATIONS_INVALID:${index}`);
    if (Object.prototype.hasOwnProperty.call(row, "behavior_class") || Object.prototype.hasOwnProperty.call(row, "surface")) failures.push(`SECTION4_COLLAPSED_CLASSIFICATION_FIELD_FORBIDDEN:${index}`);
  }

  if (failures.length) throw new Error(`PHASE12_ACTIVITY_PRESENTATION_INVALID:${failures.join("|")}`);
  return register;
}

function projectActivityRow(activity = {}) {
  const row = {};
  for (const key of ACTIVITY_PRESENTATION_FIELDS) row[key] = cleanMaterialValue(activity[key]);
  row.primary_classification = normalizePrimaryClassification(row.primary_classification);
  row.overlay_classifications = normalizeOverlayClassifications(row.overlay_classifications);
  return row;
}

function normalizePrimaryClassification(value) {
  const root = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    package_id: cleanMaterialValue(root.package_id),
    behavior_class_codes: array(root.behavior_class_codes).map(cleanMaterialValue),
    behavior_class_derivation_basis: array(root.behavior_class_derivation_basis).map(cleanMaterialValue),
    surface_context_tokens: array(root.surface_context_tokens).map(cleanMaterialValue),
    surface_derivation_basis: array(root.surface_derivation_basis).map(cleanMaterialValue)
  };
}

function normalizeOverlayClassifications(value) {
  return array(value).map((overlay = {}) => ({
    package_id: cleanMaterialValue(overlay.package_id),
    overlay_id: cleanMaterialValue(overlay.overlay_id),
    behavior_class_codes: array(overlay.behavior_class_codes).map(cleanMaterialValue),
    behavior_class_derivation_basis: array(overlay.behavior_class_derivation_basis).map(cleanMaterialValue),
    surface_context_tokens: array(overlay.surface_context_tokens).map(cleanMaterialValue),
    surface_derivation_basis: array(overlay.surface_derivation_basis).map(cleanMaterialValue)
  }));
}

function array(value) { return Array.isArray(value) ? value : []; }
