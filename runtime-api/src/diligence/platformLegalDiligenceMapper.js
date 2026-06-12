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
    feature_name: asText(feature.feature_name || feature.name, "Unnamed product feature"),
    feature_role: asText(feature.feature_role || feature.role, "Role not specified"),
    functional_profile: asText(feature.archetype_labels || feature.archetype_codes || feature.functional_profile, "Functional profile not specified"),
    risk_surfaces: asText(feature.surface_tokens || feature.legal_risk_surfaces, "Risk surface not specified"),
    evidence_source: asText(feature.feature_source_url || feature.source_url)
  };
}

function legalDocumentSignal(doc = {}) {
  return {
    document_type: asText(doc.document_type || doc.type, "Legal document"),
    exists: doc.exists === true,
    evidence_status: asText(doc.evidence_status, doc.exists === true ? "Evidenced" : "Not evidenced"),
    document_url: asText(doc.document_url || doc.url),
    controls_found: asArray(doc.controls_found || doc.covers),
    gaps_noted: asArray(doc.gaps_noted || doc.misses)
  };
}

function registrySignal(row = {}) {
  return {
    registry_reference: row.registry_reference,
    exposure_title: row.exposure_title,
    assessment_outcome: row.assessment_outcome,
    legal_risk_surfaces: row.legal_risk_surfaces,
    severity: row.severity?.label,
    timing_urgency: row.timing_urgency?.label,
    evidence_reference: row.reviewed_evidence?.evidence_reference
  };
}

function linkedRowsForElement(element, rows = []) {
  return rows.filter((row) => {
    const surfaceText = `${asArray(row.legal_risk_surfaces).join(" ")} ${row.exposure_title || ""} ${row.legal_significance || ""} ${row.suggested_remediation_path || ""}`;
    return includesAny(surfaceText, element.surface_terms);
  });
}

function linkedFeaturesForElement(element, features = []) {
  return features.filter((feature) => {
    const text = `${feature.feature_name || ""} ${feature.feature_description || ""} ${feature.feature_role || ""} ${feature.archetype_labels || ""} ${feature.archetype_codes || ""} ${feature.surface_tokens || ""}`;
    return includesAny(text, element.surface_terms);
  });
}

function linkedDocsForElement(element, legalStack = []) {
  return legalStack.filter((doc) => {
    const text = `${doc.document_type || ""} ${asArray(doc.controls_found || doc.covers).join(" ")} ${asArray(doc.gaps_noted || doc.misses).join(" ")} ${doc.review_note || ""}`;
    return includesAny(text, element.document_routes.concat(element.surface_terms));
  });
}

export function buildPlatformLegalDiligence({
  targetFeatureProfile = {},
  legalStackControlReview = {},
  hydratedRows = {},
  reviewedSources = []
} = {}) {
  const features = asArray(targetFeatureProfile.feature_inventory);
  const legalStack = asArray(legalStackControlReview.legal_stack);
  const rows = asArray(hydratedRows.rows);
  const identifiedRows = asArray(hydratedRows.identified_exposures);
  const controlRows = asArray(hydratedRows.control_evidenced_items);

  const elements = PLATFORM_LEGAL_DILIGENCE_ELEMENTS.map((element) => {
    const elementFeatures = linkedFeaturesForElement(element, features);
    const elementDocs = linkedDocsForElement(element, legalStack);
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
        legal_documents: elementDocs.map(legalDocumentSignal),
        registry_items: elementRows.map(registrySignal),
        evidence_categories: categories
      },
      activation_summary: elementRows.length || elementFeatures.length || elementDocs.length
        ? `${element.label} was assessed because the reviewed evidence or registry assessment contained related product, document, control, or exposure signals.`
        : `${element.label} was included as a standard platform legal diligence lens; no specific signal was established from the reviewed material.`,
      linked_registry_references: unique(elementRows.map((row) => row.registry_reference)),
      linked_identified_exposures: unique(elementIdentifiedRows.map((row) => row.registry_reference)),
      linked_control_evidenced_items: unique(elementControlRows.map((row) => row.registry_reference)),
      legal_consequence_category: element.label,
      document_routes: element.document_routes,
      report_use: {
        product_profile: ["platform_product_architecture", "data_processing_user_information_flows", "automated_systems_output_reliance", "content_output_ip_position", "third_party_provider_infrastructure_dependencies", "user_facing_claims_product_reliance", "communications_user_interaction_flows"].includes(element.key),
        legal_stack: true,
        findings: elementIdentifiedRows.length > 0,
        remediation: elementIdentifiedRows.length > 0 || elementDocs.some((doc) => asArray(doc.gaps_noted).length)
      }
    };
  });

  return {
    artifact_type: "platform_legal_diligence",
    note: "Internal support object for platform, product, data, content, security, provider, communications, and customer-contracting review lenses. The client-facing report does not label this as a practice-area review.",
    elements
  };
}

export function platformElementByKey(platformLegalDiligence = {}, key) {
  return asArray(platformLegalDiligence.elements).find((element) => element.key === key) || null;
}
