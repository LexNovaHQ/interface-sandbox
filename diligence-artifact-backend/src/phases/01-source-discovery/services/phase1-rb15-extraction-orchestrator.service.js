import { buildUniversalSourceExtractionArtifactSet } from "./universal-source-extraction.service.js";
import { assembleLogicalRootArtifacts, assertLogicalRootAssembly } from "./logical-root-assembly.service.js";
import { assembleIndependentLegalArtifacts, assertIndependentLegalArtifacts } from "./independent-legal-artifact-assembly.service.js";
import { projectPhase1Compatibility, assertPhase1CompatibilityProjection } from "./phase1-compatibility-projector.service.js";

export const PHASE1_RB15_EXTRACTION_ORCHESTRATOR_VERSION = "PHASE1_EXTRACTION_ORCHESTRATOR_RB15_v1";

export async function buildPhase1Rb15ExtractionArtifactSet({ run, deduped_url_manifest } = {}) {
  const output = await buildUniversalSourceExtractionArtifactSet({ run, deduped_url_manifest });

  assembleLogicalRootArtifacts({ output });
  assertLogicalRootAssembly(output);

  assembleIndependentLegalArtifacts({ output, deduped_url_manifest });
  assertIndependentLegalArtifacts(output);

  projectPhase1Compatibility({ output, deduped_url_manifest });
  assertPhase1CompatibilityProjection(output);

  output.source_family_index = {
    ...output.source_family_index,
    producer_version: PHASE1_RB15_EXTRACTION_ORCHESTRATOR_VERSION,
    rebuild_stage: "RB15_COMPLETE",
    assembly_sequence: [
      "RB11_SELECTED_EXTRACTION",
      "RB12_POST_EXTRACTION_BLOCK_DEDUPE",
      "RB13_LOGICAL_ROOT_ASSEMBLY",
      "RB14_INDEPENDENT_LEGAL_ARTIFACT_ASSEMBLY",
      "RB15_FROZEN_CONTRACT_COMPATIBILITY_PROJECTION"
    ]
  };

  return output;
}
