import {
  STAGE6_BASIS_CODES,
  STAGE6_COLLECTION_CONTEXTS,
  STAGE6_COMPONENTS,
  STAGE6_CONFIDENCE_VALUES,
  STAGE6_DATA_CATEGORY_TYPES,
  STAGE6_DATA_FLOW_ROLES,
  STAGE6_DATA_SUBJECT_TYPES,
  STAGE6_EVIDENCE_STRENGTH,
  STAGE6_FEATURE_ROLES,
  STAGE6_LIMITATION_IMPACT_CODES,
  STAGE6_LIMITATION_REASON_CODES,
  STAGE6_OUTPUT_CATEGORIES,
  STAGE6_PROCESSING_ACTIONS,
  STAGE6_PROCESSING_PURPOSES,
  STAGE6_RECIPIENT_CATEGORIES,
  STAGE6_REGIME_BASIS_TAGS,
  STAGE6_REGIONS,
  STAGE6_REVIEW_VERSION,
  STAGE6_ROLE_ALLOCATION_VALUES,
  STAGE6_STAGE_ROLE,
  STAGE6_STANDARD_SIGNALS,
  normalizeStage6BasisCodes,
  normalizeStage6Enum,
  uniqueStage6Values
} from "./stage6CanonicalVocabulary.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function compact(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function lower(value = "") {
  return compact(value).toLowerCase();
}

function sourceRecords(input = {}) {
  const records = input?.source_bundle?.raw_footprint?.source_records;
  if (Array.isArray(records) && records.length) return records;
  const evidence = input?.source_bundle?.evidence_buffer;
  if (Array.isArray(evidence) && evidence.length) return evidence;
  const artifacts = input?.source_bundle?.artifact_inventory;
  if (Array.isArray(artifacts) && artifacts.length) return artifacts;
  return [];
}

function sourceRef(record = {}, index = 0) {
  return compact(record.source_record_ref || record.evidence_source_id || record.source_id || record.id) || `SRC_${String(index + 1).padStart(3, "0")}`;
}

export function normalizeStage5FeatureProfile(input = {}) {
  const profile = input?.target_feature_profile?.feature_profile_version ? input.target_feature_profile : input?.target_feature_profile?.target_feature_profile || input?.feature_profile_v2 || {};
  return profile && typeof profile === "object" ? profile : {};
}

function featureById(profile = {}) {
  return new Map(asArray(profile.feature_inventory).map((feature, index) => {
    const featureId = compact(feature?.feature_id) || `F${String(index + 1).padStart(3, "0")}`;
    return [featureId, { ...feature, feature_id: featureId }];
  }));
}

function dataProvenanceRows(profile = {}) {
  if (Array.isArray(profile.data_provenance_map) && profile.data_provenance_map.length) return profile.data_provenance_map;
  const rows = [];
  for (const feature of asArray(profile.feature_inventory)) {
    const featureId = compact(feature?.feature_id);
    for (const [index, provenance] of asArray(feature?.data_provenance).entries()) {
      rows.push({
        provenance_id: compact(provenance?.provenance_id) || `${featureId || "FEATURE"}_DP${String(index + 1).padStart(3, "0")}`,
        feature_id: featureId,
        ...provenance
      });
    }
  }
  return rows;
}

function normalizeFeatureRole(value) {
  const text = compact(value);
  if (text === "CORE") return "core";
  if (text === "SECONDARY") return "supporting";
  return normalizeStage6Enum(text, STAGE6_FEATURE_ROLES);
}

function mapSubjectType(value) {
  const text = lower(value);
  if (/child|minor/.test(text)) return "child_or_minor";
  if (/employee/.test(text)) return "employee";
  if (/contractor/.test(text)) return "contractor";
  if (/developer/.test(text)) return "developer_user";
  if (/visitor|consumer/.test(text)) return "website_visitor";
  if (/business/.test(text)) return "business_contact";
  if (/customer/.test(text)) return "customer_user";
  if (/user/.test(text)) return "end_user";
  return "unknown";
}

function mapCategoryTypes(value) {
  const text = lower(Array.isArray(value) ? value.join(" ") : value);
  const out = [];
  if (/account|identity|profile/.test(text)) out.push("account_data");
  if (/contact|email|phone|address/.test(text)) out.push("contact_data");
  if (/usage|telemetry|analytics/.test(text)) out.push("usage_data");
  if (/device/.test(text)) out.push("device_data");
  if (/network|ip\b|ip address/.test(text)) out.push("network_data");
  if (/location|geo/.test(text)) out.push("location_data");
  if (/prompt|input/.test(text)) out.push("prompt_input");
  if (/upload|file|document/.test(text)) out.push("uploaded_file");
  if (/output|generated|response/.test(text)) out.push("generated_output");
  if (/embed|vector/.test(text)) out.push("embedding_vector");
  if (/log|audit/.test(text)) out.push("action_log");
  if (/payment|billing|card/.test(text)) out.push("payment_data");
  if (/support|ticket/.test(text)) out.push("support_ticket");
  if (/employee|hr/.test(text)) out.push("employee_hr_data");
  if (/creative|work product/.test(text)) out.push("creative_work_product");
  if (/code|repository/.test(text)) out.push("source_code");
  if (/credential|secret|token|password|key/.test(text)) out.push("credential_or_secret");
  if (/confidential|client/.test(text)) out.push("client_confidential_data");
  if (/biometric/.test(text)) out.push("biometric_data");
  if (/health|medical/.test(text)) out.push("health_data");
  if (/financial|finance|bank/.test(text)) out.push("financial_data");
  return uniqueStage6Values(out.length ? out : ["unknown"]).map((item) => normalizeStage6Enum(item, STAGE6_DATA_CATEGORY_TYPES));
}

function mapCollectionContext(value) {
  const text = lower(value);
  if (/customer/.test(text)) return "customer_provided";
  if (/employee/.test(text)) return "employee_provided";
  if (/third|import/.test(text)) return "third_party_imported";
  if (/system|generated/.test(text)) return "system_generated";
  if (/derived|infer/.test(text)) return "derived_or_inferred";
  if (/auto|telemetry|usage|device|network/.test(text)) return "automatically_collected";
  if (/user|provided|public_web/.test(text)) return "user_provided";
  return "unknown";
}

function inferActions(row = {}) {
  const text = lower(`${row.processing_context || ""} ${row.storage_or_retention_signal || ""} ${row.training_or_finetuning_signal || ""} ${row.data_category || ""}`);
  const out = ["collect"];
  if (/store|storage|retention|retain/.test(text)) out.push("store");
  if (/retrieve|search|rag/.test(text)) out.push("retrieve");
  if (/generate|output|response/.test(text)) out.push("generate");
  if (/summar/.test(text)) out.push("summarize");
  if (/classif/.test(text)) out.push("classify");
  if (/embed|vector/.test(text)) out.push("embed");
  if (/rank|score/.test(text)) out.push("rank");
  if (/route|workflow/.test(text)) out.push("route");
  if (/share|transfer|transmit|send/.test(text)) out.push("transmit");
  if (/log|audit/.test(text)) out.push("log");
  if (/monitor/.test(text)) out.push("monitor");
  if (/delete|deletion|erasure/.test(text)) out.push("delete");
  if (/anonymous|aggregate/.test(text)) out.push("aggregate");
  if (/fine.tun|train/.test(text)) out.push("fine_tune");
  return uniqueStage6Values(out).map((item) => normalizeStage6Enum(item, STAGE6_PROCESSING_ACTIONS));
}

function inferPurposes(row = {}) {
  const text = lower(`${row.processing_context || ""} ${row.training_or_finetuning_signal || ""} ${row.data_category || ""}`);
  const out = ["service_delivery"];
  if (/generate|ai|model/.test(text)) out.push("ai_generation");
  if (/personal/.test(text)) out.push("personalization");
  if (/analytics|usage/.test(text)) out.push("analytics");
  if (/security|fraud|abuse/.test(text)) out.push("security");
  if (/billing|payment/.test(text)) out.push("billing");
  if (/support/.test(text)) out.push("support");
  if (/compliance|legal/.test(text)) out.push("compliance");
  if (/improve|product/.test(text)) out.push("product_improvement");
  if (/train|fine.tun/.test(text)) out.push("model_training");
  return uniqueStage6Values(out).map((item) => normalizeStage6Enum(item, STAGE6_PROCESSING_PURPOSES));
}

function signalFromText(value, positivePattern) {
  const text = lower(value);
  if (!text) return "unknown";
  if (/not visible|none|no\b|absent|unknown/.test(text)) return "not_visible";
  return positivePattern.test(text) ? "visible" : "partial";
}

function unknownBlock() {
  return "unknown";
}

function defaultLegalUnitRefs(legalDocumentCartography = {}) {
  return asArray(legalDocumentCartography?.legal_document_index).map((row) => row?.legal_unit_id).filter(Boolean);
}

function surfaceTokensForFeature(profile = {}, featureId) {
  return uniqueStage6Values(asArray(profile.regulated_surface_map).filter((row) => row?.feature_id === featureId).map((row) => row.surface_token));
}

function sourceRefsFor(row = {}) {
  return uniqueStage6Values([...(asArray(row.evidence_refs)), row.source_url].filter(Boolean));
}

function dataSubjectBlock(row = {}) {
  const subjectType = mapSubjectType(row.data_subject);
  return {
    subject_type: normalizeStage6Enum(subjectType, STAGE6_DATA_SUBJECT_TYPES),
    subject_labels: uniqueStage6Values([row.data_subject].filter(Boolean)),
    minor_signal: subjectType === "child_or_minor" ? "visible" : "unknown",
    employee_signal: subjectType === "employee" || subjectType === "contractor" ? "visible" : "unknown",
    customer_signal: ["customer_user", "end_user", "business_contact"].includes(subjectType) ? "visible" : "unknown",
    confidence: normalizeStage6Enum(row.confidence, STAGE6_CONFIDENCE_VALUES)
  };
}

function dataCategoryBlock(row = {}) {
  const categoryTypes = mapCategoryTypes(row.data_category);
  return {
    category_types: categoryTypes,
    personal_data_signal: categoryTypes.includes("unknown") ? "unknown" : "visible",
    sensitive_data_signal: categoryTypes.some((item) => ["biometric_data", "health_data", "financial_data", "credential_or_secret"].includes(item)) ? "visible" : "unknown",
    credential_or_secret_signal: categoryTypes.includes("credential_or_secret") ? "visible" : "unknown",
    client_confidential_signal: categoryTypes.includes("client_confidential_data") ? "visible" : "unknown",
    biometric_signal: categoryTypes.includes("biometric_data") ? "visible" : "unknown",
    financial_data_signal: categoryTypes.includes("financial_data") || categoryTypes.includes("payment_data") ? "visible" : "unknown",
    health_data_signal: categoryTypes.includes("health_data") ? "visible" : "unknown",
    confidence: normalizeStage6Enum(row.confidence, STAGE6_CONFIDENCE_VALUES)
  };
}

function processingBlock(row = {}) {
  return {
    collection_context: normalizeStage6Enum(mapCollectionContext(row.data_origin), STAGE6_COLLECTION_CONTEXTS),
    processing_actions: inferActions(row),
    processing_purpose: inferPurposes(row),
    output_category: normalizeStage6Enum(/output|generated|response/i.test(row.data_category || row.processing_context || "") ? "ai_output" : "unknown", STAGE6_OUTPUT_CATEGORIES),
    storage_signal: signalFromText(row.storage_or_retention_signal, /store|retain|storage|retention/),
    embedding_signal: signalFromText(`${row.processing_context || ""} ${row.data_category || ""}`, /embed|vector/),
    fine_tuning_signal: signalFromText(row.training_or_finetuning_signal, /train|fine.tun/),
    confidence: normalizeStage6Enum(row.confidence, STAGE6_CONFIDENCE_VALUES)
  };
}

function emptyRoleAllocation() {
  return {
    provider_role: unknownBlock(),
    customer_role: unknownBlock(),
    model_provider_role: unknownBlock(),
    subprocessor_role: unknownBlock(),
    third_party_recipient_role: unknownBlock(),
    confidence: "unknown"
  };
}

function regimeRelevanceBlock(row = {}) {
  const categoryTypes = mapCategoryTypes(row.data_category);
  const basisTags = [];
  if (!categoryTypes.includes("unknown")) basisTags.push("personal_data");
  if (categoryTypes.some((item) => ["biometric_data", "health_data", "financial_data", "credential_or_secret"].includes(item))) basisTags.push("sensitive_data");
  if (mapSubjectType(row.data_subject) === "child_or_minor") basisTags.push("children_data");
  if (mapSubjectType(row.data_subject) === "employee") basisTags.push("employee_data");
  if (/train|fine.tun/.test(lower(row.training_or_finetuning_signal))) basisTags.push("training_or_finetuning");
  return {
    gdpr_signal: categoryTypes.includes("unknown") ? "unknown" : "partial",
    uk_gdpr_signal: "unknown",
    ccpa_cpra_signal: "unknown",
    dpdp_signal: categoryTypes.includes("unknown") ? "unknown" : "partial",
    colorado_ai_signal: /ai|model|automated/.test(lower(row.processing_context)) ? "partial" : "unknown",
    eu_ai_act_signal: /ai|model|automated/.test(lower(row.processing_context)) ? "partial" : "unknown",
    basis_tags: uniqueStage6Values(basisTags.length ? basisTags : ["unknown"]).map((item) => normalizeStage6Enum(item, STAGE6_REGIME_BASIS_TAGS)),
    confidence: normalizeStage6Enum(row.confidence, STAGE6_CONFIDENCE_VALUES)
  };
}

function emptyNotice(legalUnitRefs = []) {
  return {
    privacy_notice_signal: "unknown",
    ai_notice_signal: "unknown",
    model_provider_notice_signal: "unknown",
    subprocessor_notice_signal: "unknown",
    notice_legal_unit_refs: legalUnitRefs,
    confidence: legalUnitRefs.length ? "low" : "unknown"
  };
}

function emptyConsentBasis(legalUnitRefs = []) {
  return {
    consent_signal: "unknown",
    contract_signal: "unknown",
    legitimate_interest_signal: "unknown",
    legal_obligation_signal: "unknown",
    withdrawal_signal: "unknown",
    basis_legal_unit_refs: legalUnitRefs,
    confidence: legalUnitRefs.length ? "low" : "unknown"
  };
}

function emptyRights(legalUnitRefs = []) {
  return {
    access_right_signal: "unknown",
    correction_right_signal: "unknown",
    deletion_right_signal: "unknown",
    portability_right_signal: "unknown",
    opt_out_signal: "unknown",
    withdrawal_right_signal: "unknown",
    grievance_signal: "unknown",
    nomination_signal: "unknown",
    rights_legal_unit_refs: legalUnitRefs,
    confidence: legalUnitRefs.length ? "low" : "unknown"
  };
}

function processorChainBlock(profile = {}, featureId, legalUnitRefs = []) {
  const architectureText = asArray(profile.architecture_hints).filter((hint) => !featureId || hint?.feature_id === featureId).map((hint) => `${hint.hint_type || ""} ${hint.hint_value || ""}`).join(" ");
  return {
    model_provider_visible: signalFromText(architectureText, /model|openai|gemini|anthropic/),
    cloud_provider_visible: signalFromText(architectureText, /cloud|aws|gcp|azure|host/),
    payment_provider_visible: signalFromText(architectureText, /payment|stripe|billing/),
    analytics_provider_visible: signalFromText(architectureText, /analytics|telemetry/),
    subprocessor_list_visible: "unknown",
    recipient_categories: uniqueStage6Values([
      /model|openai|gemini|anthropic/i.test(architectureText) ? "model_provider" : "",
      /cloud|aws|gcp|azure|host/i.test(architectureText) ? "cloud_provider" : ""
    ].filter(Boolean).concat("unknown")).map((item) => normalizeStage6Enum(item, STAGE6_RECIPIENT_CATEGORIES)),
    processor_legal_unit_refs: legalUnitRefs,
    confidence: architectureText ? "low" : "unknown"
  };
}

function emptyTransferLocation(legalUnitRefs = []) {
  return {
    cross_border_signal: "unknown",
    regions_visible: ["unknown"].map((item) => normalizeStage6Enum(item, STAGE6_REGIONS)),
    transfer_basis_signal: "unknown",
    data_residency_signal: "unknown",
    location_legal_unit_refs: legalUnitRefs,
    confidence: legalUnitRefs.length ? "low" : "unknown"
  };
}

function retentionDeletionAiBlock(row = {}, legalUnitRefs = []) {
  return {
    retention_period_visible: signalFromText(row.storage_or_retention_signal, /retain|retention|store|storage/),
    deletion_channel_visible: signalFromText(row.storage_or_retention_signal, /delete|erasure|deletion/),
    training_opt_out_visible: signalFromText(row.training_or_finetuning_signal, /opt.out|not train|exclude/),
    embedding_retention_signal: signalFromText(`${row.processing_context || ""} ${row.data_category || ""}`, /embed|vector/),
    fine_tuning_prohibition_signal: signalFromText(row.training_or_finetuning_signal, /not|prohibit|exclude/),
    model_weight_deletion_signal: "unknown",
    ai_architecture_legal_unit_refs: legalUnitRefs,
    confidence: normalizeStage6Enum(row.confidence, STAGE6_CONFIDENCE_VALUES)
  };
}

function emptySecurityAccountability(legalUnitRefs = []) {
  return {
    encryption_signal: "unknown",
    access_control_signal: "unknown",
    audit_log_signal: "unknown",
    breach_notice_signal: "unknown",
    dpo_or_contact_signal: "unknown",
    security_legal_unit_refs: legalUnitRefs,
    confidence: legalUnitRefs.length ? "low" : "unknown"
  };
}

function sourceTraceBlock(row = {}, featureId, provenanceId) {
  const refs = sourceRefsFor(row);
  return {
    feature_refs: uniqueStage6Values([featureId]),
    provenance_refs: uniqueStage6Values([provenanceId]),
    source_refs: refs,
    document_refs: [],
    legal_unit_refs: [],
    basis_codes: normalizeStage6BasisCodes(["stage5_feature_ref", "stage5_data_provenance", "deterministic_seed"]),
    evidence_strength: normalizeStage6Enum(refs.length ? "direct_source" : "inferred_from_stage5", STAGE6_EVIDENCE_STRENGTH)
  };
}

function flowRoleFor(row = {}) {
  const text = lower(`${row.data_origin || ""} ${row.data_category || ""} ${row.processing_context || ""}`);
  if (/output|generated/.test(text)) return "generated_output";
  if (/metadata|telemetry|log|usage/.test(text)) return "system_metadata";
  if (/third|transfer|share|recipient/.test(text)) return "third_party_transfer";
  if (/store|retain|record/.test(text)) return "stored_record";
  if (/derived|infer/.test(text)) return "derived_data";
  return "primary_input";
}

export function buildStage6BDataFlowSeed(input = {}) {
  const profile = normalizeStage5FeatureProfile(input);
  const features = featureById(profile);
  const legalUnitRefs = defaultLegalUnitRefs(input?.legal_document_cartography);
  return dataProvenanceRows(profile).map((row, index) => {
    const featureId = compact(row?.feature_id) || "unknown";
    const provenanceId = compact(row?.provenance_id) || `DP${String(index + 1).padStart(3, "0")}`;
    const feature = features.get(featureId) || {};
    const sourceRefs = sourceRefsFor(row);
    return {
      data_flow_id: `DF${String(index + 1).padStart(3, "0")}`,
      feature_id: featureId,
      provenance_id: provenanceId,
      feature_role: normalizeFeatureRole(feature.feature_role),
      flow_role: normalizeStage6Enum(flowRoleFor(row), STAGE6_DATA_FLOW_ROLES),
      data_subject: dataSubjectBlock(row),
      data_category: dataCategoryBlock(row),
      processing: processingBlock(row),
      role_allocation: emptyRoleAllocation(),
      regime_relevance: regimeRelevanceBlock(row),
      notice: emptyNotice(legalUnitRefs),
      consent_basis: emptyConsentBasis(legalUnitRefs),
      rights: emptyRights(legalUnitRefs),
      processor_chain: processorChainBlock(profile, featureId, legalUnitRefs),
      transfer_location: emptyTransferLocation(legalUnitRefs),
      retention_deletion_ai: retentionDeletionAiBlock(row, legalUnitRefs),
      security_accountability: emptySecurityAccountability(legalUnitRefs),
      source_trace: sourceTraceBlock(row, featureId, provenanceId),
      basis_codes: normalizeStage6BasisCodes(["stage5_feature_ref", "stage5_data_provenance", "deterministic_seed"]),
      source_refs: sourceRefs,
      confidence: normalizeStage6Enum(row.confidence, STAGE6_CONFIDENCE_VALUES)
    };
  });
}

export function buildStage6BFeatureToDataFlowIndex(dataFlowRows = [], targetFeatureProfile = {}) {
  const profile = targetFeatureProfile.feature_profile_version ? targetFeatureProfile : normalizeStage5FeatureProfile({ target_feature_profile: targetFeatureProfile });
  const grouped = new Map();
  for (const row of asArray(dataFlowRows)) {
    const key = row.feature_id || "unknown";
    const current = grouped.get(key) || { feature_id: key, data_flow_ids: [], provenance_ids: [], data_categories: [], surface_tokens: [] };
    current.data_flow_ids.push(row.data_flow_id);
    current.provenance_ids.push(row.provenance_id);
    current.data_categories.push(...asArray(row.data_category?.category_types));
    current.surface_tokens.push(...surfaceTokensForFeature(profile, key));
    grouped.set(key, current);
  }
  return [...grouped.values()].map((item) => ({
    feature_id: item.feature_id,
    data_flow_ids: uniqueStage6Values(item.data_flow_ids),
    provenance_ids: uniqueStage6Values(item.provenance_ids),
    data_categories: uniqueStage6Values(item.data_categories.length ? item.data_categories : ["unknown"]),
    surface_tokens: uniqueStage6Values(item.surface_tokens)
  }));
}

function pushSignal(rows, signalType, signalValue, row) {
  rows.push({
    signal_type: signalType,
    signal_value: normalizeStage6Enum(signalValue, STAGE6_STANDARD_SIGNALS),
    data_flow_ids: uniqueStage6Values([row.data_flow_id]),
    feature_ids: uniqueStage6Values([row.feature_id]),
    legal_unit_ids: uniqueStage6Values(row.source_trace?.legal_unit_refs || [])
  });
}

export function buildStage6BDataSignalIndex(dataFlowRows = []) {
  const rows = [];
  for (const row of asArray(dataFlowRows)) {
    pushSignal(rows, "personal_data", row.data_category?.personal_data_signal || "unknown", row);
    pushSignal(rows, "sensitive_data", row.data_category?.sensitive_data_signal || "unknown", row);
    pushSignal(rows, "training_or_finetuning", row.processing?.fine_tuning_signal || row.retention_deletion_ai?.training_opt_out_visible || "unknown", row);
    pushSignal(rows, "processor_chain", row.processor_chain?.subprocessor_list_visible || "unknown", row);
    pushSignal(rows, "cross_border_transfer", row.transfer_location?.cross_border_signal || "unknown", row);
    pushSignal(rows, "deletion", row.retention_deletion_ai?.deletion_channel_visible || "unknown", row);
    pushSignal(rows, "notice", row.notice?.privacy_notice_signal || "unknown", row);
  }
  return rows;
}

export function deriveStage6BDataProfileSummarySignals(dataFlowRows = []) {
  const has = (predicate) => dataFlowRows.some(predicate);
  return {
    personal_data_visible: has((row) => row.data_category?.personal_data_signal === "visible") ? "visible" : (dataFlowRows.length ? "partial" : "unknown"),
    sensitive_data_visible: has((row) => row.data_category?.sensitive_data_signal === "visible") ? "visible" : "unknown",
    children_data_visible: has((row) => row.data_subject?.minor_signal === "visible") ? "visible" : "unknown",
    cross_border_visible: has((row) => row.transfer_location?.cross_border_signal === "visible") ? "visible" : "unknown",
    subprocessor_visible: has((row) => row.processor_chain?.subprocessor_list_visible === "visible") ? "visible" : "unknown",
    training_or_finetuning_visible: has((row) => row.processing?.fine_tuning_signal === "visible") ? "visible" : "unknown",
    deletion_channel_visible: has((row) => row.retention_deletion_ai?.deletion_channel_visible === "visible") ? "visible" : "unknown",
    automated_decision_visible: has((row) => row.processing?.output_category === "automated_action") ? "visible" : "unknown"
  };
}

export function buildStage6BDataProfileLimitations(input = {}, dataFlowRows = []) {
  const profile = normalizeStage5FeatureProfile(input);
  const provenanceCount = dataProvenanceRows(profile).length;
  const limitations = [];
  if (!provenanceCount) {
    limitations.push({
      limitation_id: "S6B_LIM_001",
      scope: "data_flow_profile",
      reason_code: normalizeStage6Enum("stage5_signal_unknown", STAGE6_LIMITATION_REASON_CODES),
      impact_code: normalizeStage6Enum("partial_navigation_only", STAGE6_LIMITATION_IMPACT_CODES),
      confidence: "medium"
    });
  }
  if (provenanceCount && !dataFlowRows.length) {
    limitations.push({
      limitation_id: "S6B_LIM_002",
      scope: "data_flow_profile",
      reason_code: normalizeStage6Enum("model_skipped", STAGE6_LIMITATION_REASON_CODES),
      impact_code: normalizeStage6Enum("requires_source_line_read", STAGE6_LIMITATION_IMPACT_CODES),
      confidence: "high"
    });
  }
  return limitations;
}

export function buildStage6BDataProvenanceSkeleton(input = {}) {
  const profile = normalizeStage5FeatureProfile(input);
  const dataFlowRows = buildStage6BDataFlowSeed(input);
  return {
    stage6_review_version: STAGE6_REVIEW_VERSION,
    stage6_component: STAGE6_COMPONENTS[1],
    stage_role: STAGE6_STAGE_ROLE,
    input_refs: {
      target_profile_version: input?.target_profile?.target_profile_version || input?.company_profile?.target_profile_version || "unknown",
      feature_profile_version: profile.feature_profile_version || "unknown",
      source_bundle_version: input?.source_bundle?.source_bundle_version || input?.source_bundle?.source_review?.source_bundle_version || "unknown"
    },
    data_provenance_profile: {
      data_provenance_profile_version: "data_provenance_profile_v1",
      data_flow_profile: dataFlowRows,
      data_profile_summary_signals: deriveStage6BDataProfileSummarySignals(dataFlowRows),
      data_profile_limitations: buildStage6BDataProfileLimitations(input, dataFlowRows)
    },
    stage7_navigation_index: {
      feature_to_data_flow_index: buildStage6BFeatureToDataFlowIndex(dataFlowRows, profile),
      feature_to_legal_unit_index: [],
      control_family_index: [],
      data_signal_index: buildStage6BDataSignalIndex(dataFlowRows),
      legal_unit_source_locator_index: [],
      absence_unknown_index: [],
      fallback_source_packet: []
    },
    stage6_limitations: []
  };
}

export const stage6bDataProvenanceBuilderInternals = {
  STAGE6_BASIS_CODES,
  buildStage6BDataFlowSeed,
  dataProvenanceRows,
  featureById,
  sourceRecords
};
