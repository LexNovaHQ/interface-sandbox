import { FEATURE_CANDIDATE_INDEX_BOUNDARY, FEATURE_CANDIDATE_INVENTORY_ARTIFACT } from "./activity-candidate-inventory.boundary.js";

export const FEATURE_CANDIDATE_INVENTORY_VERSION = "m8_feature_candidate_inventory_index_v2_phase2c";
export const FEATURE_CANDIDATE_INVENTORY_MODE = "DETERMINISTIC_INDEX_FROM_ACTIVITY_PROFILE_SOURCE_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION";

const CANDIDATE_LOCATOR_MAPS = Object.freeze([
  "activity_candidate_source_locator_map",
  "product_capability_locator_map",
  "feature_mechanics_locator_map",
  "technical_mechanics_locator_map",
  "api_interaction_locator_map",
  "data_object_interaction_locator_map",
  "integration_action_locator_map",
  "commercial_availability_locator_map",
  "external_action_context_locator_map",
  "input_output_object_context_locator_map"
]);

const CONTEXT_ONLY_LOCATOR_MAPS = Object.freeze([
  "customer_use_context_locator_map",
  "support_operational_context_locator_map",
  "automation_transparency_context_locator_map",
  "human_control_context_locator_map"
]);

export function buildFeatureCandidateInventoryIndex(activityProfileSourceIndexInput, options = {}) {
  const index = unwrapActivityProfileSourceIndex(activityProfileSourceIndexInput);
  const rawHits = CANDIDATE_LOCATOR_MAPS.flatMap((mapKey) => rows(index[mapKey]).filter(candidateRowAllowed).map((row) => rawHitFromLocator(row, mapKey)))
    .map((hit, index) => ({ ...hit, raw_hit_id: `RH.${String(index + 1).padStart(3, "0")}` }));
  const { candidates, dedup_index, parent_child_overlap_index } = canonicalizeRawHits(rawHits);
  const contextRows = CONTEXT_ONLY_LOCATOR_MAPS.flatMap((mapKey) => rows(index[mapKey]).map((row) => contextPointerFromLocator(row, mapKey)));

  return Object.freeze({
    artifact_type: FEATURE_CANDIDATE_INVENTORY_ARTIFACT,
    inventory_version: FEATURE_CANDIDATE_INVENTORY_VERSION,
    run_id: options.runId || index?.run_id || null,
    derivation_mode: FEATURE_CANDIDATE_INVENTORY_MODE,
    source_index_artifact: "activity_profile_source_index",
    source_locator_maps_indexed: CANDIDATE_LOCATOR_MAPS.filter((mapKey) => rows(index[mapKey]).length),
    raw_hit_count: rawHits.length,
    canonical_candidate_count: candidates.length,
    raw_feature_hit_index: rawHits.map(stripRawHit),
    candidates,
    canonicalization_index: candidates.map((candidate) => ({ candidate_id: candidate.candidate_id, canonical_feature_key: candidate.canonical_feature_key, merged_raw_hit_ids: candidate.merged_raw_hit_ids })),
    dedup_index,
    parent_child_overlap_index,
    dedup_summary: Object.freeze({ merged_duplicate_count: dedup_index.length, parent_child_overlap_count: parent_child_overlap_index.length }),
    context_pointer_index: contextRows,
    index_boundary: Object.freeze({
      ...FEATURE_CANDIDATE_INDEX_BOUNDARY,
      index_only: true,
      source_index_artifact: "activity_profile_source_index",
      phase_2c_navigation_only: true,
      no_source_text_copy: true,
      no_mechanics_proof: true,
      no_activity_summary: true,
      no_archetype_or_surface_derivation: true,
      no_package_specific_activity_classification: true,
      mounted_domain_package_controls_activity_taxonomy_later: true
    }),
    index_limitations: rawHits.length ? [] : ["No candidate-creation locator rows were available in activity_profile_source_index. Phase 5 material profile should emit controlled limitations until 2C is repaired."]
  });
}

export const buildFeatureCandidateInventory = buildFeatureCandidateInventoryIndex;

export function validateFeatureCandidateInventoryIndex(input) {
  const inventory = unwrapInventory(input);
  const failures = [];
  if (inventory?.artifact_type !== FEATURE_CANDIDATE_INVENTORY_ARTIFACT) failures.push("artifact_type must be feature_candidate_inventory");
  if (inventory?.inventory_version !== FEATURE_CANDIDATE_INVENTORY_VERSION) failures.push("inventory_version mismatch");
  if (inventory?.derivation_mode !== FEATURE_CANDIDATE_INVENTORY_MODE) failures.push("inventory must be deterministic Phase 2C index-only mode");
  if (inventory?.source_index_artifact !== "activity_profile_source_index") failures.push("inventory must derive from activity_profile_source_index");
  if (!Array.isArray(inventory?.candidates)) failures.push("candidates must be array");
  if (!Array.isArray(inventory?.raw_feature_hit_index)) failures.push("raw_feature_hit_index must be array");
  if (!inventory?.index_boundary?.index_only || !inventory?.index_boundary?.no_source_text_copy) failures.push("index boundary missing");
  if (inventory?.index_boundary?.no_package_specific_activity_classification !== true) failures.push("package classification boundary missing");
  const keys = new Set();
  for (const candidate of inventory?.candidates || []) {
    if (!candidate.candidate_id || !candidate.canonical_feature_key) failures.push("candidate missing id/key");
    if (keys.has(candidate.canonical_feature_key)) failures.push(`duplicate canonical key:${candidate.canonical_feature_key}`);
    keys.add(candidate.canonical_feature_key);
    if (!Array.isArray(candidate.source_pointers) || !candidate.source_pointers.length) failures.push(`${candidate.candidate_id || "candidate"}:source_pointers_missing`);
    for (const pointer of candidate.source_pointers || []) {
      if (!pointer.source_artifact || !pointer.source_root || !pointer.route_class) failures.push(`${candidate.candidate_id || "candidate"}:source_pointer_missing_phase2c_locator_fields`);
    }
  }
  if (containsEvidenceCopy(inventory)) failures.push("inventory contains evidence-copy fields");
  if (containsPackageClassification(inventory)) failures.push("inventory contains package-specific classification fields");
  return Object.freeze({ status: failures.length ? "FAIL" : "PASS", failures });
}

export const validateFeatureCandidateInventory = validateFeatureCandidateInventoryIndex;

export function validateFeatureCandidateCoverage(inventoryInput, profileInput, options = {}) {
  const inventory = unwrapInventory(inventoryInput);
  const profile = profileInput?.target_feature_profile || profileInput;
  const failures = [...validateFeatureCandidateInventoryIndex(inventory).failures];
  if (!Array.isArray(profile?.activities)) failures.push("target_feature_profile.activities must be array");
  if (failures.length) return coverageResult("FAIL", failures, [], []);
  const candidateIds = new Set(inventory.candidates.map((candidate) => candidate.candidate_id));
  const activityRefs = new Set((profile.activities || []).map((activity) => activity.activity_reference).filter(Boolean));
  const covered = new Set();
  const coverageRows = [];
  const add = (candidate_id, activity_reference, disposition, path, reason = "") => { if (!candidate_id) return failures.push(`${path}:candidate_id_missing`); if (!candidateIds.has(candidate_id)) return failures.push(`${path}:unknown_candidate:${candidate_id}`); if (activity_reference && !activityRefs.has(activity_reference)) failures.push(`${path}:unknown_activity:${activity_reference}`); covered.add(candidate_id); coverageRows.push({ candidate_id, activity_reference: activity_reference || null, coverage_disposition: disposition || "DIRECT_ACTIVITY_ROW", coverage_path: path, reason }); };
  for (const activity of profile.activities || []) for (const candidate_id of activity.source_candidate_ids || []) add(candidate_id, activity.activity_reference, activity.coverage_disposition, "activity.source_candidate_ids");
  for (const row of options.coverageLedger || options.candidate_to_activity_coverage_ledger || []) add(row.candidate_id || row.source_candidate_id || row.canonical_candidate_id, row.activity_reference, row.coverage_disposition || row.disposition, "candidate_to_activity_coverage_ledger", row.reason || "");
  for (const row of options.exclusionLedger || options.candidate_exclusion_ledger || []) if (row.reason || row.exclusion_reason) add(row.candidate_id || row.source_candidate_id, null, row.disposition || "EXCLUDED_NON_PRODUCT_ACTIVITY", "candidate_exclusion_ledger", row.reason || row.exclusion_reason);
  const uncovered = inventory.candidates.filter((candidate) => !covered.has(candidate.candidate_id));
  for (const candidate of uncovered) failures.push(`uncovered candidate:${candidate.candidate_id}:${candidate.candidate_name}`);
  return coverageResult(failures.length ? "FAIL" : "PASS", failures, uncovered, coverageRows);
}

export function buildM8FeatureCoverageForensics(inventoryInput, profileInput, options = {}) {
  const inventory = unwrapInventory(inventoryInput);
  const validation = options.coverageResult || validateFeatureCandidateCoverage(inventory, profileInput, options);
  return Object.freeze({ feature_candidate_inventory_ref: { artifact_name: FEATURE_CANDIDATE_INVENTORY_ARTIFACT, inventory_version: inventory?.inventory_version || "", run_id: inventory?.run_id || "", canonical_candidate_count: inventory?.canonical_candidate_count || 0, raw_hit_count: inventory?.raw_hit_count || 0, source_of_truth: true }, raw_feature_hit_derivation_ledger: (inventory?.raw_feature_hit_index || []).map(({ raw_hit_id, raw_type, source_pointer, confidence_basis }) => ({ raw_hit_id, raw_type, source_pointer, confidence_basis })), canonicalization_derivation_ledger: inventory?.canonicalization_index || [], dedup_decision_ledger: inventory?.dedup_index || [], parent_child_overlap_ledger: validation.coverage_rows || [], validation_result: validation });
}

function unwrapActivityProfileSourceIndex(input) {
  if (input?.activity_profile_source_index && typeof input.activity_profile_source_index === "object") return input.activity_profile_source_index;
  if (input?.artifact?.activity_profile_source_index && typeof input.artifact.activity_profile_source_index === "object") return input.artifact.activity_profile_source_index;
  if (input?.artifact && typeof input.artifact === "object" && (input.artifact.activity_candidate_source_locator_map || input.artifact.product_capability_locator_map)) return input.artifact;
  return input || {};
}

function candidateRowAllowed(row = {}) { return row && row.route_action === "LOCATE_ONLY" && row.candidate_creation_allowed !== false && row.context_only !== true; }
function rows(value) { return Array.isArray(value) ? value.filter((row) => row && typeof row === "object") : []; }

function rawHitFromLocator(row, mapKey) {
  const sourceRoot = String(row.common_root || row.source_root || "");
  const routeClass = String(row.route_class || mapKey.replace(/_locator_map$/, ""));
  const routeCode = String(row.route_code || routeClass).toLowerCase();
  const candidateName = humanize(firstNonEmptyString(row.matched_signal_labels?.[0], row.route_class, row.route_code, row.unit_id, row.source_id, sourceRoot));
  return {
    source_root: sourceRoot,
    source_locator_map: mapKey,
    source_id: row.source_id || "",
    raw_name: candidateName,
    raw_type: normalizeRawType(routeClass),
    activity_route_class: routeClass,
    capability_key: normalizeSlug(firstNonEmptyString(row.unit_id, row.source_id, row.route_code, candidateName)),
    confidence_basis: row.confidence_hint || "phase2c_locator",
    source_pointer: pointerFromLocator(row)
  };
}

function contextPointerFromLocator(row, mapKey) { return { source_locator_map: mapKey, source_artifact: row.source_artifact || "", source_id: row.source_id || "", source_root: row.common_root || "", route_class: row.route_class || "", route_code: row.route_code || "", locator_id: row.locator_id || "", unit_id: row.unit_id || "", source_pointer: row.source_pointer || null, unit_pointer: row.unit_pointer || null }; }
function pointerFromLocator(row) { return { source_artifact: row.source_artifact || "", source_id: row.source_id || "", source_root: row.common_root || "", route_class: row.route_class || "", route_code: row.route_code || "", locator_id: row.locator_id || "", unit_id: row.unit_id || "", source_pointer: row.source_pointer || null, unit_pointer: row.unit_pointer || null }; }

function canonicalizeRawHits(rawHits) {
  const byKey = new Map();
  for (const hit of rawHits) {
    const key = `${hit.activity_route_class}::${hit.capability_key}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(hit);
  }
  const candidates = [];
  const dedup_index = [];
  let counter = 1;
  for (const [canonical_feature_key, hits] of [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const primary = hits[0];
    const candidate_id = `FC.${String(counter++).padStart(3, "0")}`;
    const merged_raw_hit_ids = hits.map((hit) => hit.raw_hit_id);
    for (const duplicate of hits.slice(1)) dedup_index.push({ canonical_candidate_id: candidate_id, primary_raw_hit_id: primary.raw_hit_id, merged_raw_hit_id: duplicate.raw_hit_id, merge_basis: "same_phase2c_route_and_capability_key" });
    candidates.push({ candidate_id, canonical_feature_key, candidate_name: primary.raw_name, candidate_type: primary.raw_type, candidate_status: "CANONICAL_CANDIDATE", activity_route_class: primary.activity_route_class, capability_key: primary.capability_key, source_root: primary.source_root, mandatory_profile_treatment: "PACKAGE_AWARE_ACTIVITY_REVIEW_OR_LIMITATION", merged_raw_hit_ids, source_pointers: hits.map((hit) => hit.source_pointer) });
  }
  return { candidates, dedup_index, parent_child_overlap_index: [] };
}

function normalizeRawType(routeClass) { return String(routeClass || "GENERIC_ACTIVITY_LOCATOR").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "GENERIC_ACTIVITY_LOCATOR"; }
function stripRawHit(hit) { return { raw_hit_id: hit.raw_hit_id, source_root: hit.source_root, source_locator_map: hit.source_locator_map, source_id: hit.source_id, raw_name: hit.raw_name, raw_type: hit.raw_type, activity_route_class: hit.activity_route_class, capability_key: hit.capability_key, confidence_basis: hit.confidence_basis, source_pointer: hit.source_pointer }; }
function coverageResult(status, failures, uncovered, coverageRows) { return { coverage_result: status, failures, uncovered_candidates: uncovered.map(({ candidate_id, candidate_name, candidate_type, canonical_feature_key }) => ({ candidate_id, candidate_name, candidate_type, canonical_feature_key })), coverage_rows: coverageRows, repair_required: status !== "PASS" }; }
function unwrapInventory(input) { return input?.feature_candidate_inventory || input; }
function normalizeSlug(value) { return String(value || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-"); }
function humanize(value) { return normalizeSlug(value).split("-").filter(Boolean).map((word) => ["api", "ai", "llm", "tts", "stt"].includes(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }
function firstNonEmptyString(...values) { for (const value of values.flat()) if (typeof value === "string" && value.trim()) return value.trim().slice(0, 200); return "Activity Candidate"; }
function containsEvidenceCopy(value) { if (!value || typeof value !== "object") return false; if (Array.isArray(value)) return value.some(containsEvidenceCopy); return Object.keys(value).some((key) => ["excerpt", "lossless_text", "clean_text", "text", "mechanics_proof", "evidence_summary", "activity_candidate_summary", "archetype_proof", "surface_proof_and_routing_limits"].includes(key)) || Object.values(value).some(containsEvidenceCopy); }
function containsPackageClassification(value) { if (!value || typeof value !== "object") return false; if (Array.isArray(value)) return value.some(containsPackageClassification); return Object.keys(value).some((key) => ["archetype_codes", "surface_context_tokens", "package_activity_classification", "package_specific_field_family", "selected_package"].includes(key)) || Object.values(value).some(containsPackageClassification); }
