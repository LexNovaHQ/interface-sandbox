const DATA_ROUTE_SOURCES = Object.freeze([
  { route_code: "SECURITY_TRUST", source_artifacts: Object.freeze(["lossless_root__security_trust", "lossless_root__trust_compliance"]) },
  { route_code: "PRIVACY_VENDOR_TRANSFER", source_artifacts: Object.freeze(["lossless_root__privacy_data_processing", "lossless_root__trust_compliance", "legal_doc_inventory"]) },
  { route_code: "DATA_GOVERNANCE_CONTROLS", source_artifacts: Object.freeze(["lossless_root__privacy_data_processing", "lossless_root__security_trust", "lossless_root__contact_notice", "lossless_root__support_help"]) },
  { route_code: "DOCS_API_DATA_FLOW", source_artifacts: Object.freeze(["lossless_root__docs_api_data_flow", "lossless_root__technical_docs_api_developer", "lossless_root__platform_feature_solution", "lossless_root__product_service"]) },
  { route_code: "AI_SAFETY_TRANSPARENCY", source_artifacts: Object.freeze(["lossless_root__technical_docs_api_developer", "lossless_root__docs_api_data_flow", "lossless_root__trust_compliance", "lossless_root__platform_feature_solution", "lossless_root__product_service"]) }
]);
const LEGAL_INDEX_INPUTS = Object.freeze(["legal_cartography_index", "legal_signal_derivation_profile"]);

export function buildPhase7DataPrivacyNavigationIndex({ dapRegistryManifest, strategicDerivationMatrix, artifacts = {} } = {}) {
  if (!dapRegistryManifest || dapRegistryManifest.artifact_type !== "dap_registry_manifest") throw new Error("PHASE7_LAYER2_REQUIRES_DAP_REGISTRY_MANIFEST");
  const batchPlan = strategicDerivationMatrix?.semantic_batch_plan || inferBatchPlan(dapRegistryManifest.material_rules || []);
  const dataSourceRoutes = buildDataSourceRoutes(artifacts);
  const legalIndexRoutes = buildLegalIndexRoutes(artifacts);
  const batchNavigationPointers = batchPlan.map((batch) => buildBatchPointer({ batch, dataSourceRoutes, legalIndexRoutes }));
  const index = Object.freeze({
    artifact_type: "data_privacy_navigation_index",
    manifest_version: "phase7_layer2_hybrid_data_privacy_navigation_index_v2_NEW_PHASE1_INPUT_CONTRACT",
    phase_id: "CARTOGRAPHY_INDEX",
    downstream_phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "PHASE2_MIGRATED_DATA_PRIVACY_NAVIGATION_INDEX",
    execution_mode: "DETERMINISTIC_NEW_SOURCE_CONTRACT_POINTER_INDEX",
    navigation_policy: Object.freeze({
      deterministic_index_construction_leads: true,
      semantic_batch_pointer_augmentation_required: true,
      phase1_common_root_and_legal_doc_access_allowed_through_index: true,
      selective_legal_access_only_through_legal_cartography: true,
      no_legacy_family_inputs: true,
      no_free_corpus_read: true,
      no_full_legal_doc_scan_without_locator: true,
      no_dossier_emission: true,
      no_compiler_output: true,
      no_forensics_output: true
    }),
    deterministic_navigation_spine: Object.freeze({
      data_source_routes: Object.freeze(dataSourceRoutes),
      legal_index_routes: Object.freeze(legalIndexRoutes),
      source_custody_ledger: Object.freeze(buildSourceCustodyLedger({ dataSourceRoutes, legalIndexRoutes })),
      access_gap_ledger: Object.freeze(buildAccessGapLedger({ dataSourceRoutes, legalIndexRoutes }))
    }),
    semantic_navigation_overlay: Object.freeze({
      batch_navigation_pointers: Object.freeze(batchNavigationPointers),
      overlay_rule: "semantic overlay adds source-route and batch reading priorities only; it does not derive field answers"
    }),
    validation_quality_control_result: validatePhase7DataPrivacyNavigationIndexShape({ batchNavigationPointers, dataSourceRoutes, legalIndexRoutes })
  });
  return index;
}

function buildDataSourceRoutes(artifacts) {
  return DATA_ROUTE_SOURCES.map((route) => {
    const presentArtifacts = route.source_artifacts.filter((artifactName) => Boolean(artifacts[artifactName]));
    return Object.freeze({
      route_id: `DPNI-DATA-${route.route_code}`,
      route_code: route.route_code,
      source_artifacts: route.source_artifacts,
      present_source_artifacts: Object.freeze(presentArtifacts),
      route_class: "PHASE1_DATA_PRIVACY_SOURCE_ROUTE",
      access_rule: "READ_PHASE1_COMMON_ROOT_AND_LEGAL_DOC_SOURCES_THROUGH_INDEX",
      present: Boolean(presentArtifacts.length),
      pointers: Object.freeze(route.source_artifacts.map((artifactName) => Object.freeze({ artifact_name: artifactName, present: Boolean(artifacts[artifactName]), navigation_scope: "phase1_source_contract_via_index" })))
    });
  });
}

function buildLegalIndexRoutes(artifacts) {
  return LEGAL_INDEX_INPUTS.map((artifactName) => Object.freeze({
    route_id: `DPNI-LEGAL-${artifactName}`,
    source_artifact: artifactName,
    route_class: "SELECTIVE_LEGAL_CARTOGRAPHY_INDEX_ROUTE",
    access_rule: "SELECTIVE_LEGAL_ACCESS_ONLY_BY_LEGAL_CARTOGRAPHY_LOCATOR",
    present: Boolean(artifacts[artifactName]),
    pointer: Object.freeze({ artifact_name: artifactName, navigation_scope: "selective_locator_only" })
  }));
}

function buildBatchPointer({ batch, dataSourceRoutes, legalIndexRoutes }) {
  const families = Object.freeze([...(batch.families || [])]);
  return Object.freeze({
    batch_id: batch.batch_id,
    families,
    field_count: batch.field_count,
    expected_artifact_name: batch.artifact_name,
    deterministic_route_owner: "data_privacy_navigation_index",
    semantic_pointer_owner: "source_route_batch_navigation_overlay",
    required_data_source_route_ids: Object.freeze(selectDataRoutesForFamilies({ families, dataSourceRoutes }).map((route) => route.route_id)),
    selective_legal_route_ids: Object.freeze(selectLegalRoutesForFamilies({ families, legalIndexRoutes }).map((route) => route.route_id)),
    reading_priority: Object.freeze(readingPriorityForFamilies(families)),
    forbidden_outputs: Object.freeze(["compiler", "forensics", "report_projection", "final_profile"]),
    model_instruction: "Use this index to navigate Phase 1 sources and legal cartography. Do not free-read corpus. Do not emit compiler or forensic output."
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

function inferBatchPlan(materialRules) {
  const families = Array.from(new Set(materialRules.map((row) => String(row.field_id || "").split(".")[1]).filter(Boolean)));
  return families.map((family, index) => Object.freeze({ batch_id: `DAP-SEM-BATCH-${String(index + 1).padStart(2, "0")}`, families: Object.freeze([family]), field_count: materialRules.filter((row) => String(row.field_id || "").startsWith(`DAP.${family}.`)).length, artifact_name: `dap_semantic_batch_${family.toLowerCase()}_artifact` }));
}

function buildSourceCustodyLedger({ dataSourceRoutes, legalIndexRoutes }) {
  return [...dataSourceRoutes, ...legalIndexRoutes].map((route) => Object.freeze({ route_id: route.route_id, source_artifact: route.source_artifact || "", source_artifacts: route.source_artifacts || [], present: route.present, access_rule: route.access_rule }));
}

function buildAccessGapLedger({ dataSourceRoutes, legalIndexRoutes }) {
  return [...dataSourceRoutes, ...legalIndexRoutes].filter((route) => !route.present).map((route) => Object.freeze({ route_id: route.route_id, source_artifact: route.source_artifact || "", source_artifacts: route.source_artifacts || [], gap_status: "SOURCE_NOT_PRESENT_IN_PHASE1_INPUTS" }));
}

function validatePhase7DataPrivacyNavigationIndexShape({ batchNavigationPointers, dataSourceRoutes, legalIndexRoutes }) {
  const errors = [];
  if (!dataSourceRoutes.length) errors.push("missing_data_source_routes");
  if (!legalIndexRoutes.length) errors.push("missing_legal_index_routes");
  if (!batchNavigationPointers.length) errors.push("missing_batch_navigation_pointers");
  for (const route of dataSourceRoutes) if (!route.pointers?.length) errors.push(`data_route_missing_pointers:${route.route_id}`);
  for (const batch of batchNavigationPointers) {
    if (!batch.batch_id) errors.push("batch_pointer_missing_batch_id");
    if (!batch.expected_artifact_name) errors.push(`batch_pointer_missing_artifact:${batch.batch_id}`);
    if (!batch.required_data_source_route_ids?.length) errors.push(`batch_pointer_missing_data_routes:${batch.batch_id}`);
    if (!batch.selective_legal_route_ids?.length) errors.push(`batch_pointer_missing_legal_routes:${batch.batch_id}`);
  }
  return Object.freeze({ status: errors.length ? "REPAIR_REQUIRED" : "PASS", errors: Object.freeze(errors) });
}
