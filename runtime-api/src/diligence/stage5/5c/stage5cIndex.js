/* LexNova Runtime — Stage 5C Public Index. No final profile integration. */

export { buildStage5CInputJoin } from './stage5cInputJoiner.js';
export { buildStage5CCanonicalDraft } from './stage5cCanonicalDraftBuilder.js';
export { analyzeStage5CCompleteness, STAGE5C_MODEL_REPAIR_FIELDS, STAGE5C_MODEL_FORBIDDEN_FIELDS } from './stage5cCompletenessAnalyzer.js';
export { buildStage5CCanonicalizationInstructionPacket } from './stage5cCanonicalizationInstructionBuilder.js';
export { buildStage5CCanonicalizationModelInput, buildStage5CCanonicalizationPrompt } from './stage5cCanonicalizationPromptBuilder.js';
export { runStage5CCanonicalizationAdjudicator } from './stage5cCanonicalizationAdjudicator.js';
export { mergeStage5CRepairs } from './stage5cOutputMerger.js';
export { validateStage5C } from './stage5cValidator.js';
export { buildStage5CFeatureInventoryPackage } from './stage5cFeatureInventoryPackageBuilder.js';
export { buildStage5CForensicArtifact } from './stage5cForensicBuilder.js';

import { buildStage5CInputJoin } from './stage5cInputJoiner.js';
import { buildStage5CCanonicalDraft } from './stage5cCanonicalDraftBuilder.js';
import { analyzeStage5CCompleteness } from './stage5cCompletenessAnalyzer.js';
import { buildStage5CCanonicalizationInstructionPacket } from './stage5cCanonicalizationInstructionBuilder.js';
import { runStage5CCanonicalizationAdjudicator } from './stage5cCanonicalizationAdjudicator.js';
import { mergeStage5CRepairs } from './stage5cOutputMerger.js';
import { validateStage5C } from './stage5cValidator.js';
import { buildStage5CFeatureInventoryPackage } from './stage5cFeatureInventoryPackageBuilder.js';
import { buildStage5CForensicArtifact } from './stage5cForensicBuilder.js';

export async function runStage5C({ stage5aFeaturePackage, stage5aMapping, stage5bTagPackage, stage5bTagging, ports, routingPlan, runId } = {}) {
  const joinedInput = buildStage5CInputJoin({ stage5aFeaturePackage, stage5aMapping, stage5bTagPackage, stage5bTagging });
  const canonicalDraft = buildStage5CCanonicalDraft(joinedInput);
  const completenessAnalysis = analyzeStage5CCompleteness(canonicalDraft);
  const instructionPacket = buildStage5CCanonicalizationInstructionPacket({ canonicalDraft, completenessAnalysis });
  const repairResult = await runStage5CCanonicalizationAdjudicator({ ports, canonicalDraft, completenessAnalysis, instructionPacket, routingPlan, runId });
  const mergedOutput = mergeStage5CRepairs({ canonicalDraft, repairResult: repairResult.stage5c_canonicalization_repair });
  const validationResult = validateStage5C({ mergedOutput, joinedInput, completenessAnalysis });
  const packageResult = buildStage5CFeatureInventoryPackage({ joinedInput, canonicalDraft, completenessAnalysis, mergedOutput, validationResult });
  const forensicArtifact = buildStage5CForensicArtifact({
    runId,
    joinedInput,
    canonicalDraft,
    completenessAnalysis,
    instructionPacket,
    repairResult,
    mergedOutput,
    validationResult,
    promptPreview: repairResult.prompt_preview
  });
  return {
    stage5c_feature_inventory_package: packageResult,
    stage5c_validation: validationResult,
    stage5c_forensic_artifact: forensicArtifact,
    stage5c_canonicalization_repair: repairResult.stage5c_canonicalization_repair
  };
}
