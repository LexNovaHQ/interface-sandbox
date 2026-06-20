const RUN_REASONS = new Set(["UNI_ALWAYS_RUN", "STAGE5_INT_TRIGGERED", "CONDITIONAL_DOC_REVIEW", "STAGE5_DEGRADED_FALLBACK"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asText(value) {
  return String(value ?? "").trim();
}

function upper(value) {
  return asText(value).toUpperCase();
}

function rowId(row = {}, index = 0) {
  return asText(row.Threat_ID || row.threat_id || `ROW_${index + 1}`);
}

function routeReasonFor(row = {}) {
  return upper(row?.stage7_route_contract?.route_reason || row?._stage7_route?.route_reason || row?._runtime_route?.route_reason || "");
}

function routeIsRun(row = {}) {
  const reason = routeReasonFor(row);
  if (reason) return RUN_REASONS.has(reason);
  const id = rowId(row);
  return id.startsWith("UNI_");
}

function textOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

function includesAny(text, patterns = []) {
  const haystack = String(text || "").toLowerCase();
  return patterns.some((pattern) => haystack.includes(pattern));
}

function countArray(value) {
  return asArray(value).length;
}

function legalCartographyStats(legalCartography = {}, stage6Review = {}) {
  const cartography = asObject(legalCartography || stage6Review?.legal_document_cartography);
  return {
    legal_document_inventory_count: countArray(cartography.legal_document_inventory),
    legal_document_index_count: countArray(cartography.legal_document_index),
    document_control_signal_count: countArray(cartography.document_control_signal_map),
    document_mismatch_signal_count: countArray(cartography.document_mismatch_signal_map),
    feature_to_legal_unit_count: countArray(cartography.feature_to_legal_unit_index),
    legal_unit_locator_count: countArray(cartography.legal_unit_source_locator_index)
  };
}

function dataProfileStats(dataProvenanceProfile = {}, stage6Review = {}) {
  const profile = asObject(dataProvenanceProfile || stage6Review?.data_provenance_profile);
  return {
    data_flow_count: countArray(profile.integrated_feature_data_flow_profile) || countArray(profile.data_flow_profile),
    product_observed_count: countArray(profile.product_observed_data_layer),
    legal_governance_control_count: countArray(profile.legal_governance_control_layer),
    data_signal_index_count: countArray(profile.data_signal_index),
    feature_to_legal_unit_navigation_count: countArray(profile.feature_to_legal_unit_navigation),
    limitation_count: countArray(profile.limitations)
  };
}

function featureStats(targetFeatureProfile = {}) {
  return {
    feature_count: countArray(targetFeatureProfile.feature_inventory),
    data_provenance_count: countArray(targetFeatureProfile.data_provenance_map),
    surface_count: countArray(targetFeatureProfile.regulated_surface_map),
    unresolved_feature_candidate_count: countArray(targetFeatureProfile.unresolved_feature_candidates),
    classification_status: targetFeatureProfile.classification_quality?.status || null
  };
}

function requiredClassesForRow(row = {}) {
  const id = rowId(row);
  const text = `${id} ${textOf(row)}`.toLowerCase();
  const required = new Set(["registry_row", "target_profile"]);
  if (routeIsRun(row)) required.add("feature_profile");
  if (includesAny(text, ["privacy", "personal data", "pii", "data protection", "consent", "rights", "delete", "deletion", "retention", "training", "fine-tuning", "subprocessor", "processor", "transfer", "residency", "security", "encryption", "breach"])) {
    required.add("data_provenance_profile");
    required.add("legal_cartography");
  }
  if (includesAny(text, ["terms", "eula", "aup", "acceptable use", "output", "content", "ip", "liability", "warranty", "sla", "service level", "governing law", "dispute"])) {
    required.add("legal_cartography");
  }
  if (includesAny(text, ["voice", "audio", "speech", "biometric", "translation", "document", "file", "upload", "agent", "workflow", "integration", "payment", "bank", "employment", "hr", "candidate"])) {
    required.add("feature_profile");
    required.add("data_provenance_profile");
  }
  return [...required];
}

function suppliedClasses({ targetProfile, targetFeatureProfile, legalCartography, dataProvenanceProfile, stage6Review }) {
  const features = featureStats(asObject(targetFeatureProfile));
  const legal = legalCartographyStats(legalCartography, stage6Review);
  const data = dataProfileStats(dataProvenanceProfile, stage6Review);
  const supplied = new Set(["registry_row"]);
  if (targetProfile && Object.keys(asObject(targetProfile)).length) supplied.add("target_profile");
  if (features.feature_count || features.data_provenance_count || features.surface_count) supplied.add("feature_profile");
  if (legal.legal_document_inventory_count || legal.legal_document_index_count || legal.document_control_signal_count || legal.legal_unit_locator_count) supplied.add("legal_cartography");
  if (data.data_flow_count || data.product_observed_count || data.legal_governance_control_count || data.data_signal_index_count) supplied.add("data_provenance_profile");
  return { supplied: [...supplied], features, legal, data };
}

function buildRowPacket(row = {}, index = 0, context = {}) {
  const required = requiredClassesForRow(row);
  const supply = suppliedClasses(context);
  const missing = required.filter((item) => !supply.supplied.includes(item));
  const runRoute = routeIsRun(row);
  return {
    threat_id: rowId(row, index),
    route_reason: routeReasonFor(row) || (rowId(row, index).startsWith("UNI_") ? "UNI_ALWAYS_RUN" : "STAGE5_INT_TRIGGERED"),
    runtime_applicable: runRoute,
    required_evidence_classes: required,
    supplied_evidence_classes: supply.supplied,
    missing_required_evidence_classes: missing,
    evidence_coverage_status: missing.length ? "INCOMPLETE" : "COMPLETE",
    expansion_required_before_final_unknown: runRoute && missing.length > 0,
    row_targeting_note: "Deterministic runtime organises evidence classes only; it is not a conclusive exclusion filter."
  };
}

function buildReservoir(context = {}) {
  const supply = suppliedClasses(context);
  return {
    reservoir_version: "stage7_route_safety_reservoir_v1",
    profile_wrappers_are_native_stage_outputs: true,
    target_profile_present: supply.supplied.includes("target_profile"),
    target_feature_profile_stats: supply.features,
    legal_cartography_stats: supply.legal,
    data_provenance_profile_stats: supply.data,
    reservoir_policy: "Use canonical profile wrappers and row packets before declaring evidence insufficient. Do not treat deterministic row targeting as proof that other supplied profile evidence is irrelevant."
  };
}

export function buildStage7EvidenceSafetyPacket({
  registryRows = [],
  targetProfile = null,
  targetFeatureProfile = null,
  legalCartography = null,
  dataProvenanceProfile = null,
  stage6Review = null,
  registryBatch = {},
  expansionMode = false
} = {}) {
  const rows = asArray(registryRows.length ? registryRows : registryBatch.registry_rows);
  const context = { targetProfile, targetFeatureProfile, legalCartography, dataProvenanceProfile, stage6Review };
  const coverageManifest = rows.map((row, index) => buildRowPacket(row, index, context));
  const incomplete = coverageManifest.filter((row) => row.missing_required_evidence_classes.length);
  return {
    evidence_safety_version: "stage7_evidence_safety_packet_v1",
    packet_policy: "safety_first_no_conclusive_deterministic_exclusion",
    token_policy: "current_batch_keeps_legal_governance_reservoir_available; future profile-scoped reduction must preserve coverage manifest and expansion pass",
    expansion_mode: Boolean(expansionMode),
    expansion_policy: {
      max_expansion_passes: 1,
      expansion_trigger: "EVIDENCE_PACKET_INSUFFICIENT or missing required evidence class for runtime-applicable row",
      final_unknown_allowed_only_after_coverage_complete_or_expansion_exhausted: true
    },
    route_safety_reservoir: buildReservoir(context),
    coverage_manifest: coverageManifest,
    coverage_summary: {
      row_count: coverageManifest.length,
      incomplete_row_count: incomplete.length,
      expansion_required_count: coverageManifest.filter((row) => row.expansion_required_before_final_unknown).length,
      incomplete_threat_ids: incomplete.map((row) => row.threat_id)
    }
  };
}
