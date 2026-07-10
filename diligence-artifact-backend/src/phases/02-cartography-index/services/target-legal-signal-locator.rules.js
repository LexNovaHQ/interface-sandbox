import { P2A_TARGET_PROFILE_ALLOWED_LEGAL_SIGNAL_LOCATOR_FAMILIES } from "../target-profile-source-index.contract.js";

const RULES = Object.freeze([
  rule({ family: "LEGAL_ENTITY_NAME_LOCATOR", target3aSignal: "legal_entity_name", priority: "P0", signalFamilies: ["IDENTITY", "LEGAL_TARGET_SIGNAL"], terms: ["legal name", "legal entity", "entity name", "company name", "registered name", "registered company", "incorporated as", "trading as", "d/b/a"] }),
  rule({ family: "REGISTERED_ENTITY_LOCATOR", target3aSignal: "registered_entity", priority: "P0", signalFamilies: ["IDENTITY", "LEGAL_TARGET_SIGNAL"], terms: ["registered", "incorporated", "registration number", "company number", "corporate identification", "registered company", "registered entity", "cin", "corporation number"] }),
  rule({ family: "CONTRACTING_ENTITY_LOCATOR", target3aSignal: "contracting_entity", priority: "P0", signalFamilies: ["IDENTITY", "LEGAL_TARGET_SIGNAL"], terms: ["contracting entity", "these terms are between", "agreement is between", "terms are between", "between you and", "we are", "our company", "service provider", "provider is"] }),
  rule({ family: "LEGAL_NOTICE_CONTACT_LOCATOR", target3aSignal: "legal_notice_contact", priority: "P1", signalFamilies: ["LEGAL_NOTICE_POINTER", "LEGAL_TARGET_SIGNAL"], terms: ["legal notice", "legal notices", "notices", "notice email", "legal@", "notice address", "contact us", "attention legal", "legal department"] }),
  rule({ family: "REGISTERED_OFFICE_LOCATOR", target3aSignal: "registered_office", priority: "P1", signalFamilies: ["IDENTITY", "LEGAL_TARGET_SIGNAL"], terms: ["registered office", "principal office", "corporate office", "office located at", "address", "registered address", "mailing address"] }),
  rule({ family: "GOVERNING_LAW_LOCATOR", target3aSignal: "governing_law", priority: "P0", signalFamilies: ["JURISDICTION_POINTER", "LEGAL_TARGET_SIGNAL"], terms: ["governing law", "laws of", "governed by", "construed in accordance", "applicable law"] }),
  rule({ family: "COURTS_VENUE_LOCATOR", target3aSignal: "courts_venue", priority: "P0", signalFamilies: ["JURISDICTION_POINTER", "LEGAL_TARGET_SIGNAL"], terms: ["courts", "court", "venue", "jurisdiction", "exclusive jurisdiction", "competent courts", "forum"] }),
  rule({ family: "DISPUTE_RESOLUTION_LOCATOR", target3aSignal: "dispute_resolution", priority: "P0", signalFamilies: ["JURISDICTION_POINTER", "LEGAL_TARGET_SIGNAL"], terms: ["dispute", "disputes", "arbitration", "mediation", "resolution", "resolve", "claim", "controversy"] }),
  rule({ family: "NOTICE_DELIVERY_LOCATOR", target3aSignal: "notice_delivery", priority: "P1", signalFamilies: ["LEGAL_NOTICE_POINTER", "LEGAL_TARGET_SIGNAL"], terms: ["notice", "notification", "delivered", "by email", "mail", "courier", "deemed received", "service of notice"] }),
  rule({ family: "BILLING_ENTITY_LOCATOR", target3aSignal: "billing_entity", priority: "P1", signalFamilies: ["COMMERCIAL", "LEGAL_TARGET_SIGNAL"], terms: ["billing", "invoice", "invoicing", "payment", "fees", "taxes", "billing entity", "charged by"] }),
  rule({ family: "ENTERPRISE_TERMS_LOCATOR", target3aSignal: "enterprise_terms", priority: "P1", signalFamilies: ["COMMERCIAL", "LEGAL_TARGET_SIGNAL"], terms: ["enterprise", "order form", "master services", "msa", "service terms", "subscription agreement", "enterprise agreement"] })
]);

export const LEGAL_TARGET_SIGNAL_LOCATOR_RULES = Object.freeze(
  RULES.filter((ruleDef) => P2A_TARGET_PROFILE_ALLOWED_LEGAL_SIGNAL_LOCATOR_FAMILIES.includes(ruleDef.locator_family))
);

export function matchLegalTargetSignalRules(text = "") {
  const haystack = normalizeSearchText(text);
  if (!haystack) return [];
  return LEGAL_TARGET_SIGNAL_LOCATOR_RULES.map((ruleDef) => {
    const matched_terms = ruleDef.match_terms.filter((term) => haystack.includes(term));
    return matched_terms.length ? { ...ruleDef, matched_terms } : null;
  }).filter(Boolean);
}

function rule({ family, target3aSignal, priority, signalFamilies, terms }) {
  return Object.freeze({
    locator_family: family,
    target_3a_signal: target3aSignal,
    priority,
    target_subcats: Object.freeze(["LEGAL_TARGET_SIGNAL"]),
    target_signal_families: Object.freeze(signalFamilies),
    match_terms: Object.freeze(terms.map(normalizeSearchText)),
    locator_only: true,
    derived_value_forbidden: true
  });
}

function normalizeSearchText(value = "") {
  return String(value || "").toLowerCase().replace(/[^a-z0-9@./\s-]+/g, " ").replace(/\s+/g, " ").trim();
}
