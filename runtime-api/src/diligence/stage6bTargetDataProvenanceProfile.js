import { normalizeStage5FeatureProfile } from "./stage6bDataProvenanceBuilder.js";

function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function compact(value = "") { return String(value || "").replace(/\s+/g, " ").trim(); }
function norm(value = "") { return compact(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown"; }
function unique(values = []) { return [...new Set(arr(values).filter(Boolean))]; }

function dataProvenanceRows(profile = {}) {
  if (Array.isArray(profile.data_provenance_map) && profile.data_provenance_map.length) return profile.data_provenance_map;
  const rows = [];
  for (const feature of arr(profile.feature_inventory)) {
    const featureId = compact(feature?.feature_id);
    for (const [index, provenance] of arr(feature?.data_provenance).entries()) {
      rows.push({ provenance_id: compact(provenance?.provenance_id) || `${featureId || "FEATURE"}_DP${String(index + 1).padStart(3, "0")}`, feature_id: featureId, ...provenance });
    }
  }
  return rows;
}

function productKey(row = {}) {
  const featureId = compact(row.feature_id || "unknown");
  const provenanceId = compact(row.provenance_id);
  if (provenanceId) return `${featureId}::${provenanceId}`;
  return `${featureId}::${norm(row.data_category)}::${norm(row.processing_context)}`;
}

function flowKey(row = {}) {
  const featureId = compact(row.feature_id || "unknown");
  const provenanceId = compact(row.provenance_id);
  if (provenanceId) return `${featureId}::${provenanceId}`;
  const categories = arr(row.data_category?.category_types).join("_");
  const actions = arr(row.processing?.processing_actions).join("_");
  return `${featureId}::${norm(categories)}::${norm(actions)}`;
}

function productObservedRecord(row = {}) {
  return {
    source_stage: "stage5_target_feature_profile",
    merge_key: productKey(row),
    feature_id: compact(row.feature_id || "unknown"),
    provenance_id: compact(row.provenance_id || ""),
    data_origin: compact(row.data_origin || "unknown"),
    data_subject: compact(row.data_subject || "unknown"),
    data_category: compact(row.data_category || "unknown"),
    processing_context: compact(row.processing_context || "unknown"),
    storage_or_retention_signal: compact(row.storage_or_retention_signal || "not_visible_in_product_sources"),
    training_or_finetuning_signal: compact(row.training_or_finetuning_signal || "not_visible_in_product_sources"),
    source_url: compact(row.source_url || ""),
    evidence_refs: arr(row.evidence_refs),
    confidence: compact(row.confidence || "unknown")
  };
}

function overlayRecord(row = {}) {
  const legalUnitRefs = unique([
    ...arr(row.source_trace?.legal_unit_refs),
    ...arr(row.notice?.notice_legal_unit_refs),
    ...arr(row.consent_basis?.basis_legal_unit_refs),
    ...arr(row.rights?.rights_legal_unit_refs),
    ...arr(row.processor_chain?.processor_legal_unit_refs),
    ...arr(row.transfer_location?.location_legal_unit_refs),
    ...arr(row.retention_deletion_ai?.ai_architecture_legal_unit_refs),
    ...arr(row.security_accountability?.security_legal_unit_refs)
  ]);
  return {
    source_stage: "stage6b_data_provenance",
    merge_key: flowKey(row),
    data_flow_id: compact(row.data_flow_id || ""),
    feature_id: compact(row.feature_id || "unknown"),
    provenance_id: compact(row.provenance_id || ""),
    data_subject: obj(row.data_subject),
    data_category: obj(row.data_category),
    processing: obj(row.processing),
    role_allocation: obj(row.role_allocation),
    regime_relevance: obj(row.regime_relevance),
    notice: obj(row.notice),
    consent_basis: obj(row.consent_basis),
    rights: obj(row.rights),
    processor_chain: obj(row.processor_chain),
    transfer_location: obj(row.transfer_location),
    retention_deletion_ai: obj(row.retention_deletion_ai),
    security_accountability: obj(row.security_accountability),
    legal_unit_refs: legalUnitRefs,
    source_refs: arr(row.source_refs),
    confidence: compact(row.confidence || "unknown")
  };
}

function integratedStatus(product = null, overlay = null) {
  if (product && overlay?.legal_unit_refs?.length) return "PRODUCT_BEHAVIOR_AND_LEGAL_GOVERNANCE_CONTROLS_VISIBLE";
  if (product && overlay) return "PRODUCT_BEHAVIOR_VISIBLE_LEGAL_GOVERNANCE_PARTIAL";
  if (product && !overlay) return "PRODUCT_BEHAVIOR_VISIBLE_LEGAL_GOVERNANCE_NOT_MAPPED";
  if (!product && overlay) return "LEGAL_GOVERNANCE_CONTROL_WITHOUT_STAGE5_PRODUCT_FLOW";
  return "UNKNOWN";
}

function buildFeatureNavigation(overlays = []) {
  return overlays.map((row) => ({
    feature_id: row.feature_id,
    data_flow_id: row.data_flow_id,
    provenance_id: row.provenance_id,
    legal_unit_refs: unique(row.legal_unit_refs)
  })).filter((row) => row.feature_id && row.data_flow_id);
}

export function buildTargetDataProvenanceProfile({ targetFeatureProfile = {}, stage6bReview = {}, legalDocumentCartography = {}, normalizedClassification = null } = {}) {
  const profile = normalizeStage5FeatureProfile({ target_feature_profile: targetFeatureProfile });
  const productRecords = dataProvenanceRows(profile).map(productObservedRecord);
  const overlayRecords = arr(stage6bReview?.data_provenance_profile?.data_flow_profile).map(overlayRecord);
  const overlayByKey = new Map(overlayRecords.map((row) => [row.merge_key, row]));
  const productByKey = new Map(productRecords.map((row) => [row.merge_key, row]));
  const integrated = [];

  for (const product of productRecords) {
    const overlay = overlayByKey.get(product.merge_key) || overlayRecords.find((row) => row.feature_id === product.feature_id && (!product.provenance_id || row.provenance_id === product.provenance_id));
    integrated.push({
      merge_key: product.merge_key,
      feature_id: product.feature_id,
      provenance_id: product.provenance_id || overlay?.provenance_id || "",
      data_flow_id: overlay?.data_flow_id || "",
      product_observed_data: product,
      legal_governance_overlay: overlay || null,
      integrated_status: integratedStatus(product, overlay),
      legal_unit_refs: unique(overlay?.legal_unit_refs || []),
      unresolved_gaps: overlay ? [] : ["legal_governance_overlay_not_mapped"]
    });
  }

  for (const overlay of overlayRecords) {
    if (!productByKey.has(overlay.merge_key) && !integrated.some((row) => row.data_flow_id === overlay.data_flow_id)) {
      integrated.push({
        merge_key: overlay.merge_key,
        feature_id: overlay.feature_id,
        provenance_id: overlay.provenance_id,
        data_flow_id: overlay.data_flow_id,
        product_observed_data: null,
        legal_governance_overlay: overlay,
        integrated_status: integratedStatus(null, overlay),
        legal_unit_refs: unique(overlay.legal_unit_refs),
        unresolved_gaps: ["stage5_product_observed_record_not_found_for_overlay"]
      });
    }
  }

  return {
    target_data_provenance_profile_version: "target_data_provenance_profile_v1",
    profile_policy: {
      stage5_layer: "product_observed_data_behavior_only",
      stage6b_layer: "legal_governance_control_overlay_only",
      merge_is_deterministic: true,
      legal_governance_source_firewall: "legal_profile_and_governance_profile_lossless_only"
    },
    product_observed_data_layer: { source_stage: "stage5_target_feature_profile", records: productRecords },
    legal_governance_control_layer: { source_stage: "stage6b_data_provenance", records: overlayRecords },
    integrated_feature_data_flow_profile: integrated,
    feature_to_legal_unit_navigation: buildFeatureNavigation(overlayRecords),
    data_signal_index: arr(stage6bReview?.stage7_navigation_index?.data_signal_index),
    normalisation_log: {
      merge_key_primary: "feature_id + provenance_id",
      merge_key_fallback: "feature_id + normalised data_category + normalised processing_context",
      product_record_count: productRecords.length,
      overlay_record_count: overlayRecords.length,
      integrated_record_count: integrated.length,
      legal_document_unit_count: arr(legalDocumentCartography?.legal_document_index).length,
      semantic_classification_row_count: arr(normalizedClassification?.data_flow_classification).length
    },
    limitations: arr(stage6bReview?.data_provenance_profile?.data_profile_limitations)
  };
}

export const stage6bTargetDataProvenanceProfileInternals = { dataProvenanceRows, productKey, flowKey, productObservedRecord, overlayRecord, integratedStatus };
