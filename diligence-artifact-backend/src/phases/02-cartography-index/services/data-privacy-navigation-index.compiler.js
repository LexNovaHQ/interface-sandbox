import {
  P2D_DATA_PRIVACY_ARTIFACTS,
  P2D_DATA_PRIVACY_FINAL_INDEX_KEYS,
  P2D_DATA_PRIVACY_DOWNSTREAM_RULES
} from "../data-privacy-navigation-index.contract.js";

const FINAL_ARTIFACT = P2D_DATA_PRIVACY_ARTIFACTS.finalIndex;
const DETERMINISTIC_ARTIFACT = P2D_DATA_PRIVACY_ARTIFACTS.deterministicMap;
const SEMANTIC_ARTIFACT = P2D_DATA_PRIVACY_ARTIFACTS.semanticProfile;

export function compileDataPrivacyNavigationIndex({ deterministicMap, semanticProfile } = {}) {
  const deterministic = unwrap(deterministicMap, DETERMINISTIC_ARTIFACT);
  const semantic = unwrap(semanticProfile, SEMANTIC_ARTIFACT);
  const validation = validateCompiledNavigationIndex({ deterministic, semantic });
  const compiled = {
    artifact_type: FINAL_ARTIFACT,
    manifest_version: "phase2d_data_privacy_navigation_index_v1_phase1_v5_preserved_dpni_shape",
    phase_id: "CARTOGRAPHY_INDEX",
    downstream_phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "P2D_DATA_PRIVACY_NAVIGATION_INDEX",
    execution_mode: "DETERMINISTIC_PHASE1_V5_DATA_PRIVACY_NAVIGATION_INDEX",
    navigation_policy: {
      deterministic_index_construction_leads: true,
      semantic_batch_pointer_augmentation_required: true,
      phase1_v5_common_root_access_allowed_through_index: true,
      selective_legal_access_only_through_legal_cartography: true,
      legal_signal_support_only_through_legal_signal_derivation_profile: true,
      no_legacy_family_inputs: true,
      no_free_corpus_read: true,
      no_full_legal_doc_scan_without_locator: true,
      no_dossier_emission: true,
      no_compiler_output: true,
      no_forensics_output: true,
      source_text_copied: false,
      excerpts_allowed: false,
      summaries_allowed: false
    },
    deterministic_navigation_spine: {
      data_source_routes: cloneRows(deterministic?.data_source_routes),
      d_family_routes: cloneRows(deterministic?.data_source_routes),
      legal_index_routes: cloneRows(deterministic?.legal_index_routes),
      l_family_routes: cloneRows(deterministic?.legal_index_routes),
      source_custody_ledger: cloneRows(deterministic?.source_custody_ledger),
      access_gap_ledger: cloneRows(deterministic?.access_gap_ledger)
    },
    semantic_navigation_overlay: {
      batch_navigation_pointers: cloneRows(semantic?.semantic_navigation_overlay?.batch_navigation_pointers),
      overlay_rule: semantic?.semantic_navigation_overlay?.overlay_rule || "Semantic overlay adds source-route and batch reading priorities only; it does not derive field answers.",
      model_usage: "NONE_DETERMINISTIC_BATCH_POINTERS"
    },
    validation_quality_control_result: validation,
    lock_status: validation.status === "PASS" && deterministic?.lock_status === "LOCKED" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS"
  };
  return { [FINAL_ARTIFACT]: enforceExactKeyOrder(compiled) };
}

function validateCompiledNavigationIndex({ deterministic, semantic }) {
  const errors = [];
  const dataRoutes = deterministic?.data_source_routes || [];
  const legalRoutes = deterministic?.legal_index_routes || [];
  const batchPointers = semantic?.semantic_navigation_overlay?.batch_navigation_pointers || [];
  if (dataRoutes.length !== 5) errors.push(`data_source_route_count_not_5:${dataRoutes.length}`);
  if (legalRoutes.length !== 2) errors.push(`legal_index_route_count_not_2:${legalRoutes.length}`);
  if (!batchPointers.length) errors.push("missing_batch_navigation_pointers");
  for (const route of dataRoutes) {
    if (!route.route_id || !route.route_code) errors.push(`data_route_missing_identity:${route.route_id || route.route_code || "missing"}`);
    if (!route.pointers?.length) errors.push(`data_route_missing_pointers:${route.route_id || "missing"}`);
  }
  for (const route of legalRoutes) {
    if (!route.route_id || !route.source_artifact) errors.push(`legal_route_missing_identity:${route.route_id || route.source_artifact || "missing"}`);
  }
  for (const batch of batchPointers) {
    if (!batch.batch_id) errors.push("batch_pointer_missing_batch_id");
    if (!batch.expected_artifact_name) errors.push(`batch_pointer_missing_artifact:${batch.batch_id || "missing"}`);
    if (!batch.required_data_source_route_ids?.length) errors.push(`batch_pointer_missing_data_routes:${batch.batch_id || "missing"}`);
    if (!batch.required_d_family_route_ids?.length) errors.push(`batch_pointer_missing_legacy_d_routes:${batch.batch_id || "missing"}`);
    if (!batch.selective_legal_route_ids?.length) errors.push(`batch_pointer_missing_legal_routes:${batch.batch_id || "missing"}`);
    if (!batch.selective_l_family_route_ids?.length) errors.push(`batch_pointer_missing_legacy_l_routes:${batch.batch_id || "missing"}`);
  }
  if (containsForbiddenText({ deterministic, semantic })) errors.push("data_privacy_navigation_index_contains_forbidden_text_or_retired_inputs");
  return Object.freeze({ status: errors.length ? "REPAIR_REQUIRED" : "PASS", errors: Object.freeze(errors), downstream_rules: P2D_DATA_PRIVACY_DOWNSTREAM_RULES });
}

function containsForbiddenText(value) {
  const text = JSON.stringify(value || {});
  return /lossless_family__D[1-5]_|lossless_root__security_trust\b|lossless_root__trust_compliance\b|lossless_root__technical_docs_api_developer\b|data_provenance_source_index/i.test(text);
}

function cloneRows(rows = []) {
  return Array.isArray(rows) ? rows.map((row) => (row && typeof row === "object" ? JSON.parse(JSON.stringify(row)) : row)) : [];
}

function enforceExactKeyOrder(compiled) {
  const out = {};
  for (const key of P2D_DATA_PRIVACY_FINAL_INDEX_KEYS) out[key] = compiled[key];
  return out;
}

function unwrap(value, artifactName) {
  if (value && typeof value === "object" && artifactName in value) return value[artifactName];
  if (value && typeof value === "object" && value.payload && artifactName in value.payload) return value.payload[artifactName];
  return value;
}
