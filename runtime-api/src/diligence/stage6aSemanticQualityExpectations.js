import {
  STAGE6_CONTROL_FAMILIES,
  STAGE6_CONTROL_SIGNALS
} from "./stage6CanonicalVocabulary.js";

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function issue(severity, code, path, message, params = {}) {
  return { severity, code, path, message, params };
}

function featureCount(input = {}) {
  const profile = input?.target_feature_profile || input?.feature_profile_v2 || {};
  return arr(profile.feature_inventory).length;
}

function hasDocType(inventory = [], types = []) {
  const allowed = new Set(types);
  return arr(inventory).some((row) => allowed.has(row?.document_type));
}

function controlFamilies(controls = []) {
  return new Set(arr(controls).map((row) => row?.control_family).filter(Boolean));
}

function countUnknownLegalUnits(units = []) {
  return arr(units).filter((row) => row?.section_function === "unknown" || row?.legal_unit_type === "unknown").length;
}

function countUnknownControls(controls = []) {
  return arr(controls).filter((row) => row?.control_family === "unknown" || row?.control_signal === "unknown" || row?.confidence === "unknown").length;
}

function missingAny(families, expected = []) {
  return expected.filter((family) => !families.has(family));
}

function hasAny(families, expected = []) {
  return expected.some((family) => families.has(family));
}

export function evaluateStage6AQualityExpectations(stage6Review = {}, { input = {}, semanticModelAttempted = null } = {}) {
  const issues = [];
  const cartography = obj(stage6Review.legal_document_cartography);
  const navigation = obj(stage6Review.stage7_navigation_index);
  const inventory = arr(cartography.legal_document_inventory);
  const units = arr(cartography.legal_document_index);
  const controls = arr(cartography.document_control_signal_map);
  const featureLinks = arr(navigation.feature_to_legal_unit_index);
  const families = controlFamilies(controls);
  const stage5Features = featureCount(input);

  if (!inventory.length) return issues;

  if (units.length && controls.length === 0) {
    issues.push(issue(
      "repairable",
      "STAGE6A_THIN_CONTROL_MAP_REPAIR_REQUIRED",
      "/legal_document_cartography/document_control_signal_map",
      "Legal units exist but Stage 6A emitted no control signal rows; the semantic pass should classify visible/partial/absent controls instead of leaving the map empty.",
      { legal_unit_count: units.length }
    ));
  }

  if (stage5Features > 0 && controls.length > 0 && featureLinks.length === 0) {
    issues.push(issue(
      "repairable",
      "STAGE6A_FEATURE_LEGAL_UNIT_INDEX_REPAIR_REQUIRED",
      "/stage7_navigation_index/feature_to_legal_unit_index",
      "Stage 5 features and Stage 6A legal controls exist, but no feature-to-legal-unit navigation rows were emitted.",
      { stage5_feature_count: stage5Features, control_count: controls.length }
    ));
  }

  if (hasDocType(inventory, ["privacy_policy", "dpa", "data_deletion_page", "dsr_page"])) {
    const corePrivacyControls = ["privacy_notice", "data_collection", "data_use", "data_subject_rights"];
    if (!hasAny(families, corePrivacyControls)) {
      issues.push(issue(
        "repairable",
        "STAGE6A_PRIVACY_CONTROLS_MISSING",
        "/legal_document_cartography/document_control_signal_map",
        "Privacy/DPA-type documents exist but no core privacy/data control families were mapped.",
        { expected_any_of: corePrivacyControls }
      ));
    }
  }

  if (hasDocType(inventory, ["tos", "terms_page", "developer_terms", "api_terms", "eula", "aup"])) {
    if (!hasAny(families, ["acceptable_use", "prohibited_use"])) {
      issues.push(issue(
        "repairable",
        "STAGE6A_USE_RESTRICTION_CONTROLS_MISSING",
        "/legal_document_cartography/document_control_signal_map",
        "Terms/EULA/AUP-type documents exist but acceptable-use/prohibited-use controls were not mapped.",
        { expected_any_of: ["acceptable_use", "prohibited_use"] }
      ));
    }
    if (!hasAny(families, ["ip_ownership", "warranty_disclaimer", "liability_cap", "commercial_terms", "dispute_terms"])) {
      issues.push(issue(
        "warning",
        "STAGE6A_TERMS_CONTROL_SURFACE_THIN",
        "/legal_document_cartography/document_control_signal_map",
        "Terms/EULA-type documents exist but commercial/IP/warranty/liability/dispute controls look thin.",
        { expected_any_of: ["ip_ownership", "warranty_disclaimer", "liability_cap", "commercial_terms", "dispute_terms"] }
      ));
    }
  }

  if (hasDocType(inventory, ["trust_center", "security_page"]) && !families.has("security_safeguards")) {
    issues.push(issue(
      "repairable",
      "STAGE6A_SECURITY_CONTROLS_MISSING",
      "/legal_document_cartography/document_control_signal_map",
      "Trust/security documents exist but security_safeguards was not mapped.",
      { expected: "security_safeguards" }
    ));
  }

  if (hasDocType(inventory, ["status_page"]) && !families.has("sla_performance")) {
    issues.push(issue(
      "warning",
      "STAGE6A_STATUS_CONTROL_THIN",
      "/legal_document_cartography/document_control_signal_map",
      "Status page exists but no sla_performance/availability control was mapped; verify whether status evidence is operational-only or SLA-relevant.",
      { expected: "sla_performance" }
    ));
  }

  if (units.length >= 3) {
    const unknownUnitCount = countUnknownLegalUnits(units);
    if (unknownUnitCount / units.length > 0.45) {
      issues.push(issue(
        "repairable",
        "STAGE6A_UNKNOWN_LEGAL_UNIT_OVERUSE",
        "/legal_document_cartography/legal_document_index",
        "Too many legal units remain unknown; apply Stage6A field derivation rules before using unknown.",
        { unknown_unit_count: unknownUnitCount, legal_unit_count: units.length }
      ));
    }
  }

  if (controls.length >= 3) {
    const unknownControlCount = countUnknownControls(controls);
    if (unknownControlCount / controls.length > 0.35) {
      issues.push(issue(
        "repairable",
        "STAGE6A_UNKNOWN_CONTROL_OVERUSE",
        "/legal_document_cartography/document_control_signal_map",
        "Too many control rows have unknown family/signal/confidence; visible, partial, absent_after_search, unclear, or not_applicable should be used where supported.",
        { unknown_control_count: unknownControlCount, control_count: controls.length }
      ));
    }
  }

  arr(controls).forEach((row, index) => {
    if (!STAGE6_CONTROL_FAMILIES.includes(row?.control_family)) {
      issues.push(issue("warning", "STAGE6A_CONTROL_FAMILY_DRIFT", `/legal_document_cartography/document_control_signal_map/${index}/control_family`, "Control family is outside the Stage 6 vocabulary.", { value: row?.control_family }));
    }
    if (!STAGE6_CONTROL_SIGNALS.includes(row?.control_signal)) {
      issues.push(issue("warning", "STAGE6A_CONTROL_SIGNAL_DRIFT", `/legal_document_cartography/document_control_signal_map/${index}/control_signal`, "Control signal is outside the Stage 6 vocabulary.", { value: row?.control_signal }));
    }
  });

  if (semanticModelAttempted === false && units.length > 0) {
    issues.push(issue(
      "warning",
      "STAGE6A_SEMANTIC_DERIVATION_NOT_ATTEMPTED",
      "/",
      "Stage 6A legal units exist but semantic classification was skipped; deterministic output may be thin.",
      { legal_unit_count: units.length }
    ));
  }

  return issues;
}

export default evaluateStage6AQualityExpectations;
