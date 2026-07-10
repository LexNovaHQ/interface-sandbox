import {
  P2B_DOMAIN_ACTIVITY_ARTIFACTS,
  P2B_DOMAIN_ACTIVITY_FINAL_INDEX_KEYS
} from "../domain-activity-source-index.contract.js";

const FINAL_ROOT = P2B_DOMAIN_ACTIVITY_ARTIFACTS.finalIndex;
const DETERMINISTIC_ROOT = P2B_DOMAIN_ACTIVITY_ARTIFACTS.deterministicMap;
const SEMANTIC_ROOT = P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile;
const LOCATOR_MAP_KEYS = Object.freeze([
  "primary_domain_locator_map",
  "ai_overlay_locator_map",
  "regulatory_overlay_locator_map",
  "fusion_candidate_locator_map",
  "activity_capability_locator_map",
  "commercial_availability_locator_map",
  "technical_capability_locator_map",
  "integration_ecosystem_locator_map",
  "use_case_customer_industry_locator_map"
]);
const COPY_AND_VALUE_KEYS = Object.freeze([
  "summary",
  "excerpt",
  "snippet",
  "lossless_text",
  "clean_text",
  "raw_text",
  "body",
  "content",
  "value",
  "derived_value",
  "primary_domain",
  "primary_domain_value",
  "domain_package",
  "domain_package_selected",
  "ai_overlay",
  "ai_overlay_value",
  "regulatory_overlay",
  "regulatory_overlay_value",
  "fusion_status"
]);

export function compileDomainActivitySourceIndex({ deterministicMap, semanticProfile } = {}) {
  const map = unwrapRoot(deterministicMap, DETERMINISTIC_ROOT);
  const semantic = unwrapRoot(semanticProfile, SEMANTIC_ROOT);
  const semanticNavigationIndex = buildSemanticNavigationIndex({ map, semantic });
  const semanticCoverage = semantic.semantic_integrity || buildSemanticCoverageSummary({ map, semanticNavigationIndex });
  const missingLimited = compileMissingLimitedRows(map);
  const index = keepFinalShape({
    source_coverage_index: asArray(map.domain_activity_source_coverage_index),
    domain_activity_document_structure_index: attachSemanticToStructure(map.domain_activity_document_structure_index, semanticNavigationIndex),
    primary_domain_locator_map: pointerRows(map.primary_domain_locator_map),
    ai_overlay_locator_map: pointerRows(map.ai_overlay_locator_map),
    regulatory_overlay_locator_map: pointerRows(map.regulatory_overlay_locator_map),
    fusion_candidate_locator_map: pointerRows(map.fusion_candidate_locator_map),
    activity_capability_locator_map: pointerRows(map.activity_capability_locator_map),
    commercial_availability_locator_map: pointerRows(map.commercial_availability_locator_map),
    technical_capability_locator_map: pointerRows(map.technical_capability_locator_map),
    integration_ecosystem_locator_map: pointerRows(map.integration_ecosystem_locator_map),
    use_case_customer_industry_locator_map: pointerRows(map.use_case_customer_industry_locator_map),
    priority_domain_activity_locator: buildPriorityDomainActivityLocator({ map, semanticNavigationIndex }),
    semantic_navigation_index: semanticNavigationIndex,
    missing_limited_domain_activity_items: missingLimited,
    downstream_rules: {
      phase_2b_is_index_only: true,
      activity_profile_source_index_owned_by_2b: true,
      domain_derivation_layer_derives_values_later: true,
      deterministic_map_is_source_of_pointers: true,
      semantic_queue_is_authoritative_for_semantic_coverage: true,
      primary_domain_derivation_forbidden_in_2b: true,
      ai_overlay_derivation_forbidden_in_2b: true,
      regulatory_overlay_derivation_forbidden_in_2b: true,
      fusion_candidate_requires_composite_signal: true,
      fusion_lock_forbidden_in_2b: true,
      domain_package_selection_forbidden_in_2b: true,
      active_run_package_manifest_update_forbidden_in_2b: true,
      source_artifacts_remain_source_of_truth: true,
      full_text_copied: false,
      summaries_allowed: false,
      excerpts_allowed: false,
      legal_or_compliance_conclusions_allowed: false,
      legal_cartography_reserved_for_2e: true,
      data_privacy_navigation_reserved_for_dpni: true,
      phase1_v5_12_root_source_contract_required: true,
      old_family_input_contract_forbidden: true,
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
      route_class: firstValue(row.route_classes) || queue.route_class || "",
      route_classes: asArray(row.route_classes),
      route_code: queue.route_code || "",
      route_signal_families: asArray(row.route_signal_families),
      confidence: row.confidence || "UNCLEAR",
      navigation_pointer: queue.navigation_pointer || null,
      source_artifact: queue.source_artifact || "",
      source_id: queue.source_id || "",
      common_root: normalizeCommonRoot(queue.common_root || ""),
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
    return stripForbiddenKeys(stripEmpty({
      ...row,
      route_classes: semantic.route_classes || [],
      route_signal_families: semantic.route_signal_families || [],
      semantic_confidence: semantic.confidence || ""
    }));
  });
}

function buildPriorityDomainActivityLocator({ map, semanticNavigationIndex }) {
  const priorityUnits = new Set(semanticNavigationIndex.filter((row) => ["P0", "P1"].includes(row.priority) || row.confidence === "CLEAR").map((row) => row.unit_id));
  const locatorRows = LOCATOR_MAP_KEYS.flatMap((key) => asArray(map[key]));
  const priorityRows = locatorRows.filter((row) => priorityUnits.has(row.unit_id) || ["P0", "P1"].includes(row.priority));
  const ranked = priorityRows.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  return pointerRows(ranked.slice(0, 100));
}

function compileMissingLimitedRows(map) {
  return [
    ...asArray(map.missing_limited_domain_activity_source_map),
    ...asArray(map.quality_repair_queue).map((row, index) => ({
      missing_id: row.repair_id || `P2B.REPAIR.${String(index + 1).padStart(3, "0")}`,
      source_artifact: row.source_artifact || "",
      source_id: row.source_id || "",
      common_root: normalizeCommonRoot(row.common_root || ""),
      status: "REPAIR_REQUIRED",
      limitation: row.reason || row.limitation || "Phase 2B quality repair row."
    }))
  ].map(stripForbiddenKeys);
}

function pointerRows(rows) {
  return asArray(rows).map((row) => {
    const next = stripForbiddenKeys({ ...row });
    next.common_root = normalizeCommonRoot(next.common_root || "");
    next.phase_2b_action = next.phase_2b_action || "LOCATE_ONLY";
    next.derived_value_emitted = false;
    next.source_text_copied = false;
    if (next.route_class === "FUSION_CANDIDATE_ROUTE" && next.fusion_basis) {
      next.fusion_basis = stripForbiddenKeys({ ...next.fusion_basis });
    }
    return stripEmpty(next);
  });
}

function stripForbiddenKeys(row) {
  const next = { ...row };
  for (const key of COPY_AND_VALUE_KEYS) delete next[key];
  return next;
}

function resolveLockStatus({ map, semanticCoverage, missingLimited }) {
  if (!asArray(map.domain_activity_source_coverage_index).length) return "CONTROLLED_FAILURE";
  if (semanticCoverage?.ready_for_compiler === false) return "REPAIR_REQUIRED";
  if (missingLimited.length || map.lock_status === "LOCKED_WITH_LIMITATIONS") return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}

function keepFinalShape(value) { return Object.fromEntries(P2B_DOMAIN_ACTIVITY_FINAL_INDEX_KEYS.map((key) => [key, value[key] ?? (key === "downstream_rules" ? {} : key === "lock_status" ? "REPAIR_REQUIRED" : [])])); }
function unwrapRoot(value, root) { if (!value || typeof value !== "object") return {}; const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value; return artifact[root] || artifact || {}; }
function firstValue(value) { return Array.isArray(value) && value.length ? value[0] : ""; }
function priorityRank(value) { return value === "P0" ? 0 : value === "P1" ? 1 : value === "P2" ? 2 : 9; }
function normalizeCommonRoot(value) { return String(value || "").replace(/^lossless_root__/, ""); }
function stripEmpty(row) { return Object.fromEntries(Object.entries(row || {}).filter(([, value]) => value !== undefined && value !== null)); }
function asArray(value) { return Array.isArray(value) ? value : []; }
