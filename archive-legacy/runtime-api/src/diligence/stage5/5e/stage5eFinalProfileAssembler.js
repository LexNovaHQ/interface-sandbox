/* LexNova Runtime — Stage 5E Final Target Feature Profile Assembler. */

export function buildStage5ETargetProfileRef(joined = {}) {
  const identity = joined.company_profile?.identity || {};
  const seed = joined.target_profile_ref_seed || {};
  return {
    target_profile_version: String(seed.target_profile_version || joined.company_profile?.target_profile_version || 'target_profile_v2'),
    brand_name: String(seed.brand_name || identity.brand_name || 'Unknown target'),
    legal_name: String(seed.legal_name || identity.legal_name || ''),
    domain: String(seed.domain || identity.domain || identity.website || '')
  };
}

export function assembleStage5ETargetFeatureProfile({ joined, featureInventory, dataProvenanceMap, regulatedSurfaceMap, architectureHints, commercialScan, vaultFeatureCandidates, evidence, classificationQuality, unresolvedFeatureCandidates = [], limitations = [] } = {}) {
  return {
    feature_profile_version: 'feature_profile_v2',
    target_profile_ref: buildStage5ETargetProfileRef(joined),
    feature_inventory: featureInventory,
    product_feature_map: [],
    data_provenance_map: dataProvenanceMap,
    regulated_surface_map: regulatedSurfaceMap,
    architecture_hints: architectureHints,
    classification_quality: classificationQuality,
    unresolved_feature_candidates: unresolvedFeatureCandidates,
    commercial_scan: commercialScan,
    vault_feature_candidates: vaultFeatureCandidates,
    evidence,
    limitations
  };
}
