const D_FAMILY_ARTIFACTS = Object.freeze([
  "lossless_family__D1_SECURITY_TRUST",
  "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER",
  "lossless_family__D3_DATA_GOVERNANCE_CONTROLS",
  "lossless_family__D4_DOCS_API_DATA_FLOW",
  "lossless_family__D5_AI_SAFETY_TRANSPARENCY"
]);

const L_FAMILY_INPUTS = Object.freeze(["legal_cartography_index", "legal_signal_derivation_profile"]);

export function buildPhase7DataPrivacyNavigationIndex({ dapRegistryManifest, strategicDerivationMatrix, artifacts = {} } = {}) {
  if (!dapRegistryManifest || dapRegistryManifest.artifact_type !== "dap_registry_manifest") throw new Error("PHASE7_LAYER2_REQUIRES_DAP_REGISTRY_MANIFEST");
  const batchPlan = strategicDerivationMatrix?.semantic_batch_plan || inferBatchPlan(dapRegistryManifest.material_rules || []);
  const dFamilyRoutes = buildDFamilyRoutes(artifacts);
  const lFamilyRoutes = buildLFamilyRoutes(artifacts);
  const batchNavigationPointers = batchPlan.map((batch) => buildBatchPointer({ batch, dFamilyRoutes, lFamilyRoutes }));
  const index = Object.freeze({
    artifact_type: "data_privacy_navigation_index",
    manifest_version: "phase7_layer2_hybrid_data_privacy_navigation_index_v1",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_2_HYBRID_DATA_PRIVACY_NAVIGATION_INDEX",
    execution_mode: "HYBRID_DETERMINISTIC_LED_SEMANTIC_POINTER_AUGMENTED",
    navigation_policy: Object.freeze({
      deterministic_index_construction_leads: true,
      semantic_batch_pointer_augmentation_required: true,
      full_d_family_lossless_access_allowed_through_index: true,
      selective_l_family_lossless_access_only_through_legal_cartography: true,
      no_free_corpus_read: true,
      no_full_l_family_scan_without_locator: true,
      no_dossier_emission: true,
      no_compiler_output: true,
      no_forensics_output: true
    }),
    deterministic_navigation_spine: Object.freeze({
      d_family_routes: Object.freeze(dFamilyRoutes),
      l_family_routes: Object.freeze(lFamilyRoutes),
      source_custody_ledger: Object.freeze(buildSourceCustodyLedger({ dFamilyRoutes, lFamilyRoutes })),
      access_gap_ledger: Object.freeze(buildAccessGapLedger({ dFamilyRoutes, lFamilyRoutes }))
    }),
    semantic_navigation_overlay: Object.freeze({
      batch_navigation_pointers: Object.freeze(batchNavigationPointers),
      overlay_rule: "semantic overlay adds family and batch reading priorities only; it does not derive field answers"
    }),
    validation_quality_control_result: validatePhase7DataPrivacyNavigationIndexShape({ batchNavigationPointers, dFamilyRoutes, lFamilyRoutes })
  });
  return index;
}

function buildDFamilyRoutes(artifacts) {
  return D_FAMILY_ARTIFACTS.map((artifactName) => Object.freeze({
    route_id: `DPNI-D-${artifactName.replace(/^lossless_family__/, "")}`,
    source_artifact: artifactName,
    route_class: "D_FAMILY_LOSSLESS_ROUTE",
    access_rule: "FULL_D_FAMILY_LOSSLESS_ALLOWED_THROUGH_INDEX",
    present: Boolean(artifacts[artifactName]),
    pointer: Object.freeze({ artifact_name: artifactName, navigation_scope: "full_lossless_family_via_index" })
  }));
}

function buildLFamilyRoutes(artifacts) {
  return L_FAMILY_INPUTS.map((artifactName) => Object.freeze({
    route_id: `DPNI-L-${artifactName}`,
    source_artifact: artifactName,
    route_class: "SELECTIVE_L_FAMILY_LEGAL_CARTOGRAPHY_ROUTE",
    access_rule: "SELECTIVE_L_FAMILY_ONLY_BY_LEGAL_CARTOGRAPHY_LOCATOR",
    present: Boolean(artifacts[artifactName]),
    pointer: Object.freeze({ artifact_name: artifactName, navigation_scope: "selective_locator_only" })
  }));
}

function buildBatchPointer({ batch, dFamilyRoutes, lFamilyRoutes }) {
  const families = Object.freeze([...(batch.families || [])]);
  return Object.freeze({
    batch_id: batch.batch_id,
    families,
    field_count: batch.field_count,
    expected_artifact_name: batch.artifact_name,
    deterministic_route_owner: "data_privacy_navigation_index",
    semantic_pointer_owner: "family_batch_navigation_overlay",
    required_d_family_route_ids: Object.freeze(dFamilyRoutes.map((route) => route.route_id)),
    selective_l_family_route_ids: Object.freeze(selectLFamilyRoutesForFamilies({ families, lFamilyRoutes }).map((route) => route.route_id)),
    reading_priority: Object.freeze(readingPriorityForFamilies(families)),
    forbidden_outputs: Object.freeze(["compiler", "forensics", "report_projection", "final_profile"]),
    model_instruction: "Use this index to navigate. Do not free-read corpus. Do not emit compiler or forensic output."
  });
}

function selectLFamilyRoutesForFamilies({ families, lFamilyRoutes }) {
  const needsLegal = families.some((family) => ["AUTH", "CTRL", "CONTACT", "CM", "VEND", "LOC", "RET", "SEC", "READY", "REQ", "LIM"].includes(family));
  return needsLegal ? lFamilyRoutes : lFamilyRoutes.filter((route) => route.source_artifact === "legal_cartography_index");
}

function readingPriorityForFamilies(families) {
  const first = families[0] || "GENERAL";
  const byFamily = {
    EXEC: ["completed semantic batch outputs", "limitations", "highest material gaps"],
    LIM: ["access gaps", "source coverage gaps", "downstream effect"],
    PARTY: ["target_feature_profile", "privacy notice", "DPA/terms role language"],
    ROLE: ["DPA/terms role language", "privacy notice", "activity profile"],
    FLOW: ["D4 docs/API data flow", "activity profile", "privacy notice"],
    OBJ: ["D4 docs/API data flow", "privacy categories", "product/activity context"],
    AUTH: ["privacy notice purpose language", "DPA instruction language", "rights/control routes"],
    CTRL: ["privacy rights routes", "account/help docs", "grievance/contact routes"],
    CONTACT: ["privacy/contact source", "legal signal derivation profile", "privacy center"],
    CM: ["consent/rights docs", "privacy notice", "product/help docs"],
    VEND: ["D2 subprocessors", "DPA", "security/trust"],
    LOC: ["D2 subprocessors", "DPA transfer language", "security/trust location language"],
    RET: ["privacy retention language", "DPA deletion/return language", "help/account docs"],
    SEC: ["D1 security/trust", "DPA security schedule", "incident route"],
    SENS: ["activity profile", "privacy categories", "AI/domain policy"],
    DOM: ["D5 AI safety/transparency", "D4 docs/API", "privacy/DPA model use language"],
    READY: ["completed DAP family outputs", "limitations", "contact/control/retention/security signals"],
    REQ: ["unresolved field list", "limitations", "local counsel dependencies"]
  };
  return Object.freeze(byFamily[first] || ["data privacy index", "legal cartography index"]);
}

function inferBatchPlan(materialRules) {
  const families = Array.from(new Set(materialRules.map((row) => String(row.field_id || "").split(".")[1]).filter(Boolean)));
  return families.map((family, index) => Object.freeze({ batch_id: `DAP-SEM-BATCH-${String(index + 1).padStart(2, "0")}`, families: Object.freeze([family]), field_count: materialRules.filter((row) => String(row.field_id || "").startsWith(`DAP.${family}.`)).length, artifact_name: `dap_semantic_batch_${family.toLowerCase()}_artifact` }));
}

function buildSourceCustodyLedger({ dFamilyRoutes, lFamilyRoutes }) {
  return [...dFamilyRoutes, ...lFamilyRoutes].map((route) => Object.freeze({ route_id: route.route_id, source_artifact: route.source_artifact, present: route.present, access_rule: route.access_rule }));
}

function buildAccessGapLedger({ dFamilyRoutes, lFamilyRoutes }) {
  return [...dFamilyRoutes, ...lFamilyRoutes].filter((route) => !route.present).map((route) => Object.freeze({ route_id: route.route_id, source_artifact: route.source_artifact, gap_status: "SOURCE_NOT_PRESENT_IN_LAYER2_INPUTS" }));
}

function validatePhase7DataPrivacyNavigationIndexShape({ batchNavigationPointers, dFamilyRoutes, lFamilyRoutes }) {
  const errors = [];
  if (!dFamilyRoutes.length) errors.push("missing_d_family_routes");
  if (!lFamilyRoutes.length) errors.push("missing_l_family_routes");
  if (!batchNavigationPointers.length) errors.push("missing_batch_navigation_pointers");
  for (const batch of batchNavigationPointers) {
    if (!batch.batch_id) errors.push("batch_pointer_missing_batch_id");
    if (!batch.expected_artifact_name) errors.push(`batch_pointer_missing_artifact:${batch.batch_id}`);
    if (!batch.required_d_family_route_ids?.length) errors.push(`batch_pointer_missing_d_routes:${batch.batch_id}`);
    if (!batch.selective_l_family_route_ids?.length) errors.push(`batch_pointer_missing_l_routes:${batch.batch_id}`);
  }
  return Object.freeze({ status: errors.length ? "REPAIR_REQUIRED" : "PASS", errors: Object.freeze(errors) });
}
