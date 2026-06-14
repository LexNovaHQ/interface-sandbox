import {
  STAGE6_COLLECTION_CONTEXTS,
  STAGE6_CONFIDENCE_VALUES,
  STAGE6_DATA_CATEGORY_TYPES,
  STAGE6_DATA_SUBJECT_TYPES,
  STAGE6_LIMITATION_IMPACT_CODES,
  STAGE6_LIMITATION_REASON_CODES,
  STAGE6_OUTPUT_CATEGORIES,
  STAGE6_PROCESSING_ACTIONS,
  STAGE6_PROCESSING_PURPOSES,
  STAGE6_RECIPIENT_CATEGORIES,
  STAGE6_REGIME_BASIS_TAGS,
  STAGE6_REGIONS,
  STAGE6_ROLE_ALLOCATION_VALUES,
  STAGE6_STANDARD_SIGNALS,
  normalizeStage6Enum,
  uniqueStage6Values
} from "./stage6CanonicalVocabulary.js";

const FORBIDDEN_SEMANTIC_CLASSIFICATION_KEYS = new Set([
  "stage6_review_version",
  "stage_role",
  "input_refs",
  "feature_id",
  "provenance_id",
  "source_refs",
  "document_refs",
  "legal_unit_refs",
  "basis_codes",
  "stage7_navigation_index",
  "feature_to_data_flow_index",
  "data_signal_index",
  "data_profile_summary_signals",
  "data_profile_limitations",
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
    dataFlowIds: new Set(asArray(packet.data_flow_seed).map((item) => item.data_flow_id).filter(Boolean))
  };
}

function signal(value) {
  return normalizeStage6Enum(value, STAGE6_STANDARD_SIGNALS);
}

function confidence(value) {
  return normalizeStage6Enum(value, STAGE6_CONFIDENCE_VALUES);
}

function enumList(value, vocabulary) {
  const normalized = uniqueStage6Values(value).map((item) => normalizeStage6Enum(item, vocabulary)).filter((item) => item !== "unknown");
  return normalized.length ? normalized : ["unknown"];
}

function normalizeDataSubject(value = {}) {
  return {
    subject_type: normalizeStage6Enum(value.subject_type, STAGE6_DATA_SUBJECT_TYPES),
    subject_labels: uniqueStage6Values(value.subject_labels),
    minor_signal: signal(value.minor_signal),
    employee_signal: signal(value.employee_signal),
    customer_signal: signal(value.customer_signal),
    confidence: confidence(value.confidence)
  };
}

function normalizeDataCategory(value = {}) {
  return {
    category_types: enumList(value.category_types, STAGE6_DATA_CATEGORY_TYPES),
    personal_data_signal: signal(value.personal_data_signal),
    sensitive_data_signal: signal(value.sensitive_data_signal),
    credential_or_secret_signal: signal(value.credential_or_secret_signal),
    client_confidential_signal: signal(value.client_confidential_signal),
    biometric_signal: signal(value.biometric_signal),
    financial_data_signal: signal(value.financial_data_signal),
    health_data_signal: signal(value.health_data_signal),
    confidence: confidence(value.confidence)
  };
}

function normalizeProcessing(value = {}) {
  return {
    collection_context: normalizeStage6Enum(value.collection_context, STAGE6_COLLECTION_CONTEXTS),
    processing_actions: enumList(value.processing_actions, STAGE6_PROCESSING_ACTIONS),
    processing_purpose: enumList(value.processing_purpose, STAGE6_PROCESSING_PURPOSES),
    output_category: normalizeStage6Enum(value.output_category, STAGE6_OUTPUT_CATEGORIES),
    storage_signal: signal(value.storage_signal),
    embedding_signal: signal(value.embedding_signal),
    fine_tuning_signal: signal(value.fine_tuning_signal),
    confidence: confidence(value.confidence)
  };
}

function normalizeRoleAllocation(value = {}) {
  return {
    provider_role: normalizeStage6Enum(value.provider_role, STAGE6_ROLE_ALLOCATION_VALUES),
    customer_role: normalizeStage6Enum(value.customer_role, STAGE6_ROLE_ALLOCATION_VALUES),
    model_provider_role: normalizeStage6Enum(value.model_provider_role, STAGE6_ROLE_ALLOCATION_VALUES),
    subprocessor_role: normalizeStage6Enum(value.subprocessor_role, STAGE6_ROLE_ALLOCATION_VALUES),
    third_party_recipient_role: normalizeStage6Enum(value.third_party_recipient_role, STAGE6_ROLE_ALLOCATION_VALUES),
    confidence: confidence(value.confidence)
  };
}

function normalizeRegimeRelevance(value = {}) {
  return {
    gdpr_signal: signal(value.gdpr_signal),
    uk_gdpr_signal: signal(value.uk_gdpr_signal),
    ccpa_cpra_signal: signal(value.ccpa_cpra_signal),
    dpdp_signal: signal(value.dpdp_signal),
    colorado_ai_signal: signal(value.colorado_ai_signal),
    eu_ai_act_signal: signal(value.eu_ai_act_signal),
    basis_tags: enumList(value.basis_tags, STAGE6_REGIME_BASIS_TAGS),
    confidence: confidence(value.confidence)
  };
}

function normalizeNotice(value = {}) {
  return {
    privacy_notice_signal: signal(value.privacy_notice_signal),
    ai_notice_signal: signal(value.ai_notice_signal),
    model_provider_notice_signal: signal(value.model_provider_notice_signal),
    subprocessor_notice_signal: signal(value.subprocessor_notice_signal),
    confidence: confidence(value.confidence)
  };
}

function normalizeConsentBasis(value = {}) {
  return {
    consent_signal: signal(value.consent_signal),
    contract_signal: signal(value.contract_signal),
    legitimate_interest_signal: signal(value.legitimate_interest_signal),
    legal_obligation_signal: signal(value.legal_obligation_signal),
    withdrawal_signal: signal(value.withdrawal_signal),
    confidence: confidence(value.confidence)
  };
}

function normalizeRights(value = {}) {
  return {
    access_right_signal: signal(value.access_right_signal),
    correction_right_signal: signal(value.correction_right_signal),
    deletion_right_signal: signal(value.deletion_right_signal),
    portability_right_signal: signal(value.portability_right_signal),
    opt_out_signal: signal(value.opt_out_signal),
    withdrawal_right_signal: signal(value.withdrawal_right_signal),
    grievance_signal: signal(value.grievance_signal),
    nomination_signal: signal(value.nomination_signal),
    confidence: confidence(value.confidence)
  };
}

function normalizeProcessorChain(value = {}) {
  return {
    model_provider_visible: signal(value.model_provider_visible),
    cloud_provider_visible: signal(value.cloud_provider_visible),
    payment_provider_visible: signal(value.payment_provider_visible),
    analytics_provider_visible: signal(value.analytics_provider_visible),
    subprocessor_list_visible: signal(value.subprocessor_list_visible),
    recipient_categories: enumList(value.recipient_categories, STAGE6_RECIPIENT_CATEGORIES),
    confidence: confidence(value.confidence)
  };
}

function normalizeTransferLocation(value = {}) {
  return {
    cross_border_signal: signal(value.cross_border_signal),
    regions_visible: enumList(value.regions_visible, STAGE6_REGIONS),
    transfer_basis_signal: signal(value.transfer_basis_signal),
    data_residency_signal: signal(value.data_residency_signal),
    confidence: confidence(value.confidence)
  };
}

function normalizeRetentionDeletionAi(value = {}) {
  return {
    retention_period_visible: signal(value.retention_period_visible),
    deletion_channel_visible: signal(value.deletion_channel_visible),
    training_opt_out_visible: signal(value.training_opt_out_visible),
    embedding_retention_signal: signal(value.embedding_retention_signal),
    fine_tuning_prohibition_signal: signal(value.fine_tuning_prohibition_signal),
    model_weight_deletion_signal: signal(value.model_weight_deletion_signal),
    confidence: confidence(value.confidence)
  };
}

function normalizeSecurityAccountability(value = {}) {
  return {
    encryption_signal: signal(value.encryption_signal),
    access_control_signal: signal(value.access_control_signal),
    audit_log_signal: signal(value.audit_log_signal),
    breach_notice_signal: signal(value.breach_notice_signal),
    dpo_or_contact_signal: signal(value.dpo_or_contact_signal),
    confidence: confidence(value.confidence)
  };
}

function normalizeDataFlowRows(rows, refs, repairs) {
  const output = [];
  for (const [index, row] of asArray(rows).entries()) {
    const dataFlowId = compact(row?.data_flow_id);
    if (!refs.dataFlowIds.has(dataFlowId)) {
      issue(repairs, "drop_data_flow_classification_unknown_ref", { index, data_flow_id: dataFlowId || "missing" });
      continue;
    }
    output.push({
      data_flow_id: dataFlowId,
      data_subject: normalizeDataSubject(row?.data_subject || {}),
      data_category: normalizeDataCategory(row?.data_category || {}),
      processing: normalizeProcessing(row?.processing || {}),
      role_allocation: normalizeRoleAllocation(row?.role_allocation || {}),
      regime_relevance: normalizeRegimeRelevance(row?.regime_relevance || {}),
      notice: normalizeNotice(row?.notice || {}),
      consent_basis: normalizeConsentBasis(row?.consent_basis || {}),
      rights: normalizeRights(row?.rights || {}),
      processor_chain: normalizeProcessorChain(row?.processor_chain || {}),
      transfer_location: normalizeTransferLocation(row?.transfer_location || {}),
      retention_deletion_ai: normalizeRetentionDeletionAi(row?.retention_deletion_ai || {}),
      security_accountability: normalizeSecurityAccountability(row?.security_accountability || {}),
      confidence: confidence(row?.confidence)
    });
  }
  return output;
}

function normalizeLimitations(rows, repairs) {
  return asArray(rows).map((row, index) => ({
    limitation_id: compact(row?.limitation_id) || `S6B_MODEL_LIM_${String(index + 1).padStart(3, "0")}`,
    scope: compact(row?.scope || "semantic_classification"),
    reason_code: normalizeStage6Enum(row?.reason_code, STAGE6_LIMITATION_REASON_CODES),
    impact_code: normalizeStage6Enum(row?.impact_code, STAGE6_LIMITATION_IMPACT_CODES),
    confidence: confidence(row?.confidence)
  }));
}

export function normalizeStage6BDataProvenanceClassification(rawClassification = {}, packet = {}) {
  const repairs = [];
  for (const hit of findForbiddenKeys(rawClassification)) issue(repairs, "forbidden_key_removed_from_semantic_classification", hit);
  const refs = packetRefs(packet);
  const normalized = {
    semantic_classification_version: "stage6_semantic_classification_v1",
    stage6_component: "stage6b_data_provenance",
    data_flow_classification: normalizeDataFlowRows(rawClassification?.data_flow_classification, refs, repairs),
    classification_limitations: normalizeLimitations(rawClassification?.classification_limitations, repairs)
  };
  return { classification: normalized, repairs };
}

export const stage6bDataProvenanceNormalizerInternals = {
  FORBIDDEN_SEMANTIC_CLASSIFICATION_KEYS,
  findForbiddenKeys,
  packetRefs
};
