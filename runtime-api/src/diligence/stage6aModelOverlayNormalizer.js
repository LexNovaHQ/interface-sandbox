import { stage6aModelOverlayPacketBuilderInternals } from "./stage6aModelOverlayPacketBuilder.js";

const { ALLOWED_ENUMS } = stage6aModelOverlayPacketBuilderInternals;

const FORBIDDEN_MODEL_OVERLAY_KEYS = new Set([
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

const LIMITATION_SCOPES = new Set(["section_classification", "document_relationship", "document_control", "document_mismatch", "feature_section", "unknown"]);
const LIMITATION_REASONS = new Set(["insufficient_text_window", "section_ref_missing", "feature_ref_missing", "low_confidence_inference", "source_conflicting", "unknown"]);
const LIMITATION_IMPACTS = new Set(["classification_unknown", "relationship_unknown", "control_signal_unknown", "feature_mapping_unknown", "reduces_confidence", "unknown"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function compact(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(values = []) {
  return [...new Set(asArray(values).map(compact).filter(Boolean))];
}

function enumValue(value, allowed = [], fallback = "unknown") {
  const text = compact(value);
  return allowed.includes(text) ? text : fallback;
}

function enumArray(values = [], allowed = []) {
  return unique(values).filter((value) => allowed.includes(value));
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
  Object.keys(value).forEach((key) => {
    if (FORBIDDEN_MODEL_OVERLAY_KEYS.has(key)) hits.push({ path: `${path}.${key}`, key });
    findForbiddenKeys(value[key], `${path}.${key}`, hits);
  });
  return hits;
}

function packetRefs(packet = {}) {
  const sectionIds = new Set(asArray(packet.section_index_seed).map((item) => item.section_id).filter(Boolean));
  const docIds = new Set(asArray(packet.document_inventory_seed).map((item) => item.doc_id).filter(Boolean));
  const featureIds = new Set(asArray(packet.feature_refs).map((item) => item.feature_id).filter(Boolean));
  const sourceRecordRefs = new Set(asArray(packet.document_inventory_seed).map((item) => item.source_record_ref).filter(Boolean));
  const controlSignalIds = new Set(asArray(packet.deterministic_control_seed).map((item) => item.control_signal_id).filter(Boolean));
  return { sectionIds, docIds, featureIds, sourceRecordRefs, controlSignalIds };
}

function refAllowed(type, ref, refs) {
  if (!ref || ref === "unknown") return true;
  switch (type) {
    case "feature": return refs.featureIds.has(ref);
    case "document": return refs.docIds.has(ref);
    case "document_section": return refs.sectionIds.has(ref);
    case "control_signal": return refs.controlSignalIds.has(ref);
    case "source_record": return refs.sourceRecordRefs.has(ref);
    case "unknown": return ref === "unknown";
    default: return false;
  }
}

function normalizeSectionClassificationRows(rows, refs, repairs) {
  const output = [];
  for (const [index, row] of asArray(rows).entries()) {
    const sectionId = compact(row?.section_id);
    if (!refs.sectionIds.has(sectionId)) {
      issue(repairs, "drop_section_overlay_unknown_section_id", { index, section_id: sectionId || "missing" });
      continue;
    }
    output.push({
      section_id: sectionId,
      section_function: enumValue(row?.section_function, ALLOWED_ENUMS.section_function),
      control_families: enumArray(row?.control_families, ALLOWED_ENUMS.control_family),
      coverage_signal: enumValue(row?.coverage_signal, ALLOWED_ENUMS.signal),
      basis_codes: enumArray(row?.basis_codes, ALLOWED_ENUMS.basis_code),
      confidence: enumValue(row?.confidence, ALLOWED_ENUMS.confidence)
    });
  }
  return output;
}

function normalizeRelationshipRows(rows, refs, repairs) {
  const output = [];
  for (const [index, row] of asArray(rows).entries()) {
    const fromDocId = compact(row?.from_doc_id);
    const toDocId = compact(row?.to_doc_id);
    const fromSectionId = compact(row?.from_section_id);
    const toSectionId = compact(row?.to_section_id);
    if (!refs.docIds.has(fromDocId) || !refs.docIds.has(toDocId) || !refs.sectionIds.has(fromSectionId) || !refs.sectionIds.has(toSectionId)) {
      issue(repairs, "drop_relationship_overlay_unknown_ref", { index, from_doc_id: fromDocId, to_doc_id: toDocId, from_section_id: fromSectionId, to_section_id: toSectionId });
      continue;
    }
    output.push({
      relationship_id: compact(row?.relationship_id) || `REL_${String(output.length + 1).padStart(3, "0")}`,
      from_doc_id: fromDocId,
      to_doc_id: toDocId,
      from_section_id: fromSectionId,
      to_section_id: toSectionId,
      relationship_type: enumValue(row?.relationship_type, ALLOWED_ENUMS.relationship_type),
      relationship_signal: enumValue(row?.relationship_signal, ALLOWED_ENUMS.signal),
      section_refs: unique(row?.section_refs).filter((sectionId) => refs.sectionIds.has(sectionId)),
      basis_codes: enumArray(row?.basis_codes, ALLOWED_ENUMS.basis_code),
      confidence: enumValue(row?.confidence, ALLOWED_ENUMS.confidence)
    });
  }
  return output;
}

function normalizeControlRows(rows, refs, repairs) {
  const output = [];
  for (const [index, row] of asArray(rows).entries()) {
    const sectionId = compact(row?.section_id);
    if (!refs.sectionIds.has(sectionId)) {
      issue(repairs, "drop_control_overlay_unknown_section_id", { index, section_id: sectionId || "missing" });
      continue;
    }
    output.push({
      section_id: sectionId,
      control_family: enumValue(row?.control_family, ALLOWED_ENUMS.control_family),
      coverage_signal: enumValue(row?.coverage_signal, ALLOWED_ENUMS.signal),
      feature_refs: unique(row?.feature_refs).filter((featureId) => refs.featureIds.has(featureId)),
      data_flow_refs: [],
      basis_codes: enumArray(row?.basis_codes, ALLOWED_ENUMS.basis_code),
      confidence: enumValue(row?.confidence, ALLOWED_ENUMS.confidence)
    });
  }
  return output;
}

function normalizeMismatchRows(rows, refs, repairs) {
  const output = [];
  for (const [index, row] of asArray(rows).entries()) {
    const leftType = enumValue(row?.left_ref_type, ALLOWED_ENUMS.ref_type);
    const rightType = enumValue(row?.right_ref_type, ALLOWED_ENUMS.ref_type);
    const leftRef = compact(row?.left_ref) || "unknown";
    const rightRef = compact(row?.right_ref) || "unknown";
    if (!refAllowed(leftType, leftRef, refs) || !refAllowed(rightType, rightRef, refs)) {
      issue(repairs, "drop_mismatch_overlay_unknown_ref", { index, left_ref_type: leftType, left_ref: leftRef, right_ref_type: rightType, right_ref: rightRef });
      continue;
    }
    output.push({
      mismatch_id: compact(row?.mismatch_id) || `MM_${String(output.length + 1).padStart(3, "0")}`,
      mismatch_type: enumValue(row?.mismatch_type, ALLOWED_ENUMS.mismatch_type),
      left_ref_type: leftType,
      left_ref: leftRef,
      right_ref_type: rightType,
      right_ref: rightRef,
      control_family: enumValue(row?.control_family, ALLOWED_ENUMS.control_family),
      mismatch_signal: enumValue(row?.mismatch_signal, ALLOWED_ENUMS.signal),
      basis_codes: enumArray(row?.basis_codes, ALLOWED_ENUMS.basis_code),
      confidence: enumValue(row?.confidence, ALLOWED_ENUMS.confidence)
    });
  }
  return output;
}

function normalizeFeatureSectionRows(rows, refs, repairs) {
  const output = [];
  for (const [index, row] of asArray(rows).entries()) {
    const featureId = compact(row?.feature_id);
    if (!refs.featureIds.has(featureId)) {
      issue(repairs, "drop_feature_section_overlay_unknown_feature_id", { index, feature_id: featureId || "missing" });
      continue;
    }
    const sectionIds = unique(row?.section_ids).filter((sectionId) => refs.sectionIds.has(sectionId));
    if (!sectionIds.length) {
      issue(repairs, "drop_feature_section_overlay_no_valid_sections", { index, feature_id: featureId });
      continue;
    }
    output.push({
      feature_id: featureId,
      section_ids: sectionIds,
      control_families: enumArray(row?.control_families, ALLOWED_ENUMS.control_family),
      basis_codes: enumArray(row?.basis_codes, ALLOWED_ENUMS.basis_code),
      confidence: enumValue(row?.confidence, ALLOWED_ENUMS.confidence)
    });
  }
  return output;
}

function normalizeOverlayLimitations(rows, repairs) {
  const output = [];
  for (const [index, row] of asArray(rows).entries()) {
    const limitation = {
      limitation_id: compact(row?.limitation_id) || `OL_${String(output.length + 1).padStart(3, "0")}`,
      scope: enumValue(row?.scope, [...LIMITATION_SCOPES]),
      reason_code: enumValue(row?.reason_code, [...LIMITATION_REASONS]),
      impact_code: enumValue(row?.impact_code, [...LIMITATION_IMPACTS]),
      confidence: enumValue(row?.confidence, ALLOWED_ENUMS.confidence)
    };
    if (limitation.scope === "unknown") issue(repairs, "overlay_limitation_unknown_scope", { index });
    output.push(limitation);
  }
  return output;
}

export function normalizeStage6AModelOverlay(rawOverlay = {}, packet = {}) {
  const repairs = [];
  for (const hit of findForbiddenKeys(rawOverlay)) issue(repairs, "forbidden_key_removed_from_overlay", hit);
  const refs = packetRefs(packet);
  const normalized = {
    stage6a_model_overlay_version: "stage6a_model_overlay_v1",
    section_classification_overlay: normalizeSectionClassificationRows(rawOverlay?.section_classification_overlay, refs, repairs),
    document_relationship_overlay: normalizeRelationshipRows(rawOverlay?.document_relationship_overlay, refs, repairs),
    document_control_overlay: normalizeControlRows(rawOverlay?.document_control_overlay, refs, repairs),
    document_mismatch_overlay: normalizeMismatchRows(rawOverlay?.document_mismatch_overlay, refs, repairs),
    feature_section_overlay: normalizeFeatureSectionRows(rawOverlay?.feature_section_overlay, refs, repairs),
    overlay_limitations: normalizeOverlayLimitations(rawOverlay?.overlay_limitations, repairs)
  };
  return { overlay: normalized, repairs };
}

export const stage6aModelOverlayNormalizerInternals = {
  FORBIDDEN_MODEL_OVERLAY_KEYS,
  enumValue,
  enumArray,
  findForbiddenKeys,
  packetRefs,
  refAllowed
};
