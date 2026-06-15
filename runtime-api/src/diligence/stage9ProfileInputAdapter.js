import { applyStage8QualityControlToExposureProfile, normalizeStage8QualityControlLedger } from "./stage9QualityControlOverlay.js";

const safeObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const asArray = (value) => Array.isArray(value) ? value : [];

function targetProfileFrom(stage6Cache = {}) {
  return safeObject(stage6Cache.target_profile || stage6Cache.company_profile || stage6Cache.target_profile_v2);
}

function legalCartographyFrom(stage6Cache = {}) {
  return safeObject(stage6Cache.legal_cartography || stage6Cache.stage6_review?.legal_document_cartography);
}

function dataProvenanceFrom(stage6Cache = {}) {
  return safeObject(stage6Cache.data_provenance_profile || stage6Cache.stage6_review?.data_provenance_profile || stage6Cache.stage6b_stage_result?.data_provenance_profile);
}

function exposureProfileFrom(stage7Artifact = {}) {
  const profile = safeObject(stage7Artifact.exposure_profile);
  if (Object.keys(profile).length) return profile;
  return {
    profile_version: "exposure_profile_v1",
    artifact_type: "stage7_exposure_profile",
    registry_ledger: asArray(stage7Artifact.registry_ledger || stage7Artifact.merged_ledger),
    routing_summary: stage7Artifact.summary?.routing_summary || {},
    ledger_summary: {
      source: "compatibility_from_stage7_artifact",
      registry_ledger_rows: asArray(stage7Artifact.registry_ledger || stage7Artifact.merged_ledger).length
    },
    limitations: ["Exposure profile was reconstructed from legacy Stage 7 artifact fields for compatibility."]
  };
}

function buildStage6ReviewCompat({ legalCartography, dataProvenanceProfile, stage6Cache }) {
  const prior = safeObject(stage6Cache.stage6_review);
  return {
    ...prior,
    stage6_review_version: prior.stage6_review_version || "stage6_review_profile_compat_v1",
    stage6_component: "stage9_profile_compatibility_context",
    legal_document_cartography: legalCartography,
    data_provenance_profile: dataProvenanceProfile,
    stage7_navigation_index: safeObject(prior.stage7_navigation_index || stage6Cache.stage6_to_stage7_adapter?.stage7_navigation_index)
  };
}

export function buildStage9ProfileInput({ stage6Cache = {}, stage7Artifact = {}, stage8Ledger = {}, stage8Export = {}, registryRuntime = {} } = {}) {
  const targetProfile = targetProfileFrom(stage6Cache);
  const targetFeatureProfile = safeObject(stage6Cache.target_feature_profile);
  const legalCartography = legalCartographyFrom(stage6Cache);
  const dataProvenanceProfile = dataProvenanceFrom(stage6Cache);
  const exposureProfile = exposureProfileFrom(stage7Artifact);
  const stage8QualityControlLedger = normalizeStage8QualityControlLedger({ stage8Ledger, stage8Export });
  const effectiveExposureProfile = applyStage8QualityControlToExposureProfile({ exposureProfile, stage8QualityControlLedger, stage8Ledger });
  const stage6ReviewCompat = buildStage6ReviewCompat({ legalCartography, dataProvenanceProfile, stage6Cache });
  const stage6CacheCompat = {
    ...stage6Cache,
    cache_version: "stage9_profile_input_compat_cache_v1",
    target_profile: targetProfile,
    company_profile: targetProfile,
    target_feature_profile: targetFeatureProfile,
    legal_cartography: legalCartography,
    data_provenance_profile: dataProvenanceProfile,
    stage6_review: stage6ReviewCompat,
    stage6_to_stage7_adapter: {
      ...(stage6Cache.stage6_to_stage7_adapter || {}),
      legal_document_cartography: legalCartography,
      data_provenance_profile: dataProvenanceProfile,
      stage7_navigation_index: stage6ReviewCompat.stage7_navigation_index
    }
  };
  const stage7ArtifactCompat = {
    ...stage7Artifact,
    exposure_profile: effectiveExposureProfile,
    registry_ledger: effectiveExposureProfile.registry_ledger,
    merged_ledger: effectiveExposureProfile.registry_ledger
  };
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
    compatibility: {
      stage6_cache: stage6CacheCompat,
      stage7_artifact: stage7ArtifactCompat,
      stage8_ledger: {
        ...stage8Ledger,
        artifact_type: stage8Ledger.artifact_type || "stage8_quality_control_overlay_compat",
        post_challenge_ledger: effectiveExposureProfile.registry_ledger,
        correction_meta: stage8QualityControlLedger.correction_meta,
        operator_challenge_gate: stage8QualityControlLedger.operator_challenge_gate,
        corrected_count: stage8QualityControlLedger.corrected_count
      },
      stage8_export: stage8Export
    },
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
