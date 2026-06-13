import {
  STAGE6_CONFIDENCE_VALUES,
  STAGE6_CONTROL_FAMILIES,
  STAGE6_CONTROL_SIGNALS,
  STAGE6_LEGAL_UNIT_TYPES,
  STAGE6_MISMATCH_SIGNALS,
  STAGE6_MISMATCH_TYPES,
  STAGE6_RELATIONSHIP_TYPES,
  STAGE6_SECTION_FUNCTIONS,
  normalizeStage6BasisCodes,
  normalizeStage6Enum,
  uniqueStage6Values
} from "./stage6CanonicalVocabulary.js";

const FORBIDDEN_SEMANTIC_CLASSIFICATION_KEYS = new Set([
  "quote",
  "evidence_quote",
  "excerpt",
  "excerpt_text",
  "narrative",
  "explanation",
  "analysis",
  "legal_conclusion",
  "compliance_verdict",
  "recommendation",
  "control_gap",
  "threat_status",
  "triggered_threat_ids",
  "hunter_status",
  "final_status",
  "html",
  "report"
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function compact(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function issue(repairs, code, detail = {}) {
  repairs.push({ code, ...detail });
}

function findForbiddenKeys(value, path = "root", hits = []) {
  if (!value || typeof value !== "object") return hits;
  if (Array.isArray(value)) {
    value.forEach((item, index) => findForbiddenKeys(item, `${path}[${index}]`, hits));
    return hits;
  }
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_SEMANTIC_CLASSIFICATION_KEYS.has(key)) hits.push({ path: `${path}.${key}`, key });
    findForbiddenKeys(value[key], `${path}.${key}`, hits);
  }
  return hits;
}

function packetRefs(packet = {}) {
  return {
    documentIds: new Set(asArray(packet.document_inventory_seed).map((item) => item.document_id).filter(Boolean)),
    legalUnitIds: new Set(asArray(packet.legal_unit_seed).map((item) => item.legal_unit_id).filter(Boolean)),
    featureIds: new Set(asArray(packet.feature_refs).map((item) => item.feature_id).filter(Boolean)),
    controlSignalIds: new Set(asArray(packet.deterministic_control_seed).map((item) => item.control_signal_id).filter(Boolean))
  };
}

function normalizeLegalUnitRows(rows, refs, repairs) {
  const output = [];
  for (const [index, row] of asArray(rows).entries()) {
    const legalUnitId = compact(row?.legal_unit_id);
    if (!refs.legalUnitIds.has(legalUnitId)) {
      issue(repairs, "drop_semantic_legal_unit_unknown_ref", { index, legal_unit_id: legalUnitId || "missing" });
      continue;
    }
    output.push({
      legal_unit_id: legalUnitId,
      legal_unit_type: normalizeStage6Enum(row?.legal_unit_type, STAGE6_LEGAL_UNIT_TYPES),
      section_function: normalizeStage6Enum(row?.section_function, STAGE6_SECTION_FUNCTIONS),
      control_families_detected: uniqueStage6Values(row?.control_families_detected).map((value) => normalizeStage6Enum(value, STAGE6_CONTROL_FAMILIES)).filter((value) => value !== "unknown"),
      basis_codes: normalizeStage6BasisCodes(row?.basis_codes || []),
      confidence: normalizeStage6Enum(row?.confidence, STAGE6_CONFIDENCE_VALUES)
    });
  }
  return output;
}

function normalizeRelationshipRows(rows, refs, repairs) {
  const output = [];
  for (const [index, row] of asArray(rows).entries()) {
    const fromRef = compact(row?.from_ref);
    const toRef = compact(row?.to_ref);
    if (!fromRef || !toRef) {
      issue(repairs, "drop_relationship_missing_ref", { index });
      continue;
    }
    output.push({
      relationship_id: compact(row?.relationship_id) || `REL_${String(output.length + 1).padStart(3, "0")}`,
      from_ref: fromRef,
      to_ref: toRef,
      relationship_type: normalizeStage6Enum(row?.relationship_type, STAGE6_RELATIONSHIP_TYPES),
      basis_codes: normalizeStage6BasisCodes(row?.basis_codes || ["indirect_policy_signal"]),
      confidence: normalizeStage6Enum(row?.confidence, STAGE6_CONFIDENCE_VALUES)
    });
  }
  return output;
}

function normalizeControlRows(rows, refs, repairs) {
  const output = [];
  for (const [index, row] of asArray(rows).entries()) {
    const legalUnitId = compact(row?.legal_unit_id);
    if (!refs.legalUnitIds.has(legalUnitId)) {
      issue(repairs, "drop_control_unknown_legal_unit_id", { index, legal_unit_id: legalUnitId || "missing" });
      continue;
    }
    output.push({
      legal_unit_id: legalUnitId,
      control_family: normalizeStage6Enum(row?.control_family, STAGE6_CONTROL_FAMILIES),
      control_signal: normalizeStage6Enum(row?.control_signal || row?.coverage_signal, STAGE6_CONTROL_SIGNALS),
      feature_refs: uniqueStage6Values(row?.feature_refs).filter((featureId) => refs.featureIds.has(featureId)),
      data_flow_refs: uniqueStage6Values(row?.data_flow_refs),
      basis_codes: normalizeStage6BasisCodes(row?.basis_codes || []),
      confidence: normalizeStage6Enum(row?.confidence, STAGE6_CONFIDENCE_VALUES)
    });
  }
  return output;
}

function normalizeMismatchRows(rows, refs, repairs) {
  return asArray(rows).map((row, index) => ({
    mismatch_id: compact(row?.mismatch_id) || `MM_${String(index + 1).padStart(3, "0")}`,
    mismatch_type: normalizeStage6Enum(row?.mismatch_type, STAGE6_MISMATCH_TYPES),
    mismatch_signal: normalizeStage6Enum(row?.mismatch_signal, STAGE6_MISMATCH_SIGNALS),
    expected_ref: compact(row?.expected_ref || row?.left_ref || "unknown"),
    actual_ref: compact(row?.actual_ref || row?.right_ref || "") || null,
    control_family: normalizeStage6Enum(row?.control_family, STAGE6_CONTROL_FAMILIES),
    basis_codes: normalizeStage6BasisCodes(row?.basis_codes || []),
    confidence: normalizeStage6Enum(row?.confidence, STAGE6_CONFIDENCE_VALUES)
  }));
}

function normalizeFeatureLegalUnitRows(rows, refs, repairs) {
  const output = [];
  for (const [index, row] of asArray(rows).entries()) {
    const featureId = compact(row?.feature_id);
    if (!refs.featureIds.has(featureId)) {
      issue(repairs, "drop_feature_legal_unit_unknown_feature_id", { index, feature_id: featureId || "missing" });
      continue;
    }
    const legalUnitIds = uniqueStage6Values(row?.legal_unit_ids).filter((legalUnitId) => refs.legalUnitIds.has(legalUnitId));
    if (!legalUnitIds.length) {
      issue(repairs, "drop_feature_legal_unit_no_valid_units", { index, feature_id: featureId });
      continue;
    }
    output.push({
      feature_id: featureId,
      legal_unit_ids: legalUnitIds,
      control_families: uniqueStage6Values(row?.control_families).map((value) => normalizeStage6Enum(value, STAGE6_CONTROL_FAMILIES)).filter((value) => value !== "unknown"),
      basis_codes: normalizeStage6BasisCodes(row?.basis_codes || ["stage5_feature_ref", "stage6_legal_unit_ref"]),
      confidence: normalizeStage6Enum(row?.confidence, STAGE6_CONFIDENCE_VALUES)
    });
  }
  return output;
}

export function normalizeStage6ASemanticClassification(rawClassification = {}, packet = {}) {
  const repairs = [];
  for (const hit of findForbiddenKeys(rawClassification)) issue(repairs, "forbidden_key_removed_from_semantic_classification", hit);
  const refs = packetRefs(packet);
  const normalized = {
    semantic_classification_version: "stage6_semantic_classification_v1",
    stage6_component: "stage6a_legal_document_cartography",
    legal_unit_classification: normalizeLegalUnitRows(rawClassification?.legal_unit_classification, refs, repairs),
    document_relationship_classification: normalizeRelationshipRows(rawClassification?.document_relationship_classification, refs, repairs),
    document_control_classification: normalizeControlRows(rawClassification?.document_control_classification, refs, repairs),
    document_mismatch_classification: normalizeMismatchRows(rawClassification?.document_mismatch_classification, refs, repairs),
    feature_legal_unit_classification: normalizeFeatureLegalUnitRows(rawClassification?.feature_legal_unit_classification, refs, repairs),
    classification_limitations: []
  };
  return { classification: normalized, repairs };
}

export const stage6aSemanticClassificationNormalizerInternals = {
  FORBIDDEN_SEMANTIC_CLASSIFICATION_KEYS,
  findForbiddenKeys,
  packetRefs
};
