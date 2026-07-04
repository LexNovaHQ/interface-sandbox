import { SOURCE_DISCOVERY_CONTRACT, getSourceDiscoveryJobContract } from "./source-discovery.contract.js";
import { buildSourceUrlManifest } from "./jobs/url-manifest.job.js";
import { buildSourceExtractionArtifacts } from "./jobs/source-extraction.job.js";
import { buildSourceFamilyHandoff } from "./jobs/source-family-handoff.job.js";

export const SOURCE_DISCOVERY_RUNNER = Object.freeze({
  phase_id: SOURCE_DISCOVERY_CONTRACT.phase_id,
  public_label: SOURCE_DISCOVERY_CONTRACT.public_label,
  implementation_status: "PHASE_OWNED_IMPLEMENTATION",
  production_entrypoint_switched: false,
  old_helper_files_cut_off_from_new_runtime: true,
  old_helper_files: ["agent-1-scout-extractor.js", "m6-bucket-router.js"]
});

export async function runSourceDiscoveryJob({ job_id, run, artifacts = {} } = {}) {
  const job = getSourceDiscoveryJobContract(job_id);
  if (job.job_id === "URL_MANIFEST") {
    const output = await buildSourceUrlManifest({ run });
    return sourceDiscoveryRunResult({ job, output });
  }
  if (job.job_id === "SOURCE_EXTRACTION") {
    const output = await buildSourceExtractionArtifacts({ run, deduped_url_manifest: artifacts.deduped_url_manifest });
    return sourceDiscoveryRunResult({ job, output });
  }
  if (job.job_id === "SOURCE_FAMILY_HANDOFF") {
    const output = buildSourceFamilyHandoff({ run, artifacts });
    return sourceDiscoveryRunResult({ job, output });
  }
  throw new Error(`SOURCE_DISCOVERY_RUNNER_UNHANDLED_JOB:${job.job_id}`);
}

export async function runSourceUrlManifestJob(input) {
  return runSourceDiscoveryJob({ ...input, job_id: "URL_MANIFEST" });
}

export async function runSourceExtractionJob(input) {
  return runSourceDiscoveryJob({ ...input, job_id: "SOURCE_EXTRACTION" });
}

export async function runSourceFamilyHandoffJob(input) {
  return runSourceDiscoveryJob({ ...input, job_id: "SOURCE_FAMILY_HANDOFF" });
}

function sourceDiscoveryRunResult({ job, output }) {
  return {
    ok: true,
    phase_id: SOURCE_DISCOVERY_CONTRACT.phase_id,
    public_label: SOURCE_DISCOVERY_CONTRACT.public_label,
    job_id: job.job_id,
    job_label: job.public_label,
    model_usage: SOURCE_DISCOVERY_CONTRACT.model_usage,
    output
  };
}
