import { reviewRouteLabel, safeText, statusLabel } from "./report-safe-language.js";

export const NORMALIZATION_MAP_VERSION = "report_normalization_map_v1";

export const LAWYER_READABLE_LABELS = Object.freeze({
  fields: Object.freeze({
    "target_identity.brand_name": "Public brand name",
    "target_identity.legal_entity_name": "Legal entity / contracting party signal",
    "target_identity.entity_type": "Entity form signal",
    "target_identity.reviewed_website": "Reviewed public website",
    "target_identity.primary_domain": "Primary reviewed domain",
    "jurisdiction_notice.registered_notice_location": "Registered / notice location",
    "jurisdiction_notice.governing_law": "Contract governing-law signal",
    "jurisdiction_notice.courts_venue": "Dispute forum / venue signal",
    "business_context.business_category": "Business category",
    "business_context.primary_customer_type": "Customer / buyer segment",
    "business_context.market_type_candidate": "Market posture",
    "business_context.industry_sector": "Industry sector signal",
    "business_context.regulated_sector_hints": "Regulated-sector indicators visible in public materials",
    "product_service_wrapper.high_level_offering": "High-level offering",
    "product_service_wrapper.primary_public_claim": "Primary product claim",
    "product_service_wrapper.product_service_wrapper_names": "Named product/service wrappers",
    "product_service_wrapper.delivery_model_signals": "Delivery model signals",
    "target_profile_limitations": "Target identity limitations",

    activity_reference: "Activity reference",
    product_service_wrapper: "Related product/service",
    activity_feature_name: "Publicly described activity",
    activity_candidate_summary: "What the activity appears to do",
    mechanics_proof: "How the activity appears to work",
    autonomy_human_control_signal: "Automation and human review signal",
    data_content_object_touched: "Data, content, or asset affected",
    external_internal_action_signal: "External effect or internal workflow signal",
    archetype_codes: "Activity pattern",
    archetype_derivation_basis: "Why this activity pattern was selected",
    surface_context_tokens: "Affected context",
    surface_derivation_basis: "Why this affected context was selected or limited",
    profile_level_limitations: "Product/activity mapping limitations",

    assessment_scope: "Data/control review scope",
    source_coverage: "Data-source coverage",
    individuals_and_relationships: "Individuals, users, or affected parties",
    role_relationship_readiness: "Role relationship signals",
    data_categories: "Data categories visible",
    generated_output_and_derived_data_treatment: "Generated output / derived data handling",
    sensitive_special_category_signals: "Sensitive data indicators",
    children_minors_signal: "Children/minors indicator",
    collection_sources_and_activity_data_flows: "Collection and data-flow map",
    processing_operations_lifecycle: "Processing lifecycle",
    purpose_use_signals: "Purpose/use signals",
    privacy_notice_visibility: "Privacy notice visibility",
    lawful_basis_consent_authorization_readiness: "Consent / authorization / lawful-basis evidence signals",
    consent_withdrawal_controls: "Withdrawal / opt-out controls",
    rights_request_routes: "User/data-rights request routes",
    privacy_governance_contact_accountability_signals: "Privacy contact / accountability signals",
    contractual_dpa_customer_terms_readiness: "DPA/customer terms visibility",
    vendor_subprocessor_partner_inventory: "Vendor / subprocessor / partner map",
    processor_subprocessor_governance_controls: "Vendor governance controls",
    third_party_disclosure_sharing_controls: "Third-party sharing controls",
    cross_border_transfer_location_custody: "Transfer, storage, and custody signals",
    retention_deletion_return_export_controls: "Retention, deletion, return, and export controls",
    security_access_controls: "Security and access controls",
    breach_incident_readiness: "Incident response visibility",
    cookies_tracking_marketing_controls: "Cookies, tracking, and marketing controls",
    ai_model_provider_processing_chain: "AI provider / model-processing chain",
    ai_training_finetuning_model_improvement_controls: "Training, fine-tuning, and model-improvement controls",
    embeddings_vector_memory_controls: "Embedding/vector memory controls",
    prompt_output_logging_telemetry_controls: "Prompt/output logging and telemetry controls",
    automated_decision_profiling_human_review_signal: "Automated decisioning / human review signal",
    privacy_accountability_documentation_signals: "Privacy governance documentation signals",
    law_regulatory_readiness_matrix: "Regulatory review-readiness matrix",
    missing_proof_and_diligence_requests: "Missing proof / diligence requests",
    limitations: "Data/control review limitations",

    document_coverage_index: "Documents found or absent",
    document_structure_index: "Major legal/governance sections",
    incorporated_linked_document_map: "Referenced / incorporated materials",
    control_language_locator: "Control-language locator",
    missing_limited_legal_governance_items: "Missing or limited legal/governance materials",
    downstream_rules: "Downstream use rules",
    lock_status: "Lock status"
  }),

  archetypes: Object.freeze({
    UNI: "Universal review item",
    DOE: "Decisioning / evaluation activity",
    JDG: "Judgment or scoring activity",
    CMP: "Comparison / ranking activity",
    CRT: "Content creation or generation activity",
    RDR: "Retrieval, data reading, or data access activity",
    ORC: "Orchestration / workflow automation activity",
    TRN: "Training, tuning, or model-improvement activity",
    SHD: "Sharing, disclosure, or publication activity",
    OPT: "Optimization or recommendation activity",
    MOV: "Movement, transfer, or physical-world effect activity"
  }),

  surfaces: Object.freeze({
    "Consumer-Public": "Consumer/public-facing context",
    "Enterprise-Private": "Enterprise/private customer context",
    PII: "Personal data context",
    Employment: "Employment/workplace context",
    "Sensitive/Biometric": "Sensitive or biometric data context",
    Financial: "Financial data or financial decision context",
    "Content&IP": "Content, copyright, or IP context",
    "Safety&Physical": "Safety or physical-world impact context",
    Infrastructure: "Infrastructure, security, or operational dependency context",
    Minors: "Children/minors context"
  }),

  registryTerms: Object.freeze({
    Threat_ID: "Registry row reference",
    threat_id: "Registry row reference",
    Archetype: "Activity pattern",
    archetype: "Activity pattern",
    Subcategory: "Review subcategory",
    subcategory: "Review subcategory",
    Surface: "Affected context",
    surface: "Affected context",
    Pain_Tier: "Review priority tier",
    Pain_Depth: "Review depth",
    Pain_Category: "Review category",
    Legal_Pain: "Plain-English review issue",
    basis_proof: "Visible basis proof",
    control_exclusion_evaluation: "Visible control/exclusion position",
    evidence_source_basis: "Evidence/source basis",
    fp_mechanism: "False-positive control mechanism",
    remediation: "Candidate review route",
    review_route: "Qualified review route",
    row_limitations: "Row-specific limitations"
  }),

  statuses: Object.freeze({
    PASS: "Pass",
    PASS_WITH_LIMITATION: "Pass with limitation",
    LOCKED: "Locked",
    LOCKED_WITH_LIMITATIONS: "Completed with limitations",
    REPAIR_REQUIRED: "Needs repair before reliance",
    CONTROLLED_FAILURE: "Controlled failure",
    TRIGGERED: "Visible exposure signal",
    CONTROLLED_BY_VISIBLE_CONTROL: "Visible control reduces exposure",
    CONTROLLED_BY_EXCLUSION: "Registry exclusion applied",
    CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION: "Public evidence limitation",
    NOT_APPLICABLE: "Not applicable on current public context",
    NOT_APPLICABLE_CONTEXTUAL: "Not applicable on current public context",
    UNKNOWN_NOT_SEARCHED: "Not searched in public materials",
    INSUFFICIENT_EVIDENCE: "Insufficient public evidence",
    ACCESS_FAILED: "Source route could not be accessed"
  })
});

export function normalizeFieldLabel(pathOrKey) {
  const key = String(pathOrKey || "").trim();
  return LAWYER_READABLE_LABELS.fields[key] || LAWYER_READABLE_LABELS.registryTerms[key] || humanizeKey(key);
}

export function normalizeArchetype(value) {
  const raw = String(value || "").trim();
  return LAWYER_READABLE_LABELS.archetypes[raw] || safeText(raw, "Activity pattern not specified");
}

export function normalizeSurface(value) {
  const raw = String(value || "").trim();
  return LAWYER_READABLE_LABELS.surfaces[raw] || safeText(raw, "Affected context not specified");
}

export function normalizeRegistryTerm(value) {
  const raw = String(value || "").trim();
  return LAWYER_READABLE_LABELS.registryTerms[raw] || humanizeKey(raw);
}

export function normalizeStatusForReport(value) {
  const raw = String(value || "").trim().toUpperCase();
  return LAWYER_READABLE_LABELS.statuses[raw] || statusLabel(value);
}

export function normalizeReviewRouteForReport(value) {
  return reviewRouteLabel(value);
}

export function normalizeInternalValue(value, kind = "field") {
  if (Array.isArray(value)) return value.map((item) => normalizeInternalValue(item, kind)).filter(Boolean);
  if (value === null || value === undefined || value === "") return "";
  if (kind === "archetype") return normalizeArchetype(value);
  if (kind === "surface") return normalizeSurface(value);
  if (kind === "status") return normalizeStatusForReport(value);
  if (kind === "review_route") return normalizeReviewRouteForReport(value);
  return safeText(value, "Not visible in reviewed public materials");
}

export function normalizeArchetypeList(values) {
  const list = Array.isArray(values) ? values : values ? [values] : [];
  return [...new Set(list.map(normalizeArchetype).filter(Boolean))];
}

export function normalizeSurfaceList(values) {
  const list = Array.isArray(values) ? values : values ? [values] : [];
  return [...new Set(list.map(normalizeSurface).filter(Boolean))];
}

function humanizeKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Field";
  return raw
    .replace(/^[a-zA-Z0-9]+\./, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}
