import {
  P2D_DATA_PRIVACY_ARTIFACTS,
  P2D_DATA_PRIVACY_ROUTE_SOURCES,
  P2D_DATA_PRIVACY_LEGAL_INDEX_INPUTS,
  P2D_DATA_PRIVACY_DOWNSTREAM_RULES
} from "../data-privacy-navigation-index.contract.js";

const DATA_PRIVACY_DETERMINISTIC_ARTIFACT = P2D_DATA_PRIVACY_ARTIFACTS.deterministicMap;
const DATA_PRIVACY_SEMANTIC_ARTIFACT = P2D_DATA_PRIVACY_ARTIFACTS.semanticProfile;

export function buildDataPrivacyDeterministicMap({ artifacts = {}, runId = null } = {}) {
  const dataSourceRoutes = buildDataSourceRoutes(artifacts);
  const legalIndexRoutes = buildLegalIndexRoutes(artifacts);
  const sourceCustodyLedger = buildSourceCustodyLedger({ dataSourceRoutes, legalIndexRoutes });
  const accessGapLedger = buildAccessGapLedger({ dataSourceRoutes, legalIndexRoutes });
  const deterministicMap = Object.freeze({
    artifact_type: DATA_PRIVACY_DETERMINISTIC_ARTIFACT,
    manifest_version: "phase2d_data_privacy_deterministic_map_v1_phase1_v5",
    phase_id: "CARTOGRAPHY_INDEX",
    job_id: "P2D_DATA_PRIVACY_NAVIGATION_INDEX",
    downstream_phase_id: "DATA_PROVENANCE_PROFILE",
    run_id: runId || null,
    execution_mode: "DETERMINISTIC_PHASE1_V5_DATA_PRIVACY_ROUTE_SPINE",
    source_contract: Object.freeze({
      phase1_v5_common_roots: true,
      old_d_family_inputs_forbidden: true,
      sparse_roots_allowed: true,
      source_text_copied: false,
      summaries_allowed: false,
      excerpts_allowed: false
    }),
    data_source_routes: Object.freeze(dataSourceRoutes),
    legal_index_routes: Object.freeze(legalIndexRoutes),
    source_custody_ledger: Object.freeze(sourceCustodyLedger),
    access_gap_ledger: Object.freeze(accessGapLedger),
    downstream_rules: P2D_DATA_PRIVACY_DOWNSTREAM_RULES,
    lock_status: accessGapLedger.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED"
  });
  return { [DATA_PRIVACY_DETERMINISTIC_ARTIFACT]: deterministicMap };
}

export function buildDataPrivacySemanticProfile({ deterministicMap, strategicDerivationMatrix } = {}) {
  const deterministic = unwrap(deterministicMap, DATA_PRIVACY_DETERMINISTIC_ARTIFACT);
  const batchPlan = strategicDerivationMatrix?.semantic_batch_plan || [];
  const dataSourceRoutes = deterministic?.data_source_routes || [];
  const legalIndexRoutes = deterministic?.legal_index_routes || [];
  const batchNavigationPointers = batchPlan.map((batch) => buildBatchPointer({ batch, dataSourceRoutes, legalIndexRoutes }));
  const semanticProfile = Object.freeze({
    artifact_type: DATA_PRIVACY_SEMANTIC_ARTIFACT,
    manifest_version: "phase2d_data_privacy_semantic_profile_v1_batch_pointer_overlay",
    phase_id: "CARTOGRAPHY_INDEX",
    job_id: "P2D_DATA_PRIVACY_NAVIGATION_INDEX",
    downstream_phase_id: "DATA_PROVENANCE_PROFILE",
    execution_mode: "DETERMINISTIC_SEMANTIC_BATCH_POINTER_OVERLAY_NO_MODEL",
    semantic_navigation_overlay: Object.freeze({
      batch_navigation_pointers: Object.freeze(batchNavigationPointers),
      overlay_rule: "Semantic overlay adds DAP family and batch reading priorities only; it does not derive field answers.",
      model_usage: "NONE_DETERMINISTIC_BATCH_POINTERS"
    }),
    validation_quality_control_result: validateSemanticProfile({ batchNavigationPointers, dataSourceRoutes, legalIndexRoutes }),
    downstream_rules: P2D_DATA_PRIVACY_DOWNSTREAM_RULES,
    lock_status: batchNavigationPointers.length ? "LOCKED" : "REPAIR_REQUIRED"
  });
  return { [DATA_PRIVACY_SEMANTIC_ARTIFACT]: semanticProfile };
}

function buildDataSourceRoutes(artifacts) {
  return P2D_DATA_PRIVACY_ROUTE_SOURCES.map((route) => {
    const presentArtifacts = route.source_artifacts.filter((artifactName) => Boolean(artifacts[artifactName]));
    return Object.freeze({
      route_id: `DPNI-DATA-${route.route_code}`,
      legacy_route_id: `DPNI-D-${route.route_code}`,
      route_code: route.route_code,
      dap_families: route.dap_families,
      source_artifacts: route.source_artifacts,
      present_source_artifacts: Object.freeze(presentArtifacts),
      route_class: "PHASE1_V5_DATA_PRIVACY_SOURCE_ROUTE",
      legacy_route_class: "D_FAMILY_LOSSLESS_ROUTE_COMPATIBILITY",
      access_rule: "READ_PHASE1_V5_COMMON_ROOT_SOURCES_THROUGH_DATA_PRIVACY_NAVIGATION_INDEX",
      present: Boolean(presentArtifacts.length),
      pointers: Object.freeze(route.source_artifacts.map((artifactName) => Object.freeze({
        artifact_name: artifactName,
        present: Boolean(artifacts[artifactName]),
        navigation_scope: "phase1_v5_data_privacy_source_via_index",
        source_text_copied: false
      })))
    });
  });
}

function buildLegalIndexRoutes(artifacts) {
  return P2D_DATA_PRIVACY_LEGAL_INDEX_INPUTS.map((artifactName) => Object.freeze({
    route_id: `DPNI-LEGAL-${artifactName}`,
    legacy_route_id: `DPNI-L-${artifactName}`,
    source_artifact: artifactName,
    route_class: "SELECTIVE_LEGAL_CARTOGRAPHY_INDEX_ROUTE",
    legacy_route_class: "SELECTIVE_L_FAMILY_LEGAL_CARTOGRAPHY_ROUTE",
    access_rule: "SELECTIVE_LEGAL_ACCESS_ONLY_BY_LEGAL_CARTOGRAPHY_OR_LEGAL_SIGNAL_LOCATOR",
    present: Boolean(artifacts[artifactName]),
    pointer: Object.freeze({ artifact_name: artifactName, navigation_scope: "selective_locator_only", source_text_copied: false })
  }));
}

function buildBatchPointer({ batch, dataSourceRoutes, legalIndexRoutes }) {
  const families = Object.freeze([...(batch.families || [])]);
  const selectedDataRoutes = selectDataRoutesForFamilies({ families, dataSourceRoutes });
  const selectedLegalRoutes = selectLegalRoutesForFamilies({ families, legalIndexRoutes });
  const dataRouteIds = Object.freeze(selectedDataRoutes.map((route) => route.route_id));
  const legalRouteIds = Object.freeze(selectedLegalRoutes.map((route) => route.route_id));
  return Object.freeze({
    batch_id: batch.batch_id,
    families,
    field_count: batch.field_count,
    expected_artifact_name: batch.artifact_name,
    deterministic_route_owner: "data_privacy_navigation_index",
    semantic_pointer_owner: "phase2d_data_privacy_batch_navigation_overlay",
    required_data_source_route_ids: dataRouteIds,
    selective_legal_route_ids: legalRouteIds,
    required_d_family_route_ids: dataRouteIds,
    selective_l_family_route_ids: legalRouteIds,
    reading_priority: Object.freeze(readingPriorityForFamilies(families)),
    forbidden_outputs: Object.freeze(["compiler", "forensics", "report_projection", "final_profile", "data_provenance_profile", "integrated_dap_report"]),
    model_instruction: "Use this index to navigate Phase 1 v5 data/privacy sources and Legal Cartography. Do not free-read corpus. Do not emit compiler, forensics, report, or final profile."
  });
}

function selectDataRoutesForFamilies({ families, dataSourceRoutes }) {
  const needs = new Set();
  for (const family of families) {
    if (["SEC", "READY"].includes(family)) needs.add("SECURITY_TRUST");
    if (["VEND", "LOC", "ROLE", "PARTY"].includes(family)) needs.add("PRIVACY_VENDOR_TRANSFER");
    if (["AUTH", "CTRL", "CONTACT", "CM", "RET", "REQ", "LIM"].includes(family)) needs.add("DATA_GOVERNANCE_CONTROLS");
    if (["FLOW", "OBJ", "DOM", "SENS"].includes(family)) needs.add("DOCS_API_DATA_FLOW");
    if (["DOM", "SENS"].includes(family)) needs.add("AI_SAFETY_TRANSPARENCY");
  }
  return dataSourceRoutes.filter((route) => !needs.size || needs.has(route.route_code));
}

function selectLegalRoutesForFamilies({ families, legalIndexRoutes }) {
  const needsLegal = families.some((family) => ["AUTH", "CTRL", "CONTACT", "CM", "VEND", "LOC", "RET", "SEC", "READY", "REQ", "LIM"].includes(family));
  return needsLegal ? legalIndexRoutes : legalIndexRoutes.filter((route) => route.source_artifact === "legal_cartography_index");
}

function readingPriorityForFamilies(families) {
  const first = families[0] || "GENERAL";
  const byFamily = {
    EXEC: ["completed semantic batch outputs", "limitations", "highest material gaps"],
    LIM: ["access gaps", "source coverage gaps", "downstream effect"],
    PARTY: ["target_feature_profile", "privacy notice", "DPA/terms role language"],
    ROLE: ["DPA/terms role language", "privacy notice", "activity profile"],
    FLOW: ["docs/API data flow", "activity profile", "privacy notice"],
    OBJ: ["docs/API data flow", "privacy categories", "product/activity context"],
    AUTH: ["privacy notice purpose language", "legal signal derivation profile", "rights/control routes"],
    CTRL: ["privacy rights routes", "account/help docs", "grievance/contact routes"],
    CONTACT: ["privacy/contact source", "legal signal derivation profile", "privacy center"],
    CM: ["consent/rights docs", "privacy notice", "product/help docs"],
    VEND: ["subprocessor/vendor route", "DPA/privacy docs", "security/trust"],
    LOC: ["subprocessor/vendor route", "transfer language", "security/trust location language"],
    RET: ["privacy retention language", "deletion/return language", "help/account docs"],
    SEC: ["security/trust", "security schedule", "incident route"],
    SENS: ["activity profile", "privacy categories", "AI/domain policy"],
    DOM: ["AI safety/transparency", "docs/API", "privacy model use language"],
    READY: ["completed DAP family outputs", "limitations", "contact/control/retention/security signals"],
    REQ: ["unresolved field list", "limitations", "local counsel dependencies"]
  };
  return Object.freeze(byFamily[first] || ["data privacy index", "legal cartography index"]);
}

function buildSourceCustodyLedger({ dataSourceRoutes, legalIndexRoutes }) {
  return [...dataSourceRoutes, ...legalIndexRoutes].map((route) => Object.freeze({
    route_id: route.route_id,
    legacy_route_id: route.legacy_route_id,
    source_artifact: route.source_artifact || "",
    source_artifacts: route.source_artifacts || [],
    present: route.present,
    access_rule: route.access_rule
  }));
}

function buildAccessGapLedger({ dataSourceRoutes, legalIndexRoutes }) {
  return [...dataSourceRoutes, ...legalIndexRoutes]
    .filter((route) => !route.present)
    .map((route) => Object.freeze({
      route_id: route.route_id,
      legacy_route_id: route.legacy_route_id,
      source_artifact: route.source_artifact || "",
      source_artifacts: route.source_artifacts || [],
      gap_status: "SOURCE_NOT_PRESENT_IN_PHASE1_V5_INPUTS",
      blocking_failure: false
    }));
}

function validateSemanticProfile({ batchNavigationPointers, dataSourceRoutes, legalIndexRoutes }) {
  const errors = [];
  if (!Array.isArray(dataSourceRoutes) || dataSourceRoutes.length !== 5) errors.push(`data_source_route_count_not_5:${dataSourceRoutes?.length || 0}`);
  if (!Array.isArray(legalIndexRoutes) || legalIndexRoutes.length !== 2) errors.push(`legal_index_route_count_not_2:${legalIndexRoutes?.length || 0}`);
  if (!Array.isArray(batchNavigationPointers) || !batchNavigationPointers.length) errors.push("missing_batch_navigation_pointers");
  for (const route of dataSourceRoutes || []) if (!Array.isArray(route.pointers) || !route.pointers.length) errors.push(`data_route_missing_pointers:${route.route_id || "missing"}`);
  for (const batch of batchNavigationPointers || []) {
    if (!batch.batch_id) errors.push("batch_pointer_missing_batch_id");
    if (!batch.expected_artifact_name) errors.push(`batch_pointer_missing_artifact:${batch.batch_id || "missing"}`);
    if (!batch.required_data_source_route_ids?.length) errors.push(`batch_pointer_missing_data_routes:${batch.batch_id || "missing"}`);
    if (!batch.required_d_family_route_ids?.length) errors.push(`batch_pointer_missing_legacy_d_routes:${batch.batch_id || "missing"}`);
    if (!batch.selective_legal_route_ids?.length) errors.push(`batch_pointer_missing_legal_routes:${batch.batch_id || "missing"}`);
    if (!batch.selective_l_family_route_ids?.length) errors.push(`batch_pointer_missing_legacy_l_routes:${batch.batch_id || "missing"}`);
  }
  return Object.freeze({ status: errors.length ? "REPAIR_REQUIRED" : "PASS", errors: Object.freeze(errors) });
}

function unwrap(value, artifactName) {
  if (value && typeof value === "object" && artifactName in value) return value[artifactName];
  if (value && typeof value === "object" && value.payload && artifactName in value.payload) return value.payload[artifactName];
  return value;
}
