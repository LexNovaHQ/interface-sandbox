import {
  CONTROL_SOURCE_ROUTE_CATALOG,
  DOMAIN_CONTROL_OBLIGATION_LEGAL_INDEX_INPUTS,
  OBLIGATION_SHELL_FIELDS,
  P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS
} from "../domain-control-obligation-navigation-index.contract.js";
import { catalogLocatorFamilySet } from "../services/domain-control-obligation-navigation-index.builder.js";

const ALLOWED_ROUTE_IDS = new Set(CONTROL_SOURCE_ROUTE_CATALOG.map((entry) => `DCONI-SRC-${entry.route_code}`));
const ALLOWED_LOCATORS = catalogLocatorFamilySet();
const ALLOWED_FIELDS = new Set(OBLIGATION_SHELL_FIELDS);
const FORBIDDEN_KEYS = new Set(["lossless_text", "clean_text", "text", "excerpt", "snippet", "summary", "profile_answer", "legal_conclusion", "compliance_conclusion", "risk_conclusion", "obligation_posture", "posture_status", "derived_value", "obligation_present", "obligation_absent", "obligation_partial"]);
const RETIRED_SOURCE_VALUES = new Set(["lossless_root__security_trust", "lossless_root__trust_compliance", "lossless_root__technical_docs_api_developer", "data_provenance_source_index"]);

export function validateDomainControlObligationDeterministicMap(map = {}) {
  const artifact = unwrap(map, P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.deterministicMap);
  const errors = [];
  if (artifact.artifact_type !== P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.deterministicMap) errors.push("DOMAIN_CONTROL_OBLIGATION_DETERMINISTIC_MAP_TYPE_INVALID");
  validateNavigationFlags(artifact, errors);
  if (!Array.isArray(artifact.control_source_routes) || !artifact.control_source_routes.length) errors.push("DOMAIN_CONTROL_OBLIGATION_CONTROL_SOURCE_ROUTES_MISSING");
  for (const route of artifact.control_source_routes || []) validateControlRoute(route, errors);
  const legalRouteNames = new Set((artifact.legal_index_routes || []).map((route) => route.artifact_name));
  for (const required of DOMAIN_CONTROL_OBLIGATION_LEGAL_INDEX_INPUTS) if (!legalRouteNames.has(required)) errors.push(`DOMAIN_CONTROL_OBLIGATION_LEGAL_INDEX_ROUTE_MISSING:${required}`);
  if (!Array.isArray(artifact.access_gap_ledger)) errors.push("DOMAIN_CONTROL_OBLIGATION_ACCESS_GAP_LEDGER_MISSING");
  if (containsForbiddenShape(artifact)) errors.push("DOMAIN_CONTROL_OBLIGATION_INDEX_CONTAINS_DERIVED_VALUE");
  return result(errors);
}

export function validateDomainControlObligationSemanticProfile(profile = {}) {
  const artifact = unwrap(profile, P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.semanticProfile);
  const errors = [];
  if (artifact.artifact_type !== P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.semanticProfile) errors.push("DOMAIN_CONTROL_OBLIGATION_SEMANTIC_PROFILE_TYPE_INVALID");
  validateNavigationFlags(artifact, errors);
  if (!Array.isArray(artifact.loaded_obligation_catalogs) || !artifact.loaded_obligation_catalogs.length) errors.push("OBLIGATION_CATALOG_NOT_LOADED");
  for (const row of artifact.obligation_family_routing || []) validateFamilyRoute(row, errors);
  validateShellInventory(artifact.obligation_shell_locator_inventory, errors);
  if (containsForbiddenShape(artifact)) errors.push("DOMAIN_CONTROL_OBLIGATION_INDEX_CONTAINS_DERIVED_VALUE");
  return result(errors);
}

export function validateDomainControlObligationNavigationIndex(index = {}) {
  const artifact = unwrap(index, P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.finalIndex);
  const errors = [];
  if (artifact.artifact_type !== P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.finalIndex) errors.push("DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_TYPE_INVALID");
  if (artifact.navigation_rules?.domain_lock_allowed !== false) errors.push("PHASE_2_DOMAIN_LOCK_ATTEMPTED");
  if (artifact.navigation_rules?.contains_obligation_posture !== false) errors.push("DOMAIN_CONTROL_OBLIGATION_INDEX_CONTAINS_OBLIGATION_POSTURE");
  if (artifact.navigation_rules?.contains_lossless_text !== false) errors.push("INDEX_CONTAINS_LOSSLESS_TEXT");
  if (artifact.navigation_rules?.contains_profile_answers !== false) errors.push("INDEX_CONTAINS_PROFILE_ANSWER");
  if (!Array.isArray(artifact.control_source_routes) || !artifact.control_source_routes.length) errors.push("DOMAIN_CONTROL_OBLIGATION_CONTROL_SOURCE_ROUTES_MISSING");
  for (const route of artifact.control_source_routes || []) validateControlRoute(route, errors);
  for (const row of artifact.obligation_family_routing || []) validateFamilyRoute(row, errors);
  validateShellInventory(artifact.obligation_shell_locator_inventory, errors);
  if (!Array.isArray(artifact.access_gap_ledger)) errors.push("DOMAIN_CONTROL_OBLIGATION_ACCESS_GAP_LEDGER_MISSING");
  if (!Array.isArray(artifact.loaded_obligation_catalogs) || !artifact.loaded_obligation_catalogs.length) errors.push("OBLIGATION_CATALOG_NOT_LOADED");
  if (containsForbiddenShape(artifact)) errors.push("DOMAIN_CONTROL_OBLIGATION_INDEX_CONTAINS_DERIVED_VALUE");
  return result(errors);
}

function validateNavigationFlags(artifact = {}, errors = []) {
  if (artifact.navigation_only !== true) errors.push("DOMAIN_CONTROL_OBLIGATION_NAVIGATION_ONLY_FLAG_MISSING");
  if (artifact.domain_lock_allowed !== false) errors.push("PHASE_2_DOMAIN_LOCK_ATTEMPTED");
  if (artifact.contains_lossless_text !== false) errors.push("INDEX_CONTAINS_LOSSLESS_TEXT");
  if (artifact.contains_profile_answers !== false) errors.push("INDEX_CONTAINS_PROFILE_ANSWER");
  if (artifact.contains_obligation_posture !== false) errors.push("DOMAIN_CONTROL_OBLIGATION_INDEX_CONTAINS_OBLIGATION_POSTURE");
  if (artifact.contains_legal_or_compliance_conclusions !== false) errors.push("INDEX_CONTAINS_LEGAL_OR_COMPLIANCE_CONCLUSION");
}

function validateControlRoute(route = {}, errors = []) {
  if (!route.route_id || !ALLOWED_ROUTE_IDS.has(route.route_id)) errors.push(`DOMAIN_CONTROL_OBLIGATION_UNKNOWN_ROUTE:${route.route_id || "missing"}`);
  if (!Array.isArray(route.pointers) || !route.pointers.length) errors.push(`DOMAIN_CONTROL_OBLIGATION_ROUTE_MISSING_POINTERS:${route.route_id || "missing"}`);
  for (const pointer of route.pointers || []) if (!isPhase1Root(pointer.artifact_name)) errors.push(`DOMAIN_CONTROL_OBLIGATION_POINTER_NOT_PHASE1_ROOT:${pointer.artifact_name || "missing"}`);
}

function validateFamilyRoute(row = {}, errors = []) {
  for (const id of row.required_control_source_route_ids || []) if (!ALLOWED_ROUTE_IDS.has(id)) errors.push(`DOMAIN_CONTROL_OBLIGATION_ROUTE_ID_UNRESOLVED:${id}`);
  for (const id of row.selective_legal_route_ids || []) if (!String(id).startsWith("DCONI-LEGAL-")) errors.push(`DOMAIN_CONTROL_OBLIGATION_LEGAL_ROUTE_ID_INVALID:${id}`);
  for (const locator of row.locator_families || []) if (!ALLOWED_LOCATORS.has(locator)) errors.push(`DOMAIN_CONTROL_OBLIGATION_UNKNOWN_LOCATOR_FAMILY:${locator}`);
  for (const field of row.shell_field_targets || []) if (!ALLOWED_FIELDS.has(field)) errors.push(`DOMAIN_CONTROL_OBLIGATION_UNKNOWN_SHELL_FIELD:${field}`);
  if (row.action !== "LOCATE_ONLY") errors.push(`DOMAIN_CONTROL_OBLIGATION_ROUTE_NOT_LOCATE_ONLY:${row.obligation_family || "unknown"}`);
  if (row.derived_value_forbidden !== true) errors.push(`DOMAIN_CONTROL_OBLIGATION_DERIVED_VALUE_NOT_FORBIDDEN:${row.obligation_family || "unknown"}`);
}

function validateShellInventory(rows = [], errors = []) {
  if (!Array.isArray(rows) || rows.length !== OBLIGATION_SHELL_FIELDS.length) errors.push("DOMAIN_CONTROL_OBLIGATION_SHELL_INVENTORY_FIELD_COUNT_INVALID");
  const keys = new Set((rows || []).map((row) => row.shell_field_id));
  for (const field of OBLIGATION_SHELL_FIELDS) if (!keys.has(field)) errors.push(`DOMAIN_CONTROL_OBLIGATION_SHELL_FIELD_MISSING:${field}`);
  for (const row of rows || []) {
    if (row.action !== "LOCATE_ONLY") errors.push(`DOMAIN_CONTROL_OBLIGATION_SHELL_FIELD_NOT_LOCATE_ONLY:${row.shell_field_id || "missing"}`);
    if (row.derived_value_forbidden !== true) errors.push(`DOMAIN_CONTROL_OBLIGATION_SHELL_FIELD_DERIVED_VALUE_ALLOWED:${row.shell_field_id || "missing"}`);
    for (const locator of row.locator_families || []) if (!ALLOWED_LOCATORS.has(locator)) errors.push(`DOMAIN_CONTROL_OBLIGATION_SHELL_UNKNOWN_LOCATOR:${row.shell_field_id || "missing"}:${locator}`);
  }
}

function containsForbiddenShape(value) {
  if (value == null) return false;
  if (typeof value === "string") return value.includes("lossless_family__") || RETIRED_SOURCE_VALUES.has(value);
  if (Array.isArray(value)) return value.some(containsForbiddenShape);
  if (typeof value !== "object") return false;
  for (const [key, inner] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) return true;
    if (key === "control_posture_status" && typeof inner !== "boolean") return true;
    if (containsForbiddenShape(inner)) return true;
  }
  return false;
}

function isPhase1Root(value) { const name = String(value || ""); return name.startsWith("lossless_root__") && !RETIRED_SOURCE_VALUES.has(name); }
function unwrap(value = {}, artifactName) { if (value?.[artifactName]) return value[artifactName]; if (value?.artifact_type === artifactName) return value; return value || {}; }
function result(errors = []) { return Object.freeze({ ok: errors.length === 0, status: errors.length ? "FAIL" : "PASS", errors: Object.freeze(errors), warnings: Object.freeze([]) }); }
