/* LexNova Runtime — Stage 5E Public Index. Produces final target_feature_profile only. */

export { buildStage5EInputJoin } from './stage5eInputJoiner.js';
export { buildStage5EFeatureInventory } from './stage5eFeatureInventoryIntegrator.js';
export { buildStage5EDataProvenanceMap } from './stage5eDataProvenanceMapBuilder.js';
export { buildStage5ERegulatedSurfaceMap } from './stage5eRegulatedSurfaceMapBuilder.js';
export { buildStage5EArchitectureHints } from './stage5eArchitectureHintsBuilder.js';
export { buildStage5ECommercialScan } from './stage5eCommercialScanBuilder.js';
export { buildStage5EVaultCandidates } from './stage5eVaultCandidatesBuilder.js';
export { buildStage5EEvidenceRollup } from './stage5eEvidenceRollupBuilder.js';
export { buildStage5EClassificationQuality } from './stage5eClassificationQualityBuilder.js';
export { assembleStage5ETargetFeatureProfile } from './stage5eFinalProfileAssembler.js';
export { validateStage5EProfile } from './stage5eValidator.js';
export { buildStage5EForensicArtifact } from './stage5eForensicBuilder.js';

import { asArray, uniqueStrings } from '../shared/stage5SharedIndex.js';
import { buildStage5EInputJoin } from './stage5eInputJoiner.js';
import { buildStage5EFeatureInventory } from './stage5eFeatureInventoryIntegrator.js';
import { buildStage5EDataProvenanceMap } from './stage5eDataProvenanceMapBuilder.js';
import { buildStage5ERegulatedSurfaceMap } from './stage5eRegulatedSurfaceMapBuilder.js';
import { buildStage5EArchitectureHints } from './stage5eArchitectureHintsBuilder.js';
import { buildStage5ECommercialScan } from './stage5eCommercialScanBuilder.js';
import { buildStage5EVaultCandidates } from './stage5eVaultCandidatesBuilder.js';
import { buildStage5EEvidenceRollup } from './stage5eEvidenceRollupBuilder.js';
import { buildStage5EClassificationQuality } from './stage5eClassificationQualityBuilder.js';
import { assembleStage5ETargetFeatureProfile } from './stage5eFinalProfileAssembler.js';
import { validateStage5EProfile } from './stage5eValidator.js';
import { buildStage5EForensicArtifact } from './stage5eForensicBuilder.js';

function unresolved(joined = {}) {
  const out = [];
  for (const item of asArray(joined.stage5c_feature_inventory_package?.unresolved_feature_candidates_seed)) {
    out.push({ candidate_id: item.unresolved_id || item.candidate_id || `S5E_UNRESOLVED_${out.length + 1}`, candidate_name: item.candidate_name || item.function_id || 'Unresolved feature candidate', previous_feature_id: item.feature_id || null, reason: item.reason || 'Unresolved during Stage 5C/5E assembly', source_url: item.source_url || null, evidence_refs: asArray(item.evidence_refs), recommended_downstream_handling: item.recommended_downstream_handling || 'Review during human QA before delivery.' });
  }
  return out;
}

function limitations(joined = {}, validationResult = {}) {
  return uniqueStrings([
    ...asArray(joined.limitations_seed),
    ...asArray(joined.stage5a_feature_package?.limitations),
    ...asArray(joined.stage5b_tag_package?.limitations),
    ...asArray(joined.stage5c_feature_inventory_package?.limitations),
    ...asArray(joined.stage5d_data_touchpoint_package?.limitations),
    ...asArray(validationResult?.warnings).map((w) => w.message || w.code).filter(Boolean)
  ]);
}

export async function runStage5E({ adapterResult = {}, companyProfile = {}, runId = null } = {}) {
  const joined = buildStage5EInputJoin({ adapterResult, companyProfile });
  const featureInventory = buildStage5EFeatureInventory(joined);
  const dataProvenanceMap = buildStage5EDataProvenanceMap(joined);
  const regulatedSurfaceMap = buildStage5ERegulatedSurfaceMap(joined, featureInventory);
  const architectureHints = buildStage5EArchitectureHints(joined);
  const commercialScan = buildStage5ECommercialScan(joined, featureInventory);
  const vaultFeatureCandidates = buildStage5EVaultCandidates(joined, featureInventory);
  const evidence = buildStage5EEvidenceRollup(joined, { feature_inventory: featureInventory, data_provenance_map: dataProvenanceMap, regulated_surface_map: regulatedSurfaceMap });
  let classificationQuality = buildStage5EClassificationQuality(joined);
  let targetFeatureProfile = assembleStage5ETargetFeatureProfile({ joined, featureInventory, dataProvenanceMap, regulatedSurfaceMap, architectureHints, commercialScan, vaultFeatureCandidates, evidence, classificationQuality, unresolvedFeatureCandidates: unresolved(joined), limitations: [] });
  let validationResult = validateStage5EProfile(targetFeatureProfile);
  classificationQuality = buildStage5EClassificationQuality(joined, validationResult);
  targetFeatureProfile = { ...targetFeatureProfile, classification_quality: classificationQuality, limitations: limitations(joined, validationResult) };
  validationResult = validateStage5EProfile(targetFeatureProfile);
  const forensicArtifact = buildStage5EForensicArtifact({ runId, joined, targetFeatureProfile, validationResult });
  return { target_feature_profile: targetFeatureProfile, stage5e_validation: validationResult, stage5e_forensic_artifact: forensicArtifact };
}
