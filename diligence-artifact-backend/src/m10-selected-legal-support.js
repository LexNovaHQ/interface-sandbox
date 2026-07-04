const ARTIFACT_NAME = "m10_selected_legal_support_packet";
const LEGAL_FAMILIES = Object.freeze([
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "lossless_family__L2_B2B_CONTRACTING",
  "lossless_family__L4_PRIVACY_ADJACENT_NOTICES"
]);
const MAX_ROWS = 36;
const MAX_PER_FAMILY = 12;
const MAX_EXCERPT = 520;
const MATCH_TERMS = Object.freeze(["privacy", "data", "processing", "security", "retention", "deletion", "vendor", "subprocessor", "transfer", "cookie", "rights", "consent", "withdrawal", "revocation", "opt-out", "preferences", "consent manager", "consent management", "grievance", "redressal", "privacy officer", "contact", "incident", "breach", "training", "model", "log", "output", "upload", "dpdp", "data principal"]);

export function buildM10SelectedLegalSupportPacket({ artifacts = {} } = {}) {
  const legalIndex = unwrap(artifacts.legal_cartography_index, "legal_cartography_index");
  const locatorTerms = locatorSearchTerms(legalIndex);
  const terms = unique([...locatorTerms, ...MATCH_TERMS]);
  const rows = [];
  for (const familyName of LEGAL_FAMILIES) {
    const strings = [];
    collectStrings(artifacts[familyName], strings);
    const selected = strings
      .map((text) => ({ text, score: scoreText(text, terms) }))
      .filter((row) => row.score > 0 && clean(row.text).length > 24)
      .sort((a, b) => b.score - a.score || clean(b.text).length - clean(a.text).length)
      .slice(0, MAX_PER_FAMILY);
    for (const row of selected) {
      if (rows.length >= MAX_ROWS) break;
      rows.push({
        support_id: `M10-LSUP-${String(rows.length + 1).padStart(3, "0")}`,
        source_family: familyName,
        navigation_basis: "legal_cartography_index_pinpoint_selector",
        excerpt: excerpt(row.text),
        match_score: row.score
      });
    }
    if (rows.length >= MAX_ROWS) break;
  }
  return {
    artifact_name: ARTIFACT_NAME,
    schema_version: "M10_SELECTED_LEGAL_SUPPORT_PACKET_v1_CONTACT_CONSENT_MANAGER",
    model_generated: false,
    source_policy: {
      d_families_are_primary_for_m10: true,
      legal_support_is_secondary_fallback: true,
      full_l_family_payloads_excluded_from_m10_prompt: true,
      legal_cartography_index_is_navigation_authority: true,
      qr_contact_and_consent_manager_terms_supported: true
    },
    selected_rows: rows,
    selector_stats: {
      selected_row_count: rows.length,
      max_rows: MAX_ROWS,
      max_rows_per_family: MAX_PER_FAMILY,
      source_families_considered: LEGAL_FAMILIES,
      locator_term_count: locatorTerms.length,
      contact_consent_term_count: MATCH_TERMS.length
    },
    limitations: rows.length ? [] : ["No M10 legal-support rows selected from L1/L2/L4 using the legal cartography navigation selector."]
  };
}

function locatorSearchTerms(index) {
  const terms = [];
  for (const key of ["control_language_locator", "priority_semantic_locator", "qualified_review_locator", "document_structure_index", "incorporated_linked_document_map", "contact_grievance_locator"]) {
    for (const row of asArray(index[key]).slice(0, 60)) {
      for (const value of [row.unit_heading, row.section_name, row.heading, row.title, row.document_type, row.document, row.summary, row.finding]) {
        const text = clean(value).toLowerCase();
        if (!text) continue;
        text.split(/[^a-z0-9]+/).filter((part) => part.length >= 5 && part.length <= 24).forEach((part) => terms.push(part));
      }
    }
  }
  return unique(terms).slice(0, 80);
}

function scoreText(text, terms) {
  const lower = clean(text).toLowerCase();
  return terms.reduce((score, term) => score + (lower.includes(term) ? 1 : 0), 0);
}
function collectStrings(value, out) {
  if (value == null) return;
  if (typeof value === "string") { const text = clean(value); if (text) out.push(text); return; }
  if (Array.isArray(value)) return value.slice(0, 500).forEach((item) => collectStrings(item, out));
  if (typeof value === "object") return Object.values(value).slice(0, 500).forEach((item) => collectStrings(item, out));
}
function unwrap(value, key) { if (value?.[key] && typeof value[key] === "object") return value[key]; if (value?.artifact?.[key] && typeof value.artifact[key] === "object") return value.artifact[key]; return value && typeof value === "object" ? value : {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function excerpt(value) { const text = clean(value); return text.length > MAX_EXCERPT ? `${text.slice(0, MAX_EXCERPT - 3)}...` : text; }
