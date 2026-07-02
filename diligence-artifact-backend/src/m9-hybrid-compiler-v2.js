import { compileM9HybridCartography as compileBaseM9HybridCartography } from "./m9-hybrid-compiler.js";

const ALIAS_EQUIVALENTS = Object.freeze({ "terms-of-use": "terms-of-service" });
const LOCATORS = Object.freeze({
  legal_notice_locator: ["legal notice", "notice", "notification", "changes to terms", "contact information"],
  dispute_resolution_locator: ["dispute resolution", "arbitration", "exceptions to arbitration"],
  governing_law_venue_locator: ["governing law", "venue", "jurisdiction", "arbitration"],
  contact_grievance_locator: ["contact", "grievance", "redressal", "data protection officer", "privacy governance"]
});

export function compileM9HybridCartography(args = {}) {
  const output = compileBaseM9HybridCartography(args);
  const index = output.legal_cartography_index || {};
  const map = unwrapRoot(args.deterministicMap, "legal_cartography_deterministic_map");
  const semantic = unwrapRoot(args.semanticProfile, "legal_cartography_semantic_profile");
  enhanceLegalCartographyIndex({ index, map, semantic });
  return output;
}

export function enhanceLegalCartographyIndex({ index = {}, map = {}, semantic = {} } = {}) {
  const semanticNavigationIndex = buildSemanticNavigationIndex({ index, map, semantic });
  index.semantic_navigation_index = semanticNavigationIndex;
  index.priority_semantic_locator = semanticNavigationIndex
    .filter((row) => ["P0", "P1"].includes(row.priority) || row.confidence === "HIGH")
    .map((row, index) => stripEmpty({ locator_id: `M9-SEM-${String(index + 1).padStart(3, "0")}`, document_id: row.document_id, unit_id: row.unit_id, heading_label: row.heading_label, subcats: row.subcats, control_families: row.control_families, priority: row.priority, confidence: row.confidence, navigation_pointer: row.navigation_pointer, review_use: "Priority legal/governance navigation locator; index only." }));

  index.control_language_locator = asArray(index.control_language_locator).map((row) => ({ ...row, limitation: row.limitation || "Technical locator only; not a qualified-review point by itself.", display_in_main_report: false, technical_annexure_only: true }));
  index.missing_limited_legal_governance_items = normalizeMissingLimitedRows(index.missing_limited_legal_governance_items, index.document_coverage_index);

  for (const [key, keywords] of Object.entries(LOCATORS)) index[key] = buildKeywordLocator({ documentStructure: index.document_structure_index, keywords, locatorType: key.replace(/_locator$/, "").toUpperCase() });
  index.qualified_review_locator = buildQualifiedReviewLocator(index);
  index.downstream_rules = {
    ...(index.downstream_rules || {}),
    semantic_navigation_index_is_downstream_available: true,
    control_language_locator_is_technical_locator_only: true,
    qualified_review_locator_is_not_all_control_candidates: true,
    alias_missing_sources_with_canonical_equivalent_are_non_blocking: true,
    report_should_render_summary_not_raw_m9_maps: true
  };
  return index;
}

function buildSemanticNavigationIndex({ index, map, semantic }) {
  const queueById = new Map(asArray(map.semantic_label_queue).map((row) => [String(row.queue_id || ""), row]).filter(([id]) => id));
  const unitById = new Map(asArray(index.document_structure_index).map((row) => [String(row.unit_id || row.section_id || ""), row]).filter(([id]) => id));
  return asArray(semantic.semantic_navigation_index).map((row) => {
    const queue = queueById.get(String(row.queue_id || "")) || {};
    const unitId = row.unit_id || queue.unit_id || queue.section_id || "";
    const unit = unitById.get(String(unitId)) || {};
    return stripEmpty({
      semantic_reference_id: row.semantic_reference_id || row.queue_id || unitId,
      queue_id: row.queue_id || "",
      unit_id: unitId,
      section_id: unit.section_id || queue.section_id || "",
      document_id: unit.document_id || queue.document_id || "",
      heading_label: unit.internal_unit || queue.heading_label || queue.internal_unit || "",
      subcats: asArray(row.subcats),
      control_families: asArray(row.control_families),
      confidence: row.confidence || "",
      priority: queue.priority || row.priority || "P2",
      navigation_pointer: unit.navigation_pointer || queue.navigation_pointer || null,
      index_only: true
    });
  });
}

function normalizeMissingLimitedRows(rows, documentCoverage) {
  return asArray(rows).map((row) => {
    const alias = aliasEquivalent(row, documentCoverage);
    if (!alias.found) return { ...row, blocking: row.blocking !== false, display_in_main_report: row.display_in_main_report !== false };
    return {
      ...row,
      status: "NOT_APPLICABLE_CONTEXTUAL",
      source_type: "REFERENCED_URL",
      source_corpus_status: "REFERENCED_BUT_NOT_FETCHED",
      downstream_effect: "TECHNICAL_ANNEXURE_ONLY_NON_BLOCKING_ALIAS",
      limitation: "Requested URL appears to be a non-blocking alias; canonical equivalent legal document is present in the loaded legal corpus.",
      alias_failed_equivalent_found: true,
      canonical_equivalent: alias.canonical,
      blocking: false,
      display_in_main_report: false,
      technical_annexure_only: true
    };
  });
}

function aliasEquivalent(row, documentCoverage) {
  const text = rowText(row);
  const aliasKey = Object.keys(ALIAS_EQUIVALENTS).find((key) => text.includes(key));
  if (!aliasKey) return { found: false, canonical: "" };
  const canonical = ALIAS_EQUIVALENTS[aliasKey];
  const found = asArray(documentCoverage).some((coverage) => rowText(coverage).includes(canonical) || coverage.artifact_class === "TERMS_OF_SERVICE");
  return { found, canonical: found ? "Terms of Service" : "" };
}

function buildKeywordLocator({ documentStructure, keywords, locatorType }) {
  const rows = [];
  const seen = new Set();
  for (const unit of asArray(documentStructure)) {
    const text = rowText(unit);
    if (!keywords.some((keyword) => text.includes(keyword))) continue;
    const key = `${unit.document_id}|${unit.unit_id}|${locatorType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(stripEmpty({ locator_id: `${locatorType}-${String(rows.length + 1).padStart(3, "0")}`, locator_type: locatorType, document_id: unit.document_id, unit_id: unit.unit_id || unit.section_id, heading_label: unit.internal_unit || unit.apparent_function, status: unit.status || "FOUND_INDEXED", navigation_pointer: unit.navigation_pointer || null, index_only: true }));
  }
  return rows;
}

function buildQualifiedReviewLocator(index) {
  const missing = asArray(index.missing_limited_legal_governance_items).filter((row) => row.display_in_main_report !== false).map((row, index) => stripEmpty({ locator_id: `M9-QRL-MISS-${String(index + 1).padStart(3, "0")}`, locator_type: "MISSING_OR_LIMITED_SOURCE", artifact_or_unit: row.missing_or_limited_item, expected_location: row.expected_location, status: row.status, blocking: row.blocking !== false, reviewer_action: "Verify whether the missing or limited legal/governance source exists before reliance." }));
  const priority = asArray(index.priority_semantic_locator).slice(0, 25).map((row, index) => stripEmpty({ locator_id: `M9-QRL-SEM-${String(index + 1).padStart(3, "0")}`, locator_type: "PRIORITY_SEMANTIC_NAVIGATION", document_id: row.document_id, unit_id: row.unit_id, heading_label: row.heading_label, subcats: row.subcats, control_families: row.control_families, navigation_pointer: row.navigation_pointer, reviewer_action: "Use as a priority locator; M9 does not decide the legal effect." }));
  const locatorRows = ["legal_notice_locator", "dispute_resolution_locator", "governing_law_venue_locator", "contact_grievance_locator"].flatMap((key) => asArray(index[key])).slice(0, 20).map((row, index) => stripEmpty({ locator_id: `M9-QRL-LOC-${String(index + 1).padStart(3, "0")}`, locator_type: row.locator_type, document_id: row.document_id, unit_id: row.unit_id, heading_label: row.heading_label, navigation_pointer: row.navigation_pointer, reviewer_action: "Use as legal notice/dispute/contact locator; M9 is index-only." }));
  return [...missing, ...priority, ...locatorRows];
}

function unwrapRoot(value, root) { if (!value || typeof value !== "object") return {}; const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value; return artifact[root] || artifact || {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function rowText(row) { if (!row || typeof row !== "object") return ""; return Object.values(row).map((value) => typeof value === "string" ? value : Array.isArray(value) ? value.join(" ") : "").join(" ").toLowerCase(); }
function stripEmpty(row) { const out = {}; for (const [key, value] of Object.entries(row)) { if (value === "" || value === undefined) continue; if (Array.isArray(value) && value.length === 0) continue; if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) continue; out[key] = value; } return out; }
