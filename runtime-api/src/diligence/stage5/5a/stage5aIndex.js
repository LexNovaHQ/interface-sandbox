/* LexNova Runtime — Stage 5A Public Index. No live wiring. */

export { buildStage5AProductFamilyInput, collectProductFamilySources, normalizeProductFamilySource } from './stage5aProductFamilyInputAdapter.js';
export { buildStage5ALosslessSourceIndex, summarizeStage5ALosslessSourceIndex } from './stage5aLosslessSourceIndexBuilder.js';
export { buildStage5ADeterministicCandidatePool, getStage5AAllowedCandidateDispositions, isFunctionLikeCandidate } from './stage5aDeterministicCandidatePoolBuilder.js';
export { buildStage5AInstructionPacket } from './stage5aInstructionBuilder.js';
export { buildStage5APrompt, buildStage5AModelInput } from './stage5aPromptBuilder.js';
export { runStage5AProductFunctionMapping } from './stage5aProductFunctionMapper.js';
export { normalizeStage5AOutput } from './stage5aOutputNormalizer.js';
export { validateStage5A } from './stage5aValidator.js';
export { buildStage5AFeaturePackage } from './stage5aFeaturePackageBuilder.js';
export { buildStage5AForensicArtifact } from './stage5aForensicBuilder.js';

import { buildStage5AProductFamilyInput } from './stage5aProductFamilyInputAdapter.js';
import { buildStage5ALosslessSourceIndex } from './stage5aLosslessSourceIndexBuilder.js';
import { buildStage5ADeterministicCandidatePool } from './stage5aDeterministicCandidatePoolBuilder.js';
import { buildStage5AInstructionPacket } from './stage5aInstructionBuilder.js';
import { runStage5AProductFunctionMapping } from './stage5aProductFunctionMapper.js';
import { normalizeStage5AOutput } from './stage5aOutputNormalizer.js';
import { validateStage5A } from './stage5aValidator.js';
import { buildStage5AFeaturePackage } from './stage5aFeaturePackageBuilder.js';
import { buildStage5AForensicArtifact } from './stage5aForensicBuilder.js';
import { asArray, uniqueStrings } from '../shared/stage5SharedIndex.js';

export async function runStage5A({ context = {}, ports, routingPlan, runId } = {}) {
  const stage5aInput = buildStage5AProductFamilyInput(context);
  const losslessSourceIndex = buildStage5ALosslessSourceIndex(stage5aInput);
  const candidatePool = buildStage5ADeterministicCandidatePool(stage5aInput, losslessSourceIndex);
  const instructionPacket = buildStage5AInstructionPacket({ ...context, stage5aInput, losslessSourceIndex, candidatePool });
  const raw = await runStage5AProductFunctionMapping({ ports, stage5aInput, losslessSourceIndex, candidatePool, instructionPacket, routingPlan, runId });
  const mapping = enrichCandidateIdsUsed(normalizeStage5AOutput(raw.stage5a_product_function_mapping), { context, stage5aInput, candidatePool });
  const validationResult = validateStage5A(mapping, candidatePool);
  const featurePackage = buildStage5AFeaturePackage({ mapping, candidatePool, losslessSourceIndex, validationResult });
  const forensicArtifact = buildStage5AForensicArtifact({
    runId,
    stage5aInput,
    losslessSourceIndex,
    candidatePool,
    instructionPacket,
    mapping,
    featurePackage,
    validationResult,
    promptPreview: raw.prompt_preview
  });
  return {
    stage5a_product_function_mapping: mapping,
    stage5a_feature_package: featurePackage,
    stage5a_validation: validationResult,
    stage5a_forensic_artifact: forensicArtifact
  };
}

function enrichCandidateIdsUsed(mapping = {}, { context = {}, stage5aInput = {}, candidatePool = {} } = {}) {
  const candidateUniverse = [
    ...asArray(candidatePool.deterministic_candidate_pool),
    ...asArray(context.target_feature_candidate_index?.candidates),
    ...asArray(stage5aInput.target_feature_candidate_index?.candidates),
    ...asArray(context.target_feature_profile_input?.target_feature_candidate_index?.candidates)
  ];
  if (!candidateUniverse.length) return mapping;
  return {
    ...mapping,
    product_function_map: asArray(mapping.product_function_map).map((fn) => {
      if (asArray(fn.candidate_ids_used).length) return fn;
      const sourceRefs = new Set(asArray(fn.source_refs));
      const evidenceRefs = new Set(asArray(fn.evidence_refs));
      const matches = candidateUniverse
        .filter((candidate) => overlaps(sourceRefs, candidate.source_refs || [candidate.source_id]) || overlaps(evidenceRefs, candidate.evidence_refs))
        .map((candidate) => candidate.candidate_id);
      return { ...fn, candidate_ids_used: uniqueStrings(matches) };
    })
  };
}

function overlaps(leftSet, rightValues) {
  return asArray(rightValues).some((value) => leftSet.has(value));
}
