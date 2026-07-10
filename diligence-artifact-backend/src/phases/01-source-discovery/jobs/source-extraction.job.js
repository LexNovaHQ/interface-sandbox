import { buildSourceExtractionArtifactSet } from "../services/source-extraction.service.js";
import { SOURCE_DISCOVERY_CONTRACT } from "../source-discovery.contract.js";
import { assertSourceDiscoveryBoundary, assertNoSourceDiscoveryModelUsage } from "../validators/source-discovery.validator.js";

export const SOURCE_DISCOVERY_EXTRACTION_JOB = Object.freeze({
  phase_id: "SOURCE_DISCOVERY",
  job_id: "SOURCE_EXTRACTION",
  public_label: "Source Extraction",
  implementation_status: SOURCE_DISCOVERY_CONTRACT.implementation_status,
  model_usage: "NONE"
});

export async function buildSourceExtractionArtifacts({ run, deduped_url_manifest } = {}) {
  const output = await buildSourceExtractionArtifactSet({ run, deduped_url_manifest });
  assertNoSourceDiscoveryModelUsage({ job_id: SOURCE_DISCOVERY_EXTRACTION_JOB.job_id });
  assertSourceDiscoveryBoundary({ job_id: SOURCE_DISCOVERY_EXTRACTION_JOB.job_id, output });
  return output;
}
