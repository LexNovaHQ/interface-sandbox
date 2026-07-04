import { LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT, requiredLegalSignalFieldRows } from "../legal-cartography-index.contract.js";
import { collectLegalSignalSourceRows, filterRowsByTerms, cleanText } from "./legal-text-extraction.service.js";
import { buildEvidenceBasis, buildLocatorBasis, scannedSourceSummary, emptySignalRow, derivedSignalRow, limitationRow } from "./legal-signal-evidence.service.js";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const TERMS = Object.freeze({
  legalNotice: ["legal notice", "notice", "notices", "legal@", "legal contact", "contact us", "registered office"],
  privacyContact: ["privacy", "data protection", "data subject", "data principal", "privacy@", "dpo"],
  grievance: ["grievance", "complaint", "redressal", "nodal", "officer", "grievance officer"],
  officer: ["dpo", "data protection officer", "privacy officer", "grievance officer", "nodal officer", "contact officer"],
  governingLaw: ["governing law", "laws of", "law of", "governed by"],
  venue: ["jurisdiction", "venue", "courts", "dispute", "arbitration", "forum"],
  consent: ["consent", "withdraw", "withdrawal", "revocation", "revoke", "preference", "opt out", "data principal", "rights", "delete", "deletion", "grievance"],
  consentThirdParty: ["onetrust", "cookiebot", "trustarc", "cmp", "consent manager", "preference center", "cookie consent", "third party"]
});

export function buildLegalSignalDerivationProfile({ run = {}, artifacts = {} } = {}) {
  const sourceRows = collectLegalSignalSourceRows({ artifacts });
  const scannedSources = scannedSourceSummary(sourceRows);
  const fieldRows = requiredLegalSignalFieldRows().map((field) => deriveFieldRow({ field, sourceRows, scannedSources }));
  const grouped = groupRows(fieldRows);

  return {
    legal_signal_derivation_profile: {
      artifact_name: LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.artifact_name,
      schema_version: LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.schema_version,
      model_generated: false,
      derivation_mode: LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.derivation_mode,
      run_id: run.run_id || run.id || "",
      source_boundary: LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.source_boundary,
      field_derivations: fieldRows,
      legal_notice_contact_signal_map: grouped.legal_notice_contact_signal_map,
      jurisdiction_dispute_signal_map: grouped.jurisdiction_dispute_signal_map,
      privacy_grievance_contact_signal_map: grouped.privacy_grievance_contact_signal_map,
      consent_manager_signal_map: grouped.consent_manager_signal_map,
      coverage_summary: coverageSummary(fieldRows),
      validation_manifest: {
        unknown_status_present: fieldRows.some((row) => LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.forbidden_statuses.includes(row.derivation_status)),
        qr_pollution_present: containsQrPollution(fieldRows),
        evidence_gates_ready_for_validator: true,
        required_field_count: LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.required_field_count,
        emitted_field_count: fieldRows.length
      }
    }
  };
}

function deriveFieldRow({ field, sourceRows, scannedSources }) {
  const key = `${field.field_family}.${field.field_key}`;
  if (key === "legal_notice_contact_signal_map.legal_notice_email") return deriveEmailField({ field, sourceRows, scannedSources, terms: TERMS.legalNotice, role: "legal notice" });
  if (key === "legal_notice_contact_signal_map.legal_notice_contact_route") return deriveRouteField({ field, sourceRows, scannedSources, terms: TERMS.legalNotice, label: "legal notice route" });
  if (key === "legal_notice_contact_signal_map.legal_notice_contact_evidence_basis") return deriveEvidenceBasisField({ field, sourceRows, scannedSources, terms: TERMS.legalNotice, label: "legal notice contact evidence basis" });
  if (key === "legal_notice_contact_signal_map.legal_notice_contact_limitation") return deriveLimitationField({ field, sourceRows, scannedSources, terms: TERMS.legalNotice, label: "legal notice contact" });

  if (key === "jurisdiction_dispute_signal_map.governing_law_country") return deriveGoverningLawCountry({ field, sourceRows, scannedSources });
  if (key === "jurisdiction_dispute_signal_map.governing_law_state") return deriveGoverningLawState({ field, sourceRows, scannedSources });
  if (key === "jurisdiction_dispute_signal_map.courts_venue") return deriveVenue({ field, sourceRows, scannedSources });
  if (key === "jurisdiction_dispute_signal_map.jurisdiction_evidence_basis") return deriveEvidenceBasisField({ field, sourceRows, scannedSources, terms: [...TERMS.governingLaw, ...TERMS.venue], label: "jurisdiction evidence basis" });
  if (key === "jurisdiction_dispute_signal_map.jurisdiction_uncertainty") return deriveLimitationField({ field, sourceRows, scannedSources, terms: [...TERMS.governingLaw, ...TERMS.venue], label: "jurisdiction" });

  if (key === "privacy_grievance_contact_signal_map.privacy_contact_email") return deriveEmailField({ field, sourceRows, scannedSources, terms: TERMS.privacyContact, role: "privacy contact" });
  if (key === "privacy_grievance_contact_signal_map.grievance_contact_email") return deriveEmailField({ field, sourceRows, scannedSources, terms: TERMS.grievance, role: "grievance contact" });
  if (key === "privacy_grievance_contact_signal_map.officer_contact") return deriveOfficerContact({ field, sourceRows, scannedSources });
  if (key === "privacy_grievance_contact_signal_map.evidence_basis") return deriveEvidenceBasisField({ field, sourceRows, scannedSources, terms: [...TERMS.privacyContact, ...TERMS.grievance, ...TERMS.officer], label: "privacy and grievance contact evidence basis" });
  if (key === "privacy_grievance_contact_signal_map.limitation") return deriveLimitationField({ field, sourceRows, scannedSources, terms: [...TERMS.privacyContact, ...TERMS.grievance, ...TERMS.officer], label: "privacy and grievance contact" });

  if (key === "consent_manager_signal_map.applicability_signal") return deriveConsentApplicability({ field, sourceRows, scannedSources });
  if (key === "consent_manager_signal_map.public_flow_visible") return deriveConsentPublicFlow({ field, sourceRows, scannedSources });
  if (key === "consent_manager_signal_map.consent_artifact_route") return deriveConsentRoute({ field, sourceRows, scannedSources });
  if (key === "consent_manager_signal_map.withdrawal_revocation_grievance_route") return deriveConsentWithdrawalRoute({ field, sourceRows, scannedSources });
  if (key === "consent_manager_signal_map.third_party_route_signal") return deriveThirdPartyConsentRoute({ field, sourceRows, scannedSources });
  if (key === "consent_manager_signal_map.evidence_basis") return deriveEvidenceBasisField({ field, sourceRows, scannedSources, terms: TERMS.consent, label: "consent manager evidence basis" });
  if (key === "consent_manager_signal_map.limitation") return deriveLimitationField({ field, sourceRows, scannedSources, terms: TERMS.consent, label: "consent manager" });
  return exhaustiveFailure({ field, sourceRows, scannedSources, reason: "No deterministic derivation rule exists for this field." });
}

function deriveEmailField({ field, sourceRows, scannedSources, terms, role }) {
  const rows = filterRowsByTerms(sourceRows, terms);
  const allRows = rows.length ? rows : sourceRows;
  const emails = extractEmails(allRows);
  const best = chooseEmail(emails, terms);
  if (best) {
    const status = roleMatch(best.context, terms) ? "DERIVED" : "DERIVED_WITH_LIMITATION";
    const limitation = status === "DERIVED_WITH_LIMITATION" ? `${role} email found, but public text does not make the role unambiguous.` : "";
    return derivedSignalRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: best.email, evidence_basis: buildEvidenceBasis([best.row], terms), status, limitation, confidence: status === "DERIVED" ? "HIGH" : "MEDIUM" });
  }
  return absenceForLocator({ field, sourceRows, scannedSources, terms, failureReason: `No ${role} email was deterministically extractable from loaded legal sources.` });
}

function deriveRouteField({ field, sourceRows, scannedSources, terms, label }) {
  const rows = filterRowsByTerms(sourceRows, terms);
  const emails = extractEmails(rows);
  if (emails[0]) return derivedSignalRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: `${label}: email route ${emails[0].email}`, evidence_basis: buildEvidenceBasis([emails[0].row], terms), confidence: "HIGH" });
  if (rows.length) return limitationRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: `${label} locator is publicly visible, but exact route requires review.`, evidence_basis: buildEvidenceBasis(rows, terms), limitation: "Locator exists but no deterministic email or route value was extractable from the loaded text." });
  return absenceForLocator({ field, sourceRows, scannedSources, terms, failureReason: `No ${label} locator or route was found in loaded legal sources.` });
}

function deriveEvidenceBasisField({ field, sourceRows, scannedSources, terms, label }) {
  const rows = filterRowsByTerms(sourceRows, terms);
  if (rows.length) return derivedSignalRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: `${label} supported by loaded legal-source locators.`, evidence_basis: buildEvidenceBasis(rows, terms), confidence: "HIGH" });
  return exhaustiveFailure({ field, sourceRows, scannedSources, reason: `No ${label} source row was found after scanning allowed legal sources.` });
}

function deriveLimitationField({ field, sourceRows, scannedSources, terms, label }) {
  const rows = filterRowsByTerms(sourceRows, terms);
  if (rows.length) return limitationRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: `${label} signal is derived from public legal material only.`, evidence_basis: buildEvidenceBasis(rows, terms), limitation: "Private implementation, internal workflow, and local counsel interpretation are outside public-source verification." });
  return exhaustiveFailure({ field, sourceRows, scannedSources, reason: `No ${label} locator was found in allowed legal sources.` });
}

function deriveGoverningLawCountry({ field, sourceRows, scannedSources }) {
  const rows = filterRowsByTerms(sourceRows, TERMS.governingLaw);
  const match = firstRegexMatch(rows, [/governed by (?:the )?laws? of ([^.;,]+)/i, /laws? of ([^.;,]+) govern/i, /governing law[^.;:]*[:\-]?\s*([^.;,]+)/i]);
  if (match) return derivedSignalRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: normalizeJurisdiction(match.value).country, evidence_basis: buildEvidenceBasis([match.row], TERMS.governingLaw), confidence: "MEDIUM" });
  return absenceForLocator({ field, sourceRows, scannedSources, terms: TERMS.governingLaw, failureReason: "Governing-law locator exists but country value was not deterministically visible." });
}

function deriveGoverningLawState({ field, sourceRows, scannedSources }) {
  const rows = filterRowsByTerms(sourceRows, TERMS.governingLaw);
  const match = firstRegexMatch(rows, [/governed by (?:the )?laws? of ([^.;,]+)/i, /laws? of ([^.;,]+) govern/i, /governing law[^.;:]*[:\-]?\s*([^.;,]+)/i]);
  if (match) {
    const state = normalizeJurisdiction(match.value).state;
    if (state) return derivedSignalRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: state, evidence_basis: buildEvidenceBasis([match.row], TERMS.governingLaw), confidence: "MEDIUM" });
    return limitationRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: "Governing-law clause found, but state/province is not separately visible.", evidence_basis: buildEvidenceBasis([match.row], TERMS.governingLaw), limitation: "Country or jurisdiction was visible; subnational state value was not deterministic." });
  }
  return absenceForLocator({ field, sourceRows, scannedSources, terms: TERMS.governingLaw, failureReason: "Governing-law locator exists but state/province value was not deterministically visible." });
}

function deriveVenue({ field, sourceRows, scannedSources }) {
  const rows = filterRowsByTerms(sourceRows, TERMS.venue);
  const match = firstRegexMatch(rows, [/courts? (?:located )?(?:in|of|at) ([^.;,]+)/i, /exclusive jurisdiction (?:of|in) ([^.;,]+)/i, /venue (?:shall be )?(?:in|of) ([^.;,]+)/i, /arbitration (?:in|at) ([^.;,]+)/i]);
  if (match) return derivedSignalRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: cleanText(match.value), evidence_basis: buildEvidenceBasis([match.row], TERMS.venue), confidence: "MEDIUM" });
  return absenceForLocator({ field, sourceRows, scannedSources, terms: TERMS.venue, failureReason: "Dispute/venue locator exists but court or venue value was not deterministically visible." });
}

function deriveOfficerContact({ field, sourceRows, scannedSources }) {
  const rows = filterRowsByTerms(sourceRows, TERMS.officer);
  const emails = extractEmails(rows);
  if (emails[0]) return derivedSignalRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: `Officer contact route: ${emails[0].email}`, evidence_basis: buildEvidenceBasis([emails[0].row], TERMS.officer), confidence: "MEDIUM" });
  if (rows.length) return limitationRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: "Officer/contact role locator is publicly visible, but exact officer contact requires review.", evidence_basis: buildEvidenceBasis(rows, TERMS.officer), limitation: "Loaded source text did not expose a deterministic officer email or named route." });
  return absenceForLocator({ field, sourceRows, scannedSources, terms: TERMS.officer, failureReason: "No officer contact signal was found in loaded legal sources." });
}

function deriveConsentApplicability({ field, sourceRows, scannedSources }) {
  const rows = filterRowsByTerms(sourceRows, TERMS.consent);
  if (rows.length) return limitationRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: "Public legal materials include consent, rights, withdrawal, deletion, or grievance language.", evidence_basis: buildEvidenceBasis(rows, TERMS.consent), limitation: "Public text supports applicability signal; implementation mechanics require qualified review." });
  return exhaustiveFailure({ field, sourceRows, scannedSources, reason: "No consent, rights, withdrawal, deletion, or grievance language was found in allowed legal sources." });
}

function deriveConsentPublicFlow({ field, sourceRows, scannedSources }) {
  const rows = filterRowsByTerms(sourceRows, ["withdraw", "preference", "opt out", "request", "portal", "form", "email", "grievance", "rights"]);
  if (rows.length) return limitationRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: "A public consent/rights/contact route appears visible in loaded legal materials.", evidence_basis: buildEvidenceBasis(rows, TERMS.consent), limitation: "Visibility of public legal route does not verify actual implementation workflow or UI state." });
  return absenceForLocator({ field, sourceRows, scannedSources, terms: TERMS.consent, failureReason: "No public consent/rights flow locator was visible in loaded legal sources." });
}

function deriveConsentRoute({ field, sourceRows, scannedSources }) {
  return deriveRouteField({ field, sourceRows, scannedSources, terms: ["consent", "preference", "privacy", "cookie", "opt out"], label: "consent artifact route" });
}

function deriveConsentWithdrawalRoute({ field, sourceRows, scannedSources }) {
  return deriveRouteField({ field, sourceRows, scannedSources, terms: ["withdraw", "withdrawal", "revocation", "revoke", "grievance", "delete", "rights"], label: "withdrawal/revocation/grievance route" });
}

function deriveThirdPartyConsentRoute({ field, sourceRows, scannedSources }) {
  const rows = filterRowsByTerms(sourceRows, TERMS.consentThirdParty);
  if (rows.length) return limitationRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, value: "Third-party or consent-management route language appears in loaded public materials.", evidence_basis: buildEvidenceBasis(rows, TERMS.consentThirdParty), limitation: "Public text does not verify active vendor integration or implementation state." });
  return emptySignalRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, status: "NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN", scanned_sources: scannedSources, failure_reason: "No third-party consent-management route was found after scanning allowed legal sources." });
}

function absenceForLocator({ field, sourceRows, scannedSources, terms, failureReason }) {
  const locatorRows = filterRowsByTerms(sourceRows, terms);
  if (locatorRows.length) {
    return emptySignalRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, status: "LOCATOR_FOUND_VALUE_NOT_VISIBLE", scanned_sources: [], failure_reason: failureReason, locator_basis: buildLocatorBasis(locatorRows, terms), limitation: "Locator exists, but final field value was not deterministically visible in the loaded public text." });
  }
  return exhaustiveFailure({ field, sourceRows, scannedSources, reason: failureReason });
}

function exhaustiveFailure({ field, scannedSources, reason }) {
  return emptySignalRow({ field_id: field.field_id, field_key: field.field_key, field_family: field.field_family, status: "NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN", scanned_sources: scannedSources, failure_reason: reason });
}

function extractEmails(rows = []) {
  const out = [];
  for (const row of rows) {
    const text = row.text || "";
    const matches = [...text.matchAll(EMAIL_RE)];
    for (const match of matches) {
      const start = Math.max(0, match.index - 120);
      const end = Math.min(text.length, match.index + match[0].length + 120);
      out.push({ email: match[0].toLowerCase(), row, context: text.slice(start, end) });
    }
  }
  return dedupeBy(out, (item) => item.email);
}

function chooseEmail(emails = [], terms = []) {
  if (!emails.length) return null;
  return [...emails].sort((a, b) => scoreEmail(b, terms) - scoreEmail(a, terms))[0];
}

function scoreEmail(item, terms = []) {
  const email = item.email.toLowerCase();
  const context = `${item.context} ${item.row.path}`.toLowerCase();
  let score = 0;
  if (email.includes("legal")) score += 5;
  if (email.includes("privacy")) score += 5;
  if (email.includes("grievance")) score += 5;
  if (email.includes("dpo")) score += 4;
  for (const term of terms) if (context.includes(String(term).toLowerCase())) score += 2;
  return score;
}

function roleMatch(context = "", terms = []) {
  const lower = context.toLowerCase();
  return terms.some((term) => lower.includes(String(term).toLowerCase()));
}

function firstRegexMatch(rows = [], patterns = []) {
  for (const row of rows) {
    for (const pattern of patterns) {
      const match = String(row.text || "").match(pattern);
      if (match?.[1]) return { row, value: match[1] };
    }
  }
  return null;
}

function normalizeJurisdiction(value) {
  const clean = cleanText(value).replace(/^the\s+/i, "");
  const stateMatch = clean.match(/(?:state of|province of|territory of)\s+([^,;]+)/i);
  const country = clean.replace(/state of|province of|territory of/gi, "").replace(/\s+/g, " ").trim();
  return { country, state: stateMatch?.[1]?.trim() || "" };
}

function groupRows(fieldRows) {
  const grouped = {
    legal_notice_contact_signal_map: {},
    jurisdiction_dispute_signal_map: {},
    privacy_grievance_contact_signal_map: {},
    consent_manager_signal_map: {}
  };
  for (const row of fieldRows) grouped[row.field_family][row.field_key] = row;
  return grouped;
}

function coverageSummary(fieldRows) {
  const summary = {
    required_field_count: LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.required_field_count,
    emitted_field_count: fieldRows.length,
    derived_count: 0,
    derived_with_limitation_count: 0,
    locator_found_value_not_visible_count: 0,
    source_not_public_count: 0,
    source_conflict_count: 0,
    not_applicable_contextual_count: 0,
    not_derived_after_exhaustive_scan_count: 0
  };
  for (const row of fieldRows) {
    if (row.derivation_status === "DERIVED") summary.derived_count += 1;
    if (row.derivation_status === "DERIVED_WITH_LIMITATION") summary.derived_with_limitation_count += 1;
    if (row.derivation_status === "LOCATOR_FOUND_VALUE_NOT_VISIBLE") summary.locator_found_value_not_visible_count += 1;
    if (row.derivation_status === "SOURCE_NOT_PUBLIC") summary.source_not_public_count += 1;
    if (row.derivation_status === "SOURCE_CONFLICT") summary.source_conflict_count += 1;
    if (row.derivation_status === "NOT_APPLICABLE_CONTEXTUAL") summary.not_applicable_contextual_count += 1;
    if (row.derivation_status === "NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN") summary.not_derived_after_exhaustive_scan_count += 1;
  }
  return summary;
}

function containsQrPollution(value) {
  return JSON.stringify(value).includes("question_id") || JSON.stringify(value).includes("reviewer_question") || JSON.stringify(value).includes("qualified_review_legal_signals");
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
