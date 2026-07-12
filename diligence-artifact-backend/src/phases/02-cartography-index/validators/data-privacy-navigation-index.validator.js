import {
  P2D_DATA_PRIVACY_ARTIFACTS,
  P2D_DATA_PRIVACY_FINAL_INDEX_KEYS,
  P2D_DATA_PRIVACY_FORBIDDEN_INPUTS
} from "../data-privacy-navigation-index.contract.js";

const FINAL_ARTIFACT = P2D_DATA_PRIVACY_ARTIFACTS.finalIndex;
const DETERMINISTIC_ARTIFACT = P2D_DATA_PRIVACY_ARTIFACTS.deterministicMap;
const SEMANTIC_ARTIFACT = P2D_DATA_PRIVACY_ARTIFACTS.semanticProfile;

const FORBIDDEN_OUTPUT_ROOT_KEYS = Object.freeze([
  "data_provenance_profile",
  "data_provenance_profile_forensics",
  "integrated_dap_report",
  "extended_dap_india_readiness_profile",
  "data_provenance_source_index"
]);

export function validateDataPrivacyDeterministicMap(root = {}) {
  const map = unwrap(root, DETERMINISTIC_ARTIFACT);
  const errors = [];
  if (!map || typeof map !== "object" || Array.isArray(map)) errors.push("deterministic_map_not_object");
  if (map?.artifact_type !== DETERMINISTIC_ARTIFACT) errors.push(`wrong_deterministic_artifact_type:${map?.artifact_type || "missing"}`);
  if (!Array.isArray(map?.data_source_routes) || map.data_source_routes.length !== 5) errors.push(`data_source_route_count_not_5:${map?.data_source_routes?.length || 0}`);
  if (!Array.isArray(map?.legal_index_routes) || map.legal_index_routes.length !== 2) errors.push(`legal_index_route_count_not_2:${map?.legal_index_routes?.length || 0}`);
  scanForbiddenInputs(map, errors);
  scanForbiddenRootKeys(map, errors);
  return result(errors);
}

export function validateDataPrivacySemanticProfile(root = {}) {
  const profile = unwrap(root, SEMANTIC_ARTIFACT);
  const errors = [];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) errors.push("semantic_profile_not_object");
  if (profile?.artifact_type !== SEMANTIC_ARTIFACT) errors.push(`wrong_semantic_artifact_type:${profile?.artifact_type || "missing"}`);
  const pointers = profile?.semantic_navigation_overlay?.batch_navigation_pointers || [];
  if (!Array.isArray(pointers) || !pointers.length) errors.push("missing_batch_navigation_pointers");
  for (const pointer of pointers) validateBatchPointer(pointer, errors);
  scanForbiddenInputs(profile, errors);
  scanForbiddenRootKeys(profile, errors);
  return result(errors);
}

export function validateDataPrivacyNavigationIndex(root = {}) {
  const index = unwrap(root, FINAL_ARTIFACT);
  const errors = [];
  if (!index || typeof index !== "object" || Array.isArray(index)) errors.push("final_index_not_object");
  if (index?.artifact_type !== FINAL_ARTIFACT) errors.push(`wrong_final_artifact_type:${index?.artifact_type || "missing"}`);
  const keys = Object.keys(index || {});
  if (JSON.stringify(keys) !== JSON.stringify([...P2D_DATA_PRIVACY_FINAL_INDEX_KEYS])) errors.push(`final_key_order_or_membership_mismatch:${JSON.stringify(keys)}`);
  const spine = index?.deterministic_navigation_spine || {};
  if (!Array.isArray(spine.data_source_routes) || spine.data_source_routes.length !== 5) errors.push(`final_data_source_route_count_not_5:${spine.data_source_routes?.length || 0}`);
  if (!Array.isArray(spine.legal_index_routes) || spine.legal_index_routes.length !== 2) errors.push(`final_legal_index_route_count_not_2:${spine.legal_index_routes?.length || 0}`);
  const pointers = index?.semantic_navigation_overlay?.batch_navigation_pointers || [];
  if (!Array.isArray(pointers) || !pointers.length) errors.push("final_missing_batch_navigation_pointers");
  for (const pointer of pointers) validateBatchPointer(pointer, errors);
  if (index?.navigation_policy?.no_free_corpus_read !== true) errors.push("navigation_policy_no_free_corpus_read_missing");
  if (index?.navigation_policy?.no_legacy_family_inputs !== true) errors.push("navigation_policy_no_legacy_family_inputs_missing");
  if (index?.navigation_policy?.no_compiler_output !== true) errors.push("navigation_policy_no_compiler_output_missing");
  if (index?.navigation_policy?.no_forensics_output !== true) errors.push("navigation_policy_no_forensics_output_missing");
  scanForbiddenInputs(index, errors);
  scanForbiddenRootKeys(index, errors);
  return result(errors);
}

function validateBatchPointer(pointer = {}, errors) {
  if (!pointer.batch_id) errors.push("batch_pointer_missing_batch_id");
  if (!pointer.expected_artifact_name) errors.push(`batch_pointer_missing_artifact:${pointer.batch_id || "missing"}`);
  if (!Array.isArray(pointer.required_data_source_route_ids) || !pointer.required_data_source_route_ids.length) errors.push(`batch_pointer_missing_data_routes:${pointer.batch_id || "missing"}`);
  if (!Array.isArray(pointer.required_d_family_route_ids) || !pointer.required_d_family_route_ids.length) errors.push(`batch_pointer_missing_legacy_d_routes:${pointer.batch_id || "missing"}`);
  if (!Array.isArray(pointer.selective_legal_route_ids) || !pointer.selective_legal_route_ids.length) errors.push(`batch_pointer_missing_legal_routes:${pointer.batch_id || "missing"}`);
  if (!Array.isArray(pointer.selective_l_family_route_ids) || !pointer.selective_l_family_route_ids.length) errors.push(`batch_pointer_missing_legacy_l_routes:${pointer.batch_id || "missing"}`);
}

function scanForbiddenInputs(value, errors) {
  for (const token of P2D_DATA_PRIVACY_FORBIDDEN_INPUTS) {
    if (containsExactMarker(value, token)) errors.push(`forbidden_input_token:${token}`);
  }
}

function containsExactMarker(value, marker) {
  if (typeof value === "string") return value === marker;
  if (Array.isArray(value)) return value.some((item) => containsExactMarker(item, marker));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, item]) => key === marker || containsExactMarker(item, marker));
}

function scanForbiddenRootKeys(value, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_OUTPUT_ROOT_KEYS.includes(key)) errors.push(`forbidden_output_root:${key}`);
  }
}

function containsExactMarker(value, marker) {
  if (typeof value === "string") return value === marker;
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsExactMarker(item, marker));
  return Object.entries(value).some(([key, item]) => key === marker || containsExactMarker(item, marker));
}

function unwrap(value, artifactName) {
  if (value && typeof value === "object" && artifactName in value) return value[artifactName];
  if (value && typeof value === "object" && value.payload && artifactName in value.payload) return value.payload[artifactName];
  return value;
}

function result(errors) {
  return Object.freeze({ status: errors.length ? "REPAIR_REQUIRED" : "PASS", errors: Object.freeze(errors) });
}
