import { buildSourceExtractionArtifactSet } from "../services/source-extraction.service.js";
import { assertSourceDiscoveryBoundary, assertNoSourceDiscoveryModelUsage } from "../validators/source-discovery.validator.js";

export const SOURCE_DISCOVERY_EXTRACTION_JOB = Object.freeze({
  phase_id: "SOURCE_DISCOVERY",
  job_id: "SOURCE_EXTRACTION",
  public_label: "Source Extraction",
  implementation_status: "PHASE_OWNED_IMPLEMENTATION_AGNOSTIC_V1",
  model_usage: "NONE"
});

export async function buildSourceExtractionArtifacts({ run, deduped_url_manifest } = {}) {
  const output = await buildSourceExtractionArtifactSet({ run, deduped_url_manifest });
  assertNoSourceDiscoveryModelUsage({ job_id: SOURCE_DISCOVERY_EXTRACTION_JOB.job_id });
  assertSourceDiscoveryBoundary({ job_id: SOURCE_DISCOVERY_EXTRACTION_JOB.job_id, output });
  return output;
}
