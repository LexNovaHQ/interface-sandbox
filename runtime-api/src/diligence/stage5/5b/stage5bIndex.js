/* LexNova Runtime — Stage 5B Public Index. No live wiring. */

export { buildStage5BTaxonomySlice, validateStage5BTaxonomySlice } from './stage5bRegistryTaxonomyBuilder.js';
export { buildStage5BFeatureInvestigationPacket } from './stage5bFeatureInvestigationPacketBuilder.js';
export { buildStage5BDeterministicSignals } from './stage5bDeterministicSignalBuilder.js';
export { buildStage5BInstructionPacket } from './stage5bInstructionBuilder.js';
export { buildStage5BPrompt, buildStage5BModelInput } from './stage5bPromptBuilder.js';
export { runStage5BArchetypeSurfaceTagging } from './stage5bArchetypeSurfaceTagger.js';
export { normalizeStage5BOutput } from './stage5bOutputNormalizer.js';
export { validateStage5B } from './stage5bValidator.js';
export { buildStage5BTagPackage } from './stage5bTagPackageBuilder.js';
export { buildStage5BForensicArtifact } from './stage5bForensicBuilder.js';

import { buildStage5BTaxonomySlice } from './stage5bRegistryTaxonomyBuilder.js';
import { buildStage5BFeatureInvestigationPacket } from './stage5bFeatureInvestigationPacketBuilder.js';
import { buildStage5BDeterministicSignals } from './stage5bDeterministicSignalBuilder.js';
import { buildStage5BInstructionPacket } from './stage5bInstructionBuilder.js';
import { runStage5BArchetypeSurfaceTagging } from './stage5bArchetypeSurfaceTagger.js';
import { normalizeStage5BOutput } from './stage5bOutputNormalizer.js';
import { validateStage5B } from './stage5bValidator.js';
import { buildStage5BTagPackage } from './stage5bTagPackageBuilder.js';
import { buildStage5BForensicArtifact } from './stage5bForensicBuilder.js';

export async function runStage5B({ stage5aFeaturePackage, registryKey, ports, routingPlan, runId } = {}) {
  const taxonomySlice = await buildStage5BTaxonomySlice({ registryKey, ports });
  const investigationPacket = buildStage5BFeatureInvestigationPacket({ stage5aFeaturePackage });
  const signalSeed = buildStage5BDeterministicSignals({ investigationPacket, taxonomySlice });
  const instructionPacket = buildStage5BInstructionPacket({ taxonomySlice, investigationPacket });
  const raw = await runStage5BArchetypeSurfaceTagging({
    ports,
    taxonomySlice,
    investigationPacket,
    signalSeed,
    instructionPacket,
    routingPlan,
    runId
  });
  const tagging = normalizeStage5BOutput(raw.stage5b_archetype_surface_tagging, { investigationPacket, taxonomySlice });
  const validationResult = validateStage5B(tagging, { stage5aFeaturePackage, taxonomySlice });
  const tagPackage = buildStage5BTagPackage({ tagging, validationResult });
  const forensicArtifact = buildStage5BForensicArtifact({
    runId,
    taxonomySlice,
    investigationPacket,
    signalSeed,
    instructionPacket,
    tagging,
    tagPackage,
    validationResult,
    promptPreview: raw.prompt_preview
  });
  return {
    stage5b_archetype_surface_tagging: tagging,
    stage5b_tag_package: tagPackage,
    stage5b_validation: validationResult,
    stage5b_forensic_artifact: forensicArtifact
  };
}
