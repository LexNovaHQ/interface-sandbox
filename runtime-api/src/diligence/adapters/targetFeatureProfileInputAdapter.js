import { buildTargetFeatureProfileInput as buildBaseTargetFeatureProfileInput } from "./targetFeatureProfileInputAdapterNonDropping.js";
import { buildStage5CandidateManifestV2 } from "../stage5CandidateManifestV2.js";

export function buildTargetFeatureProfileInput(args = {}) {
  const result = buildBaseTargetFeatureProfileInput(args);
  const input = result?.target_feature_profile_input;

  if (result?.ok && input && typeof input === "object" && !Array.isArray(input)) {
    input.target_feature_candidate_manifest_v2 = buildStage5CandidateManifestV2(input);
    input.adapter_policy = {
      ...(input.adapter_policy || {}),
      typed_candidate_manifest_v2_required: true,
      product_area_atomic_feature_decomposition_required: true,
      final_atomic_features_require_non_empty_archetypes_and_surfaces: true
    };
    if (input.source_bundle?.source_review && typeof input.source_bundle.source_review === "object") {
      input.source_bundle.source_review.candidate_manifest_version = input.target_feature_candidate_manifest_v2.candidate_manifest_version;
      input.source_bundle.source_review.typed_candidate_manifest_candidate_count = input.target_feature_candidate_manifest_v2.candidate_summary.manifest_candidate_count;
    }
  }

  return result;
}
