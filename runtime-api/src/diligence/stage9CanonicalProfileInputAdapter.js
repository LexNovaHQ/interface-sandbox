const POST_ALIAS = "post_" + "challenge_" + "ledger";
const safeObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const asArray = (value) => Array.isArray(value) ? value : [];

function compatAdapters(stage6Cache = {}) {
  return safeObject(stage6Cache.compatibility_adapters);
}

function targetProfileFrom(stage6Cache = {}) {
  return safeObject(stage6Cache.target_profile || stage6Cache.company_profile || stage6Cache.target_profile_v2);
}

function legalCartographyFrom(stage6Cache = {}) {
  const compat = compatAdapters(stage6Cache);
  return safeObject(stage6Cache.legal_cartography || compat.stage6_review?.legal_document_cartography || compat.stage6_to_stage7_adapter?.legal_document_cartography);
}

function dataProvenanceFrom(stage6Cache = {}) {
  const compat = compatAdapters(stage6Cache);
  return safeObject(stage6Cache.data_provenance_profile || stage6Cache.stage6b_stage_result?.data_provenance_profile || compat.stage6_review?.data_provenance_profile || compat.stage6_to_stage7_adapter?.data_provenance_profile);
}

function exposureProfileFrom(stage7Artifact = {}) {
  const profile = safeObject(stage7Artifact.exposure_profile);
  if (Object.keys(profile).length) return profile;
  const ledger = asArray(stage7Artifact.registry_ledger || stage7Artifact.merged_ledger);
  return {
    profile_version: "exposure_profile_v1",
    artifact_type: "stage7_exposure_profile",
    registry_ledger: ledger,
    routing_summary: stage7Artifact.summary?.routing_summary || {},
    ledger_summary: { source: "compatibility_from_stage7_artifact", registry_ledger_rows: ledger.length },
    limitations: ["Exposure profile was reconstructed from Stage 7 artifact fields for compatibility."]
  };
}

function readCorrectedLedger(stage8Ledger = {}) {
  return asArray(stage8Ledger.corrected_registry_ledger || stage8Ledger.compatibility_aliases?.[POST_ALIAS] || stage8Ledger[POST_ALIAS]);
}

function normalizeStage8QualityControlLedger({ stage8Ledger = {}, stage8Export = {} } = {}) {
  const operatorGate = safeObject(stage8Ledger.operator_challenge_gate || stage8Export.operator_challenge?.operator_challenge_gate);
  const correctionMeta = asArray(stage8Ledger.correction_meta || stage8Export.correction_result?.correction_meta);
  const correctedRegistryLedger = readCorrectedLedger(stage8Ledger);
  return {
    qc_ledger_version: "stage8_quality_control_ledger_v1",
    artifact_type: "stage8_quality_control_ledger",
    generated_at: stage8Ledger.generated_at || stage8Export.generated_at || null,
    run_id: stage8Ledger.run_id || stage8Export.run_id || null,
    source_artifact_type: stage8Ledger.artifact_type || stage8Export.artifact_type || null,
    corrected_count: Number(stage8Ledger.corrected_count ?? stage8Export.correction_result?.corrected_count ?? correctionMeta.length ?? 0),
    corrected_registry_ledger: correctedRegistryLedger,
    corrections: correctionMeta.map((item, index) => ({ correction_id: item.correction_id || item.id || `QC-CORR-${String(index + 1).padStart(3, "0")}`, row_ref: item.threat_id || item.row_ref || item.registry_row_id || null, correction_status: "accepted", correction_source: "stage8_quality_control", correction_meta: item })),
    challenges: asArray(operatorGate.reopened_rows).map((item, index) => ({ challenge_id: item.challenge_id || item.id || `QC-CHAL-${String(index + 1).padStart(3, "0")}`, row_ref: item.threat_id || item.row_ref || item.registry_row_id || null, challenge_reason: item.reason || item.required_action || "Stage 8 quality control challenged this row.", raw_challenge: item })),
    accepted_corrections: correctionMeta,
    rejected_corrections: [],
    quality_warnings: asArray(operatorGate.notes).concat(asArray(stage8Export.model_metadata?.model_warnings)).filter(Boolean),
    unresolved_items: [],
    operator_challenge_gate: operatorGate,
    correction_meta: correctionMeta,
    compatibility_aliases: { [POST_ALIAS]: correctedRegistryLedger },
    source_policy: { not_a_registry_ledger: true, applies_to: "exposure_profile.registry_ledger", stage9_must_consume_effective_registry_ledger_after_qc: true }
  };
}

function applyQualityControl({ exposureProfile = {}, stage8QualityControlLedger = {} } = {}) {
  const originalLedger = asArray(exposureProfile.registry_ledger);
  const correctedLedger = asArray(stage8QualityControlLedger.corrected_registry_ledger);
  const effectiveLedger = correctedLedger.length ? correctedLedger : originalLedger;
  return {
    ...exposureProfile,
    profile_version: exposureProfile.profile_version || "exposure_profile_v1",
    registry_ledger: effectiveLedger,
    effective_registry_ledger: effectiveLedger,
    quality_control_applied: true,
    quality_control_trace: {
      qc_ledger_version: stage8QualityControlLedger.qc_ledger_version,
      corrected_count: Number(stage8QualityControlLedger.corrected_count || 0),
      warnings: asArray(stage8QualityControlLedger.quality_warnings),
      unresolved_items: asArray(stage8QualityControlLedger.unresolved_items),
      source_policy: "Stage 8 QC ledger applies corrections to exposure_profile.registry_ledger; it is not a competing registry ledger."
    },
    ledger_summary: {
      ...(exposureProfile.ledger_summary || {}),
      original_registry_ledger_rows: originalLedger.length,
      effective_registry_ledger_rows: effectiveLedger.length,
      stage8_qc_corrected_count: Number(stage8QualityControlLedger.corrected_count || 0)
    }
  };
}

function buildStage6ReviewCompat({ legalCartography, dataProvenanceProfile, stage6Cache }) {
  const compat = compatAdapters(stage6Cache);
  const prior = safeObject(compat.stage6_review);
  const priorAdapter = safeObject(compat.stage6_to_stage7_adapter);
  return {
    ...prior,
    stage6_review_version: prior.stage6_review_version || "stage6_review_profile_compat_v1",
    stage6_component: "stage9_profile_compatibility_context",
    legal_document_cartography: legalCartography,
    data_provenance_profile: dataProvenanceProfile,
    stage7_navigation_index: safeObject(prior.stage7_navigation_index || priorAdapter.stage7_navigation_index)
  };
}

export function buildStage9ProfileInput({ stage6Cache = {}, stage7Artifact = {}, stage8Ledger = {}, stage8Export = {}, registryRuntime = {} } = {}) {
  const targetProfile = targetProfileFrom(stage6Cache);
  const targetFeatureProfile = safeObject(stage6Cache.target_feature_profile);
  const legalCartography = legalCartographyFrom(stage6Cache);
  const dataProvenanceProfile = dataProvenanceFrom(stage6Cache);
  const exposureProfile = exposureProfileFrom(stage7Artifact);
  const stage8QualityControlLedger = normalizeStage8QualityControlLedger({ stage8Ledger, stage8Export });
  const effectiveExposureProfile = applyQualityControl({ exposureProfile, stage8QualityControlLedger });
  const stage6ReviewCompat = buildStage6ReviewCompat({ legalCartography, dataProvenanceProfile, stage6Cache });
  const stage6ToStage7Compat = { ...safeObject(compatAdapters(stage6Cache).stage6_to_stage7_adapter), legal_document_cartography: legalCartography, data_provenance_profile: dataProvenanceProfile, stage7_navigation_index: stage6ReviewCompat.stage7_navigation_index };
  const stage6CacheCompat = {
    cache_version: "stage9_profile_input_compat_cache_v1",
    target_profile: targetProfile,
    company_profile: targetProfile,
    target_feature_profile: targetFeatureProfile,
    legal_cartography: legalCartography,
    data_provenance_profile: dataProvenanceProfile,
    source_bundle: safeObject(stage6Cache.source_bundle),
    evidence_junction: safeObject(stage6Cache.evidence_junction),
    compatibility_adapters: { ...compatAdapters(stage6Cache), stage6_review: stage6ReviewCompat, stage6_to_stage7_adapter: stage6ToStage7Compat }
  };
  const stage7ArtifactCompat = { ...stage7Artifact, exposure_profile: effectiveExposureProfile, registry_ledger: effectiveExposureProfile.registry_ledger, merged_ledger: effectiveExposureProfile.registry_ledger };
  return {
    profile_input_version: "stage9_profile_input_v1",
    target_profile: targetProfile,
    target_feature_profile: targetFeatureProfile,
    legal_cartography: legalCartography,
    data_provenance_profile: dataProvenanceProfile,
    exposure_profile: effectiveExposureProfile,
    stage8_quality_control_ledger: stage8QualityControlLedger,
    registry_runtime: registryRuntime,
    source_bundle: safeObject(stage6Cache.source_bundle),
    evidence_junction: safeObject(stage6Cache.evidence_junction),
    compatibility: { stage6_cache: stage6CacheCompat, stage7_artifact: stage7ArtifactCompat, stage8_ledger: { artifact_type: "stage8_quality_control_overlay_compat", corrected_registry_ledger: effectiveExposureProfile.registry_ledger, compatibility_aliases: { [POST_ALIAS]: effectiveExposureProfile.registry_ledger }, correction_meta: stage8QualityControlLedger.correction_meta, operator_challenge_gate: stage8QualityControlLedger.operator_challenge_gate, corrected_count: stage8QualityControlLedger.corrected_count }, stage8_export: stage8Export },
    validation: {
      target_profile_present: Object.keys(targetProfile).length > 0,
      target_feature_profile_present: Object.keys(targetFeatureProfile).length > 0,
      legal_cartography_present: Object.keys(legalCartography).length > 0,
      data_provenance_profile_present: Object.keys(dataProvenanceProfile).length > 0,
      exposure_profile_present: Object.keys(effectiveExposureProfile).length > 0,
      exposure_registry_ledger_count: asArray(effectiveExposureProfile.registry_ledger).length,
      stage8_quality_control_ledger_present: Object.keys(stage8QualityControlLedger).length > 0
    }
  };
}
