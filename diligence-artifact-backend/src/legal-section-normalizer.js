import { asArray, safeObject, safeText } from "./report-safe-language.js";
import { NORMALIZATION_MAP_VERSION } from "./report-normalization-map.js";

export const LEGAL_SECTION_NORMALIZER_VERSION = "legal_section_normalizer_v2_m9_qr_legal_signals";

const PRIMARY_CLASSES = new Set(["EULA", "PRIVACY_POLICY", "TERMS_OF_SERVICE", "TRUST_CENTER", "CUSTOMER_TERMS", "AI_TERMS_POLICY", "SECURITY_POLICY"]);
const NOTE = "The full M9 legal cartography pack, legal unit map, control locator pack, semantic navigation profile, source pointers, qualified-review legal signal maps, and missing-source ledger are preserved in the public technical annexure pack. This report renders only normalized summaries and priority locators.";

export function buildLegalDocumentGovernanceMapSection({ legalCartographyIndex = {}, sectionStatus = "LOCKED_WITH_LIMITATIONS" } = {}) {
  const legal = safeObject(legalCartographyIndex.legal_cartography_index || legalCartographyIndex);
  const coverage = asArray(legal.document_coverage_index);
  const structure = asArray(legal.document_structure_index);
  const semantic = asArray(legal.semantic_navigation_index);
  const controls = asArray(legal.control_language_locator);
  const priority = asArray(legal.qualified_review_locator).length ? asArray(legal.qualified_review_locator) : asArray(legal.priority_semantic_locator);
  const missing = asArray(legal.missing_limited_legal_governance_items).filter((row) => row.display_in_main_report !== false);
  return {
    section_id: "legal_document_control_review",
    artifact_name: "normalized_section__legal_document_control_review",
    section_title: "Legal Document & Governance Map",
    section_order: 6,
    section_status: sectionStatus,
    display_section_status: sectionStatus,
    reviewer_summary: "Normalized legal/governance coverage, document inventory, embedded instruments, grouped navigation, qualified-review legal signals, priority locators, and true missing-source items. Full M9 maps are annexure-only.",
    subsections: [
      subsection("legal_coverage_summary", "Legal Coverage Summary", [field("legal_coverage_summary", "Legal coverage summary", summary({ coverage, structure, semantic, controls, missing, legal }), "legal_cartography_index", "summary_counts")]),
      subsection("core_legal_document_inventory", "Core Legal Document Inventory", [field("core_legal_documents", "Core legal documents", coreDocs(coverage), "legal_cartography_index", "document_coverage")]),
      subsection("embedded_legal_instruments", "Embedded Legal Instruments", [field("embedded_legal_instruments", "Embedded legal instruments", embeddedDocs(coverage), "legal_cartography_index", "embedded_document_coverage")]),
      subsection("legal_control_navigation_summary", "Legal / Control Navigation Summary", [field("legal_control_navigation_summary", "Grouped legal/control navigation summary", controlSummary({ semantic, controls }), "legal_cartography_index", "m9_navigation_summary")]),
      subsection("qualified_review_legal_signals", "Qualified Review Legal Signals", [field("qualified_review_legal_signals", "Qualified review legal signals", qrLegalSignals(legal.qualified_review_legal_signals), "legal_cartography_index", "qualified_review_legal_signals")]),
      subsection("priority_legal_review_locators", "Priority Legal Review Locators", [field("priority_legal_review_locators", "Priority legal review locators", priorityRows(priority), "legal_cartography_index", "m9_priority_locators")]),
      subsection("missing_limited_legal_governance_sources", "Missing or Limited Legal-Governance Sources", [field("missing_limited_legal_governance_sources", "True missing or limited legal-governance sources", missingRows(missing), "legal_cartography_index", "m9_missing_source_summary")]),
      subsection("technical_annexure_note", "Technical Annexure Note", [field("technical_annexure_note", "Technical annexure note", NOTE, "legal_cartography_index", "technical_annexure_boundary")])
    ],
    section_limitations: missing.map((row) => ({ limitation: safeText(row.limitation || row.missing_or_limited_item, "Missing or limited legal/governance source."), source_artifact: "legal_cartography_index" })),
    source_artifacts_used: ["legal_cartography_index"],
    normalization: { profiler_version: LEGAL_SECTION_NORMALIZER_VERSION, normalization_map_version: NORMALIZATION_MAP_VERSION, m9_is_index_only: true, section_6_uses_m9_summary_view: true, qualified_review_legal_signals_present: true, full_m9_payload_annexure_only: true, legal_conclusion_generated: false },
    vault_mapping: { eligible_for_vault: true, vault_category: "legal_document_control_review", requires_confirmation_before_assembly: true }
  };
}

function qrLegalSignals(value) {
  const signals = safeObject(value);
  return {
    Legal_Notice_Contact: safeObject(signals.legal_notice_contact),
    Liability_Cap_Basis: safeObject(signals.liability_cap_basis),
    SLA_Support_Posture: safeObject(signals.sla_support_posture),
    Display_Boundary: "Index-backed qualified-review signals only. M9 does not provide legal advice, enforceability conclusions, or final contract positions."
  };
}
function summary({ coverage, structure, semantic, controls, missing, legal }) { return { Primary_Legal_Documents_Found: coreDocs(coverage).length, Embedded_Legal_Instruments_Found: embeddedDocs(coverage).length, Legal_Units_Indexed: structure.length, Semantic_Navigation_Units_Labelled: semantic.length, Control_Candidate_Locators: controls.length, Missing_Limited_Sources_Requiring_Review: missing.length, Qualified_Review_Legal_Signals_Present: Boolean(legal.qualified_review_legal_signals), Lock_Status: safeText(legal.lock_status, "LOCKED_WITH_LIMITATIONS"), Display_Rule: "Summary and priority locators only; full M9 maps are public technical annexure payloads." }; }
function coreDocs(coverage) { return asArray(coverage).filter((row) => row.source_type !== "EMBEDDED_UNIT").filter((row) => PRIMARY_CLASSES.has(row.artifact_class) || /terms|privacy|eula|trust|security/i.test(row.document_or_artifact || "")).map((row, index) => ({ Ref: `DOC-${String(index + 1).padStart(3, "0")}`, Document_Material: safeText(row.document_or_artifact, "Legal/governance document"), Class: safeText(row.artifact_class, "UNKNOWN_LEGAL_ARTIFACT"), Source: safeText(row.source, "Loaded legal corpus"), Status: safeText(row.status, "FOUND_INDEXED"), Role: safeText(row.document_role, "Loaded source.") })); }
function embeddedDocs(coverage) { return asArray(coverage).filter((row) => row.source_type === "EMBEDDED_UNIT").map((row, index) => ({ Ref: `EMB-${String(index + 1).padStart(3, "0")}`, Embedded_Instrument: safeText(row.document_or_artifact, "Embedded legal instrument"), Class: safeText(row.artifact_class, "HOSTED_LEGAL_ARTIFACT"), Host_Source: safeText(row.source, "Loaded legal corpus"), Status: safeText(row.status, "FOUND_EMBEDDED_IN_LEGAL_CORPUS") })); }
function controlSummary({ semantic, controls }) { const rows = asArray(semantic).length ? asArray(semantic) : asArray(controls).map((row) => ({ control_families: [row.control_language_family || row.control_type].filter(Boolean), subcats: row.registry_subcat_relevance || [], document_id: row.document_id || row.located_in_document })); const grouped = new Map(); for (const row of rows) { for (const family of asArray(row.control_families).length ? asArray(row.control_families) : ["UNCLASSIFIED_NAVIGATION"]) { if (!grouped.has(family)) grouped.set(family, { Control_Family: family, Unit_Count: 0, Key_Documents: new Set(), Subcats: new Set() }); const group = grouped.get(family); group.Unit_Count += 1; if (row.document_id) group.Key_Documents.add(row.document_id); for (const subcat of asArray(row.subcats)) group.Subcats.add(subcat); } } return [...grouped.values()].map((group) => ({ Control_Family: label(group.Control_Family), Unit_Count: group.Unit_Count, Key_Documents: [...group.Key_Documents].slice(0, 8), Subcats: [...group.Subcats].slice(0, 10), Review_Use: reviewUse(group.Control_Family) })); }
function priorityRows(rows) { return asArray(rows).slice(0, 50).map((row, index) => ({ Locator_ID: safeText(row.locator_id, `M9-LOC-${String(index + 1).padStart(3, "0")}`), Document: safeText(row.document_id, "Document not specified"), Unit_Heading: safeText(row.heading_label || row.artifact_or_unit, "Unit not specified"), Subcats: asArray(row.subcats), Control_Families: asArray(row.control_families).map(label), Why_It_Matters: safeText(row.review_use || row.reviewer_action, "Priority locator for qualified legal/governance review."), Navigation_Ref: row.navigation_pointer || "" })); }
function missingRows(rows) { return asArray(rows).map((row, index) => ({ Display_Ref: `GOV-${String(index + 1).padStart(3, "0")}`, Missing_Or_Limited_Item: safeText(row.missing_or_limited_item, "Missing or limited legal/governance material"), Expected_Location: safeText(row.expected_location, "Expected location not specified"), Search_Basis: safeText(row.search_basis, "Search basis not specified"), Status: safeText(row.status, "REVIEW_WITH_LIMITATION"), Blocking: row.blocking === false ? "No" : "Yes" })); }
function reviewUse(family) { const raw = String(family || "").toUpperCase(); if (raw.includes("DATA") || raw.includes("PRIVACY")) return "Privacy, data processing, transfer, retention, rights, and security navigation."; if (raw.includes("COMMERCIAL") || raw.includes("LIABILITY") || raw.includes("INDEMNITY")) return "Commercial allocation, liability cap, indemnity, warranty, and risk-allocation navigation."; if (raw.includes("IP") || raw.includes("CONTENT")) return "IP/content, output ownership, training, and content-control navigation."; if (raw.includes("FORMATION") || raw.includes("CONTRACT")) return "Assent, contract formation, renewal, billing, cancellation, and dispute-route navigation."; if (raw.includes("SECURITY")) return "Security, trust, incident, and operational control navigation."; return "General legal/governance navigation."; }
function label(value) { return safeText(String(value || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()), "Unclassified Navigation"); }
function subsection(subsection_id, subsection_title, fields) { return { subsection_id, subsection_title, fields: asArray(fields) }; }
function field(field_id, label, value, source_artifact, source_path) { return { field_id, label, value, source_artifact, source_path, evidence_refs: [], limitation: "", qualified_review_note: "Qualified reviewer should verify before reliance.", technical_refs: {} }; }
