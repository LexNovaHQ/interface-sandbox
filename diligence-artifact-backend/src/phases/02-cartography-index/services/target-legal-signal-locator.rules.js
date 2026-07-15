import { P2A_TARGET_PROFILE_ALLOWED_LEGAL_SIGNAL_LOCATOR_FAMILIES } from "../target-profile-source-index.contract.js";

const EXPANDED_PHASE1_V5_LEGAL_DOC_TYPES = Object.freeze([
  "legal_doc_fair_practice_code",
  "legal_doc_grievance_redressal_policy",
  "legal_doc_interest_rate_policy",
  "legal_doc_key_fact_statement",
  "legal_doc_most_important_terms_conditions",
  "legal_doc_kyc_aml_policy",
  "legal_doc_deposit_insurance_disclosure",
  "legal_doc_complaints_procedure",
  "legal_doc_schedule_of_charges",
  "legal_doc_responsible_lending_policy"
]);

const RULES = Object.freeze([
  rule({ family: "LEGAL_ENTITY_NAME_LOCATOR", target3aSignal: "legal_entity_name", priority: "P0", subcats: ["ENTITY_IDENTITY", "LEGAL_TARGET_SIGNAL"], signalFamilies: ["IDENTITY", "LEGAL_TARGET_SIGNAL"], terms: ["legal name", "legal entity", "entity name", "company name", "registered name", "registered company", "incorporated as", "trading as", "d/b/a"] }),
  rule({ family: "REGISTERED_ENTITY_LOCATOR", target3aSignal: "registered_entity", priority: "P0", subcats: ["ENTITY_IDENTITY", "LEGAL_TARGET_SIGNAL"], signalFamilies: ["IDENTITY", "LEGAL_TARGET_SIGNAL"], terms: ["registered", "incorporated", "registration number", "company number", "corporate identification", "registered company", "registered entity", "cin", "corporation number"] }),
  rule({ family: "CONTRACTING_ENTITY_LOCATOR", target3aSignal: "contracting_entity", priority: "P0", subcats: ["ENTITY_IDENTITY", "LEGAL_TARGET_SIGNAL"], signalFamilies: ["IDENTITY", "LEGAL_TARGET_SIGNAL"], terms: ["contracting entity", "these terms are between", "agreement is between", "terms are between", "between you and", "we are", "our company", "service provider", "provider is"] }),
  rule({ family: "LEGAL_NOTICE_CONTACT_LOCATOR", target3aSignal: "legal_notice_contact", priority: "P1", subcats: ["LEGAL_NOTICE_POINTER", "LEGAL_TARGET_SIGNAL"], signalFamilies: ["LEGAL_NOTICE_POINTER", "LEGAL_TARGET_SIGNAL"], terms: ["legal notice", "legal notices", "notices", "notice email", "legal@", "notice address", "contact us", "attention legal", "legal department"] }),
  rule({ family: "REGISTERED_OFFICE_LOCATOR", target3aSignal: "registered_office", priority: "P1", subcats: ["GEOGRAPHY_JURISDICTION", "LEGAL_TARGET_SIGNAL"], signalFamilies: ["IDENTITY", "LEGAL_TARGET_SIGNAL"], terms: ["registered office", "principal office", "corporate office", "office located at", "address", "registered address", "mailing address"] }),
  rule({ family: "GOVERNING_LAW_LOCATOR", target3aSignal: "governing_law", priority: "P0", subcats: ["GEOGRAPHY_JURISDICTION", "LEGAL_TARGET_SIGNAL"], signalFamilies: ["JURISDICTION_POINTER", "LEGAL_TARGET_SIGNAL"], terms: ["governing law", "laws of", "governed by", "construed in accordance", "applicable law"], sourceBoundary: "TERMS_CUSTOMER_AGREEMENT_OR_LEGAL_TERMS_ONLY" }),
  rule({ family: "COURTS_VENUE_LOCATOR", target3aSignal: "courts_venue", priority: "P0", subcats: ["GEOGRAPHY_JURISDICTION", "LEGAL_TARGET_SIGNAL"], signalFamilies: ["JURISDICTION_POINTER", "LEGAL_TARGET_SIGNAL"], terms: ["courts", "court", "venue", "jurisdiction", "exclusive jurisdiction", "competent courts", "forum"], sourceBoundary: "TERMS_DISPUTE_CLAUSE_OR_LEGAL_TERMS_ONLY" }),
  rule({ family: "DISPUTE_RESOLUTION_LOCATOR", target3aSignal: "dispute_resolution", priority: "P0", subcats: ["LEGAL_TARGET_SIGNAL"], signalFamilies: ["JURISDICTION_POINTER", "LEGAL_TARGET_SIGNAL"], terms: ["dispute", "disputes", "arbitration", "mediation", "resolution", "resolve", "claim", "controversy"] }),
  rule({ family: "NOTICE_DELIVERY_LOCATOR", target3aSignal: "notice_delivery", priority: "P1", subcats: ["LEGAL_NOTICE_POINTER", "LEGAL_TARGET_SIGNAL"], signalFamilies: ["LEGAL_NOTICE_POINTER", "LEGAL_TARGET_SIGNAL"], terms: ["notice", "notification", "delivered", "by email", "mail", "courier", "deemed received", "service of notice"] }),
  rule({ family: "BILLING_ENTITY_LOCATOR", target3aSignal: "billing_entity", priority: "P1", subcats: ["COMMERCIAL_AVAILABILITY", "LEGAL_TARGET_SIGNAL"], signalFamilies: ["COMMERCIAL", "LEGAL_TARGET_SIGNAL"], terms: ["billing", "invoice", "invoicing", "payment", "fees", "taxes", "billing entity", "charged by"] }),
  rule({ family: "ENTERPRISE_TERMS_LOCATOR", target3aSignal: "enterprise_terms", priority: "P1", subcats: ["COMMERCIAL_AVAILABILITY", "LEGAL_TARGET_SIGNAL"], signalFamilies: ["COMMERCIAL", "LEGAL_TARGET_SIGNAL"], terms: ["enterprise", "order form", "master services", "msa", "service terms", "subscription agreement", "enterprise agreement"] }),
  rule({ family: "REGULATORY_LICENSING_SIGNAL_LOCATOR", target3aSignal: "public_regulatory_licensing_signal", priority: "P0", subcats: ["REGULATORY_LICENSING_SIGNAL"], signalFamilies: ["REGULATORY_OPERATING_CONTEXT"], terms: ["licence", "license", "licensing", "registration", "registered with", "authorised", "authorized", "regulated", "regulatory", "regulatory disclosure", "regulatory information", "registrations"] }),
  rule({ family: "REGULATORY_DISCLOSURE_LOCATOR", target3aSignal: "public_regulatory_licensing_signal", priority: "P0", subcats: ["PUBLIC_REGULATORY_DISCLOSURE"], signalFamilies: ["REGULATORY_OPERATING_CONTEXT", "CONSUMER_DISCLOSURE"], terms: ["disclosure", "regulatory disclosure", "fair practice", "fair-practice", "key fact statement", "kfs", "most important terms", "mitc", "schedule of charges", "fees and charges", "interest rate policy", "responsible lending"] }),
  rule({ family: "BANK_PARTNER_SPONSOR_BANK_LOCATOR", target3aSignal: "partner_or_intermediary_delivery_signal", priority: "P0", subcats: ["COUNTERPARTY_INSTITUTION_SIGNAL", "REGULATORY_LICENSING_SIGNAL"], signalFamilies: ["COUNTERPARTY_INSTITUTION", "REGULATORY_OPERATING_CONTEXT", "MONEY_MOVEMENT_CONTEXT"], terms: ["bank partner", "bank partners", "partner bank", "partner banks", "sponsor bank", "sponsoring bank", "nbfc partner", "lending partner", "escrow partner", "payment partner"] }),
  rule({ family: "CONSUMER_DISCLOSURE_LOCATOR", target3aSignal: "public_regulatory_licensing_signal", priority: "P1", subcats: ["CONSUMER_DISCLOSURE_SIGNAL"], signalFamilies: ["CONSUMER_DISCLOSURE", "REGULATORY_OPERATING_CONTEXT"], terms: ["consumer disclosure", "customer disclosure", "borrower", "customer protection", "fair practice code", "charges", "interest rate", "annual percentage", "loan terms"] }),
  rule({ family: "COUNTERPARTY_INSTITUTION_LOCATOR", target3aSignal: "partner_or_intermediary_delivery_signal", priority: "P1", subcats: ["COUNTERPARTY_INSTITUTION_SIGNAL"], signalFamilies: ["COUNTERPARTY_INSTITUTION", "MONEY_MOVEMENT_CONTEXT"], terms: ["partner", "counterparty", "institution", "bank", "nbfc", "lender", "payment processor", "issuer", "custodian", "escrow"] }),
  rule({ family: "GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR", target3aSignal: "public_grievance_complaints_signal", priority: "P0", subcats: ["GRIEVANCE_COMPLAINTS_SIGNAL"], signalFamilies: ["GRIEVANCE_OPERATING_CONTEXT", "CONTACT"], terms: ["grievance", "complaint", "complaints", "grievance redressal", "complaint redressal", "raise a complaint", "customer grievance", "customer complaint"] }),
  rule({ family: "NODAL_GRIEVANCE_OFFICER_LOCATOR", target3aSignal: "public_grievance_complaints_signal", priority: "P0", subcats: ["GRIEVANCE_COMPLAINTS_SIGNAL"], signalFamilies: ["GRIEVANCE_OPERATING_CONTEXT", "CONTACT"], terms: ["nodal officer", "grievance officer", "principal nodal officer", "complaints officer", "redressal officer"] }),
  rule({ family: "OMBUDSMAN_ESCALATION_LOCATOR", target3aSignal: "public_grievance_complaints_signal", priority: "P1", subcats: ["COMPLAINTS_ESCALATION_ROUTE"], signalFamilies: ["GRIEVANCE_OPERATING_CONTEXT"], terms: ["ombudsman", "escalation", "escalate", "appellate", "appeal", "level 2", "level 3", "unresolved complaint"] }),
  rule({ family: "COMPLAINTS_ROUTE_LOCATOR", target3aSignal: "public_grievance_complaints_signal", priority: "P1", subcats: ["COMPLAINTS_ESCALATION_ROUTE"], signalFamilies: ["GRIEVANCE_OPERATING_CONTEXT", "CONTACT"], terms: ["complaint form", "complaint email", "complaint portal", "complaint process", "complaints procedure", "redressal mechanism", "contact for complaints"] })
]);

export const LEGAL_TARGET_SIGNAL_LOCATOR_RULES = Object.freeze(
  RULES.filter((ruleDef) => P2A_TARGET_PROFILE_ALLOWED_LEGAL_SIGNAL_LOCATOR_FAMILIES.includes(ruleDef.locator_family))
);

export const PHASE1_V5_EXPANDED_LEGAL_DOC_TARGET_LOCATOR_HINTS = EXPANDED_PHASE1_V5_LEGAL_DOC_TYPES;

export function matchLegalTargetSignalRules(text = "") {
  const haystack = normalizeSearchText(text);
  if (!haystack) return [];
  return LEGAL_TARGET_SIGNAL_LOCATOR_RULES.map((ruleDef) => {
    const matched_terms = ruleDef.match_terms.filter((term) => haystack.includes(term));
    return matched_terms.length ? { ...ruleDef, matched_terms } : null;
  }).filter(Boolean);
}

function rule({ family, target3aSignal, priority, subcats, signalFamilies, terms, sourceBoundary = "REFERENCE_AUTHORITY_REQUIRED" }) {
  return Object.freeze({
    locator_family: family,
    target_3a_signal: target3aSignal,
    priority,
    target_subcats: Object.freeze(subcats || ["LEGAL_TARGET_SIGNAL"]),
    target_signal_families: Object.freeze(signalFamilies),
    match_terms: Object.freeze(terms.map(normalizeSearchText)),
    source_boundary: sourceBoundary,
    locator_only: true,
    derived_value_forbidden: true,
    legal_or_regulatory_conclusion_forbidden: true,
    phase_2a_action: "LOCATE_ONLY"
  });
}

function normalizeSearchText(value = "") {
  return String(value || "").toLowerCase().replace(/[^a-z0-9@./\s-]+/g, " ").replace(/\s+/g, " ").trim();
}
