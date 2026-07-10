import { P2A_TARGET_PROFILE_ARTIFACTS } from "../target-profile-source-index.contract.js";

const FINAL_ROOT = P2A_TARGET_PROFILE_ARTIFACTS.finalIndex;
const DETERMINISTIC_ROOT = P2A_TARGET_PROFILE_ARTIFACTS.deterministicMap;
const SEMANTIC_ROOT = P2A_TARGET_PROFILE_ARTIFACTS.semanticProfile;
const FINAL_KEYS = Object.freeze([
  "source_coverage_index",
  "target_document_structure_index",
  "material_target_field_locator",
  "entity_identity_locator",
  "brand_trade_name_locator",
  "homepage_positioning_locator",
  "contact_route_locator",
  "commercial_availability_locator",
  "pricing_sales_route_locator",
  "customer_segment_context_locator",
  "regulatory_licensing_locator",
  "grievance_complaints_locator",
  "legal_target_signal_locator",
  "priority_target_locator",
  "semantic_navigation_index",
  "missing_limited_target_profile_items",
  "downstream_rules",
  "lock_status"
]);

export function compileTargetProfileSourceIndex({ deterministicMap, semanticProfile } = {}) {
  const map = unwrapRoot(deterministicMap, DETERMINISTIC_ROOT);
  const semantic = unwrapRoot(semanticProfile, SEMANTIC_ROOT);
  const semanticNavigationIndex = buildSemanticNavigationIndex({ map, semantic });
  const semanticCoverage = semantic.semantic_integrity || buildSemanticCoverageSummary({ map, semanticNavigationIndex });
  const missingLimited = compileMissingLimitedRows(map);
  const index = keepFinalShape({
    source_coverage_index: asArray(map.target_source_coverage_index),
    target_document_structure_index: attachSemanticToStructure(map.target_document_structure_index, semanticNavigationIndex),
    material_target_field_locator: pointerRows(map.material_target_field_locator_map),
    entity_identity_locator: pointerRows(map.entity_identity_locator_map),
    brand_trade_name_locator: pointerRows(map.brand_trade_name_locator_map),
    homepage_positioning_locator: pointerRows(map.homepage_positioning_locator_map),
    contact_route_locator: pointerRows(map.contact_route_locator_map),
    commercial_availability_locator: pointerRows(map.commercial_availability_locator_map),
    pricing_sales_route_locator: pointerRows(map.pricing_sales_route_locator_map),
    customer_segment_context_locator: pointerRows(map.customer_segment_context_locator_map),
    regulatory_licensing_locator: pointerRows(map.regulatory_licensing_locator_map),
    grievance_complaints_locator: pointerRows(map.grievance_complaints_locator_map),
    legal_target_signal_locator: pointerRows(map.legal_target_signal_locator_map),
    priority_target_locator: buildPriorityLocator({ map, semanticNavigationIndex }),
    semantic_navigation_index: semanticNavigationIndex,
    missing_limited_target_profile_items: missingLimited,
    downstream_rules: {
      p2a_is_index_only: true,
      target_profile_source_index_only: true,
      target_profile_review_derives_values_later: true,
      deterministic_map_is_source_of_pointers: true,
      semantic_queue_is_authoritative_for_semantic_coverage: true,
      material_target_field_locators_are_pointer_only: true,
      legal_target_signals_are_locators_only: true,
      regulatory_licensing_locators_are_factual_signal_only: true,
      grievance_complaints_locators_are_route_visibility_only: true,
      full_legal_cartography_reserved_for_2e: true,
      phase1_v5_source_contract_required: true,
      old_family_input_contract_forbidden: true,
      source_artifacts_remain_source_of_truth: true,
      full_text_copied: false,
      summaries_allowed: false,
      excerpts_allowed: false,
      target_profile_values_emitted: false,
      domain_derivation_forbidden_in_2a: true,
      activity_derivation_forbidden_in_2a: true,
      legal_advice_generated: false,
      compliance_conclusion_generated: false,
      enforceability_assessment_generated: false,
      regulatory_grievance_conclusions_forbidden: true,
      governing_law_from_regulatory_or_grievance_roots_forbidden: true,
      courts_venue_from_regulatory_or_grievance_roots_forbidden: true,
      semantic_coverage_summary: semanticCoverage
    },
    lock_status: resolveLockStatus({ map, semanticCoverage, missingLimited })
  });
  return { [FINAL_ROOT]: index };
}

function buildSemanticNavigationIndex({ map, semantic }) {
  const queueById = new Map(asArray(map.semantic_label_queue).map((row) => [String(row.queue_id || ""), row]));
  return asArray(semantic.semantic_navigation_index).map((row) => {
    const queue = queueById.get(String(row.queue_id || "")) || {};
    return stripEmpty({
      queue_id: row.queue_id,
      unit_id: row.unit_id,
      priority: queue.priority || "",
      locator_family: queue.locator_family || queue.locator_type || "",
      target_subcats: asArray(row.target_subcats),
      target_signal_families: asArray(row.target_signal_families),
      confidence: row.confidence || "UNCLEAR",
      navigation_pointer: queue.navigation_pointer || null,
      source_artifact: queue.source_artifact || "",
      source_id: queue.source_id || "",
      common_root: queue.common_root || "",
      limitation: queue.limitation || ""
    });
  });
}

function buildSemanticCoverageSummary({ map, semanticNavigationIndex }) {
  const required = asArray(map.semantic_label_queue).filter((row) => row.semantic_label_required === true || ["P0", "P1"].includes(row.priority));
  const labeled = new Set(semanticNavigationIndex.map((row) => String(row.queue_id || "")));
  const attached = required.filter((row) => labeled.has(String(row.queue_id || ""))).length;
  const coverage = required.length ? Number((attached / required.length).toFixed(4)) : 1;
  return { required_queue_count: required.length, labeled_queue_count: attached, coverage_ratio: coverage, ready_for_compiler: coverage >= 0.8 };
}

function attachSemanticToStructure(rows, semanticNavigationIndex) {
  const semanticByUnit = new Map(semanticNavigationIndex.map((row) => [String(row.unit_id || ""), row]));
  return asArray(rows).map((row) => {
    const semantic = semanticByUnit.get(String(row.unit_id || "")) || {};
    return stripEmpty({
      ...row,
      target_subcats: semantic.target_subcats || [],
      target_signal_families: semantic.target_signal_families || [],
      semantic_confidence: semantic.confidence || ""
    });
  });
}

function buildPriorityLocator({ map, semanticNavigationIndex }) {
  const priorityIds = new Set(semanticNavigationIndex.filter((row) => ["P0", "P1"].includes(row.priority) || row.confidence === "CLEAR").map((row) => row.unit_id));
  const locatorRows = [
    ...asArray(map.material_target_field_locator_map),
    ...asArray(map.regulatory_licensing_locator_map),
    ...asArray(map.grievance_complaints_locator_map),
    ...asArray(map.legal_target_signal_locator_map)
  ];
  return pointerRows(locatorRows.filter((row) => priorityIds.has(row.unit_id) || ["P0", "P1"].includes(row.priority)).slice(0, 75));
}

function compileMissingLimitedRows(map) {
  return [
    ...asArray(map.missing_limited_target_source_map),
    ...asArray(map.quality_repair_queue).map((row, index) => ({ missing_id: row.repair_id || `P2A.REPAIR.${String(index + 1).padStart(3, "0")}`, source_artifact: row.source_artifact || "", source_id: row.source_id || "", status: "REPAIR_REQUIRED", limitation: row.reason || row.limitation || "Phase 2A quality repair row." }))
  ];
}

function pointerRows(rows) {
  return asArray(rows).map((row) => {
    const next = { ...row };
    delete next.lossless_text;
    delete next.clean_text;
    delete next.raw_text;
    delete next.summary;
    delete next.excerpt;
    delete next.snippet;
    delete next.body;
    delete next.content;
    if (Object.prototype.hasOwnProperty.call(next, "value")) next.value = "";
    if (Object.prototype.hasOwnProperty.call(next, "derived_value")) delete next.derived_value;
    next.derived_value_emitted = false;
    return stripEmpty(next);
  });
}

function resolveLockStatus({ map, semanticCoverage, missingLimited }) {
  if (!asArray(map.target_source_coverage_index).length) return "CONTROLLED_FAILURE";
  if (semanticCoverage?.ready_for_compiler === false) return "REPAIR_REQUIRED";
  if (missingLimited.length || map.lock_status === "LOCKED_WITH_LIMITATIONS") return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}

function keepFinalShape(value) { return Object.fromEntries(FINAL_KEYS.map((key) => [key, value[key] ?? (key === "downstream_rules" ? {} : key === "lock_status" ? "REPAIR_REQUIRED" : [])])); }
function unwrapRoot(value, root) { if (!value || typeof value !== "object") return {}; const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value; return artifact[root] || artifact || {}; }
function stripEmpty(row) { return Object.fromEntries(Object.entries(row || {}).filter(([, value]) => value !== undefined && value !== null)); }
function asArray(value) { return Array.isArray(value) ? value : []; }
