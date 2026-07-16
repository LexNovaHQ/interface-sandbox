import crypto from "node:crypto";
import { LEGAL_DOC_RULES } from "./source-discovery-taxonomy.service.js";

export const PHASE1_LEGAL_CLASSIFIER_SCHEMA_VERSION = "PHASE1_LEGAL_INSTRUMENT_CLASSIFIER_v1";

const LEGAL_ROOT_BY_TYPE = Object.freeze({
  legal_notice: "company_identity",
  privacy_policy: "privacy_data_processing",
  data_processing_agreement: "privacy_data_processing",
  subprocessor_list: "privacy_data_processing",
  cookie_policy: "privacy_data_processing",
  ai_policy: "ai_safety_transparency",
  usage_policy: "ai_safety_transparency",
  content_policy: "ai_safety_transparency",
  safety_policy: "ai_safety_transparency",
  fair_practice_code: "regulatory_licensing_status",
  interest_rate_policy: "regulatory_licensing_status",
  key_fact_statement: "regulatory_licensing_status",
  most_important_terms_conditions: "regulatory_licensing_status",
  kyc_aml_policy: "regulatory_licensing_status",
  deposit_insurance_disclosure: "regulatory_licensing_status",
  schedule_of_charges: "regulatory_licensing_status",
  responsible_lending_policy: "regulatory_licensing_status",
  grievance_redressal_policy: "grievance_complaints",
  complaints_procedure: "grievance_complaints"
});

/**
 * RB-08 classifies a legal instrument only from bounded route/title tokens plus
 * document-structure evidence. Raw substring matches are forbidden.
 */
export function buildLegalInstrumentClassification({ canonicalInventory, fingerprintInventory, analysisCache = new Map(), internalEvidenceModel } = {}) {
  const fingerprints = new Map((fingerprintInventory?.fingerprints || []).map((item) => [item.candidate_id, item]));
  const internalByUrl = new Map((internalEvidenceModel?.source_candidates || []).map((item) => [item.canonical_url, item]));
  const classifications = [];

  for (const candidate of canonicalInventory?.canonical_candidates || []) {
    const memberIds = unique([candidate.candidate_id, ...(candidate.member_candidate_ids || [])]);
    const fingerprint = memberIds.map((id) => fingerprints.get(id)).find((item) => item?.fetch_status === "FETCHED") || memberIds.map((id) => fingerprints.get(id)).find(Boolean);
    const analysis = fingerprint ? analysisCache.get(fingerprint.candidate_id) : null;
    const internal = internalByUrl.get(candidate.canonical_url) || [...internalByUrl.values()].find((item) => (candidate.aliases || []).includes(item.canonical_url));
    classifications.push(classifyLegalInstrument({ candidate, fingerprint, analysis, internal }));
  }

  return {
    schema_version: PHASE1_LEGAL_CLASSIFIER_SCHEMA_VERSION,
    status: "COMPLETE",
    classifier_rule: "BOUNDED_TOKEN_PLUS_DOCUMENT_STRUCTURE",
    raw_substring_matching_forbidden: true,
    model_usage: "NONE",
    public_manifest_selection_changed: false,
    counts: {
      candidates_read: classifications.length,
      confirmed_legal_instruments: classifications.filter((item) => item.classification_status === "CONFIRMED_LEGAL_INSTRUMENT").length,
      potential_legal_instruments: classifications.filter((item) => item.classification_status === "POTENTIAL_LEGAL_INSTRUMENT").length,
      not_legal: classifications.filter((item) => item.classification_status === "NOT_LEGAL_INSTRUMENT").length
    },
    classifications
  };
}

export function classifyLegalInstrument({ candidate, fingerprint, analysis, internal } = {}) {
  const url = candidate?.canonical_url || "";
  const title = fingerprint?.title || analysis?.title || "";
  const headings = fingerprint?.headings || analysis?.headings || [];
  const text = analysis?.main_text || fingerprint?.analysis_excerpt || "";
  const structureSignals = unique([...(fingerprint?.legal_structure_signals || []), ...(analysis?.structure_signals || [])]);
  const legacySignal = Boolean(internal?.legal_instrument_candidate);
  const matches = [];

  for (const [docType, artifactName, terms] of LEGAL_DOC_RULES) {
    const urlTerms = terms.filter((term) => boundedUrlTermMatch(url, term));
    const titleTerms = terms.filter((term) => boundedTextTermMatch(title, term));
    const headingTerms = terms.filter((term) => headings.some((heading) => boundedTextTermMatch(heading, term)));
    if (!urlTerms.length && !titleTerms.length && !headingTerms.length) continue;
    const structureSupport = structureSupportForType(docType, structureSignals, text);
    const score = Math.min(4, urlTerms.length ? 4 : 0)
      + Math.min(4, titleTerms.length ? 4 : 0)
      + Math.min(2, headingTerms.length ? 2 : 0)
      + Math.min(3, structureSupport.length)
      + (legacySignal ? 1 : 0);
    matches.push({ doc_type: docType, artifact_name: artifactName, score, url_terms: urlTerms, title_terms: titleTerms, heading_terms: headingTerms, structure_support: structureSupport });
  }

  matches.sort((a, b) => b.score - a.score || specificityRank(a.doc_type) - specificityRank(b.doc_type));
  const best = matches[0];
  const strongTitleOrUrl = Boolean(best?.url_terms?.length && best?.title_terms?.length);
  const structureRequired = requiresStructureConfirmation(best?.doc_type);
  const confirmed = Boolean(best && best.score >= 6 && (!structureRequired || best.structure_support.length > 0 || strongTitleOrUrl));
  const potential = Boolean(best && !confirmed && best.score >= 4);
  const status = confirmed ? "CONFIRMED_LEGAL_INSTRUMENT" : potential ? "POTENTIAL_LEGAL_INSTRUMENT" : "NOT_LEGAL_INSTRUMENT";

  return {
    record_type: "LegalInstrumentClassification",
    schema_version: PHASE1_LEGAL_CLASSIFIER_SCHEMA_VERSION,
    classification_id: stableId("LEGAL", candidate?.canonical_identity || url),
    candidate_id: candidate?.candidate_id || null,
    canonical_identity: candidate?.canonical_identity || null,
    entity_id: candidate?.entity_id || null,
    canonical_url: url,
    classification_status: status,
    confirmed_legal_instrument: confirmed,
    doc_type: confirmed || potential ? best.doc_type : "other",
    artifact_name_hint: confirmed || potential ? best.artifact_name : "legal_doc_other",
    primary_root: confirmed || potential ? legalRootForType(best.doc_type) : null,
    bounded_match_evidence: best ? { url_terms: best.url_terms, title_terms: best.title_terms, heading_terms: best.heading_terms } : { url_terms: [], title_terms: [], heading_terms: [] },
    document_structure_support: best?.structure_support || [],
    legacy_candidate_signal: legacySignal,
    confidence: confirmed ? confidenceFor(best) : potential ? "MEDIUM" : "HIGH",
    negative_guards: {
      raw_substring_match_used: false,
      acronym_requires_complete_token: true,
      different_entity_merge_allowed: false
    }
  };
}

export function assertLegalInstrumentClassification(inventory) {
  if (inventory?.schema_version !== PHASE1_LEGAL_CLASSIFIER_SCHEMA_VERSION) throw new Error("PHASE1_LEGAL_CLASSIFIER_SCHEMA_INVALID");
  if (inventory.raw_substring_matching_forbidden !== true || inventory.model_usage !== "NONE" || inventory.public_manifest_selection_changed !== false) throw new Error("PHASE1_LEGAL_CLASSIFIER_BOUNDARY_INVALID");
  const seen = new Set();
  for (const item of inventory.classifications || []) {
    if (!item.classification_id || !item.candidate_id || !item.canonical_identity || !item.classification_status) throw new Error("PHASE1_LEGAL_CLASSIFICATION_INCOMPLETE");
    if (seen.has(item.canonical_identity)) throw new Error(`PHASE1_LEGAL_CLASSIFICATION_DUPLICATE:${item.canonical_identity}`);
    seen.add(item.canonical_identity);
    if (item.confirmed_legal_instrument && item.doc_type === "other") throw new Error(`PHASE1_LEGAL_CLASSIFICATION_CONFIRMED_OTHER:${item.candidate_id}`);
    if (item.negative_guards?.raw_substring_match_used !== false || item.negative_guards?.acronym_requires_complete_token !== true) throw new Error(`PHASE1_LEGAL_CLASSIFICATION_GUARD_MISSING:${item.candidate_id}`);
  }
  return { ok: true, classifications: seen.size };
}

function boundedUrlTermMatch(value, term) {
  try {
    const url = new URL(value);
    const haystack = normalizePhrase(`${url.pathname} ${url.searchParams.get("document") || ""}`);
    return phraseBoundaryMatch(haystack, normalizePhrase(term));
  } catch {
    return phraseBoundaryMatch(normalizePhrase(value), normalizePhrase(term));
  }
}

function boundedTextTermMatch(value, term) {
  return phraseBoundaryMatch(normalizePhrase(value), normalizePhrase(term));
}

function phraseBoundaryMatch(haystack, needle) {
  if (!needle) return false;
  return ` ${haystack} `.includes(` ${needle} `);
}

function normalizePhrase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/https?:\/\//g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function structureSupportForType(docType, signals, text) {
  const set = new Set(signals || []);
  const support = [];
  const add = (...items) => { for (const item of items) if (set.has(item)) support.push(item); };
  if (["terms_of_service", "acceptable_use_policy", "msa", "customer_agreement", "developer_terms", "marketplace_terms"].includes(docType)) add("acceptance", "contracting_party", "governing_law", "liability", "termination", "effective_date");
  else if (["privacy_policy", "cookie_policy", "subprocessor_list"].includes(docType)) add("personal_data", "controller_processor", "effective_date");
  else if (docType === "data_processing_agreement") add("controller_processor", "personal_data", "governing_law", "effective_date");
  else if (docType === "service_level_agreement") add("service_level", "liability", "effective_date");
  else if (["grievance_redressal_policy", "complaints_procedure"].includes(docType)) add("complaint_grievance", "effective_date");
  else if (["interest_rate_policy", "key_fact_statement", "most_important_terms_conditions", "schedule_of_charges"].includes(docType)) add("charges_rates", "effective_date");
  else add("effective_date", "governing_law", "liability", "contracting_party");
  if (docType === "subprocessor_list" && /\b(subprocessor|vendor|service provider)\b/i.test(text || "")) support.push("vendor_list_content");
  if (docType === "baa" && /\b(covered entity|business associate|protected health information|phi)\b/i.test(text || "")) support.push("baa_content");
  return unique(support);
}

function requiresStructureConfirmation(docType) {
  return ["service_level_agreement", "msa", "baa", "safety_policy", "ai_policy", "usage_policy", "content_policy", "customer_agreement"].includes(docType);
}
function legalRootForType(docType) { return LEGAL_ROOT_BY_TYPE[docType] || "privacy_data_processing"; }
function confidenceFor(match) { return match.score >= 10 ? "HIGH" : "MEDIUM_HIGH"; }
function specificityRank(docType) { return ["service_level_agreement", "data_processing_agreement", "key_fact_statement", "most_important_terms_conditions", "grievance_redressal_policy", "privacy_policy", "terms_of_service"].indexOf(docType) + 1 || 99; }
function stableId(prefix, value) { return `${prefix}.${crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16)}`; }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
