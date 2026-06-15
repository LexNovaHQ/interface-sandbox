/* LexNova Runtime — Stage 5E Forensic Builder. */

import { asArray } from '../shared/stage5SharedIndex.js';

export function buildStage5EForensicArtifact({ runId, joined = {}, targetFeatureProfile = {}, validationResult = {} } = {}) {
  return {
    artifact_version: 'stage5_5e_forensic_v1',
    run_id: runId || null,
    target_profile_ref: targetFeatureProfile?.target_profile_ref || null,
    phase_id: 'STAGE5E_TARGET_FEATURE_PROFILE_ASSEMBLY',
    phase_name: '5E Target Feature Profile Assembly',
    input_summary: {
      has_5a: Boolean(joined.stage5a_feature_package?.features_for_5b),
      has_5b: Boolean(joined.stage5b_tag_package?.feature_tags_for_5c),
      has_5c: Boolean(joined.stage5c_feature_inventory_package?.feature_inventory),
      has_5d: Boolean(joined.stage5d_data_touchpoint_package?.feature_data_touchpoints)
    },
    output_summary: {
      feature_inventory_count: asArray(targetFeatureProfile.feature_inventory).length,
      data_provenance_map_count: asArray(targetFeatureProfile.data_provenance_map).length,
      regulated_surface_map_count: asArray(targetFeatureProfile.regulated_surface_map).length,
      architecture_hints_count: asArray(targetFeatureProfile.architecture_hints).length,
      evidence_ref_count: asArray(targetFeatureProfile.evidence?.field_evidence_refs).length
    },
    token_usage: null,
    validation_result: validationResult,
    artifact_payload: { handoff_shape: '{ companyProfile, targetFeatureProfile }', profile_version: targetFeatureProfile.feature_profile_version || null }
  };
}
