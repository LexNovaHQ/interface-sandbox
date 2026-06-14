import { PLATFORM_LEGAL_DILIGENCE_ELEMENTS } from "./reportSectionContentContract.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function unique(values = []) {
  return [...new Set(values.map((value) => asText(value)).filter(Boolean))];
}

function fieldText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(fieldText).join(" ");
  if (typeof value === "object") return Object.values(value).map(fieldText).join(" ");
  return String(value);
}

function includesAny(haystack, needles = []) {
  const lower = fieldText(haystack).toLowerCase();
  return needles.some((needle) => lower.includes(String(needle || "").toLowerCase()));
}

function sourceCategory(source = {}) {
  const text = `${source.source_type || ""} ${source.title || ""} ${source.source_url || ""}`.toLowerCase();
  if (text.includes("privacy")) return "Legal document / privacy evidence";
  if (text.includes("terms") || text.includes("legal")) return "Legal document evidence";
  if (text.includes("security") || text.includes("trust")) return "Security / trust evidence";
  if (text.includes("pricing")) return "Commercial / pricing evidence";
  if (text.includes("blog") || text.includes("docs")) return "Product / technical evidence";
  return "Public product / website evidence";
}

function featureSignal(feature = {}) {
  return {
    feature_id: asText(feature.feature_id),
    feature_name: asText(feature.feature_name || feature.name, "Unnamed product feature"),
    feature_role: asText(feature.feature_role || feature.role, "Role not specified"),
    functional_profile: asText(feature.archetype_labels || feature.archetype_codes || feature.functional_profile, "Functional profile not specified"),
    risk_surfaces: asText(feature.surface_tokens || feature.legal_risk_surfaces, "Risk surface not specified"),
    evidence_source: asText(feature.feature_source_url || feature.source_url)
  };
}

function legalDocumentSignal(doc = {}) {
  return {
    document_id: asText(doc.document_id),
    document_type: asText(doc.document_type || doc.type, "Legal document"),
    document_title: asText(doc.document_title || doc.title),
    document_status: asText(doc.document_status || "unknown"),
    access_status: asText(doc.access_status || "unknown"),
    source_url: asText(doc.source_url || doc.final_url),
    jurisdiction_scope: asArray(doc.jurisdiction_scope),
    confidence: asText(doc.confidence || "unknown")
  };
}

function dataFlowSignal(flow = {}) {
  return {
    data_flow_id: asText(flow.data_flow_id),
    feature_id: asText(flow.feature_id),
    flow_role: asText(flow.flow_role),
    data_subject: flow.data_subject || {},
    data_category: flow.data_category || {},
    processing: flow.processing || {},
    role_allocation: flow.role_allocation || {},
    regime_relevance: flow.regime_relevance || {},
    processor_chain: flow.processor_chain || {},
    source_refs: asArray(flow.source_refs),
    confidence: asText(flow.confidence || "unknown")
  };
}

function exposureSignal(row = {}) {
  return {
    finding_title: row.exposure_title,
    assessment_outcome: row.assessment_outcome,
    legal_risk_surfaces: row.legal_risk_surfaces,
    severity: row.severity?.label,
    timing_urgency: row.timing_urgency?.label,
    evidence_reference: row.reviewed_evidence?.evidence_reference
  };
}

function linkedRowsForElement(element, rows = []) {
  return rows.filter((row) => includesAny(`${asArray(row.legal_risk_surfaces).join(" ")} ${row.exposure_title || ""} ${row.legal_significance || ""} ${row.suggested_remediation_path || ""}`, element.surface_terms));
}

function linkedFeaturesForElement(element, features = []) {
  return features.filter((feature) => includesAny(`${feature.feature_name || ""} ${feature.feature_description || ""} ${feature.feature_role || ""} ${feature.archetype_labels || ""} ${feature.archetype_codes || ""} ${feature.surface_tokens || ""}`, element.surface_terms));
}

function linkedDocsForElement(element, documents = [], controlSignals = []) {
  return documents.filter((doc) => {
    const relatedControls = controlSignals.filter((signal) => signal.document_id === doc.document_id);
    const text = `${doc.document_type || ""} ${doc.document_title || ""} ${asArray(relatedControls.map((signal) => signal.control_family)).join(" ")}`;
    return includesAny(text, element.document_routes.concat(element.surface_terms));
  });
}

function linkedFlowsForElement(element, flows = []) {
  return flows.filter((flow) => includesAny(flow, element.surface_terms));
}

export function buildPlatformLegalDiligence({
  targetFeatureProfile = {},
  stage6Review = {},
  hydratedRows = {},
  reviewedSources = []
} = {}) {
  const features = asArray(targetFeatureProfile.feature_inventory);
  const cartography = stage6Review.legal_document_cartography || {};
  const dataProfile = stage6Review.data_provenance_profile || {};
  const documents = asArray(cartography.legal_document_inventory);
  const controlSignals = asArray(cartography.document_control_signal_map);
  const dataFlows = asArray(dataProfile.data_flow_profile);
  const rows = asArray(hydratedRows.rows);
  const identifiedRows = asArray(hydratedRows.identified_exposures);
  const controlRows = asArray(hydratedRows.control_evidenced_items);

  const elements = PLATFORM_LEGAL_DILIGENCE_ELEMENTS.map((element) => {
    const elementFeatures = linkedFeaturesForElement(element, features);
    const elementDocs = linkedDocsForElement(element, documents, controlSignals);
    const elementFlows = linkedFlowsForElement(element, dataFlows);
    const elementRows = linkedRowsForElement(element, rows);
    const elementIdentifiedRows = linkedRowsForElement(element, identifiedRows);
    const elementControlRows = linkedRowsForElement(element, controlRows);
    const categories = unique(reviewedSources.filter((source) => includesAny(source, element.surface_terms.concat(element.document_routes))).map(sourceCategory));

    return {
      key: element.key,
      visible_label: element.label,
      review_lens: element.label,
      detected_signals: {
        product_features: elementFeatures.map(featureSignal),
        data_flows: elementFlows.map(dataFlowSignal),
        legal_documents: elementDocs.map(legalDocumentSignal),
        exposure_findings: elementRows.map(exposureSignal),
        evidence_categories: categories
      },
      activation_summary: elementRows.length || elementFeatures.length || elementDocs.length || elementFlows.length
        ? `${element.label} was assessed because the reviewed evidence, product profile, data-flow map, legal-document map, or exposure assessment contained related signals.`
        : `${element.label} was included as a standard platform diligence lens; no specific signal was established from the reviewed material.`,
      linked_finding_ids: unique(elementIdentifiedRows.map((row, index) => row.finding_id || `FIND-${String(index + 1).padStart(3, "0")}`)),
      linked_control_evidenced_items: unique(elementControlRows.map((row) => row.reviewed_evidence?.evidence_reference || row.exposure_title)),
      legal_consequence_category: element.label,
      document_routes: element.document_routes,
      data_control_routes: unique(elementFlows.map((flow) => flow.data_flow_id)),
      report_use: {
        product_profile: ["platform_product_architecture", "data_processing_user_information_flows", "automated_systems_output_reliance", "content_output_ip_position", "third_party_provider_infrastructure_dependencies", "user_facing_claims_product_reliance", "communications_user_interaction_flows"].includes(element.key),
        legal_document_review: true,
        findings: elementIdentifiedRows.length > 0,
        remediation: elementIdentifiedRows.length > 0 || elementDocs.length > 0 || elementFlows.length > 0
      }
    };
  });

  return {
    artifact_type: "platform_legal_diligence_v2",
    visibility: "sidecar_not_main_report_section",
    note: "Internal support object for platform, product, data, content, security, provider, communications, and customer-contracting review lenses. It does not create Vault fields or handoff objects.",
    source_trace: {
      feature_profile_version: targetFeatureProfile.feature_profile_version || null,
      stage6_review_version: stage6Review.stage6_review_version || null,
      stage6_component: stage6Review.stage6_component || null
    },
    elements
  };
}

export function platformElementByKey(platformLegalDiligence = {}, key) {
  return asArray(platformLegalDiligence.elements).find((element) => element.key === key) || null;
}
