import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONTROL_SOURCE_ROUTE_CATALOG,
  DOMAIN_CONTROL_OBLIGATION_LEGAL_INDEX_INPUTS,
  OBLIGATION_SHELL_FIELDS,
  P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS
} from "../domain-control-obligation-navigation-index.contract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OBLIGATION_CATALOG_DIR = path.resolve(__dirname, "../../../../references/domain-packages/phase-2");
const TARGET_OBLIGATION_SHELL = "OBLIGATION_RECORD_SHELL_v1_12_FIELD";
const ROUTE_ID_PREFIX = "DCONI-SRC-";
const LEGAL_ROUTE_ID_PREFIX = "DCONI-LEGAL-";

export const OBLIGATION_CATALOGS = Object.freeze(loadObligationCatalogs());

export function loadObligationCatalogs() {
  const catalogs = [];
  try {
    if (!fs.existsSync(OBLIGATION_CATALOG_DIR)) return catalogs;
    for (const file of fs.readdirSync(OBLIGATION_CATALOG_DIR).sort()) {
      if (!file.endsWith(".obligation-catalog.json")) continue;
      try {
        const parsed = JSON.parse(fs.readFileSync(path.join(OBLIGATION_CATALOG_DIR, file), "utf8"));
        if (!parsed || parsed.may_narrow_navigation === true || parsed.may_lock_domain === true) continue;
        catalogs.push(Object.freeze({ ...parsed, catalog_file: file }));
      } catch {
        // Malformed catalogs are skipped. Phase 2 remains navigation-safe and non-blocking.
      }
    }
  } catch {
    return catalogs;
  }
  return catalogs;
}

export function catalogLocatorFamilySet(catalogs = OBLIGATION_CATALOGS) {
  const values = new Set();
  for (const catalog of catalogs || []) for (const family of Array.isArray(catalog.obligation_families) ? catalog.obligation_families : []) for (const locator of Array.isArray(family.locator_families) ? family.locator_families : []) if (typeof locator === "string" && locator.trim()) values.add(locator);
  return values;
}

export function buildDomainControlObligationDeterministicMap({ artifacts = {}, runId = null } = {}) {
  const controlSourceRoutes = buildControlSourceRoutes(artifacts);
  const legalIndexRoutes = buildLegalIndexRoutes(artifacts);
  const accessGapLedger = buildAccessGapLedger(controlSourceRoutes);
  return Object.freeze({
    [P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.deterministicMap]: Object.freeze({
      artifact_type: P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.deterministicMap,
      phase_id: "CARTOGRAPHY_INDEX",
      job_id: "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX",
      run_id: runId || "",
      manifest_version: "phase2_domain_control_obligation_deterministic_map_v1",
      navigation_only: true,
      contains_lossless_text: false,
      contains_excerpts: false,
      contains_summaries: false,
      contains_profile_answers: false,
      contains_obligation_posture: false,
      contains_legal_or_compliance_conclusions: false,
      domain_lock_allowed: false,
      control_source_routes: Object.freeze(controlSourceRoutes),
      legal_index_routes: Object.freeze(legalIndexRoutes),
      access_gap_ledger: Object.freeze(accessGapLedger),
      validation_quality_control_result: Object.freeze({ status: "PASS", errors: [], warnings: accessGapLedger.map((gap) => gap.gap_id) }),
      lock_status: "LOCKED"
    })
  });
}

export function buildDomainControlObligationSemanticProfile({ deterministicMap = {} } = {}) {
  const det = unwrapArtifact(deterministicMap, P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.deterministicMap);
  const warnings = [];
  const obligationFamilyRouting = buildObligationFamilyRouting({ controlSourceRoutes: det.control_source_routes || [], legalIndexRoutes: det.legal_index_routes || [], warnings });
  const obligationShellLocatorInventory = buildObligationShellLocatorInventory(obligationFamilyRouting);
  return Object.freeze({
    [P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.semanticProfile]: Object.freeze({
      artifact_type: P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.semanticProfile,
      phase_id: "CARTOGRAPHY_INDEX",
      job_id: "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX",
      manifest_version: "phase2_domain_control_obligation_semantic_profile_v1",
      navigation_only: true,
      semantic_guidance_only: true,
      contains_lossless_text: false,
      contains_excerpts: false,
      contains_summaries: false,
      contains_profile_answers: false,
      contains_obligation_posture: false,
      contains_legal_or_compliance_conclusions: false,
      domain_lock_allowed: false,
      obligation_catalog_driven: true,
      domain_blind_builder: true,
      locator_family_registry_policy: "installed_obligation_catalogs",
      loaded_obligation_catalogs: Object.freeze(OBLIGATION_CATALOGS.map((catalog) => Object.freeze({ domain_id: catalog.domain_id, catalog_file: catalog.catalog_file, obligation_family_count: Array.isArray(catalog.obligation_families) ? catalog.obligation_families.length : 0 }))),
      obligation_family_routing: Object.freeze(obligationFamilyRouting),
      obligation_shell_locator_inventory: Object.freeze(obligationShellLocatorInventory),
      target_obligation_shell: TARGET_OBLIGATION_SHELL,
      validation_quality_control_result: Object.freeze({ status: "PASS", errors: [], warnings }),
      lock_status: "LOCKED"
    })
  });
}

export function buildDomainControlObligationNavigationIndex({ deterministicMap = {}, semanticProfile = {} } = {}) {
  const det = unwrapArtifact(deterministicMap, P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.deterministicMap);
  const sem = unwrapArtifact(semanticProfile, P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.semanticProfile);
  return Object.freeze({
    [P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.finalIndex]: Object.freeze({
      artifact_type: P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.finalIndex,
      phase_id: "CARTOGRAPHY_INDEX",
      job_id: "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX",
      manifest_version: "phase2_domain_control_obligation_navigation_index_v1",
      navigation_rules: Object.freeze({
        phase1_common_root_and_legal_doc_access_allowed_through_index: true,
        navigation_only: true,
        contains_lossless_text: false,
        contains_excerpts: false,
        contains_summaries: false,
        contains_profile_answers: false,
        contains_obligation_posture: false,
        contains_legal_or_compliance_conclusions: false,
        domain_lock_allowed: false,
        obligation_catalog_driven: true,
        domain_blind_builder: true,
        source_location_only: true,
        locator_family_registry_policy: "installed_obligation_catalogs"
      }),
      control_source_routes: Object.freeze(det.control_source_routes || []),
      legal_index_routes: Object.freeze(det.legal_index_routes || []),
      obligation_family_routing: Object.freeze(sem.obligation_family_routing || []),
      obligation_shell_locator_inventory: Object.freeze(sem.obligation_shell_locator_inventory || []),
      access_gap_ledger: Object.freeze(det.access_gap_ledger || []),
      loaded_obligation_catalogs: Object.freeze(sem.loaded_obligation_catalogs || []),
      target_obligation_shell: TARGET_OBLIGATION_SHELL,
      validation_quality_control_result: Object.freeze({ status: "PASS", errors: [], warnings: [...(det.validation_quality_control_result?.warnings || []), ...(sem.validation_quality_control_result?.warnings || [])] }),
      lock_status: "LOCKED"
    })
  });
}

export function buildDomainControlObligationNavigationArtifacts({ artifacts = {}, runId = null } = {}) {
  const deterministicMap = buildDomainControlObligationDeterministicMap({ artifacts, runId });
  const semanticProfile = buildDomainControlObligationSemanticProfile({ deterministicMap });
  const finalIndex = buildDomainControlObligationNavigationIndex({ deterministicMap, semanticProfile });
  return Object.freeze({ ...deterministicMap, ...semanticProfile, ...finalIndex });
}

function buildControlSourceRoutes(artifacts = {}) {
  return CONTROL_SOURCE_ROUTE_CATALOG.map((entry) => Object.freeze({
    route_id: `${ROUTE_ID_PREFIX}${entry.route_code}`,
    route_code: entry.route_code,
    source_artifacts: Object.freeze([...(entry.source_artifacts || [])]),
    route_class: "PHASE1_CONTROL_OBLIGATION_SOURCE_ROUTE",
    access_rule: "phase1_source_contract_via_index",
    pointers: Object.freeze((entry.source_artifacts || []).map((artifactName) => Object.freeze({ artifact_name: artifactName, present: Boolean(artifacts[artifactName]), navigation_scope: "phase1_source_contract_via_index" }))),
    contains_lossless_text: false,
    contains_obligation_posture: false
  }));
}

function buildLegalIndexRoutes(artifacts = {}) {
  return DOMAIN_CONTROL_OBLIGATION_LEGAL_INDEX_INPUTS.map((artifactName) => Object.freeze({ route_id: `${LEGAL_ROUTE_ID_PREFIX}${artifactName}`, artifact_name: artifactName, route_class: "LEGAL_INDEX_SELECTIVE_LOCATOR_ROUTE", present: Boolean(artifacts[artifactName]), navigation_scope: "selective_locator_only", contains_lossless_text: false, contains_obligation_posture: false }));
}

function buildObligationFamilyRouting({ controlSourceRoutes = [], legalIndexRoutes = [], warnings = [] } = {}) {
  const routeIdByCode = new Map(controlSourceRoutes.map((route) => [route.route_code, route.route_id]));
  const allowedFields = new Set(OBLIGATION_SHELL_FIELDS);
  const rows = [];
  for (const catalog of OBLIGATION_CATALOGS) {
    const families = Array.isArray(catalog.obligation_families) ? catalog.obligation_families : [];
    for (const family of families) {
      const routeIds = [];
      for (const code of Array.isArray(family.control_source_route_codes) ? family.control_source_route_codes : []) {
        const routeId = routeIdByCode.get(code);
        if (routeId) routeIds.push(routeId);
        else warnings.push(`UNKNOWN_CONTROL_SOURCE_ROUTE_CODE:${catalog.domain_id || "unknown"}:${family.id || "unknown"}:${code}`);
      }
      const locatorFamilies = (Array.isArray(family.locator_families) ? family.locator_families : []).filter((locator) => typeof locator === "string" && locator.trim());
      const shellTargets = [];
      const requestedShellTargets = Array.isArray(family.shell_field_targets) && family.shell_field_targets.length ? family.shell_field_targets : OBLIGATION_SHELL_FIELDS;
      for (const field of requestedShellTargets) {
        if (allowedFields.has(field)) shellTargets.push(field);
        else warnings.push(`UNKNOWN_SHELL_FIELD:${catalog.domain_id || "unknown"}:${family.id || "unknown"}:${field}`);
      }
      rows.push(Object.freeze({
        domain_id: catalog.domain_id || "unknown",
        obligation_family: family.id || "unknown",
        required_control_source_route_ids: Object.freeze([...new Set(routeIds)]),
        selective_legal_route_ids: Object.freeze(catalog.uses_legal_index === false ? [] : legalIndexRoutes.map((route) => route.route_id)),
        legal_doc_types: Object.freeze(Array.isArray(family.legal_doc_types) ? [...family.legal_doc_types] : []),
        locator_families: Object.freeze([...new Set(locatorFamilies)]),
        shell_field_targets: Object.freeze([...new Set(shellTargets)]),
        reading_priority: Object.freeze(Array.isArray(family.reading_priority) ? [...family.reading_priority] : []),
        target_obligation_shell: TARGET_OBLIGATION_SHELL,
        action: "LOCATE_ONLY",
        derived_value_forbidden: true,
        contains_obligation_posture: false
      }));
    }
  }
  return rows;
}

function buildObligationShellLocatorInventory(obligationFamilyRouting = []) {
  return OBLIGATION_SHELL_FIELDS.map((field) => {
    const locatorFamilies = new Set();
    for (const row of obligationFamilyRouting) {
      if (!Array.isArray(row.shell_field_targets) || !row.shell_field_targets.includes(field)) continue;
      for (const locator of row.locator_families || []) locatorFamilies.add(locator);
    }
    return Object.freeze({ shell_field_id: field, shell_field_key: `obligation_record.${field}`, downstream_owner: "DOMAIN_CONTROL_OBLIGATION_PROFILE", locator_families: Object.freeze([...locatorFamilies].sort()), action: "LOCATE_ONLY", derived_value_forbidden: true, contains_obligation_posture: false });
  });
}

function buildAccessGapLedger(controlSourceRoutes = []) {
  return controlSourceRoutes.filter((route) => !(route.pointers || []).some((pointer) => pointer.present === true)).map((route) => Object.freeze({ gap_id: `DCONI-GAP-${route.route_code}`, route_id: route.route_id, source_artifacts: Object.freeze([...(route.source_artifacts || [])]), gap_status: "SOURCE_NOT_PRESENT_IN_PHASE1_INPUTS", navigation_gap_only: true, obligation_posture_conclusion: false }));
}

function unwrapArtifact(value = {}, artifactName) { if (value?.[artifactName]) return value[artifactName]; if (value?.artifact_type === artifactName) return value; return value || {}; }
