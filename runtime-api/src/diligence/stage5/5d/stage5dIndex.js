/* LexNova Runtime — Stage 5D Public Index. No final profile integration. */

export { buildStage5DInputJoin } from './stage5dInputJoiner.js';
export { buildStage5DFeatureContexts } from './stage5dFeatureContextBuilder.js';
export { buildStage5DDeterministicDataSignals, STAGE5D_CONTROLLED } from './stage5dDeterministicDataSignalBuilder.js';
export { buildStage5DInstructionPacket } from './stage5dInstructionBuilder.js';
export { buildStage5DModelInput, buildStage5DPrompt } from './stage5dPromptBuilder.js';
export { runStage5DDataTouchpointExtractor } from './stage5dDataTouchpointExtractor.js';
export { normalizeStage5DOutput } from './stage5dOutputNormalizer.js';
export { validateStage5D } from './stage5dValidator.js';
export { buildStage5DDataTouchpointPackage } from './stage5dDataTouchpointPackageBuilder.js';
export { buildStage5DForensicArtifact } from './stage5dForensicBuilder.js';

import { buildStage5DInputJoin } from './stage5dInputJoiner.js';
import { buildStage5DFeatureContexts } from './stage5dFeatureContextBuilder.js';
import { buildStage5DDeterministicDataSignals } from './stage5dDeterministicDataSignalBuilder.js';
import { buildStage5DInstructionPacket } from './stage5dInstructionBuilder.js';
import { runStage5DDataTouchpointExtractor } from './stage5dDataTouchpointExtractor.js';
import { normalizeStage5DOutput } from './stage5dOutputNormalizer.js';
import { validateStage5D } from './stage5dValidator.js';
import { buildStage5DDataTouchpointPackage } from './stage5dDataTouchpointPackageBuilder.js';
import { buildStage5DForensicArtifact } from './stage5dForensicBuilder.js';

export async function runStage5D({ stage5aFeaturePackage, stage5bTagPackage, stage5cFeatureInventoryPackage, ports, routingPlan, runId } = {}) {
  const joinedInput = buildStage5DInputJoin({ stage5aFeaturePackage, stage5bTagPackage, stage5cFeatureInventoryPackage });
  const featureContext = buildStage5DFeatureContexts(joinedInput);
  const dataSignalSeed = buildStage5DDeterministicDataSignals(featureContext);
  const instructionPacket = buildStage5DInstructionPacket({ featureContext, dataSignalSeed });
  const extractorResult = await runStage5DDataTouchpointExtractor({ ports, featureContext, dataSignalSeed, instructionPacket, routingPlan, runId });
  const normalizedOutput = normalizeStage5DOutput({ rawOutput: extractorResult.stage5d_data_touchpoints_raw, featureContext, dataSignalSeed });
  const validationResult = validateStage5D({ normalizedOutput, featureContext });
  const packageResult = buildStage5DDataTouchpointPackage({ featureContext, dataSignalSeed, normalizedOutput, validationResult, extractorResult });
  const forensicArtifact = buildStage5DForensicArtifact({ runId, joinedInput, featureContext, dataSignalSeed, instructionPacket, extractorResult, normalizedOutput, validationResult, packageResult });
  return {
    stage5d_data_touchpoint_package: packageResult,
    stage5d_validation: validationResult,
    stage5d_forensic_artifact: forensicArtifact,
    stage5d_data_touchpoints: normalizedOutput,
    stage5d_instruction_packet: instructionPacket
  };
}
