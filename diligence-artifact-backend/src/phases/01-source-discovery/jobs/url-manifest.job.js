import { buildSourceUrlManifestArtifact } from "../services/url-manifest.service.js";
import { SOURCE_DISCOVERY_CONTRACT } from "../source-discovery.contract.js";
import { assertSourceDiscoveryBoundary, assertNoSourceDiscoveryModelUsage } from "../validators/source-discovery.validator.js";

export const SOURCE_DISCOVERY_URL_MANIFEST_JOB = Object.freeze({
  phase_id: "SOURCE_DISCOVERY",
  job_id: "URL_MANIFEST",
  public_label: "Source URL Manifest",
  implementation_status: SOURCE_DISCOVERY_CONTRACT.implementation_status,
  model_usage: "NONE"
});

export async function buildSourceUrlManifest({ run, preflight_context } = {}) {
  const output = await buildSourceUrlManifestArtifact({ run, preflightContext: preflight_context });
  assertNoSourceDiscoveryModelUsage({ job_id: SOURCE_DISCOVERY_URL_MANIFEST_JOB.job_id });
  assertSourceDiscoveryBoundary({ job_id: SOURCE_DISCOVERY_URL_MANIFEST_JOB.job_id, output });
  return output;
}
