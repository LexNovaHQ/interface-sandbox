import { buildSourceExtractionArtifactSet } from "../services/source-extraction.service.js";
import { buildPhase1ExtractionUpgradeArtifacts } from "../services/phase1-agnostic-upgrade.service.js";
import { assertSourceDiscoveryBoundary, assertNoSourceDiscoveryModelUsage } from "../validators/source-discovery.validator.js";

export const SOURCE_DISCOVERY_EXTRACTION_JOB = Object.freeze({
  phase_id: "SOURCE_DISCOVERY",
  job_id: "SOURCE_EXTRACTION",
  public_label: "Source Extraction",
  implementation_status: "PHASE_OWNED_IMPLEMENTATION_AGNOSTIC_UPGRADE_V0",
  model_usage: "NONE"
});

export async function buildSourceExtractionArtifacts({ run, deduped_url_manifest } = {}) {
  const output = await buildSourceExtractionArtifactSet({ run, deduped_url_manifest });
  const upgrade = buildPhase1ExtractionUpgradeArtifacts({ run, deduped_url_manifest, output });
  const merged = { ...output, ...upgrade };
  assertNoSourceDiscoveryModelUsage({ job_id: SOURCE_DISCOVERY_EXTRACTION_JOB.job_id });
  assertSourceDiscoveryBoundary({ job_id: SOURCE_DISCOVERY_EXTRACTION_JOB.job_id, output: merged });
  return merged;
}
