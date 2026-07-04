import { buildAgent1aDedupedUrlManifest as buildLegacyUrlManifest } from "../../../agent-1-scout-extractor.js";
import { assertSourceDiscoveryBoundary, assertNoSourceDiscoveryModelUsage } from "../validators/source-discovery.validator.js";

export const SOURCE_DISCOVERY_URL_MANIFEST_JOB = Object.freeze({
  phase_id: "SOURCE_DISCOVERY",
  job_id: "URL_MANIFEST",
  public_label: "Source URL Manifest",
  implementation_status: "WRAPS_EXISTING_HELPER",
  model_usage: "NONE"
});

export async function buildSourceUrlManifest({ run } = {}) {
  const output = await buildLegacyUrlManifest({ run });
  assertNoSourceDiscoveryModelUsage({ job_id: SOURCE_DISCOVERY_URL_MANIFEST_JOB.job_id });
  assertSourceDiscoveryBoundary({ job_id: SOURCE_DISCOVERY_URL_MANIFEST_JOB.job_id, output });
  return output;
}
