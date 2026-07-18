import { buildUniversalSourceExtractionArtifactSet } from "./universal-source-extraction.service.js";
import { assembleLogicalRootArtifacts, assertLogicalRootAssembly } from "./logical-root-assembly.service.js";
import { assembleIndependentLegalArtifacts, assertIndependentLegalArtifacts } from "./independent-legal-artifact-assembly.service.js";
import { projectPhase1Compatibility, assertPhase1CompatibilityProjection } from "./phase1-compatibility-projector.service.js";
import { assertFinalManifestMaterialExtractionBoundary, assertExtractedSourcesContainMaterialText } from "./source-content-materiality.service.js";
import { assertCleanExtractionManifestBoundary } from "./clean-extraction-manifest-boundary.service.js";

export const PHASE1_RB15_EXTRACTION_ORCHESTRATOR_VERSION = "PHASE1_EXTRACTION_ORCHESTRATOR_RB18B_CLEAN_MANIFEST_BOUNDARY_v2";

export async function buildPhase1Rb15ExtractionArtifactSet({ run, deduped_url_manifest } = {}) {
  assertCleanExtractionManifestBoundary(deduped_url_manifest);
  assertFinalManifestMaterialExtractionBoundary(deduped_url_manifest);
  const output = await buildUniversalSourceExtractionArtifactSet({ run, deduped_url_manifest });

  assembleLogicalRootArtifacts({ output });
  assertLogicalRootAssembly(output);

  assembleIndependentLegalArtifacts({ output, deduped_url_manifest });
  assertIndependentLegalArtifacts(output);

  projectPhase1Compatibility({ output, deduped_url_manifest });
  assertPhase1CompatibilityProjection(output);
  assertExtractedSourcesContainMaterialText(output);

  output.source_family_index = {
    ...output.source_family_index,
    producer_version: PHASE1_RB15_EXTRACTION_ORCHESTRATOR_VERSION,
    rebuild_stage: "RB18B_CLEAN_URL_MANIFEST_EXTRACTION_ACTIVE",
    material_content_required_for_every_extracted_source: true,
    clean_url_manifest_required_before_extraction: true,
    audit_only_url_rows_forbidden_in_agent_1b: true,
    http_success_alone_never_authorizes_extraction: true,
    assembly_sequence: [
      "RB18B_CLEAN_URL_MANIFEST_BOUNDARY",
      "RB11_SELECTED_EXTRACTION",
      "RB12_POST_EXTRACTION_BLOCK_DEDUPE",
      "RB13_LOGICAL_ROOT_ASSEMBLY",
      "RB14_INDEPENDENT_LEGAL_ARTIFACT_ASSEMBLY",
      "RB15_FROZEN_CONTRACT_COMPATIBILITY_PROJECTION",
      "RB18_PRE_AND_POST_EXTRACTION_MATERIAL_CONTENT_ASSERTION"
    ]
  };

  return output;
}
